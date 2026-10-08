import Image from 'next/image';
import Link from 'next/link';
import { FaArrowLeft, FaArrowRight } from 'react-icons/fa';
import { MdVerified } from 'react-icons/md';
import { siteConfig } from '@/config/site';
import { readingTime } from '@/lib/news-utils';
import { categoryLabel } from '@/data/news-categories';
import { formatCalendarDate } from '@/lib/utils';
import RichText from '@/components/news/RichText';
import ShareButton from '@/components/news/ShareButton';
import { Reveal } from '@/components/home/motion';

function initials(name) {
  return name.split(/\s+/).filter((w) => /^[A-Z]/.test(w) && !w.endsWith('.')).slice(0, 2).map((w) => w[0]).join('') || name[0];
}

// Blog-style layout for type: 'article'
export default function ArticleView({ post }) {
  return (
    <article className="container max-w-3xl py-10 md:py-14">
      <Link href="/news" className="inline-flex items-center gap-2 text-sm text-muted transition-colors hover:text-orange-600 dark:hover:text-orange-400">
        <FaArrowLeft className="text-xs" aria-hidden /> Back to all articles
      </Link>

      <Reveal y={20}>
        <Link href={`/news?category=${post.category}`} className="mt-8 inline-block text-xs font-bold uppercase tracking-[0.2em] text-orange-500 hover:text-orange-600 dark:hover:text-orange-400">
          {categoryLabel(post.category)}
        </Link>
        <h1 className="mt-3 text-4xl font-extrabold leading-tight text-ink md:text-5xl">{post.title}</h1>
        <p className="mt-4 text-lg leading-relaxed text-muted">{post.excerpt}</p>

        <div className="mt-8 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-red-600 to-orange-500 text-sm font-bold text-white">
              {initials(post.author.name)}
            </span>
            <div>
              <p className="flex items-center gap-1.5 text-sm font-semibold text-ink">
                {post.author.name}
                {post.author.verified && <MdVerified className="text-orange-500" aria-label="Verified" />}
              </p>
              <p className="text-xs text-subtle">
                {formatCalendarDate(post.date)} <span className="mx-1">·</span> {readingTime(post)} min read
              </p>
            </div>
          </div>
          <ShareButton title={post.title} />
        </div>
      </Reveal>

      <Reveal y={30} delay={0.1} className="mt-8">
        <div className="relative aspect-[16/9] overflow-hidden rounded-2xl border border-line/10 shadow-[0_20px_60px_-20px_rgba(249,115,22,0.35)]">
          <Image src={post.cover} alt={post.title} fill priority sizes="(min-width: 768px) 768px, 100vw" className="object-cover" />
        </div>
      </Reveal>

      <div className="mt-10">
        <RichText blocks={post.body} />
      </div>

      {post.tags.length > 0 && (
        <div className="mt-10 flex flex-wrap gap-2">
          {post.tags.map((tag) => (
            <span key={tag} className="rounded-full border border-line/10 bg-line/5 px-3 py-1 text-xs text-body">#{tag}</span>
          ))}
        </div>
      )}

      <footer className="mt-14 flex flex-col items-center border-t border-line/10 pt-10 text-center">
        <span className="h-1 w-12 rounded-full bg-gradient-to-r from-red-600 to-orange-500" aria-hidden />
        <p className="mt-5 text-sm text-subtle">Published by {siteConfig.name}</p>
        <Link
          href="/news"
          className="mt-5 inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-red-600 to-orange-500 px-6 py-2.5 text-sm font-semibold text-white shadow-lg shadow-orange-500/20 transition-transform hover:scale-105"
        >
          Explore More Articles <FaArrowRight className="text-xs" aria-hidden />
        </Link>
      </footer>
    </article>
  );
}
