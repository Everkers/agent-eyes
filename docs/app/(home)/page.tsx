'use client';

import Link from 'next/link';
import Image from 'next/image';
import {
  Eye, Terminal, Globe, Bug, Gauge, Layers, Camera,
  Activity, Radio, Shield, Scan, ArrowRight,
  MonitorSmartphone, Server, Bot, Zap, Copy, Check,
} from 'lucide-react';
import { useState, useCallback } from 'react';
import BlurText from '@/components/reactbits/BlurText';
import DecryptedText from '@/components/reactbits/DecryptedText';
import ShinyText from '@/components/reactbits/ShinyText';
import Squares from '@/components/reactbits/Squares';
import logo from '@/assets/logo/logo.png';

const tools = [
  { icon: Terminal, name: 'get_console_logs', desc: 'Read log, warn, error, debug, and info entries' },
  { icon: Globe, name: 'get_network_requests', desc: 'Inspect fetch and XHR requests with full headers and bodies' },
  { icon: Bug, name: 'get_errors', desc: 'Surface runtime errors and unhandled promise rejections' },
  { icon: Layers, name: 'get_dom_snapshot', desc: 'Get a simplified DOM tree with key attributes' },
  { icon: Gauge, name: 'get_performance_metrics', desc: 'Measure Core Web Vitals, load timing, and memory usage' },
  { icon: Activity, name: 'get_react_components', desc: 'Track component renders, props, and render counts' },
  { icon: Camera, name: 'take_screenshot', desc: 'Capture a visual screenshot as a base64 PNG' },
  { icon: Eye, name: 'get_snapshot', desc: 'Pull the full app state in a single call' },
];

function ToolCard({ icon: Icon, name, desc }: {
  icon: React.ElementType; name: string; desc: string;
}) {
  return (
    <div
      className="ae-card group"
      onMouseMove={(e) => {
        const r = e.currentTarget.getBoundingClientRect();
        e.currentTarget.style.setProperty('--mx', `${e.clientX - r.left}px`);
        e.currentTarget.style.setProperty('--my', `${e.clientY - r.top}px`);
      }}
    >
      <div className="relative z-10">
        <Icon className="ae-card-icon" />
        <p className="ae-card-name">{name}</p>
        <p className="ae-card-desc">{desc}</p>
      </div>
    </div>
  );
}

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  const copy = useCallback(() => {
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }, [text]);
  return (
    <button
      onClick={copy}
      className="ae-copy-btn"
      aria-label={copied ? 'Copied' : 'Copy to clipboard'}
    >
      {copied
        ? <Check style={{ width: 14, height: 14, color: 'var(--c-teal)' }} />
        : <Copy style={{ width: 14, height: 14 }} />
      }
    </button>
  );
}


