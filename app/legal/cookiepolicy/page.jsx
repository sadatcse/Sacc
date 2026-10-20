import LegalPage from '@/components/layout/LegalPage';
import { legalDocs } from '@/data/legal';

export const metadata = { title: 'Cookie Policy', description: legalDocs.cookiepolicy.summary, alternates: { canonical: '/legal/cookiepolicy' } };

export default function Page() {
  return <LegalPage docKey="cookiepolicy" />;
}
