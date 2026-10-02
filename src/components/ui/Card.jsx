import { cn } from '@/lib/utils';

export default function Card({ title, action, children, className }) {
  return (
    <div className={cn('rounded-xl border border-gray-200 bg-white p-5 shadow-sm', className)}>
      {(title || action) && (
        <div className="mb-4 flex items-center justify-between gap-4">
          {title && <h3 className="text-base">{title}</h3>}
          {action}
        </div>
      )}
      {children}
    </div>
  );
}