const styles = `
/* ═══ Palette ═══ */
:root {
  --c-amber: oklch(0.80 0.11 85);
  --c-amber-dim: oklch(0.64 0.09 85);
  --c-amber-glow: oklch(0.80 0.11 85 / 0.30);
  --c-amber-sub: oklch(0.80 0.11 85 / 0.07);
  --c-teal: oklch(0.76 0.09 155);
  --c-rose: oklch(0.72 0.09 290);
  --c-bg: oklch(0.14 0.008 280);
  --c-surface: oklch(0.18 0.008 280);
  --c-border: oklch(0.24 0.01 280);
  --c-fg: oklch(0.92 0.006 280);
  --c-dim: oklch(0.60 0.014 280);
  --c-muted: oklch(0.44 0.01 280);
  --ease-quart: cubic-bezier(0.25, 1, 0.5, 1);
  --ease-expo: cubic-bezier(0.16, 1, 0.3, 1);
}

/* ═══ Base ═══ */
.ae-page {
  background: var(--c-bg);
  color: var(--c-fg);
  position: relative;
  flex: 1;
}

/* Grain */
.ae-page::before {
  content: ''; position: fixed; inset: 0; z-index: 100; pointer-events: none; opacity: 0.028;
  background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 512 512' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='g'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23g)'/%3E%3C/svg%3E");
  background-size: 512px 512px;
}


/* ═══ Reveals ═══ */
.ae-up {
  opacity: 0; transform: translateY(28px);
  animation: up 0.8s var(--ease-expo) forwards;
}
@keyframes up { to { opacity: 1; transform: translateY(0); } }
.d1{animation-delay:.08s} .d2{animation-delay:.2s} .d3{animation-delay:.36s}
.d4{animation-delay:.5s} .d5{animation-delay:.66s} .d6{animation-delay:.82s}
.d7{animation-delay:.96s}

/* ═══ Hero ═══ */
.ae-hero-bg {
  position: absolute; inset: 0; z-index: 0; overflow: hidden;
}
.ae-hero-bg canvas {
  opacity: 0.35;
  mask-image: radial-gradient(ellipse 70% 80% at 50% 30%, black 20%, transparent 70%);
  -webkit-mask-image: radial-gradient(ellipse 70% 80% at 50% 30%, black 20%, transparent 70%);
}

.ae-glow {
  position: absolute; width: 700px; height: 700px; border-radius: 50%; pointer-events: none;
  background: radial-gradient(circle, oklch(0.80 0.11 85 / 0.18), oklch(0.80 0.11 85 / 0.05) 40%, transparent 70%);
  top: -280px; left: 50%; transform: translateX(-50%);
  animation: glow 5s ease-in-out infinite;
}
@keyframes glow {
  0%,100% { opacity: 1; transform: translateX(-50%) scale(1); }
  50% { opacity: 0.7; transform: translateX(-50%) scale(1.15); }
}

/* ═══ Eye icon pulse ═══ */
.ae-eye { animation: eyePulse 2.8s ease-in-out infinite; }
@keyframes eyePulse {
  0%,100% { filter: drop-shadow(0 0 6px var(--c-amber-glow)); }
  50% { filter: drop-shadow(0 0 28px var(--c-amber)) drop-shadow(0 0 56px var(--c-amber-glow)); }
}

/* ═══ Tool cards ═══ */
.ae-card {
  position: relative; background: var(--c-surface); border: 1px solid var(--c-border);
  border-radius: 14px; padding: 22px; overflow: hidden;
  transition: border-color 0.3s var(--ease-quart), transform 0.3s var(--ease-quart), box-shadow 0.3s var(--ease-quart);
}
.ae-card::before {
  content: ''; position: absolute; inset: 0;
  background: radial-gradient(320px circle at var(--mx, 50%) var(--my, 50%), var(--c-amber-sub), transparent);
  opacity: 0; transition: opacity 0.3s;
}
.ae-card:hover {
  border-color: oklch(0.80 0.11 85 / 0.25);
  transform: translateY(-3px);
  box-shadow: 0 12px 40px oklch(0.80 0.11 85 / 0.06);
}
.ae-card:hover::before { opacity: 1; }
.ae-card:hover .ae-card-icon { color: var(--c-amber) !important; }
.ae-card-icon { width: 20px; height: 20px; margin-bottom: 14px; color: var(--c-amber-dim); transition: color 0.2s; }
.ae-card-name {
  font-family: var(--font-mono), monospace; font-size: 11.5px; letter-spacing: 0.03em;
  color: var(--c-amber-dim); margin-bottom: 7px;
}
.ae-card-desc { font-size: 13px; color: var(--c-muted); line-height: 1.55; }

/* ═══ Code blocks ═══ */
.ae-pre-wrap {
  position: relative;
}
.ae-pre {
  background: oklch(0.10 0.006 280); border: 1px solid var(--c-border); border-radius: 12px;
  padding: 18px 22px; font-family: var(--font-mono), monospace; font-size: 13px;
  line-height: 1.75; color: var(--c-dim); overflow-x: auto; white-space: pre;
}
.ae-copy-btn {
  position: absolute; top: 10px; right: 10px; padding: 6px;
  background: oklch(0.17 0.008 280 / 0.8); border: 1px solid var(--c-border);
  border-radius: 6px; color: var(--c-muted); cursor: pointer;
  opacity: 0; transition: opacity 0.2s, color 0.2s, background 0.2s;
  backdrop-filter: blur(4px);
}
.ae-pre-wrap:hover .ae-copy-btn { opacity: 1; }
.ae-copy-btn:hover { color: var(--c-fg); background: var(--c-surface); }
.kw { color: var(--c-amber-dim); } .str { color: var(--c-teal); }
.fn { color: var(--c-fg); } .cm { color: var(--c-muted); }

/* ═══ Headings ═══ */
.ae-h2 {
  font-size: clamp(1.6rem, 4.5vw, 2.2rem); font-weight: 650;
  color: var(--c-fg); letter-spacing: -0.025em; line-height: 1.2;
}
.ae-accent {
  color: var(--c-amber); font-style: italic;
  font-family: var(--font-display), Georgia, serif;
}

/* ═══ Buttons ═══ */
.ae-btn {
  display: inline-flex; align-items: center; gap: 8px;
  padding: 13px 30px; font-weight: 600; font-size: 14px;
  border-radius: 12px; text-decoration: none; letter-spacing: 0.01em;
  transition: all 0.25s var(--ease-quart);
}
.ae-btn:active { transform: translateY(1px); }
.ae-btn-fill {
  background: var(--c-amber); color: oklch(0.14 0.008 85);
}
.ae-btn-fill:hover {
  background: oklch(0.84 0.12 85); transform: translateY(-2px);
  box-shadow: 0 10px 40px var(--c-amber-glow);
}
.ae-btn-ghost {
  background: transparent; color: var(--c-fg);
  border: 1px solid var(--c-border);
}
.ae-btn-ghost:hover {
  border-color: var(--c-amber-dim); color: var(--c-amber);
  background: var(--c-amber-sub);
}

/* ═══ Shield section ═══ */
.ae-shield {
  background: linear-gradient(145deg, oklch(0.18 0.02 155 / 0.30), var(--c-surface));
  border: 1px solid oklch(0.32 0.04 155 / 0.30); border-radius: 18px; padding: 44px;
}

/* ═══ Grid bg ═══ */
.ae-grid {
  background-image:
    linear-gradient(oklch(0.24 0.01 280 / 0.5) 1px, transparent 1px),
    linear-gradient(90deg, oklch(0.24 0.01 280 / 0.5) 1px, transparent 1px);
  background-size: 56px 56px;
  mask-image: radial-gradient(ellipse 65% 55% at 50% 50%, black, transparent);
}

/* ═══ CTA glow ═══ */
.ae-cta-glow {
  position: absolute; width: 500px; height: 250px; border-radius: 50%; pointer-events: none;
  background: radial-gradient(circle, var(--c-amber-glow), transparent 70%);
  bottom: -80px; left: 50%; transform: translateX(-50%); opacity: 0.2;
}

/* ═══ Cursor blink ═══ */
.ae-blink {
  display: inline-block; width: 2px; height: 1.1em; background: var(--c-amber);
  margin-left: 3px; vertical-align: text-bottom;
  animation: blink 1s step-end infinite;
}
@keyframes blink { 50% { opacity: 0; } }

/* ═══ Decrypted text styling ═══ */
.ae-decrypt-char { color: var(--c-amber); }
.ae-decrypt-scramble {
  color: var(--c-amber-dim); opacity: 0.6;
  font-family: var(--font-mono), monospace;
}

/* ═══ Hero headline ═══ */
.ae-hero-headline {
  font-family: var(--font-display), Georgia, serif;
  font-size: clamp(3.4rem, 10vw, 7rem);
  line-height: 0.95; font-weight: 400; letter-spacing: -0.03em;
  color: var(--c-fg);
}
.ae-hero-headline p {
  display: flex; flex-wrap: wrap; justify-content: center;
}

/* ═══ Architecture — redesigned ═══ */
.ae-arch {
  position: relative;
  background: var(--c-surface);
  border: 1px solid var(--c-border);
  border-radius: 20px;
  padding: 48px 40px;
  overflow: hidden;
}
.ae-arch::before {
  content: ''; position: absolute; inset: 0; pointer-events: none;
  background: radial-gradient(ellipse 60% 40% at 50% 0%, oklch(0.80 0.11 85 / 0.03), transparent);
}

/* Pipeline row */
.ae-pipeline {
  display: grid;
  grid-template-columns: 1fr auto 1fr auto 1fr;
  align-items: center;
  gap: 0;
}

/* Pipeline node */
.ae-pipe-node {
  display: flex; flex-direction: column; align-items: center; gap: 14px;
  position: relative; z-index: 2;
}
.ae-pipe-icon-ring {
  width: 72px; height: 72px; border-radius: 18px;
  display: flex; align-items: center; justify-content: center;
  position: relative;
  transition: transform 0.3s var(--ease-quart), box-shadow 0.3s var(--ease-quart);
}
.ae-pipe-icon-ring:hover { transform: translateY(-3px); }
.ae-pipe-icon-ring.amber {
  background: oklch(0.80 0.11 85 / 0.1); border: 1px solid oklch(0.80 0.11 85 / 0.25);
}
.ae-pipe-icon-ring.amber:hover { box-shadow: 0 8px 32px oklch(0.80 0.11 85 / 0.15); }
.ae-pipe-icon-ring.teal {
  background: oklch(0.76 0.09 155 / 0.1); border: 1px solid oklch(0.76 0.09 155 / 0.25);
}
.ae-pipe-icon-ring.teal:hover { box-shadow: 0 8px 32px oklch(0.76 0.09 155 / 0.12); }
.ae-pipe-icon-ring.rose {
  background: oklch(0.72 0.09 290 / 0.1); border: 1px solid oklch(0.72 0.09 290 / 0.25);
}
.ae-pipe-icon-ring.rose:hover { box-shadow: 0 8px 32px oklch(0.72 0.09 290 / 0.12); }

.ae-pipe-title {
  font-weight: 650; font-size: 15px; color: var(--c-fg);
  letter-spacing: -0.01em;
}
.ae-pipe-sub {
  font-family: var(--font-mono), monospace; font-size: 11px;
  letter-spacing: 0.06em; text-transform: uppercase; color: var(--c-muted);
  margin-top: -8px;
}

/* Animated connector */
.ae-connector {
  display: flex; align-items: center; justify-content: center;
  position: relative; height: 2px; min-width: 60px;
  padding: 0 8px;
}
.ae-connector-line {
  width: 100%; height: 1px; position: relative; overflow: hidden;
  background: var(--c-border);
}
.ae-connector-line::after {
  content: ''; position: absolute; top: 0; left: -40%;
  width: 40%; height: 100%;
  background: linear-gradient(90deg, transparent, var(--c-amber), transparent);
  animation: connectorFlow 2.2s var(--ease-quart) infinite;
}
@keyframes connectorFlow {
  0% { left: -40%; }
  100% { left: 100%; }
}
.ae-connector-arrow {
  position: absolute; right: 0; color: var(--c-muted);
}

/* Protocol label */
.ae-proto {
  font-family: var(--font-mono), monospace; font-size: 10px;
  letter-spacing: 0.06em; text-transform: uppercase;
  color: var(--c-muted); text-align: center; margin-top: 6px;
}

/* ═══ Before/After demo ═══ */
.ae-demo {
  display: grid; grid-template-columns: 1fr 1fr; gap: 24px;
}
.ae-demo-panel {
  background: var(--c-surface); border: 1px solid var(--c-border);
  border-radius: 18px; padding: 32px; display: flex; flex-direction: column;
}
.ae-demo-label {
  display: inline-flex; align-items: center; gap: 8px;
  font-size: 13px; font-weight: 600; letter-spacing: 0.02em; margin-bottom: 20px;
}
.ae-demo-dot {
  width: 8px; height: 8px; border-radius: 50%; flex-shrink: 0;
}
.ae-demo-exchange {
  display: flex; flex-direction: column; gap: 14px; flex: 1;
}
.ae-demo-msg {
  padding: 12px 16px; border-radius: 12px; font-size: 13.5px; line-height: 1.6;
  max-width: 92%;
}
.ae-demo-msg.user {
  background: oklch(0.22 0.01 280); color: var(--c-dim);
  align-self: flex-end; border-bottom-right-radius: 4px;
}
.ae-demo-msg.agent {
  align-self: flex-start; border-bottom-left-radius: 4px;
}
.ae-demo-msg.agent.blind {
  background: oklch(0.70 0.12 25 / 0.07);
  border: 1px solid oklch(0.70 0.12 25 / 0.12);
  color: var(--c-dim);
}
.ae-demo-msg.agent.seeing {
  background: oklch(0.76 0.09 155 / 0.07);
  border: 1px solid oklch(0.76 0.09 155 / 0.12);
  color: var(--c-dim);
}
.ae-demo-tool {
  font-family: var(--font-mono), monospace; font-size: 11.5px;
  color: var(--c-amber-dim); padding: 6px 12px;
  background: oklch(0.80 0.11 85 / 0.05); border-radius: 8px;
  align-self: flex-start; display: inline-flex; align-items: center; gap: 6px;
}
.ae-demo-outcome {
  margin-top: auto; padding-top: 20px;
  font-size: 13px; font-weight: 600; letter-spacing: 0.01em;
}
.ae-demo-outcome.fail { color: oklch(0.70 0.12 25); }
.ae-demo-outcome.pass { color: var(--c-teal); }
.ae-demo-attempts {
  font-family: var(--font-mono), monospace; font-size: 11px;
  color: var(--c-muted); margin-top: 4px; font-weight: 400;
}
@media (max-width: 768px) {
  .ae-demo { grid-template-columns: 1fr; }
}

/* ═══ Setup — redesigned ═══ */
.ae-setup-card {
  background: var(--c-surface); border: 1px solid var(--c-border);
  border-radius: 16px; overflow: hidden;
  transition: border-color 0.3s var(--ease-quart);
}
.ae-setup-card:hover { border-color: oklch(0.30 0.015 280); }
.ae-setup-header {
  display: flex; align-items: center; gap: 14px;
  padding: 20px 24px; border-bottom: 1px solid var(--c-border);
}
.ae-setup-num {
  width: 32px; height: 32px; border-radius: 10px;
  display: flex; align-items: center; justify-content: center;
  font-family: var(--font-mono), monospace; font-size: 13px; font-weight: 700;
  flex-shrink: 0;
}
.ae-setup-header-text {
  display: flex; flex-direction: column; gap: 2px;
}
.ae-setup-title {
  font-weight: 600; font-size: 14.5px; color: var(--c-fg);
}
.ae-setup-file {
  font-family: var(--font-mono), monospace; font-size: 11px;
  color: var(--c-muted); letter-spacing: 0.02em;
}
.ae-setup-body { padding: 0; }
.ae-setup-body .ae-pre {
  border: none; border-radius: 0; margin: 0;
  background: oklch(0.10 0.006 280);
}
.ae-setup-footer {
  padding: 14px 24px; border-top: 1px solid var(--c-border);
  font-size: 12.5px; color: var(--c-muted); line-height: 1.6;
}

/* Setup connector */
.ae-setup-connector {
  display: flex; flex-direction: column; align-items: center;
  gap: 0; padding: 8px 0;
}
.ae-setup-connector-line {
  width: 1px; height: 28px; position: relative; overflow: hidden;
  background: var(--c-border);
}
.ae-setup-connector-line::after {
  content: ''; position: absolute; left: 0; top: -60%;
  width: 100%; height: 60%;
  background: linear-gradient(180deg, transparent, var(--c-teal), transparent);
  animation: connectorFlowV 1.8s var(--ease-quart) infinite;
}
@keyframes connectorFlowV {
  0% { top: -60%; }
  100% { top: 100%; }
}
.ae-setup-then {
  font-family: var(--font-mono), monospace; font-size: 10px;
  letter-spacing: 0.08em; text-transform: uppercase;
  color: var(--c-muted); padding: 4px 10px;
  border: 1px solid var(--c-border); border-radius: 6px;
  background: var(--c-surface);
}

/* ═══ Footer ═══ */
.ae-footer {
  border-top: 1px solid var(--c-border);
  padding: 32px 24px;
  display: flex; align-items: center; justify-content: space-between;
  font-size: 13px; color: var(--c-muted);
  width: 100%;
}
.ae-footer a {
  color: var(--c-dim); text-decoration: none;
  transition: color 0.2s;
}
.ae-footer a:hover { color: var(--c-amber); }
.ae-footer-links {
  display: flex; gap: 20px;
}

/* ═══ Reduced motion ═══ */
@media (prefers-reduced-motion: reduce) {
  .ae-up { opacity: 1; transform: none; animation: none; }
  .ae-glow, .ae-glow-teal { animation: none; opacity: 0.5; }
  .ae-eye { animation: none; filter: drop-shadow(0 0 6px var(--c-amber-glow)); }
  .ae-blink { animation: none; }
  .ae-connector-line::after { animation: none; opacity: 0; }
  .ae-setup-connector-line::after { animation: none; opacity: 0; }
  .ae-card, .ae-pipe-icon-ring, .ae-btn, .ae-btn-fill, .ae-btn-ghost,
  .ae-setup-card { transition: none; }
}

@media (max-width: 640px) {
  .ae-pipeline { grid-template-columns: 1fr; gap: 16px; }
  .ae-connector { min-width: unset; height: 32px; width: 2px; margin: 0 auto; }
  .ae-connector-line { width: 1px; height: 100%; }
  .ae-connector-line::after {
    width: 100%; height: 40%; left: 0; top: -40%;
    background: linear-gradient(180deg, transparent, var(--c-amber), transparent);
    animation: connectorFlowV 2.2s var(--ease-quart) infinite;
  }
  .ae-connector-arrow { right: unset; bottom: 0; transform: rotate(90deg); }
  .ae-arch { padding: 32px 20px; }
}
`;

