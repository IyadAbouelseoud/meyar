import { describe, it, before, after } from 'node:test';
import assert from 'node:assert/strict';
import http from 'node:http';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

import { createCdsServer } from '../server.js';
import { isForbiddenPublicFhir } from '../lib/phenotypes.js';
import { buildCpicCard } from '../lib/cards.js';

function startServer(server) {
  return new Promise((resolve) => {
    server.listen(0, '127.0.0.1', () => {
      const addr = server.address();
      resolve(`http://127.0.0.1:${addr.port}`);
    });
  });
}

function stopServer(server) {
  return new Promise((resolve, reject) => {
    server.close((err) => (err ? reject(err) : resolve()));
  });
}

function makeOrderSignBody({
  patientId = 'demo-001',
  drugCode = '32968',
  drugDisplay = 'Clopidogrel 75 MG Oral Tablet',
  hook = 'order-sign',
  prefetch = undefined,
  selections = undefined,
  reasonText = undefined,
} = {}) {
  const medReq = {
    resourceType: 'MedicationRequest',
    id: 'medrx-1',
    status: 'draft',
    intent: 'order',
    subject: { reference: `Patient/${patientId}` },
    medicationCodeableConcept: {
      coding: drugCode
        ? [
            {
              system: 'http://www.nlm.nih.gov/research/umls/rxnorm',
              code: drugCode,
              display: drugDisplay,
            },
          ]
        : [],
      text: drugDisplay,
    },
  };

  if (reasonText) {
    medReq.reasonCode = [{ text: reasonText }];
  }

  const body = {
    hook,
    hookInstance: '11111111-2222-3333-4444-555555555555',
    context: {
      userId: 'Practitioner/demo-clinician',
      patientId,
      draftOrders: {
        resourceType: 'Bundle',
        type: 'collection',
        entry: [{ resource: medReq }],
      },
      ...(selections ? { selections } : {}),
    },
  };

  if (prefetch) body.prefetch = prefetch;
  return body;
}

function makeGenomicsObservation({
  patientId = 'demo-001',
  gene = 'CYP2C19',
  diplotype = '*2/*2',
  phenotype = 'Poor Metabolizer',
  sourceCode = 'LA6683-2',
  sourceDisplay = 'Germline',
  sourceText = 'germline',
  guidelineVersion = 'CPIC 2022-11',
  candidates = null,
} = {}) {
  const obs = {
    resourceType: 'Observation',
    id: `${patientId}-${gene.toLowerCase()}`,
    status: 'final',
    code: {
      coding: [{ system: 'http://loinc.org', code: '84413-4', display: 'Genotype display name' }],
      text: `${gene} genotype and phenotype`,
    },
    subject: { reference: `Patient/${patientId}` },
    valueCodeableConcept: { text: diplotype },
    component: [
      {
        code: { coding: [{ system: 'http://loinc.org', code: '48018-6', display: 'Gene studied [ID]' }] },
        valueCodeableConcept: { text: gene },
      },
      {
        code: { coding: [{ system: 'http://loinc.org', code: '48002-0', display: 'Genomic source class [Type]' }] },
        valueCodeableConcept: {
          coding: [{ system: 'http://loinc.org', code: sourceCode, display: sourceDisplay }],
          text: sourceText,
        },
      },
      {
        code: {
          coding: [
            {
              system: 'http://loinc.org',
              code: '53037-8',
              display: 'Genetic variation clinical significance [Imp]',
            },
          ],
          text: 'Metabolizer phenotype',
        },
        valueCodeableConcept: { text: phenotype },
      },
      {
        code: { text: 'Guideline version' },
        valueString: guidelineVersion,
      },
    ],
  };

  if (Array.isArray(candidates) && candidates.length > 1) {
    obs.note = [{ text: `Candidate diplotypes: ${candidates.join(', ')}` }];
  }
  return obs;
}

