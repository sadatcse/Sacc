import { cn } from '@/lib/utils';

const TONES = {
  blue: 'bg-blue-50 text-blue-600',
  green: 'bg-green-50 text-green-600',
  amber: 'bg-amber-50 text-amber-600',
  red: 'bg-red-50 text-red-600',
  gray: 'bg-gray-100 text-gray-600',
};

export default function StatCard({ label, value, icon: Icon, tone = 'blue', hint, loading }) {
  return (
    <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm text-gray-500">{label}</p>
          <p className="mt-1 text-2xl font-bold text-gray-900">{loading ? '…' : value ?? 0}</p>
          {hint && <p className="mt-1 text-xs text-gray-400">{hint}</p>}
        </div>
        {Icon && (
          <span className={cn('shrink-0 rounded-lg p-2.5', TONES[tone])}>
            <Icon className="text-xl" />
          </span>
        )}
      </div>
    </div>
  );
}

export function StatGrid({ children, cols = 4 }) {
  const colClass = { 2: 'lg:grid-cols-2', 3: 'lg:grid-cols-3', 4: 'lg:grid-cols-4', 6: 'lg:grid-cols-6' }[cols];
  return <div className={cn('mb-6 grid gap-4 sm:grid-cols-2', colClass)}>{children}</div>;
}
