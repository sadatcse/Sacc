'use client';
import { useMemo, useState } from 'react';
import Link from 'next/link';
import { FaPlus, FaExternalLinkAlt } from 'react-icons/fa';
import useApi from '@/hooks/useApi';
import { SOCIAL_LINKS } from '@/config/socialLinks';
import { apiSecure } from '@/lib/api-client';
import PageTitle from '@/components/dashboard/PageTitle';
import DataTable from '@/components/dashboard/DataTable';
import CrudModal from '@/components/dashboard/CrudModal';
import Card from '@/components/ui/Card';
import Badge from '@/components/ui/Badge';
import Button from '@/components/ui/Button';
import Alert from '@/components/ui/Alert';

const KIND_OPTIONS = [{ value: 'student', label: 'Student' }, { value: 'faculty', label: 'Faculty' }];
const SHIFT_OPTIONS = [{ value: '', label: 'Choose…' }, { value: 'day', label: 'Day' }, { value: 'evening', label: 'Evening' }];
const SHIFT_LABELS = { day: 'Day', evening: 'Evening' };

// Students need ID, batch, department and shift; faculty need department and designation
const personFields = (values) => [
  { name: 'kind', label: 'Type', type: 'select', options: KIND_OPTIONS, required: true },
  { name: 'name', label: 'Full name', required: true },
  ...(values.kind === 'faculty'
    ? [
        { name: 'designation', label: 'Designation', required: true, placeholder: 'Assistant Professor' },
        { name: 'department', label: 'Department', required: true, placeholder: 'Computer Science & Engineering' },
        { name: 'employeeId', label: 'Employee ID', placeholder: '0012501' },
        { name: 'school', label: 'School', placeholder: 'School of Engineering' },
        { name: 'office', label: 'Office', placeholder: 'Office of the IT' },
        { name: 'officePhone', label: 'Office phone', placeholder: '09614008008 Ext. 1015', help: 'Shown on the public profile.' },
      ]
    : [
        { name: 'studentId', label: 'Student ID', required: true, placeholder: '221000101' },
        { name: 'batch', label: 'Batch', required: true, placeholder: 'CSE 22' },
        { name: 'department', label: 'Department', required: true, placeholder: 'Computer Science & Engineering' },
        { name: 'shift', label: 'Shift', type: 'select', options: SHIFT_OPTIONS, required: true },
      ]),
  { type: 'heading', label: 'Private contact (admins only)' },
  { name: 'phone', label: 'Cell phone', type: 'tel', placeholder: '01XXXXXXXXX', help: 'Never shown on the website.' },
  { name: 'personalEmail', label: 'Personal email', type: 'email', help: 'Never shown on the website.' },
  { type: 'heading', label: 'Profile' },
  { name: 'slug', label: 'URL slug', placeholder: 'auto from name', help: 'Profile URL: /executives/<slug>' },
  { name: 'photo', label: 'Photo URL', type: 'url' },
  { name: 'bio', label: 'Bio', type: 'textarea', rows: 3 },
  { type: 'heading', label: 'Links (public)' },
  ...SOCIAL_LINKS.map((l) => ({
    name: `links.${l.key}`,
    label: l.key === 'email' ? 'Official email (public)' : l.label,
    type: l.key === 'email' ? 'email' : 'url',
  })),
];

const TYPE_OPTIONS = [{ value: 'executive', label: 'Student Executive' }, { value: 'advisor', label: 'Faculty Advisor' }];

const positionFields = (people) => [
  { name: 'executive', label: 'Person', type: 'select', required: true, options: [{ value: '', label: 'Choose…' }, ...people.map((p) => ({ value: p._id, label: p.name }))] },
  { name: 'role', label: 'Role', required: true, placeholder: 'President' },
  { name: 'year', label: 'Year', type: 'number', required: true },
  { name: 'type', label: 'Type', type: 'select', options: TYPE_OPTIONS },
  { name: 'order', label: 'Display order', type: 'number', help: 'Lower numbers show first (President = 0).' },
];

// Highlights required details that haven't been filled in yet
function Missing() {
  return <span className="text-xs font-medium text-red-500">missing</span>;
}

