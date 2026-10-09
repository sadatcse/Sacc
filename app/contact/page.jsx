import { FaMapMarkerAlt, FaPhoneAlt, FaEnvelope, FaExternalLinkAlt } from 'react-icons/fa';
import { siteConfig } from '@/config/site';
import { formatPhone } from '@/lib/utils';
import DarkPageHeader from '@/components/ui/DarkPageHeader';
import ContactForm from '@/components/forms/ContactForm';

export const metadata = {
  title: 'Contact Us',
  description: `Contact the ${siteConfig.name} — phone, email, campus address and map.`,
};

function InfoCard({ icon: Icon, title, children }) {
  return (
    <div className="flex gap-4 rounded-2xl border border-line/10 bg-surface/70 p-5">
      <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-red-600 to-orange-500 text-white shadow-lg shadow-orange-500/20">
        <Icon aria-hidden />
      </span>
      <div className="min-w-0 text-sm">
        <h2 className="mb-1 text-base text-ink">{title}</h2>
        {children}
      </div>
    </div>
  );
}

const link = 'text-body transition-colors hover:text-orange-600 dark:hover:text-orange-400';

export default function Page() {
  const { address, phones = [], email, mapUrl, mapEmbed } = siteConfig.contact;

  return (
    <div className="min-h-[70vh] bg-canvas text-body">
      <DarkPageHeader
        title="Contact"
        accent="Us"
        subtitle="Questions, collaborations or membership — call us, email us, visit the campus or send a message."
        breadcrumbs={[{ label: 'Contact' }]}
      />

      <div className="container max-w-7xl py-10 md:py-14 2xl:max-w-screen-2xl">
        <div className="grid gap-6 lg:grid-cols-[minmax(0,380px)_1fr]">
          {/* Contact details */}
          <div className="space-y-4">
            <InfoCard icon={FaMapMarkerAlt} title="Address">
              <p className="text-body">{address}</p>
              {mapUrl && (
                <a href={mapUrl} target="_blank" rel="noopener noreferrer" className="mt-2 inline-flex items-center gap-1.5 font-semibold text-orange-600 hover:underline dark:text-orange-400">
                  Open in Google Maps <FaExternalLinkAlt className="text-[10px]" aria-hidden />
                </a>
              )}
            </InfoCard>
            {phones.length > 0 && (
              <InfoCard icon={FaPhoneAlt} title="Phone">
                <ul className="space-y-1">
                  {phones.map((phone) => (
                    <li key={phone}><a href={`tel:${phone}`} className={link}>{formatPhone(phone)}</a></li>
                  ))}
                </ul>
              </InfoCard>
            )}
            {email && (
              <InfoCard icon={FaEnvelope} title="Email">
                <a href={`mailto:${email}`} className={`${link} break-all`}>{email}</a>
              </InfoCard>
            )}
          </div>

          {/* Message form */}
          <div className="rounded-2xl border border-line/10 bg-surface/70 p-5 md:p-7">
            <h2 className="text-xl text-ink">Send a message</h2>
            <p className="mb-5 mt-1 text-sm text-muted">We usually reply within a few working days.</p>
            <ContactForm />
          </div>
        </div>

        {/* Map */}
        {mapEmbed && (
          <div className="mt-8 overflow-hidden rounded-2xl border border-line/10 bg-surface">
            <iframe
              title="University of South Asia on Google Maps"
              src={mapEmbed}
              className="h-[320px] w-full md:h-[420px]"
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
              allowFullScreen
            />
          </div>
        )}
      </div>
    </div>
  );
}
