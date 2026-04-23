import React, { useEffect, useMemo, useRef, Suspense, useState } from "react";
import { Canvas, useThree, useFrame } from "@react-three/fiber";
import { OrbitControls } from "@react-three/drei";
import * as THREE from "three";
import { SimpleEnvironment } from "@/components/previews/environment-presets";
import type { EnvironmentPresetName } from "@/lib/types";
import {
  EffectComposer,
  Bloom,
  BrightnessContrast,
  ChromaticAberration,
  Noise,
  HueSaturation,
} from "@react-three/postprocessing";
import { BlendFunction } from "postprocessing";
import { SVGModel } from "./svg-model";
import { useEditorStore } from "@/lib/store";
import { memoryManager } from "@/lib/memory-manager";

// Detect Safari mobile for performance optimizations
const isSafariMobile = (): boolean => {
  if (typeof window === "undefined") return false;
  const ua = window.navigator.userAgent;
  const isSafari = /Safari/.test(ua) && !/Chrome/.test(ua) && !/Edge/.test(ua);
  const isMobileDevice = /iPhone|iPad|iPod/.test(ua) || window.innerWidth < 768;
  return isSafari && isMobileDevice;
};

export interface ModelPreviewProps {
  svgData: string;
  modelGroupRef: React.RefObject<THREE.Group | null>;
  modelRef: React.RefObject<THREE.Group | null>;
  isMobile: boolean;
  canvasRef?: React.RefObject<HTMLCanvasElement | null>;
  onLoadStart?: () => void;
  onLoadComplete?: () => void;
  onError?: (error: Error) => void;
}

// string in the format #ffffff or #ffffff00
// output alpha from 0 to 1, or undefined if color has no alpha
const hexaToAlpha = (color: string) => {
  if (color.length < 9) return undefined;
  const alpha = color.slice(7, 9);
  return parseInt(alpha, 16) / 255;
};

const colorPart = (color: string) => {
  return color.slice(0, 7);
};

const CustomBackground = () => {
  const { gl, scene, camera } = useThree();

  const backgroundColor = useEditorStore((state) => state.backgroundColor);
  const useBloom = useEditorStore((state) => state.useBloom);

  useEffect(() => {
    const bg = backgroundColor || "#000000";
    const alpha = hexaToAlpha(bg);
    if (!useBloom) {
      gl.autoClear = true;
    }

    gl.setClearColor(colorPart(bg), alpha);
    gl.render(scene, camera);
  }, [gl, scene, camera, backgroundColor, useBloom]);

  return null;
};

// Controls renderer toneMappingExposure from store
function ExposureController() {
  const { gl } = useThree();
  const exposure = useEditorStore((s) => s.exposure);
  useEffect(() => {
    gl.toneMappingExposure = exposure;
  }, [gl, exposure]);
  return null;
}

// Controls camera FOV and handles reset requests
function CameraController({
  orbitRef,
  isMobile,
}: {
  orbitRef: React.RefObject<any>;
  isMobile: boolean;
}) {
  const { camera } = useThree();
  const fov = useEditorStore((s) => s.cameraFov);
  const resetKey = useEditorStore((s) => s.cameraResetKey);
  const firstRun = useRef(true);

  useEffect(() => {
    if (camera instanceof THREE.PerspectiveCamera) {
      camera.fov = fov;
      camera.updateProjectionMatrix();
    }
  }, [camera, fov]);

  useEffect(() => {
    if (firstRun.current) {
      firstRun.current = false;
      return;
    }
    if (camera instanceof THREE.PerspectiveCamera) {
      if (isMobile) {
        camera.position.set(0, 20, 180);
      } else {
        camera.position.set(0, 0, 150);
      }
      camera.updateProjectionMatrix();
    }
    if (orbitRef.current && typeof orbitRef.current.reset === "function") {
      orbitRef.current.reset();
    }
  }, [resetKey, camera, isMobile, orbitRef]);

  return null;
}

// Rotatable directional light controlled by lightAngle
function LightController() {
  const lightRef = useRef<THREE.DirectionalLight>(null);
  const lightAngle = useEditorStore((s) => s.lightAngle);

  useEffect(() => {
    if (!lightRef.current) return;
    const radius = 50;
    lightRef.current.position.set(
      Math.sin(lightAngle) * radius,
      Math.cos(lightAngle) * radius * 0.5 + 10,
      Math.cos(lightAngle) * radius,
    );
    lightRef.current.lookAt(0, 0, 0);
  }, [lightAngle]);

  return (
    <directionalLight
      ref={lightRef}
      intensity={2.0}
      color="#ffffff"
      castShadow={false}
    />
  );
}

