import { create } from "zustand";
import { MATERIAL_PRESETS, LIGHT_MODE_COLOR } from "@/lib/constants";

const initialPreset =
  MATERIAL_PRESETS.find((p) => p.name === "matte_metal") || MATERIAL_PRESETS[0];

interface EditorState {
  // SVG and Model State
  svgData: string | null;
  fileName: string;
  isModelLoading: boolean;
  svgProcessingError: string | null;
  depth: number;
  isHollowSvg: boolean;
  modelRotationY: number;

  // Bevel Options
  bevelEnabled: boolean;
  bevelThickness: number;
  bevelSize: number;
  bevelSegments: number;
  bevelPreset: string;

  // Material Options
  customColor: string;
  useCustomColor: boolean;
  materialPreset: string;
  roughness: number;
  metalness: number;
  clearcoat: number;
  envMapIntensity: number;
  transmission: number;
  vibeModeOriginalMaterial: string | null;

  // Texture Options
  textureEnabled: boolean;
  texturePreset: string;
  textureScale: { x: number; y: number };
  textureDepth: number;

  // Environment Options
  useEnvironment: boolean;
  environmentPreset: string;
  customHdriUrl: string | null;

  // Background Options
  userSelectedBackground: boolean;
  backgroundColor: string;
  solidColorPreset: string;

  // Animation Options
  autoRotate: boolean;
  autoRotateSpeed: number;

  // Display Options
  isFullscreen: boolean;
  useBloom: boolean;
  bloomIntensity: number;
  bloomMipmapBlur: boolean;

  // Recording Options
  isRecording: boolean;
  recordingDuration: number;
  recordingStartTime: number | null;
  recordingProgress: number;
  recordingElapsedTime: number;
  recordingFormat: "mp4" | "gif" | null;
  recordingStatus: "idle" | "recording" | "processing" | "complete" | "error";

  // Video Modal State
  videoModalOpen: boolean;
  completedVideoBlob: Blob | null;
  completedVideoFormat: "mp4" | "gif" | null;
  completedVideoFileName: string | null;

  // --- NEW STATE ---

  // Lighting bar
  lightAngle: number;

  // Effects
  effectType: "none" | "ascii";
  asciiSize: number;
  asciiBrightness: number;
  asciiSpacing: number;
  asciiShape: string;
  asciiColorMode: string;

  // Post-Processing
  ppBloomEnabled: boolean;
  ppBloomStrength: number;
  ppChromaticEnabled: boolean;
  ppChromaticOffset: number;
  ppFilmEnabled: boolean;
  ppFilmIntensity: number;

  // Adjustments
  exposure: number;
  contrast: number;
  saturation: number;

  // Camera
  cameraFov: number;
  cameraResetKey: number;

  // Scene
  sceneGridEnabled: boolean;

  // Rotation per-axis
  rotationSpeedX: number;
  rotationSpeedY: number;
  rotationSpeedZ: number;

  // Position offset
  positionOffsetX: number;
  positionOffsetY: number;
  positionOffsetZ: number;

  // Actions
  setSvgData: (data: string | null) => void;
  setFileName: (name: string) => void;
  setIsModelLoading: (loading: boolean) => void;
  setSvgProcessingError: (error: string | null) => void;
  setDepth: (depth: number) => void;
  setIsHollowSvg: (hollow: boolean) => void;
  setModelRotationY: (rotation: number) => void;

  setBevelEnabled: (enabled: boolean) => void;
  setBevelThickness: (thickness: number) => void;
  setBevelSize: (size: number) => void;
  setBevelSegments: (segments: number) => void;
  setBevelPreset: (preset: string) => void;

  setCustomColor: (color: string) => void;
  setUseCustomColor: (use: boolean) => void;
  setMaterialPreset: (preset: string) => void;
  setRoughness: (roughness: number) => void;
  setMetalness: (metalness: number) => void;
  setClearcoat: (clearcoat: number) => void;
  setEnvMapIntensity: (intensity: number) => void;
  setTransmission: (transmission: number) => void;
  setVibeModeOriginalMaterial: (material: string | null) => void;

  setTextureEnabled: (enabled: boolean) => void;
  setTexturePreset: (preset: string) => void;
  setTextureScale: (scale: { x: number; y: number }) => void;
  setTextureDepth: (depth: number) => void;

  setUseEnvironment: (use: boolean) => void;
  setEnvironmentPreset: (preset: string) => void;
  setCustomHdriUrl: (url: string | null) => void;

