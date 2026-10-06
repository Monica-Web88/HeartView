import { useCallback, useEffect, useState } from 'react';
import Toolbar from './components/Toolbar.jsx';
import Viewer from './components/Viewer.jsx';
import LoadPanel from './components/LoadPanel.jsx';
import MeasurementsPanel from './components/MeasurementsPanel.jsx';
import { useMeasurements } from './hooks/useMeasurements.js';
import { DEFAULT_TOOL, TOOLS, activateTool } from './cornerstone/tools.js';
import { clearAllAnnotations } from './cornerstone/annotations.js';
import { resetView, setWindowLevel, toggleInvert } from './cornerstone/viewport.js';
import { DEMO_SLICES, buildImageIdsFromFiles, demoImageIds } from './utils/dicomFiles.js';

export default function App() {
  const [imageIds, setImageIds] = useState([]);
  const [ready, setReady] = useState(false);
  const [busy, setBusy] = useState(false);
  const [activeTool, setActiveTool] = useState(DEFAULT_TOOL);
  const [status, setStatus] = useState({
    type: 'info',
    text: 'Start with the demo phantom, or open your own DICOM files.',
  });

  const { rows, refresh } = useMeasurements(imageIds, ready);
  const handleReady = useCallback(() => setReady(true), []);

  // Apply the selected tool to the viewport
  useEffect(() => {
    if (ready) activateTool(activeTool);
  }, [ready, activeTool]);

  // Keyboard shortcuts (W, P, Z, L, E, R)
  useEffect(() => {
    const onKey = (e) => {
      if (e.metaKey || e.ctrlKey || e.altKey) return;
      if (e.target instanceof Element && e.target.closest('input, select, textarea')) return;
      const tool = TOOLS.find((t) => t.key.toLowerCase() === e.key.toLowerCase());
      if (tool) setActiveTool(tool.name);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  const loadDemo = () => {
    setImageIds(demoImageIds());
    setStatus({
      type: 'ok',
      text: `Loaded synthetic coronary phantom (${DEMO_SLICES} slices). Scroll to find the plaque, then draw an ROI on the vessel.`,
    });
  };

  const loadFiles = async (files) => {
    if (!files?.length) return;
    setBusy(true);
    try {
      const { imageIds: ids, skipped, seriesCount } = await buildImageIdsFromFiles(files);
      setImageIds(ids);
      const notes = [];
      if (skipped) notes.push(`${skipped} non-DICOM file(s) skipped`);
      if (seriesCount > 1) notes.push(`${seriesCount} series found - showing the largest`);
      setStatus({
        type: 'ok',
        text: `Loaded ${ids.length} slices${notes.length ? ` (${notes.join('; ')})` : ''}.`,
      });
    } catch (err) {
      setStatus({ type: 'error', text: err.message || 'Could not read those files.' });
    } finally {
      setBusy(false);
    }
  };

  const hasImages = imageIds.length > 0;

  return (
    <div className="app">
      <header className="app-header">
        <div className="brand">
          <span className="brand-icon">🫀</span>
          <div>
            <h1>HeartView</h1>
            <p>Coronary CT plaque viewer · React + Cornerstone3D</p>
          </div>
        </div>
        <span className="pill">Educational demo – not a medical device</span>
      </header>

      <main className="layout">
        <section className="viewer-area">
          <Toolbar
            activeTool={activeTool}
            onSelectTool={setActiveTool}
            onPreset={(p) => setWindowLevel(p.width, p.level)}
            onInvert={toggleInvert}
            onReset={resetView}
            onClear={() => {
              clearAllAnnotations();
              refresh();
            }}
            disabled={!hasImages}
          />
          <Viewer imageIds={imageIds} onReady={handleReady} onDropFiles={loadFiles} />
        </section>

        <aside className="sidebar">
          <LoadPanel onLoadDemo={loadDemo} onLoadFiles={loadFiles} busy={busy} status={status} />
          <MeasurementsPanel rows={rows} onChanged={refresh} />
        </aside>
      </main>
    </div>
  );
}
