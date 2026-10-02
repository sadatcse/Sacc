'use client';
import { useEffect, useRef, useState } from 'react';
import { MotionConfig, animate, motion, useInView } from 'motion/react';

const EASE = [0.22, 1, 0.36, 1];

// Respects the visitor's "reduce motion" OS setting for every animation inside.
export function MotionRoot({ children }) {
  return <MotionConfig reducedMotion="user">{children}</MotionConfig>;
}

// Fades + slides its children in the first time they scroll into view.
export function Reveal({ children, className, delay = 0, y = 30, x = 0 }) {
  return (
    <motion.div
      className={className}
      initial={{ opacity: 0, y, x }}
      whileInView={{ opacity: 1, y: 0, x: 0 }}
      viewport={{ once: true, margin: '-60px' }}
      transition={{ duration: 0.7, ease: EASE, delay }}
    >
      {children}
    </motion.div>
  );
}

// A grid/list whose <StaggerItem> children animate in one after another.
export function Stagger({ children, className, gap = 0.08 }) {
  return (
    <motion.div
      className={className}
      initial="hidden"
      whileInView="show"
      viewport={{ once: true, margin: '-60px' }}
      variants={{ hidden: {}, show: { transition: { staggerChildren: gap } } }}
    >
      {children}
    </motion.div>
  );
}

export function StaggerItem({ children, className }) {
  return (
    <motion.div
      className={className}
      variants={{
        hidden: { opacity: 0, y: 24, scale: 0.96 },
        show: { opacity: 1, y: 0, scale: 1, transition: { duration: 0.5, ease: EASE } },
      }}
      whileHover={{ y: -6 }}
    >
      {children}
    </motion.div>
  );
}

// Counts up from 0 to `value` when scrolled into view.
export function Counter({ value, suffix = '', from = 0 }) {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true });
  const [display, setDisplay] = useState(from);

  useEffect(() => {
    if (!inView) return;
    const controls = animate(from, value, { duration: 1.6, ease: 'easeOut', onUpdate: (v) => setDisplay(Math.round(v)) });
    return () => controls.stop();
  }, [inView, value, from]);

  return (
    <span ref={ref}>
      {display}
      {suffix}
    </span>
  );
}