  setUserSelectedBackground: (selected: boolean) => void;
  setBackgroundColor: (color: string) => void;
  setSolidColorPreset: (preset: string) => void;

  setAutoRotate: (rotate: boolean) => void;
  setAutoRotateSpeed: (speed: number) => void;

  setIsFullscreen: (fullscreen: boolean) => void;
  setUseBloom: (bloom: boolean) => void;
  setBloomIntensity: (intensity: number) => void;
  setBloomMipmapBlur: (blur: boolean) => void;

  setIsRecording: (recording: boolean) => void;
  setRecordingDuration: (duration: number) => void;
  setRecordingStartTime: (time: number | null) => void;
  setRecordingProgress: (progress: number, elapsedTime: number) => void;
  setRecordingFormat: (format: "mp4" | "gif" | null) => void;
  setRecordingStatus: (
    status: "idle" | "recording" | "processing" | "complete" | "error",
  ) => void;
  resetRecordingState: () => void;

  setVideoModalOpen: (open: boolean) => void;
  setCompletedVideo: (
    blob: Blob | null,
    format: "mp4" | "gif" | null,
    fileName: string | null,
  ) => void;
  clearCompletedVideo: () => void;

  // New actions
  setLightAngle: (angle: number) => void;

  setEffectType: (type: "none" | "ascii") => void;
  setAsciiSize: (v: number) => void;
  setAsciiBrightness: (v: number) => void;
  setAsciiSpacing: (v: number) => void;
  setAsciiShape: (v: string) => void;
  setAsciiColorMode: (v: string) => void;

  setPpBloomEnabled: (v: boolean) => void;
  setPpBloomStrength: (v: number) => void;
  setPpChromaticEnabled: (v: boolean) => void;
  setPpChromaticOffset: (v: number) => void;
  setPpFilmEnabled: (v: boolean) => void;
  setPpFilmIntensity: (v: number) => void;

  setExposure: (v: number) => void;
  setContrast: (v: number) => void;
  setSaturation: (v: number) => void;

  setCameraFov: (v: number) => void;
  triggerCameraReset: () => void;

  setSceneGridEnabled: (v: boolean) => void;

  setRotationSpeedX: (v: number) => void;
  setRotationSpeedY: (v: number) => void;
  setRotationSpeedZ: (v: number) => void;

  setPositionOffsetX: (v: number) => void;
  setPositionOffsetY: (v: number) => void;
  setPositionOffsetZ: (v: number) => void;
  resetPosition: () => void;

  // Complex Actions
  toggleVibeMode: (newState: boolean) => void;
  resetEditor: () => void;
}

