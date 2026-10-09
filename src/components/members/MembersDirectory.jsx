'use client';
import { useEffect, useMemo, useState } from 'react';
import { FaUsers, FaMale, FaFemale, FaPhoneAlt, FaWhatsapp, FaEnvelope, FaFacebookF, FaLock, FaSearch, FaTint } from 'react-icons/fa';
import { apiSecure, apiError } from '@/lib/api-client';
import { cn, formatPhone } from '@/lib/utils';
import StatCard, { StatGrid } from '@/components/dashboard/StatCard';
import Alert from '@/components/ui/Alert';
import Skeleton from '@/components/ui/Skeleton';

const SHIFT = { day: 'Day', evening: 'Evening' };
const GENDERS = [
  { value: '', label: 'All' },
  { value: 'male', label: 'Male' },
  { value: 'female', label: 'Female' },
];
const tel = (phone) => phone.replace(/[^\d+]/g, '');
const whatsapp = (phone) => phone.replace(/\D/g, '').replace(/^0(?=1)/, '880');

function Avatar({ member }) {
  if (member.photo) {
    // eslint-disable-next-line @next/next/no-img-element -- member-supplied photo URL
    return <img src={member.photo} alt="" className="h-12 w-12 shrink-0 rounded-full object-cover" />;
  }
  return (
    <span
      className={cn(
        'flex h-12 w-12 shrink-0 items-center justify-center rounded-full text-base font-semibold text-white',
        member.gender === 'female' ? 'bg-gradient-to-br from-pink-500 to-rose-500' : 'bg-gradient-to-br from-red-600 to-orange-500'
      )}
    >
      {member.name.charAt(0)}
    </span>
  );
}

function MemberCard({ m }) {
  const chip = 'inline-flex h-8 items-center gap-1.5 rounded-md border border-line/10 px-2.5 text-xs font-medium text-body transition-colors hover:border-primary-500 hover:text-ink';
  return (
    <li className="flex flex-col rounded-xl border border-line/10 bg-surface p-4">
      <div className="flex items-start gap-3">
        <Avatar member={m} />
        <div className="min-w-0">
          <p className="truncate font-semibold text-ink">{m.name}</p>
          <p className="text-xs text-muted">
            {m.batch}
            {m.shift && ` · ${SHIFT[m.shift]}`}
            {m.studentId && ` · ID ${m.studentId}`}
          </p>
          <p className="truncate text-xs text-subtle">{m.department}</p>
        </div>
      </div>
      <div className="mt-2 flex flex-wrap gap-1.5 text-[11px]">
        {m.gender && (
          <span className={cn('rounded-full px-2 py-0.5 font-medium', m.gender === 'female' ? 'bg-pink-500/10 text-pink-700 dark:text-pink-300' : 'bg-blue-500/10 text-blue-700 dark:text-blue-300')}>
            {m.gender === 'female' ? 'Female' : 'Male'}
          </span>
        )}
        {m.bloodGroup && (
          <span className="inline-flex items-center gap-1 rounded-full bg-red-500/10 px-2 py-0.5 font-medium text-red-700 dark:text-red-300">
            <FaTint aria-hidden className="text-[9px]" /> {m.bloodGroup}
          </span>
        )}
      </div>
      <div className="mt-auto pt-3">
        {m.contactHidden ? (
          <p className="flex items-center gap-1.5 text-xs text-subtle"><FaLock aria-hidden className="text-[10px]" /> Contact details are private</p>
        ) : (
          <div className="flex flex-wrap gap-1.5">
            {m.phone && (
              <>
                <a href={`tel:${tel(m.phone)}`} className={chip}><FaPhoneAlt aria-hidden className="text-[10px]" /> {formatPhone(m.phone)}</a>
                <a href={`https://wa.me/${whatsapp(m.phone)}`} target="_blank" rel="noopener noreferrer" aria-label={`WhatsApp ${m.name}`} title="WhatsApp" className={chip}><FaWhatsapp aria-hidden /></a>
              </>
            )}
            {m.email && <a href={`mailto:${m.email}`} aria-label={`Email ${m.name}`} title={m.email} className={chip}><FaEnvelope aria-hidden /></a>}
            {m.facebook && <a href={m.facebook} target="_blank" rel="noopener noreferrer" aria-label={`${m.name} on Facebook`} title="Facebook" className={chip}><FaFacebookF aria-hidden /></a>}
          </div>
        )}
      </div>
    </li>
  );
}

