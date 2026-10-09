import { cn } from '@/lib/utils';

const TYPES = {
  success: 'border-green-200 bg-green-50 text-green-800 dark:border-green-500/30 dark:bg-green-500/10 dark:text-green-200',
  error: 'border-red-200 bg-red-50 text-red-800 dark:border-red-500/30 dark:bg-red-500/10 dark:text-red-200',
  info: 'border-blue-200 bg-blue-50 text-blue-800 dark:border-blue-500/30 dark:bg-blue-500/10 dark:text-blue-200',
  warning: 'border-amber-200 bg-amber-50 text-amber-800 dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-200',
};

export default function Alert({ type = 'info', children, className }) {
  if (!children) return null;
  return (
    <div role="alert" className={cn('rounded-lg border px-4 py-3 text-sm', TYPES[type], className)}>
      {children}
    </div>
  );
}
