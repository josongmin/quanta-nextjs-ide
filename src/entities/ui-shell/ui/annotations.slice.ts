import type { StateCreator } from 'zustand';
import type { Annotation } from './types';

export interface AnnotationsSlice {
  annotations: Annotation[];
  addAnnotation(a: Omit<Annotation, 'id' | 'at'>): void;
  removeAnnotation(id: string): void;
}

export const annotationsPersistKeys = ['annotations'] as const;

const MAX_ANNOTATIONS = 200;

export const createAnnotationsSlice: StateCreator<
  AnnotationsSlice,
  [],
  [],
  AnnotationsSlice
> = (set) => ({
  annotations: [],
  addAnnotation: (a) =>
    set((s) => {
      const next: Annotation[] = [
        ...s.annotations,
        {
          ...a,
          id: `ann_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
          at: Date.now(),
        },
      ];
      // Cap persisted annotations to keep localStorage payload bounded.
      return {
        annotations:
          next.length > MAX_ANNOTATIONS
            ? next.slice(next.length - MAX_ANNOTATIONS)
            : next,
      };
    }),
  removeAnnotation: (id) =>
    set((s) => ({ annotations: s.annotations.filter((a) => a.id !== id) })),
});
