'use client';

/**
 * Revelação curta ao rolar (fade + rise). Respeita prefers-reduced-motion,
 * dispara uma única vez e usa durações curtas para não atrapalhar a navegação.
 * Baseado em motion/react (framer-motion) — whileInView + useReducedMotion.
 * Docs: https://motion.dev/docs/react-scroll-animations
 */
import { motion, useReducedMotion } from 'framer-motion';
import type { ReactNode } from 'react';

export function Reveal({
  children,
  delay = 0,
  y = 22,
  className,
  as = 'div',
}: {
  children: ReactNode;
  delay?: number;
  y?: number;
  className?: string;
  as?: 'div' | 'section' | 'li' | 'article' | 'span';
}) {
  const reduced = useReducedMotion();
  const Comp = motion[as] as typeof motion.div;

  if (reduced) {
    return <Comp className={className}>{children}</Comp>;
  }

  return (
    <Comp
      className={className}
      initial={{ opacity: 0, y }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-60px' }}
      transition={{ duration: 0.5, delay, ease: [0.21, 0.65, 0.36, 1] }}
    >
      {children}
    </Comp>
  );
}
