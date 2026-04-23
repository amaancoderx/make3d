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

function generateHTML(opts: {
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
}): string {
  const {
    svgData, depth, bevelEnabled, bevelThickness, bevelSize, bevelSegments,
    roughness, metalness, clearcoat, transmission, envMapIntensity,
    useCustomColor, customColor, backgroundColor,
    autoRotate, autoRotateSpeed, useBloom, bloomIntensity,
  } = opts;

  const curveSegs = Math.max(32, bevelSegments * 4);

  const bloomImport = useBloom
    ? `import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';`
    : "";

  const bloomSetup = useBloom
    ? `
// Bloom post-processing
const composer = new EffectComposer(renderer);
composer.addPass(new RenderPass(scene, camera));
composer.addPass(new UnrealBloomPass(
  new THREE.Vector2(window.innerWidth, window.innerHeight),
  ${bloomIntensity.toFixed(1)}, 0.4, 0.85
));`
    : "";

  const autoRotateCode = autoRotate
    ? `controls.autoRotate = true;\ncontrols.autoRotateSpeed = ${autoRotateSpeed.toFixed(1)};`
    : `// controls.autoRotate = true;`;

  const renderCall = useBloom ? "composer.render();" : "renderer.render(scene, camera);";
  const resizeBloom = useBloom ? "\n  composer.setSize(window.innerWidth, window.innerHeight);" : "";

  const materialBlock = useCustomColor
    ? `// Single color for all paths
const sharedMaterial = new THREE.MeshPhysicalMaterial({
  color: new THREE.Color('${customColor}'),
  roughness: ${roughness.toFixed(2)},
  metalness: ${metalness.toFixed(2)},
  clearcoat: ${clearcoat.toFixed(2)},
  transmission: ${transmission.toFixed(2)},
  ior: 1.5,
  envMapIntensity: ${envMapIntensity.toFixed(1)},
  side: THREE.DoubleSide,
});`
    : `// Base material properties (color comes from each SVG path)
const matProps = {
  roughness: ${roughness.toFixed(2)},
  metalness: ${metalness.toFixed(2)},
  clearcoat: ${clearcoat.toFixed(2)},
  transmission: ${transmission.toFixed(2)},
  ior: 1.5,
  envMapIntensity: ${envMapIntensity.toFixed(1)},
  side: THREE.DoubleSide,
};`;

  const meshBlock = useCustomColor
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

  // Escape backticks in the SVG for template literal safety
  const safeSvg = svgData.replace(/`/g, "\\`").replace(/\$/g, "\\$");

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>3D Model</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { background: ${backgroundColor}; overflow: hidden; }
  </style>
</head>
<body>

<!-- Import map — no npm needed, works directly in browser -->
<script type="importmap">
{
  "imports": {
    "three": "https://cdn.jsdelivr.net/npm/three@0.170.0/build/three.module.js",
    "three/addons/": "https://cdn.jsdelivr.net/npm/three@0.170.0/examples/jsm/"
  }
}
</script>

<script type="module">
import * as THREE from 'three';
import { SVGLoader } from 'three/addons/loaders/SVGLoader.js';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
${bloomImport}

// ─── Renderer ─────────────────────────────────────────
const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(window.devicePixelRatio);
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1;
document.body.appendChild(renderer.domElement);

// ─── Scene & Camera ───────────────────────────────────
const scene = new THREE.Scene();
scene.background = new THREE.Color('${backgroundColor}');

// Studio environment — makes metallic/PBR materials look correct
const pmrem = new THREE.PMREMGenerator(renderer);
scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
pmrem.dispose();

const camera = new THREE.PerspectiveCamera(
  45, window.innerWidth / window.innerHeight, 0.1, 2000
);
camera.position.set(0, 0, 200);
${bloomSetup}
// ─── Controls ─────────────────────────────────────────
const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.dampingFactor = 0.05;
${autoRotateCode}

// ─── Lighting ─────────────────────────────────────────
scene.add(new THREE.AmbientLight(0xffffff, 0.3));
const sun = new THREE.DirectionalLight(0xffffff, 1.2);
sun.position.set(5, 10, 8);
scene.add(sun);
const fill = new THREE.DirectionalLight(0xffffff, 0.3);
fill.position.set(-5, -3, -5);
scene.add(fill);

// ─── Material ─────────────────────────────────────────
${materialBlock}

// ─── Extrude Settings ─────────────────────────────────
const extrudeSettings = {
  depth: ${depth.toFixed(1)},
  bevelEnabled: ${bevelEnabled},
  bevelThickness: ${bevelThickness.toFixed(1)},
  bevelSize: ${bevelSize.toFixed(1)},
  bevelSegments: ${Math.max(4, bevelSegments)},
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
// Center: after Y-flip, subtract scaled center (Y sign reverses)
group.position.set(-bCenter.x * svgScale, bCenter.y * svgScale, 0);

scene.add(group);

// ─── Resize ───────────────────────────────────────────
window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);${resizeBloom}
});

// ─── Animate ──────────────────────────────────────────
(function animate() {
  requestAnimationFrame(animate);
  controls.update();
  ${renderCall}
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

  const code = useMemo(() => {
    if (!svgData) return null;
    return generateHTML({
      svgData, depth, bevelEnabled, bevelThickness, bevelSize, bevelSegments,
      roughness, metalness, clearcoat, transmission, envMapIntensity,
      useCustomColor, customColor, backgroundColor,
      autoRotate, autoRotateSpeed, useBloom, bloomIntensity,
    });
  }, [
    svgData, depth, bevelEnabled, bevelThickness, bevelSize, bevelSegments,
    roughness, metalness, clearcoat, transmission, envMapIntensity,
    useCustomColor, customColor, backgroundColor,
    autoRotate, autoRotateSpeed, useBloom, bloomIntensity,
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
            Complete HTML file · save as <span className="text-white/55">.html</span> · open in browser
          </p>

          {/* Code block */}
          <div
            className="relative rounded-sm"
            style={{ background: "rgba(0,0,0,0.5)", border: "1px solid rgba(255,255,255,0.08)" }}>
            {/* Copy button */}
            <button
              onClick={handleCopy}
              className="absolute right-2 top-2 z-10 flex items-center gap-1.5 rounded-sm px-2 py-1 text-[11px] font-medium tracking-[0.06em] transition-all duration-200"
              style={{
                background: copied ? "rgba(255,255,255,0.15)" : "rgba(255,255,255,0.07)",
                border: copied ? "1px solid rgba(255,255,255,0.4)" : "1px solid rgba(255,255,255,0.12)",
                color: copied ? "rgba(255,255,255,0.9)" : "rgba(255,255,255,0.4)",
              }}>
              {copied ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
              {copied ? "COPIED" : "COPY"}
            </button>

            {/* Scrollable preview */}
            <pre
              className="overflow-auto text-[9.5px] leading-[1.6] text-white/50"
              style={{
                padding: "12px 12px 12px 12px",
                maxHeight: "260px",
                scrollbarWidth: "thin",
                scrollbarColor: "rgba(255,255,255,0.1) transparent",
                whiteSpace: "pre",
                fontFamily: "'JetBrains Mono', 'Fira Code', 'Cascadia Code', monospace",
              }}>
              {code}
            </pre>
          </div>

          <p className="mt-2.5 text-[9.5px] leading-relaxed tracking-[0.06em] text-white/20 uppercase">
            Updates live · no npm needed · uses CDN Three.js
          </p>
        </div>
      </AnimatedSection>
    </div>
  );
}
