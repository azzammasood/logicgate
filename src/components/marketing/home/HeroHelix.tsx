"use client";

import { useEffect, useRef } from "react";
import { useReducedMotion } from "@/components/marketing/animations/useReducedMotion";

type Version = {
  v: string;
  who: string;
  when: string;
  removed?: string;
  added: string;
  why: string;
};

// One definition's history, oldest first. The last entry is the live version.
const VERSIONS: Version[] = [
  { v: "v1", who: "Ayesha R.", when: "Jan 8", added: "created", why: "First cut of MRR for the board deck" },
  {
    v: "v2",
    who: "Dawood L.",
    when: "Feb 2",
    removed: "type NOT IN [refund]",
    added: "type NOT IN [refund, chargeback]",
    why: "Finance audit: exclude chargebacks",
  },
  {
    v: "v3",
    who: "Ayesha R.",
    when: "Mar 14",
    added: "AND is_internal = false",
    why: "Test accounts were inflating revenue",
  },
  {
    v: "v4",
    who: "Sana K.",
    when: "Apr 3",
    removed: "GROUP BY week",
    added: "GROUP BY calendar_month",
    why: "Align with the finance close calendar",
  },
  {
    v: "v5",
    who: "Dawood L.",
    when: "May 21",
    removed: "amount > 0",
    added: "amount_usd > 0",
    why: "Multi-currency: normalise to USD",
  },
  {
    v: "v6",
    who: "Ayesha R.",
    when: "Jun 9",
    removed: "plan IN [trial, free]",
    added: "plan IN [trial]",
    why: "Free tier is now monetised",
  },
];

const LAST = VERSIONS.length - 1;
// Each card sits a full card-height above the previous one (STEP > the
// 136px card height), so neighbouring cards can never intersect whatever the angle.
const STEP = 160;
const ANGLE = 30;
const RADIUS = 340;
const DWELL_MS = 2600;
const LIVE_DWELL_MS = 4200;
/** Scrolling this far down the page winds the helix all the way to the live version. */
const SCROLL_TO_LIVE_PX = 360;

/**
 * A definition's version history as a 3D helix of cards. It plays forward
 * from v1 to the live version, rests there, then rewinds. The current card
 * always sits square-on at the front so its text stays crisp. Scrolling
 * takes over from playback and winds the helix forward to the live version
 * (and back again as you scroll up), while a parallax drift keeps it on
 * screen. The pointer tilts it; hover pauses playback.
 */
