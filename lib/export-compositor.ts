/**
 * Utilities for compositing the WebGL canvas with 2D overlay canvases (e.g. ASCII effect)
 * so exports (PNG/MP4/GIF) match exactly what the user sees in the preview.
 *
 * Three.js post-processing (Bloom, Chromatic Aberration, Film Grain, Adjustments)
 * is applied inside the WebGL pipeline and is therefore already captured by the
 * raw WebGL canvas. Only 2D overlays (ASCII) need compositing here.
 */

export function getOverlayCanvas(): HTMLCanvasElement | null {
  if (typeof document === "undefined") return null;
  return document.querySelector(
    'canvas[data-ascii-overlay="true"]',
  ) as HTMLCanvasElement | null;
}

export function hasActiveOverlay(): boolean {
  const o = getOverlayCanvas();
  return !!(o && o.width > 0 && o.height > 0);
}

/**
 * Draws overlay (if present) on top of an already-drawn 2D context
 * at the given target dimensions.
 */
export function drawOverlayOnto(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
): void {
  const overlay = getOverlayCanvas();
  if (!overlay || overlay.width === 0 || overlay.height === 0) return;
  try {
    ctx.drawImage(overlay, 0, 0, width, height);
  } catch {
    // ignore - overlay not ready
  }
}

/**
 * Creates a live-updating composite canvas that mirrors the WebGL source
 * canvas plus any active 2D overlay. Used as the capture source for
 * video recording (MP4/GIF) so overlays are included.
 *
 * Call `stop()` when done to cancel the rAF loop and release the canvas.
 */
export function createLiveComposite(source: HTMLCanvasElement): {
  canvas: HTMLCanvasElement;
  stop: () => void;
} {
  const composite = document.createElement("canvas");
  composite.width = Math.max(1, source.width);
  composite.height = Math.max(1, source.height);
  const ctx = composite.getContext("2d");
  if (!ctx) {
    return { canvas: composite, stop: () => composite.remove() };
  }

  let rafId: number | null = null;
  let stopped = false;

  const draw = () => {
    if (stopped) return;

    if (
      composite.width !== source.width ||
      composite.height !== source.height
    ) {
      composite.width = Math.max(1, source.width);
      composite.height = Math.max(1, source.height);
    }

    try {
      ctx.clearRect(0, 0, composite.width, composite.height);
      if (source.width > 0 && source.height > 0) {
        ctx.drawImage(source, 0, 0, composite.width, composite.height);
      }
      drawOverlayOnto(ctx, composite.width, composite.height);
    } catch {
      // ignore - source not ready this frame
    }

    rafId = requestAnimationFrame(draw);
  };

  draw();

  return {
    canvas: composite,
    stop: () => {
      stopped = true;
      if (rafId !== null) cancelAnimationFrame(rafId);
      composite.remove();
    },
  };
}
