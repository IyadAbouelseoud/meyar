// Meyar dashboard charts · design/charts.js
// Dependency-free SVG charts drawn to scale from real (or clearly mock) logged values.
// Colours come from tokens (CSS variables), so charts follow the theme they sit in.
// Every chart animates once into place (settle easing) and responds to hover/focus.
// Never feed these a sourced statistic you do not have a docs/sources.md row for.

const NS = 'http://www.w3.org/2000/svg';
const motionOn = () => document.documentElement.classList.contains('m-motion');
const fmt = (n, lang) => Number(n).toLocaleString(lang || 'en');

// ---------- Segmented gauge (share of a whole) ----------
// value/max → filled ticks on a 220° arc. Centre shows the percentage.
export function gauge(el, { value, max, label, ticks = 40, lang = 'en' }) {
  const pct = max ? value / max : 0;
  const W = 260, H = 170, cx = 130, cy = 140, r1 = 92, r2 = 118, a0 = 200, a1 = -20;
  const on = Math.round(pct * ticks);
  let lines = '';
  for (let i = 0; i < ticks; i++) {
    const a = ((a0 + (a1 - a0) * (i / (ticks - 1))) * Math.PI) / 180;
    const x1 = cx + r1 * Math.cos(a), y1 = cy - r1 * Math.sin(a), x2 = cx + r2 * Math.cos(a), y2 = cy - r2 * Math.sin(a);
    lines += `<line x1="${x1.toFixed(1)}" y1="${y1.toFixed(1)}" x2="${x2.toFixed(1)}" y2="${y2.toFixed(1)}" class="m-gauge__tick${i < on ? ' is-on' : ''}" style="--i:${i}"/>`;
  }
  el.innerHTML = `<svg class="m-gauge" viewBox="0 0 ${W} ${H}" role="img" aria-label="${label}: ${Math.round(pct * 100)}% (${value} of ${max})">${lines}</svg>
  <div class="m-gauge__read"><span class="m-gauge__num" data-v="0">0</span><span class="m-gauge__unit">%</span><span class="m-gauge__of">${fmt(value, lang)} / ${fmt(max, lang)}</span></div>`;
  const num = el.querySelector('.m-gauge__num');
  tween(num, Math.round(pct * 100), 900);
}

// ---------- Concentric rings (parts of a whole) ----------
export function rings(el, { parts, centre, centreLabel }) {
  const total = parts.reduce((s, p) => s + p.value, 0) || 1;
  const S = 220, c = S / 2;
  let arcs = '';
  parts.forEach((p, i) => {
    const r = 92 - i * 20, C = 2 * Math.PI * r, frac = p.value / total;
    arcs += `<circle cx="${c}" cy="${c}" r="${r}" class="m-rings__track"/>
      <circle cx="${c}" cy="${c}" r="${r}" class="m-rings__arc" style="--c:${p.color};--len:${(C * frac).toFixed(1)};--C:${C.toFixed(1)}" transform="rotate(-90 ${c} ${c})"><title>${p.label}: ${p.value}</title></circle>`;
  });
  el.innerHTML = `<div class="m-rings"><svg viewBox="0 0 ${S} ${S}" role="img" aria-label="${parts.map((p) => `${p.label} ${p.value}`).join(', ')}">${arcs}</svg>
    <div class="m-rings__centre"><span class="m-rings__num">${centre}</span><span>${centreLabel}</span></div></div>
    <ul class="m-legend">${parts.map((p) => `<li><i style="background:${p.color}"></i>${p.label}<b class="m-num">${p.value}</b></li>`).join('')}</ul>`;
  requestAnimationFrame(() => requestAnimationFrame(() => el.querySelectorAll('.m-rings__arc').forEach((a) => a.classList.add('is-drawn'))));
}

