"use client";

import { useEffect, useRef } from "react";
import { useReducedMotion } from "./useReducedMotion";

const CHARS = "01{}[]();=<>SELECT WHERE AND FROM DEFINE RETURN SUM GROUP BY NOT IN false true".split(
  ""
);

type Drop = {
  x: number;
  y: number;
  speed: number;
  char: string;
  opacity: number;
};

export function CodeRain() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const reducedMotion = useReducedMotion();

  useEffect(() => {
    if (reducedMotion) return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let frameId = 0;
    let drops: Drop[] = [];
    const colWidth = 18;
    let cols = 0;
    let lastPaint = 0;
    const targetFps = 24;
    const frameMs = 1000 / targetFps;
    let running = true;

    const resize = () => {
      const parent = canvas.parentElement;
      if (!parent) return;
      const dpr = Math.min(window.devicePixelRatio, 1.25);
      const w = parent.clientWidth;
      const h = parent.clientHeight;
      canvas.width = w * dpr;
      canvas.height = h * dpr;
      canvas.style.width = `${w}px`;
      canvas.style.height = `${h}px`;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

      cols = Math.ceil(w / colWidth);
      drops = Array.from({ length: cols }, (_, i) => ({
        x: i * colWidth + colWidth / 2,
        y: Math.random() * h,
        speed: 0.35 + Math.random() * 0.9,
        char: CHARS[Math.floor(Math.random() * CHARS.length)] ?? "0",
        opacity: 0.04 + Math.random() * 0.07,
      }));
    };

    const draw = () => {
      const dpr = Math.min(window.devicePixelRatio, 1.25);
      const w = canvas.width / dpr;
      const h = canvas.height / dpr;
      ctx.clearRect(0, 0, w, h);
      ctx.font = '11px var(--font-jetbrains), "JetBrains Mono", monospace';
      ctx.textAlign = "center";

      for (const drop of drops) {
        ctx.fillStyle = `rgba(74, 222, 128, ${drop.opacity})`;
        ctx.fillText(drop.char, drop.x, drop.y);

        drop.y += drop.speed;
        if (drop.y > h + 12) {
          drop.y = -8;
          drop.char = CHARS[Math.floor(Math.random() * CHARS.length)] ?? "0";
          drop.speed = 0.35 + Math.random() * 0.9;
          drop.opacity = 0.04 + Math.random() * 0.07;
        }

        if (Math.random() < 0.008) {
          drop.char = CHARS[Math.floor(Math.random() * CHARS.length)] ?? "0";
        }
      }

      frameId = requestAnimationFrame(animate);
    };

    const animate = (ts: number) => {
      if (!running) return;
      if (ts - lastPaint >= frameMs) {
        draw();
        lastPaint = ts;
      }
      frameId = requestAnimationFrame(animate);
    };

    const onVisibilityChange = () => {
      running = !document.hidden;
      if (running) {
        lastPaint = 0;
        frameId = requestAnimationFrame(animate);
      } else {
        cancelAnimationFrame(frameId);
      }
    };

    resize();
    frameId = requestAnimationFrame(animate);

    const ro = new ResizeObserver(resize);
    ro.observe(canvas.parentElement ?? canvas);
    document.addEventListener("visibilitychange", onVisibilityChange);

    return () => {
      running = false;
      cancelAnimationFrame(frameId);
      ro.disconnect();
      document.removeEventListener("visibilitychange", onVisibilityChange);
    };
  }, [reducedMotion]);

  if (reducedMotion) return null;

  return (
    <canvas
      ref={canvasRef}
      className="code-rain-canvas"
      aria-hidden="true"
    />
  );
}
