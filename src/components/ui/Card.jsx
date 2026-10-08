import { cn } from '@/lib/utils';

// Pass className="p-0" for edge-to-edge content (tables); otherwise the card is padded.
export default function Card({ title, action, children, className }) {
  const flush = /(^|\s)p-0(\s|$)/.test(className || '');
  return (
    <div className={cn('rounded-xl border border-line/10 bg-surface shadow-sm', !flush && 'p-4 sm:p-5', className)}>
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