export const useEditorStore = create<EditorState>((set) => ({
  // Initial State
  svgData: null,
  fileName: "",
  isModelLoading: true,
  svgProcessingError: null,
  depth: 1,
  isHollowSvg: false,
  modelRotationY: 0,

  bevelEnabled: false,
  bevelThickness: 0.0,
  bevelSize: 0.0,
  bevelSegments: 1,
  bevelPreset: "none",

  customColor: "#3498db",
  useCustomColor: false,
  materialPreset: "matte_metal",
  roughness: initialPreset.roughness,
  metalness: initialPreset.metalness,
  clearcoat: initialPreset.clearcoat,
  envMapIntensity: initialPreset.envMapIntensity,
  transmission: initialPreset.transmission,
  vibeModeOriginalMaterial: null,

  textureEnabled: false,
  texturePreset: "oak",
  textureScale: { x: 100, y: 100 },
  textureDepth: 100,

  useEnvironment: true,
  environmentPreset: "apartment",
  customHdriUrl: null,

  userSelectedBackground: false,
  backgroundColor: "#111114",
  solidColorPreset: "dark",

  autoRotate: true,
  autoRotateSpeed: 3,

  isFullscreen: false,
  useBloom: false,
  bloomIntensity: 1.0,
  bloomMipmapBlur: true,

  isRecording: false,
  recordingDuration: 0,
  recordingStartTime: null,
  recordingProgress: 0,
  recordingElapsedTime: 0,
  recordingFormat: null,
  recordingStatus: "idle",

  videoModalOpen: false,
  completedVideoBlob: null,
  completedVideoFormat: null,
  completedVideoFileName: null,

  // New initial state
  lightAngle: Math.PI / 4,

  effectType: "none",
  asciiSize: 15,
  asciiBrightness: 2,
  asciiSpacing: 0,
  asciiShape: "Mixed",
  asciiColorMode: "original",

  ppBloomEnabled: false,
  ppBloomStrength: 1.0,
  ppChromaticEnabled: false,
  ppChromaticOffset: 0.005,
  ppFilmEnabled: false,
  ppFilmIntensity: 0.35,

  exposure: 1.0,
  contrast: 1.0,
  saturation: 1.0,

  cameraFov: 50,
  cameraResetKey: 0,

  sceneGridEnabled: false,

  rotationSpeedX: 0,
  rotationSpeedY: 0,
  rotationSpeedZ: 0,

  positionOffsetX: 0,
  positionOffsetY: 0,
  positionOffsetZ: 0,

  // Simple Actions
  setSvgData: (data) => set({ svgData: data }),
  setFileName: (name) => set({ fileName: name }),
  setIsModelLoading: (loading) => set({ isModelLoading: loading }),
  setSvgProcessingError: (error) => set({ svgProcessingError: error }),
  setDepth: (depth) => set({ depth }),
  setIsHollowSvg: (hollow) => set({ isHollowSvg: hollow }),
  setModelRotationY: (rotation) => set({ modelRotationY: rotation }),

  setBevelEnabled: (enabled) => set({ bevelEnabled: enabled }),
  setBevelThickness: (thickness) => set({ bevelThickness: thickness }),
  setBevelSize: (size) => set({ bevelSize: size }),
  setBevelSegments: (segments) => set({ bevelSegments: segments }),
  setBevelPreset: (preset) => set({ bevelPreset: preset }),

  setCustomColor: (color) => set({ customColor: color }),
  setUseCustomColor: (use) => set({ useCustomColor: use }),
  setMaterialPreset: (preset) => set({ materialPreset: preset }),
  setRoughness: (roughness) => set({ roughness }),
  setMetalness: (metalness) => set({ metalness }),
  setClearcoat: (clearcoat) => set({ clearcoat }),
  setEnvMapIntensity: (intensity) => set({ envMapIntensity: intensity }),
  setTransmission: (transmission) => set({ transmission }),
  setVibeModeOriginalMaterial: (material) =>
    set({ vibeModeOriginalMaterial: material }),

  setTextureEnabled: (enabled) => set({ textureEnabled: enabled }),
  setTexturePreset: (preset) => set({ texturePreset: preset }),
  setTextureScale: (scale) => set({ textureScale: scale }),
  setTextureDepth: (depth) => set({ textureDepth: depth }),

  setUseEnvironment: (use) => set({ useEnvironment: use }),
  setEnvironmentPreset: (preset) => set({ environmentPreset: preset }),
  setCustomHdriUrl: (url) => set({ customHdriUrl: url }),

  setUserSelectedBackground: (selected) =>
    set({ userSelectedBackground: selected }),
  setBackgroundColor: (color) => set({ backgroundColor: color }),
  setSolidColorPreset: (preset) => set({ solidColorPreset: preset }),

  setAutoRotate: (rotate) => set({ autoRotate: rotate }),
  setAutoRotateSpeed: (speed) => set({ autoRotateSpeed: speed }),

  setIsFullscreen: (fullscreen) => set({ isFullscreen: fullscreen }),
  setUseBloom: (bloom) => set({ useBloom: bloom }),
  setBloomIntensity: (intensity) => set({ bloomIntensity: intensity }),
  setBloomMipmapBlur: (blur) => set({ bloomMipmapBlur: blur }),

  setIsRecording: (recording) => set({ isRecording: recording }),
  setRecordingDuration: (duration) => set({ recordingDuration: duration }),
  setRecordingStartTime: (time) => set({ recordingStartTime: time }),
  setRecordingProgress: (progress, elapsedTime) =>
    set({ recordingProgress: progress, recordingElapsedTime: elapsedTime }),
  setRecordingFormat: (format) => set({ recordingFormat: format }),
  setRecordingStatus: (status) => set({ recordingStatus: status }),
  resetRecordingState: () =>
    set({
      isRecording: false,
      recordingProgress: 0,
      recordingElapsedTime: 0,
      recordingFormat: null,
      recordingStatus: "idle",
    }),

  setVideoModalOpen: (open) => set({ videoModalOpen: open }),
  setCompletedVideo: (blob, format, fileName) =>
    set({
      completedVideoBlob: blob,
      completedVideoFormat: format,
      completedVideoFileName: fileName,
    }),
  clearCompletedVideo: () =>
    set({
      completedVideoBlob: null,
      completedVideoFormat: null,
      completedVideoFileName: null,
    }),

  // New actions
  setLightAngle: (angle) => set({ lightAngle: angle }),

  setEffectType: (type) => set({ effectType: type }),
  setAsciiSize: (v) => set({ asciiSize: v }),
  setAsciiBrightness: (v) => set({ asciiBrightness: v }),
  setAsciiSpacing: (v) => set({ asciiSpacing: v }),
  setAsciiShape: (v) => set({ asciiShape: v }),
  setAsciiColorMode: (v) => set({ asciiColorMode: v }),

  setPpBloomEnabled: (v) => set({ ppBloomEnabled: v }),
  setPpBloomStrength: (v) => set({ ppBloomStrength: v }),
  setPpChromaticEnabled: (v) => set({ ppChromaticEnabled: v }),
  setPpChromaticOffset: (v) => set({ ppChromaticOffset: v }),
  setPpFilmEnabled: (v) => set({ ppFilmEnabled: v }),
  setPpFilmIntensity: (v) => set({ ppFilmIntensity: v }),

  setExposure: (v) => set({ exposure: v }),
  setContrast: (v) => set({ contrast: v }),
  setSaturation: (v) => set({ saturation: v }),

  setCameraFov: (v) => set({ cameraFov: v }),
  triggerCameraReset: () => set((s) => ({ cameraResetKey: s.cameraResetKey + 1 })),

  setSceneGridEnabled: (v) => set({ sceneGridEnabled: v }),

  setRotationSpeedX: (v) => set({ rotationSpeedX: v }),
  setRotationSpeedY: (v) => set({ rotationSpeedY: v }),
  setRotationSpeedZ: (v) => set({ rotationSpeedZ: v }),

  setPositionOffsetX: (v) => set({ positionOffsetX: v }),
  setPositionOffsetY: (v) => set({ positionOffsetY: v }),
  setPositionOffsetZ: (v) => set({ positionOffsetZ: v }),
  resetPosition: () => set({ positionOffsetX: 0, positionOffsetY: 0, positionOffsetZ: 0 }),

  // Complex Actions
  toggleVibeMode: (newState) =>
    set((state) => {
      if (
        newState &&
        state.environmentPreset === "custom" &&
        state.customHdriUrl
      ) {
        return state;
      }

      const updates: Partial<EditorState> = {
        useBloom: newState,
        userSelectedBackground: newState ? true : state.userSelectedBackground,
        backgroundColor: newState ? "#000000" : state.backgroundColor,
        solidColorPreset: newState ? "custom" : state.solidColorPreset,
      };

      if (newState) {
        if (state.environmentPreset !== "custom" || !state.customHdriUrl) {
          updates.environmentPreset = "dawn";
        }
      }
      return updates;
    }),

  resetEditor: () =>
    set(() => ({
      depth: 1,
      isHollowSvg: false,
      modelRotationY: 0,

      bevelEnabled: false,
      bevelThickness: 0.0,
      bevelSize: 0.0,
      bevelSegments: 1,
      bevelPreset: "none",

      customColor: "#3498db",
      useCustomColor: false,
      materialPreset: "matte_metal",
      roughness: initialPreset.roughness,
      metalness: initialPreset.metalness,
      clearcoat: initialPreset.clearcoat,
      envMapIntensity: initialPreset.envMapIntensity,
      transmission: initialPreset.transmission,
      vibeModeOriginalMaterial: null,

      textureEnabled: false,
      texturePreset: "oak",
      textureScale: { x: 100, y: 100 },
      textureDepth: 100,

      useEnvironment: true,
      environmentPreset: "apartment",
      customHdriUrl: null,

      userSelectedBackground: false,

      autoRotate: true,
      autoRotateSpeed: 3,

      useBloom: false,
      bloomIntensity: 1.0,
      bloomMipmapBlur: true,

      lightAngle: Math.PI / 4,
      effectType: "none",
      asciiSize: 15,
      asciiBrightness: 2,
      asciiSpacing: 0,
      asciiShape: "Mixed",
      asciiColorMode: "original",

      ppBloomEnabled: false,
      ppBloomStrength: 1.0,
      ppChromaticEnabled: false,
      ppChromaticOffset: 0.005,
      ppFilmEnabled: false,
      ppFilmIntensity: 0.35,

      exposure: 1.0,
      contrast: 1.0,
      saturation: 1.0,

      cameraFov: 50,
      cameraResetKey: 0,

      sceneGridEnabled: false,

      rotationSpeedX: 0,
      rotationSpeedY: 0,
      rotationSpeedZ: 0,

      positionOffsetX: 0,
      positionOffsetY: 0,
      positionOffsetZ: 0,
    })),
}));
