// Append-only JSONL alert log and summary aggregator (B4).
// Stores every CDS Hooks card fired and every prescriber response in cds/data/alerts.jsonl.
// Research prototype — synthetic/mock data only; no database server.

import fs from 'node:fs';
import path from 'node:path';

export const VALID_ACTIONS = new Set(['fired', 'accepted', 'pharmacist', 'dismissed']);

export function resolveAlertsLogPath(overridePath) {
  if (overridePath) return path.resolve(overridePath);
  if (process.env.ALERTS_LOG_PATH) return path.resolve(process.env.ALERTS_LOG_PATH);
  return path.resolve(import.meta.dirname, '..', 'data', 'alerts.jsonl');
}

export function appendAlertEvents(logPath, events) {
  if (!Array.isArray(events) || events.length === 0) return 0;
  const resolved = resolveAlertsLogPath(logPath);
  fs.mkdirSync(path.dirname(resolved), { recursive: true });
  const lines = events.map((ev) => JSON.stringify(ev)).join('\n') + '\n';
  fs.appendFileSync(resolved, lines, 'utf8');
  return events.length;
}

export function readAlertEvents(logPath) {
  const resolved = resolveAlertsLogPath(logPath);
  if (!fs.existsSync(resolved)) return [];
  const raw = fs.readFileSync(resolved, 'utf8');
  const events = [];
  for (const line of raw.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed) continue;
    try {
      const parsed = JSON.parse(trimmed);
      if (parsed && typeof parsed === 'object') events.push(parsed);
    } catch {
      // Ignore malformed trailing lines rather than failing dashboard reads.
    }
  }
  return events;
}

function startOfLocalDay(date) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

function buildBuckets(range, now) {
  const buckets = [];
  if (range === 'week') {
    const todayStart = startOfLocalDay(now);
    const fmt = new Intl.DateTimeFormat('en-US', { weekday: 'short' });
    for (let i = 6; i >= 0; i--) {
      const start = new Date(todayStart.getTime() - i * 86400000);
      const end = new Date(start.getTime() + 86400000);
      buckets.push({
        label: fmt.format(start),
        startMs: start.getTime(),
        endMs: end.getTime(),
      });
    }
    const spanMs = 7 * 86400000;
    return {
      buckets,
      windowStartMs: buckets[0].startMs,
      windowEndMs: buckets[buckets.length - 1].endMs,
      prevStartMs: buckets[0].startMs - spanMs,
      prevEndMs: buckets[0].startMs,
    };
  }

  // Default: 'today' — 9 hourly buckets ending at the current hour so recent hooks always appear.
  const currentHourStart = new Date(
    now.getFullYear(),
    now.getMonth(),
    now.getDate(),
    now.getHours(),
    0,
    0,
    0
  );
  for (let i = 8; i >= 0; i--) {
    const start = new Date(currentHourStart.getTime() - i * 3600000);
    const end = new Date(start.getTime() + 3600000);
    buckets.push({
      label: String(start.getHours()).padStart(2, '0'),
      startMs: start.getTime(),
      endMs: end.getTime(),
    });
  }
  const dayStart = startOfLocalDay(now).getTime();
  return {
    buckets,
    windowStartMs: Math.min(dayStart, buckets[0].startMs),
    windowEndMs: buckets[buckets.length - 1].endMs,
    prevStartMs: dayStart - 86400000,
    prevEndMs: dayStart,
  };
}

function countMetrics(list) {
  let fired = 0;
  let accepted = 0;
  let pharmacist = 0;
  let dismissed = 0;
  let phenoconversion = 0;
  let switched = 0;

  for (const ev of list) {
    if (ev.action === 'fired') {
      fired++;
      if (ev.phenoconversionApplied) phenoconversion++;
      if (ev.backwardSweep) switched++;
    } else if (ev.action === 'accepted') {
      accepted++;
    } else if (ev.action === 'pharmacist') {
      pharmacist++;
    } else if (ev.action === 'dismissed') {
      dismissed++;
    }
  }
  return { fired, accepted, pharmacist, dismissed, phenoconversion, switched };
}

export function summarizeAlerts(events, { range = 'today', now = new Date() } = {}) {
  const normalizedRange = range === 'week' ? 'week' : 'today';
  const { buckets, windowStartMs, windowEndMs, prevStartMs, prevEndMs } = buildBuckets(
    normalizedRange,
    now
  );

  const inWindow = [];
  const inPrev = [];

  for (const ev of events) {
    const ms = Date.parse(ev.time);
    if (Number.isNaN(ms)) continue;
    if (ms >= windowStartMs && ms < windowEndMs) {
      inWindow.push({ ...ev, _ms: ms });
    } else if (ms >= prevStartMs && ms < prevEndMs) {
      inPrev.push(ev);
    }
  }

  const counts = countMetrics(inWindow);
  const prevCounts = countMetrics(inPrev);

  const series = buckets.map((b) => {
    const slice = inWindow.filter((ev) => ev._ms >= b.startMs && ev._ms < b.endMs);
    const m = countMetrics(slice);
    return {
      x: b.label,
      y: m.fired,
      accepted: m.accepted,
      phenoconversion: m.phenoconversion,
      switched: m.switched,
    };
  });

  // Counts by drug (all fired cards in the active window).
  const drugCounts = new Map();
  for (const ev of inWindow) {
    if (ev.action !== 'fired') continue;
    const drugName = String(ev.drug || 'Unknown').trim() || 'Unknown';
    drugCounts.set(drugName, (drugCounts.get(drugName) || 0) + 1);
  }
  const byDrug = [...drugCounts.entries()]
    .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
    .map(([drug, count]) => ({ drug, count }));

  const actedCount = counts.accepted + counts.pharmacist;
  const responseTotal = actedCount + counts.dismissed;
  const actedMax = Math.max(counts.fired, responseTotal);

  const feed = inWindow
    .slice()
    .sort((a, b) => b._ms - a._ms)
    .slice(0, 25)
    .map(({ _ms, ...rest }) => rest);

  return {
    range: normalizedRange,
    totalLogged: events.length,
    counts,
    prevCounts,
    actedOn: {
      value: actedCount,
      max: actedMax,
    },
    byDrug,
    byAction: {
      fired: counts.fired,
      accepted: counts.accepted,
      pharmacist: counts.pharmacist,
      dismissed: counts.dismissed,
    },
    series,
    feed,
    mock: true,
  };
}
