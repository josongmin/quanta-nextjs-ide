export interface ExtensionRef {
  id: string;
  name: string;
  version: string;
}

export interface SettingOverride {
  key: string;
  value: string;
}

export interface Profile {
  id: string;
  name: string;
  description: string;
  settingCount: number;
  extensions: ReadonlyArray<ExtensionRef>;
  overrides: ReadonlyArray<SettingOverride>;
  keybindingsCount: number;
  isActive: boolean;
}

const NOW = 1_730_000_000_000;
export const LAST_SWITCH_TS = NOW - 47 * 60_000;

export const PROFILES: ReadonlyArray<Profile> = [
  {
    id: 'p-default',
    name: 'Default',
    description: 'Stock VS Code-grade defaults — minimal, language-agnostic.',
    settingCount: 18,
    keybindingsCount: 22,
    isActive: false,
    extensions: [
      { id: 'ms.git', name: 'Git', version: '2.4.0' },
      { id: 'ms.theme', name: 'Default Theme', version: '1.0.0' },
      { id: 'editorconfig', name: 'EditorConfig', version: '0.16.4' },
      { id: 'ms.json', name: 'JSON Language Features', version: '1.0.3' },
      { id: 'gitlens', name: 'GitLens (lite)', version: '14.9.1' },
      { id: 'spell', name: 'Code Spell Checker', version: '3.0.1' },
    ],
    overrides: [
      { key: 'editor.fontSize', value: '13' },
      { key: 'editor.tabSize', value: '2' },
      { key: 'files.autoSave', value: '"afterDelay"' },
      { key: 'workbench.colorTheme', value: '"Quanta Light"' },
    ],
  },
  {
    id: 'p-frontend',
    name: 'Frontend (React)',
    description: 'Tuned for React 18, Tailwind, JSX. Aggressive type narrowing.',
    settingCount: 41,
    keybindingsCount: 38,
    isActive: true,
    extensions: [
      { id: 'esbenp.prettier-vscode', name: 'Prettier', version: '11.0.1' },
      { id: 'dbaeumer.vscode-eslint', name: 'ESLint', version: '3.0.10' },
      { id: 'bradlc.vscode-tailwindcss', name: 'Tailwind IntelliSense', version: '0.12.5' },
      { id: 'styled.vscode-styled', name: 'styled-components', version: '1.7.8' },
      { id: 'figma.figma-vscode-extension', name: 'Figma', version: '0.6.0' },
      { id: 'wix.vscode-import-cost', name: 'Import Cost', version: '3.3.0' },
      { id: 'mikestead.dotenv', name: 'DotENV', version: '1.0.1' },
      { id: 'orta.vscode-jest', name: 'Jest', version: '6.4.0' },
      { id: 'pmneo.tsimporter', name: 'TS Importer', version: '2.0.1' },
      { id: 'meganrogge.template-string-converter', name: 'Template String Converter', version: '0.6.1' },
    ],
    overrides: [
      { key: 'editor.fontSize', value: '12' },
      { key: 'editor.formatOnSave', value: 'true' },
      { key: 'eslint.run', value: '"onType"' },
      { key: 'tailwindCSS.experimental.classRegex', value: '[["cn\\\\(([^)]*)\\\\)", "[\\"\'`]([^\\"\'`]*).*?[\\"\'`]"]]' },
      { key: 'typescript.preferences.importModuleSpecifier', value: '"non-relative"' },
      { key: 'typescript.tsserver.experimental.enableProjectDiagnostics', value: 'true' },
    ],
  },
  {
    id: 'p-backend',
    name: 'Backend (Node)',
    description: 'Server-side TS, REST/GraphQL, Postgres adjacent.',
    settingCount: 33,
    keybindingsCount: 27,
    isActive: false,
    extensions: [
      { id: 'graphql.vscode-graphql', name: 'GraphQL', version: '0.10.4' },
      { id: 'cweijan.vscode-postgresql-client2', name: 'Postgres Client', version: '7.5.0' },
      { id: 'rangav.vscode-thunder-client', name: 'Thunder Client', version: '2.27.0' },
      { id: 'humao.rest-client', name: 'REST Client', version: '0.25.1' },
      { id: 'redhat.vscode-yaml', name: 'YAML', version: '1.15.0' },
      { id: 'ms-azuretools.vscode-docker', name: 'Docker', version: '1.29.4' },
      { id: 'tamasfe.even-better-toml', name: 'Even Better TOML', version: '0.19.2' },
      { id: 'ms-kubernetes-tools.vscode-kubernetes-tools', name: 'Kubernetes', version: '1.3.18' },
    ],
    overrides: [
      { key: 'editor.fontSize', value: '13' },
      { key: 'files.exclude', value: '{"**/dist": true, "**/.turbo": true}' },
      { key: 'rest-client.environmentVariables', value: '{"$shared": {"host": "https://api.local"}}' },
      { key: 'sql.format.uppercase', value: 'true' },
    ],
  },
  {
    id: 'p-data',
    name: 'Data (Python)',
    description: 'Notebooks, pandas, jupyter, parquet — analytics workflows.',
    settingCount: 28,
    keybindingsCount: 19,
    isActive: false,
    extensions: [
      { id: 'ms-python.python', name: 'Python', version: '2024.6.0' },
      { id: 'ms-python.vscode-pylance', name: 'Pylance', version: '2024.6.1' },
      { id: 'ms-toolsai.jupyter', name: 'Jupyter', version: '2024.5.0' },
      { id: 'ms-toolsai.jupyter-renderers', name: 'Jupyter Renderers', version: '1.0.18' },
      { id: 'mechatroner.rainbow-csv', name: 'Rainbow CSV', version: '3.10.0' },
      { id: 'randomfractalsinc.vscode-data-preview', name: 'Data Preview', version: '2.3.0' },
      { id: 'mtxr.sqltools', name: 'SQLTools', version: '0.28.2' },
      { id: 'ms-python.black-formatter', name: 'Black Formatter', version: '2024.0.0' },
    ],
    overrides: [
      { key: 'jupyter.askForKernelRestart', value: 'false' },
      { key: 'python.defaultInterpreterPath', value: '".venv/bin/python"' },
      { key: 'editor.fontSize', value: '13' },
      { key: 'notebook.lineNumbers', value: '"on"' },
    ],
  },
  {
    id: 'p-lite',
    name: 'Lite/Travel',
    description: 'Battery-friendly. Disables heavy linting & telemetry.',
    settingCount: 12,
    keybindingsCount: 14,
    isActive: false,
    extensions: [
      { id: 'ms.git', name: 'Git', version: '2.4.0' },
      { id: 'editorconfig', name: 'EditorConfig', version: '0.16.4' },
      { id: 'esbenp.prettier-vscode', name: 'Prettier', version: '11.0.1' },
      { id: 'spell', name: 'Code Spell Checker', version: '3.0.1' },
      { id: 'ms.theme', name: 'Default Theme', version: '1.0.0' },
      { id: 'ms.json', name: 'JSON Language Features', version: '1.0.3' },
    ],
    overrides: [
      { key: 'telemetry.telemetryLevel', value: '"off"' },
      { key: 'editor.minimap.enabled', value: 'false' },
      { key: 'workbench.enableExperiments', value: 'false' },
      { key: 'extensions.autoUpdate', value: 'false' },
    ],
  },
];

export function fmtRel(ts: number): string {
  const NOW2 = 1_730_000_000_000;
  const diff = NOW2 - ts;
  const m = Math.round(diff / 60_000);
  if (m < 1) return 'just now';
  if (m < 60) return `${m}m ago`;
  const h = Math.round(m / 60);
  return `${h}h ago`;
}
