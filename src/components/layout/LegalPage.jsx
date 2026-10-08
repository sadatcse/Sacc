import Link from 'next/link';
import { FaEnvelope } from 'react-icons/fa';
import { siteConfig } from '@/config/site';
import { legalDocs, LEGAL_ORDER } from '@/data/legal';
import { cn } from '@/lib/utils';
import DarkPageHeader from '@/components/ui/DarkPageHeader';
import { Inline } from '@/components/news/RichText';

function Block({ block }) {
  if (typeof block === 'string') return <p className="leading-relaxed text-body"><Inline text={block} /></p>;
  return (
    <ul className="space-y-2 pl-5 text-body marker:text-orange-500 [list-style:disc]">
      {block.list.map((item) => <li key={item} className="pl-1 leading-relaxed"><Inline text={item} /></li>)}
    </ul>
  );
}

// Shared layout for every /legal page. Text lives in src/data/legal.js; `docKey` is the route name.
export default function LegalPage({ docKey }) {
  const doc = legalDocs[docKey];

  return (
    <div className="bg-canvas">
      <DarkPageHeader title={doc.title} subtitle={doc.summary} breadcrumbs={[{ label: 'Legal' }, { label: doc.title }]}>
        <p className="mt-3 text-xs text-subtle">Last updated: {doc.lastUpdated}</p>
        {/* Switch between the legal documents */}
        <nav aria-label="Legal documents" className="-mx-4 mt-6 flex gap-2 overflow-x-auto px-4 pb-1 [scrollbar-width:none]">
          {LEGAL_ORDER.map((key) => (
            <Link
              key={key}
              href={`/legal/${key}`}
              aria-current={key === docKey ? 'page' : undefined}
              className={cn(
                'shrink-0 rounded-full border px-4 py-1.5 text-sm font-medium transition-colors',
                key === docKey ? 'border-transparent bg-gradient-to-r from-red-600 to-orange-500 text-white' : 'border-line/15 text-muted hover:border-orange-500/60 hover:text-ink'
              )}
            >
              {legalDocs[key].title}
            </Link>
          ))}
        </nav>
      </DarkPageHeader>

      <div className="container max-w-6xl py-10 md:py-14 lg:grid lg:grid-cols-[220px_1fr] lg:gap-12">
        {/* Table of contents — sticky on laptops, collapsible on phones */}
        <aside className="mb-8 lg:mb-0">
          <details className="rounded-xl border border-line/10 bg-surface p-4 lg:sticky lg:top-24 lg:border-0 lg:bg-transparent lg:p-0" open>
            <summary className="cursor-pointer text-xs font-bold uppercase tracking-widest text-subtle lg:pointer-events-none lg:list-none">On this page</summary>
            <ol className="mt-3 space-y-1.5 text-sm">
              {doc.sections.map((s, i) => (
                <li key={s.id}>
                  <a href={`#${s.id}`} className="flex gap-2 text-muted transition-colors hover:text-orange-600 dark:hover:text-orange-400">
                    <span className="w-5 shrink-0 text-faint">{i + 1}.</span> {s.heading}
                  </a>
                </li>
              ))}
            </ol>
          </details>
        </aside>

        <article className="min-w-0 max-w-3xl">
          <div className="space-y-10">
            {doc.sections.map((s, i) => (
              <section key={s.id} id={s.id} className="scroll-mt-24">
                <h2 className="mb-3 flex items-baseline gap-3 text-xl">
                  <span className="text-sm font-bold text-orange-600 dark:text-orange-400">{String(i + 1).padStart(2, '0')}</span>
                  {s.heading}
                </h2>
                <div className="space-y-3">
                  {s.body.map((block, j) => <Block key={j} block={block} />)}
                </div>
              </section>
            ))}
          </div>

          <div className="mt-12 flex flex-col items-start gap-4 rounded-2xl border border-line/10 bg-surface p-6 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="font-semibold text-ink">Still have a question?</p>
              <p className="text-sm text-muted">We usually reply within a few working days.</p>
            </div>
            <a
              href={`mailto:${siteConfig.contact.email}`}
              className="inline-flex items-center gap-2 rounded-lg bg-gradient-to-r from-red-600 to-orange-500 px-4 py-2.5 text-sm font-semibold text-white"
            >
              <FaEnvelope aria-hidden /> {siteConfig.contact.email}
            </a>
          </div>
        </article>
      </div>
    </div>
  );
}
