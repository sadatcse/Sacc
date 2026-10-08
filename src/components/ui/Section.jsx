import { cn } from '@/lib/utils';
import Container from './Container';

// A page section with an optional heading. Use for every block on a public page.
export default function Section({ id, title, subtitle, children, className, muted = false }) {
  return (
    <section id={id} className={cn('py-16', muted && 'bg-canvas', className)}>
      <Container>
        {(title || subtitle) && (
          <div className="mb-10 text-center">
            {title && <h2 className="text-3xl">{title}</h2>}
            {subtitle && <p className="mx-auto mt-3 max-w-2xl text-muted">{subtitle}</p>}
          </div>
        )}
        {children}
      </Container>
    </section>
  );
}
