import LegalPage from '@/components/layout/LegalPage';
import { legalDocs } from '@/data/legal';

export const metadata = { title: 'Refund Policy', description: legalDocs.refundpolicy.summary, alternates: { canonical: '/legal/refundpolicy' } };

export default function Page() {
  return <LegalPage docKey="refundpolicy" />;
}
