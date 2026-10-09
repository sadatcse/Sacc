'use client';
import { useState } from 'react';
import Link from 'next/link';
import {
  FaUser, FaEnvelope, FaPhoneAlt, FaIdCard, FaUniversity, FaUsers, FaSun, FaTshirt, FaTint, FaFacebookF,
  FaCamera, FaCreditCard, FaPaperPlane, FaCheckCircle, FaCopy, FaCheck, FaExclamationTriangle, FaLock,
} from 'react-icons/fa';
import { api, apiError } from '@/lib/api-client';
import { cn } from '@/lib/utils';
import {
  BLOOD_GROUPS, GENDER_OPTIONS, MOBILE_PAYMENT_METHODS, PAYMENT_METHODS, PHOTO_MAX_BYTES, PHOTO_TYPES, SHIFT_OPTIONS, SOFT_SKILLS, TSHIRT_SIZES,
} from '@/config/membership';

const inputClass =
  'h-11 w-full rounded-lg border border-line/10 bg-canvas/60 px-3 text-sm text-ink outline-none transition-colors placeholder:text-faint hover:border-orange-500/50 focus:border-orange-500 disabled:cursor-not-allowed disabled:opacity-50 [&>option]:bg-surface';

function Field({ label, icon: Icon, name, optional, children, className }) {
  return (
    <label htmlFor={name} className={cn('block', className)}>
      <span className="mb-1.5 flex items-center gap-2 text-sm font-medium text-ink-2">
        {Icon && <Icon className="text-xs text-orange-500" aria-hidden />}
        {label}
        {optional ? <span className="text-xs font-normal text-subtle">(optional)</span> : <span className="text-orange-500">*</span>}
      </span>
      {children}
    </label>
  );
}

function TextInput({ name, optional, ...props }) {
  return <input id={name} name={name} required={!optional} className={inputClass} {...props} />;
}

function SelectInput({ name, placeholder, options, ...props }) {
  return (
    <select id={name} name={name} required defaultValue="" className={inputClass} {...props}>
      <option value="" disabled>{placeholder}</option>
      {options.map((o) => (typeof o === 'string' ? <option key={o} value={o}>{o}</option> : <option key={o.value} value={o.value}>{o.label}</option>))}
    </select>
  );
}

function CopyButton({ text }) {
  const [copied, setCopied] = useState(false);
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      /* clipboard unavailable */
    }
  };
  return (
    <button type="button" onClick={copy} className="flex h-11 shrink-0 items-center gap-2 rounded-lg bg-gradient-to-r from-red-600 to-orange-500 px-4 text-sm font-semibold text-white">
      {copied ? <FaCheck aria-hidden /> : <FaCopy aria-hidden />} {copied ? 'Copied' : 'Copy'}
    </button>
  );
}

