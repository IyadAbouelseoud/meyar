import { describe, it, before, after } from 'node:test';
import assert from 'node:assert/strict';
import http from 'node:http';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

import { createCdsServer } from '../server.js';
import { isForbiddenPublicFhir } from '../lib/phenotypes.js';

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

    // Point FHIR_BASE to a closed local port to exercise contract fallback deterministically.
    cdsServer = createCdsServer({
      fhirBase: 'http://127.0.0.1:1',
      fhirTimeoutMs: 150,
      contractsDir: tmpContractsDir,
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
    assert.deepEqual(labels, ["Better matched for this patient's genes: ticagrelor"]);
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
    assert.equal(card.suggestions, undefined);
    assert.equal(card.selectionBehavior, undefined);
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

  it('discovery prefetch is code-filtered to genotype Observations', async () => {
    const data = await (await fetch(`${cdsBaseUrl}/cds-services`)).json();
    for (const svc of data.services) {
      assert.deepEqual(Object.keys(svc.prefetch), ['pgxObservations']);
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
});
