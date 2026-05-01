// Minimal VS Code extension entry — opens the Quanta IDE inside a Webview.
// Real ship would bundle the IDE assets locally; this stub loads from a
// configurable URL so the extension acts as a thin webview wrapper.

import * as vscode from 'vscode';

const QUANTA_URL = 'http://localhost:5173';

export function activate(context: vscode.ExtensionContext): void {
  const cmd = vscode.commands.registerCommand('quanta.open', () => {
    const panel = vscode.window.createWebviewPanel(
      'quanta',
      'Quanta — Probe',
      vscode.ViewColumn.Beside,
      { enableScripts: true, retainContextWhenHidden: true },
    );
    panel.webview.html = `<!doctype html>
<html><body style="margin:0;padding:0;background:#0a0a0a;">
<iframe
  src="${QUANTA_URL}"
  style="border:0;width:100vw;height:100vh;display:block;"
  allow="clipboard-read; clipboard-write"
></iframe>
</body></html>`;
  });
  context.subscriptions.push(cmd);
}

export function deactivate(): void {
  /* nothing to clean up */
}
