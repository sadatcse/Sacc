// Payment methods the club accepts (Dashboard → Payment Methods, Setting key `payments`).
// Shared by the Join form, Account → Payments, Dashboard → Payments and the server checks.
//   method = { key, label, kind, enabled, purposes: ['membership'|'renewal'|'donation'], account, accountName,
//              accountType, bankName, branch, instructions }

// What the payer must enter for each kind of method (stored as Payment.paidFrom / transactionId)
export const PAYMENT_KINDS = [
  {
    value: 'mobile',
    label: 'Mobile banking (bKash, Nagad, Rocket, Upay…)',
    short: 'Mobile banking',
    accountLabel: 'Receiving number',
    from: { label: 'Number you paid from', placeholder: '01XXXXXXXXX', required: true },
    ref: { label: 'Transaction ID', placeholder: 'e.g. 9BX7K2L1QZ', required: true },
    needsAccount: true, // hidden on public pages until a number is set
  },
  {
    value: 'bank',
    label: 'Bank transfer / deposit',
    short: 'Bank',
    accountLabel: 'Account number',
    from: { label: 'Your bank / account', placeholder: 'e.g. DBBL, A/C ending 4321', required: false },
    ref: { label: 'Transaction / deposit slip number', placeholder: 'e.g. FT2410150001', required: true },
    needsAccount: true,
  },
  {
    value: 'cheque',
    label: 'Cheque',
    short: 'Cheque',
    accountLabel: 'Pay to (cheque in the name of)',
    from: { label: 'Bank of the cheque', placeholder: 'e.g. Sonali Bank', required: true },
    ref: { label: 'Cheque number', placeholder: 'e.g. 1234567', required: true },
    needsAccount: false,
  },
  {
    value: 'cash',
    label: 'Cash (at the club desk)',
    short: 'Cash',
    accountLabel: 'Where to pay',
    from: null,
    ref: { label: 'Money receipt number', placeholder: 'e.g. 0457', required: false },
    needsAccount: false,
  },
  {
    value: 'other',
    label: 'Other',
    short: 'Other',
    accountLabel: 'Account / details',
    from: { label: 'Paid from', placeholder: '', required: false },
    ref: { label: 'Reference', placeholder: '', required: false },
    needsAccount: false,
  },
];
export const KIND = Object.fromEntries(PAYMENT_KINDS.map((k) => [k.value, k]));

// What a payment is for — each method can be switched on per purpose
export const PAYMENT_PURPOSES = [
  { value: 'membership', label: 'Joining fee', where: 'Join page' },
  { value: 'renewal', label: 'Membership renewal', where: 'Account → Payments (members)' },
  { value: 'donation', label: 'Alumni donation', where: 'Account → Payments (alumni)' },
];
const ALL_PURPOSES = PAYMENT_PURPOSES.map((p) => p.value);

export const MOBILE_ACCOUNT_TYPES = ['Personal', 'Agent', 'Merchant'];

const method = (key, label, kind, extra = {}) => ({
  key, label, kind, enabled: true, purposes: ALL_PURPOSES, account: '', accountName: '', accountType: kind === 'mobile' ? 'Personal' : '', bankName: '', branch: '', instructions: '', ...extra,
});

// First-run list (the bKash / Nagad / Rocket numbers saved before this page existed are copied in)
export const DEFAULT_PAYMENT_METHODS = [
  method('bkash', 'bKash', 'mobile'),
  method('nagad', 'Nagad', 'mobile'),
  method('rocket', 'Rocket', 'mobile'),
  method('cash', 'Cash', 'cash', { instructions: 'Pay at the club desk and keep your money receipt.' }),
  method('cheque', 'Cheque', 'cheque', { enabled: false, purposes: ['donation'] }),
  method('bank', 'Bank transfer', 'bank', { enabled: false, purposes: ['donation'] }),
];
export const newPaymentMethod = (kind = 'mobile') => method('', '', kind);

// Labels for records made with a method that was later deleted
const BUILT_IN_LABELS = { ...Object.fromEntries(DEFAULT_PAYMENT_METHODS.map((m) => [m.key, m.label])), cash: 'Cash' };

export const kindOf = (m) => KIND[m?.kind] || KIND.other;

// Shown to payers: on, used for this purpose, and (mobile / bank) has an account to pay to
export const isUsable = (m) => Boolean(m?.enabled) && (!kindOf(m).needsAccount || Boolean(m.account));
export const methodsFor = (methods = [], purpose) => methods.filter((m) => isUsable(m) && (!purpose || m.purposes?.includes(purpose)));

export function methodLabel(methods = [], key) {
  if (!key) return '';
  return methods.find((m) => m.key === key)?.label || BUILT_IN_LABELS[key] || key;
}

// Missing payer details for a method → list of field labels (empty = ok)
export function missingTransferFields(m, { paidFrom, transactionId }) {
  const kind = kindOf(m);
  return [kind.from?.required && !paidFrom && kind.from.label, kind.ref?.required && !transactionId && kind.ref.label].filter(Boolean);
}

// One-line "send to" text, e.g. "01712345678 (Personal)" / "A/C 123 · Sonali Bank, Dhanmondi"
export function accountLine(m) {
  if (!m) return '';
  if (m.kind === 'mobile') return [m.account, m.accountType && `(${m.accountType})`].filter(Boolean).join(' ');
  if (m.kind === 'bank') return [m.account && `A/C ${m.account}`, m.accountName, [m.bankName, m.branch].filter(Boolean).join(', ')].filter(Boolean).join(' · ');
  return m.account || '';
}
