'use client';
import { useState } from 'react';
import { FaFileCsv, FaFileExcel, FaFilePdf } from 'react-icons/fa';
import { exportTable } from '@/lib/export';
import { cn } from '@/lib/utils';

const FORMATS = [
  { value: 'csv', label: 'CSV', icon: FaFileCsv },
  { value: 'xlsx', label: 'Excel', icon: FaFileExcel },
  { value: 'pdf', label: 'PDF', icon: FaFilePdf },
];

/**
 * CSV / Excel / PDF download buttons.
 *   <ExportButtons filename="club-members" title="Club members" load={async () => ({ columns, rows })} />
 * `load` may be async (e.g. fetch full details first). PDF opens the print dialog → "Save as PDF".
 */
export default function ExportButtons({ filename, title, load, disabled, className }) {
  const [busy, setBusy] = useState('');
  const [error, setError] = useState('');

  const run = async (format) => {
    setBusy(format);
    setError('');
    // Open the PDF window right away (inside the click) so pop-up blockers allow it
    const win = format === 'pdf' ? window.open('', '_blank') : null;
    try {
      if (format === 'pdf' && !win) throw new Error('Allow pop-ups for this site to create the PDF.');
      const { columns, rows } = await load();
      exportTable(format, { filename, title, columns, rows, win });
    } catch (err) {
      win?.close();
      setError(err?.response?.data?.message || err.message || 'Export failed.');
    } finally {
      setBusy('');
    }
  };

  return (
    <div className={cn('flex flex-col items-end gap-1', className)}>
      <div className="inline-flex overflow-hidden rounded-lg border border-line/20 bg-surface" role="group" aria-label={`Download ${title}`}>
        <span className="hidden items-center px-3 text-xs font-medium text-subtle sm:flex">Download</span>
        {FORMATS.map(({ value, label, icon: Icon }) => (
          <button
            key={value}
            type="button"
            onClick={() => run(value)}
            disabled={disabled || Boolean(busy)}
            title={value === 'pdf' ? 'Opens the print dialog — choose “Save as PDF”' : `Download ${label}`}
            className="inline-flex items-center gap-1.5 border-l border-line/20 px-3 py-2 text-sm font-medium text-body transition-colors first:border-l-0 hover:bg-line/5 disabled:cursor-not-allowed disabled:opacity-60 sm:first:border-l"
          >
            <Icon aria-hidden className={value === 'pdf' ? 'text-red-500' : value === 'xlsx' ? 'text-green-600' : 'text-blue-500'} />
            {busy === value ? '…' : label}
          </button>
        ))}
      </div>
      {error && <p role="alert" className="text-xs text-red-600 dark:text-red-400">{error}</p>}
    </div>
  );
}
