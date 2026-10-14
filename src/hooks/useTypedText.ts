"use client";

import { useEffect, useRef, useState } from "react";

export type TypedPhase = "idle" | "compiling" | "typing";

/** First appearance: type the whole thing in at a calm, readable pace. */
const INITIAL_MIN_MS = 1100;
const INITIAL_MAX_MS = 2200;
const INITIAL_MS_PER_CHAR = 6;
/** Edits: show a short "compiling" beat, then type just the changed part. */
const COMPILE_BEAT_MS = 550;
const EDIT_MIN_MS = 450;
const EDIT_MAX_MS = 1100;
const EDIT_MS_PER_CHAR = 22;

const clamp = (v: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, v));
// Ease-out so typing starts brisk and settles gently instead of stopping dead.
const easeOut = (t: number) => 1 - Math.pow(1 - t, 2.2);

/**
 * Animates `target` in like it's being typed. Only the region that differs
 * from the previous text is retyped (shared prefix/suffix stay put). The first
 * appearance types everything in; later changes first show a brief
 * "compiling" phase. Respects prefers-reduced-motion.
 */
export function useTypedText(target: string): { text: string; phase: TypedPhase } {
  const [text, setText] = useState("");
  const [phase, setPhase] = useState<TypedPhase>("idle");
  const prevRef = useRef("");

  useEffect(() => {
    const prev = prevRef.current;
    prevRef.current = target;
    if (prev === target) return;

    const reduced =
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduced || !target) {
      setText(target);
      setPhase("idle");
      return;
    }

    const initial = !prev;

    // Common prefix and (non-overlapping) suffix between old and new text.
    let p = 0;
    const max = Math.min(prev.length, target.length);
    while (p < max && prev[p] === target[p]) p++;
    let s = 0;
    while (s < max - p && prev[prev.length - 1 - s] === target[target.length - 1 - s]) s++;

    const head = target.slice(0, p);
    const middle = target.slice(p, target.length - s);
    const tail = target.slice(target.length - s);

    const duration = initial
      ? clamp(middle.length * INITIAL_MS_PER_CHAR, INITIAL_MIN_MS, INITIAL_MAX_MS)
      : clamp(middle.length * EDIT_MS_PER_CHAR, EDIT_MIN_MS, EDIT_MAX_MS);

    let raf = 0;
    let timer: ReturnType<typeof setTimeout> | undefined;
    let start = 0;

    const step = (now: number) => {
      if (!start) start = now;
      const t = Math.min(1, (now - start) / duration);
      const n = Math.round(easeOut(t) * middle.length);
      setText(head + middle.slice(0, n) + tail);
      if (t < 1) raf = requestAnimationFrame(step);
      else setPhase("idle");
    };

    const beginTyping = () => {
      if (!middle) {
        // Pure deletion: nothing to type, just drop the removed text.
        setText(target);
        setPhase("idle");
        return;
      }
      setPhase("typing");
      setText(head + tail);
      raf = requestAnimationFrame(step);
    };

    if (initial) {
      beginTyping();
    } else {
      // Keep the old code on screen while the "compiler" works.
      setPhase("compiling");
      timer = setTimeout(beginTyping, COMPILE_BEAT_MS);
    }

    return () => {
      cancelAnimationFrame(raf);
      if (timer) clearTimeout(timer);
    };
  }, [target]);

  return { text, phase };
}
