'use client';
import { cn } from '@/lib/utils';
import { Input, Select, Textarea } from './FormField';
import ListEditor from './ListEditor';

// Read / write nested values with dotted names ("links.github")
export const getPath = (obj, path) => path.split('.').reduce((o, key) => o?.[key], obj);
export function setPath(obj, path, value) {
  const [head, ...rest] = path.split('.');
  return { ...obj, [head]: rest.length ? setPath(obj?.[head] || {}, rest.join('.'), value) : value };
}

/**
 * Renders a form from a field list. Values live in the parent:
 *   const [values, setValues] = useState({});
 *   <EntityForm fields={fields} values={values} onChange={(name, v) => setValues((s) => setPath(s, name, v))} />
 * Field: { name, label, type, options?, required?, placeholder?, help?, rows?, full? }
 * Types: text | email | password | url | number | date | textarea | select | checkbox | list (comma separated)
 *        | lines (array, one item per line) | rows (array of objects via ListEditor; pass `columns`, `addLabel`) | heading
 */
export default function EntityForm({ fields, values, onChange, disabled }) {
  return (
    <div className="grid gap-4 sm:grid-cols-2">
      {fields.map((field) => {
        const { name, label, type = 'text', options = [], help, full, rows, columns, addLabel, ...rest } = field;
        const wide = full || ['textarea', 'heading', 'lines', 'rows'].includes(type);
        const raw = name ? getPath(values, name) : undefined;
        let control;

        if (type === 'heading') {
          control = <h4 className="border-b border-line/5 pb-1 pt-2 text-sm font-semibold text-ink-2">{label}</h4>;
        } else if (type === 'checkbox') {
          control = (
            <label className="flex items-center gap-2 pt-6 text-sm text-body">
              <input
                type="checkbox"
                checked={Boolean(raw)}
                onChange={(e) => onChange(name, e.target.checked)}
                disabled={disabled}
                className="h-4 w-4 rounded border-line/20 text-primary-600 dark:text-primary-400 focus:ring-primary-500"
              />
              {label}
            </label>
          );
        } else if (type === 'select') {
          control = <Select label={label} name={name} value={raw ?? ''} onChange={(e) => onChange(name, e.target.value)} options={options} disabled={disabled} {...rest} />;
        } else if (type === 'rows') {
          control = (
            <div>
              <p className="mb-2 text-sm font-medium text-body">{label}</p>
              <ListEditor items={Array.isArray(raw) ? raw : []} onChange={(v) => onChange(name, v)} columns={columns} addLabel={addLabel} disabled={disabled} />
            </div>
          );
        } else if (type === 'lines') {
          const value = Array.isArray(raw) ? raw.join('\n') : raw ?? '';
          control = <Textarea label={label} name={name} rows={rows || 4} value={value} onChange={(e) => onChange(name, e.target.value)} disabled={disabled} {...rest} />;
        } else if (type === 'textarea') {
          control = <Textarea label={label} name={name} rows={rows || 4} value={raw ?? ''} onChange={(e) => onChange(name, e.target.value)} disabled={disabled} {...rest} />;
        } else {
          const value = type === 'list' && Array.isArray(raw) ? raw.join(', ') : raw ?? '';
          control = (
            <Input
              label={label}
              name={name}
              type={type === 'list' ? 'text' : type}
              value={value}
              onChange={(e) => onChange(name, e.target.value)}
              disabled={disabled}
              {...rest}
            />
          );
        }

        return (
          <div key={name || label} className={cn(wide && 'sm:col-span-2')}>
            {control}
            {help && <p className="mt-1 text-xs text-subtle">{help}</p>}
          </div>
        );
      })}
    </div>
  );
}
