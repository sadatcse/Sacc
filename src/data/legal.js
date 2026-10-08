// Text of the /legal pages. Each document: { title, summary, lastUpdated, sections: [{ id, heading, body: [paragraph | { list: [] }] }] }.
// Inline **bold** and [links](/path) are supported (rendered with the news Inline renderer).
// Review with the club advisor / university before publishing changes.
import { siteConfig } from '@/config/site';

const CLUB = siteConfig.name;
const EMAIL = siteConfig.contact.email;
const UPDATED = '8 October 2026';

const contactSection = (extra = '') => ({
  id: 'contact',
  heading: 'Contact us',
  body: [
    `Questions about this policy? Email **${EMAIL}**, use the [contact form](/contact), or visit the club desk at the Department of Computer Science and Engineering, ${siteConfig.contact.address}.${extra}`,
  ],
});

export const legalDocs = {
  termsofuse: {
    title: 'Terms of Use',
    summary: `The rules for using the ${CLUB} website, accounts and services.`,
    lastUpdated: UPDATED,
    sections: [
      {
        id: 'acceptance',
        heading: 'Acceptance of these terms',
        body: [
          `By using this website — browsing pages, creating an account, applying for membership or contacting us — you agree to these Terms of Use and to our [Privacy Policy](/legal/appprivacypolicy). If you do not agree, please do not use the site.`,
          `The website is run by the ${CLUB}, a student club of the Department of Computer Science and Engineering at the University of South Asia, under the guidance of its faculty advisors.`,
        ],
      },
      {
        id: 'accounts',
        heading: 'Accounts and roles',
        body: [
          'There are three kinds of accounts:',
          {
            list: [
              '**Students** — current students of the University of South Asia. Students can create their own account.',
              '**Alumni** — graduates of the university. Alumni can create their own account; their profile appears in the public Alumni directory only after an admin approves it.',
              '**Admins** — teachers and faculty members who manage the website. Admin accounts are created by an existing admin only.',
            ],
          },
          'You must give accurate information, keep your password private and tell us immediately if you think someone else has used your account. You are responsible for everything done with your account.',
          'Admins may correct, suspend or delete accounts that break these terms, are fake, or belong to someone who is no longer eligible.',
        ],
      },
      {
        id: 'membership',
        heading: 'Club membership applications',
        body: [
          'Membership applications submitted through the [Join page](/join) are saved as a **draft** and reviewed by the club. Submitting an application does not by itself make you a member — you become a member when an admin approves it.',
          'You must apply with your own student ID and true details. Applications with false information, someone else’s photo or an unverifiable payment may be rejected. Fees are covered by our [Refund Policy](/legal/refundpolicy).',
        ],
      },
      {
        id: 'acceptable-use',
        heading: 'Acceptable use',
        body: [
          'When using the site you agree not to:',
          {
            list: [
              'post or upload anything unlawful, hateful, harassing, sexually explicit, or that infringes someone else’s rights;',
              'impersonate another person, or submit another student’s data or photo;',
              'try to access accounts, admin pages or data you are not allowed to, or probe, scan or overload the website;',
              'use bots or scripts to submit forms, scrape personal information, or send spam through the contact form;',
              'upload files that contain malware or are not the image types we ask for.',
            ],
          },
          'Breaking these rules may lead to suspension of your account, rejection of your membership and, where required, reporting to the university authorities.',
        ],
      },
      {
        id: 'content',
        heading: 'Content and intellectual property',
        body: [
          `News, photos, logos and design on this site belong to the ${CLUB}, the University of South Asia or the people who created them. You may share links to our pages and quote short parts with credit, but you may not copy whole pages, photos or the club logo for commercial use without permission.`,
          'If you submit content to us (for example a profile photo, bio or event photo), you confirm you have the right to share it and you allow the club to display it on the website and club channels for club purposes. You can ask us to remove it at any time.',
        ],
      },
      {
        id: 'events',
        heading: 'Events and activities',
        body: [
          'Event dates, venues and guests shown on the site can change. We announce changes on the News page and our official social media. Taking part in events is also subject to university rules and any event-specific rules announced by the organisers.',
          'Photos and videos are often taken at club events and may be published on this website and our social media. If you would prefer not to appear, tell the organisers at the event or contact us afterwards and we will remove the photo.',
        ],
      },
      {
        id: 'disclaimer',
        heading: 'Availability and disclaimer',
        body: [
          'We try to keep the website accurate and available, but it is run by students and volunteers and is provided “as is”. We do not guarantee that it will always be available, error-free or up to date, and we are not liable for losses caused by relying on it, to the extent the law allows.',
          'Links to other websites are provided for convenience; we are not responsible for their content or privacy practices.',
        ],
      },
      {
        id: 'changes',
        heading: 'Changes to these terms',
        body: [
          'We may update these terms when the website or club rules change. The “Last updated” date at the top shows the latest version. Continuing to use the site after a change means you accept the updated terms.',
          'These terms are governed by the laws of Bangladesh and the rules of the University of South Asia.',
        ],
      },
      contactSection(),
    ],
  },

  appprivacypolicy: {
    title: 'Privacy Policy',
    summary: 'What personal information we collect, why, who can see it and the choices you have.',
    lastUpdated: UPDATED,
    sections: [
      {
        id: 'overview',
        heading: 'Overview',
        body: [
          `The ${CLUB} (“we”, “the club”) respects your privacy. We collect only the information we need to run the club and this website, we never sell it, and we do not use advertising or third-party tracking tools.`,
        ],
      },
      {
        id: 'what-we-collect',
        heading: 'Information we collect',
        body: [
          '**Accounts.** Your name, email address, optional phone number and a securely hashed password (we never store or see your actual password). We also record when you last signed in.',
          '**Profiles.** Depending on your role: student ID, department, batch, semester, section, skills and bio (students); designation, department, employee ID, office and expertise (faculty); batch, graduation year, job title, company, location and bio (alumni); plus an optional photo link and social links.',
          '**Membership applications.** Name, email, WhatsApp and backup phone, student ID, department, batch, shift (day/evening), T-shirt size, blood group, Facebook profile, a semi-formal photo, payment method, the number you paid from and the transaction ID, soft skills and experience.',
          '**Contact messages.** The name, email, phone, subject and message you send through the contact form.',
          '**Visit statistics.** When you open the site we record one visit per browser session: IP address, approximate country, the referring website, the page path and your browser’s user-agent. We use this only for anonymous traffic statistics on the admin dashboard.',
        ],
      },
      {
        id: 'how-we-use',
        heading: 'How we use your information',
        body: [
          {
            list: [
              'to create and secure your account and let you sign in;',
              'to review membership applications, verify payments and contact applicants;',
              'to show public profiles you agreed to share — the Executives pages and, once approved, the Alumni directory;',
              'to organise events, issue certificates and T-shirts, and keep emergency details such as blood group for club activities;',
              'to answer messages sent through the contact form;',
              'to understand how many people visit the site and keep it working and safe.',
            ],
          },
        ],
      },
      {
        id: 'who-can-see',
        heading: 'Who can see your information',
        body: [
          '**Public:** news posts, executive committee profiles (name, role, batch, department, shift, photo, links) and approved alumni entries (name, batch, job, company, links).',
          '**Admins only:** account details, student and faculty profiles, membership applications (including photos, phone numbers and payment details), contact messages and visit statistics. Applicant photos are never shown publicly.',
          'We do not sell, rent or trade personal information. We share it outside the club only when required by the University of South Asia’s rules or by law.',
        ],
      },
      {
        id: 'storage-security',
        heading: 'Storage and security',
        body: [
          'Data is stored in a secured MongoDB database. Passwords are hashed with bcrypt, sessions use a signed token in an httpOnly cookie, admin pages and data require an admin account, and sign-in attempts are rate-limited.',
          'Email notifications for contact messages are sent through our email provider. No system is perfectly secure, but we take reasonable steps to protect your information and limit access to the people who need it.',
        ],
      },
      {
        id: 'retention',
        heading: 'How long we keep it',
        body: [
          'Accounts and profiles are kept while the account exists. Membership applications are kept for the membership year and up to one year after for club records. Contact messages and visit statistics are deleted when no longer needed. You can ask us to delete your data sooner.',
        ],
      },
      {
        id: 'your-rights',
        heading: 'Your choices and rights',
        body: [
          {
            list: [
              '**See and correct** your account and profile any time from [My Account](/account).',
              '**Hide** your alumni entry from the public directory, or ask us to remove a photo of you.',
              '**Delete** your account or membership application by contacting us — we will confirm within 14 days.',
              '**Theme and cookies:** see our [Cookie Policy](/legal/cookiepolicy).',
            ],
          },
        ],
      },
      {
        id: 'children',
        heading: 'Age',
        body: ['The website is meant for university students, alumni and faculty. We do not knowingly collect information from children under 16.'],
      },
      {
        id: 'changes',
        heading: 'Changes to this policy',
        body: ['We will update this page if we change how we handle personal information. The “Last updated” date shows the current version.'],
      },
      contactSection(),
    ],
  },

  cookiepolicy: {
    title: 'Cookie Policy',
    summary: 'The small amount of information this website stores in your browser, and why.',
    lastUpdated: UPDATED,
    sections: [
      {
        id: 'what',
        heading: 'What are cookies and browser storage?',
        body: [
          'Cookies are small text files a website saves in your browser. Websites can also keep small values in your browser’s “local storage” and “session storage”. We use these only for things the site needs to work — **no advertising, no social-media trackers and no third-party analytics**.',
        ],
      },
      {
        id: 'what-we-use',
        heading: 'What we store',
        body: [
          {
            list: [
              '**`token` (cookie, essential)** — keeps you signed in after you log in. It is httpOnly (scripts cannot read it), sent only to this website, and expires after 7 days or when you log out.',
              '**`theme` (local storage, preference)** — remembers whether you chose light or dark mode. If it is missing, the site follows your device setting.',
              '**`visitor_logged` (session storage, essential)** — makes sure we count your visit only once per browser session. It disappears when you close the browser tab.',
            ],
          },
          'Photos on the site are optimised and served by our own server, so viewing pages does not load third-party trackers.',
        ],
      },
      {
        id: 'control',
        heading: 'Your choices',
        body: [
          'You can delete cookies and site data in your browser settings at any time. If you block the `token` cookie you will not be able to sign in; if you clear `theme` the site simply goes back to your device’s theme. Everything else on the public site keeps working.',
          'Because we only use essential and preference storage, we do not show a cookie consent banner. If we ever add optional cookies (for example analytics), we will ask for your consent first and update this page.',
        ],
      },
      contactSection(),
    ],
  },

  refundpolicy: {
    title: 'Refund Policy',
    summary: 'When membership and event fees can be refunded, and how to ask for one.',
    lastUpdated: UPDATED,
    sections: [
      {
        id: 'scope',
        heading: 'What this policy covers',
        body: [
          `This policy covers payments made to the ${CLUB} — the club membership fee paid when applying on the [Join page](/join), and fees for events, workshops or contests that are collected by the club. The club is a non-profit student organisation; fees pay for T-shirts, ID cards, certificates, event materials and activities.`,
        ],
      },
      {
        id: 'membership-fee',
        heading: 'Membership fee',
        body: [
          {
            list: [
              '**Application rejected:** if we reject your application, the full fee is refunded.',
              '**Duplicate or wrong payment:** if you paid twice, paid the wrong amount, or sent money by mistake, the extra amount is refunded once we verify the transaction.',
              '**Changed your mind:** you can ask for a full refund **before your application is approved**.',
              '**After approval:** the membership fee is not refundable once your application is approved, because member items (such as T-shirts and ID cards) are ordered for you.',
            ],
          },
        ],
      },
      {
        id: 'event-fees',
        heading: 'Event, workshop and contest fees',
        body: [
          {
            list: [
              '**Cancelled by the club:** full refund, or a transfer to the rescheduled event if you prefer.',
              '**Date or venue changed:** full refund if you can no longer attend — ask before the new date.',
              '**You cancel:** full refund up to 72 hours before the event starts; after that, fees are not refundable because seats, food and materials are already arranged.',
              '**No-shows** are not refunded.',
            ],
          },
          'Some events may announce different terms (for example inter-university contests with external partners); in that case the terms announced for that event apply.',
        ],
      },
      {
        id: 'how-to-request',
        heading: 'How to request a refund',
        body: [
          `Email **${EMAIL}** within **7 days** of the payment (or of the cancellation/rejection) with:`,
          {
            list: [
              'your full name and student ID;',
              'the payment method (bKash / Nagad / Rocket / cash), the number you paid from and the transaction ID or money receipt;',
              'the amount and the reason for the refund.',
            ],
          },
        ],
      },
      {
        id: 'processing',
        heading: 'How refunds are paid',
        body: [
          'Approved refunds are sent within **7–10 working days** to the same mobile wallet number you paid from (or in cash at the club desk for cash payments). Mobile banking charges deducted by your provider when you paid are not refundable.',
        ],
      },
      contactSection(' Refund requests are handled by the club treasurer together with a faculty advisor.'),
    ],
  },
};

// Order of the tabs on the legal pages (keys match /legal/<key> routes)
export const LEGAL_ORDER = ['termsofuse', 'appprivacypolicy', 'cookiepolicy', 'refundpolicy'];