describe('Meyar CDS Hooks 2.0.1 service (B2)', () => {
  let cdsServer;
  let cdsBaseUrl;
  let tmpContractsDir;

  before(async () => {
    tmpContractsDir = fs.mkdtempSync(path.join(os.tmpdir(), 'meyar-cds-test-'));

    // Write a synthetic somatic contract for A6 guard testing.
    fs.writeFileSync(
      path.join(tmpContractsDir, 'somatic-001.contract.json'),
      JSON.stringify({
        patientId: 'somatic-001',
        sampleOrigin: 'somatic',
        genes: [
          {
            gene: 'CYP2C19',
            diplotype: '*2/*2',
            phenotype: 'Poor Metabolizer',
            candidates: ['*2/*2'],
            coverage: {
              definingPositionsAssayed: 0,
              definingPositionsTotal: 0,
              untestedLocalAlleles: [],
              uninformativeNormalRisk: null,
            },
            guidelineVersion: 'CPIC 2022-11',
          },
        ],
      })
    );

    // Write a multi-candidate contract to prove candidates are preserved, never re-picked.
    fs.writeFileSync(
      path.join(tmpContractsDir, 'ambig-001.contract.json'),
      JSON.stringify({
        patientId: 'ambig-001',
        sampleOrigin: 'germline',
        genes: [
          {
            gene: 'CYP2C19',
            diplotype: '*1/*2',
            phenotype: 'Intermediate Metabolizer',
            candidates: ['*1/*2', '*38/*2'],
            coverage: {
              definingPositionsAssayed: 32,
              definingPositionsTotal: 35,
              untestedLocalAlleles: ['*3'],
              uninformativeNormalRisk: 0.001,
            },
            guidelineVersion: 'CPIC 2022-11',
          },
        ],
      })
    );

    // CYP2C9 Poor Metabolizer (dose-reduction row) and a CYP2C19 "No Result" gene.
    fs.writeFileSync(
      path.join(tmpContractsDir, 'cyp2c9pm-001.contract.json'),
      JSON.stringify({
        patientId: 'cyp2c9pm-001',
        sampleOrigin: 'germline',
        genes: [
          {
            gene: 'CYP2C9',
            diplotype: '*3/*3',
            phenotype: 'Poor Metabolizer',
            candidates: ['*3/*3'],
            coverage: {
              definingPositionsAssayed: 0,
              definingPositionsTotal: 0,
              untestedLocalAlleles: [],
              uninformativeNormalRisk: null,
            },
            guidelineVersion: 'CPIC PharmCAT 3.4.0',
          },
          {
            gene: 'CYP2C19',
            diplotype: 'Unknown/Unknown',
            phenotype: 'No Result',
            candidates: ['Unknown/Unknown'],
            coverage: {
              definingPositionsAssayed: 0,
              definingPositionsTotal: 0,
              untestedLocalAlleles: [],
              uninformativeNormalRisk: null,
            },
            guidelineVersion: 'CPIC PharmCAT 3.4.0',
          },
        ],
      })
    );

    // Synthetic SLCO1B1 Decreased Function contract for B3 backward-sweep testing.
    fs.writeFileSync(
      path.join(tmpContractsDir, 'statin-001.contract.json'),
      JSON.stringify({
        patientId: 'statin-001',
        sampleOrigin: 'germline',
        genes: [
          {
            gene: 'SLCO1B1',
            diplotype: '*1/*5',
            phenotype: 'Decreased Function',
            candidates: ['*1/*5'],
            coverage: {
              definingPositionsAssayed: 0,
              definingPositionsTotal: 0,
              untestedLocalAlleles: [],
              uninformativeNormalRisk: null,
              saudiDataTier: 2,
              saudiDataNote: 'Tier 2: No published Saudi frequency for this gene.',
            },
            guidelineVersion: 'CPIC 2022-02',
          },
        ],
      })
    );

    // Point FHIR_BASE to a closed local port to exercise contract fallback deterministically.
    cdsServer = createCdsServer({
      fhirBase: 'http://127.0.0.1:1',
      fhirTimeoutMs: 150,
      contractsDir: tmpContractsDir,
      alertsLogPath: path.join(tmpContractsDir, 'alerts.jsonl'),
    });
    cdsBaseUrl = await startServer(cdsServer);
  });

  after(async () => {
    await stopServer(cdsServer);
    fs.rmSync(tmpContractsDir, { recursive: true, force: true });
  });

  it('GET /cds-services returns valid CDS Hooks 2.0.1 discovery JSON with CORS', async () => {
    const resp = await fetch(`${cdsBaseUrl}/cds-services`);
    assert.equal(resp.status, 200);
    assert.equal(resp.headers.get('access-control-allow-origin'), '*');
    assert.match(resp.headers.get('content-type') || '', /application\/json/);

    const data = await resp.json();
    assert.ok(Array.isArray(data.services));
    assert.ok(data.services.length >= 1);

    const orderSign = data.services.find((s) => s.id === 'meyar-pgx');
    assert.ok(orderSign, 'meyar-pgx service must be advertised');
    assert.equal(orderSign.hook, 'order-sign');
    assert.ok(orderSign.prefetch?.pgxObservations);

    for (const svc of data.services) {
      assert.notEqual(svc.hook, 'medication-prescribe', 'deprecated hook must never be advertised');
    }
  });

  it('OPTIONS preflight returns 204 with CORS headers for CDS Hooks sandbox', async () => {
    const resp = await fetch(`${cdsBaseUrl}/cds-services/meyar-pgx`, { method: 'OPTIONS' });
    assert.equal(resp.status, 204);
    assert.equal(resp.headers.get('access-control-allow-origin'), '*');
    assert.match(resp.headers.get('access-control-allow-methods') || '', /POST/);
  });

  it('POST /cds-services/meyar-pgx for demo-001 clopidogrel returns CYP2C19 Poor Metabolizer card in < 1 s', async () => {
    const t0 = performance.now();
    const resp = await fetch(`${cdsBaseUrl}/cds-services/meyar-pgx`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(makeOrderSignBody({ patientId: 'demo-001' })),
    });
    const elapsedMs = performance.now() - t0;

    assert.equal(resp.status, 200);
    assert.ok(elapsedMs < 1000, `Expected < 1000ms, got ${elapsedMs.toFixed(1)}ms`);

    const data = await resp.json();
    assert.equal(data.cards.length, 1);

    const card = data.cards[0];
    assert.ok(card.uuid);
    assert.ok(card.summary.length < 140, `Summary too long: ${card.summary.length}`);
    assert.match(card.summary, /CYP2C19/i);
    assert.match(card.summary, /Poor Metabolizer/i);
    assert.equal(card.indicator, 'warning');
    assert.equal(card.source.label, 'Meyar (research prototype)');

    // Verbatim CPIC recommendation from tables/cpic_recommendations.json
    assert.match(
      card.detail,
      /Avoid clopidogrel if possible\. Use prasugrel or ticagrelor at standard dose if no contraindication\./
    );
    // A5 coverage line from demo-001 fixture
    assert.match(card.detail, /Assay covered 9 of 11 defining positions; did not test \*35\./);
    assert.match(card.detail, /Advises, does not prescribe\./);

    // CPIC guideline link and table-sourced alternatives only
    assert.equal(card.links[0].url, 'https://www.clinpgx.org/guideline/PA166251443');
    // No indication on the order: the ACS/PCI row is shown as ASSUMED, the other
    // indications' rows are listed, and only alternatives valid under every
    // indication are offered (prasugrel is contraindicated after stroke/TIA).
    assert.match(card.detail, /CVI ACS PCI \(Strong\) — assumed; the order states no indication/);
    assert.match(card.detail, /- NVI \(Moderate\): Avoid clopidogrel if possible\./);
    const labels = (card.suggestions || []).map((s) => s.label);
    assert.deepEqual(labels, [
      "Better matched for this patient's genes: ticagrelor",
      'Send to pharmacist',
    ]);
    // CDS Hooks 2.0: selectionBehavior MUST be present when suggestions are.
    assert.equal(card.selectionBehavior, 'at-most-one');
    assert.equal(card.suggestions[0].actions[0].resource.subject.reference, 'Patient/demo-001');
    assert.match(card.detail, /_Demo data · Advises, does not prescribe\./);
  });

  it('clopidogrel ACS/PCI indication offers prasugrel and ticagrelor', async () => {
    const resp = await fetch(`${cdsBaseUrl}/cds-services/meyar-pgx`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(
        makeOrderSignBody({ patientId: 'demo-001', reasonText: 'NSTEMI, PCI with drug-eluting stent' })
      ),
    });
    const card = (await resp.json()).cards[0];
    assert.match(card.detail, /\*\*CPIC indication:\*\* CVI ACS PCI \(Strong\)\n?/);
    assert.doesNotMatch(card.detail, /assumed/);
    const labels = card.suggestions.map((s) => s.label);
    assert.ok(labels.some((l) => /prasugrel/.test(l)));
    assert.ok(labels.some((l) => /ticagrelor/.test(l)));
  });

  it('clopidogrel for stroke uses the NVI row and never offers prasugrel', async () => {
    const resp = await fetch(`${cdsBaseUrl}/cds-services/meyar-pgx`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(
        makeOrderSignBody({ patientId: 'demo-001', reasonText: 'Acute ischemic stroke' })
      ),
    });
    const card = (await resp.json()).cards[0];
    assert.match(card.detail, /\*\*CPIC indication:\*\* NVI \(Moderate\)/);
    const labels = card.suggestions.map((s) => s.label);
    assert.ok(!labels.some((l) => /prasugrel/.test(l)), 'prasugrel must not be suggested after stroke');
    assert.ok(labels.some((l) => /ticagrelor/.test(l)));
  });

  it('"ischemic heart disease" is cardiovascular, not neurovascular', async () => {
    const resp = await fetch(`${cdsBaseUrl}/cds-services/meyar-pgx`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(
        makeOrderSignBody({ patientId: 'demo-001', reasonText: 'Ischemic heart disease, PCI' })
      ),
    });
    const card = (await resp.json()).cards[0];
    assert.match(card.detail, /\*\*CPIC indication:\*\* CVI ACS PCI/);
    assert.doesNotMatch(card.detail, /\*\*CPIC indication:\*\* NVI/);
  });

  it('matches clinical drug display text even when RxNorm code is clinical-drug level', async () => {
    const resp = await fetch(`${cdsBaseUrl}/cds-services/meyar-pgx`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(
        makeOrderSignBody({
          patientId: 'demo-001',
          drugCode: '309362',
          drugDisplay: 'Clopidogrel 75 MG Oral Tablet',
        })
      ),
    });
    assert.equal(resp.status, 200);
    const data = await resp.json();
    assert.equal(data.cards.length, 1);
    assert.match(data.cards[0].summary, /CYP2C19 Poor Metabolizer/);
  });

  it('uses prefetch.pgxObservations first when provided', async () => {
    const prefetchBundle = {
      resourceType: 'Bundle',
      type: 'searchset',
      entry: [
        {
          resource: makeGenomicsObservation({
            patientId: 'prefetch-patient',
            gene: 'CYP2C19',
            diplotype: '*2/*2',
            phenotype: 'Poor Metabolizer',
          }),
        },
      ],
    };

    const resp = await fetch(`${cdsBaseUrl}/cds-services/meyar-pgx`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(
        makeOrderSignBody({
          patientId: 'prefetch-patient',
          prefetch: { pgxObservations: prefetchBundle },
        })
      ),
    });

    assert.equal(resp.status, 200);
    assert.equal(resp.headers.get('x-meyar-phenotype-source'), 'prefetch');
    const data = await resp.json();
    assert.equal(data.cards.length, 1);
    assert.match(data.cards[0].summary, /CYP2C19 Poor Metabolizer/);
  });

  it('reads phenotypes from local HAPI FHIR server when reachable', async () => {
    const mockHapi = http.createServer((req, res) => {
      if (req.url?.startsWith('/fhir/Observation')) {
        res.writeHead(200, { 'Content-Type': 'application/fhir+json' });
        res.end(
          JSON.stringify({
            resourceType: 'Bundle',
            type: 'searchset',
            entry: [
              {
                resource: makeGenomicsObservation({
                  patientId: 'demo-001',
                  gene: 'CYP2C19',
                  diplotype: '*2/*2',
                  phenotype: 'Poor Metabolizer',
                  guidelineVersion: 'CPIC 2022-11',
                }),
              },
            ],
          })
        );
        return;
      }
      res.writeHead(404);
      res.end();
    });

    const hapiUrl = await startServer(mockHapi);
    const hapiCds = createCdsServer({
      fhirBase: `${hapiUrl}/fhir`,
      contractsDir: tmpContractsDir,
      alertsLogPath: path.join(tmpContractsDir, 'alerts.jsonl'),
    });
    const hapiCdsUrl = await startServer(hapiCds);

    try {
      const resp = await fetch(`${hapiCdsUrl}/cds-services/meyar-pgx`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(makeOrderSignBody({ patientId: 'demo-001' })),
      });
      assert.equal(resp.status, 200);
      assert.equal(resp.headers.get('x-meyar-phenotype-source'), 'hapi');
      const data = await resp.json();
      assert.equal(data.cards.length, 1);
      assert.match(data.cards[0].summary, /CYP2C19 Poor Metabolizer/);
      // Merged A5 coverage metadata from fixture
      assert.match(data.cards[0].detail, /Assay covered 9 of 11 defining positions/);
    } finally {
      await stopServer(hapiCds);
      await stopServer(mockHapi);
    }
  });

  it('A7 phenoconversion: demo-002 codeine shows both genetic Normal and acting-like Poor because of paroxetine', async () => {
    const resp = await fetch(`${cdsBaseUrl}/cds-services/meyar-pgx`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(
        makeOrderSignBody({
          patientId: 'demo-002',
          drugCode: '2670',
          drugDisplay: 'codeine',
        })
      ),
    });

    assert.equal(resp.status, 200);
    const data = await resp.json();
    assert.equal(data.cards.length, 1);
    const card = data.cards[0];
    assert.equal(card.indicator, 'warning');
    assert.match(card.detail, /\*\*Genetic:\*\* CYP2D6 \*1\/\*1 \(Normal Metabolizer\)/);
    assert.match(card.detail, /\*\*Acting like:\*\* Poor Metabolizer because of paroxetine/);
    assert.match(card.detail, /Avoid codeine use because of possibility of diminished analgesia/);
  });

  it('A8 structural-variation gate: demo-001 CYP2D6 not-assessed never returns Normal Metabolizer', async () => {
    const resp = await fetch(`${cdsBaseUrl}/cds-services/meyar-pgx`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(
        makeOrderSignBody({
          patientId: 'demo-001',
          drugCode: '2670',
          drugDisplay: 'codeine',
        })
      ),
    });

    assert.equal(resp.status, 200);
    const data = await resp.json();
    assert.equal(data.cards.length, 1);
    const card = data.cards[0];
    assert.equal(card.indicator, 'info');
    assert.match(card.summary, /CYP2D6: copy number not assessed by this test — no result reported/);
    assert.doesNotMatch(card.summary, /Normal Metabolizer/i);
  });

  it('A6 germline guard: rejects somatic contract and somatic FHIR Observation with 422', async () => {
    const contractResp = await fetch(`${cdsBaseUrl}/cds-services/meyar-pgx`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(makeOrderSignBody({ patientId: 'somatic-001' })),
    });
    assert.equal(contractResp.status, 422);

    const prefetchResp = await fetch(`${cdsBaseUrl}/cds-services/meyar-pgx`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(
        makeOrderSignBody({
          patientId: 'somatic-fhir',
          prefetch: {
            pgxObservations: {
              resourceType: 'Bundle',
              type: 'searchset',
              entry: [
                {
                  resource: makeGenomicsObservation({
                    patientId: 'somatic-fhir',
                    sourceCode: 'LA6684-0',
                    sourceDisplay: 'Somatic',
                    sourceText: 'somatic',
                  }),
                },
              ],
            },
          },
        })
      ),
    });
    assert.equal(prefetchResp.status, 422);
  });

  it('shows all candidate diplotypes when ambiguous (never re-picks from frequency)', async () => {
    const resp = await fetch(`${cdsBaseUrl}/cds-services/meyar-pgx`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(makeOrderSignBody({ patientId: 'ambig-001' })),
    });
    assert.equal(resp.status, 200);
    const data = await resp.json();
    assert.equal(data.cards.length, 1);
    assert.match(data.cards[0].detail, /Candidate diplotypes: \*1\/\*2, \*38\/\*2/);
  });

  it('rejects deprecated medication-prescribe hook with 400', async () => {
    const resp = await fetch(`${cdsBaseUrl}/cds-services/meyar-pgx`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(makeOrderSignBody({ hook: 'medication-prescribe' })),
    });
    assert.equal(resp.status, 400);
  });

  it('order-select service filters by context.selections', async () => {
    const body = makeOrderSignBody({
      patientId: 'demo-001',
      hook: 'order-select',
      selections: ['MedicationRequest/other-order'],
    });
    const resp = await fetch(`${cdsBaseUrl}/cds-services/meyar-pgx-select`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    assert.equal(resp.status, 200);
    const data = await resp.json();
    assert.equal(data.cards.length, 0);
  });

  it('forbids public hapi.fhir.org server URLs', () => {
    assert.equal(isForbiddenPublicFhir('https://hapi.fhir.org/baseR4'), true);
    assert.equal(isForbiddenPublicFhir('http://hapi:8080/fhir'), false);
    assert.equal(isForbiddenPublicFhir('http://localhost:8080/fhir'), false);
  });

  it('serves /design/* read-only and blocks path traversal', async () => {
    const okResp = await fetch(`${cdsBaseUrl}/design/tokens.css`);
    assert.equal(okResp.status, 200);
    assert.match(okResp.headers.get('content-type') || '', /text\/css/);

    const badResp = await fetch(`${cdsBaseUrl}/design/..%2FAGENTS.md`);
    assert.equal(badResp.status, 403);
  });

  it('a malformed percent-encoding returns 400 and does not crash the server', async () => {
    const bad = await fetch(`${cdsBaseUrl}/design/%E0%A4%A`);
    assert.equal(bad.status, 400);
    const after = await fetch(`${cdsBaseUrl}/health`);
    assert.equal(after.status, 200);
  });

  it('A7: demo-006 codeine shows Ultrarapid acting like Normal and the genetic Ultrarapid row', async () => {
    const resp = await fetch(`${cdsBaseUrl}/cds-services/meyar-pgx`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(
        makeOrderSignBody({ patientId: 'demo-006', drugCode: '2670', drugDisplay: 'codeine' })
      ),
    });
    const card = (await resp.json()).cards[0];
    assert.match(card.summary, /CYP2D6 Ultrarapid Metabolizer, acting like Normal Metabolizer \(duloxetine\)/);
    assert.match(card.detail, /\*\*Acting like:\*\* Normal Metabolizer because of duloxetine/);
    // The genetic UM risk is never hidden by the phenoconverted normal result.
    assert.match(card.detail, /applies if duloxetine is stopped:\*\*\n\n> Avoid codeine use because of potential for serious toxicity/);
    assert.equal(card.indicator, 'warning');
    assert.match(card.detail, /result from outside call: Mock CNV-aware caller/);
  });

  it('indicator comes from the table: CYP2C9 Poor Metabolizer celecoxib is a warning', async () => {
    const resp = await fetch(`${cdsBaseUrl}/cds-services/meyar-pgx`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(
        makeOrderSignBody({ patientId: 'cyp2c9pm-001', drugCode: '140587', drugDisplay: 'celecoxib 200 mg' })
      ),
    });
    const card = (await resp.json()).cards[0];
    assert.equal(card.indicator, 'warning');
    assert.match(card.detail, /Initiate therapy with 25-50% of the lowest recommended starting dose/);
    assert.equal(card.selectionBehavior, 'at-most-one');
  });

  it('a drug-class alternative is text only, never an orderable create action', async () => {
    const resp = await fetch(`${cdsBaseUrl}/cds-services/meyar-pgx`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(
        makeOrderSignBody({ patientId: 'demo-002', drugCode: '2670', drugDisplay: 'codeine' })
      ),
    });
    const card = (await resp.json()).cards[0];
    const hasMedicationCreate = (card.suggestions || []).some((s) =>
      (s.actions || []).some((a) => a.resource?.resourceType === 'MedicationRequest')
    );
    assert.equal(hasMedicationCreate, false);
    assert.ok(card.suggestions.some((s) => s.label === 'Send to pharmacist'));
    assert.equal(card.selectionBehavior, 'at-most-one');
    assert.match(card.detail, /\*\*Better matched for this patient's genes:\*\* non-tramadol opioid/);
  });

  it('a gene with "No Result" gets an explicit not-checked card, never silence', async () => {
    const resp = await fetch(`${cdsBaseUrl}/cds-services/meyar-pgx`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(makeOrderSignBody({ patientId: 'cyp2c9pm-001' })),
    });
    const card = (await resp.json()).cards[0];
    assert.equal(card.indicator, 'info');
    assert.match(card.summary, /^CYP2C19: no result from this test/);
    assert.match(card.detail, /This is not a normal result\./);
  });

  it('a coding without the RxNorm system is not treated as an RxCUI', async () => {
    const body = makeOrderSignBody({ patientId: 'demo-001', drugDisplay: 'Local formulary item' });
    body.context.draftOrders.entry[0].resource.medicationCodeableConcept.coding = [
      { code: '32968', display: 'Local formulary item' },
    ];
    const resp = await fetch(`${cdsBaseUrl}/cds-services/meyar-pgx`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    assert.equal((await resp.json()).cards.length, 0);
  });

  it('a combination product checks every table drug it names', async () => {
    const resp = await fetch(`${cdsBaseUrl}/cds-services/meyar-pgx`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(
        makeOrderSignBody({ patientId: 'demo-001', drugCode: null, drugDisplay: 'clopidogrel and omeprazole pack' })
      ),
    });
    const summaries = (await resp.json()).cards.map((c) => c.summary);
    assert.ok(summaries.some((s) => /clopidogrel/.test(s)));
    assert.ok(summaries.some((s) => /omeprazole/.test(s)));
  });

  it('discovery prefetch is code-filtered to genotype Observations and includes currentMedications', async () => {
    const data = await (await fetch(`${cdsBaseUrl}/cds-services`)).json();
    for (const svc of data.services) {
      assert.deepEqual(Object.keys(svc.prefetch), ['pgxObservations', 'currentMedications']);
      assert.match(svc.prefetch.pgxObservations, /code=http:\/\/loinc\.org%7C84413-4/);
    }
  });

  it('oversized request bodies get a clean 413', async () => {
    const resp = await fetch(`${cdsBaseUrl}/cds-services/meyar-pgx`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: 'x'.repeat(2 * 1024 * 1024 + 10),
    });
    assert.equal(resp.status, 413);
  });

  it('B3: includes one-tap Send to pharmacist Task suggestion and §7 detail grammar', async () => {
    const resp = await fetch(`${cdsBaseUrl}/cds-services/meyar-pgx`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(makeOrderSignBody({ patientId: 'demo-001' })),
    });
    assert.equal(resp.status, 200);
    const data = await resp.json();
    assert.equal(data.cards.length, 1);
    const card = data.cards[0];

    assert.ok(card.summary.length < 140);
    assert.equal(card.indicator, 'warning');
    assert.equal(card.source.label, 'Meyar (research prototype)');
    assert.match(card.detail, /\*\*Genetic:\*\* CYP2C19 \*2\/\*2 \(Poor Metabolizer\)/);
    assert.match(card.detail, /> Avoid clopidogrel if possible\./);
    assert.match(card.detail, /Assay covered 9 of 11 defining positions; did not test \*35\./);
    assert.match(card.detail, /Advises, does not prescribe\. CPIC 2022-11/);

    const pharmSuggestion = (card.suggestions || []).find(
      (s) => s.label === 'Send to pharmacist'
    );
    assert.ok(pharmSuggestion, 'Send to pharmacist suggestion must be present');
    assert.equal(pharmSuggestion.actions[0].type, 'create');
    assert.equal(pharmSuggestion.actions[0].resource.resourceType, 'Task');
    assert.equal(pharmSuggestion.actions[0].resource.status, 'requested');
    assert.equal(card.selectionBehavior, 'at-most-one');
  });

  it('B3: oncology drug card prints "Germline result — tumour profiling is separate."', () => {
    const row = {
      drug: 'fluorouracil',
      gene: 'DPYD',
      phenotype: 'Intermediate Metabolizer',
      implication: 'Decreased dihydropyrimidine dehydrogenase activity',
      recommendation: 'Reduce starting dose by 50% followed by titration based on toxicity.',
      classification: 'Strong',
      population: 'general',
      alternatives: [],
      guideline: {
        name: 'DPYD and Fluoropyrimidines',
        pub: 'Amstutz U et al., Clin Pharmacol Ther 2018',
        url: 'https://www.clinpgx.org/guideline/PA166109594',
      },
    };
    const card = buildCpicCard({
      geneRecord: {
        gene: 'DPYD',
        diplotype: '*1/*2A',
        phenotype: 'Intermediate Metabolizer',
        candidates: ['*1/*2A'],
        coverage: {
          definingPositionsAssayed: 4,
          definingPositionsTotal: 4,
          untestedLocalAlleles: [],
          uninformativeNormalRisk: 0,
        },
        guidelineVersion: 'CPIC 2017-10',
      },
      match: {
        row,
        indicationInferred: true,
        otherPopulationRows: [],
        normalRecommendation: 'Initiate therapy with recommended starting dose.',
      },
      drugDisplay: 'Fluorouracil 500 MG',
    });

    assert.equal(card.indicator, 'warning');
    assert.match(card.detail, /Germline result — tumour profiling is separate\./);
    assert.match(card.detail, /Advises, does not prescribe\. CPIC 2017-10/);
    assert.ok(card.suggestions.some((s) => s.label === 'Send to pharmacist'));
  });

  it('B3: backward sweep on first order-sign returns card for SLCO1B1 Decreased Function on simvastatin, once per patient', async () => {
    const currentMedsBundle = {
      resourceType: 'Bundle',
      type: 'searchset',
      entry: [
        {
          resource: {
            resourceType: 'MedicationStatement',
            id: 'stmt-simva-1',
            status: 'active',
            subject: { reference: 'Patient/statin-001' },
            medicationCodeableConcept: {
              coding: [
                {
                  system: 'http://www.nlm.nih.gov/research/umls/rxnorm',
                  code: '36567',
                  display: 'Simvastatin 40 MG Oral Tablet',
                },
              ],
              text: 'Simvastatin 40 MG Oral Tablet',
            },
          },
        },
      ],
    };

    // First order-sign: ordering an unrelated drug (metformin) triggers backward sweep on simvastatin.
    const firstResp = await fetch(`${cdsBaseUrl}/cds-services/meyar-pgx`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(
        makeOrderSignBody({
          patientId: 'statin-001',
          drugCode: '6809',
          drugDisplay: 'Metformin 500 MG Oral Tablet',
          prefetch: { currentMedications: currentMedsBundle },
        })
      ),
    });

    assert.equal(firstResp.status, 200);
    assert.equal(firstResp.headers.get('x-meyar-backward-sweep'), 'true');
    const firstData = await firstResp.json();
    assert.equal(firstData.cards.length, 1);

    const card = firstData.cards[0];
    assert.ok(card.summary.length < 140);
    assert.equal(card.indicator, 'warning');
    assert.match(card.summary, /Backward sweep/i);
    assert.match(card.summary, /SLCO1B1/i);
    assert.match(card.summary, /simvastatin/i);
    assert.match(card.detail, /\*\*Existing medication \(backward sweep\):\*\* Simvastatin 40 MG Oral Tablet/);
    assert.match(card.detail, /\*\*Genetic:\*\* SLCO1B1 \*1\/\*5 \(Decreased Function\)/);
    assert.match(card.detail, /Advises, does not prescribe\. CPIC 2022-02/);
    assert.ok(card.suggestions.some((s) => s.label === 'Send to pharmacist'));

    // Second order-sign for same patient: backward sweep does not repeat.
    const secondResp = await fetch(`${cdsBaseUrl}/cds-services/meyar-pgx`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(
        makeOrderSignBody({
          patientId: 'statin-001',
          drugCode: '6809',
          drugDisplay: 'Metformin 500 MG Oral Tablet',
          prefetch: { currentMedications: currentMedsBundle },
        })
      ),
    });

    assert.equal(secondResp.status, 200);
    assert.equal(secondResp.headers.get('x-meyar-backward-sweep'), 'false');
    const secondData = await secondResp.json();
    assert.equal(secondData.cards.length, 0);
  });

  it('B3: backward sweep fetches active MedicationStatements from local HAPI FHIR', async () => {
    const mockHapi = http.createServer((req, res) => {
      if (req.url?.startsWith('/fhir/Observation')) {
        res.writeHead(200, { 'Content-Type': 'application/fhir+json' });
        res.end(
          JSON.stringify({
            resourceType: 'Bundle',
            type: 'searchset',
            entry: [
              {
                resource: makeGenomicsObservation({
                  patientId: 'hapi-statin-001',
                  gene: 'SLCO1B1',
                  diplotype: '*1/*5',
                  phenotype: 'Decreased Function',
                  guidelineVersion: 'CPIC 2022-02',
                }),
              },
            ],
          })
        );
        return;
      }
      if (req.url?.startsWith('/fhir/MedicationStatement')) {
        res.writeHead(200, { 'Content-Type': 'application/fhir+json' });
        res.end(
          JSON.stringify({
            resourceType: 'Bundle',
            type: 'searchset',
            entry: [
              {
                resource: {
                  resourceType: 'MedicationStatement',
                  id: 'stmt-atorva-1',
                  status: 'active',
                  subject: { reference: 'Patient/hapi-statin-001' },
                  medicationCodeableConcept: {
                    coding: [
                      {
                        system: 'http://www.nlm.nih.gov/research/umls/rxnorm',
                        code: '83367',
                        display: 'Atorvastatin 40 MG Oral Tablet',
                      },
                    ],
                    text: 'Atorvastatin 40 MG Oral Tablet',
                  },
                },
              },
            ],
          })
        );
        return;
      }
      res.writeHead(404);
      res.end();
    });

    const hapiUrl = await startServer(mockHapi);
    const hapiCds = createCdsServer({
      fhirBase: `${hapiUrl}/fhir`,
      contractsDir: tmpContractsDir,
      alertsLogPath: path.join(tmpContractsDir, 'alerts.jsonl'),
    });
    const hapiCdsUrl = await startServer(hapiCds);

    try {
      const resp = await fetch(`${hapiCdsUrl}/cds-services/meyar-pgx`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(
          makeOrderSignBody({
            patientId: 'hapi-statin-001',
            drugCode: '6809',
            drugDisplay: 'Metformin 500 MG Oral Tablet',
          })
        ),
      });
      assert.equal(resp.status, 200);
      assert.equal(resp.headers.get('x-meyar-backward-sweep'), 'true');
      const data = await resp.json();
      assert.equal(data.cards.length, 1);
      assert.match(data.cards[0].summary, /Backward sweep/i);
      assert.match(data.cards[0].summary, /SLCO1B1/i);
      assert.match(data.cards[0].summary, /atorvastatin/i);
    } finally {
      await stopServer(hapiCds);
      await stopServer(mockHapi);
    }
  });
});

