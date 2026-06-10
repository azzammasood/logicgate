"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PseudocodeBlock } from "@/components/definitions/PseudocodeBlock";
import { cn } from "@/lib/utils";

const FORMATS = [
  { id: "generic", label: "Generic", lang: "sql" },
  { id: "sql", label: "SQL", lang: "sql" },
  { id: "python", label: "Python", lang: "python" },
  { id: "dbt", label: "dbt", lang: "sql" },
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
  const sidebar = variant === "sidebar";
  const lang = FORMATS.find((f) => f.id === format)?.lang ?? "sql";

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

  return (
    <div className={cn("flex h-full flex-col", sidebar ? "p-3" : "p-6")}>
      <Tabs value={format} onValueChange={setFormat} className="flex min-h-0 flex-1 flex-col">
        <TabsList className={cn("mb-3 bg-[#0d0f14]", sidebar && "h-8 w-full")}>
          {FORMATS.map((f) => (
            <TabsTrigger
              key={f.id}
              value={f.id}
              className={sidebar ? "flex-1 px-1 text-[10px]" : ""}
            >
              {f.label}
            </TabsTrigger>
          ))}
        </TabsList>
        {FORMATS.map((f) => (
          <TabsContent key={f.id} value={f.id} className="mt-0 min-h-0 flex-1 overflow-hidden">
            {isLoading && <p className="text-xs text-white/40">Compiling…</p>}
            {isError && <p className="text-xs text-red-400">Failed to compile.</p>}
            {data?.code && (
              <PseudocodeBlock
                code={data.code}
                language={lang}
                compact={sidebar}
                className={sidebar ? undefined : "min-h-[min(70vh,600px)]"}
              />
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
