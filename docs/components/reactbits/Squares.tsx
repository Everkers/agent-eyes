// Adapted from react-bits by David Haz (MIT + Commons Clause)
// https://reactbits.dev/backgrounds/squares

import { useRef, useEffect } from 'react';

interface SquaresProps {
  direction?: 'right' | 'left' | 'up' | 'down' | 'diagonal';
  speed?: number;
  borderColor?: string;
  squareSize?: number;
  hoverFillColor?: string;
  className?: string;
}

export default function Squares({
  direction = 'diagonal', speed = 0.3, borderColor = '#333',
  squareSize = 48, hoverFillColor = '#1a1a2e', className = '',
}: SquaresProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d')!;
    let raf: number;
    const offset = { x: 0, y: 0 };
    const hovered = { current: null as { x: number; y: number } | null };

    const resize = () => { canvas.width = canvas.offsetWidth; canvas.height = canvas.offsetHeight; };
    window.addEventListener('resize', resize);
    resize();

    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      const sx = Math.floor(offset.x / squareSize) * squareSize;
      const sy = Math.floor(offset.y / squareSize) * squareSize;
      for (let x = sx; x < canvas.width + squareSize; x += squareSize) {
        for (let y = sy; y < canvas.height + squareSize; y += squareSize) {
          const px = x - (offset.x % squareSize);
          const py = y - (offset.y % squareSize);
          if (hovered.current && Math.floor((x - sx) / squareSize) === hovered.current.x && Math.floor((y - sy) / squareSize) === hovered.current.y) {
            ctx.fillStyle = hoverFillColor; ctx.fillRect(px, py, squareSize, squareSize);
          }
          ctx.strokeStyle = borderColor; ctx.strokeRect(px, py, squareSize, squareSize);
        }
      }
    };

    const tick = () => {
      const s = Math.max(speed, 0.1);
      if (direction === 'right' || direction === 'diagonal') offset.x = (offset.x - s + squareSize) % squareSize;
      if (direction === 'left') offset.x = (offset.x + s + squareSize) % squareSize;
      if (direction === 'down' || direction === 'diagonal') offset.y = (offset.y - s + squareSize) % squareSize;
      if (direction === 'up') offset.y = (offset.y + s + squareSize) % squareSize;
      draw(); raf = requestAnimationFrame(tick);
    };

    const onMove = (e: MouseEvent) => {
      const r = canvas.getBoundingClientRect();
      const mx = e.clientX - r.left, my = e.clientY - r.top;
      const sx2 = Math.floor(offset.x / squareSize) * squareSize;
      const sy2 = Math.floor(offset.y / squareSize) * squareSize;
      hovered.current = { x: Math.floor((mx + offset.x - sx2) / squareSize), y: Math.floor((my + offset.y - sy2) / squareSize) };
    };
    const onLeave = () => { hovered.current = null; };

    canvas.addEventListener('mousemove', onMove);
    canvas.addEventListener('mouseleave', onLeave);
    raf = requestAnimationFrame(tick);

    return () => {
      window.removeEventListener('resize', resize);
      cancelAnimationFrame(raf);
      canvas.removeEventListener('mousemove', onMove);
      canvas.removeEventListener('mouseleave', onLeave);
    };
  }, [direction, speed, borderColor, hoverFillColor, squareSize]);

  return <canvas ref={canvasRef} className={className} style={{ width: '100%', height: '100%', display: 'block' }} />;
}
