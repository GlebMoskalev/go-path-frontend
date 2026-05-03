/**
 * Path · Motion tokens
 *
 * One place to keep timing + easing so every page reads as the same product.
 * Use `transition={ease.emphasized}` patterns rather than ad-hoc cubic-beziers.
 */
import type { Transition, Variants } from 'motion/react';

export const ease = {
  standard: [0.4, 0, 0.2, 1] as const,
  emphasized: [0.16, 1, 0.3, 1] as const,        // out-expo, for entrances
  emphasizedIn: [0.7, 0, 0.84, 0] as const,      // in-expo, for exits
} as const;

export const dur = {
  fast: 0.14,
  base: 0.22,
  slow: 0.36,
  page: 0.48,
} as const;

export const tx = {
  pageEnter: { duration: dur.page, ease: ease.emphasized } satisfies Transition,
  fast: { duration: dur.fast, ease: ease.standard } satisfies Transition,
  base: { duration: dur.base, ease: ease.standard } satisfies Transition,
  slow: { duration: dur.slow, ease: ease.emphasized } satisfies Transition,
};

/** Common variants */
export const fadeUp: Variants = {
  hidden: { opacity: 0, y: 18 },
  visible: { opacity: 1, y: 0, transition: { duration: dur.slow, ease: ease.emphasized } },
};

export const fadeIn: Variants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { duration: dur.base, ease: ease.standard } },
};

export const scaleIn: Variants = {
  hidden: { opacity: 0, scale: 0.97 },
  visible: { opacity: 1, scale: 1, transition: { duration: dur.slow, ease: ease.emphasized } },
};

/** Container that staggers its children */
export const staggerParent = (stagger = 0.06, delayChildren = 0): Variants => ({
  hidden: {},
  visible: { transition: { staggerChildren: stagger, delayChildren } },
});

export const staggerChild: Variants = {
  hidden: { opacity: 0, y: 14 },
  visible: { opacity: 1, y: 0, transition: { duration: dur.slow, ease: ease.emphasized } },
};

/** Page transition wrapper */
export const pageVariants: Variants = {
  initial: { opacity: 0, y: 8 },
  enter: { opacity: 1, y: 0, transition: tx.pageEnter },
  exit: { opacity: 0, y: -8, transition: tx.fast },
};
