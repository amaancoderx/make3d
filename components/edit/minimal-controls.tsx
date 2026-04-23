"use client";

import { useEditorStore } from "@/lib/store";
import { MATERIAL_PRESETS, ENVIRONMENT_PRESETS } from "@/lib/constants";
import { ChevronDown } from "lucide-react";

interface MinimalControlsProps {
  activeSection: string | null;
  onSectionChange: (section: string | null) => void;
}

export function MinimalControls({ activeSection, onSectionChange }: MinimalControlsProps) {
  const toggleSection = (section: string) => {
    onSectionChange(activeSection === section ? null : section);
  };

  return (
    <div className="text-[12px] uppercase tracking-wide">
      <GeometrySection isOpen={activeSection === "geometry"} onToggle={() => toggleSection("geometry")} />
      <MaterialSection isOpen={activeSection === "material"} onToggle={() => toggleSection("material")} />
      <EnvironmentSection isOpen={activeSection === "environment"} onToggle={() => toggleSection("environment")} />
      <EffectsSection isOpen={activeSection === "effects"} onToggle={() => toggleSection("effects")} />
      <PostProcessingSection isOpen={activeSection === "postprocessing"} onToggle={() => toggleSection("postprocessing")} />
      <AdjustmentsSection isOpen={activeSection === "adjustments"} onToggle={() => toggleSection("adjustments")} />
      <CameraSection isOpen={activeSection === "camera"} onToggle={() => toggleSection("camera")} />
      <SceneSection isOpen={activeSection === "scene"} onToggle={() => toggleSection("scene")} />
      <RotationSection isOpen={activeSection === "rotation"} onToggle={() => toggleSection("rotation")} />
      <PositionSection isOpen={activeSection === "position"} onToggle={() => toggleSection("position")} />
      <DisplaySection isOpen={activeSection === "display"} onToggle={() => toggleSection("display")} />
    </div>
  );
}

function SectionHeader({ title, isOpen, onToggle }: { title: string; isOpen: boolean; onToggle: () => void }) {
  return (
    <button
      onClick={onToggle}
      className="flex w-full items-center justify-between px-4 py-3 text-left transition-all duration-200 hover:bg-white/[0.03]"
      style={{ borderBottom: "1px solid rgba(255,255,255,0.07)" }}>
      <span className={`text-[13px] font-medium tracking-[0.1em] transition-colors duration-200 ${isOpen ? "text-white" : "text-white/55"}`}>
        {title}
      </span>
      <ChevronDown
        className={`h-4 w-4 transition-all duration-300 ${isOpen ? "rotate-180 text-white/70" : "text-white/30"}`}
      />
    </button>
  );
}

function AnimatedSection({ isOpen, children }: { isOpen: boolean; children: React.ReactNode }) {
  return (
    <div className={`grid transition-all duration-300 ease-out ${isOpen ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"}`}>
      <div className="overflow-hidden">{children}</div>
    </div>
  );
}

function SliderRow({
  label, value, onChange, min = 0, max = 100, step = 1,
}: {
  label: string; value: number; onChange: (v: number) => void;
  min?: number; max?: number; step?: number;
}) {
  const decimals = step < 0.01 ? 3 : step < 0.1 ? 2 : step < 1 ? 1 : 0;
  return (
    <div className="flex items-center justify-between py-2.5">
      <span className="text-[12px] tracking-[0.06em] text-white/50">{label}</span>
      <div className="flex items-center gap-3">
        <input
          type="range"
          min={min} max={max} step={step} value={value}
          onChange={(e) => onChange(parseFloat(e.target.value))}
          className="h-[3px] w-28 cursor-pointer appearance-none rounded-full bg-white/[0.12]
            [&::-webkit-slider-thumb]:h-[14px]
            [&::-webkit-slider-thumb]:w-[14px]
            [&::-webkit-slider-thumb]:appearance-none
            [&::-webkit-slider-thumb]:rounded-full
            [&::-webkit-slider-thumb]:bg-white
            [&::-webkit-slider-thumb]:shadow-[0_0_8px_rgba(255,255,255,0.6),0_0_16px_rgba(255,255,255,0.2)]
            [&::-webkit-slider-thumb]:transition-all
            [&::-webkit-slider-thumb:hover]:shadow-[0_0_12px_rgba(255,255,255,0.9),0_0_24px_rgba(255,255,255,0.35)]
            [&::-moz-range-thumb]:h-[14px]
            [&::-moz-range-thumb]:w-[14px]
            [&::-moz-range-thumb]:rounded-full
            [&::-moz-range-thumb]:border-0
            [&::-moz-range-thumb]:bg-white"
        />
        <span className="w-10 text-right text-[12px] tabular-nums text-white/65">
          {value.toFixed(decimals)}
        </span>
      </div>
    </div>
  );
}

