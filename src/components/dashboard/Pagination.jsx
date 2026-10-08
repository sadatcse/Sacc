import { MdNavigateBefore, MdNavigateNext } from 'react-icons/md';

export default function Pagination({ page, pageCount, onChange }) {
  if (pageCount <= 1) return null;
  return (
    <div className="flex items-center justify-between border-t border-line/10 px-4 py-3 text-sm text-muted">
      <span>
        Page {page} of {pageCount}
      </span>
      <div className="flex gap-1">
        <button
          type="button"
          onClick={() => onChange(page - 1)}
          disabled={page <= 1}
          className="rounded-md border border-line/10 p-1.5 hover:bg-line/5 disabled:opacity-40"
          aria-label="Previous page"
        >
          <MdNavigateBefore size={18} />
        </button>
        <button
          type="button"
          onClick={() => onChange(page + 1)}
          disabled={page >= pageCount}
          className="rounded-md border border-line/10 p-1.5 hover:bg-line/5 disabled:opacity-40"
          aria-label="Next page"
        >
          <MdNavigateNext size={18} />
        </button>
      </div>
    </div>
  );
}