export default function ExecutivesManager() {
  const people = useApi('/executives?all=1', { initialData: [], select: (res) => res.data || [] });
  const positions = useApi('/committee', { initialData: [], select: (res) => res.data || [] });
  const years = useMemo(() => [...new Set(positions.data.map((p) => p.year))].sort((a, b) => b - a), [positions.data]);
  const [chosenYear, setYear] = useState(null);
  const year = chosenYear ?? years[0] ?? new Date().getFullYear();
  const [editingPerson, setEditingPerson] = useState(null);
  const [editingPosition, setEditingPosition] = useState(null);

  const committee = positions.data.filter((p) => p.year === year).sort((a, b) => a.order - b.order);

  const savePerson = async (values) => {
    const res = editingPerson._id
      ? await apiSecure.patch(`/executives/${editingPerson._id}`, values)
      : await apiSecure.post('/executives', values);
    setEditingPerson(null);
    await Promise.all([people.reload(), positions.reload()]);
    return res;
  };

  const removePerson = async () => {
    await apiSecure.delete(`/executives/${editingPerson._id}`);
    setEditingPerson(null);
    await Promise.all([people.reload(), positions.reload()]);
  };

  const savePosition = async (values) => {
    const body = { ...values, year: Number(values.year), order: Number(values.order) || 0 };
    if (editingPosition._id) await apiSecure.patch(`/committee/${editingPosition._id}`, body);
    else await apiSecure.post('/committee', body);
    setEditingPosition(null);
    setYear(body.year);
    await Promise.all([positions.reload(), people.reload()]);
  };

  const removePosition = async () => {
    await apiSecure.delete(`/committee/${editingPosition._id}`);
    setEditingPosition(null);
    await Promise.all([positions.reload(), people.reload()]);
  };

  const positionColumns = [
    { key: 'order', header: '#', className: 'w-12 text-faint' },
    { key: 'person', header: 'Person', render: (p) => <span className="font-medium text-ink">{p.executive?.name || '—'}</span> },
    { key: 'role', header: 'Role' },
    { key: 'type', header: 'Type', render: (p) => <Badge color={p.type === 'advisor' ? 'amber' : 'blue'}>{p.type}</Badge> },
  ];

  const peopleColumns = [
    {
      key: 'name',
      header: 'Name',
      render: (p) => (
        <div>
          <p className="font-medium text-ink">{p.name}</p>
          <p className="text-xs text-subtle">/executives/{p.slug}</p>
        </div>
      ),
    },
    { key: 'kind', header: 'Type', render: (p) => <Badge color={p.kind === 'faculty' ? 'amber' : 'blue'}>{p.kind === 'faculty' ? 'Faculty' : 'Student'}</Badge> },
    { key: 'studentId', header: 'ID / Designation', render: (p) => (p.kind === 'faculty' ? p.designation : p.studentId) || <Missing /> },
    { key: 'batch', header: 'Batch', render: (p) => (p.kind === 'faculty' ? '—' : p.batch || <Missing />) },
    { key: 'department', header: 'Department', render: (p) => p.department || <Missing /> },
    { key: 'shift', header: 'Shift', render: (p) => (p.kind === 'faculty' ? '—' : SHIFT_LABELS[p.shift] || <Missing />) },
    { key: 'years', header: 'Years served', render: (p) => (p.years?.length ? p.years.join(', ') : <span className="text-faint">none</span>) },
  ];

  return (
    <>
      <PageTitle
        title="Executives"
        description="Committee members per year, and the people who served."
        actions={
          <>
            <Button variant="secondary" onClick={() => setEditingPerson({ kind: 'student', shift: '' })}><FaPlus /> Add person</Button>
            <Button onClick={() => setEditingPosition({ year, type: 'executive', order: committee.length })} disabled={!people.data.length}>
              <FaPlus /> Add to committee
            </Button>
          </>
        }
      />

      <Alert type="error" className="mb-4">{people.error || positions.error}</Alert>

      <Card
        className="mb-6 p-0"
        title={
          <span className="flex flex-wrap items-center gap-3 px-5 pt-5">
            Committee
            <select
              value={year}
              onChange={(e) => setYear(Number(e.target.value))}
              className="rounded-lg border border-line/20 px-2 py-1 text-sm font-normal"
              aria-label="Committee year"
            >
              {[...new Set([...years, year])].sort((a, b) => b - a).map((y) => <option key={y} value={y}>{y}</option>)}
            </select>
            <Link href={`/executives?year=${year}`} target="_blank" className="flex items-center gap-1 text-xs font-normal text-primary-600 dark:text-primary-400 hover:underline">
              View page <FaExternalLinkAlt className="text-[10px]" />
            </Link>
          </span>
        }
      >
        <DataTable
          columns={positionColumns}
          rows={committee}
          loading={positions.loading}
          onRowClick={(p) => setEditingPosition({ ...p, executive: p.executive?._id })}
          emptyTitle={`No committee for ${year} yet`}
          emptyDescription="Use “Add to committee” to assign people to roles."
        />
      </Card>

      <Card className="p-0" title={<span className="block px-5 pt-5">People ({people.data.length})</span>}>
        <DataTable columns={peopleColumns} rows={people.data} loading={people.loading} onRowClick={(p) => setEditingPerson(p)} emptyTitle="No people yet" />
      </Card>

      {editingPerson && (
        <CrudModal
          key={editingPerson._id || 'new-person'}
          open
          title={editingPerson._id ? `Edit ${editingPerson.name}` : 'Add person'}
          fields={personFields}
          initial={{ kind: 'student', ...editingPerson }}
          onSubmit={savePerson}
          onDelete={editingPerson._id ? removePerson : undefined}
          deleteLabel="Delete person"
          deleteMessage="This also removes every committee position they held."
          onClose={() => setEditingPerson(null)}
        />
      )}

      {editingPosition && (
        <CrudModal
          key={editingPosition._id || 'new-position'}
          open
          title={editingPosition._id ? 'Edit committee position' : `Add to ${year} committee`}
          fields={positionFields(people.data)}
          initial={editingPosition}
          onSubmit={savePosition}
          onDelete={editingPosition._id ? removePosition : undefined}
          deleteLabel="Remove from committee"
          onClose={() => setEditingPosition(null)}
        />
      )}
    </>
  );
}
