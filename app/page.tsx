"use client";

import { useRef, useEffect, useState, useCallback, useMemo } from "react";
import type * as THREE from "three";
import { toast } from "sonner";
import { RotateCcw, Maximize2, Minimize2, X, ChevronLeft, ChevronRight, Columns2, Upload } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import {
  GitHubIcon,
  V0Icon,
  VercelIcon,
  XIcon,
  ChatAppIcon,
  Vecto3dIcon,
  AsteriskIcon,
} from "@/components/ui/icons";
import {
  GITHUB_SVG,
  V0_SVG,
  VERCEL_SVG,
  X_SVG,
  CHAT_APP_SVG,
  VECTO3D_SVG,
} from "@/components/data/raw-svgs";
import { sanitizeSvgForPreview, isValidSvg } from "@/lib/svg-sanitizer";

import { useEditorStore } from "@/lib/store";
import {
  useMobileDetection,
  useFullscreenSupport,
} from "@/hooks/use-mobile-detection";
import { useTexturePreloader } from "@/hooks/use-texture-preloader";
import { memoryManager } from "@/lib/memory-manager";

import { ModelPreview } from "@/components/previews/model-preview";
import { EditManagers } from "@/components/edit/edit-managers";
import { MinimalControls } from "@/components/edit/minimal-controls";
import { MinimalExport } from "@/components/edit/minimal-export";
import { CodeExport } from "@/components/edit/code-export";
import { AsciiOverlay } from "@/components/edit/ascii-overlay";
import { LightingBar } from "@/components/edit/lighting-bar";

const isSafari = (): boolean => {
  if (typeof window === "undefined") return false;
  const ua = window.navigator.userAgent;
  return /Safari/.test(ua) && !/Chrome/.test(ua) && !/Edge/.test(ua);
};

const exampleIcons = [
  { name: "GitHub", component: GitHubIcon },
  { name: "v0", component: V0Icon },
  { name: "Vercel", component: VercelIcon },
  { name: "X/Twitter", component: XIcon },
  { name: "AI Chat", component: ChatAppIcon },
  { name: "Vecto3d", component: Vecto3dIcon },
];

const iconSvgMap: Record<string, string> = {
  GitHub: GITHUB_SVG,
  v0: V0_SVG,
  Vercel: VERCEL_SVG,
  "X/Twitter": X_SVG,
  "AI Chat": CHAT_APP_SVG,
  Vecto3d: VECTO3D_SVG,
};

