const vscode = require('vscode');
const path = require('path');

let panel;

function activate(context) {
    vscode.workspace.onDidChangeTextDocument(event => {
        const changes = event.contentChanges;
        if (!changes.length) return;

        const lastChange = changes[changes.length - 1];
        // Check for newline (Enter key)
        if (lastChange.text.includes('\n') || lastChange.text.includes('\r')) {
            playSound(context);
        }
    });
}

function deactivate() {
    if (panel) {
        panel.dispose();
        panel = null;
    }
}

function playSound(context) {
    if (!panel) {
        panel = vscode.window.createWebviewPanel(
            'audioEngine',
            'Audio Engine',
            vscode.ViewColumn.Two,
            {
                enableScripts: true,
                retainContextWhenHidden: true,
                localResourceRoots: [vscode.Uri.file(path.join(context.extensionPath, 'media'))]
            }
        );

        // Reset panel when closed
        panel.onDidDispose(() => {
            panel = null;
        });

        const soundUri = panel.webview.asWebviewUri(
            vscode.Uri.file(path.join(context.extensionPath, 'media', 'sound.mp3'))
        );

        panel.webview.html = `
            <html>
            <head>
                <meta http-equiv="Content-Security-Policy" content="default-src 'none'; script-src 'unsafe-inline'; media-src ${panel.webview.cspSource};">
            </head>
            <body>
                <button id="unlock">Click to Enable Sound</button>
                <audio id="audio" src="${soundUri}"></audio>
                <script>
                    const audio = document.getElementById('audio');
                    const btn = document.getElementById('unlock');
                    
                    btn.addEventListener('click', () => {
                        audio.play().then(() => {
                            audio.pause();
                            btn.innerText = "Sound Active";
                            btn.style.background = "#4caf50";
                        });
                    });

                    window.addEventListener('message', event => {
                        if (event.data === 'play') {
                            audio.currentTime = 0;
                            audio.play().catch(e => console.error("Playback failed:", e));
                        }
                    });
                </script>
            </body>
            </html>
        `;
    }

    setTimeout(() => {
        panel.webview.postMessage('play');
    }, 100);
}

module.exports = {
    activate,
    deactivate
};