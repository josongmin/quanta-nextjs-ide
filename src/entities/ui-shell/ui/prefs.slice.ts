import type { StateCreator } from 'zustand';
import type {
  AutofixPolicy,
  ColorMode,
  Density,
  InspectionProfile,
} from './types';

export interface PrefsSlice {
  density: Density;
  profile: InspectionProfile;
  colorMode: ColorMode;
  autofixPolicy: AutofixPolicy;
  onboardingComplete: boolean;
  setDensity(d: Density): void;
  setProfile(p: InspectionProfile): void;
  setColorMode(m: ColorMode): void;
  setAutofixPolicy(p: AutofixPolicy): void;
  setOnboardingComplete(v: boolean): void;
}

export const prefsPersistKeys = [
  'density',
  'profile',
  'colorMode',
  'autofixPolicy',
  'onboardingComplete',
] as const;

export const createPrefsSlice: StateCreator<PrefsSlice, [], [], PrefsSlice> = (
  set,
) => ({
  density: 'default',
  profile: 'commerce',
  colorMode: 'light',
  autofixPolicy: 'suggest',
  onboardingComplete: false,
  setDensity: (d) => set({ density: d }),
  setProfile: (p) => set({ profile: p }),
  setColorMode: (m) => set({ colorMode: m }),
  setAutofixPolicy: (p) => set({ autofixPolicy: p }),
  setOnboardingComplete: (v) => set({ onboardingComplete: v }),
});
