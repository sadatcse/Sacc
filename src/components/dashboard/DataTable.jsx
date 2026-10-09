import { TableRowsSkeleton } from '@/components/loading/PageSkeletons';
import EmptyState from '@/components/ui/EmptyState';
import { cn } from '@/lib/utils';

/**
 * Generic table. On phones (< md) every row becomes a card: the first column is the card's
 * title and the rest are shown as "Header: value" lines.
 *   columns = [{ key: 'name', header: 'Name', render?: (row) => node, className?, hideOnMobile? }]
 */
export default function DataTable({ columns, rows = [], loading, rowKey = '_id', onRowClick, emptyTitle = 'No records found', emptyDescription }) {
  if (loading) return <TableRowsSkeleton rows={6} cols={Math.min(columns.length, 5)} />;
  if (!rows.length) return <EmptyState title={emptyTitle} description={emptyDescription} />;

  const cell = (col, row) => (col.render ? col.render(row) : row[col.key]);
  const [first, ...rest] = columns;

  return (
    <>
      {/* Phones: cards */}
      <ul className="divide-y divide-line/5 md:hidden">
        {rows.map((row, index) => (
          <li key={row[rowKey] ?? index}>
            <div
              role={onRowClick ? 'button' : undefined}
              tabIndex={onRowClick ? 0 : undefined}
              onClick={onRowClick ? () => onRowClick(row) : undefined}
              onKeyDown={onRowClick ? (e) => (e.key === 'Enter' || e.key === ' ') && onRowClick(row) : undefined}
              className={cn('space-y-2 px-4 py-4 text-sm', onRowClick && 'cursor-pointer active:bg-line/5')}
            >
              <div className="text-body">{cell(first, row)}</div>
              <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-1.5">
                {rest
                  .filter((col) => !col.hideOnMobile && col.header)
                  .map((col) => (
                    <div key={col.key} className="contents">
                      <dt className="text-xs text-subtle">{col.header}</dt>
                      <dd className="min-w-0 text-body">{cell(col, row)}</dd>
                    </div>
                  ))}
              </dl>
            </div>
          </li>
        ))}
      </ul>

      {/* Tablets & desktops: table */}
      <div className="hidden overflow-x-auto md:block">
        <table className="min-w-full divide-y divide-line/10 text-sm">
          <thead className="bg-canvas">
            <tr>
              {columns.map((col) => (
                <th key={col.key} scope="col" className={cn('whitespace-nowrap px-4 py-3 text-left font-semibold text-muted', col.className)}>
                  {col.header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-line/5 bg-surface">
            {rows.map((row, index) => (
              <tr
                key={row[rowKey] ?? index}
                onClick={onRowClick ? () => onRowClick(row) : undefined}
                className={cn(onRowClick && 'cursor-pointer hover:bg-line/5')}
              >
                {columns.map((col) => (
                  <td key={col.key} className={cn('px-4 py-3 text-body', col.className)}>
                    {cell(col, row)}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}
