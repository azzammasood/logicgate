"use client";

import { useEffect, useRef, useState } from "react";
import type { CompileFormat } from "@/lib/compiler";
import { highlightCode } from "@/lib/marketing/highlight-code";
import { CompileLoaderLogo } from "@/components/marketing/home/CompileLoaderLogo";

const MIN_LOADING_MS = 620;

type CompileOutputPanelProps = {
  code: string;
  format: CompileFormat;
  compileToken: number;
};

export function CompileOutputPanel({
  code,
  format,
  compileToken,
}: CompileOutputPanelProps) {
  const [phase, setPhase] = useState<"loading" | "ready">("loading");
  const [displayCode, setDisplayCode] = useState(code);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const startedRef = useRef<number>(0);

  useEffect(() => {
    setPhase("loading");
    startedRef.current = Date.now();

    if (timerRef.current) clearTimeout(timerRef.current);

    timerRef.current = setTimeout(() => {
      const elapsed = Date.now() - startedRef.current;
      const remaining = Math.max(0, MIN_LOADING_MS - elapsed);

      setTimeout(() => {
        setDisplayCode(code);
        setPhase("ready");
      }, remaining);
    }, 48);

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [code, compileToken]);

  const formatLabel =
    format === "generic" ? "pseudocode" : format.toUpperCase();

  return (
    <div
      className={`compile-output-wrap${phase === "loading" ? " is-loading" : ""}`}
      aria-busy={phase === "loading"}
      aria-live="polite"
    >
      <div className="compile-output-loading" aria-hidden={phase !== "loading"}>
        <div className="compile-output-loader">
          <CompileLoaderLogo />
          <span className="compile-output-loader-bar" />
          <span className="compile-output-loader-text marketing-mono">
            Compiling {formatLabel}…
          </span>
        </div>
      </div>
      <pre
        className={`compile-output-content marketing-mono${phase === "ready" ? " is-ready" : ""}`}
        style={{ margin: 0, fontSize: 12, lineHeight: 2, whiteSpace: "pre-wrap" }}
      >
        <code>{highlightCode(displayCode, format)}</code>
      </pre>
    </div>
  );
}
