"use client";

import { useState } from "react";
import { useQuery, keepPreviousData } from "@tanstack/react-query";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PseudocodeBlock } from "@/components/definitions/PseudocodeBlock";
import { AnimatedLogo } from "@/components/landing/AnimatedLogo";

const FORMATS = [
  { id: "generic", label: "Generic", lang: "sql" },
  { id: "sql", label: "SQL", lang: "sql" },
  { id: "python", label: "Python", lang: "python" },
  { id: "dbt", label: "dbt", lang: "sql" },
] as const;

type PseudocodePreviewDialogProps = {
  definition: { id: string; name: string; type: string } | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

export function PseudocodePreviewDialog({
  definition,
  open,
  onOpenChange,
}: PseudocodePreviewDialogProps) {
  const [format, setFormat] = useState("generic");
  const lang = FORMATS.find((f) => f.id === format)?.lang ?? "sql";

  const { data, isLoading } = useQuery({
    queryKey: ["pseudocode", definition?.id, format],
    queryFn: async () => {
      const res = await fetch(
        `/api/definitions/${definition!.id}/pseudocode?format=${format}`
      );
      const json = await res.json();
      if (json.error) throw new Error(json.error);
      return json.data as { code: string; compiledAt: string };
    },
    enabled: open && !!definition?.id,
    // Keep the previous language's code on screen while the new one compiles so
    // the swap can slide in smoothly instead of flashing a loader.
    placeholderData: keepPreviousData,
  });

  if (!definition) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="flex max-h-[92vh] w-[min(96vw,56rem)] max-w-none flex-col gap-0 overflow-hidden border-white/10 bg-[#161920] p-0 sm:max-w-none">
        <DialogHeader className="shrink-0 border-b border-white/10 px-6 py-4">
          <DialogTitle className="text-lg">{definition.name}</DialogTitle>
          <p className="text-xs text-white/40">{definition.type}</p>
        </DialogHeader>
        <Tabs
          value={format}
          onValueChange={setFormat}
          className="flex min-h-0 flex-1 flex-col"
        >
          <TabsList className="mx-6 mt-4 w-fit shrink-0 bg-[#0d0f14]">
            {FORMATS.map((f) => (
              <TabsTrigger key={f.id} value={f.id}>
                {f.label}
              </TabsTrigger>
            ))}
          </TabsList>
          {FORMATS.map((f) => (
            <TabsContent
              key={f.id}
              value={f.id}
              className="mt-0 min-h-0 flex-1 overflow-x-hidden overflow-y-auto px-6 pb-6 pt-4"
            >
              {format === f.id && (
                <div key={format} className="lg-pseudo-slide">
                  {isLoading && (
                    <div className="flex min-h-[min(52vh,420px)] flex-col items-center justify-center gap-3 rounded-lg border border-white/10 bg-[#0d0f14]">
                      <AnimatedLogo size={56} />
                      <p className="text-sm text-white/50">Compiling pseudocode…</p>
                    </div>
                  )}
                  {!isLoading && data?.code && (
                    <PseudocodeBlock
                      code={data.code}
                      language={lang}
                      label={`${f.label.toLowerCase()} · ${definition.name}`}
                      className="min-h-[min(52vh,420px)]"
                    />
                  )}
                  {data?.compiledAt && !isLoading && (
                    <p className="mt-3 text-[10px] text-white/30">
                      Compiled {new Date(data.compiledAt).toLocaleString()}
                    </p>
                  )}
                </div>
              )}
            </TabsContent>
          ))}
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
