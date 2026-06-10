"use client";

import { useState } from "react";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { Copy, Check } from "lucide-react";
import { logicgatePseudocodeStyle } from "@/lib/pseudocode-theme";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

type PseudocodeBlockProps = {
  code: string;
  language?: string;
  label?: string;
  className?: string;
  compact?: boolean;
};

export function PseudocodeBlock({
  code,
  language = "sql",
  label = "pseudocode",
  className,
  compact = false,
}: PseudocodeBlockProps) {
  const [copied, setCopied] = useState(false);

  const copyCode = async () => {
    await navigator.clipboard.writeText(code);
    setCopied(true);
    toast.success("Copied to clipboard");
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div
      className={cn(
        "overflow-hidden rounded-lg border border-[var(--border-color)] bg-[#0a0c10]",
        className
      )}
    >
      <div className="flex items-center justify-between border-b border-white/5 px-3 py-2">
        <span className="text-xs font-medium text-[var(--fg-muted)]">{label}</span>
        <button
          type="button"
          onClick={copyCode}
          className="flex items-center gap-1 text-xs text-[var(--fg-muted)] transition-colors hover:text-[var(--fg)]"
        >
          {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
          Copy
        </button>
      </div>
      <div
        className={cn(
          "overflow-auto",
          compact ? "max-h-[40vh] min-h-[120px]" : "max-h-[min(65vh,520px)] min-h-[200px]"
        )}
      >
        <SyntaxHighlighter
          language={language}
          style={logicgatePseudocodeStyle}
          customStyle={{
            margin: 0,
            padding: compact ? "1rem" : "1.25rem 1.35rem",
            background: "transparent",
            fontSize: compact ? "12.5px" : "14px",
            lineHeight: 1.7,
            fontFamily: "var(--font-mono, ui-monospace, monospace)",
          }}
          showLineNumbers={false}
          wrapLongLines
        >
          {code}
        </SyntaxHighlighter>
      </div>
    </div>
  );
}
