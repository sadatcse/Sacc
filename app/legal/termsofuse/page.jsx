import LegalPage from '@/components/layout/LegalPage';
import { legalDocs } from '@/data/legal';

export const metadata = { title: 'Terms of Use', description: legalDocs.termsofuse.summary };

export default function Page() {
  return <LegalPage docKey="termsofuse" />;
}
