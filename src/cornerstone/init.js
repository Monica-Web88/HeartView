import { init as coreInit } from '@cornerstonejs/core';
import { init as dicomImageLoaderInit } from '@cornerstonejs/dicom-image-loader';
import { init as toolsInit } from '@cornerstonejs/tools';

let initPromise = null;

/**
 * Initialise Cornerstone3D exactly once (safe under React StrictMode double-mount).
 */
export function initCornerstone() {
  if (!initPromise) {
    initPromise = (async () => {
      await coreInit();
      await dicomImageLoaderInit({
        maxWebWorkers: Math.max(1, Math.floor((navigator.hardwareConcurrency || 2) / 2)),
      });
      await toolsInit();
    })();
  }
  return initPromise;
}
