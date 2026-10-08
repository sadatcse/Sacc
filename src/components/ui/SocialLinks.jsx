import { SOCIAL_LINKS } from '@/config/socialLinks';
import { cn } from '@/lib/utils';

// Row of icon buttons for a profile's links ({ linkedin, googleScholar, …, email }). Empty ones are skipped.
// `exclude` hides some keys (e.g. ['email'] when the email is shown elsewhere).
export default function SocialLinks({ links = {}, name, exclude = [], className }) {
  const items = SOCIAL_LINKS.filter(({ key }) => links[key] && !exclude.includes(key));
  if (!items.length) return null;
  return (
    <div className={cn('flex flex-wrap gap-2', className)}>
      {items.map(({ key, label, icon: Icon }) => {
        const isEmail = key === 'email';
        return (
          <a
            key={key}
            href={isEmail ? `mailto:${links.email}` : links[key]}
            {...(!isEmail && { target: '_blank', rel: 'noopener noreferrer' })}
            aria-label={`${name} — ${label}`}
            title={label}
            className="flex h-9 w-9 items-center justify-center rounded-md border border-line/10 text-body transition-colors hover:border-orange-500 hover:bg-orange-500 hover:text-white"
          >
            <Icon aria-hidden />
          </a>
        );
      })}
    </div>
  );
}
