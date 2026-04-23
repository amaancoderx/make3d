<div align="center">

<img width="100%" alt="Make3D" src="./Logo.png" />

<br/>
<br/>

<strong>Transform any SVG into a stunning 3D model. Customize, preview, and export in seconds.</strong>

<br/>
<br/>

[![Next.js](https://img.shields.io/badge/Next.js-000000?style=flat-square&logo=nextdotjs&logoColor=white)](https://nextjs.org)
[![Three.js](https://img.shields.io/badge/Three.js-000000?style=flat-square&logo=threedotjs&logoColor=white)](https://threejs.org)
[![TypeScript](https://img.shields.io/badge/TypeScript-000000?style=flat-square&logo=typescript&logoColor=white)](https://www.typescriptlang.org)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-000000?style=flat-square&logo=tailwindcss&logoColor=white)](https://tailwindcss.com)
[![License: MIT](https://img.shields.io/badge/License-MIT-000000?style=flat-square)](./LICENSE)

</div>

<br/>

Make3D is a free, open-source browser tool that converts SVG files into interactive 3D models with cinematic post-processing, stylized effects, and real-time code generation. No installs, no accounts, no server uploads. Everything runs locally in your browser.

---

## Features

### Core

| Category | What you can do |
|---|---|
| **Geometry** | Control extrusion depth, bevel thickness, bevel size, and smoothness |
| **Materials** | PBR presets (Matte Metal, Brushed Metal, Polished Metal, Plastic, Glass) with fine control over roughness, metalness, and clearcoat |
| **Custom Color** | Override all SVG colors with a single color picker |
| **Environment** | 9 HDRI presets plus custom HDRI upload for realistic reflections |
| **Compare** | Drag a before/after slider between the flat SVG and the 3D result |

### Lighting, effects, and look

| Category | What you can do |
|---|---|
| **360 degree Lighting Bar** | Draggable handle on the right edge of the canvas rotates the main directional light around the model; highlights and shadows update in real time |
| **Effects - ASCII** | Render the scene as a dot/shape grid in 8 patterns (Mixed, Blocks, Circles, Lines, Diagonal, Cross, Diamond, Hash) with Original/Duotone/Randomize color modes, adjustable Size, Brightness, and Spacing |
| **Post-Processing** | Toggleable Bloom, Chromatic Aberration, and Film Grain. Combining Bloom with Chromatic Aberration produces the chrome/liquid-metal look |
| **Adjustments** | Real-time Exposure, Contrast, and Saturation for cinematic grading |
| **Camera** | FOV slider and one-click Reset Camera |
| **Scene** | Background color picker and toggleable grid floor |
| **Rotation** | Independent per-axis X / Y / Z speed sliders plus the classic auto-rotate toggle |
| **Position** | X / Y / Z offset sliders with Reset |

### Export

| Format | Details |
|---|---|
| **PNG** | Transparent background, rendered at 3x resolution, composites the ASCII overlay and all post-processing |
| **STL** | Mesh for 3D printing and CAD tools |
| **GLB** | Binary GLTF with PBR materials, textures, and color |
| **GLTF** | Text-based GLTF |
| **MP4** | Rotating video up to 60 seconds, captures every active effect |
| **GIF** | Animated GIF (capped at 10 seconds to keep file size sane) |
| **Get Code** | Live Three.js HTML file that mirrors every current setting and updates as you move sliders. Save as .html, open in any browser, no npm needed |

---

## Quick Start

```bash
# Clone the repo
git clone https://github.com/amaancoderx/make3d.git
cd make3d

# Install dependencies
npm install
# or
bun install

# Start the dev server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## How to Use

1. Drop an SVG file onto the canvas, click to upload, or paste SVG code directly
2. Adjust panels in the right sidebar: Geometry, Material, Environment, Effects, Post-Processing, Adjustments, Camera, Scene, Rotation, Position, Display
3. Drag the **lighting bar** handle on the right edge of the canvas to sweep the main light around the model
4. Use the **Compare** slider to see the original flat SVG next to the 3D render
5. Export as PNG, STL, GLB, GLTF, MP4, or GIF - exports include every active effect you see in the preview
6. Click **GET CODE** to copy or download a ready-to-run Three.js HTML file

---

## Panels at a Glance

```
GEOMETRY           depth, bevel
MATERIAL           preset, roughness, metalness, clearcoat, custom color
ENVIRONMENT        enabled, HDRI preset, intensity
EFFECTS            none | ASCII (size, brightness, spacing, shape, color mode)
POST-PROCESSING    Bloom, Chromatic Aberration, Film Grain
ADJUSTMENTS        exposure, contrast, saturation
CAMERA             FOV, reset
SCENE              background, grid
ROTATION           X speed, Y speed, Z speed
POSITION           X, Y, Z, reset
DISPLAY            background, bloom intensity
```

---

## Responsive Design

The editor is built for every form factor:

- **Mobile (< 768px)**: stacked layout with a bottom-sheet drawer for all controls, 44x44 touch target on the lighting bar so finger drags don't clash with model rotation
- **Tablet (768 - 1023px)**: side-by-side layout with a 272px sidebar
- **Laptop and desktop (1024px+)**: side-by-side layout with full canvas room

Uses `h-[100dvh]`, `env(safe-area-inset-bottom)`, and `viewport-fit=cover` so iPhone notches and URL-bar resizing behave correctly.

---

## Project Structure

```
make3d/
├── app/                        # Next.js App Router, layout, favicon
├── components/
│   ├── edit/                   # Panels, export, code generation
│   │   ├── minimal-controls    # All 11 side panels
│   │   ├── minimal-export      # PNG / MP4 / GIF / STL / GLB / GLTF
│   │   ├── code-export         # Live Three.js HTML generator
│   │   ├── ascii-overlay       # 2D ASCII effect overlay
│   │   └── lighting-bar        # 360 degree draggable light control
│   ├── modals/                 # Video result modal
│   ├── previews/               # Model preview, SVG parsing, env presets
│   ├── controls/               # Detailed control components
│   └── ui/                     # Shared UI primitives
├── hooks/                      # Custom React hooks (mobile, texture preloader)
├── lib/
│   ├── store.ts                # Zustand editor state
│   ├── exporters.ts            # PNG, STL, GLB, GLTF, video exporters
│   ├── video-recorder.ts       # MP4 / GIF capture via MediaRecorder and gif.js
│   ├── export-compositor.ts    # Composites WebGL + ASCII overlay for exports
│   ├── memory-manager.ts       # Three.js resource tracking
│   └── texture-cache.ts        # LRU texture cache
├── public/                     # Fonts, textures, logo
└── styles/                     # Global CSS
```

---

## Tech Stack

| Layer | Library |
|---|---|
| Framework | Next.js 16 (App Router, Turbopack) |
| 3D Rendering | Three.js, React Three Fiber, Drei |
| Post-Processing | @react-three/postprocessing, postprocessing |
| State | Zustand |
| Animation | Framer Motion |
| Styling | Tailwind CSS v4 |
| Language | TypeScript |
| Video / GIF | MediaRecorder API, gif.js |
| HDRI | @pmndrs/assets |

---

## Get Code Feature

The **GET CODE** panel generates a complete, standalone Three.js HTML file you can copy or download and open directly in any browser.

- Uses Three.js from a CDN via an import map, zero build step
- Emits only the code needed for what is currently enabled (no dead imports)
- Updates live as you move sliders
- Covers every feature the live preview does: lighting angle, bevel, material, environment, ASCII overlay, Bloom, Chromatic Aberration, Film Grain, exposure / contrast / saturation, camera FOV, grid, per-axis rotation, position offsets

Paste the HTML into any editor, save as `.html`, double-click, done.

---

## Export Fidelity

Every image and video export matches the on-screen preview:

- **Three.js post-processing** (Bloom, Chromatic Aberration, Film Grain, Contrast, Saturation, Exposure) runs inside the WebGL pipeline and is captured automatically
- **ASCII effect** is a 2D overlay on top of the WebGL canvas. At export time the compositor merges both canvases so the exported PNG / MP4 / GIF looks pixel-identical to the preview
- **STL / GLB / GLTF** export the raw mesh and PBR materials. Screen-space effects like ASCII and Bloom are not geometry and therefore cannot be encoded into a 3D file - this is standard for every 3D pipeline

---

## License

MIT License. See [LICENSE](./LICENSE) for details.

---

## Contributing

Pull requests are welcome. For major changes, open an issue first to discuss the direction. Please read [CONTRIBUTING.md](./CONTRIBUTING.md) before submitting.

---

<div align="center">

If you find Make3D useful, give it a star and share it with others.

</div>
