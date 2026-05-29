"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { atomOneDark } from "react-syntax-highlighter/dist/esm/styles/hljs";
import { Copy, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

const FORMATS = [
  { id: "generic", label: "Generic" },
  { id: "sql", label: "SQL" },
  { id: "python", label: "Python" },
  { id: "dbt", label: "dbt" },
] as const;

type PseudocodePanelProps = {
  definitionId: string;
  variant?: "default" | "sidebar";
};

export function PseudocodePanel({
  definitionId,
  variant = "default",
}: PseudocodePanelProps) {
  const [format, setFormat] = useState<string>("generic");
  const [copied, setCopied] = useState(false);
  const sidebar = variant === "sidebar";

  const { data, isLoading, isError } = useQuery({
    queryKey: ["pseudocode", definitionId, format],
    queryFn: async () => {
      const res = await fetch(
        `/api/definitions/${definitionId}/pseudocode?format=${format}`
      );
      const json = await res.json();
      if (json.error) throw new Error(json.error);
      return json.data as { code: string; format: string; compiledAt: string };
    },
    enabled: !!definitionId,
  });

  const copyCode = async () => {
    if (!data?.code) return;
    await navigator.clipboard.writeText(data.code);
    setCopied(true);
    toast.success("Copied to clipboard");
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className={cn("flex h-full flex-col", sidebar ? "p-3" : "p-6")}>
      <Tabs value={format} onValueChange={setFormat} className="flex min-h-0 flex-1 flex-col">
        <div
          className={cn(
            "mb-3 flex items-center justify-between gap-2",
            sidebar && "flex-col items-stretch"
          )}
        >
          <TabsList className={cn("bg-[#0d0f14]", sidebar && "h-8 w-full")}>
            {FORMATS.map((f) => (
              <TabsTrigger key={f.id} value={f.id} className={sidebar ? "flex-1 px-1 text-[10px]" : ""}>
                {f.label}
              </TabsTrigger>
            ))}
          </TabsList>
          <Button
            variant="outline"
            size="sm"
            className="shrink-0 border-white/10"
            onClick={copyCode}
            disabled={!data?.code}
          >
            {copied ? <Check className="mr-1 h-3 w-3" /> : <Copy className="mr-1 h-3 w-3" />}
            Copy
          </Button>
        </div>
        {FORMATS.map((f) => (
          <TabsContent key={f.id} value={f.id} className="mt-0 min-h-0 flex-1 overflow-hidden">
            {isLoading && <p className="text-xs text-white/40">Compiling…</p>}
            {isError && <p className="text-xs text-red-400">Failed to compile.</p>}
            {data?.code && (
              <div
                className={cn(
                  "overflow-auto rounded-lg border border-white/10",
                  sidebar ? "max-h-[calc(100vh-12rem)]" : "max-h-[calc(100vh-220px)]"
                )}
              >
                <SyntaxHighlighter
                  language={
                    f.id === "python" ? "python" : f.id === "sql" ? "sql" : "javascript"
                  }
                  style={atomOneDark}
                  customStyle={{
                    margin: 0,
                    padding: sidebar ? "0.75rem" : "1rem",
                    background: "#0d0f14",
                    fontSize: sidebar ? "11px" : "13px",
                  }}
                >
                  {data.code}
                </SyntaxHighlighter>
              </div>
            )}
            {data?.compiledAt && (
              <p className="mt-2 text-[10px] text-white/30">
                Compiled {new Date(data.compiledAt).toLocaleString()}
              </p>
            )}
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
}
