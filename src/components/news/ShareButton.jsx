'use client';
import { useState } from 'react';
import { FaCheck, FaShareAlt } from 'react-icons/fa';

// Native share sheet where available, otherwise copies the page URL
export default function ShareButton({ title }) {
  const [copied, setCopied] = useState(false);

  const share = async () => {
    const url = window.location.href;
    try {
      if (navigator.share) return await navigator.share({ title, url });
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      /* share cancelled or clipboard unavailable */
    }
  };

  return (
    <button
      type="button"
      onClick={share}
      className="inline-flex items-center gap-2 rounded-full border border-line/10 bg-line/5 px-3.5 py-1.5 text-xs font-medium text-ink-2 transition-colors hover:border-orange-500/60 hover:text-ink"
    >
      {copied ? <FaCheck className="text-emerald-600 dark:text-emerald-400" aria-hidden /> : <FaShareAlt aria-hidden />}
      {copied ? 'Link copied' : 'Share'}
    </button>
  );
}
