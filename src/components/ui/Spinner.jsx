import { cn } from '@/lib/utils';

export default function Spinner({ className, label }) {
  return (
    <div className={cn('flex flex-col items-center justify-center gap-3 py-10', className)} role="status">
      <div className="h-8 w-8 animate-spin rounded-full border-4 border-line/10 border-t-primary-600" />
      {label && <p className="text-sm text-subtle">{label}</p>}
    </div>
  );
}
