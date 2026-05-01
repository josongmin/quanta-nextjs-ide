# Quanta — VS Code extension (stub)

Loads the Quanta IDE in a Webview panel. Today this points at the local dev
server (`http://localhost:5173`); production ship will bundle the built assets
and resolve via `vscode-resource://`.

## Local dev

```bash
# 1. Run the IDE dev server in repo root
npm run dev

# 2. Build the extension
cd packages/vscode-extension
npm install
npm run build

# 3. F5 in VS Code with this folder open → spawns Extension Host → run
#    "Quanta: Open Probe Panel" from the command palette.
```

## TODO

- Bundle IDE build output instead of dev server URL
- Bridge VS Code's active editor selection to Quanta state
- Use VS Code workspace fs API as the Quanta `Shell` implementation