// Applies per-axis rotation speeds to the model group each frame
function ModelRotator({
  groupRef,
}: {
  groupRef: React.RefObject<THREE.Group | null>;
}) {
  const rotationSpeedX = useEditorStore((s) => s.rotationSpeedX);
  const rotationSpeedY = useEditorStore((s) => s.rotationSpeedY);
  const rotationSpeedZ = useEditorStore((s) => s.rotationSpeedZ);

  useFrame((_, delta) => {
    const g = groupRef.current;
    if (!g) return;
    g.rotation.x += rotationSpeedX * delta;
    g.rotation.y += rotationSpeedY * delta;
    g.rotation.z += rotationSpeedZ * delta;
  });
  return null;
}

// Helper to attach context lost/restored listeners (Mindful Chase best-practice)
function WebGLContextEvents() {
  const { gl } = useThree();

  useEffect(() => {
    const canvas = gl.domElement;

    const handleContextLost = (e: Event) => {
      e.preventDefault();
      console.warn("WebGL context lost – attempting cleanup and restore...");
      memoryManager.scheduleCleanup();
    };

    const handleContextRestored = () => {
      console.info("WebGL context restored");
    };

    canvas.addEventListener("webglcontextlost", handleContextLost, false);
    canvas.addEventListener(
      "webglcontextrestored",
      handleContextRestored,
      false,
    );

    return () => {
      canvas.removeEventListener("webglcontextlost", handleContextLost);
      canvas.removeEventListener("webglcontextrestored", handleContextRestored);
    };
  }, [gl]);

  return null;
}

// Component to capture the canvas reference
function CanvasCapture({
  canvasRef,
}: {
  canvasRef?: React.RefObject<HTMLCanvasElement | null>;
}) {
  const { gl } = useThree();

  useEffect(() => {
    if (canvasRef && gl.domElement) {
      canvasRef.current = gl.domElement;
    }
  }, [gl.domElement, canvasRef]);

  return null;
}

