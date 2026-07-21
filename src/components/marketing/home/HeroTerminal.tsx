"use client";

import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { useReducedMotion } from "@/components/marketing/animations/useReducedMotion";

type Token = { text: string; color: string };

type CodeLine = Token[];

const TERMINAL_LINES: CodeLine[] = [
  [{ text: "-- Auto-compiled by LogicGate · v4.2 · Owner: Ayesha R.", color: "var(--text3)" }],
  [
    { text: "DEFINE ", color: "var(--accent)" },
    { text: "monthly_active_revenue", color: "#60a5fa" },
    { text: "(", color: "var(--text)" },
    { text: "month", color: "#fbbf24" },
    { text: "):", color: "var(--text)" },
  ],
  [
    { text: "  FROM ", color: "var(--accent)" },
    { text: "transactions", color: "var(--text)" },
  ],
  [{ text: "  WHERE", color: "var(--accent)" }],
  [
    { text: "    status = ", color: "var(--text)" },
    { text: '"completed"', color: "#fbbf24" },
  ],
  [
    { text: "    AND ", color: "var(--accent)" },
    { text: "type ", color: "var(--text)" },
    { text: "NOT IN ", color: "var(--accent)" },
    { text: '["refund", "chargeback"]', color: "#fbbf24" },
  ],
  [
    { text: "    AND ", color: "var(--accent)" },
    { text: "is_internal = ", color: "var(--text)" },
    { text: "false", color: "#a78bfa" },
  ],
  [
    { text: "    AND ", color: "var(--accent)" },
    { text: "amount_usd > ", color: "var(--text)" },
    { text: "0", color: "#a78bfa" },
  ],
  [
    { text: "  RETURN ", color: "var(--accent)" },
    { text: "SUM", color: "#60a5fa" },
    { text: "(amount_usd) ", color: "var(--text)" },
    { text: "GROUP BY ", color: "var(--accent)" },
    { text: "calendar_month", color: "#fbbf24" },
  ],
  [
    {
      text: "  → Approved by Dawood L.",
      color: "var(--text2)",
    },
  ],
];

const FLAT_TEXT = TERMINAL_LINES.map((line) => line.map((t) => t.text).join("")).join(
  "\n"
);

function useTypewriter(
  text: string,
  enabled: boolean,
  start: boolean,
  startDelayMs = 900
) {
  const [count, setCount] = useState(enabled ? 0 : text.length);
  const [started, setStarted] = useState(false);

  // Reduced motion (or otherwise disabled): show the full output immediately.
  useEffect(() => {
    if (!enabled) {
      setCount(text.length);
      setStarted(true);
    }
  }, [text, enabled]);

  // Begin typing only once the terminal scrolls into view.
  useEffect(() => {
    if (!enabled || !start) return;
    const startTimer = setTimeout(() => setStarted(true), startDelayMs);
    return () => clearTimeout(startTimer);
  }, [enabled, start, startDelayMs]);

  useEffect(() => {
    if (!enabled || !started || count >= text.length) return;

    const char = text[count] ?? "";
    const delay = char === "\n" ? 70 : /[{}[\]();,]/.test(char) ? 16 : 8;

    const timer = setTimeout(() => setCount((c) => c + 1), delay);
    return () => clearTimeout(timer);
  }, [count, text, enabled, started]);

  return count;
}

function renderTypedLines(lines: CodeLine[], typedCount: number) {
  let offset = 0;
  const rendered: ReactNode[] = [];

  for (let li = 0; li < lines.length; li++) {
    const line = lines[li]!;
    const lineStart = offset;
    const lineText = line.map((t) => t.text).join("");
    offset += lineText.length + 1;

    if (typedCount <= lineStart) break;

    const visibleInLine = Math.min(typedCount - lineStart, lineText.length);
    if (visibleInLine <= 0) continue;

    let consumed = 0;
    const spans: ReactNode[] = [];

    for (const token of line) {
      if (consumed >= visibleInLine) break;
      const take = Math.min(token.text.length, visibleInLine - consumed);
      if (take > 0) {
        spans.push(
          <span key={`${li}-${consumed}`} style={{ color: token.color }}>
            {token.text.slice(0, take)}
          </span>
        );
        consumed += take;
      }
    }

    rendered.push(
      <span key={li}>
        {spans}
        {li < lines.length - 1 ? "\n" : ""}
      </span>
    );
  }

  return rendered;
}

function renderFullLines(lines: CodeLine[]): ReactNode[] {
  return lines.map((line, li) => (
    <span key={li}>
      {line.map((token, ti) => (
        <span key={ti} style={{ color: token.color }}>
          {token.text}
        </span>
      ))}
      {li < lines.length - 1 ? "\n" : ""}
    </span>
  ));
}

export function HeroTerminal() {
  const reducedMotion = useReducedMotion();
  const terminalRef = useRef<HTMLDivElement>(null);
  const [inView, setInView] = useState(false);

  useEffect(() => {
    const el = terminalRef.current;
    if (!el || typeof IntersectionObserver === "undefined") {
      setInView(true);
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) {
          setInView(true);
          observer.disconnect();
        }
      },
      { threshold: 0.35 }
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  const typedCount = useTypewriter(FLAT_TEXT, !reducedMotion, inView, 400);
  const isTyping = !reducedMotion && inView && typedCount < FLAT_TEXT.length;

  const fullCode = useMemo(() => renderFullLines(TERMINAL_LINES), []);

  const codeContent = useMemo(
    () =>
      reducedMotion
        ? fullCode
        : renderTypedLines(TERMINAL_LINES, typedCount),
    [reducedMotion, typedCount, fullCode]
  );

  return (
    <div
      ref={terminalRef}
      className="hero-terminal hero-fade-up hero-fade-up-4"
      style={{
        maxWidth: 800,
        width: "100%",
        background: "var(--bg2)",
        border: "1px solid var(--border2)",
        borderRadius: 12,
        overflow: "hidden",
        boxShadow: "0 24px 56px rgba(0,0,0,0.4)",
        textAlign: "left",
      }}
    >
      <div className="hero-terminal-chrome">
        <span className="hero-terminal-dot hero-terminal-dot-red" />
        <span className="hero-terminal-dot hero-terminal-dot-yellow" />
        <span className="hero-terminal-dot hero-terminal-dot-green" />
        <span className="hero-terminal-title marketing-mono">
          monthly_active_revenue
        </span>
      </div>
      <div className="hero-terminal-body">
        <pre className="marketing-mono hero-terminal-code hero-terminal-code-ghost" aria-hidden>
          <code>{fullCode}</code>
        </pre>
        <pre className="marketing-mono hero-terminal-code hero-terminal-code-live">
          <code>
            {codeContent}
            <span
              className={`hero-terminal-cursor${isTyping ? " is-typing" : ""}`}
              aria-hidden
            />
          </code>
        </pre>
      </div>
    </div>
  );
}