// ---------- Area chart with crosshair ----------
// series: [{x: label, y: number}]
export function area(el, { series, label, unit = '' }) {
  // Draw at the box's real width so axis text stays at its true size on phones.
  const W = Math.max(300, Math.round(el.clientWidth || 640)), H = W < 480 ? 190 : 220, L = 28, R = 12, T = 30, B = 26;
  const every = W < 480 ? 2 : 1;
  const max = Math.max(1, ...series.map((d) => d.y));
  const step = niceStep(max), top = Math.ceil(max / step) * step;
  const X = (i) => L + (i * (W - L - R)) / Math.max(1, series.length - 1);
  const Y = (v) => T + (1 - v / top) * (H - T - B);
  const pts = series.map((d, i) => [X(i), Y(d.y)]);
  const line = smooth(pts);
  const grid = [];
  for (let v = 0; v <= top; v += step) grid.push(`<line x1="${L}" x2="${W - R}" y1="${Y(v)}" y2="${Y(v)}" class="m-area__grid"/><text x="${L - 8}" y="${Y(v) + 4}" class="m-area__ylab">${v}</text>`);
  const xl = series.map((d, i) => (i % every ? '' : `<text x="${X(i)}" y="${H - 6}" class="m-area__xlab">${d.x}</text>`)).join('');
  const peak = series.reduce((m, d, i) => (d.y > series[m].y ? i : m), 0);
  const id = 'g' + Math.random().toString(36).slice(2, 8);
  el.innerHTML = `<svg class="m-area" viewBox="0 0 ${W} ${H}" role="img" aria-label="${label}">
    <defs><linearGradient id="${id}" x1="0" x2="0" y1="0" y2="1"><stop offset="0" stop-color="var(--m-data)" stop-opacity=".34"/><stop offset="1" stop-color="var(--m-data)" stop-opacity="0"/></linearGradient>
    <clipPath id="${id}c"><rect class="m-area__reveal" x="0" y="0" width="${W}" height="${H}"/></clipPath></defs>
    ${grid.join('')}${xl}
    <g clip-path="url(#${id}c)"><path d="${line} L ${X(series.length - 1)} ${Y(0)} L ${X(0)} ${Y(0)} Z" fill="url(#${id})"/>
    <path d="${line}" class="m-area__line"/></g>
    <g class="m-area__cross" opacity="0"><line y1="${T - 6}" y2="${H - B}" class="m-area__vline"/><circle r="5" class="m-area__dot"/></g>
  </svg><div class="m-tip" role="status" aria-live="polite"></div>`;
  const svg = el.querySelector('svg'), cross = svg.querySelector('.m-area__cross'), tip = el.querySelector('.m-tip');
  const show = (i) => {
    const [x, y] = pts[i];
    cross.setAttribute('opacity', 1);
    cross.querySelector('line').setAttribute('x1', x); cross.querySelector('line').setAttribute('x2', x);
    cross.querySelector('circle').setAttribute('cx', x); cross.querySelector('circle').setAttribute('cy', y);
    tip.textContent = `${series[i].x} · ${series[i].y}${unit}`;
    const box = svg.getBoundingClientRect(), host = el.getBoundingClientRect();
    // Keep the centred tip inside its host so it never pushes past a phone's edge.
    const half = tip.offsetWidth / 2, px = (x / W) * box.width + (box.left - host.left);
    tip.style.left = `${Math.min(Math.max(px, half + 4), host.width - half - 4)}px`;
    tip.style.top = `${(y / H) * box.height + (box.top - host.top)}px`;
    tip.classList.add('is-on');
  };
  svg.addEventListener('pointermove', (e) => {
    const r = svg.getBoundingClientRect(), x = ((e.clientX - r.left) / r.width) * W;
    let best = 0; pts.forEach((p, i) => { if (Math.abs(p[0] - x) < Math.abs(pts[best][0] - x)) best = i; });
    show(best);
  });
  svg.addEventListener('pointerleave', () => show(peak));
  svg.tabIndex = 0;
  let k = peak;
  svg.addEventListener('keydown', (e) => { if (e.key === 'ArrowRight') k = Math.min(series.length - 1, k + 1); else if (e.key === 'ArrowLeft') k = Math.max(0, k - 1); else return; e.preventDefault(); show(k); });
  requestAnimationFrame(() => requestAnimationFrame(() => { svg.classList.add('is-drawn'); show(peak); }));
}