export const ModelPreview = React.memo<ModelPreviewProps>(
  ({ svgData, modelGroupRef, modelRef, isMobile, canvasRef }) => {
    // Detect Safari mobile once on mount for performance optimizations
    const [isSafariMobileDevice, setIsSafariMobileDevice] = useState(false);

    useEffect(() => {
      setIsSafariMobileDevice(isSafariMobile());
    }, []);

    // Use fine-grained selectors for all state
    const depth = useEditorStore((state) => state.depth);
    const modelRotationY = useEditorStore((state) => state.modelRotationY);
    const bevelEnabled = useEditorStore((state) => state.bevelEnabled);
    const bevelThickness = useEditorStore((state) => state.bevelThickness);
    const bevelSize = useEditorStore((state) => state.bevelSize);
    const bevelSegments = useEditorStore((state) => state.bevelSegments);
    const isHollowSvg = useEditorStore((state) => state.isHollowSvg);
    const useCustomColor = useEditorStore((state) => state.useCustomColor);
    const customColor = useEditorStore((state) => state.customColor);
    const roughness = useEditorStore((state) => state.roughness);
    const metalness = useEditorStore((state) => state.metalness);
    const clearcoat = useEditorStore((state) => state.clearcoat);
    const transmission = useEditorStore((state) => state.transmission);
    const envMapIntensity = useEditorStore((state) => state.envMapIntensity);
    const textureEnabled = useEditorStore((state) => state.textureEnabled);
    const texturePreset = useEditorStore((state) => state.texturePreset);
    const textureScale = useEditorStore((state) => state.textureScale);
    const textureDepth = useEditorStore((state) => state.textureDepth);
    const useEnvironment = useEditorStore((state) => state.useEnvironment);
    const environmentPreset = useEditorStore(
      (state) => state.environmentPreset,
    );
    const customHdriUrl = useEditorStore((state) => state.customHdriUrl);
    const autoRotate = useEditorStore((state) => state.autoRotate);
    const autoRotateSpeed = useEditorStore((state) => state.autoRotateSpeed);
    const useBloom = useEditorStore((state) => state.useBloom);
    const bloomIntensity = useEditorStore((state) => state.bloomIntensity);
    const bloomMipmapBlur = useEditorStore((state) => state.bloomMipmapBlur);

    // New state
    const ppBloomEnabled = useEditorStore((s) => s.ppBloomEnabled);
    const ppBloomStrength = useEditorStore((s) => s.ppBloomStrength);
    const ppChromaticEnabled = useEditorStore((s) => s.ppChromaticEnabled);
    const ppChromaticOffset = useEditorStore((s) => s.ppChromaticOffset);
    const ppFilmEnabled = useEditorStore((s) => s.ppFilmEnabled);
    const ppFilmIntensity = useEditorStore((s) => s.ppFilmIntensity);
    const contrast = useEditorStore((s) => s.contrast);
    const saturation = useEditorStore((s) => s.saturation);
    const sceneGridEnabled = useEditorStore((s) => s.sceneGridEnabled);
    const positionOffsetX = useEditorStore((s) => s.positionOffsetX);
    const positionOffsetY = useEditorStore((s) => s.positionOffsetY);
    const positionOffsetZ = useEditorStore((s) => s.positionOffsetZ);

    const cameraRef = useRef(
      new THREE.PerspectiveCamera(
        50,
        typeof window !== "undefined"
          ? window.innerWidth / window.innerHeight
          : 1,
        1,
        1000,
      ),
    );

    const orbitRef = useRef<any>(null);

    useEffect(() => {
      // Track the camera with memory manager
      const camera = cameraRef.current;
      if (camera) {
        memoryManager.track(camera);
      }

      const handleResize = () => {
        if (camera) {
          camera.aspect = window.innerWidth / window.innerHeight;
          camera.updateProjectionMatrix();
        }
      };
      if (typeof window !== "undefined") {
        window.addEventListener("resize", handleResize);
        handleResize();
        return () => {
          window.removeEventListener("resize", handleResize);
          // Cleanup camera when component unmounts
          if (camera) {
            memoryManager.untrack(camera);
          }
        };
      }
    }, []);

    const chromaticOffset = useMemo(
      () => new THREE.Vector2(ppChromaticOffset, ppChromaticOffset),
      [ppChromaticOffset],
    );

    const effects = useMemo(() => {
      // Disable EffectComposer entirely on Safari mobile to prevent freezing
      if (isSafariMobileDevice) {
        return null;
      }

      const msaaSamples = isMobile ? 4 : 8;
      const passes: React.ReactElement[] = [];
      if (useBloom) {
        passes.push(
          <Bloom
            key="bloom-main"
            intensity={bloomIntensity * 0.8}
            luminanceThreshold={0.9}
            luminanceSmoothing={0.3}
            mipmapBlur={bloomMipmapBlur}
            radius={0.4}
          />,
        );
      }
      if (ppBloomEnabled) {
        passes.push(
          <Bloom
            key="bloom-pp"
            intensity={ppBloomStrength}
            luminanceThreshold={0.6}
            luminanceSmoothing={0.4}
            mipmapBlur={true}
            radius={0.7}
          />,
        );
      }
      if (ppChromaticEnabled) {
        passes.push(
          <ChromaticAberration
            key="chromatic"
            offset={chromaticOffset}
            radialModulation={false}
            modulationOffset={0}
          />,
        );
      }
      if (ppFilmEnabled) {
        passes.push(
          <Noise
            key="noise"
            opacity={ppFilmIntensity}
            blendFunction={BlendFunction.OVERLAY}
            premultiply
          />,
        );
      }
      passes.push(
        <BrightnessContrast key="bc" brightness={0} contrast={contrast - 1} />,
      );
      passes.push(
        <HueSaturation key="hs" saturation={saturation - 1} hue={0} />,
      );

      return (
        <EffectComposer multisampling={msaaSamples}>
          {passes as unknown as React.ReactElement}
        </EffectComposer>
      );
    }, [
      useBloom,
      bloomIntensity,
      bloomMipmapBlur,
      ppBloomEnabled,
      ppBloomStrength,
      ppChromaticEnabled,
      chromaticOffset,
      ppFilmEnabled,
      ppFilmIntensity,
      contrast,
      saturation,
      isMobile,
      isSafariMobileDevice,
    ]);

    const environment = useMemo(() => {
      if (!useEnvironment) return null;

      return (
        <SimpleEnvironment
          environmentPreset={environmentPreset as EnvironmentPresetName}
          customHdriUrl={customHdriUrl}
        />
      );
    }, [useEnvironment, environmentPreset, customHdriUrl]);

    // Safari mobile optimizations: lower DPR, demand frameloop
    const dpr = useMemo(() => {
      if (typeof window === "undefined") return 1.5;
      const deviceDpr = window.devicePixelRatio || 1.5;
      return isSafariMobileDevice ? Math.min(deviceDpr, 2) : deviceDpr;
    }, [isSafariMobileDevice]);

    if (!svgData) return null;

    return (
      <Canvas
        shadows={!isSafariMobileDevice}
        camera={{
          position: isMobile ? [0, 20, 180] : [0, 0, 150],
          fov: isMobile ? 65 : 50,
        }}
        dpr={dpr}
        frameloop={isSafariMobileDevice ? "demand" : "always"}
        performance={{ min: isSafariMobileDevice ? 0.3 : 0.5 }}
        gl={{
          antialias: !isSafariMobileDevice,
          outputColorSpace: "srgb",
          toneMapping: THREE.AgXToneMapping,
          toneMappingExposure: 1.0,
          preserveDrawingBuffer: true,
          powerPreference: isSafariMobileDevice
            ? "default"
            : "high-performance",
          alpha: true,
          logarithmicDepthBuffer: false,
          precision: isMobile ? "mediump" : "highp",
          stencil: false,
        }}
        style={{
          width: "100%",
          height: "100%",
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
        }}>
        <Suspense fallback={null}>
          <CustomBackground />
          <WebGLContextEvents />
          <CanvasCapture canvasRef={canvasRef} />
          <ExposureController />
          <CameraController orbitRef={orbitRef} isMobile={isMobile} />

          <ambientLight intensity={0.4} color="#ffffff" />

          <LightController />

          <directionalLight
            position={[-10, -10, -5]}
            intensity={0.5}
            color="#d4edff"
            castShadow={false}
          />

          {!isSafariMobileDevice && environment}

          {sceneGridEnabled && (
            <gridHelper
              args={[400, 40, "#ffffff", "#444444"]}
              position={[0, -40, 0]}
            />
          )}

          <group
            ref={modelGroupRef}
            rotation={[0, modelRotationY, 0]}
            position={[positionOffsetX, positionOffsetY, positionOffsetZ]}>
            <SVGModel
              svgData={svgData}
              depth={depth * 5}
              bevelEnabled={isSafariMobileDevice ? false : bevelEnabled}
              bevelThickness={bevelThickness}
              bevelSize={bevelSize}
              bevelSegments={
                isSafariMobileDevice ? 1 : isMobile ? 3 : bevelSegments
              }
              customColor={useCustomColor ? customColor : undefined}
              roughness={roughness}
              metalness={metalness}
              clearcoat={isSafariMobileDevice ? 0 : clearcoat}
              transmission={isSafariMobileDevice ? 0 : transmission}
              envMapIntensity={
                isSafariMobileDevice
                  ? 0
                  : useEnvironment
                    ? envMapIntensity
                    : 0.2
              }
              receiveShadow={false}
              castShadow={false}
              isHollowSvg={isHollowSvg}
              spread={0}
              isMobile={isMobile}
              ref={modelRef}
              textureEnabled={isSafariMobileDevice ? false : textureEnabled}
              texturePreset={texturePreset}
              textureScale={textureScale}
              textureDepth={textureDepth}
            />
          </group>

          <ModelRotator groupRef={modelGroupRef} />
        </Suspense>

        {effects}

        <OrbitControls
          ref={orbitRef}
          autoRotate={isSafariMobileDevice ? false : autoRotate}
          autoRotateSpeed={autoRotateSpeed}
          minDistance={isMobile ? 80 : 50}
          maxDistance={isMobile ? 500 : 400}
          enablePan={true}
          enableZoom={true}
          enableRotate={true}
          target={[0, 0, 0]}
        />
      </Canvas>
    );
  },
);

ModelPreview.displayName = "ModelPreview";

export default ModelPreview;