// Current club members with batch / gender filters. The server decides which contact details are sent.
export default function MembersDirectory() {
  const [data, setData] = useState(null);
  const [error, setError] = useState('');
  const [batch, setBatch] = useState('');
  const [gender, setGender] = useState('');
  const [search, setSearch] = useState('');

  useEffect(() => {
    let active = true;
    apiSecure
      .get('/members')
      .then((res) => active && setData(res.data.data))
      .catch((err) => active && setError(apiError(err, 'Could not load the member list.')));
    return () => {
      active = false;
    };
  }, []);

  const shown = useMemo(() => {
    if (!data) return [];
    const q = search.toLowerCase();
    return data.members.filter(
      (m) =>
        (!batch || m.batch === batch) &&
        (!gender || m.gender === gender) &&
        (!q || [m.name, m.studentId, m.department, m.batch].some((f) => f?.toLowerCase().includes(q)))
    );
  }, [data, batch, gender, search]);

  if (error) return <Alert type="info">{error}</Alert>;

  const s = data?.stats || {};
  return (
    <>
      <StatGrid>
        <StatCard label="Club members" value={s.total} icon={FaUsers} loading={!data} />
        <StatCard label="Male" value={s.male} icon={FaMale} tone="gray" loading={!data} />
        <StatCard label="Female" value={s.female} icon={FaFemale} tone="red" loading={!data} />
        <StatCard label="Batches" value={data?.batches.length} icon={FaUsers} tone="amber" loading={!data} />
      </StatGrid>

      {data && !data.viewer.seesAll && (
        <p className="mb-4 flex items-center gap-2 text-xs text-subtle">
          <FaLock aria-hidden /> For privacy, female members’ phone numbers and contact details are only visible to female members and admins.
        </p>
      )}

      <div className="mb-4 flex flex-col gap-3 rounded-xl border border-line/10 bg-surface p-3 md:flex-row md:items-center">
        <label className="relative flex-1">
          <FaSearch className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-xs text-faint" aria-hidden />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search name, ID, department…"
            className="h-10 w-full rounded-lg border border-line/15 bg-canvas pl-8 pr-3 text-sm text-ink placeholder-faint focus:border-primary-500 focus:outline-none"
          />
        </label>
        <select value={batch} onChange={(e) => setBatch(e.target.value)} aria-label="Batch" className="h-10 rounded-lg border border-line/15 bg-canvas px-3 text-sm text-ink focus:border-primary-500 focus:outline-none">
          <option value="">All batches</option>
          {data?.batches.map((b) => <option key={b} value={b}>{b}</option>)}
        </select>
        <div className="flex rounded-lg border border-line/15 p-0.5" role="radiogroup" aria-label="Gender">
          {GENDERS.map((g) => (
            <button
              key={g.value}
              type="button"
              role="radio"
              aria-checked={gender === g.value}
              onClick={() => setGender(g.value)}
              className={cn('h-9 flex-1 rounded-md px-4 text-sm font-medium transition-colors md:flex-none', gender === g.value ? 'bg-primary-600 text-white' : 'text-muted hover:text-ink')}
            >
              {g.label}
            </button>
          ))}
        </div>
      </div>

      {!data ? (
        <ul className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">{Array.from({ length: 6 }, (_, i) => <Skeleton key={i} className="h-36 rounded-xl" />)}</ul>
      ) : shown.length ? (
        <>
          <p className="mb-3 text-xs text-subtle">{shown.length} member{shown.length === 1 ? '' : 's'}</p>
          <ul className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">{shown.map((m) => <MemberCard key={m._id} m={m} />)}</ul>
        </>
      ) : (
        <p className="rounded-xl border border-dashed border-line/15 py-12 text-center text-sm text-subtle">No members match these filters.</p>
      )}
    </>
  );
}
