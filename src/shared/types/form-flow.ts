/**
 * Form-pipeline shape types.
 *
 * Lives in `shared/types` so the `form-pipeline` feature and the
 * `shared/mocks/forms.ts` mock data can both reference these without
 * a feature-to-mock cycle.
 */

export type FormStageKind = 'field' | 'schema' | 'action' | 'response' | 'ui';

export interface FormStage {
  id: string;
  kind: FormStageKind;
  label: string;
  file?: string;
  line?: number;
  shape?: string;
  warnings: string[];
}

export interface FormFlow {
  id: string;
  name: string;
  routeId: string;
  routePath: string;
  progressiveEnhancement: boolean;
  errorMappingComplete: boolean;
  stages: FormStage[];
}