function ToggleRow({ label, value, onChange }: { label: string; value: boolean; onChange: (v: boolean) => void }) {
  return (
    <div className="flex items-center justify-between py-2.5">
      <span className="text-[12px] tracking-[0.06em] text-white/50">{label}</span>
      <button
        onClick={() => onChange(!value)}
        className={`relative h-5 w-9 rounded-full transition-all duration-300 ${
          value
            ? "bg-white shadow-[0_0_14px_rgba(255,255,255,0.45),0_0_4px_rgba(255,255,255,0.7)]"
            : "bg-white/[0.1] ring-1 ring-white/[0.15]"
        }`}>
        <div
          className={`absolute top-[3px] h-[14px] w-[14px] rounded-full shadow-sm transition-all duration-300 ${
            value ? "left-[19px] bg-black" : "left-[3px] bg-white/40"
          }`}
        />
      </button>
    </div>
  );
}

function SelectRow({
  label, value, options, onChange,
}: {
  label: string; value: string;
  options: { value: string; label: string }[];
  onChange: (v: string) => void;
}) {
  return (
    <div className="py-2.5">
      <span className="mb-2 block text-[11px] tracking-[0.08em] text-white/40">{label}</span>
      <div className="flex flex-wrap gap-1.5">
        {options.map((opt) => (
          <button
            key={opt.value}
            onClick={() => onChange(opt.value)}
            className={`rounded-sm px-2.5 py-1.5 text-[11px] font-medium tracking-[0.06em] transition-all duration-200 ${
              value === opt.value
                ? "bg-white text-black shadow-[0_0_12px_rgba(255,255,255,0.25)]"
                : "border border-white/[0.1] bg-white/[0.04] text-white/45 hover:border-white/[0.22] hover:bg-white/[0.09] hover:text-white/80"
            }`}>
            {opt.label}
          </button>
        ))}
      </div>
    </div>
  );
}

function ActionButton({ label, onClick }: { label: string; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="w-full rounded-sm border border-white/[0.12] bg-white/[0.04] px-3 py-2 text-[11px] font-medium tracking-[0.08em] text-white/65 transition-all duration-200 hover:border-white/[0.22] hover:bg-white/[0.09] hover:text-white/90">
      {label}
    </button>
  );
}

function Divider() {
  return <div style={{ height: "1px", background: "rgba(255,255,255,0.05)", margin: "2px 0" }} />;
}