// ---------- Vertical bars with value pill ----------
export function bars(el, { data, label }) {
  const max = Math.max(1, ...data.map((d) => d.y));
  const peak = data.reduce((m, d, i) => (d.y > data[m].y ? i : m), 0);
  el.innerHTML = `<div class="m-bars" role="list" aria-label="${label}">${data.map((d, i) =>
    `<div class="m-bars__col${i === peak ? ' is-active' : ''}" role="listitem" tabindex="0" aria-label="${d.x}: ${d.y}">
      <span class="m-bars__pill">${d.y}</span><span class="m-bars__bar" style="--h:${d.y / max}"></span><span class="m-bars__x">${d.x}</span></div>`).join('')}</div>`;
  const cols = el.querySelectorAll('.m-bars__col');
  const act = (c) => { cols.forEach((x) => x.classList.toggle('is-active', x === c)); };
  cols.forEach((c) => { c.addEventListener('pointerenter', () => act(c)); c.addEventListener('focus', () => act(c)); });
  el.querySelector('.m-bars').addEventListener('pointerleave', () => act(cols[peak]));
  requestAnimationFrame(() => requestAnimationFrame(() => el.querySelector('.m-bars').classList.add('is-drawn')));
}

// ---------- Mini bar sparkline for KPI tiles ----------
export function minibars(el, values) {
  const max = Math.max(1, ...values);
  el.innerHTML = `<div class="m-minibars" aria-hidden="true">${values.map((v, i) => `<i style="--h:${v / max}"${i === values.length - 1 ? ' class="is-last"' : ''}></i>`).join('')}</div>`;
}

// ---------- helpers ----------
export function tween(node, to, ms = 900) {
  const from = Number(node.dataset.v || 0);
  node.dataset.v = to;
  if (!motionOn()) { node.textContent = fmt(to); return; }
  const t0 = performance.now();
  const step = (t) => {
    const p = Math.min(1, (t - t0) / ms), e = 1 - Math.pow(1 - p, 3);
    node.textContent = fmt(Math.round(from + (to - from) * e));
    if (p < 1) requestAnimationFrame(step);
  };
  requestAnimationFrame(step);
}
function niceStep(max) { const raw = max / 4, mag = 10 ** Math.floor(Math.log10(raw)), n = raw / mag; return (n <= 1 ? 1 : n <= 2 ? 2 : n <= 5 ? 5 : 10) * mag; }
function smooth(p) { // Catmull-Rom → Bézier, clamped per segment so it never overshoots or dips below zero
  if (p.length < 2) return '';
  let d = `M ${p[0][0]} ${p[0][1]}`;
  for (let i = 0; i < p.length - 1; i++) {
    const p0 = p[i - 1] || p[i], p1 = p[i], p2 = p[i + 1], p3 = p[i + 2] || p2;
    const c1 = [p1[0] + (p2[0] - p0[0]) / 6, p1[1] + (p2[1] - p0[1]) / 6];
    const c2 = [p2[0] - (p3[0] - p1[0]) / 6, p2[1] - (p3[1] - p1[1]) / 6];
    const lo = Math.max(p1[1], p2[1]), hi = Math.min(p1[1], p2[1]);
    // keep control points between the two values so the line never overshoots a logged count
    c1[1] = Math.max(hi, Math.min(c1[1], lo)); c2[1] = Math.max(hi, Math.min(c2[1], lo));
    d += ` C ${c1[0].toFixed(1)} ${c1[1].toFixed(1)}, ${c2[0].toFixed(1)} ${c2[1].toFixed(1)}, ${p2[0].toFixed(1)} ${p2[1].toFixed(1)}`;
  }
  return d;
}
export { NS };
