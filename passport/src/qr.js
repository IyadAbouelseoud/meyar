import QRCode from 'qrcode';

const PBKDF2_ITERATIONS = 600000;
const SALT_BYTES = 16;
const NONCE_BYTES = 12;

export function toBase64Url(bytes) {
  let bin = '';
  for (let i = 0; i < bytes.length; i += 1) {
    bin += String.fromCharCode(bytes[i]);
  }
  return btoa(bin).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/g, '');
}

export function fromBase64Url(str) {
  const padded = str.replace(/-/g, '+').replace(/_/g, '/') + '==='.slice((str.length + 3) % 4);
  const bin = atob(padded);
  const out = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i += 1) {
    out[i] = bin.charCodeAt(i);
  }
  return out;
}

async function runStream(bytes, stream) {
  const writer = stream.writable.getWriter();
  const writePromise = writer.write(bytes).then(() => writer.close());
  const reader = stream.readable.getReader();
  const chunks = [];
  let total = 0;
  for (;;) {
    const { value, done } = await reader.read();
    if (done) break;
    chunks.push(value);
    total += value.length;
  }
  await writePromise;
  const out = new Uint8Array(total);
  let offset = 0;
  for (const chunk of chunks) {
    out.set(chunk, offset);
    offset += chunk.length;
  }
  return out;
}

export async function deflateBytes(bytes) {
  return runStream(bytes, new CompressionStream('deflate-raw'));
}

export async function inflateBytes(bytes) {
  return runStream(bytes, new DecompressionStream('deflate-raw'));
}

/**
 * Build a compact, self-contained payload from a Meyar data contract.
 * Never includes raw genome, patient name, or any URL.
 */
export function buildCompactPayload(contract, getDrugsFn = () => []) {
  const genes = (contract.genes || []).map((g) => {
    const drugs = getDrugsFn(g) || [];
    const rec = drugs
      .filter((d) => d.status === 'stop' || d.status === 'ask')
      .map((d) => ({
        d: d.drug,
        rx: d.rxnorm || undefined,
        s: d.status,
        alts: d.alternatives && d.alternatives.length ? d.alternatives : undefined,
      }));

    const entry = {
      gene: g.gene,
      dip: g.diplotype || null,
      phen: g.phenotype || null,
      call: {
        m: g.callability?.method || 'vcf',
        sv: Boolean(g.callability?.svAssessed),
      },
      cov: {
        a: g.coverage?.definingPositionsAssayed ?? 0,
        t: g.coverage?.definingPositionsTotal ?? 0,
        u: g.coverage?.untestedLocalAlleles || [],
        tier: g.coverage?.saudiDataTier ?? null,
      },
      gv: g.guidelineVersion || '',
    };

    if (g.effectivePhenotype && g.effectivePhenotype !== g.phenotype) {
      entry.eff = g.effectivePhenotype;
    }
    if (g.phenoconversion?.applied) {
      entry.pc = {
        cause: g.phenoconversion.cause || [],
        str: g.phenoconversion.inhibitorStrength || null,
      };
    }
    if (rec.length > 0) {
      entry.rec = rec;
    }
    return entry;
  });

  const payload = {
    v: 1,
    id: contract.patientId,
    o: contract.sampleOrigin,
    g: genes,
  };

  if (Array.isArray(contract.currentMedications) && contract.currentMedications.length > 0) {
    payload.meds = contract.currentMedications.map((m) => ({
      n: m.name,
      src: m.source,
      mock: Boolean(m.mock),
    }));
  }

  return payload;
}

async function deriveAesKey(pin, salt) {
  const subtle = globalThis.crypto?.subtle;
  if (!subtle) {
    throw new Error('WebCrypto subtle API is unavailable');
  }
  const keyMaterial = await subtle.importKey(
    'raw',
    new TextEncoder().encode(String(pin)),
    'PBKDF2',
    false,
    ['deriveKey']
  );
  return subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt,
      iterations: PBKDF2_ITERATIONS,
      hash: 'SHA-256',
    },
    keyMaterial,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt', 'decrypt']
  );
}

/**
 * Encrypt compressed payload bytes into the C8 envelope:
 * { v: 1, s: base64url(salt), n: base64url(nonce), c: base64url(ciphertext) }
 */
