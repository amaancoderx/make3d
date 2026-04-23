"use client";

import { useState } from "react";
import { ChevronDown, Download, RotateCcw } from "lucide-react";
import * as THREE from "three";
import { useEditorStore } from "@/lib/store";
import { handleExport, handleExportWithTextures } from "@/lib/exporters";
import { recordWithStoreProgress } from "@/lib/video-recorder";
import { toast } from "sonner";
import { VideoResultModal } from "@/components/modals/video-result-modal";

interface MinimalExportProps {
  fileName: string;
  modelGroupRef: React.RefObject<THREE.Group | null>;
  canvasRef?: React.RefObject<HTMLCanvasElement | null>;
  activeSection: string | null;
  onSectionChange: (section: string | null) => void;
}

function AnimatedSection({ isOpen, children }: { isOpen: boolean; children: React.ReactNode }) {
  return (
    <div className={`grid transition-all duration-300 ease-out ${isOpen ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"}`}>
      <div className="overflow-hidden">{children}</div>
    </div>
  );
}

function GlassButton({
  onClick, disabled = false, children, className = "",
}: {
  onClick: () => void; disabled?: boolean; children: React.ReactNode; className?: string;
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`rounded-sm border border-white/[0.1] bg-white/[0.04] py-2 text-[12px] font-medium tracking-[0.06em] text-white/55 transition-all duration-200 hover:border-white/[0.25] hover:bg-white/[0.1] hover:text-white/90 disabled:cursor-not-allowed disabled:opacity-25 ${className}`}>
      {children}
    </button>
  );
}

