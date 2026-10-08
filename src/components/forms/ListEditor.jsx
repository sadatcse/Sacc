'use client';
import { FaArrowDown, FaArrowUp, FaPlus, FaTrash } from 'react-icons/fa';
import { cn } from '@/lib/utils';

const inputClass =
  'w-full rounded-lg border border-line/20 bg-surface px-3 py-2 text-sm text-ink placeholder-faint focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-100 dark:focus:ring-primary-500/20';

/**
 * Editable list of small records (stats, timeline items, …).
 *   <ListEditor items={rows} onChange={setRows} columns={[{ key: 'year', label: 'Year', className: 'w-24' }, { key: 'text', label: 'Text', multiline: true }]} />
 */
export default function ListEditor({ items = [], onChange, columns, addLabel = 'Add row', max = 50, disabled }) {
  const update = (index, key, value) => onChange(items.map((row, i) => (i === index ? { ...row, [key]: value } : row)));
  const move = (index, step) => {
    const next = [...items];
    [next[index], next[index + step]] = [next[index + step], next[index]];
    onChange(next);
  };
  const remove = (index) => onChange(items.filter((_, i) => i !== index));
  const add = () => onChange([...items, Object.fromEntries(columns.map((c) => [c.key, '']))]);

  const iconButton = 'rounded p-1.5 text-faint hover:bg-line/10 hover:text-body disabled:opacity-30';

  return (
    <div className="space-y-3">
      {items.map((row, index) => (
        <div key={index} className="flex gap-3 rounded-lg border border-line/10 bg-canvas p-3">
          <div className="flex flex-1 flex-wrap gap-3">
            {columns.map((col) => {
              const Tag = col.multiline ? 'textarea' : 'input';
              return (
                <label key={col.key} className={cn('min-w-[8rem] flex-1', col.className)}>
                  <span className="mb-1 block text-xs font-medium text-subtle">{col.label}</span>
                  <Tag
                    value={row[col.key] ?? ''}
                    onChange={(e) => update(index, col.key, e.target.value)}
                    placeholder={col.placeholder}
                    rows={col.multiline ? 2 : undefined}
                    disabled={disabled}
                    className={inputClass}
                  />
                </label>
              );
            })}
          </div>
          <div className="flex flex-col justify-center gap-1">
            <button type="button" className={iconButton} onClick={() => move(index, -1)} disabled={disabled || index === 0} aria-label="Move up"><FaArrowUp /></button>
            <button type="button" className={iconButton} onClick={() => move(index, 1)} disabled={disabled || index === items.length - 1} aria-label="Move down"><FaArrowDown /></button>
            <button type="button" className={cn(iconButton, 'hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-500/10')} onClick={() => remove(index)} disabled={disabled} aria-label="Remove"><FaTrash /></button>
          </div>
        </div>
      ))}
      {items.length < max && (
        <button
          type="button"
          onClick={add}
          disabled={disabled}
          className="flex w-full items-center justify-center gap-2 rounded-lg border border-dashed border-line/20 py-2.5 text-sm font-medium text-subtle hover:border-primary-500 hover:text-primary-600 dark:hover:text-primary-400"
        >
          <FaPlus /> {addLabel}
        </button>
      )}
    </div>
  );
}
