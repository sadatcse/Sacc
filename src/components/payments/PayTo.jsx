'use client';
import { useState } from 'react';
import { FaCheck, FaCopy, FaMobileAlt, FaUniversity, FaMoneyCheckAlt, FaMoneyBillWave, FaCreditCard } from 'react-icons/fa';
import { kindOf } from '@/config/payment-methods';
import { cn } from '@/lib/utils';

export const KIND_ICONS = { mobile: FaMobileAlt, bank: FaUniversity, cheque: FaMoneyCheckAlt, cash: FaMoneyBillWave, other: FaCreditCard };

export function CopyText({ text, className }) {
  const [copied, setCopied] = useState(false);
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      /* clipboard blocked */
    }
  };
  return (
    <button
      type="button"
      onClick={copy}
      className={cn('inline-flex items-center gap-2 rounded-md border border-line/15 bg-surface px-2.5 py-1 font-mono text-sm text-ink transition-colors hover:border-orange-500', className)}
    >
      {text} {copied ? <FaCheck className="text-green-600" aria-label="Copied" /> : <FaCopy className="text-xs text-subtle" aria-label="Copy" />}
    </button>
  );
}

// Where / how to pay with one method (from Dashboard → Payment Methods)
export default function PayTo({ method, amount, reference, className }) {
  if (!method) return null;
  const kind = kindOf(method);
  const Icon = KIND_ICONS[method.kind] || FaCreditCard;
  const rows = [
    method.account && [kind.accountLabel, method.kind === 'mobile' || method.kind === 'bank' ? <CopyText key="a" text={method.account} /> : method.account],
    method.accountType && ['Account type', method.accountType],
    method.accountName && [method.kind === 'bank' ? 'Account name' : method.kind === 'cheque' ? 'Payee' : 'Name', method.accountName],
    method.bankName && ['Bank', [method.bankName, method.branch].filter(Boolean).join(', ')],
    amount && ['Amount', <span key="m" className="font-bold text-orange-600 dark:text-orange-400">{amount}</span>],
    reference && method.kind !== 'cash' && ['Reference', reference],
  ].filter(Boolean);

  return (
    <div className={cn('rounded-xl border border-orange-500/30 bg-orange-500/5 p-4 text-sm', className)}>
      <p className="mb-3 flex items-center gap-2 font-semibold text-ink">
        <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-orange-500/15 text-orange-600 dark:text-orange-400"><Icon aria-hidden /></span>
        Pay with {method.label}
      </p>
      {rows.length > 0 && (
        <dl className="grid grid-cols-[auto_1fr] items-center gap-x-4 gap-y-2">
          {rows.map(([label, value]) => (
            <div key={label} className="contents">
              <dt className="text-subtle">{label}</dt>
              <dd className="min-w-0 break-words text-ink">{value}</dd>
            </div>
          ))}
        </dl>
      )}
      {method.instructions && <p className="mt-3 whitespace-pre-line text-xs text-muted">{method.instructions}</p>}
    </div>
  );
}
