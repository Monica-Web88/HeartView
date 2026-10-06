import { annotation } from '@cornerstonejs/tools';
import { getViewport } from './viewport.js';

export function getAllAnnotations() {
  try {
    return annotation.state.getAllAnnotations() || [];
  } catch {
    return [];
  }
}

export function clearAllAnnotations() {
  try {
    annotation.state.removeAllAnnotations();
  } catch {
    getAllAnnotations().forEach((a) => annotation.state.removeAnnotation(a.annotationUID));
  }
  getViewport()?.render();
}

export function removeAnnotationByUID(uid) {
  annotation.state.removeAnnotation(uid);
  getViewport()?.render();
}
