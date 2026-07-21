"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { ZoomIn, ZoomOut } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

const VIEWPORT = 288; // px — the square crop window
const OUTPUT = 384; // px — exported image size

type Props = {
  /** Source file to crop; null closes the dialog. */
  file: File | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Receives the cropped square as a JPEG blob. */
  onCropped: (blob: Blob) => void | Promise<void>;
  shape?: "circle" | "square";
  title?: string;
  busy?: boolean;
};

/**
 * Lightweight drag-and-zoom square cropper. The user pans/zooms the image
 * within a fixed viewport; on confirm the visible region is drawn to a canvas
 * and exported as a JPEG blob. No external dependencies.
 */
export function ImageCropperDialog({
  file,
  open,
  onOpenChange,
  onCropped,
  shape = "circle",
  title = "Crop image",
  busy = false,
}: Props) {
  const imgRef = useRef<HTMLImageElement | null>(null);
  const [url, setUrl] = useState<string | null>(null);
  const [nat, setNat] = useState<{ w: number; h: number } | null>(null);
  const [zoom, setZoom] = useState(1);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const drag = useRef<{ x: number; y: number; ox: number; oy: number } | null>(null);

  // Load the file into an object URL and read its natural dimensions.
  useEffect(() => {
    if (!file) {
      setUrl(null);
      setNat(null);
      return;
    }
    const objectUrl = URL.createObjectURL(file);
    setUrl(objectUrl);
    const img = new Image();
    img.onload = () => setNat({ w: img.naturalWidth, h: img.naturalHeight });
    img.src = objectUrl;
    return () => URL.revokeObjectURL(objectUrl);
  }, [file]);

  const baseScale = nat ? VIEWPORT / Math.min(nat.w, nat.h) : 1;
  const displayScale = baseScale * zoom;
  const imgW = nat ? nat.w * displayScale : 0;
  const imgH = nat ? nat.h * displayScale : 0;

  const clamp = useCallback(
    (x: number, y: number) => ({
      x: Math.min(0, Math.max(VIEWPORT - imgW, x)),
      y: Math.min(0, Math.max(VIEWPORT - imgH, y)),
    }),
    [imgW, imgH]
  );

  // Center the image whenever a new one loads or zoom changes bounds.
  useEffect(() => {
    if (!nat) return;
    setOffset({ x: (VIEWPORT - imgW) / 2, y: (VIEWPORT - imgH) / 2 });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [nat]);

  function onZoom(next: number) {
    if (!nat) return;
    const z = Math.min(3, Math.max(1, next));
    const nextScale = baseScale * z;
    const nextW = nat.w * nextScale;
    const nextH = nat.h * nextScale;
    // Keep the viewport center anchored on the same source point.
    const cxFrac = (VIEWPORT / 2 - offset.x) / imgW;
    const cyFrac = (VIEWPORT / 2 - offset.y) / imgH;
    const nx = VIEWPORT / 2 - cxFrac * nextW;
    const ny = VIEWPORT / 2 - cyFrac * nextH;
    setZoom(z);
    setOffset({
      x: Math.min(0, Math.max(VIEWPORT - nextW, nx)),
      y: Math.min(0, Math.max(VIEWPORT - nextH, ny)),
    });
  }

  function onPointerDown(e: React.PointerEvent) {
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
    drag.current = { x: e.clientX, y: e.clientY, ox: offset.x, oy: offset.y };
  }
  function onPointerMove(e: React.PointerEvent) {
    if (!drag.current) return;
    const dx = e.clientX - drag.current.x;
    const dy = e.clientY - drag.current.y;
    setOffset(clamp(drag.current.ox + dx, drag.current.oy + dy));
  }
  function onPointerUp() {
    drag.current = null;
  }

  async function confirm() {
    const img = imgRef.current;
    if (!img || !nat) return;
    const srcSize = VIEWPORT / displayScale;
    const srcX = -offset.x / displayScale;
    const srcY = -offset.y / displayScale;

    const canvas = document.createElement("canvas");
    canvas.width = OUTPUT;
    canvas.height = OUTPUT;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.imageSmoothingQuality = "high";
    ctx.drawImage(img, srcX, srcY, srcSize, srcSize, 0, 0, OUTPUT, OUTPUT);

    const blob = await new Promise<Blob | null>((resolve) =>
      canvas.toBlob((b) => resolve(b), "image/jpeg", 0.9)
    );
    if (blob) await onCropped(blob);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="border-white/10 bg-[#161920] sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription className="text-white/50">
            Drag to reposition, and zoom to frame the region you want.
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col items-center gap-4">
          <div
            className="relative touch-none overflow-hidden rounded-lg bg-black select-none"
            style={{ width: VIEWPORT, height: VIEWPORT }}
            onPointerDown={onPointerDown}
            onPointerMove={onPointerMove}
            onPointerUp={onPointerUp}
            onPointerCancel={onPointerUp}
          >
            {url && (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                ref={imgRef}
                src={url}
                alt=""
                draggable={false}
                className="absolute max-w-none cursor-grab active:cursor-grabbing"
                style={{ width: imgW, height: imgH, left: offset.x, top: offset.y }}
              />
            )}
            {/* Darken outside the crop guide */}
            <div
              className="pointer-events-none absolute inset-0"
              style={{
                boxShadow: "0 0 0 9999px rgba(0,0,0,0.55)",
                borderRadius: shape === "circle" ? "50%" : "0.5rem",
                border: "1px solid rgba(255,255,255,0.35)",
              }}
            />
          </div>

          <div className="flex w-full items-center gap-3 px-1">
            <ZoomOut className="h-4 w-4 shrink-0 text-white/40" />
            <input
              type="range"
              min={1}
              max={3}
              step={0.01}
              value={zoom}
              onChange={(e) => onZoom(Number(e.target.value))}
              className="h-1 w-full cursor-pointer appearance-none rounded-full bg-white/15 accent-[var(--accent,#4ade80)]"
              aria-label="Zoom"
            />
            <ZoomIn className="h-4 w-4 shrink-0 text-white/40" />
          </div>
        </div>

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            className="border-white/10"
            onClick={() => onOpenChange(false)}
            disabled={busy}
          >
            Cancel
          </Button>
          <Button
            type="button"
            className="bg-[var(--accent,#4ade80)] text-black hover:opacity-90"
            onClick={confirm}
            disabled={busy || !nat}
          >
            {busy ? "Uploading…" : "Confirm & upload"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
