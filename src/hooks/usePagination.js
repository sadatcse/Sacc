'use client';
import { useMemo, useState } from 'react';

// Client-side pagination for a list. The page is clamped when the list shrinks (e.g. after filtering).
export default function usePagination(items = [], perPage = 10) {
  const [requestedPage, setPage] = useState(1);
  const pageCount = Math.max(1, Math.ceil(items.length / perPage));
  const page = Math.min(requestedPage, pageCount);

  const pageItems = useMemo(() => items.slice((page - 1) * perPage, page * perPage), [items, page, perPage]);

  return { page, setPage, pageCount, pageItems };
}
