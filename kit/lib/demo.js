// Mock kit used by the demo, the tests and the render. Invented roles and places only.
// No real person, site or courier. Times are illustrative, not stability or transit limits.

export const DEMO_KIT_ID = 'MYR-DEMO-0001';
export const DEMO_PATIENT_ID = 'demo-001';
export const DEMO_VCF_PATH = 'engine/data/in/demo-001.vcf';

/** Scan inputs for the six events, in order (what a staff member enters at each scan). */
export const DEMO_SCANS = [
  { type: 'issued', time: '2026-11-15T08:30:00+03:00',
    place: { ar: 'مستودع العُدد — تجريبي', en: 'Kit store — demo' },
    actor: { role: 'kit-officer', ar: 'مسؤول العُدد (تجريبي)', en: 'Kit officer (demo)' } },
  { type: 'collected', time: '2026-11-16T09:10:00+03:00',
    place: { ar: 'نقطة الجمع — عيادة تجريبية', en: 'Collection point — demo clinic' },
    actor: { role: 'collector', ar: 'ممرض الجمع (تجريبي)', en: 'Collecting nurse (demo)' } },
  { type: 'sealed', time: '2026-11-16T09:14:00+03:00',
    place: { ar: 'نقطة الجمع — عيادة تجريبية', en: 'Collection point — demo clinic' },
    actor: { role: 'collector', ar: 'ممرض الجمع (تجريبي)', en: 'Collecting nurse (demo)' } },
  { type: 'shipped', time: '2026-11-16T13:00:00+03:00',
    place: { ar: 'نقطة الاستلام — ناقل تجريبي', en: 'Courier hand-over — demo' },
    actor: { role: 'courier', ar: 'مندوب الشحن (تجريبي)', en: 'Courier (demo)' } },
  { type: 'received', time: '2026-11-17T10:20:00+03:00',
    place: { ar: 'استقبال المختبر — تجريبي', en: 'Lab reception — demo' },
    actor: { role: 'lab-reception', ar: 'فني الاستقبال (تجريبي)', en: 'Reception technician (demo)' } },
  { type: 'genotyped', time: '2026-11-19T15:45:00+03:00',
    place: { ar: 'مختبر التنميط — تجريبي', en: 'Genotyping lab — demo' },
    actor: { role: 'lab-scientist', ar: 'عالم المختبر (تجريبي)', en: 'Lab scientist (demo)' },
    details: { vcfPath: DEMO_VCF_PATH, sampleOrigin: 'germline' } },
];

/** Turn a scan input into the event record that gets hashed. */
export function toEvent(kitId, patientId, scan) {
  const event = {
    kitId,
    patientId,
    type: scan.type,
    time: scan.time,
    place: scan.place,
    actor: scan.actor,
    mock: true,
  };
  if (scan.details) event.details = scan.details;
  return event;
}
