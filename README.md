# 🫀 HeartView – Coronary CT Plaque Viewer

A clean, single-page dashboard for viewing coronary CT (DICOM) images, scrolling along an artery, and drawing **ROI** annotations on plaque with **live measurements**. Built with **React**, **JavaScript** and **Cornerstone3D**.

> ⚠️ **Educational demo – not a medical device.** Not for diagnosis or clinical decisions. The bundled data is a **synthetic phantom** (no patient data).

## Features

- DICOM stack viewer (Cornerstone3D `StackViewport`) with mouse-wheel slice scrolling and a slice slider
- Tools: **Window/Level, Pan, Zoom, Length, Ellipse ROI, Rectangle ROI** (keyboard shortcuts `W P Z L E R`)
- Window presets for vessel/plaque work: Soft tissue, Vessel (CTA), Plaque, Calcium
- **Live measurements panel**: area (mm²), mean/SD HU, length (mm), slice number; click a row to jump to that slice
- Summary cards (ROI count, total area, average HU, longest length) and **CSV export**
- Demo-only plaque estimate from ROI mean HU: low-attenuation (<30), non-calcified (30–129), calcified (≥130)
- Load the built-in phantom, **drag & drop** DICOM files, or open a whole folder

## Quick start

Requires Node.js 18+.

```bash
npm install
npm run dev
```

Open http://localhost:5173 and click **Load demo phantom**. Scroll to roughly slices 6–12 (calcified plaque), 17–30 (soft plaque with a low-attenuation core) and 34–38 (calcified), then draw an ellipse ROI on the vessel near the bottom of the heart. Zoom in first (right-drag) for easier drawing.

Production build: `npm run build` (output in `dist/`, deployable to Vercel/Netlify as a standard Vite app).

## Using your own images

Click **Open DICOM files…** / **Open folder…** or drop files on the viewer. Slices are sorted by image position (then instance number). If several series are selected, the largest is shown.

Use **public, de-identified** data only, for example collections from [The Cancer Imaging Archive](https://www.cancerimagingarchive.net/) – check each collection's license and terms. Never load real patient data you are not authorized to use.

## Project structure

```
src/
  App.jsx                       layout, state, shortcuts, file loading
  components/
    Viewer.jsx                  Cornerstone rendering engine + viewport + overlays
    Toolbar.jsx                 tools, window presets, actions
    LoadPanel.jsx               demo / files / folder loading
    MeasurementsPanel.jsx       summary cards, table, CSV export
  cornerstone/
    init.js                     one-time Cornerstone core / loader / tools init
    tools.js                    tool registration, tool group, mouse bindings
    viewport.js                 viewport helpers (W/L, invert, reset, scroll)
    annotations.js              annotation helpers
  hooks/useMeasurements.js      live measurements from annotation events
  utils/
    dicomFiles.js               DICOM header parsing + imageId building
    plaque.js                   HU → plaque category (demo)
public/demo/                    40 synthetic DICOM slices
scripts/generate_demo_dicom.py  regenerates the phantom (numpy only)
```

Regenerate the demo data any time: `npm run demo-data` (needs Python 3 and numpy).

## Troubleshooting

- **Blank viewer / "could not start"** – the browser needs WebGL; try Chrome or Edge with hardware acceleration on.
- **Files won't load** – they must be valid DICOM images. Very unusual compressed transfer syntaxes may not decode.
- **Version issues** – Cornerstone3D is pinned to `^2.x` in `package.json`. APIs differ between major versions, so avoid upgrading to a new major without checking its migration guide.


## Disclaimer

HeartView is an educational portfolio project. Plaque categories are estimated from ROI mean HU purely for demonstration and must not be used for clinical purposes.
