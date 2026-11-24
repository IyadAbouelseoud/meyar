// REVIEW (final pass), known issue 1: the image library is used on the Passport, labelled, sized, offline,
// and never inside clinical content.
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { renderApp } from '../src/render.js';
import { IMAGES } from '../src/imagery.js';

const here = path.dirname(fileURLToPath(import.meta.url));
const demo001 = JSON.parse(fs.readFileSync(path.join(here, '..', 'public', 'demo', 'demo-001.contract.json'), 'utf8'));
const render = (lang, tab) => {
  const root = { innerHTML: '' };
  renderApp(root, { lang, elder: false, tab, contract: demo001, effectiveContract: demo001, localMeds: [] });
  return root.innerHTML;
};
const figures = (html) => [...html.matchAll(/<figure class="m-figure[^"]*" data-image="(img-\d\d)">([\s\S]*?)<\/figure>/g)];

const EXPECT = { genes: ['img-15'], meds: ['img-02'], doctor: ['img-14', 'img-06'] };

for (const lang of ['en', 'ar']) {
  test(`each tab shows its images with label, alt and size (${lang})`, () => {
    for (const [tab, ids] of Object.entries(EXPECT)) {
      const figs = figures(render(lang, tab));
      assert.deepEqual(figs.map((f) => f[1]), ids, `${tab} images`);
      for (const [, id, body] of figs) {
        assert.match(body, /width="\d+" height="\d+"/, `${id} has intrinsic size`);
        assert.match(body, /srcset="[^"]*-640\.webp 640w[^"]*-1920\.webp \d+w"/, `${id} srcset`);
        assert.match(body, /alt="[^"]{12,}"/, `${id} alt`);
        assert.match(body, lang === 'en' ? /AI-generated illustration/ : /صورة توضيحية مولَّدة/, `${id} label`);
      }
    }
  });
}

test('only the hero loads eagerly; everything else is lazy', () => {
  const [hero] = figures(render('en', 'genes'));
  assert.match(hero[2], /fetchpriority="high"/);
  for (const tab of ['meds', 'doctor']) for (const [, , body] of figures(render('en', tab))) assert.match(body, /loading="lazy"/);
});

test('no image sits inside a gene card or other clinical block', () => {
  for (const tab of ['genes', 'meds', 'doctor']) {
    const html = render('en', tab);
    for (const cls of ['m-gene', 'm-better', 'm-answer', 'm-pharmacist-gene']) {
      const re = new RegExp(`<article class="${cls}[\\s\\S]*?</article>`, 'g');
      for (const m of html.matchAll(re)) assert.doesNotMatch(m[0], /m-figure/, `${tab}: image inside .${cls}`);
    }
  }
});

test('every referenced file is in public/imagery (bundled for offline)', () => {
  for (const id of Object.keys(IMAGES)) {
    for (const suffix of ['-640', '', '-1920']) {
      assert.ok(fs.existsSync(path.join(here, '..', 'public', 'imagery', `${id}${suffix}.webp`)), `${id}${suffix}.webp`);
    }
  }
});
