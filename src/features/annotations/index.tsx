// Annotations live as inline pins on the editor surface. The overlay panel is
// intentionally a no-op (annotations don't need their own modal); the active
// surface is `annotations-pins.tsx` and `widgets/editor/parts/annotations-layer`.

export { AnnotationPin, AnnotationComposer } from './annotations-pins';

export function AnnotationsOverlay() {
  return null;
}
