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
  const decimals = step < 0.1 ? 2 : step < 1 ? 1 : 0;
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
