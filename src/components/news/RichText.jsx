import Image from 'next/image';
import Link from 'next/link';
import { FaCheck, FaTimes } from 'react-icons/fa';
import CodeBlock from '@/components/news/CodeBlock';

// Inline markup: **bold**, *italic*, `code`, [label](url). Returns React nodes (no raw HTML).
const INLINE = /(\*\*([^*]+)\*\*|\*([^*]+)\*|`([^`]+)`|\[([^\]]+)\]\(([^)]+)\))/g;

export function Inline({ text }) {
  const nodes = [];
  let last = 0;
  for (const m of text.matchAll(INLINE)) {
    if (m.index > last) nodes.push(text.slice(last, m.index));
    const key = m.index;
    if (m[2]) nodes.push(<strong key={key} className="font-semibold text-ink"><Inline text={m[2]} /></strong>);
    else if (m[3]) nodes.push(<em key={key} className="italic text-ink-2"><Inline text={m[3]} /></em>);
    else if (m[4]) nodes.push(<code key={key} className="rounded bg-line/10 px-1.5 py-0.5 font-mono text-[0.85em] text-orange-700 dark:text-orange-300">{m[4]}</code>);
    else if (m[5]) {
      const href = m[6];
      const cls = 'font-medium text-orange-600 dark:text-orange-400 underline-offset-4 hover:underline';
      nodes.push(
        href.startsWith('/') ? (
          <Link key={key} href={href} className={cls}>{m[5]}</Link>
        ) : (
          <a key={key} href={href} target="_blank" rel="noopener noreferrer" className={cls}>{m[5]}</a>
        )
      );
    }
    last = m.index + m[0].length;
  }
  if (last < text.length) nodes.push(text.slice(last));
  return nodes;
}

function Cell({ value }) {
  if (value === '✓') return <FaCheck className="mx-auto text-emerald-600 dark:text-emerald-400" aria-label="Yes" />;
  if (value === '✗') return <FaTimes className="mx-auto text-red-500" aria-label="No" />;
  return <Inline text={value} />;
}

function Table({ headers, rows, caption }) {
  return (
    <figure className="my-8">
      <div className="overflow-x-auto rounded-xl border border-line/10 bg-surface/60">
        <table className="w-full min-w-[540px] border-collapse text-left text-sm">
          <thead>
            <tr className="border-b border-line/10 bg-line/[0.04]">
              {headers.map((h, i) => (
                <th key={h} scope="col" className={`px-4 py-3 font-semibold text-ink ${i > 0 && rows.every((r) => /^[✓✗]$/.test(r[i])) ? 'text-center' : ''}`}>
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row, r) => (
              <tr key={r} className="border-b border-line/5 last:border-0 odd:bg-line/[0.015] hover:bg-line/[0.04]">
                {row.map((cell, c) => (
                  <td key={c} className={`px-4 py-2.5 align-top ${c === 0 ? 'font-medium text-ink-2' : 'text-muted'} ${/^[✓✗]$/.test(cell) ? 'text-center' : ''}`}>
                    <Cell value={cell} />
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {caption && <figcaption className="mt-3 text-center text-xs italic text-subtle">{caption}</figcaption>}
    </figure>
  );
}

// Renders a post body (see the block list at the top of src/data/news.js)
export default function RichText({ blocks = [] }) {
  return (
    <div className="text-[15px] leading-7 text-muted md:text-base md:leading-8">
      {blocks.map((block, i) => {
        switch (block.type) {
          case 'h2':
            return <h2 key={i} className="mb-4 mt-12 border-b border-line/10 pb-3 text-2xl font-bold text-ink first:mt-0">{block.text}</h2>;
          case 'h3':
            return <h3 key={i} className="mb-3 mt-8 text-lg font-semibold text-ink">{block.text}</h3>;
          case 'ul':
          case 'ol': {
            const List = block.type;
            return (
              <List key={i} className={`my-5 space-y-2.5 pl-6 marker:text-orange-500 ${block.type === 'ul' ? 'list-disc' : 'list-decimal marker:font-semibold'}`}>
                {block.items.map((item, j) => <li key={j} className="pl-1.5"><Inline text={item} /></li>)}
              </List>
            );
          }
          case 'quote':
            return (
              <blockquote key={i} className="my-8 rounded-r-xl border-l-4 border-orange-500 bg-orange-500/5 py-4 pl-5 pr-4 text-lg italic text-ink-2">
                <Inline text={block.text} />
              </blockquote>
            );
          case 'code':
            return <CodeBlock key={i} lang={block.lang} code={block.code} />;
          case 'table':
            return <Table key={i} {...block} />;
          case 'image':
            return (
              <figure key={i} className="my-8">
                <div className="relative aspect-[16/9] overflow-hidden rounded-xl border border-line/10">
                  <Image src={block.src} alt={block.alt || ''} fill sizes="(min-width: 768px) 720px, 100vw" className="object-cover" />
                </div>
                {block.caption && <figcaption className="mt-3 text-center text-xs italic text-subtle">{block.caption}</figcaption>}
              </figure>
            );
          default:
            return <p key={i} className="my-5 first:mt-0"><Inline text={block.text} /></p>;
        }
      })}
    </div>
  );
}
