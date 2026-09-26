"use client";

import { useEffect, useRef } from "react";
import { useReducedMotion } from "@/components/marketing/animations/useReducedMotion";

// Glyphs the lens "decodes" — the vocabulary of a compiled definition.
const GLYPHS = "01{}[]()<>=!&|;:+-*/_ANDORNOTIFWHERESUMSELECT".split("");
const CELL = 18;
const RADIUS = 130;
const DECAY = 0.955; // per frame — how long the wake lingers

/**
 * A hidden grid of code characters behind the hero. The cursor acts as a
 * decoding lens: glyphs under it light up green and scramble, then settle and
 * fade, leaving a wake of logic. Clicking sends out a decode shockwave.
 */
export function HeroDecodeField() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const reduced = useReducedMotion();

  useEffect(() => {
    if (reduced) return;
    const canvas = canvasRef.current;
    const host = canvas?.parentElement;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !host || !ctx) return;

    let cols = 0;
    let rows = 0;
    let heat = new Float32Array(0);
    let chars = new Uint8Array(0);
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const pointer = { x: -1e4, y: -1e4, active: false };
    const waves: { x: number; y: number; r: number }[] = [];
    let raf = 0;
    let frame = 0;

    function resize() {
      const { width, height } = host!.getBoundingClientRect();
      canvas!.width = width * dpr;
      canvas!.height = height * dpr;
      canvas!.style.width = `${width}px`;
      canvas!.style.height = `${height}px`;
      ctx!.setTransform(dpr, 0, 0, dpr, 0, 0);
      cols = Math.ceil(width / CELL);
      rows = Math.ceil(height / CELL);
      heat = new Float32Array(cols * rows);
      chars = new Uint8Array(cols * rows).map(() => (Math.random() * GLYPHS.length) | 0);
    }

    function energize(cx: number, cy: number, radius: number, amount: number, ring = 0) {
      const c0 = Math.max(0, Math.floor((cx - radius) / CELL));
      const c1 = Math.min(cols - 1, Math.ceil((cx + radius) / CELL));
      const r0 = Math.max(0, Math.floor((cy - radius) / CELL));
      const r1 = Math.min(rows - 1, Math.ceil((cy + radius) / CELL));
      for (let r = r0; r <= r1; r++) {
        for (let c = c0; c <= c1; c++) {
          const d = Math.hypot(c * CELL + CELL / 2 - cx, r * CELL + CELL / 2 - cy);
          // ring > 0: only a thin band at distance `radius` (shockwave front)
          const t = ring ? 1 - Math.abs(d - radius) / ring : 1 - d / radius;
          if (t <= 0) continue;
          const i = r * cols + c;
          heat[i] = Math.min(1, Math.max(heat[i], t * t * amount));
        }
      }
    }

    function tick() {
      frame++;
      if (pointer.active) energize(pointer.x, pointer.y, RADIUS, 1);
      for (let w = waves.length - 1; w >= 0; w--) {
        waves[w].r += 9;
        energize(waves[w].x, waves[w].y, waves[w].r, 0.9, 26);
        if (waves[w].r > 700) waves.splice(w, 1);
      }

      ctx!.clearRect(0, 0, cols * CELL, rows * CELL);
      ctx!.font = `500 12px var(--font-jetbrains), "JetBrains Mono", monospace`;
      ctx!.textAlign = "center";
      ctx!.textBaseline = "middle";
      for (let i = 0; i < heat.length; i++) {
        const h = heat[i];
        if (h < 0.02) continue;
        // Hot glyphs scramble; cooling ones settle on their final character.
        if (h > 0.45 && (frame + i) % 4 === 0) chars[i] = (Math.random() * GLYPHS.length) | 0;
        const x = (i % cols) * CELL + CELL / 2;
        const y = ((i / cols) | 0) * CELL + CELL / 2;
        ctx!.fillStyle =
          h > 0.85
            ? `rgba(220,255,230,${h})`
            : `rgba(74,222,128,${h * 0.75})`;
        ctx!.fillText(GLYPHS[chars[i]], x, y);
        heat[i] = h * DECAY;
      }
      raf = requestAnimationFrame(tick);
    }

    function onMove(e: PointerEvent) {
      const r = host!.getBoundingClientRect();
      pointer.x = e.clientX - r.left;
      pointer.y = e.clientY - r.top;
      pointer.active = true;
    }
    function onLeave() {
      pointer.active = false;
    }
    function onDown(e: PointerEvent) {
      const r = host!.getBoundingClientRect();
      waves.push({ x: e.clientX - r.left, y: e.clientY - r.top, r: 0 });
    }

    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(host);
    host.addEventListener("pointermove", onMove);
    host.addEventListener("pointerleave", onLeave);
    host.addEventListener("pointerdown", onDown);
    raf = requestAnimationFrame(tick);
    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
      host.removeEventListener("pointermove", onMove);
      host.removeEventListener("pointerleave", onLeave);
      host.removeEventListener("pointerdown", onDown);
    };
  }, [reduced]);

  if (reduced) return null;
  return <canvas ref={canvasRef} className="hero-decode-field" aria-hidden />;
}