describe('Meyar alert log and counts dashboard (B4)', () => {
  let tmpDir;
  let logPath;
  let server;
  let baseUrl;

  before(async () => {
    tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'meyar-b4-test-'));
    logPath = path.join(tmpDir, 'alerts.jsonl');
    server = createCdsServer({
      fhirBase: 'http://127.0.0.1:1',
      fhirTimeoutMs: 100,
      contractsDir: tmpDir,
      alertsLogPath: logPath,
    });
    baseUrl = await startServer(server);
  });

  after(async () => {
    await stopServer(server);
    fs.rmSync(tmpDir, { recursive: true, force: true });
  });

  it('firing three hooks writes three log lines to alerts.jsonl and /dashboard shows them', async () => {
    // 1. demo-001 clopidogrel (CYP2C19 Poor Metabolizer)
    const r1 = await fetch(`${baseUrl}/cds-services/meyar-pgx`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(
        makeOrderSignBody({
          patientId: 'demo-001',
          drugCode: '32968',
          drugDisplay: 'Clopidogrel 75 MG Oral Tablet',
          reasonText: 'Acute coronary syndrome',
        })
      ),
    });
    assert.equal(r1.status, 200);
    const d1 = await r1.json();
    assert.equal(d1.cards.length, 1);

    // 2. demo-002 codeine (CYP2D6 phenoconversion Normal -> Poor because of paroxetine)
    const r2 = await fetch(`${baseUrl}/cds-services/meyar-pgx`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(
        makeOrderSignBody({
          patientId: 'demo-002',
          drugCode: '2670',
          drugDisplay: 'Codeine 30 MG Oral Tablet',
        })
      ),
    });
    assert.equal(r2.status, 200);
    const d2 = await r2.json();
    assert.equal(d2.cards.length, 1);

    // 3. demo-006 codeine (CYP2D6 phenoconversion Ultrarapid -> Normal because of duloxetine)
    const r3 = await fetch(`${baseUrl}/cds-services/meyar-pgx`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(
        makeOrderSignBody({
          patientId: 'demo-006',
          drugCode: '2670',
          drugDisplay: 'Codeine 30 MG Oral Tablet',
        })
      ),
    });
    assert.equal(r3.status, 200);
    const d3 = await r3.json();
    assert.equal(d3.cards.length, 1);

    // Verify 3 JSONL lines written
    const lines = fs
      .readFileSync(logPath, 'utf8')
      .trim()
      .split(/\r?\n/)
      .map((l) => JSON.parse(l));
    assert.equal(lines.length, 3);
    for (const line of lines) {
      assert.ok(line.time);
      assert.ok(line.patientPseudonym);
      assert.ok(line.drug);
      assert.ok(line.gene);
      assert.ok(line.phenotype);
      assert.ok(line.cardId);
      assert.equal(line.action, 'fired');
      assert.equal(line.mock, true);
    }

    // Record prescriber responses via POST /alerts/action
    const a1 = await fetch(`${baseUrl}/alerts/action`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        cardId: d1.cards[0].uuid,
        patientPseudonym: 'demo-001',
        drug: 'clopidogrel',
        gene: 'CYP2C19',
        phenotype: 'Poor Metabolizer',
        action: 'accepted',
      }),
    });
    assert.equal(a1.status, 201);

    const a2 = await fetch(`${baseUrl}/alerts/action`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        cardId: d2.cards[0].uuid,
        patientPseudonym: 'demo-002',
        drug: 'codeine',
        gene: 'CYP2D6',
        phenotype: 'Poor Metabolizer',
        action: 'pharmacist',
      }),
    });
    assert.equal(a2.status, 201);

    const bad = await fetch(`${baseUrl}/alerts/action`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ cardId: 'x', action: 'invalid-action' }),
    });
    assert.equal(bad.status, 400);

    // Verify /dashboard/data counts by drug and by action
    const dataResp = await fetch(`${baseUrl}/dashboard/data?range=today`);
    assert.equal(dataResp.status, 200);
    const summary = await dataResp.json();
    assert.equal(summary.counts.fired, 3);
    assert.equal(summary.counts.accepted, 1);
    assert.equal(summary.counts.pharmacist, 1);
    assert.equal(summary.counts.phenoconversion, 2);
    assert.equal(summary.actedOn.value, 2);
    assert.equal(summary.actedOn.max, 3);

    const drugMap = new Map(summary.byDrug.map((d) => [d.drug, d.count]));
    assert.equal(drugMap.get('codeine'), 2);
    assert.equal(drugMap.get('clopidogrel'), 1);

    // Verify GET /dashboard HTML uses design system and instrument theme
    const htmlResp = await fetch(`${baseUrl}/dashboard`);
    assert.equal(htmlResp.status, 200);
    assert.match(htmlResp.headers.get('content-type') || '', /text\/html/);
    const html = await htmlResp.text();
    assert.match(html, /data-theme="instrument"/);
    assert.match(html, /data-voice="clinician"/);
    assert.match(html, /\/design\/fonts\/fonts\.css/);
    assert.match(html, /\/design\/tokens\.css/);
    assert.match(html, /\/design\/meyar\.css/);
    assert.match(html, /\/design\/meyar\.js/);
    assert.match(html, /\/design\/charts\.js/);
    assert.match(html, /Not a national rate/i);
    assert.match(html, /clopidogrel/i);
    assert.match(html, /codeine/i);
  });

  it('B5: GET /compare renders both panes on chart-paper ground with exact UF and UK PROGRESS caption', async () => {
    const resp = await fetch(`${baseUrl}/compare`);
    assert.equal(resp.status, 200);
    assert.match(resp.headers.get('content-type') || '', /text\/html/);
    const html = await resp.text();
    assert.match(html, /data-theme="paper"/);
    assert.match(html, /data-voice="clinician"/);
    assert.match(html, /class="m-body m-chartpaper"/);
    assert.match(html, /\/design\/fonts\/fonts\.css/);
    assert.match(html, /\/design\/tokens\.css/);
    assert.match(html, /\/design\/meyar\.css/);
    assert.match(html, /\/design\/meyar\.js/);
    assert.match(html, /class="cmp-modal"/);
    assert.match(html, /class="m-cds"/);
    assert.match(html, /class="m-caption"/);
    assert.ok(
      html.includes(
        'University of Florida interruptive alerts — 63% accepted but only 20% of recommendations followed. UK PROGRESS, non-interruptive and pharmacist-mediated — 90% acted on.'
      ),
      'Exact UF and UK PROGRESS caption must appear'
    );

    const arResp = await fetch(`${baseUrl}/compare?lang=ar`);
    assert.equal(arResp.status, 200);
    const arHtml = await arResp.text();
    assert.match(arHtml, /lang="ar" dir="rtl"/);
    assert.ok(arHtml.includes('63%') && arHtml.includes('20%') && arHtml.includes('90%'));
  });
});

