import { cn } from '@/lib/utils';

const inputClass =
  'w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 placeholder-gray-400 focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-100';

function Field({ label, name, error, required, children }) {
  return (
    <div>
      {label && (
        <label htmlFor={name} className="mb-1 block text-sm font-medium text-gray-700">
          {label} {required && <span className="text-red-500">*</span>}
        </label>
      )}
      {children}
      {error && <p className="mt-1 text-xs text-red-600">{error}</p>}
    </div>
  );
}

export function Input({ label, name, error, required, className, ...props }) {
  return (
    <Field label={label} name={name} error={error} required={required}>
      <input id={name} name={name} required={required} className={cn(inputClass, className)} {...props} />
    </Field>
  );
}

export function Textarea({ label, name, error, required, className, rows = 5, ...props }) {
  return (
    <Field label={label} name={name} error={error} required={required}>
      <textarea id={name} name={name} rows={rows} required={required} className={cn(inputClass, className)} {...props} />
    </Field>
  );
}

export function Select({ label, name, error, required, options = [], className, ...props }) {
  return (
    <Field label={label} name={name} error={error} required={required}>
      <select id={name} name={name} required={required} className={cn(inputClass, className)} {...props}>
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>{opt.label}</option>
        ))}
      </select>
    </Field>
  );
}
