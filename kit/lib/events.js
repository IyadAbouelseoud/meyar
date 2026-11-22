// The six chain-of-custody events, in the only order they may happen (F3).
// Labels are clinician voice (staff screens). Arabic strings are drafts for the C4 review.
// Research prototype — not for clinical use.

export const EVENT_TYPES = ['issued', 'collected', 'sealed', 'shipped', 'received', 'genotyped'];

export const EVENT_LABELS = {
  issued:    { ar: 'صُرفت العُدّة', en: 'Kit issued' },
  collected: { ar: 'جُمعت العيّنة', en: 'Sample collected' },
  sealed:    { ar: 'خُتمت الأنبوبة', en: 'Tube sealed' },
  shipped:   { ar: 'شُحنت', en: 'Shipped' },
  received:  { ar: 'استلمها المختبر', en: 'Received at lab' },
  genotyped: { ar: 'اكتمل التنميط الجيني', en: 'Genotyped' },
};

/** The event type that must come next, or null when the chain is complete. */
export function nextEventType(events) {
  return events.length < EVENT_TYPES.length ? EVENT_TYPES[events.length] : null;
}
