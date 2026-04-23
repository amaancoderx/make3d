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
      if (e.touches[0]) updateFromClientY(e.touches[0].clientY);
    };
    const onUp = () => {
      draggingRef.current = false;
    };
    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup", onUp);
    window.addEventListener("touchmove", onTouchMove, { passive: false });
    window.addEventListener("touchend", onUp);
    return () => {
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseup", onUp);
      window.removeEventListener("touchmove", onTouchMove);
      window.removeEventListener("touchend", onUp);
    };
  }, [updateFromClientY]);

  return (
    <div
      className="pointer-events-none absolute inset-y-10 right-6 z-20 flex items-stretch"
      style={{ width: "18px" }}>
      <div
        ref={barRef}
        className="pointer-events-auto relative mx-auto h-full cursor-pointer"
        style={{ width: "18px" }}
        onMouseDown={(e) => {
          e.preventDefault();
          draggingRef.current = true;
          updateFromClientY(e.clientY);
        }}
        onTouchStart={(e) => {
          draggingRef.current = true;
          if (e.touches[0]) updateFromClientY(e.touches[0].clientY);
        }}>
        {/* Thin vertical line */}
        <div
          className="absolute left-1/2 -translate-x-1/2"
          style={{
            top: 0,
            bottom: 0,
            width: "1px",
            background: "rgba(255,255,255,0.55)",
          }}
        />
        {/* Handle */}
        <div
          className="absolute left-1/2 rounded-full bg-white shadow-[0_0_14px_rgba(255,255,255,0.7),0_0_28px_rgba(255,255,255,0.25)]"
          style={{
            width: "14px",
            height: "14px",
            top: `calc(${t * 100}% - 7px)`,
            transform: "translateX(-50%)",
            transition: draggingRef.current ? "none" : "top 0.08s linear",
          }}
        />
      </div>
    </div>
  );
}
