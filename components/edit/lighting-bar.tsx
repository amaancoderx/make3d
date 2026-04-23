"use client";

import { useCallback, useEffect, useRef } from "react";
import { useEditorStore } from "@/lib/store";

export function LightingBar() {
  const lightAngle = useEditorStore((s) => s.lightAngle);
  const setLightAngle = useEditorStore((s) => s.setLightAngle);

  const barRef = useRef<HTMLDivElement>(null);
  const draggingRef = useRef(false);

  // Map angle (0 -> 2PI) to a normalized 0-1 handle position
  const t = (lightAngle % (Math.PI * 2)) / (Math.PI * 2);

  const updateFromClientY = useCallback(
    (clientY: number) => {
      const bar = barRef.current;
      if (!bar) return;
      const rect = bar.getBoundingClientRect();
      const rel = Math.min(1, Math.max(0, (clientY - rect.top) / rect.height));
      setLightAngle(rel * Math.PI * 2);
    },
    [setLightAngle],
  );

  useEffect(() => {
    const onMove = (e: MouseEvent) => {
      if (!draggingRef.current) return;
      e.preventDefault();
      updateFromClientY(e.clientY);
    };
    const onTouchMove = (e: TouchEvent) => {
      if (!draggingRef.current) return;
      e.preventDefault();
      if (e.touches[0]) updateFromClientY(e.touches[0].clientY);
    };
    const onUp = () => {
      draggingRef.current = false;
    };
    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup", onUp);
    window.addEventListener("touchmove", onTouchMove, { passive: false });
    window.addEventListener("touchend", onUp);
    window.addEventListener("touchcancel", onUp);
    return () => {
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseup", onUp);
      window.removeEventListener("touchmove", onTouchMove);
      window.removeEventListener("touchend", onUp);
      window.removeEventListener("touchcancel", onUp);
    };
  }, [updateFromClientY]);

  return (
    <div
      ref={barRef}
      className="pointer-events-none absolute inset-y-10 right-4 z-20 sm:right-6"
      style={{ width: "18px" }}>
      {/* Thin vertical line - visual only, no pointer events so canvas gestures pass through */}
      <div
        className="pointer-events-none absolute left-1/2 -translate-x-1/2"
        style={{
          top: 0,
          bottom: 0,
          width: "1px",
          background: "rgba(255,255,255,0.55)",
        }}
      />
      {/* Handle with oversized touch target (44x44 on mobile, 32x32 on desktop) */}
      <div
        className="pointer-events-auto absolute left-1/2 flex cursor-pointer items-center justify-center"
        style={{
          width: "44px",
          height: "44px",
          top: `calc(${t * 100}% - 22px)`,
          transform: "translateX(-50%)",
          touchAction: "none",
          transition: draggingRef.current ? "none" : "top 0.08s linear",
        }}
        onMouseDown={(e) => {
          e.preventDefault();
          draggingRef.current = true;
          updateFromClientY(e.clientY);
        }}
        onTouchStart={(e) => {
          e.preventDefault();
          draggingRef.current = true;
          if (e.touches[0]) updateFromClientY(e.touches[0].clientY);
        }}>
        {/* Visual handle dot */}
        <div
          className="rounded-full bg-white shadow-[0_0_14px_rgba(255,255,255,0.7),0_0_28px_rgba(255,255,255,0.25)]"
          style={{
            width: "14px",
            height: "14px",
          }}
        />
      </div>
    </div>
  );
}
