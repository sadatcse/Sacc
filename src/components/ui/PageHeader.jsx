import Link from 'next/link';
import Container from './Container';

// Top banner for every public page (title + subtitle + breadcrumb).
export default function PageHeader({ title, subtitle, breadcrumbs = [] }) {
  return (
    <header className="border-b border-gray-200 bg-gray-50 py-14">
      <Container>
        {breadcrumbs.length > 0 && (
          <nav aria-label="Breadcrumb" className="mb-4 text-sm text-gray-500">
            <Link href="/" className="hover:text-primary-600">Home</Link>
            {breadcrumbs.map((crumb) => (
              <span key={crumb.label}>
                <span className="mx-2">/</span>
                {crumb.href ? (
                  <Link href={crumb.href} className="hover:text-primary-600">{crumb.label}</Link>
                ) : (
                  <span className="text-gray-700">{crumb.label}</span>
                )}
              </span>
            ))}
          </nav>
        )}
        <h1 className="text-4xl">{title}</h1>
        {subtitle && <p className="mt-3 max-w-2xl text-gray-600">{subtitle}</p>}
      </Container>
    </header>
  );
}