function GeometrySection({ isOpen, onToggle }: { isOpen: boolean; onToggle: () => void }) {
  const depth = useEditorStore((s) => s.depth);
  const setDepth = useEditorStore((s) => s.setDepth);
  const bevelEnabled = useEditorStore((s) => s.bevelEnabled);
  const setBevelEnabled = useEditorStore((s) => s.setBevelEnabled);
  const bevelThickness = useEditorStore((s) => s.bevelThickness);
  const setBevelThickness = useEditorStore((s) => s.setBevelThickness);
  const bevelSize = useEditorStore((s) => s.bevelSize);
  const setBevelSize = useEditorStore((s) => s.setBevelSize);
  const bevelSegments = useEditorStore((s) => s.bevelSegments);
  const setBevelSegments = useEditorStore((s) => s.setBevelSegments);

  return (
    <div>
      <SectionHeader title="GEOMETRY" isOpen={isOpen} onToggle={onToggle} />
      <AnimatedSection isOpen={isOpen}>
        <div className="px-4 py-1 pb-3" style={{ borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
          <SliderRow label="DEPTH" value={depth} onChange={setDepth} min={0.1} max={10} step={0.1} />
          <Divider />
          <ToggleRow label="BEVEL" value={bevelEnabled} onChange={setBevelEnabled} />
          <AnimatedSection isOpen={bevelEnabled}>
            <div className="pt-1">
              <SliderRow label="THICKNESS" value={bevelThickness} onChange={setBevelThickness} min={0} max={5} step={0.1} />
              <SliderRow label="SIZE" value={bevelSize} onChange={setBevelSize} min={0} max={3} step={0.1} />
              <SliderRow label="SMOOTHNESS" value={bevelSegments} onChange={setBevelSegments} min={1} max={64} step={1} />
            </div>
          </AnimatedSection>
        </div>
      </AnimatedSection>
    </div>
  );
}

function MaterialSection({ isOpen, onToggle }: { isOpen: boolean; onToggle: () => void }) {
  const materialPreset = useEditorStore((s) => s.materialPreset);
  const setMaterialPreset = useEditorStore((s) => s.setMaterialPreset);
  const roughness = useEditorStore((s) => s.roughness);
  const setRoughness = useEditorStore((s) => s.setRoughness);
  const metalness = useEditorStore((s) => s.metalness);
  const setMetalness = useEditorStore((s) => s.setMetalness);
  const clearcoat = useEditorStore((s) => s.clearcoat);
  const setClearcoat = useEditorStore((s) => s.setClearcoat);
  const useCustomColor = useEditorStore((s) => s.useCustomColor);
  const setUseCustomColor = useEditorStore((s) => s.setUseCustomColor);
  const customColor = useEditorStore((s) => s.customColor);
  const setCustomColor = useEditorStore((s) => s.setCustomColor);

  const presetOptions = MATERIAL_PRESETS.map((p) => ({ value: p.name, label: p.label.toUpperCase() }));

  const handlePresetChange = (name: string) => {
    setMaterialPreset(name);
    const preset = MATERIAL_PRESETS.find((p) => p.name === name);
    if (preset && name !== "custom") {
      setRoughness(preset.roughness);
      setMetalness(preset.metalness);
      setClearcoat(preset.clearcoat);
    }
  };

  return (
    <div>
      <SectionHeader title="MATERIAL" isOpen={isOpen} onToggle={onToggle} />
      <AnimatedSection isOpen={isOpen}>
        <div className="px-4 py-1 pb-3" style={{ borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
          <SelectRow label="PRESET" value={materialPreset} options={presetOptions} onChange={handlePresetChange} />
          <Divider />
          <SliderRow label="ROUGHNESS" value={roughness} onChange={setRoughness} min={0} max={1} step={0.01} />
          <SliderRow label="METALNESS" value={metalness} onChange={setMetalness} min={0} max={1} step={0.01} />
          <SliderRow label="CLEARCOAT" value={clearcoat} onChange={setClearcoat} min={0} max={1} step={0.01} />
          <Divider />
          <ToggleRow label="CUSTOM COLOR" value={useCustomColor} onChange={setUseCustomColor} />
          <AnimatedSection isOpen={useCustomColor}>
            <div className="flex items-center justify-between py-2.5">
              <span className="text-[12px] tracking-[0.06em] text-white/50">COLOR</span>
              <input
                type="color"
                value={customColor}
                onChange={(e) => setCustomColor(e.target.value)}
                className="h-7 w-14 cursor-pointer rounded-sm border border-white/[0.12] bg-transparent"
              />
            </div>
          </AnimatedSection>
        </div>
      </AnimatedSection>
    </div>
  );
}

function EnvironmentSection({ isOpen, onToggle }: { isOpen: boolean; onToggle: () => void }) {
  const useEnvironment = useEditorStore((s) => s.useEnvironment);
  const setUseEnvironment = useEditorStore((s) => s.setUseEnvironment);
  const environmentPreset = useEditorStore((s) => s.environmentPreset);
  const setEnvironmentPreset = useEditorStore((s) => s.setEnvironmentPreset);
  const envMapIntensity = useEditorStore((s) => s.envMapIntensity);
  const setEnvMapIntensity = useEditorStore((s) => s.setEnvMapIntensity);

  const envOptions = ENVIRONMENT_PRESETS.map((e) => ({ value: e.name, label: e.label.toUpperCase() }));

  return (
    <div>
      <SectionHeader title="ENVIRONMENT" isOpen={isOpen} onToggle={onToggle} />
      <AnimatedSection isOpen={isOpen}>
        <div className="px-4 py-1 pb-3" style={{ borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
          <ToggleRow label="ENABLED" value={useEnvironment} onChange={setUseEnvironment} />
          <AnimatedSection isOpen={useEnvironment}>
            <div className="pt-1">
              <SelectRow label="PRESET" value={environmentPreset} options={envOptions} onChange={setEnvironmentPreset} />
              <Divider />
              <SliderRow label="INTENSITY" value={envMapIntensity} onChange={setEnvMapIntensity} min={0} max={3} step={0.1} />
            </div>
          </AnimatedSection>
        </div>
      </AnimatedSection>
    </div>
  );
}

function EffectsSection({ isOpen, onToggle }: { isOpen: boolean; onToggle: () => void }) {
  const effectType = useEditorStore((s) => s.effectType);
  const setEffectType = useEditorStore((s) => s.setEffectType);
  const asciiSize = useEditorStore((s) => s.asciiSize);
  const setAsciiSize = useEditorStore((s) => s.setAsciiSize);
  const asciiBrightness = useEditorStore((s) => s.asciiBrightness);
  const setAsciiBrightness = useEditorStore((s) => s.setAsciiBrightness);
  const asciiSpacing = useEditorStore((s) => s.asciiSpacing);
  const setAsciiSpacing = useEditorStore((s) => s.setAsciiSpacing);
  const asciiShape = useEditorStore((s) => s.asciiShape);
  const setAsciiShape = useEditorStore((s) => s.setAsciiShape);
  const asciiColorMode = useEditorStore((s) => s.asciiColorMode);
  const setAsciiColorMode = useEditorStore((s) => s.setAsciiColorMode);

  const typeOpts = [
    { value: "none", label: "NONE" },
    { value: "ascii", label: "ASCII" },
  ];
  const shapeOpts = ["Mixed", "Blocks", "Circles", "Lines", "Diagonal", "Cross", "Diamond", "Hash"].map(
    (s) => ({ value: s, label: s.toUpperCase() }),
  );

  const resetAscii = () => {
    setAsciiSize(15);
    setAsciiBrightness(2);
    setAsciiSpacing(0);
    setAsciiShape("Mixed");
    setAsciiColorMode("original");
  };

  const randomizeAscii = () => {
    const shapes = ["Mixed", "Blocks", "Circles", "Lines", "Diagonal", "Cross", "Diamond", "Hash"];
    setAsciiShape(shapes[Math.floor(Math.random() * shapes.length)]);
    setAsciiSize(5 + Math.floor(Math.random() * 25));
    setAsciiBrightness(1 + Math.random() * 4);
    setAsciiSpacing(Math.floor(Math.random() * 6));
    setAsciiColorMode("randomize");
  };

  return (
    <div>
      <SectionHeader title="EFFECTS" isOpen={isOpen} onToggle={onToggle} />
      <AnimatedSection isOpen={isOpen}>
        <div className="px-4 py-1 pb-3" style={{ borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
          <SelectRow label="EFFECT" value={effectType} options={typeOpts} onChange={(v) => setEffectType(v as "none" | "ascii")} />
          <AnimatedSection isOpen={effectType === "ascii"}>
            <div className="pt-1">
              <SliderRow label="SIZE" value={asciiSize} onChange={setAsciiSize} min={5} max={30} step={1} />
              <SliderRow label="BRIGHTNESS" value={asciiBrightness} onChange={setAsciiBrightness} min={1} max={5} step={0.1} />
              <SliderRow label="SPACING" value={asciiSpacing} onChange={setAsciiSpacing} min={0} max={10} step={1} />
              <Divider />
              <SelectRow label="SHAPE" value={asciiShape} options={shapeOpts} onChange={setAsciiShape} />
              <Divider />
              <div className="py-2.5">
                <span className="mb-2 block text-[11px] tracking-[0.08em] text-white/40">COLOR</span>
                <div className="flex flex-wrap gap-1.5">
                  {[
                    { value: "original", label: "ORIGINAL" },
                    { value: "duotone", label: "DUOTONE" },
                  ].map((opt) => (
                    <button
                      key={opt.value}
                      onClick={() => setAsciiColorMode(opt.value)}
                      className={`rounded-sm px-2.5 py-1.5 text-[11px] font-medium tracking-[0.06em] transition-all duration-200 ${
                        asciiColorMode === opt.value
                          ? "bg-white text-black shadow-[0_0_12px_rgba(255,255,255,0.25)]"
                          : "border border-white/[0.1] bg-white/[0.04] text-white/45 hover:border-white/[0.22] hover:bg-white/[0.09] hover:text-white/80"
                      }`}>
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>
              <div className="flex gap-2 pt-1">
                <button
                  onClick={randomizeAscii}
                  className="flex-1 rounded-sm border border-white/[0.12] bg-white/[0.04] px-2 py-2 text-[11px] font-medium tracking-[0.06em] text-white/65 transition-all duration-200 hover:border-white/[0.22] hover:bg-white/[0.09] hover:text-white/90">
                  RANDOMIZE
                </button>
                <button
                  onClick={resetAscii}
                  className="flex-1 rounded-sm border border-white/[0.12] bg-white/[0.04] px-2 py-2 text-[11px] font-medium tracking-[0.06em] text-white/65 transition-all duration-200 hover:border-white/[0.22] hover:bg-white/[0.09] hover:text-white/90">
                  RESET
                </button>
              </div>
            </div>
          </AnimatedSection>
        </div>
      </AnimatedSection>
    </div>
  );
}

function PostProcessingSection({ isOpen, onToggle }: { isOpen: boolean; onToggle: () => void }) {
  const ppBloomEnabled = useEditorStore((s) => s.ppBloomEnabled);
  const setPpBloomEnabled = useEditorStore((s) => s.setPpBloomEnabled);
  const ppBloomStrength = useEditorStore((s) => s.ppBloomStrength);
  const setPpBloomStrength = useEditorStore((s) => s.setPpBloomStrength);
  const ppChromaticEnabled = useEditorStore((s) => s.ppChromaticEnabled);
  const setPpChromaticEnabled = useEditorStore((s) => s.setPpChromaticEnabled);
  const ppChromaticOffset = useEditorStore((s) => s.ppChromaticOffset);
  const setPpChromaticOffset = useEditorStore((s) => s.setPpChromaticOffset);
  const ppFilmEnabled = useEditorStore((s) => s.ppFilmEnabled);
  const setPpFilmEnabled = useEditorStore((s) => s.setPpFilmEnabled);
  const ppFilmIntensity = useEditorStore((s) => s.ppFilmIntensity);
  const setPpFilmIntensity = useEditorStore((s) => s.setPpFilmIntensity);

  return (
    <div>
      <SectionHeader title="POST-PROCESSING" isOpen={isOpen} onToggle={onToggle} />
      <AnimatedSection isOpen={isOpen}>
        <div className="px-4 py-1 pb-3" style={{ borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
          <ToggleRow label="BLOOM" value={ppBloomEnabled} onChange={setPpBloomEnabled} />
          <AnimatedSection isOpen={ppBloomEnabled}>
            <SliderRow label="STRENGTH" value={ppBloomStrength} onChange={setPpBloomStrength} min={0} max={3} step={0.05} />
          </AnimatedSection>
          <Divider />
          <ToggleRow label="CHROMATIC ABERRATION" value={ppChromaticEnabled} onChange={setPpChromaticEnabled} />
          <AnimatedSection isOpen={ppChromaticEnabled}>
            <SliderRow label="OFFSET" value={ppChromaticOffset} onChange={setPpChromaticOffset} min={0} max={0.05} step={0.001} />
          </AnimatedSection>
          <Divider />
          <ToggleRow label="FILM GRAIN" value={ppFilmEnabled} onChange={setPpFilmEnabled} />
          <AnimatedSection isOpen={ppFilmEnabled}>
            <SliderRow label="INTENSITY" value={ppFilmIntensity} onChange={setPpFilmIntensity} min={0} max={1} step={0.01} />
          </AnimatedSection>
        </div>
      </AnimatedSection>
    </div>
  );
}

function AdjustmentsSection({ isOpen, onToggle }: { isOpen: boolean; onToggle: () => void }) {
  const exposure = useEditorStore((s) => s.exposure);
  const setExposure = useEditorStore((s) => s.setExposure);
  const contrast = useEditorStore((s) => s.contrast);
  const setContrast = useEditorStore((s) => s.setContrast);
  const saturation = useEditorStore((s) => s.saturation);
  const setSaturation = useEditorStore((s) => s.setSaturation);

  return (
    <div>
      <SectionHeader title="ADJUSTMENTS" isOpen={isOpen} onToggle={onToggle} />
      <AnimatedSection isOpen={isOpen}>
        <div className="px-4 py-1 pb-3" style={{ borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
          <SliderRow label="EXPOSURE" value={exposure} onChange={setExposure} min={0} max={3} step={0.05} />
          <SliderRow label="CONTRAST" value={contrast} onChange={setContrast} min={0} max={2} step={0.05} />
          <SliderRow label="SATURATION" value={saturation} onChange={setSaturation} min={0} max={2} step={0.05} />
        </div>
      </AnimatedSection>
    </div>
  );
}

function CameraSection({ isOpen, onToggle }: { isOpen: boolean; onToggle: () => void }) {
  const cameraFov = useEditorStore((s) => s.cameraFov);
  const setCameraFov = useEditorStore((s) => s.setCameraFov);
  const triggerCameraReset = useEditorStore((s) => s.triggerCameraReset);

  return (
    <div>
      <SectionHeader title="CAMERA" isOpen={isOpen} onToggle={onToggle} />
      <AnimatedSection isOpen={isOpen}>
        <div className="px-4 py-1 pb-3" style={{ borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
          <SliderRow label="FOV" value={cameraFov} onChange={setCameraFov} min={20} max={120} step={1} />
          <div className="pt-2">
            <ActionButton label="RESET CAMERA" onClick={triggerCameraReset} />
          </div>
        </div>
      </AnimatedSection>
    </div>
  );
}

function SceneSection({ isOpen, onToggle }: { isOpen: boolean; onToggle: () => void }) {
  const backgroundColor = useEditorStore((s) => s.backgroundColor);
  const setBackgroundColor = useEditorStore((s) => s.setBackgroundColor);
  const setUserSelectedBackground = useEditorStore((s) => s.setUserSelectedBackground);
  const sceneGridEnabled = useEditorStore((s) => s.sceneGridEnabled);
  const setSceneGridEnabled = useEditorStore((s) => s.setSceneGridEnabled);

  return (
    <div>
      <SectionHeader title="SCENE" isOpen={isOpen} onToggle={onToggle} />
      <AnimatedSection isOpen={isOpen}>
        <div className="px-4 py-1 pb-3" style={{ borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
          <div className="flex items-center justify-between py-2.5">
            <span className="text-[12px] tracking-[0.06em] text-white/50">BACKGROUND</span>
            <input
              type="color"
              value={backgroundColor.slice(0, 7)}
              onChange={(e) => {
                setUserSelectedBackground(true);
                setBackgroundColor(e.target.value);
              }}
              className="h-7 w-14 cursor-pointer rounded-sm border border-white/[0.12] bg-transparent"
            />
          </div>
          <Divider />
          <ToggleRow label="GRID" value={sceneGridEnabled} onChange={setSceneGridEnabled} />
        </div>
      </AnimatedSection>
    </div>
  );
}

function RotationSection({ isOpen, onToggle }: { isOpen: boolean; onToggle: () => void }) {
  const rotationSpeedX = useEditorStore((s) => s.rotationSpeedX);
  const setRotationSpeedX = useEditorStore((s) => s.setRotationSpeedX);
  const rotationSpeedY = useEditorStore((s) => s.rotationSpeedY);
  const setRotationSpeedY = useEditorStore((s) => s.setRotationSpeedY);
  const rotationSpeedZ = useEditorStore((s) => s.rotationSpeedZ);
  const setRotationSpeedZ = useEditorStore((s) => s.setRotationSpeedZ);

  return (
    <div>
      <SectionHeader title="ROTATION" isOpen={isOpen} onToggle={onToggle} />
      <AnimatedSection isOpen={isOpen}>
        <div className="px-4 py-1 pb-3" style={{ borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
          <SliderRow label="X SPEED" value={rotationSpeedX} onChange={setRotationSpeedX} min={-2} max={2} step={0.05} />
          <SliderRow label="Y SPEED" value={rotationSpeedY} onChange={setRotationSpeedY} min={-2} max={2} step={0.05} />
          <SliderRow label="Z SPEED" value={rotationSpeedZ} onChange={setRotationSpeedZ} min={-2} max={2} step={0.05} />
        </div>
      </AnimatedSection>
    </div>
  );
}

function PositionSection({ isOpen, onToggle }: { isOpen: boolean; onToggle: () => void }) {
  const positionOffsetX = useEditorStore((s) => s.positionOffsetX);
  const setPositionOffsetX = useEditorStore((s) => s.setPositionOffsetX);
  const positionOffsetY = useEditorStore((s) => s.positionOffsetY);
  const setPositionOffsetY = useEditorStore((s) => s.setPositionOffsetY);
  const positionOffsetZ = useEditorStore((s) => s.positionOffsetZ);
  const setPositionOffsetZ = useEditorStore((s) => s.setPositionOffsetZ);
  const resetPosition = useEditorStore((s) => s.resetPosition);

  return (
    <div>
      <SectionHeader title="POSITION" isOpen={isOpen} onToggle={onToggle} />
      <AnimatedSection isOpen={isOpen}>
        <div className="px-4 py-1 pb-3" style={{ borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
          <SliderRow label="X OFFSET" value={positionOffsetX} onChange={setPositionOffsetX} min={-100} max={100} step={1} />
          <SliderRow label="Y OFFSET" value={positionOffsetY} onChange={setPositionOffsetY} min={-100} max={100} step={1} />
          <SliderRow label="Z OFFSET" value={positionOffsetZ} onChange={setPositionOffsetZ} min={-100} max={100} step={1} />
          <div className="pt-2">
            <ActionButton label="RESET POSITION" onClick={resetPosition} />
          </div>
        </div>
      </AnimatedSection>
    </div>
  );
}

function DisplaySection({ isOpen, onToggle }: { isOpen: boolean; onToggle: () => void }) {
  const backgroundColor = useEditorStore((s) => s.backgroundColor);
  const setBackgroundColor = useEditorStore((s) => s.setBackgroundColor);
  const useBloom = useEditorStore((s) => s.useBloom);
  const setUseBloom = useEditorStore((s) => s.setUseBloom);
  const bloomIntensity = useEditorStore((s) => s.bloomIntensity);
  const setBloomIntensity = useEditorStore((s) => s.setBloomIntensity);

  return (
    <div>
      <SectionHeader title="DISPLAY" isOpen={isOpen} onToggle={onToggle} />
      <AnimatedSection isOpen={isOpen}>
        <div className="px-4 py-1 pb-3" style={{ borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
          <div className="flex items-center justify-between py-2.5">
            <span className="text-[12px] tracking-[0.06em] text-white/50">BACKGROUND</span>
            <input
              type="color"
              value={backgroundColor}
              onChange={(e) => setBackgroundColor(e.target.value)}
              className="h-7 w-14 cursor-pointer rounded-sm border border-white/[0.12] bg-transparent"
            />
          </div>
          <Divider />
          <ToggleRow label="BLOOM" value={useBloom} onChange={setUseBloom} />
          <AnimatedSection isOpen={useBloom}>
            <SliderRow label="INTENSITY" value={bloomIntensity} onChange={setBloomIntensity} min={0} max={3} step={0.1} />
          </AnimatedSection>
        </div>
      </AnimatedSection>
    </div>
  );
}
