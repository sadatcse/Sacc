import { cn } from '@/lib/utils';

const COLORS = {
  gray: 'bg-surface-2 text-body',
  blue: 'bg-blue-100 text-blue-700 dark:bg-blue-500/15 dark:text-blue-300',
  green: 'bg-green-100 text-green-700 dark:bg-green-500/15 dark:text-green-300',
  amber: 'bg-amber-100 text-amber-800 dark:bg-amber-500/15 dark:text-amber-300',
  red: 'bg-red-100 text-red-700 dark:bg-red-500/15 dark:text-red-300',
};

export default function Badge({ color = 'gray', children, className }) {
  return (
    <span className={cn('inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium capitalize', COLORS[color], className)}>
      {children}
    </span>
  );
}
