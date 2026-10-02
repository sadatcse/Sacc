// Horizontal bar list — e.g. traffic sources or top countries.
// items = [{ label, value }]
export default function BarList({ items = [], emptyText = 'No data yet' }) {
  const max = Math.max(1, ...items.map((i) => i.value));
  const total = items.reduce((sum, i) => sum + i.value, 0);
  if (!items.length || total === 0) return <p className="py-6 text-center text-sm text-gray-400">{emptyText}</p>;

  return (
    <ul className="space-y-3">
      {items.map((item) => (
        <li key={item.label}>
          <div className="mb-1 flex justify-between text-sm">
            <span className="text-gray-700">{item.label}</span>
            <span className="font-medium text-gray-900">
              {item.value} <span className="text-xs text-gray-400">({Math.round((item.value / total) * 100)}%)</span>
            </span>
          </div>
          <div className="h-2 rounded-full bg-gray-100">
            <div className="h-2 rounded-full bg-primary-500" style={{ width: `${(item.value / max) * 100}%` }} />
          </div>
        </li>
      ))}
    </ul>
  );
}
