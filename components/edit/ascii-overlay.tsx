"use client";

import { useEffect, useRef } from "react";
import { useEditorStore } from "@/lib/store";

interface AsciiOverlayProps {
  sourceCanvasRef: React.RefObject<HTMLCanvasElement | null>;
}

const SHAPES = ["Blocks", "Circles", "Lines", "Diagonal", "Cross", "Diamond", "Hash"];

function drawShape(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  size: number,
  shape: string,
) {
  const half = size / 2;
  switch (shape) {
    case "Blocks":
      ctx.fillRect(x - half, y - half, size, size);
      break;
    case "Circles":
      ctx.beginPath();
      ctx.arc(x, y, half, 0, Math.PI * 2);
      ctx.fill();
      break;
    case "Lines":
      ctx.fillRect(x - half, y - Math.max(1, size * 0.18), size, Math.max(1, size * 0.36));
      break;
    case "Diagonal": {
      ctx.save();
      ctx.translate(x, y);
      ctx.rotate(Math.PI / 4);
      ctx.fillRect(-half, -Math.max(1, size * 0.18), size, Math.max(1, size * 0.36));
      ctx.restore();
      break;
    }
    case "Cross": {
      const t = Math.max(1, size * 0.22);
      ctx.fillRect(x - half, y - t / 2, size, t);
      ctx.fillRect(x - t / 2, y - half, t, size);
      break;
    }
    case "Diamond": {
      ctx.beginPath();
      ctx.moveTo(x, y - half);
      ctx.lineTo(x + half, y);
      ctx.lineTo(x, y + half);
      ctx.lineTo(x - half, y);
      ctx.closePath();
      ctx.fill();
      break;
    }
    case "Hash": {
      const t = Math.max(1, size * 0.14);
      const g = size * 0.28;
      ctx.fillRect(x - half, y - g - t / 2, size, t);
      ctx.fillRect(x - half, y + g - t / 2, size, t);
      ctx.fillRect(x - g - t / 2, y - half, t, size);
      ctx.fillRect(x + g - t / 2, y - half, t, size);
      break;
    }
    default:
      ctx.fillRect(x - half, y - half, size, size);
  }
}

export function AsciiOverlay({ sourceCanvasRef }: AsciiOverlayProps) {
  const overlayRef = useRef<HTMLCanvasElement>(null);
  const sampleRef = useRef<HTMLCanvasElement | null>(null);
  const rafRef = useRef<number | null>(null);

  const effectType = useEditorStore((s) => s.effectType);
  const size = useEditorStore((s) => s.asciiSize);
  const brightness = useEditorStore((s) => s.asciiBrightness);
  const spacing = useEditorStore((s) => s.asciiSpacing);
  const shape = useEditorStore((s) => s.asciiShape);
  const colorMode = useEditorStore((s) => s.asciiColorMode);
  const backgroundColor = useEditorStore((s) => s.backgroundColor);

  useEffect(() => {
    if (effectType !== "ascii") return;
    const overlay = overlayRef.current;
    const source = sourceCanvasRef.current;
    if (!overlay || !source) return;

    const ctx = overlay.getContext("2d");
    if (!ctx) return;

    if (!sampleRef.current) {
      sampleRef.current = document.createElement("canvas");
    }
    const sample = sampleRef.current;
    const sctx = sample.getContext("2d", { willReadFrequently: true });
    if (!sctx) return;

    const cellSize = Math.max(2, size + spacing);

    const draw = () => {
      const sw = source.width;
      const sh = source.height;
      if (sw === 0 || sh === 0) {
        rafRef.current = requestAnimationFrame(draw);
        return;
      }

      // Downsample source for performance - sample at 1 pixel per cell
      const cols = Math.max(1, Math.floor(sw / cellSize));
      const rows = Math.max(1, Math.floor(sh / cellSize));

      sample.width = cols;
      sample.height = rows;
      try {
        sctx.drawImage(source, 0, 0, cols, rows);
      } catch {
        rafRef.current = requestAnimationFrame(draw);
        return;
      }

      let imgData: ImageData;
      try {
        imgData = sctx.getImageData(0, 0, cols, rows);
      } catch {
        rafRef.current = requestAnimationFrame(draw);
        return;
      }
      const data = imgData.data;

      // Resize overlay to match source pixel dimensions
      if (overlay.width !== sw || overlay.height !== sh) {
        overlay.width = sw;
        overlay.height = sh;
      }

      // Paint opaque background matching scene bg so WebGL canvas is fully covered
      ctx.fillStyle = backgroundColor || "#000000";
      ctx.fillRect(0, 0, sw, sh);

      for (let row = 0; row < rows; row++) {
        for (let col = 0; col < cols; col++) {
          const idx = (row * cols + col) * 4;
          const r = data[idx];
          const g = data[idx + 1];
          const b = data[idx + 2];
          const a = data[idx + 3];

          if (a < 8) continue;

          const lum = (r * 0.299 + g * 0.587 + b * 0.114) / 255;
          const intensity = Math.min(1, lum * brightness * 0.6);
          if (intensity < 0.04) continue;

          const px = col * cellSize + cellSize / 2;
          const py = row * cellSize + cellSize / 2;
          const drawSize = Math.max(1, cellSize * intensity);

          // Resolve shape (Mixed chooses deterministically per cell)
          let s = shape;
          if (shape === "Mixed") {
            const h = (col * 73856093) ^ (row * 19349663);
            s = SHAPES[Math.abs(h) % SHAPES.length];
          }

          // Resolve color
          if (colorMode === "duotone") {
            // Bright -> color1, dark -> color2
            const t = intensity;
            const c1 = [0, 229, 255]; // cyan
            const c2 = [255, 80, 180]; // magenta
            const cr = Math.round(c2[0] + (c1[0] - c2[0]) * t);
            const cg = Math.round(c2[1] + (c1[1] - c2[1]) * t);
            const cb = Math.round(c2[2] + (c1[2] - c2[2]) * t);
            ctx.fillStyle = `rgb(${cr},${cg},${cb})`;
          } else if (colorMode === "randomize") {
            const h = (col * 2654435761 + row * 40503) | 0;
            const hue = Math.abs(h) % 360;
            ctx.fillStyle = `hsl(${hue},95%,60%)`;
          } else {
            ctx.fillStyle = `rgb(${r},${g},${b})`;
          }

          drawShape(ctx, px, py, drawSize, s);
        }
      }

      rafRef.current = requestAnimationFrame(draw);
    };

    rafRef.current = requestAnimationFrame(draw);
    return () => {
      if (rafRef.current) {
        cancelAnimationFrame(rafRef.current);
        rafRef.current = null;
      }
    };
  }, [
    effectType,
    sourceCanvasRef,
    size,
    brightness,
    spacing,
    shape,
    colorMode,
    backgroundColor,
  ]);

  if (effectType !== "ascii") return null;

  return (
    <canvas
      ref={overlayRef}
      style={{
        position: "absolute",
        top: 0,
        left: 0,
        width: "100%",
        height: "100%",
        pointerEvents: "none",
        zIndex: 5,
      }}
    />
  );
}
