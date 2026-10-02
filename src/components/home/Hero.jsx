'use client';
import Image from 'next/image';
import { motion } from 'motion/react';
import { FaArrowRight, FaUserPlus } from 'react-icons/fa';
import { hero } from '@/data/home';
import { HomeButton } from './ui';

const EASE = [0.22, 1, 0.36, 1];
const RADIUS = 46; // % of the orbit box

function fadeUp(delay) {
  return { initial: { opacity: 0, y: 30 }, animate: { opacity: 1, y: 0 }, transition: { duration: 0.8, ease: EASE, delay } };
}

// Logo in the middle with tech icons circling around it
function Orbit() {
  return (
    <motion.div
      className="relative mx-auto aspect-square w-full max-w-[300px] sm:max-w-[440px]"
      initial={{ opacity: 0, scale: 0.85 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 1, ease: EASE, delay: 0.3 }}
    >
      {/* Glow + rings */}
      <div className="absolute inset-[18%] rounded-full bg-red-600/30 blur-3xl" />
      <div className="absolute inset-[4%] rounded-full border border-red-500/20" />
      <div className="absolute inset-[16%] rounded-full border border-dashed border-orange-500/30" />
      <motion.div
        className="absolute inset-[28%] rounded-full border-2 border-red-600/40 border-t-orange-500"
        animate={{ rotate: 360 }}
        transition={{ duration: 8, repeat: Infinity, ease: 'linear' }}
      />

      {/* Center logo */}
      <motion.div
        className="absolute inset-[32%] flex items-center justify-center rounded-full bg-neutral-950/80 p-[12%] ring-1 ring-white/10"
        animate={{ scale: [1, 1.05, 1] }}
        transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
      >
        <Image src="/logo.png" alt="Club logo" width={270} height={251} className="h-auto w-full drop-shadow-[0_0_25px_rgba(239,68,68,0.6)]" priority />
      </motion.div>

      {/* Orbiting icons: the ring spins, each icon counter-spins to stay upright */}
      <motion.div className="absolute inset-0" animate={{ rotate: 360 }} transition={{ duration: 40, repeat: Infinity, ease: 'linear' }}>
        {hero.orbit.map((Icon, i) => {
          const angle = (i / hero.orbit.length) * 2 * Math.PI;
          return (
            <div
              key={i}
              className="absolute -translate-x-1/2 -translate-y-1/2"
              style={{ left: `${50 + RADIUS * Math.cos(angle)}%`, top: `${50 + RADIUS * Math.sin(angle)}%` }}
            >
              <motion.span
                className="flex h-10 w-10 items-center justify-center rounded-full border border-orange-500/60 bg-neutral-900 text-base text-orange-400 shadow-[0_0_18px_rgba(249,115,22,0.35)] sm:h-14 sm:w-14 sm:text-xl"
                animate={{ rotate: -360 }}
                transition={{ duration: 40, repeat: Infinity, ease: 'linear' }}
              >
                <Icon aria-hidden />
              </motion.span>
            </div>
          );
        })}
      </motion.div>
    </motion.div>
  );
}

export default function Hero() {
  const [first, second, accent] = hero.title;
  return (
    <section className="relative overflow-hidden bg-neutral-950">
      {/* Background: red radial glow + faint grid */}
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_70%_50%,rgba(220,38,38,0.25),transparent_60%)]" />
      <div className="pointer-events-none absolute inset-0 opacity-[0.07] [background-image:linear-gradient(#fff_1px,transparent_1px),linear-gradient(90deg,#fff_1px,transparent_1px)] [background-size:48px_48px]" />

      <div className="container relative grid max-w-7xl items-center gap-12 py-16 md:py-24 lg:grid-cols-2">
        <div>
          <motion.h1 {...fadeUp(0)} className="text-4xl font-extrabold leading-tight text-white sm:text-5xl lg:text-6xl">
            {first}
            <br />
            {second} <span className="text-orange-500">{accent}</span>
          </motion.h1>
          <motion.p {...fadeUp(0.1)} className="mt-3 text-lg font-medium text-neutral-200 sm:text-xl">
            {hero.subtitle}
          </motion.p>
          <motion.p {...fadeUp(0.2)} className="mt-6 max-w-md text-xl font-semibold text-orange-400 sm:text-2xl">
            {hero.tagline}
          </motion.p>
          <motion.p {...fadeUp(0.3)} className="mt-5 max-w-md text-neutral-400">
            {hero.description}
          </motion.p>
          <motion.div {...fadeUp(0.4)} className="mt-8 flex flex-wrap gap-4">
            <HomeButton href="/about" variant="red">
              Explore the Club <FaArrowRight aria-hidden />
            </HomeButton>
            <HomeButton href="#join" variant="orange">
              Join the Club <FaUserPlus aria-hidden />
            </HomeButton>
          </motion.div>
        </div>

        <Orbit />
      </div>
    </section>
  );
}
