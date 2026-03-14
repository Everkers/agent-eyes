// Adapted from react-bits by David Haz (MIT + Commons Clause)
// https://reactbits.dev/text-animations/decrypted-text

import { useEffect, useState, useRef, useMemo, useCallback } from 'react';
import { motion } from 'motion/react';

interface DecryptedTextProps {
  text: string;
  speed?: number;
  maxIterations?: number;
  sequential?: boolean;
  revealDirection?: 'start' | 'end' | 'center';
  useOriginalCharsOnly?: boolean;
  characters?: string;
  className?: string;
  parentClassName?: string;
  encryptedClassName?: string;
  animateOn?: 'hover' | 'view' | 'click';
}

export default function DecryptedText({
  text,
  speed = 50,
  maxIterations = 10,
  sequential = false,
  revealDirection = 'start',
  useOriginalCharsOnly = false,
  characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz!@#$%^&*()_+',
  className = '',
  parentClassName = '',
  encryptedClassName = '',
  animateOn = 'hover',
  ...props
}: DecryptedTextProps & Record<string, unknown>) {
  const [displayText, setDisplayText] = useState(text);
  const [isAnimating, setIsAnimating] = useState(false);
  const [revealedIndices, setRevealedIndices] = useState(new Set<number>());
  const [hasAnimated, setHasAnimated] = useState(false);
  const [isDecrypted, setIsDecrypted] = useState(true);
  const containerRef = useRef<HTMLSpanElement>(null);

  const availableChars = useMemo(() => {
    return useOriginalCharsOnly
      ? Array.from(new Set(text.split(''))).filter(c => c !== ' ')
      : characters.split('');
  }, [useOriginalCharsOnly, text, characters]);

  const shuffleText = useCallback(
    (orig: string, revealed: Set<number>) =>
      orig.split('').map((c, i) => {
        if (c === ' ') return ' ';
        if (revealed.has(i)) return orig[i];
        return availableChars[Math.floor(Math.random() * availableChars.length)];
      }).join(''),
    [availableChars]
  );

  const getNextIndex = useCallback((revealedSet: Set<number>) => {
    const len = text.length;
    if (revealDirection === 'start') return revealedSet.size;
    if (revealDirection === 'end') return len - 1 - revealedSet.size;
    const mid = Math.floor(len / 2);
    const off = Math.floor(revealedSet.size / 2);
    const idx = revealedSet.size % 2 === 0 ? mid + off : mid - off - 1;
    if (idx >= 0 && idx < len && !revealedSet.has(idx)) return idx;
    for (let i = 0; i < len; i++) { if (!revealedSet.has(i)) return i; }
    return 0;
  }, [text.length, revealDirection]);

  const triggerDecrypt = useCallback(() => {
    setRevealedIndices(new Set());
    setIsAnimating(true);
  }, []);

  useEffect(() => {
    if (!isAnimating) return;
    let iter = 0;
    const interval = setInterval(() => {
      setRevealedIndices(prev => {
        if (sequential) {
          if (prev.size < text.length) {
            const next = new Set(prev);
            next.add(getNextIndex(prev));
            setDisplayText(shuffleText(text, next));
            return next;
          }
          clearInterval(interval); setIsAnimating(false); setIsDecrypted(true);
          return prev;
        }
        setDisplayText(shuffleText(text, prev));
        iter++;
        if (iter >= maxIterations) {
          clearInterval(interval); setIsAnimating(false); setDisplayText(text); setIsDecrypted(true);
        }
        return prev;
      });
    }, speed);
    return () => clearInterval(interval);
  }, [isAnimating, text, speed, maxIterations, sequential, shuffleText, getNextIndex]);

  useEffect(() => {
    if (animateOn !== 'view') return;
    const el = containerRef.current;
    if (!el) return;
    const obs = new IntersectionObserver(([e]) => {
      if (e.isIntersecting && !hasAnimated) { triggerDecrypt(); setHasAnimated(true); }
    }, { threshold: 0.1 });
    obs.observe(el);
    return () => obs.disconnect();
  }, [animateOn, hasAnimated, triggerDecrypt]);

  const hoverProps = animateOn === 'hover' ? {
    onMouseEnter: () => { if (!isAnimating) { setRevealedIndices(new Set()); setIsDecrypted(false); setIsAnimating(true); } },
    onMouseLeave: () => { setIsAnimating(false); setRevealedIndices(new Set()); setDisplayText(text); setIsDecrypted(true); },
  } : {};

  return (
    <motion.span className={parentClassName} ref={containerRef} style={{ display: 'inline-block', whiteSpace: 'pre-wrap' }} {...hoverProps} {...props}>
      <span style={{ position: 'absolute', width: 1, height: 1, overflow: 'hidden', clip: 'rect(0,0,0,0)' }}>{displayText}</span>
      <span aria-hidden="true">
        {displayText.split('').map((char, i) => {
          const revealed = revealedIndices.has(i) || (!isAnimating && isDecrypted);
          return <span key={i} className={revealed ? className : encryptedClassName}>{char}</span>;
        })}
      </span>
    </motion.span>
  );
}