export default function HomePage() {
  return (
    <>
      <style>{styles}</style>
      <main className="ae-page flex flex-col items-center">

        {/* ═══ HERO ═══ */}
        <section className="relative flex flex-col items-center text-center w-full px-6 pt-32 pb-28" style={{ maxWidth: 1060 }}>
          <div className="ae-hero-bg" aria-hidden="true">
            <Squares
              direction="diagonal"
              speed={0.2}
              borderColor="oklch(0.80 0.11 85 / 0.08)"
              squareSize={60}
              hoverFillColor="oklch(0.80 0.11 85 / 0.06)"
            />
          </div>

          <div className="ae-glow" aria-hidden="true" />

          {/* Badge */}
          <div className="ae-up d1 relative z-10 inline-flex items-center gap-2.5 px-5 py-2 rounded-full" style={{ border: '1px solid var(--c-border)', background: 'var(--c-surface)', fontSize: 13, letterSpacing: '0.04em', color: 'var(--c-dim)' }}>
            <Radio style={{ width: 13, height: 13, color: 'var(--c-amber)' }} />
            <ShinyText
              text="MCP-native — works with any agent"
              color="oklch(0.60 0.014 280)"
              shineColor="oklch(0.80 0.11 85)"
              speed={4}
              spread={140}
            />
          </div>

          {/* Headline */}
          <div className="relative z-10 mt-12 mb-2">
            <BlurText
              text="Give your AI agent"
              className="ae-hero-headline"
              delay={80}
              animateBy="words"
              direction="bottom"
              stepDuration={0.4}
            />
          </div>

          {/* "eyes" — hero moment */}
          <div className="relative z-10 flex items-center justify-center gap-4" style={{ fontFamily: 'var(--font-display), Georgia, serif', fontSize: 'clamp(3.4rem, 10vw, 7rem)', lineHeight: 0.95, fontWeight: 400, letterSpacing: '-0.03em' }}>
            <Eye className="ae-eye" style={{ width: 'clamp(2.2rem, 5vw, 3.8rem)', height: 'clamp(2.2rem, 5vw, 3.8rem)', color: 'var(--c-amber)' }} aria-hidden="true" />
            <DecryptedText
              text="eyes"
              speed={60}
              maxIterations={14}
              sequential
              revealDirection="center"
              animateOn="view"
              className="ae-decrypt-char"
              encryptedClassName="ae-decrypt-scramble"
              parentClassName=""
              characters="◉◎●○⊙⊚⦿⊛"
            />
          </div>

          {/* Subhead */}
          <p className="ae-up d3 relative z-10 mt-10" style={{ maxWidth: 540, fontSize: '1.15rem', lineHeight: 1.65, color: 'var(--c-dim)' }}>
            Stream everything your app sees — console, network, DOM, errors,
            performance, screenshots — directly to your coding agent over MCP.
          </p>

          {/* CTAs */}
          <div className="ae-up d4 relative z-10 flex flex-wrap gap-4 mt-12 justify-center">
            <Link href="/docs" className="ae-btn ae-btn-fill">Get Started</Link>
            <Link href="/docs/mcp-tools" className="ae-btn ae-btn-ghost">View MCP Tools</Link>
          </div>

          {/* Install hint */}
          <div className="ae-up d5 relative z-10 mt-14" style={{ fontFamily: 'var(--font-mono), monospace', fontSize: 13, color: 'var(--c-muted)', letterSpacing: '0.04em' }}>
            npm install agent-eyes --save-dev<span className="ae-blink" aria-hidden="true" />
          </div>
        </section>

        {/* ═══ ARCHITECTURE ═══ */}
        <section className="w-full px-6 pb-28" style={{ maxWidth: 860 }}>
          <h2 className="ae-h2 text-center mb-12">
            How it <span className="ae-accent">works</span>
          </h2>

          <div className="ae-arch">
            {/* Pipeline */}
            <div className="ae-pipeline">
              {/* Browser */}
              <div className="ae-pipe-node">
                <div className="ae-pipe-icon-ring amber">
                  <MonitorSmartphone style={{ width: 28, height: 28, color: 'var(--c-amber)' }} />
                </div>
                <span className="ae-pipe-title">Your App</span>
                <span className="ae-pipe-sub">Collects runtime data</span>
              </div>

              {/* Connector 1 */}
              <div className="ae-connector">
                <div className="ae-connector-line" />
                <ArrowRight className="ae-connector-arrow" style={{ width: 14, height: 14 }} />
              </div>

              {/* MCP Server */}
              <div className="ae-pipe-node">
                <div className="ae-pipe-icon-ring teal">
                  <Server style={{ width: 28, height: 28, color: 'var(--c-teal)' }} />
                </div>
                <span className="ae-pipe-title">MCP Server</span>
                <span className="ae-pipe-sub">Bridges via WebSocket</span>
              </div>

              {/* Connector 2 */}
              <div className="ae-connector">
                <div className="ae-connector-line" />
                <ArrowRight className="ae-connector-arrow" style={{ width: 14, height: 14 }} />
              </div>

              {/* AI Agent */}
              <div className="ae-pipe-node">
                <div className="ae-pipe-icon-ring rose">
                  <Bot style={{ width: 28, height: 28, color: 'var(--c-rose)' }} />
                </div>
                <span className="ae-pipe-title">AI Agent</span>
                <span className="ae-pipe-sub">Reads via MCP tools</span>
              </div>
            </div>

            {/* Protocol labels */}
            <div className="ae-pipeline" style={{ marginTop: 8 }}>
              <div />
              <p className="ae-proto">WebSocket</p>
              <div />
              <p className="ae-proto">stdio</p>
              <div />
            </div>
          </div>
        </section>

        {/* ═══ BEFORE / AFTER ═══ */}
        <section className="w-full px-6 pb-28" style={{ maxWidth: 920 }}>
          <h2 className="ae-h2 text-center mb-4">
            Without eyes, agents <span className="ae-accent">guess</span>
          </h2>
          <p className="text-center" style={{ color: 'var(--c-muted)', fontSize: 15, maxWidth: 520, margin: '0 auto 48px' }}>
            Same bug. Same agent. One can see your app, the other can&apos;t.
          </p>

          <div className="ae-demo">
            {/* Without */}
            <div className="ae-demo-panel">
              <div className="ae-demo-label">
                <span className="ae-demo-dot" style={{ background: 'oklch(0.70 0.12 25)' }} />
                <span style={{ color: 'var(--c-dim)' }}>Without AgentEyes</span>
              </div>
              <div className="ae-demo-exchange">
                <div className="ae-demo-msg user">The checkout button isn&apos;t working</div>
                <div className="ae-demo-msg agent blind">Added an onClick handler to the button</div>
                <div className="ae-demo-msg user">It already has one. Nothing happens when I click</div>
                <div className="ae-demo-msg agent blind">Checked the form validation — looks correct to me</div>
                <div className="ae-demo-msg user">It&apos;s not a validation issue, the button literally does nothing</div>
                <div className="ae-demo-msg agent blind">Maybe try clearing the cache? I don&apos;t see anything wrong in the code</div>
                <div className="ae-demo-msg user">Bro... 😐</div>
                <div className="ae-demo-outcome fail">
                  ✗ Going in circles
                  <div className="ae-demo-attempts">Can&apos;t see what&apos;s actually happening in the browser</div>
                </div>
              </div>
            </div>

            {/* With */}
            <div className="ae-demo-panel" style={{ borderColor: 'oklch(0.76 0.09 155 / 0.25)' }}>
              <div className="ae-demo-label">
                <span className="ae-demo-dot" style={{ background: 'var(--c-teal)' }} />
                <span style={{ color: 'var(--c-fg)' }}>With AgentEyes</span>
              </div>
              <div className="ae-demo-exchange">
                <div className="ae-demo-msg user">The checkout button isn&apos;t working</div>
                <div className="ae-demo-tool">
                  <Eye style={{ width: 12, height: 12 }} />
                  get_errors() + get_network_requests()
                </div>
                <div className="ae-demo-msg agent seeing">
                  Found it — the Stripe API call returns a 401. Your <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.9em' }}>NEXT_PUBLIC_STRIPE_KEY</span> is set to the test key but you&apos;re hitting the live endpoint.
                </div>
                <div className="ae-demo-msg agent seeing">
                  Swapped the endpoint to match the key. Try again.
                </div>
                <div className="ae-demo-outcome pass">
                  ✓ Fixed in one shot
                  <div className="ae-demo-attempts">Saw the 401, read the headers, found the mismatch</div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ═══ SETUP ═══ */}
        <section className="w-full px-6 pb-32" style={{ maxWidth: 620 }}>
          <h2 className="ae-h2 text-center mb-10">
            Get started in <span className="ae-accent">two steps</span>
          </h2>

          {/* Step 1 */}
          <div className="ae-setup-card">
            <div className="ae-setup-header">
              <span className="ae-setup-num" style={{ background: 'oklch(0.80 0.11 85 / 0.1)', color: 'var(--c-amber)', border: '1px solid oklch(0.80 0.11 85 / 0.2)' }}>1</span>
              <div className="ae-setup-header-text">
                <span className="ae-setup-title">Add to your app entry point</span>
                <span className="ae-setup-file">src/main.ts or layout.tsx</span>
              </div>
            </div>
            <div className="ae-setup-body ae-pre-wrap">
              <CopyButton text={`import { AgentEyes } from 'agent-eyes'\n\nconst eyes = new AgentEyes()\neyes.start()`} />
              <div className="ae-pre"><span className="kw">import</span>{' { AgentEyes } '}<span className="kw">from</span> <span className="str">&apos;agent-eyes&apos;</span>{'\n\n'}<span className="kw">const</span> <span className="fn">eyes</span> = <span className="kw">new</span> <span className="fn">AgentEyes</span>(){'\n'}<span className="fn">eyes</span>.<span className="fn">start</span>()</div>
            </div>
            <div className="ae-setup-footer">
              <Zap style={{ width: 12, height: 12, display: 'inline', verticalAlign: '-1px', marginRight: 4, color: 'var(--c-amber-dim)' }} />
              Automatically disabled in production — zero overhead, zero risk. Safe to commit.
            </div>
          </div>

          {/* Connector */}
          <div className="ae-setup-connector" aria-hidden="true">
            <div className="ae-setup-connector-line" />
            <span className="ae-setup-then">then</span>
            <div className="ae-setup-connector-line" />
          </div>

          {/* Step 2 */}
          <div className="ae-setup-card">
            <div className="ae-setup-header">
              <span className="ae-setup-num" style={{ background: 'oklch(0.76 0.09 155 / 0.1)', color: 'var(--c-teal)', border: '1px solid oklch(0.76 0.09 155 / 0.2)' }}>2</span>
              <div className="ae-setup-header-text">
                <span className="ae-setup-title">Configure your editor&apos;s MCP server</span>
                <span className="ae-setup-file">.cursor/mcp.json, .vscode/mcp.json, etc.</span>
              </div>
            </div>
            <div className="ae-setup-body ae-pre-wrap">
              <CopyButton text={`{\n  "mcpServers": {\n    "agent-eyes": {\n      "command": "npx",\n      "args": ["agent-eyes"]\n    }\n  }\n}`} />
              <div className="ae-pre"><span className="cm">{'// Add to your editor\'s MCP config'}</span>{'\n'}{'{\n  '}<span className="str">&quot;mcpServers&quot;</span>{': {\n    '}<span className="str">&quot;agent-eyes&quot;</span>{': {\n      '}<span className="str">&quot;command&quot;</span>{': '}<span className="str">&quot;npx&quot;</span>{',\n      '}<span className="str">&quot;args&quot;</span>{': ['}<span className="str">&quot;agent-eyes&quot;</span>{']'}{'\n    }\n  }\n}'}</div>
            </div>
            <div className="ae-setup-footer">
              Works with Cursor, VS Code, Windsurf, Kiro, and any MCP-compatible agent.
            </div>
          </div>
        </section>

        {/* ═══ MCP TOOLS ═══ */}
        <section className="w-full px-6 pb-32 relative" style={{ maxWidth: 1040 }}>
          <div className="ae-grid absolute inset-0 pointer-events-none" aria-hidden="true" />
          <div className="relative z-10">
            <h2 className="ae-h2 text-center mb-12">
              11 MCP tools, <span className="ae-accent">zero config</span>
            </h2>
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
              {tools.map((t) => <ToolCard key={t.name} {...t} />)}
            </div>
          </div>
        </section>

        {/* ═══ SAFETY ═══ */}
        <section className="w-full px-6 pb-32" style={{ maxWidth: 760 }}>
          <div className="ae-shield flex flex-col sm:flex-row items-start gap-7">
            <div className="shrink-0 flex items-center justify-center w-14 h-14 rounded-2xl" style={{ background: 'oklch(0.76 0.09 155 / 0.12)' }}>
              <Shield style={{ width: 26, height: 26, color: 'var(--c-teal)' }} />
            </div>
            <div>
              <h3 style={{ fontSize: 19, fontWeight: 650, color: 'var(--c-fg)', marginBottom: 10 }}>Production safe by default</h3>
              <p style={{ color: 'var(--c-dim)', fontSize: 14.5, lineHeight: 1.75 }}>
                AgentEyes detects production environments and shuts itself off
                completely — zero overhead, zero network calls, zero DOM access.
                Auth headers, cookies, and other sensitive data are automatically
                redacted in every environment.
              </p>
            </div>
          </div>
        </section>

        {/* ═══ CTA ═══ */}
        <section className="w-full px-6 pb-16 text-center relative" style={{ maxWidth: 760 }}>
          <div className="ae-cta-glow" aria-hidden="true" />
          <div className="relative z-10">
            <Scan style={{ width: 36, height: 36, color: 'var(--c-amber)', margin: '0 auto 20px' }} />
            <h2 className="ae-h2 mb-8">
              Ready to give your agent <span className="ae-accent">sight</span>?
            </h2>
            <Link href="/docs" className="ae-btn ae-btn-fill">
              Read the docs <span aria-hidden="true">→</span>
            </Link>
          </div>
        </section>

        {/* ═══ FOOTER ═══ */}
        <footer className="ae-footer" style={{ maxWidth: 1040, margin: '0 auto' }}>
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
            <Image src={logo} alt="AgentEyes" width={22} height={22} style={{ borderRadius: 4 }} />
            AgentEyes
          </span>
          <div className="ae-footer-links">
            <Link href="/docs">Docs</Link>
            <a href="https://github.com/user/agent-eyes" target="_blank" rel="noopener noreferrer">GitHub</a>
            <a href="https://www.npmjs.com/package/agent-eyes" target="_blank" rel="noopener noreferrer">npm</a>
          </div>
        </footer>

      </main>
    </>
  );
}
