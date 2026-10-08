'use client';
import Link from 'next/link';
import { motion } from 'motion/react';
import { cn } from '@/lib/utils';

// Year switcher; the orange pill slides to the active year.
export default function YearTabs({ years, active }) {
  return (
    <div className="mt-8 flex justify-center">
      <nav
        aria-label="Committee year"
        className="flex max-w-full gap-1 overflow-x-auto rounded-xl border border-line/15 bg-canvas/60 p-1 [scrollbar-width:none]"
      >
        {years.map((year) => {
          const isActive = year === active;
          return (
            <Link
              key={year}
              href={`/executives?year=${year}`}
              scroll={false}
              aria-current={isActive ? 'page' : undefined}
              className={cn(
                'relative shrink-0 rounded-lg px-4 py-1.5 text-sm font-semibold transition-colors',
                isActive ? 'text-white' : 'text-muted hover:text-ink'
              )}
            >
              {isActive && (
                <motion.span
                  layoutId="year-pill"
                  className="absolute inset-0 rounded-lg bg-gradient-to-r from-red-600 to-orange-500"
                  transition={{ type: 'spring', stiffness: 400, damping: 32 }}
                />
              )}
              <span className="relative">{year}</span>
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
