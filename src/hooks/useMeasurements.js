import { useCallback, useEffect, useRef, useState } from 'react';
import { eventTarget, Enums } from '@cornerstonejs/core';
import { Enums as csToolsEnums } from '@cornerstonejs/tools';
import { getAllAnnotations } from '../cornerstone/annotations.js';
import { MEASURE_TOOL_NAMES } from '../cornerstone/tools.js';
import { getViewport } from '../cornerstone/viewport.js';

/**
 * Live list of ROI / length measurements, updated while the user draws or edits.
 */
export function useMeasurements(imageIds, ready) {
  const [rows, setRows] = useState([]);
  const lastKey = useRef('');

  const refresh = useCallback(() => {
    const next = getAllAnnotations()
      .filter((a) => MEASURE_TOOL_NAMES.includes(a.metadata?.toolName))
      .map((a) => {
        const stats = Object.values(a.data?.cachedStats || {})[0] || {};
        const slice = imageIds.indexOf(a.metadata?.referencedImageId);
        return {
          uid: a.annotationUID,
          tool: a.metadata.toolName,
          slice: slice >= 0 ? slice + 1 : null,
          length: stats.length,
          area: stats.area,
          mean: stats.mean,
          std: stats.stdDev,
          min: stats.min,
          max: stats.max,
          lengthUnit: stats.unit || 'mm',
          areaUnit: stats.areaUnit || 'mm²',
        };
      })
      .sort((a, b) => (a.slice ?? 0) - (b.slice ?? 0));

    const key = JSON.stringify(next);
    if (key !== lastKey.current) {
      lastKey.current = key;
      setRows(next);
    }
  }, [imageIds]);

  useEffect(() => {
    if (!ready) return undefined;
    const element = getViewport()?.element;
    let frame = 0;
    const schedule = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(refresh);
    };

    const toolEvents = [
      csToolsEnums.Events.ANNOTATION_COMPLETED,
      csToolsEnums.Events.ANNOTATION_MODIFIED,
      csToolsEnums.Events.ANNOTATION_REMOVED,
    ];
    toolEvents.forEach((e) => eventTarget.addEventListener(e, schedule));
    // Statistics are computed during render, so also refresh after each render.
    element?.addEventListener(Enums.Events.IMAGE_RENDERED, schedule);
    refresh();

    return () => {
      cancelAnimationFrame(frame);
      toolEvents.forEach((e) => eventTarget.removeEventListener(e, schedule));
      element?.removeEventListener(Enums.Events.IMAGE_RENDERED, schedule);
    };
  }, [ready, refresh]);

  return { rows, refresh };
}