export async function encryptEnvelope(compressedBytes, pin) {
  if (!pin || String(pin).length < 4) {
    throw new Error('PIN must be at least 4 characters');
  }
  const salt = globalThis.crypto.getRandomValues(new Uint8Array(SALT_BYTES));
  const nonce = globalThis.crypto.getRandomValues(new Uint8Array(NONCE_BYTES));
  const key = await deriveAesKey(pin, salt);
  const cipherBuf = await globalThis.crypto.subtle.encrypt(
    { name: 'AES-GCM', iv: nonce },
    key,
    compressedBytes
  );
  return {
    v: 1,
    s: toBase64Url(salt),
    n: toBase64Url(nonce),
    c: toBase64Url(new Uint8Array(cipherBuf)),
  };
}

export async function decryptEnvelope(envelope, pin) {
  if (!envelope || envelope.v !== 1 || !envelope.s || !envelope.n || !envelope.c) {
    throw new Error('Invalid encrypted QR envelope');
  }
  const salt = fromBase64Url(envelope.s);
  const nonce = fromBase64Url(envelope.n);
  const cipher = fromBase64Url(envelope.c);
  const key = await deriveAesKey(pin, salt);
  const plainBuf = await globalThis.crypto.subtle.decrypt(
    { name: 'AES-GCM', iv: nonce },
    key,
    cipher
  );
  return new Uint8Array(plainBuf);
}

/**
 * Encode a contract into an offline QR string (C8 encrypted envelope by default;
 * plaintext mode only when plaintext: true under dev flag).
 */
export async function encodeQrEnvelope(contract, { pin = '123456', plaintext = false, getDrugsFn } = {}) {
  const payload = buildCompactPayload(contract, getDrugsFn);
  const rawJson = JSON.stringify(payload);
  const rawBytes = new TextEncoder().encode(rawJson);
  const compressedBytes = await deflateBytes(rawBytes);

  const envelope = plaintext
    ? { v: 0, p: toBase64Url(compressedBytes) }
    : await encryptEnvelope(compressedBytes, pin);

  const qrText = JSON.stringify(envelope);
  const envelopeBytes = new TextEncoder().encode(qrText).length;

  return {
    qrText,
    envelope,
    payload,
    rawBytes: rawBytes.length,
    compressedBytes: compressedBytes.length,
    envelopeBytes,
    encrypted: !plaintext,
    errorCorrectionLevel: 'M',
  };
}

export async function decodeQrEnvelope(qrText, { pin } = {}) {
  const envelope = typeof qrText === 'string' ? JSON.parse(qrText) : qrText;
  let compressedBytes;
  if (envelope.v === 0 && envelope.p) {
    compressedBytes = fromBase64Url(envelope.p);
  } else if (envelope.v === 1) {
    if (!pin) throw new Error('PIN required to decrypt QR');
    compressedBytes = await decryptEnvelope(envelope, pin);
  } else {
    throw new Error('Unsupported QR envelope version');
  }
  const rawBytes = await inflateBytes(compressedBytes);
  return JSON.parse(new TextDecoder().decode(rawBytes));
}

function escAttr(str) {
  return String(str ?? '')
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

/**
 * Render an SVG QR code with Error Correction M, #14201B ink on white,
 * shape-rendering="crispEdges", and a quiet zone of at least 4 modules.
 */
export function renderQrSvg(text, { ariaLabel = 'Meyar offline QR code', quietZone = 4 } = {}) {
  const qz = Math.max(4, quietZone);
  const qr = QRCode.create(text, { errorCorrectionLevel: 'M' });
  const size = qr.modules.size;
  const total = size + qz * 2;
  const parts = [];
  for (let r = 0; r < size; r += 1) {
    for (let c = 0; c < size; c += 1) {
      if (qr.modules.get(r, c)) {
        parts.push(`M${c + qz},${r + qz}h1v1h-1z`);
      }
    }
  }
  return {
    svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${total} ${total}" shape-rendering="crispEdges" role="img" aria-label="${escAttr(ariaLabel)}"><rect width="${total}" height="${total}" fill="#FFFFFF"/><path d="${parts.join('')}" fill="#14201B"/></svg>`,
    modules: size,
    quietZone: qz,
    errorCorrectionLevel: 'M',
  };
}
