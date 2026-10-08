'use client';
import { useState } from 'react';
import { FaCheck, FaRegCopy } from 'react-icons/fa';

// Code snippet with language label and a copy button
export default function CodeBlock({ lang, code }) {
  const [copied, setCopied] = useState(false);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      /* clipboard unavailable (insecure context) */
    }
  };

  return (
    <div className="my-6 overflow-hidden rounded-xl border border-line/10 bg-canvas-2">
      <div className="flex items-center justify-between border-b border-line/10 bg-line/[0.03] px-4 py-2 text-xs">
        <span className="flex items-center gap-2 font-medium text-muted">
          <span className="h-2 w-2 rounded-full bg-orange-500" aria-hidden />
          {lang || 'Code'}
        </span>
        <button
          type="button"
          onClick={copy}
          className="flex items-center gap-1.5 rounded px-2 py-1 text-muted transition-colors hover:bg-line/10 hover:text-ink"
          aria-label={copied ? 'Copied' : 'Copy code'}
        >
          {copied ? <FaCheck className="text-emerald-600 dark:text-emerald-400" aria-hidden /> : <FaRegCopy aria-hidden />}
          {copied ? 'Copied' : 'Copy'}
        </button>
      </div>
      <pre className="overflow-x-auto px-4 py-4 text-[13px] leading-6 text-ink-2">
        <code className="font-mono">{code}</code>
      </pre>
    </div>
  );
}
