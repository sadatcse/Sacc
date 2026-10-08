import LegalPage from '@/components/layout/LegalPage';
import { legalDocs } from '@/data/legal';

export const metadata = { title: 'Privacy Policy', description: legalDocs.appprivacypolicy.summary };

export default function Page() {
  return <LegalPage docKey="appprivacypolicy" />;
}
