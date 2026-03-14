// Adapted from react-bits by David Haz (MIT + Commons Clause)
// https://reactbits.dev/text-animations/shiny-text

import { useState, useCallback, useEffect, useRef } from 'react';
import { motion, useMotionValue, useAnimationFrame, useTransform } from 'motion/react';

interface ShinyTextProps {
  text: string;
  disabled?: boolean;
  speed?: number;
  className?: string;
  color?: string;
  shineColor?: string;
  spread?: number;
  yoyo?: boolean;
  pauseOnHover?: boolean;
  direction?: 'left' | 'right';
  delay?: number;
}

export default function ShinyText({
  text, disabled = false, speed = 2, className = '',
  color = '#b5b5b5', shineColor = '#ffffff', spread = 120,
  yoyo = false, pauseOnHover = false, direction = 'left', delay = 0,
}: ShinyTextProps) {
  const [isPaused, setIsPaused] = useState(false);
  const progress = useMotionValue(0);
  const elapsedRef = useRef(0);
  const lastTimeRef = useRef<number | null>(null);
  const dirRef = useRef(direction === 'left' ? 1 : -1);
  const dur = speed * 1000;
  const delayMs = delay * 1000;

  useAnimationFrame(time => {
    if (disabled || isPaused) { lastTimeRef.current = null; return; }
    if (lastTimeRef.current === null) { lastTimeRef.current = time; return; }
    elapsedRef.current += time - lastTimeRef.current;
    lastTimeRef.current = time;
    const cycleDur = dur + delayMs;
    if (yoyo) {
      const full = cycleDur * 2;
      const ct = elapsedRef.current % full;
      if (ct < dur) { const p = (ct / dur) * 100; progress.set(dirRef.current === 1 ? p : 100 - p); }
      else if (ct < cycleDur) { progress.set(dirRef.current === 1 ? 100 : 0); }
      else if (ct < cycleDur + dur) { const p = 100 - ((ct - cycleDur) / dur) * 100; progress.set(dirRef.current === 1 ? p : 100 - p); }
      else { progress.set(dirRef.current === 1 ? 0 : 100); }
    } else {
      const ct = elapsedRef.current % cycleDur;
      if (ct < dur) { const p = (ct / dur) * 100; progress.set(dirRef.current === 1 ? p : 100 - p); }
      else { progress.set(dirRef.current === 1 ? 100 : 0); }
    }
  });

  useEffect(() => { dirRef.current = direction === 'left' ? 1 : -1; elapsedRef.current = 0; progress.set(0); }, [direction, progress]);

  const bgPos = useTransform(progress, p => `${150 - p * 2}% center`);
  const onEnter = useCallback(() => { if (pauseOnHover) setIsPaused(true); }, [pauseOnHover]);
  const onLeave = useCallback(() => { if (pauseOnHover) setIsPaused(false); }, [pauseOnHover]);

  return (
    <motion.span
      className={className}
      style={{
        display: 'inline-block',
        backgroundImage: `linear-gradient(${spread}deg, ${color} 0%, ${color} 35%, ${shineColor} 50%, ${color} 65%, ${color} 100%)`,
        backgroundSize: '200% auto',
        WebkitBackgroundClip: 'text',
        backgroundClip: 'text',
        WebkitTextFillColor: 'transparent',
        backgroundPosition: bgPos,
      }}
      onMouseEnter={onEnter}
      onMouseLeave={onLeave}
    >
      {text}
    </motion.span>
  );
}
