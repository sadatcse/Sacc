import { cn } from '@/lib/utils';

// Dashed box that marks where real content will go. Delete it once the section is built.
export default function Placeholder({ label = 'Content goes here', className }) {
  return (
    <div
      className={cn(
        'flex min-h-[160px] items-center justify-center rounded-xl border-2 border-dashed border-line/20 p-6 text-center text-sm text-faint',
        className
      )}
    >
      {label}
    </div>
  );
}
