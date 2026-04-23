"use client";

import { useMemo, useState } from "react";
import { Code2, Copy, Check, ChevronDown } from "lucide-react";
import { useEditorStore } from "@/lib/store";
import { toast } from "sonner";

function AnimatedSection({ isOpen, children }: { isOpen: boolean; children: React.ReactNode }) {
  return (
    <div className={`grid transition-all duration-300 ease-out ${isOpen ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"}`}>
      <div className="overflow-hidden">{children}</div>
    </div>
  );
}

interface CodeOpts {
  svgData: string;
  depth: number;
  bevelEnabled: boolean;
  bevelThickness: number;
  bevelSize: number;
  bevelSegments: number;
  roughness: number;
  metalness: number;
  clearcoat: number;
  transmission: number;
  envMapIntensity: number;
  useCustomColor: boolean;
  customColor: string;
  backgroundColor: string;
  autoRotate: boolean;
  autoRotateSpeed: number;
  useBloom: boolean;
  bloomIntensity: number;
  // New
  lightAngle: number;
  effectType: "none" | "ascii";
  asciiSize: number;
  asciiBrightness: number;
  asciiSpacing: number;
  asciiShape: string;
  asciiColorMode: string;
  ppBloomEnabled: boolean;
  ppBloomStrength: number;
  ppChromaticEnabled: boolean;
  ppChromaticOffset: number;
  ppFilmEnabled: boolean;
  ppFilmIntensity: number;
  exposure: number;
  contrast: number;
  saturation: number;
  cameraFov: number;
  sceneGridEnabled: boolean;
  rotationSpeedX: number;
  rotationSpeedY: number;
  rotationSpeedZ: number;
  positionOffsetX: number;
  positionOffsetY: number;
  positionOffsetZ: number;
}

