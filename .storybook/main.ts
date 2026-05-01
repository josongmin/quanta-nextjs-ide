import type { StorybookConfig } from '@storybook/react-vite';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(dirname, '..');

const config: StorybookConfig = {
  stories: ['../src/**/*.mdx', '../src/**/*.stories.@(js|jsx|mjs|ts|tsx)'],
  addons: [
    '@chromatic-com/storybook',
    '@storybook/addon-a11y',
    '@storybook/addon-docs',
    '@storybook/addon-onboarding',
  ],
  framework: {
    name: '@storybook/react-vite',
    options: {},
  },
  // Mirror tsconfig.app.json `paths` so stories that import via `@shared/*`,
  // `@features/*`, etc. resolve the same way they do in the main app build.
  async viteFinal(viteConfig) {
    viteConfig.resolve = viteConfig.resolve ?? {};
    const existingAlias = viteConfig.resolve.alias;
    const aliasObj: Record<string, string> = {
      '@': path.resolve(rootDir, 'src'),
      '@app': path.resolve(rootDir, 'src/app'),
      '@pages': path.resolve(rootDir, 'src/pages'),
      '@widgets': path.resolve(rootDir, 'src/widgets'),
      '@features': path.resolve(rootDir, 'src/features'),
      '@entities': path.resolve(rootDir, 'src/entities'),
      '@shared': path.resolve(rootDir, 'src/shared'),
    };
    if (Array.isArray(existingAlias)) {
      viteConfig.resolve.alias = [
        ...existingAlias,
        ...Object.entries(aliasObj).map(([find, replacement]) => ({
          find,
          replacement,
        })),
      ];
    } else {
      viteConfig.resolve.alias = {
        ...(existingAlias as Record<string, string> | undefined),
        ...aliasObj,
      };
    }
    return viteConfig;
  },
};

export default config;
