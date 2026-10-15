// Certificates for events — programming contests, seminars, workshops… (Dashboard → Event Certificates).
// Each type has default wording; an event can override the title / text per type.
// Placeholders in the text: {name} {event} {date} {venue} {detail} {institution} {club}
export const EVENT_CERT_TYPES = [
  {
    value: 'participant',
    label: 'Participant',
    color: 'blue',
    title: 'Certificate of Participation',
    body: 'for participating in {event}, held on {date}. We appreciate the enthusiasm, effort and spirit shown throughout the event.',
    detailLabel: 'Team / note (optional)',
    detailPlaceholder: 'e.g. Team Byte Busters',
  },
  {
    value: 'winner',
    label: 'Winner',
    color: 'amber',
    title: 'Certificate of Achievement',
    body: 'for securing {detail} in {event}, held on {date}. Congratulations on this outstanding achievement.',
    detailLabel: 'Position / award',
    detailPlaceholder: 'e.g. Champion, 1st Runner-up',
    detailRequired: true,
  },
  {
    value: 'speaker',
    label: 'Speaker',
    color: 'green',
    title: 'Certificate of Appreciation',
    body: 'for sharing valuable knowledge and experience as a speaker at {event}, held on {date}. Your session inspired and enriched our members.',
    detailLabel: 'Session topic (optional)',
    detailPlaceholder: 'e.g. Building a career in AI',
    detailPrefix: 'Topic: ',
  },
  {
    value: 'guest',
    label: 'Guest',
    color: 'green',
    title: 'Certificate of Honour',
    body: 'for gracing {event}, held on {date}, as an honourable guest. Your presence and encouragement made the occasion truly special.',
    detailLabel: 'Guest role (optional)',
    detailPlaceholder: 'e.g. Chief Guest, Special Guest',
  },
  {
    value: 'judge',
    label: 'Judge',
    color: 'gray',
    title: 'Certificate of Appreciation',
    body: 'for serving as a judge at {event}, held on {date}. We sincerely appreciate your fair evaluation, time and expertise.',
    detailLabel: 'Note (optional)',
    detailPlaceholder: 'e.g. Problem setter',
  },
  {
    value: 'volunteer',
    label: 'Volunteer',
    color: 'gray',
    title: 'Certificate of Appreciation',
    body: 'for volunteering at {event}, held on {date}. Your dedication and hard work helped make the event a success.',
    detailLabel: 'Team / duty (optional)',
    detailPlaceholder: 'e.g. Registration desk',
  },
  {
    value: 'organizer',
    label: 'Organizer',
    color: 'gray',
    title: 'Certificate of Appreciation',
    body: 'for organizing {event}, held on {date}. Your leadership and commitment made the event possible.',
    detailLabel: 'Role (optional)',
    detailPlaceholder: 'e.g. Event Coordinator',
  },
];
export const EVENT_CERT_TYPE = Object.fromEntries(EVENT_CERT_TYPES.map((t) => [t.value, t]));
export const EVENT_CERT_TYPE_VALUES = EVENT_CERT_TYPES.map((t) => t.value);

export const EVENT_INTRO = 'This certificate is proudly presented to';
export const MAX_EVENT_SIGNERS = 3;
export const MAX_RECIPIENTS_PER_ADD = 500;

// "Name | Institution or student ID | Detail" — one recipient per line (bulk add)
export function parseRecipientLines(text = '') {
  return String(text)
    .split(/\r?\n/)
    .map((line) => line.split(/\s*[|\t]\s*/).map((part) => part.trim()))
    .filter(([name]) => name)
    .map(([name, institution = '', detail = '']) => ({ name, institution, detail }));
}