function generateHTML(o: CodeOpts): string {
  const curveSegs = Math.max(32, o.bevelSegments * 4);

  const hasColorGrade = Math.abs(o.contrast - 1) > 0.001 || Math.abs(o.saturation - 1) > 0.001;
  const useComposer =
    o.useBloom || o.ppBloomEnabled || o.ppChromaticEnabled || o.ppFilmEnabled || hasColorGrade;

  // Use the `postprocessing` library (same one the live preview uses via
  // @react-three/postprocessing) so Bloom / Chromatic Aberration / Film Grain /
  // Contrast / Saturation match the editor pixel-for-pixel. UnrealBloomPass
  // from three/addons has a very different look and is avoided here.
  const ppImports: string[] = [];
  if (useComposer) {
    const names = ["EffectComposer", "RenderPass", "EffectPass"];
    if (o.useBloom || o.ppBloomEnabled) names.push("BloomEffect");
    if (o.ppChromaticEnabled) names.push("ChromaticAberrationEffect");
    if (o.ppFilmEnabled) names.push("NoiseEffect", "BlendFunction");
    if (hasColorGrade) {
      names.push("BrightnessContrastEffect", "HueSaturationEffect");
    }
    ppImports.push(
      `import { ${names.join(", ")} } from 'postprocessing';`,
    );
  }

  const autoRotateCode = o.autoRotate
    ? `controls.autoRotate = true;\ncontrols.autoRotateSpeed = ${o.autoRotateSpeed.toFixed(1)};`
    : `// controls.autoRotate = true;`;

  const materialBlock = o.useCustomColor
    ? `// Single color for all paths
const sharedMaterial = new THREE.MeshPhysicalMaterial({
  color: new THREE.Color('${o.customColor}'),
  roughness: ${o.roughness.toFixed(2)},
  metalness: ${o.metalness.toFixed(2)},
  clearcoat: ${o.clearcoat.toFixed(2)},
  transmission: ${o.transmission.toFixed(2)},
  ior: 1.5,
  envMapIntensity: ${o.envMapIntensity.toFixed(1)},
  side: THREE.DoubleSide,
});`
    : `// Base material properties (color comes from each SVG path)
const matProps = {
  roughness: ${o.roughness.toFixed(2)},
  metalness: ${o.metalness.toFixed(2)},
  clearcoat: ${o.clearcoat.toFixed(2)},
  transmission: ${o.transmission.toFixed(2)},
  ior: 1.5,
  envMapIntensity: ${o.envMapIntensity.toFixed(1)},
  side: THREE.DoubleSide,
};`;

  const meshBlock = o.useCustomColor
    ? `svgData.paths.forEach((path) => {
  SVGLoader.createShapes(path).forEach((shape) => {
    const geo = new THREE.ExtrudeGeometry(shape, extrudeSettings);
    group.add(new THREE.Mesh(geo, sharedMaterial));
  });
});`
    : `svgData.paths.forEach((path) => {
  const fill = path.userData?.style?.fill;
  const color = fill && fill !== 'none' ? fill : '#888888';
  const mat = new THREE.MeshPhysicalMaterial({ ...matProps, color: new THREE.Color(color) });
  SVGLoader.createShapes(path).forEach((shape) => {
    const geo = new THREE.ExtrudeGeometry(shape, extrudeSettings);
    group.add(new THREE.Mesh(geo, mat));
  });
});`;

  const gridBlock = o.sceneGridEnabled
    ? `// Grid
const grid = new THREE.GridHelper(400, 40, 0xffffff, 0x444444);
grid.position.y = -40;
scene.add(grid);`
    : "";

  // No custom shader needed - postprocessing library ships BrightnessContrastEffect
  // and HueSaturationEffect that match exactly what the editor preview uses.
  const colorGradeShader = "";

  const composerSetup = useComposer
    ? `
// ─── Post-Processing Composer (postprocessing library, 1:1 with editor) ─────
const composer = new EffectComposer(renderer);
composer.setSize(window.innerWidth, window.innerHeight);
composer.setPixelRatio(window.devicePixelRatio);
composer.addPass(new RenderPass(scene, camera));

const _effects = [];
${
  o.useBloom
    ? `_effects.push(new BloomEffect({
  intensity: ${(o.bloomIntensity * 0.8).toFixed(2)},
  luminanceThreshold: 0.9,
  luminanceSmoothing: 0.3,
  mipmapBlur: true,
  radius: 0.4,
}));`
    : ""
}${
        o.ppBloomEnabled
          ? `
_effects.push(new BloomEffect({
  intensity: ${o.ppBloomStrength.toFixed(2)},
  luminanceThreshold: 0.6,
  luminanceSmoothing: 0.4,
  mipmapBlur: true,
  radius: 0.7,
}));`
          : ""
      }${
        o.ppChromaticEnabled
          ? `
_effects.push(new ChromaticAberrationEffect({
  offset: new THREE.Vector2(${o.ppChromaticOffset.toFixed(4)}, ${o.ppChromaticOffset.toFixed(4)}),
  radialModulation: false,
  modulationOffset: 0,
}));`
          : ""
      }${
        o.ppFilmEnabled
          ? `
const _noise = new NoiseEffect({
  blendFunction: BlendFunction.OVERLAY,
  premultiply: true,
});
_noise.blendMode.opacity.value = ${o.ppFilmIntensity.toFixed(2)};
_effects.push(_noise);`
          : ""
      }${
        hasColorGrade
          ? `
_effects.push(new BrightnessContrastEffect({ brightness: 0, contrast: ${(o.contrast - 1).toFixed(2)} }));
_effects.push(new HueSaturationEffect({ saturation: ${(o.saturation - 1).toFixed(2)}, hue: 0 }));`
          : ""
      }

composer.addPass(new EffectPass(camera, ..._effects));`
    : "";

  const renderCall = useComposer ? "composer.render();" : "renderer.render(scene, camera);";
  const resizeComposer = useComposer
    ? "\n  composer.setSize(window.innerWidth, window.innerHeight);"
    : "";

  const rotationBlock =
    o.rotationSpeedX !== 0 || o.rotationSpeedY !== 0 || o.rotationSpeedZ !== 0
      ? `
  // Per-axis rotation from Rotation panel
  group.rotation.x += ${o.rotationSpeedX.toFixed(3)} * delta;
  group.rotation.y += ${o.rotationSpeedY.toFixed(3)} * delta;
  group.rotation.z += ${o.rotationSpeedZ.toFixed(3)} * delta;`
      : "";

  const asciiBlock =
    o.effectType === "ascii"
      ? `
// ─── ASCII Overlay ─────────────────────────────────────
const asciiCanvas = document.createElement('canvas');
asciiCanvas.style.cssText = 'position:fixed;inset:0;width:100%;height:100%;pointer-events:none;z-index:5;';
document.body.appendChild(asciiCanvas);
const asciiCtx = asciiCanvas.getContext('2d');
const sampleCanvas = document.createElement('canvas');
const sampleCtx = sampleCanvas.getContext('2d', { willReadFrequently: true });
const ASCII_SIZE = ${o.asciiSize};
const ASCII_BRIGHTNESS = ${o.asciiBrightness};
const ASCII_SPACING = ${o.asciiSpacing};
const ASCII_SHAPE = '${o.asciiShape}';
const ASCII_COLOR = '${o.asciiColorMode}';
const ASCII_BG = '${o.backgroundColor}';
const ASCII_SHAPES = ['Blocks','Circles','Lines','Diagonal','Cross','Diamond','Hash'];
function drawAsciiShape(ctx, x, y, size, shape) {
  const half = size / 2;
  switch (shape) {
    case 'Blocks': ctx.fillRect(x-half, y-half, size, size); break;
    case 'Circles': ctx.beginPath(); ctx.arc(x, y, half, 0, Math.PI*2); ctx.fill(); break;
    case 'Lines': ctx.fillRect(x-half, y-Math.max(1,size*.18), size, Math.max(1,size*.36)); break;
    case 'Diagonal': ctx.save(); ctx.translate(x,y); ctx.rotate(Math.PI/4); ctx.fillRect(-half, -Math.max(1,size*.18), size, Math.max(1,size*.36)); ctx.restore(); break;
    case 'Cross': { const t=Math.max(1,size*.22); ctx.fillRect(x-half, y-t/2, size, t); ctx.fillRect(x-t/2, y-half, t, size); break; }
    case 'Diamond': ctx.beginPath(); ctx.moveTo(x,y-half); ctx.lineTo(x+half,y); ctx.lineTo(x,y+half); ctx.lineTo(x-half,y); ctx.closePath(); ctx.fill(); break;
    case 'Hash': { const t=Math.max(1,size*.14); const g=size*.28; ctx.fillRect(x-half, y-g-t/2, size, t); ctx.fillRect(x-half, y+g-t/2, size, t); ctx.fillRect(x-g-t/2, y-half, t, size); ctx.fillRect(x+g-t/2, y-half, t, size); break; }
    default: ctx.fillRect(x-half, y-half, size, size);
  }
}
function updateAscii() {
  const src = renderer.domElement;
  const sw = src.width, sh = src.height;
  if (!sw || !sh) return;
  const cell = Math.max(2, ASCII_SIZE + ASCII_SPACING);
  const cols = Math.max(1, Math.floor(sw / cell));
  const rows = Math.max(1, Math.floor(sh / cell));
  sampleCanvas.width = cols; sampleCanvas.height = rows;
  try { sampleCtx.drawImage(src, 0, 0, cols, rows); } catch { return; }
  const data = sampleCtx.getImageData(0, 0, cols, rows).data;
  if (asciiCanvas.width !== sw) asciiCanvas.width = sw;
  if (asciiCanvas.height !== sh) asciiCanvas.height = sh;
  asciiCtx.fillStyle = ASCII_BG; asciiCtx.fillRect(0, 0, sw, sh);
  for (let row = 0; row < rows; row++) for (let col = 0; col < cols; col++) {
    const i = (row*cols+col)*4, r=data[i], g=data[i+1], b=data[i+2], a=data[i+3];
    if (a < 8) continue;
    const lum = (r*.299 + g*.587 + b*.114) / 255;
    const intensity = Math.min(1, lum * ASCII_BRIGHTNESS * .6);
    if (intensity < .04) continue;
    const px = col*cell + cell/2, py = row*cell + cell/2;
    const dsz = Math.max(1, cell * intensity);
    let s = ASCII_SHAPE;
    if (s === 'Mixed') { const h = (col*73856093) ^ (row*19349663); s = ASCII_SHAPES[Math.abs(h) % ASCII_SHAPES.length]; }
    if (ASCII_COLOR === 'duotone') {
      const t=intensity, c1=[0,229,255], c2=[255,80,180];
      asciiCtx.fillStyle = 'rgb('+Math.round(c2[0]+(c1[0]-c2[0])*t)+','+Math.round(c2[1]+(c1[1]-c2[1])*t)+','+Math.round(c2[2]+(c1[2]-c2[2])*t)+')';
    } else if (ASCII_COLOR === 'randomize') {
      asciiCtx.fillStyle = 'hsl('+(Math.abs(col*2654435761+row*40503)%360)+',95%,60%)';
    } else {
      asciiCtx.fillStyle = 'rgb('+r+','+g+','+b+')';
    }
    drawAsciiShape(asciiCtx, px, py, dsz, s);
  }
}`
      : "";

  const safeSvg = o.svgData.replace(/`/g, "\\`").replace(/\$/g, "\\$");

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>3D Model</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    html, body { background: ${o.backgroundColor}; overflow: hidden; width: 100%; height: 100%; }
  </style>
</head>
<body>

<!-- Import map — no npm needed, works directly in browser -->
<script type="importmap">
{
  "imports": {
    "three": "https://cdn.jsdelivr.net/npm/three@0.170.0/build/three.module.js",
    "three/addons/": "https://cdn.jsdelivr.net/npm/three@0.170.0/examples/jsm/"${useComposer ? ',\n    "postprocessing": "https://cdn.jsdelivr.net/npm/postprocessing@6.38.0/build/postprocessing.esm.js"' : ""}
  }
}
</script>

<script type="module">
import * as THREE from 'three';
import { SVGLoader } from 'three/addons/loaders/SVGLoader.js';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
${ppImports.join("\n")}
${colorGradeShader}

// ─── Renderer ─────────────────────────────────────────
const renderer = new THREE.WebGLRenderer({ antialias: true, preserveDrawingBuffer: ${o.effectType === "ascii"} });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(window.devicePixelRatio);
renderer.toneMapping = THREE.AgXToneMapping;
renderer.toneMappingExposure = ${o.exposure.toFixed(2)};
renderer.outputColorSpace = THREE.SRGBColorSpace;
document.body.appendChild(renderer.domElement);

// ─── Scene & Camera ───────────────────────────────────
const scene = new THREE.Scene();
scene.background = new THREE.Color('${o.backgroundColor}');

// Studio environment — makes metallic/PBR materials look correct
const pmrem = new THREE.PMREMGenerator(renderer);
scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
pmrem.dispose();

const camera = new THREE.PerspectiveCamera(
  ${o.cameraFov}, window.innerWidth / window.innerHeight, 0.1, 2000
);
camera.position.set(0, 0, 150);

// ─── Controls ─────────────────────────────────────────
const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.dampingFactor = 0.05;
${autoRotateCode}

// ─── Lighting ─────────────────────────────────────────
scene.add(new THREE.AmbientLight(0xffffff, 0.4));

// Main directional light — position derived from lighting-bar angle
const mainLight = new THREE.DirectionalLight(0xffffff, 2.0);
const lightAngle = ${o.lightAngle.toFixed(4)};
const lightRadius = 50;
mainLight.position.set(
  Math.sin(lightAngle) * lightRadius,
  Math.cos(lightAngle) * lightRadius * 0.5 + 10,
  Math.cos(lightAngle) * lightRadius
);
mainLight.lookAt(0, 0, 0);
scene.add(mainLight);

// Fill light
const fillLight = new THREE.DirectionalLight(0xd4edff, 0.5);
fillLight.position.set(-10, -10, -5);
scene.add(fillLight);

${gridBlock}

// ─── Material ─────────────────────────────────────────
${materialBlock}

// ─── Extrude Settings ─────────────────────────────────
const extrudeSettings = {
  depth: ${(o.depth * 5).toFixed(1)},
  bevelEnabled: ${o.bevelEnabled},
  bevelThickness: ${o.bevelThickness.toFixed(1)},
  bevelSize: ${o.bevelSize.toFixed(1)},
  bevelSegments: ${Math.max(4, o.bevelSegments)},
  curveSegments: ${curveSegs},
};

// ─── SVG → 3D ─────────────────────────────────────────
const svgString = \`${safeSvg}\`;

const loader = new SVGLoader();
const svgData = loader.parse(svgString);
const group = new THREE.Group();

${meshBlock}

// Normalize scale (fit into ~100 unit cube) and flip Y axis
const bbox = new THREE.Box3().setFromObject(group);
const bsize = bbox.getSize(new THREE.Vector3());
const bCenter = bbox.getCenter(new THREE.Vector3());
const svgScale = 100 / Math.max(bsize.x, bsize.y, 0.001);

group.scale.set(svgScale, -svgScale, svgScale);
group.position.set(
  -bCenter.x * svgScale + ${o.positionOffsetX},
  bCenter.y * svgScale + ${o.positionOffsetY},
  ${o.positionOffsetZ}
);

scene.add(group);
${composerSetup}
${asciiBlock}
// ─── Resize ───────────────────────────────────────────
window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);${resizeComposer}
});

// ─── Animate ──────────────────────────────────────────
const clock = new THREE.Clock();
(function animate() {
  requestAnimationFrame(animate);
  const delta = clock.getDelta();${rotationBlock}
  controls.update();
  ${renderCall}${
    o.effectType === "ascii" ? "\n  updateAscii();" : ""
  }
})();
</script>
</body>
</html>`;
}

export function CodeExport({
  activeSection,
  onSectionChange,
}: {
  activeSection: string | null;
  onSectionChange: (section: string | null) => void;
}) {
  const isOpen = activeSection === "code";
  const [copied, setCopied] = useState(false);

  const svgData = useEditorStore((s) => s.svgData);
  const depth = useEditorStore((s) => s.depth);
  const bevelEnabled = useEditorStore((s) => s.bevelEnabled);
  const bevelThickness = useEditorStore((s) => s.bevelThickness);
  const bevelSize = useEditorStore((s) => s.bevelSize);
  const bevelSegments = useEditorStore((s) => s.bevelSegments);
  const roughness = useEditorStore((s) => s.roughness);
  const metalness = useEditorStore((s) => s.metalness);
  const clearcoat = useEditorStore((s) => s.clearcoat);
  const transmission = useEditorStore((s) => s.transmission);
  const envMapIntensity = useEditorStore((s) => s.envMapIntensity);
  const useCustomColor = useEditorStore((s) => s.useCustomColor);
  const customColor = useEditorStore((s) => s.customColor);
  const backgroundColor = useEditorStore((s) => s.backgroundColor);
  const autoRotate = useEditorStore((s) => s.autoRotate);
  const autoRotateSpeed = useEditorStore((s) => s.autoRotateSpeed);
  const useBloom = useEditorStore((s) => s.useBloom);
  const bloomIntensity = useEditorStore((s) => s.bloomIntensity);

  // New state
  const lightAngle = useEditorStore((s) => s.lightAngle);
  const effectType = useEditorStore((s) => s.effectType);
  const asciiSize = useEditorStore((s) => s.asciiSize);
  const asciiBrightness = useEditorStore((s) => s.asciiBrightness);
  const asciiSpacing = useEditorStore((s) => s.asciiSpacing);
  const asciiShape = useEditorStore((s) => s.asciiShape);
  const asciiColorMode = useEditorStore((s) => s.asciiColorMode);
  const ppBloomEnabled = useEditorStore((s) => s.ppBloomEnabled);
  const ppBloomStrength = useEditorStore((s) => s.ppBloomStrength);
  const ppChromaticEnabled = useEditorStore((s) => s.ppChromaticEnabled);
  const ppChromaticOffset = useEditorStore((s) => s.ppChromaticOffset);
  const ppFilmEnabled = useEditorStore((s) => s.ppFilmEnabled);
  const ppFilmIntensity = useEditorStore((s) => s.ppFilmIntensity);
  const exposure = useEditorStore((s) => s.exposure);
  const contrast = useEditorStore((s) => s.contrast);
  const saturation = useEditorStore((s) => s.saturation);
  const cameraFov = useEditorStore((s) => s.cameraFov);
  const sceneGridEnabled = useEditorStore((s) => s.sceneGridEnabled);
  const rotationSpeedX = useEditorStore((s) => s.rotationSpeedX);
  const rotationSpeedY = useEditorStore((s) => s.rotationSpeedY);
  const rotationSpeedZ = useEditorStore((s) => s.rotationSpeedZ);
  const positionOffsetX = useEditorStore((s) => s.positionOffsetX);
  const positionOffsetY = useEditorStore((s) => s.positionOffsetY);
  const positionOffsetZ = useEditorStore((s) => s.positionOffsetZ);

  const code = useMemo(() => {
    if (!svgData) return null;
    return generateHTML({
      svgData, depth, bevelEnabled, bevelThickness, bevelSize, bevelSegments,
      roughness, metalness, clearcoat, transmission, envMapIntensity,
      useCustomColor, customColor, backgroundColor,
      autoRotate, autoRotateSpeed, useBloom, bloomIntensity,
      lightAngle, effectType, asciiSize, asciiBrightness, asciiSpacing, asciiShape, asciiColorMode,
      ppBloomEnabled, ppBloomStrength, ppChromaticEnabled, ppChromaticOffset, ppFilmEnabled, ppFilmIntensity,
      exposure, contrast, saturation,
      cameraFov, sceneGridEnabled,
      rotationSpeedX, rotationSpeedY, rotationSpeedZ,
      positionOffsetX, positionOffsetY, positionOffsetZ,
    });
  }, [
    svgData, depth, bevelEnabled, bevelThickness, bevelSize, bevelSegments,
    roughness, metalness, clearcoat, transmission, envMapIntensity,
    useCustomColor, customColor, backgroundColor,
    autoRotate, autoRotateSpeed, useBloom, bloomIntensity,
    lightAngle, effectType, asciiSize, asciiBrightness, asciiSpacing, asciiShape, asciiColorMode,
    ppBloomEnabled, ppBloomStrength, ppChromaticEnabled, ppChromaticOffset, ppFilmEnabled, ppFilmIntensity,
    exposure, contrast, saturation,
    cameraFov, sceneGridEnabled,
    rotationSpeedX, rotationSpeedY, rotationSpeedZ,
    positionOffsetX, positionOffsetY, positionOffsetZ,
  ]);

  const handleCopy = async () => {
    if (!code) return;
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      toast.success("CODE COPIED");
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error("COPY FAILED");
    }
  };

  const handleDownload = () => {
    if (!code) return;
    const blob = new Blob([code], { type: "text/html" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "make3d-scene.html";
    a.click();
    URL.revokeObjectURL(url);
    toast.success("HTML DOWNLOADED");
  };

  // Don't render section at all when no SVG is loaded
  if (!svgData) return null;

  return (
    <div style={{ borderTop: "1px solid rgba(255,255,255,0.06)" }}>
      {/* Header toggle */}
      <button
        onClick={() => onSectionChange(isOpen ? null : "code")}
        className="flex w-full items-center justify-between px-4 py-3 font-mono uppercase transition-all duration-200 hover:bg-white/[0.03]">
        <div className="flex items-center gap-2">
          <Code2 className="h-4 w-4 text-white/30" />
          <span className={`text-[13px] font-medium tracking-[0.08em] transition-colors ${isOpen ? "text-white" : "text-white/55"}`}>
            GET CODE
          </span>
        </div>
        <ChevronDown
          className={`h-4 w-4 transition-all duration-300 ${isOpen ? "rotate-180 text-white/60" : "text-white/30"}`}
        />
      </button>

      <AnimatedSection isOpen={isOpen}>
        <div className="px-3 pb-4 pt-1 font-mono" style={{ borderTop: "1px solid rgba(255,255,255,0.06)" }}>
          <p className="mb-3 text-[11px] leading-relaxed tracking-[0.05em] text-white/35 uppercase">
            Live Three.js HTML · save as <span className="text-white/55">.html</span> · open in any browser
          </p>

          {/* Code block */}
          <div
            className="relative rounded-sm"
            style={{ background: "rgba(0,0,0,0.5)", border: "1px solid rgba(255,255,255,0.08)" }}>
            {/* Action buttons */}
            <div className="absolute right-2 top-2 z-10 flex gap-1.5">
              <button
                onClick={handleDownload}
                className="flex items-center gap-1.5 rounded-sm px-2 py-1 text-[11px] font-medium tracking-[0.06em] transition-all duration-200"
                style={{
                  background: "rgba(255,255,255,0.07)",
                  border: "1px solid rgba(255,255,255,0.12)",
                  color: "rgba(255,255,255,0.5)",
                }}>
                .HTML
              </button>
              <button
                onClick={handleCopy}
                className="flex items-center gap-1.5 rounded-sm px-2 py-1 text-[11px] font-medium tracking-[0.06em] transition-all duration-200"
                style={{
                  background: copied ? "rgba(255,255,255,0.15)" : "rgba(255,255,255,0.07)",
                  border: copied ? "1px solid rgba(255,255,255,0.4)" : "1px solid rgba(255,255,255,0.12)",
                  color: copied ? "rgba(255,255,255,0.9)" : "rgba(255,255,255,0.4)",
                }}>
                {copied ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
                {copied ? "COPIED" : "COPY"}
              </button>
            </div>

            {/* Scrollable preview */}
            <pre
              className="overflow-auto text-[9.5px] leading-[1.6] text-white/50"
              style={{
                padding: "12px 12px 12px 12px",
                paddingTop: "38px",
                maxHeight: "320px",
                scrollbarWidth: "thin",
                scrollbarColor: "rgba(255,255,255,0.1) transparent",
                whiteSpace: "pre",
                fontFamily: "'JetBrains Mono', 'Fira Code', 'Cascadia Code', monospace",
              }}>
              {code}
            </pre>
          </div>

          <p className="mt-2.5 text-[9.5px] leading-relaxed tracking-[0.06em] text-white/20 uppercase">
            Updates live · no npm needed · uses CDN Three.js · open in any browser
          </p>
        </div>
      </AnimatedSection>
    </div>
  );
}
