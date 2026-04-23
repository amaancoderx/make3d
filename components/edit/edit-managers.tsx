"use client";

import { memo, useEffect } from "react";
import { toast } from "sonner";
import { useDebounce } from "@/hooks/use-debounce";
import { useEditorStore } from "@/lib/store";

const SvgProcessingLogic = memo(() => {
  const svgData = useEditorStore((state) => state.svgData);
  const setIsModelLoading = useEditorStore((state) => state.setIsModelLoading);
  const setIsHollowSvg = useEditorStore((state) => state.setIsHollowSvg);

  const debouncedSvgData = useDebounce(svgData, 300);

  useEffect(() => {
    if (debouncedSvgData) {
      setIsModelLoading(true);
      setIsModelLoading(false);
    }
  }, [debouncedSvgData, setIsModelLoading]);

  useEffect(() => {
    if (!debouncedSvgData) return;

    const hasClosedPath =
      debouncedSvgData.includes("Z") || debouncedSvgData.includes("z");
    const hasMultiplePaths =
      (debouncedSvgData.match(/<path/g) || []).length > 1;
    const hasCircles = debouncedSvgData.includes("<circle");
    const hasEllipse = debouncedSvgData.includes("<ellipse");
    const hasRect = debouncedSvgData.includes("<rect");

    const isLikelyHollow =
      (hasClosedPath &&
        (hasMultiplePaths || hasCircles || hasEllipse || hasRect)) ||
      debouncedSvgData.toLowerCase().includes("smile") ||
      debouncedSvgData.toLowerCase().includes("face");

    setIsHollowSvg(isLikelyHollow);
  }, [debouncedSvgData, setIsHollowSvg]);

  return null;
});

SvgProcessingLogic.displayName = "SvgProcessingLogic";

const BackgroundThemeManager = memo(() => {
  const userSelectedBackground = useEditorStore(
    (state) => state.userSelectedBackground,
  );
  const setBackgroundColor = useEditorStore(
    (state) => state.setBackgroundColor,
  );
  const setSolidColorPreset = useEditorStore(
    (state) => state.setSolidColorPreset,
  );

  useEffect(() => {
    if (!userSelectedBackground) {
      setBackgroundColor("#111114");
      setSolidColorPreset("dark");
    }
  }, [userSelectedBackground, setBackgroundColor, setSolidColorPreset]);

  return null;
});

BackgroundThemeManager.displayName = "BackgroundThemeManager";

const HdriCleanupManager = memo(() => {
  const customHdriUrl = useEditorStore((state) => state.customHdriUrl);

  useEffect(() => {
    const urlToRevoke = customHdriUrl;
    return () => {
      if (urlToRevoke && urlToRevoke.startsWith("blob:")) {
        URL.revokeObjectURL(urlToRevoke);
      }
    };
  }, [customHdriUrl]);

  return null;
});

HdriCleanupManager.displayName = "HdriCleanupManager";

const VibeModeManager = memo(() => {
  const environmentPreset = useEditorStore((state) => state.environmentPreset);
  const customHdriUrl = useEditorStore((state) => state.customHdriUrl);
  const useBloom = useEditorStore((state) => state.useBloom);
  const toggleVibeMode = useEditorStore((state) => state.toggleVibeMode);

  useEffect(() => {
    if (environmentPreset === "custom" && customHdriUrl && useBloom) {
      toggleVibeMode(false);
      toast.info(
        "Vibe Mode has been disabled because you selected a custom image",
        { duration: 3000 },
      );
    }
  }, [environmentPreset, customHdriUrl, useBloom, toggleVibeMode]);

  return null;
});

VibeModeManager.displayName = "VibeModeManager";

export const EditManagers = memo(() => {
  return (
    <>
      <SvgProcessingLogic />
      <BackgroundThemeManager />
      <HdriCleanupManager />
      <VibeModeManager />
    </>
  );
});

EditManagers.displayName = "EditManagers";