export function MinimalExport({ fileName, modelGroupRef, canvasRef, activeSection, onSectionChange }: MinimalExportProps) {
  const [videoDuration, setVideoDuration] = useState(10);
  const isAutoRotateOpen = activeSection === "autorotate";
  const isExportOpen = activeSection === "export";

  const {
    textureEnabled, texturePreset, textureScale,
    autoRotate, setAutoRotate, autoRotateSpeed, setAutoRotateSpeed,
    setCompletedVideo, setVideoModalOpen,
    isRecording, recordingProgress, recordingElapsedTime, recordingStatus,
  } = useEditorStore();

  const handlePngExport = () => handleExport("png", modelGroupRef, fileName, 3);

  const handleVideoExport = async (format: "mp4" | "gif") => {
    if (!canvasRef?.current) return;
    if (!autoRotate) { toast.error("ENABLE AUTO-ROTATE FIRST"); return; }
    await recordWithStoreProgress({
      canvas: canvasRef.current,
      format,
      duration: format === "gif" ? Math.min(videoDuration, 10) : videoDuration,
      bitrate: 8000000,
      onComplete: (blob) => { setCompletedVideo(blob, format, fileName); setVideoModalOpen(true); },
      onError: (error) => { console.error("Recording failed:", error); toast.error("RECORDING FAILED"); },
    });
  };

  const handle3DExport = (format: "stl" | "glb" | "gltf") => {
    if (format === "stl") {
      handleExport("stl", modelGroupRef, fileName);
    } else {
      handleExportWithTextures(format, modelGroupRef, fileName, 1, { textureEnabled, texturePreset, textureScale });
    }
  };

  return (
    <>
      {/* Auto Rotate */}
      <button
        onClick={() => onSectionChange(isAutoRotateOpen ? null : "autorotate")}
        className="flex w-full items-center justify-between px-4 py-3 font-mono uppercase transition-all duration-200 hover:bg-white/[0.03]"
        style={{ borderBottom: "1px solid rgba(255,255,255,0.07)" }}>
        <div className="flex items-center gap-2">
          <RotateCcw className="h-4 w-4 text-white/30" />
          <span className={`text-[13px] font-medium tracking-[0.08em] transition-colors ${isAutoRotateOpen ? "text-white" : "text-white/55"}`}>
            AUTO ROTATE
          </span>
          {autoRotate && (
            <span className="rounded-sm px-1.5 py-0.5 text-[10px] tracking-[0.08em]"
              style={{ background: "rgba(255,255,255,0.12)", color: "rgba(255,255,255,0.7)" }}>
              ON
            </span>
          )}
        </div>
        <ChevronDown className={`h-4 w-4 transition-all duration-300 ${isAutoRotateOpen ? "rotate-180 text-white/60" : "text-white/30"}`} />
      </button>

      <AnimatedSection isOpen={isAutoRotateOpen}>
        <div className="px-4 pb-3 pt-2 font-mono uppercase" style={{ borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
          <div className="flex items-center justify-between py-1.5">
            <span className="text-[12px] tracking-[0.06em] text-white/50">ENABLED</span>
            <button
              onClick={() => setAutoRotate(!autoRotate)}
              className={`relative h-5 w-9 rounded-full transition-all duration-300 ${
                autoRotate
                  ? "bg-white shadow-[0_0_14px_rgba(255,255,255,0.45),0_0_4px_rgba(255,255,255,0.7)]"
                  : "bg-white/[0.1] ring-1 ring-white/[0.15]"
              }`}>
              <div className={`absolute top-[3px] h-[14px] w-[14px] rounded-full shadow-sm transition-all duration-300 ${
                autoRotate ? "left-[19px] bg-black" : "left-[3px] bg-white/40"
              }`} />
            </button>
          </div>
          <AnimatedSection isOpen={autoRotate}>
            <div className="mt-1 flex items-center justify-between py-1.5">
              <span className="text-[12px] tracking-[0.06em] text-white/50">SPEED</span>
              <div className="flex items-center gap-3">
                <input
                  type="range" min={0.5} max={10} step={0.5} value={autoRotateSpeed}
                  onChange={(e) => setAutoRotateSpeed(parseFloat(e.target.value))}
                  className="h-[3px] w-28 cursor-pointer appearance-none rounded-full bg-white/[0.12]
                    [&::-webkit-slider-thumb]:h-[14px]
                    [&::-webkit-slider-thumb]:w-[14px]
                    [&::-webkit-slider-thumb]:appearance-none
                    [&::-webkit-slider-thumb]:rounded-full
                    [&::-webkit-slider-thumb]:bg-white
                    [&::-webkit-slider-thumb]:shadow-[0_0_8px_rgba(255,255,255,0.6),0_0_16px_rgba(255,255,255,0.2)]
                    [&::-moz-range-thumb]:h-[14px]
                    [&::-moz-range-thumb]:w-[14px]
                    [&::-moz-range-thumb]:rounded-full
                    [&::-moz-range-thumb]:border-0
                    [&::-moz-range-thumb]:bg-white"
                />
                <span className="w-10 text-right text-[12px] tabular-nums text-white/65">{autoRotateSpeed.toFixed(1)}</span>
              </div>
            </div>
          </AnimatedSection>
        </div>
      </AnimatedSection>

      {/* Export Toggle */}
      <button
        onClick={() => onSectionChange(isExportOpen ? null : "export")}
        className="flex w-full items-center justify-between px-4 py-3 font-mono uppercase transition-all duration-200 hover:bg-white/[0.03]">
        <div className="flex items-center gap-2">
          <Download className="h-4 w-4 text-white/30" />
          <span className={`text-[13px] font-medium tracking-[0.08em] transition-colors ${isExportOpen ? "text-white" : "text-white/55"}`}>
            EXPORT
          </span>
        </div>
        <ChevronDown className={`h-4 w-4 transition-all duration-300 ${isExportOpen ? "rotate-180 text-white/60" : "text-white/30"}`} />
      </button>

      <AnimatedSection isOpen={isExportOpen}>
        <div className="px-4 pb-4 pt-2 font-mono uppercase" style={{ borderTop: "1px solid rgba(255,255,255,0.06)" }}>

          {/* IMAGE */}
          <div className="mb-4">
            <span className="mb-2 block text-[11px] tracking-[0.12em] text-white/35">IMAGE</span>
            <GlassButton onClick={handlePngExport} className="w-full">PNG - Transparent Background</GlassButton>
          </div>

          {/* 3D */}
          <div className="mb-4">
            <span className="mb-2 block text-[11px] tracking-[0.12em] text-white/35">3D MODEL</span>
            <div className="grid grid-cols-3 gap-1.5">
              <GlassButton onClick={() => handle3DExport("stl")}>STL</GlassButton>
              <GlassButton onClick={() => handle3DExport("glb")}>GLB</GlassButton>
              <GlassButton onClick={() => handle3DExport("gltf")}>GLTF</GlassButton>
            </div>
          </div>

          {/* VIDEO */}
          <div>
            <div className="mb-2 flex items-center gap-2">
              <span className="text-[11px] tracking-[0.12em] text-white/35">VIDEO</span>
              {isRecording && (
                <>
                  <div className="h-1.5 w-1.5 animate-pulse rounded-full bg-red-400/80" />
                  <span className="text-[10px] text-red-400/80">
                    {recordingStatus === "processing" ? "PROCESSING" : `${recordingElapsedTime.toFixed(1)}S`}
                  </span>
                  <div className="h-[2px] flex-1 overflow-hidden rounded-full bg-white/[0.08]">
                    <div className="h-full rounded-full bg-red-400/60 transition-all duration-100" style={{ width: `${recordingProgress}%` }} />
                  </div>
                </>
              )}
            </div>

            <div className="mb-3">
              <div className="mb-2 flex items-center justify-between">
                <span className="text-[12px] tracking-[0.06em] text-white/50">DURATION</span>
                <span className="text-[12px] tabular-nums text-white/65">{videoDuration}s</span>
              </div>
              <input
                type="range" min={3} max={60} step={1} value={videoDuration}
                onChange={(e) => setVideoDuration(parseInt(e.target.value))}
                className="h-[3px] w-full cursor-pointer appearance-none rounded-full bg-white/[0.12]
                  [&::-webkit-slider-thumb]:h-[14px]
                  [&::-webkit-slider-thumb]:w-[14px]
                  [&::-webkit-slider-thumb]:appearance-none
                  [&::-webkit-slider-thumb]:rounded-full
                  [&::-webkit-slider-thumb]:bg-white
                  [&::-webkit-slider-thumb]:shadow-[0_0_8px_rgba(255,255,255,0.6),0_0_16px_rgba(255,255,255,0.2)]
                  [&::-moz-range-thumb]:h-[14px]
                  [&::-moz-range-thumb]:w-[14px]
                  [&::-moz-range-thumb]:rounded-full
                  [&::-moz-range-thumb]:border-0
                  [&::-moz-range-thumb]:bg-white"
              />
            </div>

            <div className="grid grid-cols-2 gap-1.5">
              <GlassButton onClick={() => handleVideoExport("mp4")} disabled={!autoRotate || isRecording}>MP4</GlassButton>
              <GlassButton onClick={() => handleVideoExport("gif")} disabled={!autoRotate || isRecording}>GIF</GlassButton>
            </div>

            {!autoRotate && (
              <p className="mt-2.5 text-[11px] tracking-[0.06em] text-white/30">
                Enable auto-rotate to record video
              </p>
            )}
          </div>
        </div>
      </AnimatedSection>

      <VideoResultModal />
    </>
  );
}
