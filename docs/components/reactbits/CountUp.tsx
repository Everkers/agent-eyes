// Adapted from react-bits by David Haz (MIT + Commons Clause)
// https://reactbits.dev/text-animations/count-up

import { useInView, useMotionValue, useSpring } from 'motion/react';
import { useEffect, useRef } from 'react';

interface CountUpProps {
  to: number;
  from?: number;
  direction?: 'up' | 'down';
  delay?: number;
  duration?: number;
  className?: string;
  startWhen?: boolean;
  separator?: string;
  onStart?: () => void;
  onEnd?: () => void;
}

export default function CountUp({
  to, from = 0, direction = 'up', delay = 0, duration = 2,
  className = '', startWhen = true, separator = '', onStart, onEnd,
}: CountUpProps) {
  const ref = useRef<HTMLSpanElement>(null);
  const motionValue = useMotionValue(direction === 'down' ? to : from);
  const springValue = useSpring(motionValue, {
    damping: 20 + 40 * (1 / duration),
    stiffness: 100 * (1 / duration),
  });
  const isInView = useInView(ref, { once: true, margin: '0px' });

  useEffect(() => {
    if (ref.current) ref.current.textContent = String(direction === 'down' ? to : from);
  }, [from, to, direction]);

  useEffect(() => {
    if (isInView && startWhen) {
      onStart?.();
      const t1 = setTimeout(() => motionValue.set(direction === 'down' ? from : to), delay * 1000);
      const t2 = setTimeout(() => onEnd?.(), (delay + duration) * 1000);
      return () => { clearTimeout(t1); clearTimeout(t2); };
    }
  }, [isInView, startWhen, motionValue, direction, from, to, delay, onStart, onEnd, duration]);

  useEffect(() => {
    const unsub = springValue.on('change', v => {
      if (ref.current) {
        const formatted = Intl.NumberFormat('en-US', {
          useGrouping: !!separator,
          minimumFractionDigits: 0,
          maximumFractionDigits: 0,
        }).format(v);
        ref.current.textContent = separator ? formatted.replace(/,/g, separator) : formatted;
      }
    });
    return () => unsub();
  }, [springValue, separator]);

  return <span className={className} ref={ref} />;
}