function LoadingOverlay({ svgContent, bg }: { svgContent: string | null; bg: string }) {
  const [phase, setPhase] = useState(0);
  const phases = ["PARSING VECTORS", "EXTRUDING GEOMETRY", "APPLYING MATERIAL", "FINALISING"];
  useEffect(() => {
    const t = setInterval(() => setPhase((p) => (p + 1) % phases.length), 700);
    return () => clearInterval(t);
  }, []);

  const sanitized = svgContent
    ? svgContent
        .replace(/width="[^"]*"/, 'width="100%"')
        .replace(/height="[^"]*"/, 'height="100%"')
    : null;

  return (
    <div className="absolute inset-0 z-30 flex flex-col items-center justify-center overflow-hidden" style={{ background: bg }}>
      {/* Corner brackets */}
      {[["top-8 left-8", "borderTop", "borderLeft"], ["top-8 right-8", "borderTop", "borderRight"],
        ["bottom-8 left-8", "borderBottom", "borderLeft"], ["bottom-8 right-8", "borderBottom", "borderRight"]
      ].map(([pos], i) => (
        <div key={i} className={`absolute ${pos} h-10 w-10`} style={{
          borderTop: pos.includes("top") ? "1.5px solid rgba(255,255,255,0.18)" : undefined,
          borderBottom: pos.includes("bottom") ? "1.5px solid rgba(255,255,255,0.18)" : undefined,
          borderLeft: pos.includes("left") ? "1.5px solid rgba(255,255,255,0.18)" : undefined,
          borderRight: pos.includes("right") ? "1.5px solid rgba(255,255,255,0.18)" : undefined,
        }} />
      ))}

      {/* Scan line */}
      <motion.div
        className="pointer-events-none absolute left-0 right-0 h-px"
        style={{ background: "linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.12) 30%, rgba(255,255,255,0.22) 50%, rgba(255,255,255,0.12) 70%, transparent 100%)" }}
        animate={{ top: ["8%", "92%"] }}
        transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
      />

      {/* SVG preview */}
      <motion.div
        initial={{ opacity: 0, scale: 0.88 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
        className="relative mb-6 flex items-center justify-center sm:mb-10"
        style={{ width: "clamp(120px, 35vmin, 220px)", height: "clamp(120px, 35vmin, 220px)" }}>
        {sanitized ? (
          <>
            {/* Glow behind */}
            <div className="pointer-events-none absolute inset-0 rounded-full" style={{ background: "radial-gradient(circle at 50% 50%, rgba(255,255,255,0.06) 0%, transparent 70%)", filter: "blur(24px)" }} />
            <div dangerouslySetInnerHTML={{ __html: sanitized }} style={{ width: "100%", height: "100%" }} />
          </>
        ) : (
          <div className="h-24 w-24 animate-pulse rounded-full bg-white/10" />
        )}
      </motion.div>

      {/* Status text */}
      <div className="flex flex-col items-center gap-3 font-mono">
        <AnimatePresence mode="wait">
          <motion.p
            key={phase}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.25 }}
            className="text-[11px] tracking-[0.22em] text-white/35">
            {phases[phase]}
          </motion.p>
        </AnimatePresence>

        {/* Pulsing dots */}
        <div className="flex items-center gap-2">
          {[0, 1, 2].map((i) => (
            <motion.div
              key={i}
              className="h-1 w-1 rounded-full bg-white/30"
              animate={{ opacity: [0.15, 0.7, 0.15], scale: [0.8, 1.2, 0.8] }}
              transition={{ duration: 1.4, repeat: Infinity, delay: i * 0.22, ease: "easeInOut" }}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

export default function Home() {
  const [isClientMounted, setIsClientMounted] = useState(false);
  const [activeSection, setActiveSection] = useState<string | null>("geometry");
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [showSafariWarning, setShowSafariWarning] = useState(false);
  const [safariDismissed, setSafariDismissed] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [svgPreviewContent, setSvgPreviewContent] = useState<string | null>(null);
  const [selectedIcon, setSelectedIcon] = useState<string>("");

  const [isCompareMode, setIsCompareMode] = useState(false);
  const [dividerPos, setDividerPos] = useState(50);

  // Loading overlay state
  const [overlayVisible, setOverlayVisible] = useState(false);
  const [overlayExiting, setOverlayExiting] = useState(false);
  const prevSvgRef = useRef<string | null>(null);
  const overlayTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const changeInputRef = useRef<HTMLInputElement>(null);
  const dropZoneRef = useRef<HTMLDivElement>(null);
  const modelGroupRef = useRef<THREE.Group | null>(null);
  const modelRef = useRef<THREE.Group | null>(null);
  const previewContainerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const sliderContainerRef = useRef<HTMLDivElement>(null);
  const isDraggingSlider = useRef(false);

  const svgData = useEditorStore((state) => state.svgData);
  const fileName = useEditorStore((state) => state.fileName);
  const isModelLoading = useEditorStore((state) => state.isModelLoading);
  const svgProcessingError = useEditorStore((state) => state.svgProcessingError);
  const isFullscreen = useEditorStore((state) => state.isFullscreen);
  const setIsFullscreen = useEditorStore((state) => state.setIsFullscreen);
  const resetEditor = useEditorStore((state) => state.resetEditor);
  const backgroundColor = useEditorStore((state) => state.backgroundColor);
  const setSvgDataStore = useEditorStore((state) => state.setSvgData);
  const setFileNameStore = useEditorStore((state) => state.setFileName);

  const svgDataUrl = useMemo(
    () => svgData ? `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svgData)}` : null,
    [svgData],
  );

  const { isMobile } = useMobileDetection();
  const isFullscreenSupported = useFullscreenSupport();

  useTexturePreloader(true);

  const loadSvg = useCallback(
    (data: string, name: string) => {
      setSvgDataStore(data);
      setFileNameStore(name);
    },
    [setSvgDataStore, setFileNameStore],
  );

  const processSvgContent = useCallback(
    (data: string, name: string = "pasted.svg") => {
      if (!isValidSvg(data)) { toast.error("INVALID SVG CONTENT"); return; }
      const sanitized = sanitizeSvgForPreview(data);
      if (!sanitized) { toast.error("SVG PROCESSING FAILED"); return; }
      setSvgPreviewContent(sanitized);
      setSelectedIcon("");
      loadSvg(data, name);
      toast.success("SVG PASTED");
    },
    [loadSvg],
  );

  const processFile = useCallback(
    (file: File) => {
      if (file && file.type === "image/svg+xml") {
        const reader = new FileReader();
        reader.onload = (event) => {
          if (event.target?.result) {
            const data = event.target.result as string;
            if (!isValidSvg(data)) { toast.error("INVALID SVG FILE"); return; }
            const sanitized = sanitizeSvgForPreview(data);
            if (!sanitized) { toast.error("SVG PROCESSING FAILED"); return; }
            setSvgPreviewContent(sanitized);
            setSelectedIcon("");
            loadSvg(data, file.name);
          }
        };
        reader.readAsText(file);
      } else if (file) {
        toast.error("PLEASE UPLOAD AN SVG FILE");
      }
    },
    [loadSvg],
  );

  const handleIconSelect = useCallback(
    (iconName: string) => {
      setSelectedIcon(iconName);
      const content = iconSvgMap[iconName];
      if (content) {
        const sanitized = sanitizeSvgForPreview(content);
        if (!sanitized) { toast.error("ICON PROCESSING FAILED"); return; }
        setSvgPreviewContent(sanitized);
        const name = `${iconName.toLowerCase().replace(/\W+/g, "-")}.svg`;
        loadSvg(content, name);
      }
    },
    [loadSvg],
  );

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isDraggingSlider.current || !sliderContainerRef.current) return;
      const rect = sliderContainerRef.current.getBoundingClientRect();
      const pos = ((e.clientX - rect.left) / rect.width) * 100;
      setDividerPos(Math.min(95, Math.max(5, pos)));
    };
    const handleTouchMove = (e: TouchEvent) => {
      if (!isDraggingSlider.current || !sliderContainerRef.current) return;
      const rect = sliderContainerRef.current.getBoundingClientRect();
      const pos = ((e.touches[0].clientX - rect.left) / rect.width) * 100;
      setDividerPos(Math.min(95, Math.max(5, pos)));
    };
    const stopDrag = () => { isDraggingSlider.current = false; };
    document.addEventListener("mousemove", handleMouseMove);
    document.addEventListener("mouseup", stopDrag);
    document.addEventListener("touchmove", handleTouchMove, { passive: false });
    document.addEventListener("touchend", stopDrag);
    return () => {
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", stopDrag);
      document.removeEventListener("touchmove", handleTouchMove);
      document.removeEventListener("touchend", stopDrag);
    };
  }, []);

  useEffect(() => {
    if (svgData) return;
    const handlePaste = (e: ClipboardEvent) => {
      const clipboardData = e.clipboardData;
      if (!clipboardData) return;
      const textData = clipboardData.getData("text/plain");
      const htmlData = clipboardData.getData("text/html");
      if (textData && textData.trim().startsWith("<svg") && textData.trim().endsWith("</svg>")) {
        e.preventDefault(); processSvgContent(textData); return;
      }
      if (htmlData && htmlData.includes("<svg")) {
        const svgMatch = htmlData.match(/<svg[^>]*>[\s\S]*?<\/svg>/i);
        if (svgMatch) { e.preventDefault(); processSvgContent(svgMatch[0]); return; }
      }
      const files = Array.from(clipboardData.files);
      const svgFile = files.find((f) => f.type === "image/svg+xml");
      if (svgFile) { e.preventDefault(); processFile(svgFile); return; }
      if (textData || htmlData || files.length > 0) { e.preventDefault(); toast.error("PLEASE PASTE VALID SVG"); }
    };
    document.addEventListener("paste", handlePaste);
    return () => document.removeEventListener("paste", handlePaste);
  }, [svgData, processFile, processSvgContent]);

  useEffect(() => {
    setIsClientMounted(true);
    setShowSafariWarning(isSafari());

    const modelGroup = modelGroupRef.current;
    const model = modelRef.current;
    if (modelGroup) memoryManager.track(modelGroup);
    if (model) memoryManager.track(model);

    return () => {
      if (modelGroup) memoryManager.untrack(modelGroup);
      if (model) memoryManager.untrack(model);
    };
  }, []);

  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(document.fullscreenElement !== null);
    };
    document.addEventListener("fullscreenchange", handleFullscreenChange);
    return () => document.removeEventListener("fullscreenchange", handleFullscreenChange);
  }, [setIsFullscreen]);

  // Show loading overlay whenever a new SVG arrives
  useEffect(() => {
    if (svgData && svgData !== prevSvgRef.current) {
      prevSvgRef.current = svgData;
      if (overlayTimerRef.current) clearTimeout(overlayTimerRef.current);
      setOverlayExiting(false);
      setOverlayVisible(true);
      // Show SVG preview for 2.6s minimum, then fade out
      overlayTimerRef.current = setTimeout(() => {
        setOverlayExiting(true);
        setTimeout(() => setOverlayVisible(false), 650);
      }, 2600);
    }
    if (!svgData) {
      if (overlayTimerRef.current) clearTimeout(overlayTimerRef.current);
      setOverlayVisible(false);
      setOverlayExiting(false);
      prevSvgRef.current = null;
    }
    return () => {
      if (overlayTimerRef.current) clearTimeout(overlayTimerRef.current);
    };
  }, [svgData]);

  const handleReset = () => {
    resetEditor();
    setSvgPreviewContent(null);
    setSelectedIcon("");
    setIsCompareMode(false);
    setDividerPos(50);
    toast.success("RESET COMPLETE");
  };

  const handleFullscreen = () => {
    if (isFullscreen) {
      document.exitFullscreen();
    } else if (previewContainerRef.current) {
      previewContainerRef.current.requestFullscreen();
    }
  };

  if (!isClientMounted) return null;

  if (showSafariWarning && !safariDismissed) {
    return (
      <main className="flex h-screen w-full flex-col items-center justify-center bg-black px-6 font-mono text-[14px] tracking-wide text-white uppercase">
        <div className="max-w-sm text-center">
          <div className="mb-6 text-2xl">⚠</div>
          <h1 className="mb-4 text-lg">SAFARI NOT SUPPORTED</h1>
          <p className="mb-8 leading-relaxed text-neutral-500 normal-case">
            Safari has limited WebGL support which causes performance issues with 3D rendering.
          </p>
          <p className="mb-8 text-neutral-400">
            For the best experience, use <span className="text-white">Chrome</span> or{" "}
            <span className="text-white">Firefox</span>
          </p>
          <button
            onClick={() => setSafariDismissed(true)}
            className="w-full border border-neutral-700 px-6 py-3 text-neutral-400 transition-colors hover:border-neutral-500 hover:text-neutral-300">
            CONTINUE ANYWAY
          </button>
        </div>
      </main>
    );
  }

  const showUploadUI = !svgData;

  return (
    <main className="flex h-[100dvh] w-full flex-col font-mono text-[14px] tracking-wide text-white uppercase md:flex-row" style={{ background: "#0d0d0f" }}>
      <EditManagers />

      {/* File input for CHANGE button — off-screen, not display:none */}
      <input
        type="file"
        ref={changeInputRef}
        accept=".svg"
        style={{ position: "fixed", top: "-9999px", left: "-9999px", opacity: 0, width: 0, height: 0 }}
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) { processFile(file); e.target.value = ""; }
        }}
      />

      {/* PREVIEW PANEL */}
      <div className="flex flex-1 flex-col">
        {/* Header */}
        <div
          className="flex h-11 shrink-0 items-center justify-between px-5"
          style={{ borderBottom: "1px solid rgba(255,255,255,0.07)", background: "rgba(13,13,16,0.98)" }}>
          <div className="flex items-center gap-2">
            <div className="flex h-6 w-6 items-center justify-center rounded-sm" style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)" }}>
              <svg width="13" height="13" viewBox="0 0 14 14" fill="none">
                <polygon points="7,1.5 12,4.25 7,7 2,4.25" fill="rgba(255,255,255,0.92)"/>
                <polygon points="7,7 12,4.25 12,9.75 7,12.5" fill="rgba(255,255,255,0.4)"/>
                <polygon points="7,7 2,4.25 2,9.75 7,12.5" fill="rgba(255,255,255,0.16)"/>
              </svg>
            </div>
            <span className="font-sans text-[14px] tracking-tight">
              <span style={{ color: "rgba(255,255,255,0.52)", fontWeight: 500 }}>Make</span><span style={{ color: "rgba(255,255,255,0.96)", fontWeight: 700 }}>3D</span>
            </span>
          </div>
          <div className="flex items-center gap-2">
            {!showUploadUI && (
              <>
                <button
                  onClick={() => changeInputRef.current?.click()}
                  className="flex items-center gap-1.5 px-2 py-1.5 text-[12px] font-medium tracking-[0.08em] text-white/55 transition-all duration-200 hover:bg-white/[0.07] hover:text-white/90 sm:gap-2 sm:px-3"
                  style={{ border: "1px solid rgba(255,255,255,0.12)", borderRadius: "3px" }}
                  title="Change SVG">
                  <Upload className="h-3 w-3" />
                  <span className="hidden sm:inline">CHANGE</span>
                </button>
                <button
                  onClick={() => { setIsCompareMode((v) => !v); setDividerPos(50); }}
                  className="flex items-center gap-1.5 px-2 py-1.5 text-[12px] font-medium tracking-[0.08em] transition-all duration-200 sm:gap-2 sm:px-3"
                  style={{
                    border: isCompareMode ? "1px solid rgba(255,255,255,0.8)" : "1px solid rgba(255,255,255,0.12)",
                    borderRadius: "3px",
                    background: isCompareMode ? "rgba(255,255,255,0.92)" : "transparent",
                    color: isCompareMode ? "#000" : "rgba(255,255,255,0.5)",
                    boxShadow: isCompareMode ? "0 0 16px rgba(255,255,255,0.2)" : "none",
                  }}
                  title="Compare before/after">
                  <Columns2 className="h-3 w-3" />
                  <span className="hidden sm:inline">COMPARE</span>
                </button>
              </>
            )}
            <div style={{ width: "1px", height: "16px", background: "rgba(255,255,255,0.08)", margin: "0 4px" }} />
            <button
              onClick={handleReset}
              className="flex h-7 w-7 items-center justify-center rounded text-white/35 transition-all duration-200 hover:bg-white/[0.07] hover:text-white/70"
              title="Reset">
              <RotateCcw className="h-3.5 w-3.5" />
            </button>
            {isFullscreenSupported && !showUploadUI && (
              <button
                onClick={handleFullscreen}
                className="flex h-7 w-7 items-center justify-center rounded text-white/35 transition-all duration-200 hover:bg-white/[0.07] hover:text-white/70"
                title="Fullscreen">
                {isFullscreen ? <Minimize2 className="h-3.5 w-3.5" /> : <Maximize2 className="h-3.5 w-3.5" />}
              </button>
            )}
            <button
              onClick={() => setMobileMenuOpen(true)}
              className="ml-1 flex items-center gap-2 px-3 py-1.5 text-[11px] font-medium tracking-[0.1em] text-white/50 transition-all hover:text-white/80 md:hidden"
              style={{ border: "1px solid rgba(255,255,255,0.12)", borderRadius: "3px" }}>
              EDIT
            </button>
          </div>
        </div>

        {/* Canvas */}
        <div ref={previewContainerRef} className="relative flex-1" style={{ background: "#0d0d0f" }}>
          {showUploadUI ? (
            <div className="flex h-full w-full items-center justify-center p-6">
              <div className="w-full max-w-md">
                {/* Brand hero */}
                <div className="mb-8 text-center">
                  <div className="mb-4 flex items-center justify-center">
                    <div className="flex h-9 w-9 items-center justify-center rounded-lg" style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)", boxShadow: "0 0 24px rgba(255,255,255,0.06)" }}>
                      <svg width="18" height="18" viewBox="0 0 14 14" fill="none">
                        <polygon points="7,1.5 12,4.25 7,7 2,4.25" fill="rgba(255,255,255,0.92)"/>
                        <polygon points="7,7 12,4.25 12,9.75 7,12.5" fill="rgba(255,255,255,0.4)"/>
                        <polygon points="7,7 2,4.25 2,9.75 7,12.5" fill="rgba(255,255,255,0.16)"/>
                      </svg>
                    </div>
                  </div>
                  <h1 className="mb-2 font-sans leading-none tracking-tight">
                    <span className="text-[28px]" style={{ color: "rgba(255,255,255,0.45)", fontWeight: 400 }}>Make</span><span className="text-[28px]" style={{ color: "rgba(255,255,255,0.96)", fontWeight: 800 }}>3D</span>
                  </h1>
                  <p className="text-[11px] tracking-[0.14em]" style={{ color: "rgba(255,255,255,0.25)" }}>SVG TO 3D · INSTANT EXPORT</p>
                </div>
                <input
                  type="file"
                  ref={fileInputRef}
                  accept=".svg"
                  className="hidden"
                  onChange={(e) => { const file = e.target.files?.[0]; if (file) processFile(file); }}
                />
                <div
                  ref={dropZoneRef}
                  onClick={() => fileInputRef.current?.click()}
                  onDragEnter={(e) => { e.preventDefault(); setIsDragging(true); }}
                  onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
                  onDragLeave={(e) => {
                    e.preventDefault();
                    const rect = e.currentTarget.getBoundingClientRect();
                    if (e.clientX <= rect.left || e.clientX >= rect.right || e.clientY <= rect.top || e.clientY >= rect.bottom) setIsDragging(false);
                  }}
                  onDrop={(e) => { e.preventDefault(); setIsDragging(false); const files = e.dataTransfer.files; if (files.length > 0) processFile(files[0]); }}
                  className={`cursor-pointer border border-dashed p-6 text-center transition-colors sm:p-10 ${isDragging ? "border-neutral-600 bg-neutral-950" : "border-neutral-800 hover:border-neutral-700"}`}>
                  <div className="flex flex-col items-center">
                    {svgPreviewContent ? (
                      <div
                        className="mb-5 flex h-16 w-16 items-center justify-center border border-neutral-800 p-3"
                        dangerouslySetInnerHTML={{
                          __html: svgPreviewContent
                            .replace(/width="[^"]*"/, 'width="100%"')
                            .replace(/height="[^"]*"/, 'height="100%"')
                            .replace(/fill="[^"]*"/g, 'fill="currentColor"')
                            .replace(/stroke="[^"]*"/g, 'stroke="currentColor"'),
                        }}
                      />
                    ) : (
                      <div className="mb-5 flex h-16 w-16 items-center justify-center border border-neutral-800 text-neutral-700">
                        <AsteriskIcon size={28} />
                      </div>
                    )}
                    <p className="mb-1 text-neutral-400">DROP SVG OR CLICK TO UPLOAD</p>
                    <p className="text-[12px] text-neutral-700">YOU CAN ALSO PASTE</p>
                  </div>
                </div>

              </div>
            </div>
          ) : svgProcessingError ? (
            <div className="flex h-full w-full items-center justify-center">
              <div className="text-center">
                <p className="text-red-500">ERROR</p>
                <p className="mt-2 text-[12px] text-neutral-500">{svgProcessingError}</p>
              </div>
            </div>
          ) : (
            <div ref={sliderContainerRef} className="relative h-full w-full">
              <ModelPreview
                svgData={svgData!}
                modelGroupRef={modelGroupRef}
                modelRef={modelRef}
                isMobile={isMobile}
                canvasRef={canvasRef}
              />

              {/* ASCII effect overlay - real-time canvas samples WebGL canvas */}
              <AsciiOverlay sourceCanvasRef={canvasRef} />

              {/* 360° lighting bar on right edge */}
              {!isCompareMode && <LightingBar />}

              {isCompareMode && svgDataUrl && (
                <>
                  {/* Before: flat SVG clipped to left of divider */}
                  <div
                    className="pointer-events-none absolute inset-0 z-10 flex items-center justify-center p-10"
                    style={{ clipPath: `inset(0 ${100 - dividerPos}% 0 0)`, background: backgroundColor }}>
                    <img
                      src={svgDataUrl}
                      alt="Original SVG"
                      className="max-h-full max-w-full object-contain"
                      draggable={false}
                    />
                    <span className="absolute left-4 top-4 border border-white/20 bg-black/60 px-2 py-0.5 text-[10px] text-white/50 backdrop-blur-sm">
                      BEFORE
                    </span>
                  </div>

                  {/* After label */}
                  <span className="pointer-events-none absolute right-4 top-4 z-10 border border-white/20 bg-black/60 px-2 py-0.5 text-[10px] text-white/50 backdrop-blur-sm">
                    AFTER
                  </span>

                  {/* Divider */}
                  <div
                    className="absolute inset-y-0 z-20 flex cursor-col-resize select-none flex-col items-center"
                    style={{ left: `${dividerPos}%`, transform: "translateX(-50%)" }}
                    onMouseDown={(e) => { e.preventDefault(); isDraggingSlider.current = true; }}
                    onTouchStart={(e) => { e.preventDefault(); isDraggingSlider.current = true; }}>
                    {/* Line */}
                    <div className="h-full w-px bg-white/70" />
                    {/* Handle */}
                    <div className="absolute top-1/2 -translate-y-1/2 flex h-9 w-9 items-center justify-center rounded-full bg-white shadow-[0_0_20px_rgba(255,255,255,0.3)]">
                      <ChevronLeft className="h-3.5 w-3.5 text-black" />
                      <ChevronRight className="h-3.5 w-3.5 text-black" />
                    </div>
                  </div>
                </>
              )}

              {/* Premium loading overlay — shown on new SVG upload, fades out when ready */}
              <AnimatePresence>
                {overlayVisible && (
                  <motion.div
                    className="absolute inset-0"
                    initial={{ opacity: 1 }}
                    animate={{ opacity: overlayExiting ? 0 : 1 }}
                    transition={{ duration: 0.65, ease: "easeInOut" }}>
                    <LoadingOverlay svgContent={svgPreviewContent} bg={backgroundColor} />
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          )}
        </div>
      </div>

      {/* GLASS CONTROLS PANEL — desktop flex sibling */}
      <div
        className="hidden w-[272px] flex-col md:flex"
        style={{
          background: "linear-gradient(160deg, rgba(20,20,26,0.99) 0%, rgba(16,16,22,0.99) 60%, rgba(13,13,18,1) 100%)",
          borderLeft: "1px solid rgba(255,255,255,0.08)",
          boxShadow: "-8px 0 32px rgba(0,0,0,0.5), inset 1px 0 0 rgba(255,255,255,0.04)",
        }}>
        {/* Top shimmer line */}
        <div style={{ height: "1px", flexShrink: 0, background: "linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.14) 30%, rgba(255,255,255,0.07) 70%, transparent 100%)" }} />
        {/* Panel header */}
        <div
          className="flex h-10 shrink-0 items-center justify-between px-4"
          style={{ borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
          <div className="flex items-center gap-2">
            <div className="flex h-5 w-5 items-center justify-center rounded-sm" style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)" }}>
              <svg width="11" height="11" viewBox="0 0 14 14" fill="none">
                <polygon points="7,1.5 12,4.25 7,7 2,4.25" fill="rgba(255,255,255,0.92)"/>
                <polygon points="7,7 12,4.25 12,9.75 7,12.5" fill="rgba(255,255,255,0.4)"/>
                <polygon points="7,7 2,4.25 2,9.75 7,12.5" fill="rgba(255,255,255,0.16)"/>
              </svg>
            </div>
            <span className="font-sans text-[13px] tracking-tight">
              <span style={{ color: "rgba(255,255,255,0.52)", fontWeight: 500 }}>Make</span><span style={{ color: "rgba(255,255,255,0.96)", fontWeight: 700 }}>3D</span>
            </span>
          </div>
          <span className="max-w-[110px] truncate text-[11px] tracking-wide" style={{ color: "rgba(255,255,255,0.28)" }}>
            {fileName || "-"}
          </span>
        </div>
        <div className="flex-1 overflow-y-auto" style={{ scrollbarWidth: "none" }}>
          <MinimalControls activeSection={activeSection} onSectionChange={setActiveSection} />
        </div>
        <div style={{ borderTop: "1px solid rgba(255,255,255,0.05)" }}>
          <MinimalExport fileName={fileName} modelGroupRef={modelGroupRef} canvasRef={canvasRef} activeSection={activeSection} onSectionChange={setActiveSection} />
          <CodeExport activeSection={activeSection} onSectionChange={setActiveSection} />
        </div>
      </div>

      {/* CONTROLS PANEL - Mobile Overlay */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <>
            <motion.div
              className="fixed inset-0 z-40 touch-none md:hidden"
              style={{ background: "rgba(0,0,0,0.7)", backdropFilter: "blur(8px)" }}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setMobileMenuOpen(false)}
            />
            <motion.div
              className="fixed inset-x-0 bottom-0 z-50 flex max-h-[85dvh] flex-col overscroll-contain md:hidden"
              style={{
                background: "linear-gradient(180deg, rgba(14,14,18,0.98) 0%, rgba(9,9,13,0.99) 100%)",
                borderTop: "1px solid rgba(255,255,255,0.08)",
                boxShadow: "0 -20px 60px rgba(0,0,0,0.8)",
                paddingBottom: "env(safe-area-inset-bottom, 0px)",
              }}
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}>
              <div
                className="flex h-12 shrink-0 items-center justify-between px-4"
                style={{ borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
                <div className="flex items-center gap-2">
                  <div className="flex h-5 w-5 items-center justify-center rounded-sm" style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)" }}>
                    <svg width="11" height="11" viewBox="0 0 14 14" fill="none">
                      <polygon points="7,1.5 12,4.25 7,7 2,4.25" fill="rgba(255,255,255,0.92)"/>
                      <polygon points="7,7 12,4.25 12,9.75 7,12.5" fill="rgba(255,255,255,0.4)"/>
                      <polygon points="7,7 2,4.25 2,9.75 7,12.5" fill="rgba(255,255,255,0.16)"/>
                    </svg>
                  </div>
                  <span className="font-sans text-[13px] tracking-tight">
                    <span style={{ color: "rgba(255,255,255,0.52)", fontWeight: 500 }}>Make</span><span style={{ color: "rgba(255,255,255,0.96)", fontWeight: 700 }}>3D</span>
                  </span>
                </div>
                <button
                  onClick={() => setMobileMenuOpen(false)}
                  className="text-white/25 transition-colors hover:text-white/60">
                  <X className="h-4 w-4" />
                </button>
              </div>
              <div className="flex-1 overflow-y-auto" style={{ scrollbarWidth: "none" }}>
                <MinimalControls activeSection={activeSection} onSectionChange={setActiveSection} />
              </div>
              <div className="shrink-0" style={{ borderTop: "1px solid rgba(255,255,255,0.05)" }}>
                <MinimalExport fileName={fileName} modelGroupRef={modelGroupRef} canvasRef={canvasRef} activeSection={activeSection} onSectionChange={setActiveSection} />
                <CodeExport activeSection={activeSection} onSectionChange={setActiveSection} />
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </main>
  );
}
