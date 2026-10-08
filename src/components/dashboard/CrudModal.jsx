'use client';
import { useState } from 'react';
import Modal from '@/components/ui/Modal';
import Button from '@/components/ui/Button';
import Alert from '@/components/ui/Alert';
import ConfirmDialog from '@/components/ui/ConfirmDialog';
import EntityForm, { setPath } from '@/components/forms/EntityForm';
import { apiError } from '@/lib/api-client';

/**
 * Add / edit dialog driven by a field list (see EntityForm).
 *   <CrudModal open title fields initial onSubmit={async (values) => …} onDelete? onClose />
 * `fields` may be a function of the current values (to show fields conditionally).
 * onSubmit / onDelete may throw an axios error — its message is shown in the dialog.
 * Mount it with a `key` per record so the form resets when switching records.
 */
export default function CrudModal({ open, title, fields, initial = {}, onSubmit, onDelete, deleteLabel = 'Delete', deleteMessage, onClose, submitLabel = 'Save', size }) {
  const [values, setValues] = useState(initial);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [confirming, setConfirming] = useState(false);

  const run = async (fn) => {
    setBusy(true);
    setError('');
    try {
      await fn();
    } catch (err) {
      setError(apiError(err, err?.message || 'Something went wrong.'));
      setConfirming(false);
    } finally {
      setBusy(false);
    }
  };

  const submit = (e) => {
    e.preventDefault();
    run(() => onSubmit(values));
  };

  return (
    <>
      <Modal
        open={open && !confirming}
        size={size}
        onClose={busy ? undefined : onClose}
        title={title}
        footer={
          <>
            {onDelete && (
              <Button variant="danger" className="mr-auto" onClick={() => setConfirming(true)} disabled={busy}>{deleteLabel}</Button>
            )}
            <Button variant="secondary" onClick={onClose} disabled={busy}>Cancel</Button>
            <Button type="submit" form="crud-form" disabled={busy}>{busy ? 'Saving…' : submitLabel}</Button>
          </>
        }
      >
        <form id="crud-form" onSubmit={submit} className="space-y-4">
          <Alert type="error">{error}</Alert>
          <EntityForm fields={typeof fields === 'function' ? fields(values) : fields} values={values} onChange={(name, value) => setValues((s) => setPath(s, name, value))} disabled={busy} />
        </form>
      </Modal>
      <ConfirmDialog
        open={confirming}
        title={`${deleteLabel}?`}
        message={deleteMessage || 'This cannot be undone.'}
        confirmLabel={deleteLabel}
        loading={busy}
        onConfirm={() => run(onDelete)}
        onCancel={() => setConfirming(false)}
      />
    </>
  );
}
