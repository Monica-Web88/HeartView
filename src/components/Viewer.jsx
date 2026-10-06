import { useCallback, useEffect, useRef, useState } from 'react';
import { RenderingEngine, Enums } from '@cornerstonejs/core';
import { initCornerstone } from '../cornerstone/init.js';
import { createToolGroup, destroyToolGroup } from '../cornerstone/tools.js';
import { clearAllAnnotations } from '../cornerstone/annotations.js';
import {
  RENDERING_ENGINE_ID,
  VIEWPORT_ID,
  getViewport,
  goToSlice,
} from '../cornerstone/viewport.js';

const EMPTY_INFO = { index: 0, total: 0, width: null, level: null };

export default function Viewer({ imageIds, onReady, onDropFiles }) {
  const elementRef = useRef(null);
  const [ready, setReady] = useState(false);
  const [info, setInfo] = useState(EMPTY_INFO);
  const [dragging, setDragging] = useState(false);
  const [error, setError] = useState('');

  // Read slice index and window/level from the viewport (only re-render when values change)
  const syncInfo = useCallback(() => {
    const vp = getViewport();
    if (!vp) return;
    const voi = vp.getProperties?.().voiRange;
    const next = {
      index: vp.getCurrentImageIdIndex?.() ?? 0,
      total: vp.getImageIds?.().length ?? 0,
      width: voi ? Math.round(voi.upper - voi.lower) : null,
      level: voi ? Math.round((voi.upper + voi.lower) / 2) : null,
    };
    setInfo((prev) =>
      prev.index === next.index &&
      prev.total === next.total &&
      prev.width === next.width &&
      prev.level === next.level
        ? prev
        : next
    );
  }, []);

  // Create the rendering engine + viewport once
  useEffect(() => {
    let cancelled = false;
    let engine = null;
    const element = elementRef.current;
    let removeListeners = () => {};

    element.oncontextmenu = (e) => e.preventDefault();

    (async () => {
      try {
        await initCornerstone();
        if (cancelled) return;

        engine = new RenderingEngine(RENDERING_ENGINE_ID);
        engine.enableElement({
          viewportId: VIEWPORT_ID,
          type: Enums.ViewportType.STACK,
          element,
          defaultOptions: { background: [0, 0, 0] },
        });
        createToolGroup();

        const events = [Enums.Events.STACK_NEW_IMAGE, Enums.Events.VOI_MODIFIED];
        events.forEach((e) => element.addEventListener(e, syncInfo));
        removeListeners = () => events.forEach((e) => element.removeEventListener(e, syncInfo));

        setReady(true);
        onReady?.();
      } catch (err) {
        console.error(err);
        setError('Could not start the viewer. Check that your browser supports WebGL.');
      }
    })();

    return () => {
      cancelled = true;
      removeListeners();
      destroyToolGroup();
      if (engine) {
        try {
          engine.destroy();
        } catch (err) {
          console.warn(err);
        }
      }
      setReady(false);
    };
  }, [syncInfo, onReady]);

  // Load a new image stack whenever imageIds change
  useEffect(() => {
    if (!ready || !imageIds.length) return undefined;
    let cancelled = false;

    (async () => {
      const vp = getViewport();
      if (!vp) return;
      try {
        clearAllAnnotations();
        await vp.setStack(imageIds, Math.floor(imageIds.length / 2));
        if (cancelled) return;
        vp.render();
        syncInfo();
        setError('');
      } catch (err) {
        console.error(err);
        setError('Could not load these images. Are they valid, uncompressed or common-codec DICOM files?');
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [ready, imageIds, syncInfo]);

  const handleDrop = (e) => {
    e.preventDefault();
    setDragging(false);
    if (e.dataTransfer?.files?.length) onDropFiles?.(e.dataTransfer.files);
  };

  return (
    <div className="viewer-column">
      <div
        className={`viewer-wrap${dragging ? ' dragging' : ''}`}
        onDragOver={(e) => {
          e.preventDefault();
          setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={handleDrop}
      >
        <div ref={elementRef} className="viewport" />

        {info.total > 0 && (
          <>
            <div className="overlay top-left">
              <div>Slice {info.index + 1} / {info.total}</div>
              {info.width !== null && <div>W {info.width} · L {info.level}</div>}
            </div>
            <div className="overlay bottom-left hint">
              Wheel: scroll · Left drag: active tool · Right drag: zoom · Middle drag: pan
            </div>
          </>
        )}
        <div className="overlay top-right badge">Educational demo – not for diagnostic use</div>

        {!info.total && !error && (
          <div className="empty-state">
            <div className="empty-icon">🫀</div>
            <p>Load the demo images or drop DICOM files here</p>
          </div>
        )}
        {error && <div className="empty-state error">{error}</div>}
        {dragging && <div className="drop-hint">Drop DICOM files to open</div>}
      </div>

      <div className="slider-row">
        <span>Slice</span>
        <input
          type="range"
          min={1}
          max={Math.max(info.total, 1)}
          value={info.index + 1}
          disabled={!info.total}
          onChange={(e) => goToSlice(Number(e.target.value) - 1)}
        />
        <span className="slider-count">{info.total ? `${info.index + 1}/${info.total}` : '–'}</span>
      </div>
    </div>
  );
}
