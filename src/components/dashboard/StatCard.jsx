import { cn } from '@/lib/utils';
import Skeleton from '@/components/ui/Skeleton';

const TONES = {
  blue: 'bg-blue-50 text-blue-600 dark:bg-blue-500/15 dark:text-blue-400',
  green: 'bg-green-50 text-green-600 dark:bg-green-500/15 dark:text-green-400',
  amber: 'bg-amber-50 text-amber-600 dark:bg-amber-500/15 dark:text-amber-400',
  red: 'bg-red-50 text-red-600 dark:bg-red-500/15 dark:text-red-400',
  gray: 'bg-surface-2 text-muted',
};

export default function StatCard({ label, value, icon: Icon, tone = 'blue', hint, loading }) {
  return (
    <div className="rounded-xl border border-line/10 bg-surface p-3.5 shadow-sm sm:p-5">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs text-subtle sm:text-sm">{label}</p>
          {loading ? <Skeleton className="mt-2 h-7 w-14" /> : <p className="mt-1 text-xl font-bold text-ink sm:text-2xl">{value ?? 0}</p>}
          {hint && <p className="mt-1 text-xs text-faint">{hint}</p>}
        </div>
        {Icon && (
          <span className={cn('hidden shrink-0 rounded-lg p-2.5 min-[420px]:block', TONES[tone])}>
            <Icon className="text-xl" />
          </span>
        )}
      </div>
    </div>
  );
}

export function StatGrid({ children, cols = 4 }) {
  const colClass = { 2: 'lg:grid-cols-2', 3: 'lg:grid-cols-3', 4: 'lg:grid-cols-4', 6: 'lg:grid-cols-6' }[cols];
  return <div className={cn('mb-6 grid grid-cols-2 gap-3 sm:gap-4', colClass)}>{children}</div>;
}
