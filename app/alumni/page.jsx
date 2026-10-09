import Link from 'next/link';
import { FaUserGraduate, FaSignInAlt, FaUserEdit, FaCog, FaFileSignature, FaUserCheck, FaAddressCard, FaHandsHelping, FaNetworkWired, FaBullhorn } from 'react-icons/fa';
import AlumniDirectory from '@/components/alumni/AlumniDirectory';
import DarkPageHeader from '@/components/ui/DarkPageHeader';
import { getApprovedAlumni } from '@/server/services/alumni.service';
import { getServerSession } from '@/lib/auth-guard';

export const metadata = {
  title: 'Alumni',
  description: 'Alumni directory — where former club members are now, with batch, role and social links. CSE graduates can apply to join the alumni network.',
};

// Reads MongoDB on every request so dashboard edits show up immediately
export const dynamic = 'force-dynamic';

const APPLY_HREF = '/register?type=alumni&from=%2Falumni';

const STEPS = [
  { icon: FaFileSignature, title: 'Apply', text: 'Create your alumni account with your student ID and batch.' },
  { icon: FaUserCheck, title: 'Get approved', text: 'A club admin checks your details — we email you when it’s done.' },
  { icon: FaAddressCard, title: 'Get listed', text: 'Add your job, links and story; your profile appears in the directory.' },
];

const PERKS = [
  { icon: FaNetworkWired, text: 'Stay connected with classmates and current members' },
  { icon: FaHandsHelping, text: 'Mentor students on careers and higher studies' },
  { icon: FaBullhorn, text: 'Hear about reunions, talks and club events first' },
];

const primaryBtn =
  'inline-flex items-center gap-2 rounded-lg bg-gradient-to-r from-red-600 to-orange-500 px-5 py-2.5 text-sm font-semibold text-white shadow-lg shadow-orange-500/20 transition-opacity hover:opacity-90';
const secondaryBtn =
  'inline-flex items-center gap-2 rounded-lg border border-line/15 px-5 py-2.5 text-sm font-semibold text-ink-2 transition-colors hover:border-orange-500';

// What the header offers depends on who is looking
function HeaderActions({ session }) {
  if (!session) {
    return (
      <>
        <Link href={APPLY_HREF} className={primaryBtn}><FaUserGraduate aria-hidden /> Apply for Alumni Membership</Link>
        <Link href="/login?from=%2Falumni" className={secondaryBtn}><FaSignInAlt aria-hidden /> Already a member? Sign in</Link>
      </>
    );
  }
  if (session.role === 'alumni') return <Link href="/account" className={primaryBtn}><FaUserEdit aria-hidden /> Update my alumni profile</Link>;
  if (session.role === 'admin') return <Link href="/dashboard/alumni" className={secondaryBtn}><FaCog aria-hidden /> Manage alumni</Link>;
  return null;
}

export default async function Page() {
  // Shared email / phone numbers are only sent to signed-in members
  const session = await getServerSession();
  const alumni = await getApprovedAlumni({ withContact: Boolean(session) });
  return (
    <div className="min-h-[70vh] bg-canvas text-body">
      <DarkPageHeader
        title="Alumni"
        accent="Directory"
        subtitle="Where our former members are now. Search by name, company or role, and filter by batch or position. Sign in to see contact details and open full alumni profiles."
        breadcrumbs={[{ label: 'Alumni' }]}
      >
        <div className="mt-6 flex flex-wrap gap-3">
          <HeaderActions session={session} />
        </div>
      </DarkPageHeader>

      <section className="container max-w-7xl 2xl:max-w-screen-2xl py-10 md:py-12">
        <AlumniDirectory alumni={alumni} signedIn={Boolean(session)} />
      </section>

      {!session && (
        <section id="apply" className="container max-w-7xl 2xl:max-w-screen-2xl pb-14">
          <div className="relative overflow-hidden rounded-2xl border border-orange-500/25 bg-surface p-6 md:p-10">
            <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_100%_0%,rgba(249,115,22,0.16),transparent_55%)]" />
            <div className="relative grid gap-8 lg:grid-cols-[1.1fr_1fr] lg:items-center">
              <div>
                <p className="text-xs font-bold uppercase tracking-widest text-orange-600 dark:text-orange-400">Alumni membership</p>
                <h2 className="mt-2 text-2xl font-extrabold text-ink md:text-3xl">Graduated from CSE? Join the alumni network.</h2>
                <p className="mt-3 max-w-xl text-muted">
                  Former students of the University of South Asia can apply for alumni membership — free, and it only takes a minute.
                </p>
                <ul className="mt-5 space-y-2.5">
                  {PERKS.map(({ icon: Icon, text }) => (
                    <li key={text} className="flex items-center gap-3 text-sm text-body">
                      <Icon className="shrink-0 text-orange-500" aria-hidden /> {text}
                    </li>
                  ))}
                </ul>
                <div className="mt-7 flex flex-wrap gap-3">
                  <Link href={APPLY_HREF} className={primaryBtn}><FaUserGraduate aria-hidden /> Apply now</Link>
                  <Link href="/login?from=%2Falumni" className={secondaryBtn}>Sign in</Link>
                </div>
              </div>
              <ol className="grid gap-3">
                {STEPS.map(({ icon: Icon, title, text }, i) => (
                  <li key={title} className="flex gap-4 rounded-xl border border-line/10 bg-canvas/60 p-4">
                    <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-red-600 to-orange-500 text-white">
                      <Icon aria-hidden />
                    </span>
                    <div>
                      <p className="font-semibold text-ink">
                        <span className="mr-1.5 text-orange-600 dark:text-orange-400">{i + 1}.</span>
                        {title}
                      </p>
                      <p className="mt-0.5 text-sm text-muted">{text}</p>
                    </div>
                  </li>
                ))}
              </ol>
            </div>
          </div>
        </section>
      )}
    </div>
  );
}
