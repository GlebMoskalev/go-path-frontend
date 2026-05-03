import React, { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';

export type GopherMood = 'normal' | 'happy' | 'sad';

interface GopherMoodValue {
  mood: GopherMood;
  /**
   * Set the gopher's mood. Any non-'normal' mood auto-reverts to 'normal'
   * after `revertMs` (default 2500ms). Calling again before revert resets the timer.
   */
  setMood: (mood: GopherMood, revertMs?: number) => void;
}

const GopherMoodContext = createContext<GopherMoodValue | null>(null);

export function GopherMoodProvider({ children }: { children: React.ReactNode }) {
  const [mood, setMoodState] = useState<GopherMood>('normal');
  const timerRef = useRef<number | null>(null);

  const setMood = useCallback((next: GopherMood, revertMs = 2500) => {
    if (timerRef.current !== null) {
      window.clearTimeout(timerRef.current);
      timerRef.current = null;
    }
    setMoodState(next);
    if (next !== 'normal') {
      timerRef.current = window.setTimeout(() => {
        setMoodState('normal');
        timerRef.current = null;
      }, revertMs);
    }
  }, []);

  useEffect(() => {
    return () => {
      if (timerRef.current !== null) window.clearTimeout(timerRef.current);
    };
  }, []);

  return (
    <GopherMoodContext.Provider value={{ mood, setMood }}>
      {children}
    </GopherMoodContext.Provider>
  );
}

export function useGopherMood(): GopherMoodValue {
  const ctx = useContext(GopherMoodContext);
  if (!ctx) throw new Error('useGopherMood must be used within GopherMoodProvider');
  return ctx;
}
