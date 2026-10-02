import { cn } from '@/lib/utils';

const TYPES = {
  success: 'border-green-200 bg-green-50 text-green-800',
  error: 'border-red-200 bg-red-50 text-red-800',
  info: 'border-blue-200 bg-blue-50 text-blue-800',
};

export default function Alert({ type = 'info', children, className }) {
  if (!children) return null;
  return (
    <div role="alert" className={cn('rounded-lg border px-4 py-3 text-sm', TYPES[type], className)}>
      {children}
    </div>
  );
}
