import Spinner from '@/components/ui/Spinner';
import EmptyState from '@/components/ui/EmptyState';
import { cn } from '@/lib/utils';

/**
 * Generic table.
 *   columns = [{ key: 'name', header: 'Name', render?: (row) => node, className? }]
 */
export default function DataTable({ columns, rows = [], loading, rowKey = '_id', onRowClick, emptyTitle = 'No records found', emptyDescription }) {
  if (loading) return <Spinner label="Loading…" />;
  if (!rows.length) return <EmptyState title={emptyTitle} description={emptyDescription} />;

  return (
    <div className="overflow-x-auto">
      <table className="min-w-full divide-y divide-gray-200 text-sm">
        <thead className="bg-gray-50">
          <tr>
            {columns.map((col) => (
              <th key={col.key} scope="col" className={cn('whitespace-nowrap px-4 py-3 text-left font-semibold text-gray-600', col.className)}>
                {col.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100 bg-white">
          {rows.map((row, index) => (
            <tr
              key={row[rowKey] ?? index}
              onClick={onRowClick ? () => onRowClick(row) : undefined}
              className={cn(onRowClick && 'cursor-pointer hover:bg-gray-50')}
            >
              {columns.map((col) => (
                <td key={col.key} className={cn('px-4 py-3 text-gray-700', col.className)}>
                  {col.render ? col.render(row) : row[col.key]}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
