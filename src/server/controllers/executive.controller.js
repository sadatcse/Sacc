import { HttpError, created, ok, readJson } from '@/server/http';
import * as executives from '@/server/services/executive.service';

// ---- people ----

// Public: ?year=2026 → that committee; no year → { years, latestYear }. Admin ?all=1 → every person with stats.
export async function listPeople({ query, session }) {
  if (query.get('all') && session?.role === 'admin') return ok(await executives.listPeople());
  const years = await executives.getYears();
  const year = Number(query.get('year')) || years[0];
  return ok({ years, year, ...(year ? await executives.getCommittee(year) : { advisors: [], executives: [] }) });
}

// Public: one person (by slug) with all positions held
export async function showPerson({ params }) {
  const person = await executives.getPerson(params.id);
  if (!person) throw new HttpError(404, 'Person not found.');
  return ok({ ...person, positions: await executives.getPositionsFor(person._id) });
}

export async function createPerson({ req }) {
  return created(await executives.createPerson(await readJson(req)), 'Person added.');
}

export async function updatePerson({ req, params }) {
  return ok(await executives.updatePerson(params.id, await readJson(req)), 'Person saved.');
}

export async function removePerson({ params }) {
  await executives.deletePerson(params.id);
  return ok(undefined, 'Person and their positions deleted.');
}

// ---- committee positions ----

export async function listPositions({ query }) {
  return ok(await executives.listPositions({ year: query.get('year') }));
}

export async function createPosition({ req }) {
  return created(await executives.createPosition(await readJson(req)), 'Position added.');
}

export async function updatePosition({ req, params }) {
  return ok(await executives.updatePosition(params.id, await readJson(req)), 'Position saved.');
}

export async function removePosition({ params }) {
  await executives.deletePosition(params.id);
  return ok(undefined, 'Position removed.');
}
