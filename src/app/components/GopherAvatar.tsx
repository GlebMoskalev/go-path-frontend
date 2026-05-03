import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useGopherMood, type GopherMood } from '../context/GopherMoodContext';

import normalUrl from '../../assets/gophers/normal.png';
import happyUrl from '../../assets/gophers/happy.png';
import sadUrl from '../../assets/gophers/sad.png';

const MOOD_SOURCES: Record<GopherMood, string> = {
  normal: normalUrl,
  happy: happyUrl,
  sad: sadUrl,
};

const MOOD_LABEL: Record<GopherMood, string> = {
  normal: 'Гофер',
  happy: 'Радостный гофер — ответ верный',
  sad: 'Грустный гофер — ответ неверный',
};

interface Props {
  size?: number;
  className?: string;
  /** When false, no hover wiggle. */
  interactive?: boolean;
  /** Override mood — by default reads from GopherMoodContext. */
  mood?: GopherMood;
}

/**
 * Mood-aware gopher avatar built on Egon Elbre's CC0 emoji set.
 * Mood comes from GopherMoodContext (or `mood` prop). On hover the gopher
 * does a small wiggle + bounce. Mood transitions cross-fade with a soft pop.
 */
export function GopherAvatar({ size = 28, className, interactive = true, mood: moodOverride }: Props) {
  const { mood: ctxMood } = useGopherMood();
  const mood = moodOverride ?? ctxMood;
  const [hover, setHover] = useState(false);
  const active = interactive && hover;

  return (
    <motion.span
      className={className}
      onMouseEnter={interactive ? () => setHover(true) : undefined}
      onMouseLeave={interactive ? () => setHover(false) : undefined}
      animate={active ? { rotate: [0, -8, 8, -3, 0] } : { rotate: 0 }}
      transition={{ duration: 0.55, ease: [0.4, 0, 0.2, 1] }}
      style={{
        position: 'relative',
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        width: size,
        height: size,
        flexShrink: 0,
        cursor: interactive ? 'pointer' : 'default',
      }}
    >
      <AnimatePresence mode="popLayout" initial={false}>
        <motion.img
          key={mood}
          src={MOOD_SOURCES[mood]}
          alt={MOOD_LABEL[mood]}
          width={size}
          height={size}
          draggable={false}
          initial={{ opacity: 0, scale: 0.6, rotate: mood === 'sad' ? -8 : mood === 'happy' ? 8 : 0 }}
          animate={{ opacity: 1, scale: active ? 1.08 : 1, rotate: 0 }}
          exit={{ opacity: 0, scale: 0.6 }}
          transition={{ duration: 0.28, ease: [0.16, 1, 0.3, 1] }}
          style={{
            width: size,
            height: size,
            display: 'block',
            objectFit: 'contain',
            imageRendering: 'auto',
            userSelect: 'none',
            pointerEvents: 'none',
          }}
        />
      </AnimatePresence>
    </motion.span>
  );
}
