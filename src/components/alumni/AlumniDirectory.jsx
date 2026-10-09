'use client';
import { useDeferredValue, useMemo, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { AnimatePresence, MotionConfig, motion } from 'motion/react';
import { FaSearch, FaSlidersH, FaChevronDown, FaChevronUp, FaTimes, FaUserGraduate, FaMapMarkerAlt, FaHandsHelping, FaEnvelope, FaPhoneAlt, FaWhatsapp, FaLock } from 'react-icons/fa';
import { SOCIAL_LINKS } from '@/config/socialLinks';
import { cn, formatPhone } from '@/lib/utils';

const SOCIAL = SOCIAL_LINKS.filter((l) => l.key !== 'email');
// WhatsApp wants the number in international form without '+' (Bangladesh numbers start 01…)
const whatsappNumber = (phone) => phone.replace(/\D/g, '').replace(/^0(?=1)/, '880');

const SORTS = {
  name: { label: 'Name', compare: (a, b) => a.name.localeCompare(b.name) },
  newest: { label: 'Batch (newest)', compare: (a, b) => b.batch.localeCompare(a.batch, undefined, { numeric: true }) || a.name.localeCompare(b.name) },
  oldest: { label: 'Batch (oldest)', compare: (a, b) => a.batch.localeCompare(b.batch, undefined, { numeric: true }) || a.name.localeCompare(b.name) },
};

const EMPTY_FILTERS = { batch: '', company: '', role: '', featured: '' };

const uniqueSorted = (values) => [...new Set(values.filter(Boolean))].sort((a, b) => a.localeCompare(b, undefined, { numeric: true }));

// Native <select> styled as a "Label: Value ▾" pill
function PillSelect({ label, value, onChange, children, className }) {
  return (
    <label
      className={cn(
        'relative inline-flex h-10 items-center gap-1.5 rounded-md border border-line/10 bg-surface pl-3 pr-8 text-sm transition-colors focus-within:border-orange-500 hover:border-orange-500/60',
        className
      )}
    >
      <span className="text-subtle">{label}:</span>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="max-w-[11rem] cursor-pointer appearance-none truncate bg-transparent font-medium text-ink-2 outline-none [&>option]:bg-surface"
      >
        {children}
      </select>
      <FaChevronDown className="pointer-events-none absolute right-3 text-[10px] text-muted" aria-hidden />
    </label>
  );
}

function Avatar({ person }) {
  if (person.photo) {
    return <Image unoptimized src={person.photo} alt={person.name} width={64} height={64} className="h-16 w-16 shrink-0 rounded-lg object-cover ring-1 ring-line/10" />;
  }
  return (
    <span className="flex h-16 w-16 shrink-0 items-center justify-center rounded-lg border border-line/10 bg-gradient-to-br from-surface-2 to-surface text-xl font-semibold text-orange-600 dark:text-orange-400">
      {person.name.charAt(0)}
    </span>
  );
}

// Directory card; the whole card opens /alumni/<slug> (social icons stay separate links)
// Social icons (everyone) + shared email / phone (signed-in members only)
function ContactRow({ person, signedIn }) {
  const social = SOCIAL.filter(({ key }) => person.links?.[key]);
  const { email, phone } = person.contact || {};
  const chip =
    'relative z-10 flex h-8 items-center justify-center gap-1.5 rounded-md border border-line/10 text-sm text-body transition-colors hover:border-orange-500 hover:bg-orange-500 hover:text-white';
  if (!social.length && !email && !phone && !(person.hasContact && !signedIn)) return null;
  return (
    <div className="mt-3 flex flex-wrap items-center gap-1.5 border-t border-line/10 pt-3">
      {social.map(({ key, label, icon: Icon }) => (
        <a key={key} href={person.links[key]} target="_blank" rel="noopener noreferrer" aria-label={`${person.name} on ${label}`} title={label} className={cn(chip, 'w-8')}>
          <Icon aria-hidden />
        </a>
      ))}
      {email && (
        <a href={`mailto:${email}`} title={email} aria-label={`Email ${person.name}`} className={cn(chip, 'w-8')}>
          <FaEnvelope aria-hidden />
        </a>
      )}
      {phone && (
        <>
          <a href={`tel:${phone.replace(/[^\d+]/g, '')}`} title={formatPhone(phone)} aria-label={`Call ${person.name}`} className={cn(chip, 'px-2.5 text-xs font-medium')}>
            <FaPhoneAlt aria-hidden className="text-[11px]" /> {formatPhone(phone)}
          </a>
          <a href={`https://wa.me/${whatsappNumber(phone)}`} target="_blank" rel="noopener noreferrer" title="WhatsApp" aria-label={`WhatsApp ${person.name}`} className={cn(chip, 'w-8')}>
            <FaWhatsapp aria-hidden />
          </a>
        </>
      )}
      {person.hasContact && !signedIn && (
        <Link href="/login?from=%2Falumni" className="relative z-10 inline-flex items-center gap-1.5 text-xs text-subtle hover:text-orange-600 dark:hover:text-orange-400">
          <FaLock aria-hidden className="text-[10px]" /> Sign in for contact
        </Link>
      )}
    </div>
  );
}

export function AlumniCard({ person, signedIn }) {
  return (
    <div className="group relative flex h-full gap-4 rounded-xl border border-line/10 bg-surface/70 p-4 transition-all duration-300 hover:-translate-y-1 hover:border-orange-500/60 hover:shadow-[0_0_30px_-10px_rgba(249,115,22,0.6)]">
      <Avatar person={person} />
      <div className="min-w-0 flex-1">
        <h3 className="truncate text-base font-semibold text-ink transition-colors group-hover:text-orange-600 dark:group-hover:text-orange-400">
          {person.slug ? (
            <Link href={`/alumni/${person.slug}`} className="after:absolute after:inset-0 after:rounded-xl focus:outline-none">
              {person.name}
            </Link>
          ) : (
            person.name
          )}
        </h3>
        <p className="mt-0.5 text-xs leading-snug text-muted">
          <span className="font-medium text-ink-2">{person.role}</span>
          {person.company && <> <span className="text-orange-500">@</span> {person.company}</>}
        </p>
        {person.location && (
          <p className="mt-1 flex items-center gap-1 truncate text-xs text-subtle">
            <FaMapMarkerAlt className="shrink-0 text-[10px]" aria-hidden /> {person.location}
          </p>
        )}
        <div className="mt-2.5 flex flex-wrap items-center gap-2">
          {person.batch && <span className="rounded border border-line/15 px-1.5 py-0.5 text-[10px] font-semibold text-body">{person.batch}</span>}
          {person.featured && (
            <span className="rounded border border-orange-500/60 bg-orange-500/10 px-1.5 py-0.5 text-[10px] font-semibold text-orange-600 dark:text-orange-400">
              {person.featured}
            </span>
          )}
          {person.openToMentor && (
            <span className="inline-flex items-center gap-1 rounded border border-emerald-500/40 bg-emerald-500/10 px-1.5 py-0.5 text-[10px] font-semibold text-emerald-700 dark:text-emerald-300">
              <FaHandsHelping aria-hidden /> Mentor
            </span>
          )}
        </div>
        <ContactRow person={person} signedIn={signedIn} />
      </div>
    </div>
  );
}

// Searchable, filterable, sortable alumni grid. Pass the list in so it can come from the DB later.
export default function AlumniDirectory({ alumni, signedIn = false }) {
  const [query, setQuery] = useState('');
  const [sort, setSort] = useState('name');
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState(EMPTY_FILTERS);
  const deferredQuery = useDeferredValue(query);

  const options = useMemo(
    () => ({
      batch: uniqueSorted(alumni.map((a) => a.batch)),
      company: uniqueSorted(alumni.map((a) => a.company)),
      role: uniqueSorted(alumni.map((a) => a.role)),
    }),
    [alumni]
  );

  const results = useMemo(() => {
    const q = deferredQuery.trim().toLowerCase();
    return alumni
      .filter((a) => !q || [a.name, a.role, a.company, a.batch, a.featured, a.location].some((v) => v?.toLowerCase().includes(q)))
      .filter((a) => !filters.batch || a.batch === filters.batch)
      .filter((a) => !filters.company || a.company === filters.company)
      .filter((a) => !filters.role || a.role === filters.role)
      .filter((a) => !filters.featured || (filters.featured === 'yes' ? a.featured : !a.featured))
      .sort(SORTS[sort].compare);
  }, [alumni, deferredQuery, filters, sort]);

  const activeFilterCount = Object.values(filters).filter(Boolean).length;
  const setFilter = (key) => (value) => setFilters((f) => ({ ...f, [key]: value }));
  const clearAll = () => {
    setFilters(EMPTY_FILTERS);
    setQuery('');
  };

  return (
    <MotionConfig reducedMotion="user">
      {/* Toolbar */}
      <div className="flex flex-col gap-3 border-b border-line/10 pb-5 md:flex-row md:items-center">
        <div className="relative w-full md:max-w-sm">
          <FaSearch className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm text-subtle" aria-hidden />
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search alumni…"
            aria-label="Search alumni"
            className="h-10 w-full rounded-md border border-line/10 bg-surface pl-9 pr-3 text-sm text-ink-2 outline-none transition-colors placeholder:text-subtle hover:border-orange-500/60 focus:border-orange-500"
          />
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={() => setShowFilters((v) => !v)}
            aria-expanded={showFilters}
            className={cn(
              'inline-flex h-10 items-center gap-2 rounded-md border px-3 text-sm font-medium transition-colors',
              showFilters || activeFilterCount
                ? 'border-orange-500/60 bg-orange-500/10 text-orange-600 dark:text-orange-400'
                : 'border-line/10 bg-surface text-ink-2 hover:border-orange-500/60'
            )}
          >
            <FaSlidersH aria-hidden /> Filters
            {activeFilterCount > 0 && <span className="rounded-full bg-orange-500 px-1.5 text-[10px] text-white">{activeFilterCount}</span>}
            {showFilters ? <FaChevronUp className="text-[10px]" aria-hidden /> : <FaChevronDown className="text-[10px]" aria-hidden />}
          </button>
          <PillSelect label="Sort" value={sort} onChange={setSort}>
            {Object.entries(SORTS).map(([key, s]) => (
              <option key={key} value={key}>{s.label}</option>
            ))}
          </PillSelect>
        </div>
        <p className="text-sm text-subtle md:ml-auto" aria-live="polite">
          {results.length} alumni
        </p>
      </div>

      {/* Filters row */}
      <AnimatePresence initial={false}>
        {showFilters && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25 }}
            className="overflow-hidden"
          >
            <div className="flex flex-wrap items-center gap-3 pt-5">
              <PillSelect label="Batch" value={filters.batch} onChange={setFilter('batch')}>
                <option value="">All</option>
                {options.batch.map((v) => <option key={v} value={v}>{v}</option>)}
              </PillSelect>
              <PillSelect label="Company" value={filters.company} onChange={setFilter('company')}>
                <option value="">All</option>
                {options.company.map((v) => <option key={v} value={v}>{v}</option>)}
              </PillSelect>
              <PillSelect label="Position" value={filters.role} onChange={setFilter('role')}>
                <option value="">All</option>
                {options.role.map((v) => <option key={v} value={v}>{v}</option>)}
              </PillSelect>
              <PillSelect label="Featured" value={filters.featured} onChange={setFilter('featured')}>
                <option value="">All</option>
                <option value="yes">Club leaders</option>
                <option value="no">Others</option>
              </PillSelect>
              {activeFilterCount > 0 && (
                <button type="button" onClick={() => setFilters(EMPTY_FILTERS)} className="inline-flex items-center gap-1.5 text-sm text-orange-600 dark:text-orange-400 hover:text-orange-700 dark:hover:text-orange-300">
                  <FaTimes aria-hidden /> Clear filters
                </button>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Grid */}
      {results.length > 0 ? (
        <motion.ul
          className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3"
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
        >
          {/* initial={false}: the grid fades in as a whole; cards animate individually when filters change */}
          <AnimatePresence mode="popLayout" initial={false}>
            {results.map((person) => (
              <motion.li
                key={person.id}
                layout
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ duration: 0.3 }}
              >
                <AlumniCard person={person} signedIn={signedIn} />
              </motion.li>
            ))}
          </AnimatePresence>
        </motion.ul>
      ) : (
        <div className="mt-6 flex flex-col items-center rounded-xl border border-dashed border-line/15 py-16 text-center">
          <FaUserGraduate className="text-4xl text-orange-500/70" aria-hidden />
          <p className="mt-4 text-body">No alumni match your search.</p>
          <button type="button" onClick={clearAll} className="mt-3 text-sm font-medium text-orange-600 dark:text-orange-400 hover:text-orange-700 dark:hover:text-orange-300">
            Clear search &amp; filters
          </button>
        </div>
      )}
    </MotionConfig>
  );
}
