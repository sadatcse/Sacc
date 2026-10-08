// Horizontal bar list — e.g. traffic sources or top countries.
// items = [{ label, value }]
export default function BarList({ items = [], emptyText = 'No data yet' }) {
  const max = Math.max(1, ...items.map((i) => i.value));
  const total = items.reduce((sum, i) => sum + i.value, 0);
  if (!items.length || total === 0) return <p className="py-6 text-center text-sm text-faint">{emptyText}</p>;

  return (
    <ul className="space-y-3">
      {items.map((item) => (
        <li key={item.label}>
          <div className="mb-1 flex justify-between text-sm">
            <span className="text-body">{item.label}</span>
            <span className="font-medium text-ink">
              {item.value} <span className="text-xs text-faint">({Math.round((item.value / total) * 100)}%)</span>
            </span>
          </div>
          <div className="h-2 rounded-full bg-surface-2">
            <div className="h-2 rounded-full bg-primary-500" style={{ width: `${(item.value / max) * 100}%` }} />
          </div>
        </li>
      ))}
    </ul>
  );
}