export function HeroHelix() {
  const helixRef = useRef<HTMLDivElement>(null);
  const cardsRef = useRef<(HTMLDivElement | null)[]>([]);
  const reduced = useReducedMotion();

  useEffect(() => {
    const helix = helixRef.current;
    if (!helix) return;

    const cur = { i: reduced ? LAST : 0, mx: 0, my: 0 };
    const tgt = { i: cur.i, mx: 0, my: 0 };
    // Raw (unsmoothed) scroll offset: the parallax must track the page exactly
    // or the helix wobbles against the scroll.
    let scrollPx = 0;
    // Version the helix was on when scrolling began; scroll winds from here.
    let scrollBase: number | null = null;
    let raf = 0;
    let running = false;
    let visible = true;
    let paused = false;
    let timer: ReturnType<typeof setTimeout> | undefined;
    let front = -1;

    const apply = () => {
      const tilt = 10 - cur.my * 6;
      const yaw = -cur.i * ANGLE + cur.mx * 10;
      const drift = Math.min(scrollPx * 0.5, 280);
      helix.style.transform =
        `translateY(${drift}px) rotateX(${tilt}deg) translateZ(${-RADIUS}px) ` +
        `translateY(${cur.i * STEP}px) rotateY(${yaw}deg)`;
      const nearest = Math.round(cur.i);
      cardsRef.current.forEach((card, k) => {
        if (!card) return;
        const d = Math.abs(k - cur.i);
        // Fade with distance; beyond two steps a card would turn edge-on.
        card.style.opacity = String(Math.max(0, 1 - d * 0.36));
        card.style.visibility = d > 2.6 ? "hidden" : "visible";
      });
      if (nearest !== front) {
        front = nearest;
        cardsRef.current.forEach((card, k) => card?.classList.toggle("now", k === nearest));
      }
    };

    const frame = () => {
      let settled = true;
      for (const k of ["i", "mx", "my"] as const) {
        const d = tgt[k] - cur[k];
        if (Math.abs(d) > 0.002) {
          cur[k] += d * (k === "i" ? 0.075 : 0.08);
          settled = false;
        } else cur[k] = tgt[k];
      }
      apply();
      if (settled) running = false;
      else raf = requestAnimationFrame(frame);
    };
    const wake = () => {
      if (running || !visible) return;
      running = true;
      raf = requestAnimationFrame(frame);
    };

    // Playback: step forward to the live version, hold, then rewind to v1.
    const schedule = () => {
      clearTimeout(timer);
      if (reduced) return;
      const atLive = tgt.i === LAST;
      timer = setTimeout(() => {
        if (!paused && visible && scrollBase === null) {
          tgt.i = atLive ? 0 : tgt.i + 1;
          wake();
        }
        schedule();
      }, atLive ? LIVE_DWELL_MS : DWELL_MS);
    };

    const onPointer = (e: PointerEvent) => {
      tgt.mx = (e.clientX / window.innerWidth) * 2 - 1;
      tgt.my = (e.clientY / window.innerHeight) * 2 - 1;
      wake();
    };
    const onScroll = () => {
      scrollPx = Math.max(0, window.scrollY);
      if (scrollPx > 4) {
        // Scrolling takes over: wind from the current version to the live one.
        if (scrollBase === null) scrollBase = Math.round(cur.i);
        const t = Math.min(1, scrollPx / SCROLL_TO_LIVE_PX);
        tgt.i = scrollBase + (LAST - scrollBase) * t;
      } else if (scrollBase !== null) {
        // Back at the top: settle on a whole version and resume playback.
        tgt.i = scrollBase;
        scrollBase = null;
        schedule();
      }
      wake();
    };
    const scene = helix.parentElement!;
    const onEnter = () => (paused = true);
    const onLeave = () => (paused = false);

    const io = new IntersectionObserver(([entry]) => {
      visible = entry.isIntersecting;
      if (visible) wake();
      else {
        cancelAnimationFrame(raf);
        running = false;
      }
    });
    io.observe(scene);

    onScroll();
    apply();
    schedule();
    if (!reduced) {
      window.addEventListener("pointermove", onPointer, { passive: true });
      window.addEventListener("scroll", onScroll, { passive: true });
      scene.addEventListener("pointerenter", onEnter);
      scene.addEventListener("pointerleave", onLeave);
    }
    return () => {
      cancelAnimationFrame(raf);
      clearTimeout(timer);
      io.disconnect();
      window.removeEventListener("pointermove", onPointer);
      window.removeEventListener("scroll", onScroll);
      scene.removeEventListener("pointerenter", onEnter);
      scene.removeEventListener("pointerleave", onLeave);
    };
  }, [reduced]);

  return (
    <div className="helix-scene" aria-label="Version history of monthly_active_revenue">
      <div ref={helixRef} className="helix">
        {VERSIONS.map((ver, k) => (
          <div
            key={ver.v}
            ref={(el) => {
              cardsRef.current[k] = el;
            }}
            className="helix-card"
            style={{
              transform: `rotateY(${k * ANGLE}deg) translateZ(${RADIUS}px) translateY(${-k * STEP}px)`,
            }}
          >
            <header>
              <span className="helix-v">{ver.v}</span>
              {k === LAST && <span className="helix-live">live</span>}
              <span className="helix-who">
                {ver.who} · {ver.when}
              </span>
            </header>
            <div className="helix-chg">
              {ver.removed && <span className="rm">{ver.removed}</span>}
              <span className="ad">
                {ver.removed ? "+ " : ""}
                {ver.added}
              </span>
            </div>
            <p className="helix-why">&ldquo;{ver.why}&rdquo;</p>
          </div>
        ))}
      </div>
    </div>
  );
}
