import DashboardShell from '@/components/dashboard/DashboardShell';

export const metadata = { title: 'Dashboard', robots: { index: false, follow: false } };

export default function DashboardLayout({ children }) {
  return <DashboardShell>{children}</DashboardShell>;
}