// Club membership application (/join). Submits multipart data to POST /api/membership → saved as a draft.
export default function JoinForm({ settings }) {
  const [payment, setPayment] = useState('');
  const [photoPreview, setPhotoPreview] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(null);
  const closed = !settings.open;
  const receivingNumber = MOBILE_PAYMENT_METHODS.includes(payment) ? settings[payment] : '';

  const onPhoto = (e) => {
    const file = e.target.files?.[0];
    setError('');
    if (!file) return setPhotoPreview('');
    if (!PHOTO_TYPES.includes(file.type)) {
      e.target.value = '';
      setPhotoPreview('');
      return setError('The photo must be a JPG, PNG or WebP image.');
    }
    if (file.size > PHOTO_MAX_BYTES) {
      e.target.value = '';
      setPhotoPreview('');
      return setError('The photo must be 2 MB or smaller.');
    }
    setPhotoPreview(URL.createObjectURL(file));
  };

  const submit = async (e) => {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    if (form.get('password') !== e.currentTarget.elements.confirmPassword.value) {
      setError('The passwords do not match.');
      return;
    }
    setSubmitting(true);
    setError('');
    try {
      const res = await api.post('/membership', form);
      setDone(res.data);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (err) {
      setError(apiError(err, 'Could not submit your application. Please try again.'));
    } finally {
      setSubmitting(false);
    }
  };

  if (done) {
    return (
      <div className="mx-auto max-w-xl rounded-2xl border border-emerald-500/30 bg-surface/80 p-10 text-center">
        <FaCheckCircle className="mx-auto text-5xl text-emerald-600 dark:text-emerald-400" aria-hidden />
        <h2 className="mt-5 text-2xl font-bold text-ink">Application submitted!</h2>
        <p className="mt-3 text-muted">{done.message}</p>
        <p className="mt-4 text-xs text-subtle">
          Reference: <span className="font-mono text-body">{done.data._id.slice(-8).toUpperCase()}</span> · Status: <span className="text-amber-600 dark:text-amber-400">Draft — awaiting review</span>
        </p>
        <Link href="/" className="mt-8 inline-flex rounded-lg border border-line/15 px-5 py-2.5 text-sm font-semibold text-ink-2 hover:border-orange-500">
          Back to home
        </Link>
      </div>
    );
  }

  return (
    <form onSubmit={submit} className="mx-auto max-w-4xl rounded-2xl border border-line/10 bg-surface/70 p-6 shadow-2xl md:p-10" encType="multipart/form-data">
      <div
        className={cn(
          'mb-8 flex items-start gap-3 rounded-xl border px-4 py-3',
          closed ? 'border-red-500/40 bg-red-500/10 text-red-800 dark:text-red-200' : 'border-emerald-500/40 bg-emerald-500/10 text-emerald-800 dark:text-emerald-200'
        )}
      >
        {closed ? <FaExclamationTriangle className="mt-1 shrink-0" aria-hidden /> : <FaCheckCircle className="mt-1 shrink-0" aria-hidden />}
        <div>
          <p className="font-semibold">{closed ? 'Registration Closed' : 'Registration Open'}</p>
          {settings.notice && <p className="text-sm opacity-80">{settings.notice}</p>}
        </div>
      </div>

      <fieldset disabled={closed || submitting} className="space-y-8">
        <section>
          <h2 className="mb-4 text-sm font-bold uppercase tracking-widest text-orange-600 dark:text-orange-400">Personal details</h2>
          <div className="grid gap-5 sm:grid-cols-2">
            <Field label="First Name" icon={FaUser} name="firstName"><TextInput name="firstName" placeholder="Enter your first name" autoComplete="given-name" /></Field>
            <Field label="Last Name" icon={FaUser} name="lastName"><TextInput name="lastName" placeholder="Enter your last name" autoComplete="family-name" /></Field>
            <Field label="Email (you will sign in with it)" icon={FaEnvelope} name="personalEmail"><TextInput name="personalEmail" type="email" placeholder="you@example.com" autoComplete="email" /></Field>
            <Field label="Phone (WhatsApp Number)" icon={FaPhoneAlt} name="phone"><TextInput name="phone" type="tel" placeholder="01XXXXXXXXX" autoComplete="tel" /></Field>
            <Field label="Backup Phone" icon={FaPhoneAlt} name="backupPhone" optional><TextInput name="backupPhone" type="tel" optional placeholder="Enter backup phone number" /></Field>
            <Field label="Gender" icon={FaUser} name="gender"><SelectInput name="gender" placeholder="Select gender" options={GENDER_OPTIONS} /></Field>
            <Field label="Blood Group" icon={FaTint} name="bloodGroup"><SelectInput name="bloodGroup" placeholder="Select blood group" options={BLOOD_GROUPS} /></Field>
            <Field label="T-Shirt Size" icon={FaTshirt} name="tshirtSize"><SelectInput name="tshirtSize" placeholder="Select size" options={TSHIRT_SIZES} /></Field>
            <Field label="Facebook Profile" icon={FaFacebookF} name="facebook" optional><TextInput name="facebook" type="url" optional placeholder="https://facebook.com/yourprofile" /></Field>
            <Field label="Semi-formal Picture of Yourself" icon={FaCamera} name="photo">
              <div className="flex items-center gap-3">
                {photoPreview && (
                  // eslint-disable-next-line @next/next/no-img-element -- local preview of the chosen file
                  <img src={photoPreview} alt="" className="h-11 w-11 shrink-0 rounded-lg object-cover ring-1 ring-orange-500" />
                )}
                <input
                  id="photo"
                  name="photo"
                  type="file"
                  accept={PHOTO_TYPES.join(',')}
                  required
                  onChange={onPhoto}
                  className="block w-full text-sm text-muted file:mr-3 file:h-11 file:cursor-pointer file:rounded-lg file:border-0 file:bg-surface-2 file:px-4 file:text-sm file:font-semibold file:text-ink-2 hover:file:bg-line/10"
                />
              </div>
              <span className="mt-1 block text-xs text-subtle">JPG, PNG or WebP · max 2 MB</span>
            </Field>
          </div>
        </section>

        <section>
          <h2 className="mb-4 text-sm font-bold uppercase tracking-widest text-orange-600 dark:text-orange-400">Academic details</h2>
          <div className="grid gap-5 sm:grid-cols-2">
            <Field label="Student ID" icon={FaIdCard} name="studentId"><TextInput name="studentId" placeholder="Enter your student ID" /></Field>
            <Field label="Department" icon={FaUniversity} name="department"><TextInput name="department" defaultValue="Computer Science & Engineering" /></Field>
            <Field label="Batch" icon={FaUsers} name="batch"><TextInput name="batch" placeholder="e.g. CSE 24" /></Field>
            <Field label="Shift" icon={FaSun} name="shift"><SelectInput name="shift" placeholder="Day or Evening" options={SHIFT_OPTIONS} /></Field>
          </div>
        </section>

        <section>
          <h2 className="mb-1 text-sm font-bold uppercase tracking-widest text-orange-600 dark:text-orange-400">Your member account</h2>
          <p className="mb-4 text-sm text-muted">
            Choose a password for the website. You can sign in and update your profile once your membership is approved — we will email you.
            Already have an account? Use the same email and that account’s password.
          </p>
          <div className="grid gap-5 sm:grid-cols-2">
            <Field label="Password" icon={FaLock} name="password"><TextInput name="password" type="password" minLength={8} autoComplete="new-password" placeholder="At least 8 characters" /></Field>
            {/* no `name`: the confirmation is checked here and never sent */}
            <Field label="Confirm password" icon={FaLock} name="confirmPassword"><TextInput id="confirmPassword" type="password" minLength={8} autoComplete="new-password" placeholder="Type it again" /></Field>
          </div>
        </section>

        <section>
          <h2 className="mb-4 text-sm font-bold uppercase tracking-widest text-orange-600 dark:text-orange-400">Membership fee</h2>
          <div className="grid gap-5 sm:grid-cols-2">
            <Field label="Payment Method" icon={FaCreditCard} name="paymentMethod">
              <SelectInput name="paymentMethod" placeholder="Select payment method" options={PAYMENT_METHODS} onChange={(e) => setPayment(e.target.value)} />
            </Field>
            <div className="rounded-xl border border-orange-500/30 bg-orange-500/5 p-4 text-sm">
              <p className="text-body">Amount: <span className="font-bold text-orange-600 dark:text-orange-400">{settings.fee} BDT</span></p>
              {settings.reference && <p className="mt-1 text-xs text-muted">Reference: {settings.reference}</p>}
              {payment === 'cash' && <p className="mt-1 text-xs text-muted">Pay at the club desk — keep your money receipt.</p>}
            </div>
          </div>

          {MOBILE_PAYMENT_METHODS.includes(payment) && (
            <div className="mt-5 grid gap-5 sm:grid-cols-2">
              <div className="sm:col-span-2">
                <span className="mb-1.5 block text-sm font-medium text-ink-2">Send money to this {PAYMENT_METHODS.find((m) => m.value === payment).label} number</span>
                {receivingNumber ? (
                  <div className="flex gap-2">
                    <input readOnly value={receivingNumber} className={cn(inputClass, 'font-mono')} aria-label="Club payment number" />
                    <CopyButton text={receivingNumber} />
                  </div>
                ) : (
                  <p className="text-sm text-amber-700 dark:text-amber-300">The club hasn&apos;t published a number for this method yet — please choose another.</p>
                )}
              </div>
              <Field label="Number you paid from" icon={FaPhoneAlt} name="paymentFrom"><TextInput name="paymentFrom" type="tel" placeholder="01XXXXXXXXX" /></Field>
              <Field label="Transaction ID" icon={FaCreditCard} name="transactionId"><TextInput name="transactionId" placeholder="e.g. 9BX4K2L7QP" className={cn(inputClass, 'font-mono uppercase')} /></Field>
            </div>
          )}
        </section>

        <section>
          <h2 className="mb-4 text-sm font-bold uppercase tracking-widest text-orange-600 dark:text-orange-400">Soft skills</h2>
          <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
            {SOFT_SKILLS.map((skill) => (
              <label key={skill} className="flex cursor-pointer items-center gap-2.5 rounded-lg border border-line/10 bg-canvas/60 px-3 py-2.5 text-sm text-body transition-colors hover:border-orange-500/50 has-[:checked]:border-orange-500 has-[:checked]:bg-orange-500/10 has-[:checked]:text-orange-800 dark:has-[:checked]:text-white">
                <input type="checkbox" name="softSkills" value={skill} className="h-4 w-4 accent-orange-500" />
                {skill}
              </label>
            ))}
          </div>
        </section>

        <Field label="Experience" name="experience" optional>
          <textarea id="experience" name="experience" rows={5} maxLength={3000} placeholder="Tell us about your relevant experience — clubs, contests, projects, volunteering…" className={cn(inputClass, 'h-auto py-3')} />
        </Field>

        {error && <p role="alert" className="rounded-lg border border-red-500/40 bg-red-500/10 px-4 py-3 text-sm text-red-700 dark:text-red-300">{error}</p>}

        <div className="text-center">
          <button
            type="submit"
            className="inline-flex h-12 items-center gap-2 rounded-lg bg-gradient-to-r from-red-600 to-orange-500 px-8 text-sm font-semibold text-white shadow-lg shadow-orange-500/20 transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <FaPaperPlane aria-hidden /> {submitting ? 'Submitting…' : 'Submit Application'}
          </button>
        </div>
      </fieldset>
    </form>
  );
}
