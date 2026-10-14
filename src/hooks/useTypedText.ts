"use client";

import { useEffect, useRef, useState } from "react";

const MAX_DURATION_MS = 650;

/**
 * Animates `target` in like it's being typed. Only the region that differs
 * from the previous text is retyped (shared prefix/suffix stay put), so a
 * one-value edit types just that value. Long changes speed up to finish
 * within ~650ms. Respects prefers-reduced-motion.
 */
export function useTypedText(target: string): { text: string; typing: boolean } {
  const [text, setText] = useState(target);
  const [typing, setTyping] = useState(false);
  const prevRef = useRef(target);

  useEffect(() => {
    const prev = prevRef.current;
    prevRef.current = target;
    if (prev === target) return;

    const reduced =
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduced) {
      setText(target);
      return;
    }

    // Common prefix and (non-overlapping) suffix between old and new text.
    let p = 0;
    const max = Math.min(prev.length, target.length);
    while (p < max && prev[p] === target[p]) p++;
    let s = 0;
    while (s < max - p && prev[prev.length - 1 - s] === target[target.length - 1 - s]) s++;

    const head = target.slice(0, p);
    const middle = target.slice(p, target.length - s);
    const tail = target.slice(target.length - s);
    if (!middle) {
      setText(target); // pure deletion — just remove it
      return;
    }

    const perFrame = Math.max(1, Math.ceil(middle.length / (MAX_DURATION_MS / 16)));
    let i = 0;
    let raf = 0;
    setTyping(true);
    const step = () => {
      i = Math.min(middle.length, i + perFrame);
      setText(head + middle.slice(0, i) + tail);
      if (i < middle.length) raf = requestAnimationFrame(step);
      else setTyping(false);
    };
    setText(head + tail);
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, [target]);

  return { text, typing };
}