describe('Meyar B6: alternatives, phenoconversion, inhibitor backward sweep, and styled preview', () => {
  let tmpDir;
  let server;
  let baseUrl;

  before(async () => {
    tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'meyar-b6-test-'));

    // Patient on codeine + tramadol with assessed CYP2D6 *1/*1 Normal Metabolizer (not yet on paroxetine).
    fs.writeFileSync(
      path.join(tmpDir, 'b6-opioid-001.contract.json'),
      JSON.stringify({
        patientId: 'b6-opioid-001',
        sampleOrigin: 'germline',
        currentMedications: [
          { name: 'codeine', source: 'hospital-record', mock: true },
          { name: 'tramadol', source: 'hospital-record', mock: true },
        ],
        genes: [
          {
            gene: 'CYP2D6',
            diplotype: '*1/*1',
            phenotype: 'Normal Metabolizer',
            candidates: ['*1/*1'],
            coverage: {
              definingPositionsAssayed: 0,
              definingPositionsTotal: 0,
              untestedLocalAlleles: [],
              uninformativeNormalRisk: null,
              saudiDataTier: 0,
              saudiDataNote: 'No A5 score (Tier 0): structural-variation gene owned by A8.',
            },
            guidelineVersion: 'CPIC 2021',
            callability: {
              method: 'outside-call',
              svAssessed: true,
              source: 'Mock CNV-aware caller v0.1-demo',
            },
          },
          {
            gene: 'CYP2C19',
            diplotype: '*1/*1',
            phenotype: 'Normal Metabolizer',
            candidates: ['*1/*1'],
            coverage: {
              definingPositionsAssayed: 35,
              definingPositionsTotal: 35,
              untestedLocalAlleles: [],
              uninformativeNormalRisk: 0,
              saudiDataTier: 1,
            },
            guidelineVersion: 'CPIC 2022-11',
            callability: { method: 'vcf', svAssessed: false },
          },
        ],
      })
    );

    // Patient on clopidogrel with CYP2C19 *1/*1 Normal Metabolizer for non-CYP2D6 strong inhibitor flag test.
    fs.writeFileSync(
      path.join(tmpDir, 'b6-cyp2c19-001.contract.json'),
      JSON.stringify({
        patientId: 'b6-cyp2c19-001',
        sampleOrigin: 'germline',
        currentMedications: [{ name: 'clopidogrel', source: 'hospital-record', mock: true }],
        genes: [
          {
            gene: 'CYP2C19',
            diplotype: '*1/*1',
            phenotype: 'Normal Metabolizer',
            candidates: ['*1/*1'],
            coverage: {
              definingPositionsAssayed: 35,
              definingPositionsTotal: 35,
              untestedLocalAlleles: [],
              uninformativeNormalRisk: 0,
              saudiDataTier: 1,
            },
            guidelineVersion: 'CPIC 2022-11',
            callability: { method: 'vcf', svAssessed: false },
          },
        ],
      })
    );

    server = createCdsServer({
      fhirBase: 'http://127.0.0.1:1',
      fhirTimeoutMs: 100,
      contractsDir: tmpDir,
      alertsLogPath: path.join(tmpDir, 'alerts.jsonl'),
    });
    baseUrl = await startServer(server);
  });

  after(async () => {
    await stopServer(server);
    fs.rmSync(tmpDir, { recursive: true, force: true });
  });

  it('ordering paroxetine for a patient already on codeine and tramadol triggers one info backward-sweep card', async () => {
    const warmup = await fetch(`${baseUrl}/cds-services/meyar-pgx`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(
        makeOrderSignBody({
          patientId: 'b6-opioid-001',
          drugCode: '6809',
          drugDisplay: 'Metformin 500 MG Oral Tablet',
        })
      ),
    });
    assert.equal(warmup.status, 200);
    assert.equal((await warmup.json()).cards.length, 0);

    const resp = await fetch(`${baseUrl}/cds-services/meyar-pgx`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(
        makeOrderSignBody({
          patientId: 'b6-opioid-001',
          drugCode: '32937',
          drugDisplay: 'Paroxetine 20 MG Oral Tablet',
        })
      ),
    });
    assert.equal(resp.status, 200);
    assert.equal(resp.headers.get('x-meyar-backward-sweep'), 'true');
    const data = await resp.json();
    assert.equal(data.cards.length, 1, 'Expected one info card listing affected existing substrates');

    const card = data.cards[0];
    assert.equal(card.indicator, 'info');
    assert.ok(card.summary.length < 140);
    assert.match(card.summary, /Backward sweep/i);
    assert.match(card.summary, /CYP2D6/);
    assert.match(card.summary, /paroxetine/i);
    assert.match(card.summary, /codeine/i);

    assert.match(
      card.detail,
      /\*\*Genetic:\*\* CYP2D6 \*1\/\*1 \(Normal Metabolizer\) · \*\*Acting like:\*\* Poor Metabolizer because of paroxetine/
    );
    assert.match(card.detail, /Activity score: 2\.0 × 0 = 0\.0/);
    assert.match(card.detail, /\*\*Existing medication \(backward sweep\):\*\* codeine/);
    assert.match(card.detail, /\*\*Existing medication \(backward sweep\):\*\* tramadol/);
    assert.match(card.detail, /Avoid codeine use because of possibility of diminished analgesia/);
    assert.match(card.detail, /non-tramadol opioid/);
    assert.ok(Array.isArray(card.links) && card.links[0].url.includes('clinpgx.org'));
    assert.equal(card.selectionBehavior, 'at-most-one');
    assert.ok(card.suggestions.some((s) => s.label === 'Send to pharmacist'));
  });

  it('ordering paroxetine never fabricates phenoconversion when CYP2D6 is not-assessed (A8)', async () => {
    const resp = await fetch(`${baseUrl}/cds-services/meyar-pgx`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(
        makeOrderSignBody({
          patientId: 'demo-001',
          drugCode: '32937',
          drugDisplay: 'Paroxetine 20 MG Oral Tablet',
          prefetch: {
            currentMedications: {
              resourceType: 'Bundle',
              type: 'searchset',
              entry: [
                {
                  resource: {
                    resourceType: 'MedicationStatement',
                    id: 'stmt-cod',
                    status: 'active',
                    subject: { reference: 'Patient/demo-001' },
                    medicationCodeableConcept: {
                      coding: [{ system: 'http://www.nlm.nih.gov/research/umls/rxnorm', code: '2670', display: 'codeine' }],
                      text: 'codeine',
                    },
                  },
                },
              ],
            },
          },
        })
      ),
    });
    assert.equal(resp.status, 200);
    const data = await resp.json();
    for (const c of data.cards) {
      assert.doesNotMatch(c.detail, /Acting like:/);
      assert.doesNotMatch(c.detail, /Activity score:/);
    }
  });

  it('ordering a strong CYP2C19 inhibitor flags existing CYP2C19 substrate without computing a score', async () => {
    const resp = await fetch(`${baseUrl}/cds-services/meyar-pgx`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(
        makeOrderSignBody({
          patientId: 'b6-cyp2c19-001',
          drugCode: '42355',
          drugDisplay: 'Fluvoxamine 50 MG Oral Tablet',
        })
      ),
    });
    assert.equal(resp.status, 200);
    const data = await resp.json();
    assert.equal(data.cards.length, 1);
    const card = data.cards[0];
    assert.equal(card.indicator, 'info');
    assert.match(card.detail, /may be affected by fluvoxamine/i);
    assert.match(card.detail, /clopidogrel/i);
    assert.doesNotMatch(card.detail, /Activity score:/);
  });

  it('a drug with no CPIC alternative shows no drug-alternative suggestion', async () => {
    const resp = await fetch(`${baseUrl}/cds-services/meyar-pgx`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(
        makeOrderSignBody({
          patientId: 'b6-cyp2c19-001',
          drugCode: '32968',
          drugDisplay: 'Clopidogrel 75 MG Oral Tablet',
          reasonText: 'Acute coronary syndrome',
        })
      ),
    });
    assert.equal(resp.status, 200);
    const data = await resp.json();
    assert.equal(data.cards.length, 1);
    const card = data.cards[0];
    assert.equal(card.indicator, 'info');
    assert.equal(card.suggestions, undefined);
  });

  it('GET /preview renders styled .m-cds prescriber preview using design/ in EN and AR RTL', async () => {
    const enResp = await fetch(`${baseUrl}/preview`);
    assert.equal(enResp.status, 200);
    assert.match(enResp.headers.get('content-type') || '', /text\/html/);
    const enHtml = await enResp.text();
    assert.match(enHtml, /data-theme="paper"/);
    assert.match(enHtml, /data-voice="clinician"/);
    assert.match(enHtml, /class="m-body m-chartpaper"/);
    assert.match(enHtml, /\/design\/fonts\/fonts\.css/);
    assert.match(enHtml, /\/design\/tokens\.css/);
    assert.match(enHtml, /\/design\/meyar\.css/);
    assert.match(enHtml, /\/design\/meyar\.js/);
    assert.match(enHtml, /scaleHTML\(gp, 'clinician'\)/);
    assert.match(enHtml, /POST \/cds-services\/meyar-pgx/);

    const arResp = await fetch(`${baseUrl}/preview?lang=ar`);
    assert.equal(arResp.status, 200);
    const arHtml = await arResp.text();
    assert.match(arHtml, /lang="ar" dir="rtl"/);
  });
});
