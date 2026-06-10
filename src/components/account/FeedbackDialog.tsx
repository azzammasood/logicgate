"use client";



import { useState } from "react";

import { useMutation } from "@tanstack/react-query";

import { X } from "lucide-react";

import {

  Dialog,

  DialogContent,

} from "@/components/ui/dialog";

import {

  Select,

  SelectContent,

  SelectItem,

  SelectTrigger,

  SelectValue,

} from "@/components/ui/select";

import { Textarea } from "@/components/ui/textarea";

import { Button } from "@/components/ui/button";

import { actionOverlay } from "@/stores/actionOverlay";

import { toast } from "sonner";

import { cn } from "@/lib/utils";



const TOPICS = [

  "Bug report",

  "Feature request",

  "Usability",

  "Performance",

  "Documentation",

  "Other",

] as const;



const SENTIMENTS = [

  { id: "sad", emoji: "😞", label: "Frustrated" },

  { id: "neutral", emoji: "😐", label: "Neutral" },

  { id: "happy", emoji: "🙂", label: "Happy" },

  { id: "love", emoji: "😍", label: "Love it" },

] as const;



type Sentiment = (typeof SENTIMENTS)[number]["id"];



export function FeedbackDialog({

  open,

  onOpenChange,

}: {

  open: boolean;

  onOpenChange: (open: boolean) => void;

}) {

  const [topic, setTopic] = useState<string>("");

  const [body, setBody] = useState("");

  const [sentiment, setSentiment] = useState<Sentiment | undefined>();



  const send = useMutation({

    mutationFn: async () => {

      const res = await fetch("/api/feedback", {

        method: "POST",

        headers: { "Content-Type": "application/json" },

        body: JSON.stringify({ topic, body, sentiment }),

      });

      const json = await res.json();

      if (json.error) throw new Error(json.error);

      return json.data;

    },

    onMutate: () => actionOverlay.show("Sending feedback"),

    onSettled: () => actionOverlay.hide(),

    onSuccess: () => {

      toast.success("Feedback sent — thank you!");

      setTopic("");

      setBody("");

      setSentiment(undefined);

      onOpenChange(false);

    },

    onError: (e: Error) => toast.error(e.message),

  });



  return (

    <Dialog open={open} onOpenChange={onOpenChange}>

      <DialogContent

        showCloseButton={false}

        className="max-w-md gap-0 overflow-hidden border border-[var(--border-color)] bg-[var(--surface,#161920)] p-0 text-[var(--fg)] shadow-2xl"

      >

        <div className="relative border-b border-[var(--border-color)] p-4 pr-12">

          <Select value={topic} onValueChange={(v) => v && setTopic(v)}>

            <SelectTrigger className="h-10 w-full border-[var(--border-color)] bg-[var(--background,#0d0f14)]">

              <SelectValue placeholder="Select a topic…">

                {topic || "Select a topic…"}

              </SelectValue>

            </SelectTrigger>

            <SelectContent className="z-[300] border-[var(--border-color)] bg-[var(--surface,#161920)]">

              {TOPICS.map((t) => (

                <SelectItem key={t} value={t}>

                  {t}

                </SelectItem>

              ))}

            </SelectContent>

          </Select>

          <button

            type="button"

            onClick={() => onOpenChange(false)}

            className="absolute top-4 right-4 flex h-8 w-8 items-center justify-center rounded-md text-[var(--fg-muted)] transition-colors hover:bg-white/5 hover:text-[var(--fg)]"

            aria-label="Close"

          >

            <X className="h-4 w-4" />

          </button>

        </div>



        <Textarea

          placeholder="Your feedback…"

          value={body}

          onChange={(e) => setBody(e.target.value)}

          className="min-h-[140px] resize-none rounded-none border-0 border-b border-[var(--border-color)] bg-[var(--background,#0d0f14)] px-4 py-3 text-sm focus-visible:ring-0"

        />



        <div className="flex items-center justify-between gap-3 px-4 py-3">

          <div className="flex items-center gap-1">

            {SENTIMENTS.map((s) => (

              <button

                key={s.id}

                type="button"

                title={s.label}

                onClick={() => setSentiment(s.id)}

                className={cn(

                  "flex h-9 w-9 items-center justify-center rounded-md text-lg transition-colors hover:bg-white/5",

                  sentiment === s.id && "bg-white/10 ring-1 ring-[var(--border-color)]"

                )}

              >

                {s.emoji}

              </button>

            ))}

          </div>

          <Button

            className="bg-white text-black hover:bg-white/90"

            disabled={!topic || body.trim().length < 3 || send.isPending}

            onClick={() => send.mutate()}

          >

            Send

          </Button>

        </div>

      </DialogContent>

    </Dialog>

  );

}

