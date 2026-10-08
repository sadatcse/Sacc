'use client';
import { useEffect } from 'react';
import { HiX } from 'react-icons/hi';

// size: 'md' (default) | 'lg' for wide content. On phones it slides up as a bottom sheet.
export default function Modal({ open, onClose, title, children, footer, size = 'md' }) {
  useEffect(() => {
    if (!open) return undefined;
    const onKey = (e) => e.key === 'Escape' && onClose?.();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 sm:items-center sm:p-4" onClick={onClose}>
      <div
        role="dialog"
        aria-modal="true"
        className={`flex max-h-[92vh] w-full flex-col overflow-hidden rounded-t-2xl bg-surface shadow-xl sm:max-h-[90vh] sm:rounded-xl ${size === 'lg' ? 'sm:max-w-3xl' : 'sm:max-w-lg'}`}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex shrink-0 items-center justify-between border-b border-line/10 px-5 py-4">
          <h3 className="text-lg">{title}</h3>
          <button type="button" onClick={onClose} className="rounded p-1 text-subtle hover:bg-line/10" aria-label="Close">
            <HiX size={20} />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto px-5 py-4">{children}</div>
        {footer && <div className="flex shrink-0 flex-wrap justify-end gap-2 border-t border-line/10 px-5 py-4">{footer}</div>}
      </div>
    </div>
  );
}
