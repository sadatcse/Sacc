import { people, positions } from '@/data/executives';

// Read-side helpers for the executives pages. To go dynamic, make these async
// and query MongoDB — the pages only talk to these functions.

const peopleBySlug = new Map(people.map((p) => [p.slug, p]));

// Committee years, newest first
export function getYears() {
  return [...new Set(positions.map((p) => p.year))].sort((a, b) => b - a);
}

export function getLatestYear() {
  return getYears()[0];
}

// { advisors: [...], executives: [...] } for one year; each item = person + { role, year }
export function getCommittee(year) {
  const members = positions
    .filter((p) => p.year === year && peopleBySlug.has(p.slug))
    .map((p) => ({ ...peopleBySlug.get(p.slug), role: p.role, year: p.year, type: p.type }));
  return {
    advisors: members.filter((m) => m.type === 'advisor'),
    executives: members.filter((m) => m.type === 'executive'),
  };
}

export function getPerson(slug) {
  return peopleBySlug.get(slug) || null;
}

export function getPersonSlugs() {
  return people.map((p) => p.slug);
}

// All positions a person has held, newest first
export function getPositionsFor(slug) {
  return positions.filter((p) => p.slug === slug).sort((a, b) => b.year - a.year);
}
