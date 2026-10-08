import { FiSearch } from 'react-icons/fi';

/**
 * Search box + any number of dropdown filters.
 *   filters = [{ key, value, onChange, options: [{ value, label }] }]
 */
export default function FilterBar({ search, onSearch, placeholder = 'Search…', filters = [] }) {
  return (
    <div className="flex flex-col gap-3 border-b border-line/10 p-4 sm:flex-row sm:items-center">
      <div className="relative flex-1">
        <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-faint" />
        <input
          type="search"
          value={search}
          onChange={(e) => onSearch(e.target.value)}
          placeholder={placeholder}
          className="w-full rounded-lg border border-line/20 bg-surface py-2 pl-9 pr-3 text-sm focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-100 dark:focus:ring-primary-500/20"
        />
      </div>
      {filters.map((f) => (
        <select
          key={f.key}
          value={f.value}
          onChange={(e) => f.onChange(e.target.value)}
          className="rounded-lg border border-line/20 bg-surface px-3 py-2 text-sm focus:border-primary-500 focus:outline-none"
          aria-label={f.key}
        >
          {f.options.map((opt) => (
            <option key={opt.value} value={opt.value}>{opt.label}</option>
          ))}
        </select>
      ))}
    </div>
  );
}
