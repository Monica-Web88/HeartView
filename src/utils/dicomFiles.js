import dicomParser from 'dicom-parser';
import * as loaderModule from '@cornerstonejs/dicom-image-loader';

// Works whether the loader exposes named exports or only a default export.
const wadouri = loaderModule.wadouri || loaderModule.default?.wadouri;

export const DEMO_SLICES = 40;

export function demoImageIds() {
  const base = import.meta.env.BASE_URL || '/';
  return Array.from({ length: DEMO_SLICES }, (_, i) => {
    const n = String(i + 1).padStart(3, '0');
    return `wadouri:${base}demo/slice_${n}.dcm`;
  });
}

async function readSliceInfo(file) {
  try {
    const bytes = new Uint8Array(await file.arrayBuffer());
    const ds = dicomParser.parseDicom(bytes, { untilTag: 'x7fe00010' });
    const position = (ds.string('x00200032') || '').split('\\').map(Number);
    return {
      file,
      series: ds.string('x0020000e') || 'unknown',
      instance: ds.intString('x00200013'),
      z: Number.isFinite(position[2]) ? position[2] : undefined,
    };
  } catch {
    return null; // not a readable DICOM file
  }
}

/**
 * Turn user-selected files into a sorted list of Cornerstone imageIds.
 * Keeps the largest series if several are selected.
 */
export async function buildImageIdsFromFiles(fileList) {
  if (!wadouri) throw new Error('DICOM image loader is not available.');

  const infos = (await Promise.all(Array.from(fileList).map(readSliceInfo))).filter(Boolean);
  const skipped = fileList.length - infos.length;
  if (!infos.length) throw new Error('No readable DICOM files were found in that selection.');

  const bySeries = new Map();
  infos.forEach((i) => bySeries.set(i.series, [...(bySeries.get(i.series) || []), i]));
  const largest = [...bySeries.values()].sort((a, b) => b.length - a.length)[0];

  const hasZ = largest.every((i) => i.z !== undefined);
  largest.sort((a, b) =>
    hasZ ? a.z - b.z : (a.instance ?? 0) - (b.instance ?? 0) || a.file.name.localeCompare(b.file.name)
  );

  return {
    imageIds: largest.map((i) => wadouri.fileManager.add(i.file)),
    skipped,
    seriesCount: bySeries.size,
  };
}
