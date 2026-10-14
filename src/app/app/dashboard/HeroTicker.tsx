"use client";

import { useEffect, useRef, useState } from "react";

export type HeroStat = {
  key: string;
  /** First line, plain. */
  lead: string;
  /** The highlighted figure that opens the second line. */
  figure: string;
  /** Rest of the second line. */
  tail: string;
};

const DWELL_MS = 6000;
const OUT_MS = 450;
const SCRAMBLE_MS = 750;
const GLYPHS = "01<>/=#%&*{}[]";

/** The figure "decodes": random glyphs resolve left-to-right into the real text. */
function Scramble({ text }: { text: string }) {
  const [out, setOut] = useState<{ done: string; noise: string }>({ done: text, noise: "" });

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      setOut({ done: text, noise: "" });
      return;
    }
    let raf = 0;
    let start = 0;
    const tick = (now: number) => {
      if (!start) start = now;
      const t = Math.min(1, (now - start) / SCRAMBLE_MS);
      const resolved = Math.floor(t * text.length);
      let noise = "";
      for (let i = resolved; i < text.length; i++) {
        noise += text[i] === " " ? " " : GLYPHS[(Math.random() * GLYPHS.length) | 0];
      }
      setOut({ done: text.slice(0, resolved), noise });
      if (t < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [text]);

  return (
    <>
      {out.done}
      {out.noise && <span className="scr">{out.noise}</span>}
    </>
  );
}

function Line({ stat, out }: { stat: HeroStat; out?: boolean }) {
  return (
    <h2 className={`ticker-line${out ? " out" : ""}`} aria-hidden={out || undefined}>
      <span>{stat.lead}</span>
      <span>
        <em>{out ? stat.figure : <Scramble text={stat.figure} />}</em> {stat.tail}
      </span>
    </h2>
  );
}

/**
 * Hero headline that rotates through workspace stats: the old line lifts away
 * with a blur while the new one rises in and its figure decodes. Pauses while
 * hovered; the dots double as a progress bar and let you jump to a stat.
 */
export function HeroTicker({ stats }: { stats: HeroStat[] }) {
  const [index, setIndex] = useState(0);
  const [leaving, setLeaving] = useState<HeroStat | null>(null);
  const [paused, setPaused] = useState(false);
  const leaveTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  const safeIndex = stats.length ? index % stats.length : 0;
  const current = stats[safeIndex];

  const go = (next: number) => {
    if (!stats.length || next === safeIndex) return;
    setLeaving(stats[safeIndex]);
    setIndex(next);
    clearTimeout(leaveTimer.current);
    leaveTimer.current = setTimeout(() => setLeaving(null), OUT_MS);
  };

  useEffect(() => {
    if (paused || stats.length < 2) return;
    const t = setTimeout(() => go((safeIndex + 1) % stats.length), DWELL_MS);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [safeIndex, paused, stats.length]);

  useEffect(() => () => clearTimeout(leaveTimer.current), []);

  if (!current) return null;

  return (
    <div
      className="ticker"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      aria-live="polite"
    >
      <div className="relative">
        {leaving && <Line key={`out-${leaving.key}`} stat={leaving} out />}
        <Line key={current.key} stat={current} />
      </div>
      {stats.length > 1 && (
        <div className="ticker-dots" role="tablist" aria-label="Workspace stats">
          {stats.map((s, i) => (
            <button
              key={`${s.key}-${i === safeIndex ? index : "x"}`}
              type="button"
              role="tab"
              aria-selected={i === safeIndex}
              aria-label={`${s.lead} ${s.figure} ${s.tail}`}
              className={i === safeIndex ? "on" : undefined}
              style={{ ["--dwell" as string]: `${DWELL_MS}ms` }}
              onClick={() => go(i)}
            />
          ))}
        </div>
      )}
    </div>
  );
}
