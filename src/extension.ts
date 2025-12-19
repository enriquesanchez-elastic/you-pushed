import * as vscode from 'vscode';
import * as path from 'path';
import * as fs from 'fs';

let currentPanel: vscode.WebviewPanel | undefined;
let debounceTimer: NodeJS.Timeout | undefined;

export function activate(context: vscode.ExtensionContext) {
    console.log('You Pushed extension is now active!');

    // Register test command for manual testing
    const testCommand = vscode.commands.registerCommand('you-pushed.test', () => {
        showYouPushedMessage(context);
    });
    context.subscriptions.push(testCommand);

    // Set up file watcher for git push detection (for CLI usage)
    setupGitPushWatcher(context);

    // Hook into VS Code's git commands (for Source Control UI usage)
    setupGitCommandHooks(context);
}

function setupGitCommandHooks(context: vscode.ExtensionContext) {
    // List of git commands that involve pushing
    const pushCommands = [
        'git.push',
        'git.pushForce', 
        'git.pushTo',
        'git.pushWithTags',
        'git.sync',
        'git.syncRebase',
        'git.publish'
    ];

    // Wrap each push command to trigger our animation after it completes
    for (const commandId of pushCommands) {
        const disposable = vscode.commands.registerCommand(
            `you-pushed.wrap.${commandId}`,
            async (...args: any[]) => {
                try {
                    // Execute the original git command
                    await vscode.commands.executeCommand(commandId, ...args);
                    // Show our souls message after successful push
                    triggerYouPushed(context);
                } catch (error) {
                    // If the command fails, don't show the message
                    console.log(`Git command ${commandId} failed:`, error);
                    throw error;
                }
            }
        );
        context.subscriptions.push(disposable);
    }

    // Override the keyboard shortcuts and menu items
    // This uses tasks.json-style command overriding via keybindings
    // But a simpler approach: listen for git extension state changes
    setupGitExtensionListener(context);
}

async function setupGitExtensionListener(context: vscode.ExtensionContext) {
    // Try to get the Git extension API
    const gitExtension = vscode.extensions.getExtension('vscode.git');
    
    if (!gitExtension) {
        console.log('Git extension not found');
        return;
    }

    // Wait for the extension to activate
    const git = gitExtension.isActive ? gitExtension.exports : await gitExtension.activate();
    const api = git.getAPI(1);

    if (!api) {
        console.log('Git API not available');
        return;
    }

    // Listen for repository changes
    for (const repo of api.repositories) {
        watchRepository(repo, context);
    }

    // Watch for new repositories
    api.onDidOpenRepository((repo: any) => {
        watchRepository(repo, context);
    });
}

function watchRepository(repo: any, context: vscode.ExtensionContext) {
    // The git extension emits state changes - we look for push operations
    // by tracking when HEAD moves and remote refs are updated
    let lastHead: string | undefined;
    
    repo.state.onDidChange(() => {
        const currentHead = repo.state.HEAD?.commit;
        
        // Check if any remote tracking branch was updated
        // This happens after a successful push
        if (repo.state.remotes && repo.state.remotes.length > 0) {
            // We detect a push by watching for state changes
            // after operations that typically indicate a push
        }
    });

    // Watch the operation events if available
    if (repo.onDidRunOperation) {
        repo.onDidRunOperation((operation: any) => {
            // Check if this was a push operation
            if (operation.operation === 'Push' || 
                operation.operation === 'Sync') {
                console.log('Git operation detected:', operation.operation);
                triggerYouPushed(context);
            }
        });
    }

    // Alternative: Watch for Git output
    if (repo.onDidRunGitCommand) {
        repo.onDidRunGitCommand((event: any) => {
            const command = event.command?.[0] || '';
            if (command === 'push') {
                console.log('Git push command detected');
                triggerYouPushed(context);
            }
        });
    }
}

function setupGitPushWatcher(context: vscode.ExtensionContext) {
    const workspaceFolders = vscode.workspace.workspaceFolders;
    if (!workspaceFolders) {
        return;
    }

    for (const folder of workspaceFolders) {
        const gitRemotesPath = path.join(folder.uri.fsPath, '.git', 'logs', 'refs', 'remotes');
        
        // Check if the git remotes log directory exists
        if (!fs.existsSync(gitRemotesPath)) {
            console.log('No git remotes directory found at:', gitRemotesPath);
            continue;
        }

        // Create a file system watcher for the remotes logs
        // Watch for any file changes in .git/logs/refs/remotes/**
        const pattern = new vscode.RelativePattern(
            folder,
            '.git/logs/refs/remotes/**/*'
        );
        
        const watcher = vscode.workspace.createFileSystemWatcher(pattern);
        
        // When a remote ref log is updated, it means a push happened
        watcher.onDidChange(() => {
            triggerYouPushed(context);
        });
        
        watcher.onDidCreate(() => {
            triggerYouPushed(context);
        });

        context.subscriptions.push(watcher);
        console.log('Watching for git pushes in:', gitRemotesPath);
    }
}

function triggerYouPushed(context: vscode.ExtensionContext) {
    // Debounce to prevent multiple triggers from a single push
    if (debounceTimer) {
        clearTimeout(debounceTimer);
    }
    
    debounceTimer = setTimeout(() => {
        showYouPushedMessage(context);
    }, 500);
}

function showYouPushedMessage(context: vscode.ExtensionContext) {
    // Close existing panel if any
    if (currentPanel) {
        currentPanel.dispose();
    }

    // Create and show a new webview panel
    currentPanel = vscode.window.createWebviewPanel(
        'youPushed',
        'YOU PUSHED',
        vscode.ViewColumn.One,
        {
            enableScripts: true
        }
    );

    currentPanel.webview.html = getWebviewContent();

    // Auto-close after the animation completes (5 seconds)
    setTimeout(() => {
        if (currentPanel) {
            currentPanel.dispose();
            currentPanel = undefined;
        }
    }, 5000);

    // Handle panel disposal
    currentPanel.onDidDispose(() => {
        currentPanel = undefined;
    });
}

function getWebviewContent(): string {
    return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <meta http-equiv="Content-Security-Policy" content="default-src 'none'; style-src 'unsafe-inline' https://fonts.googleapis.com; font-src https://fonts.gstatic.com;">
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Cinzel:wght@700&display=swap" rel="stylesheet">
    <title>YOU PUSHED</title>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }

        body {
            width: 100vw;
            height: 100vh;
            background: radial-gradient(ellipse at center, #1a0000 0%, #000000 70%, #000000 100%);
            display: flex;
            justify-content: center;
            align-items: center;
            overflow: hidden;
        }

        .container {
            text-align: center;
            animation: fadeInOut 5s ease-in-out forwards;
        }

        .message {
            font-family: 'Cinzel', 'Times New Roman', serif;
            font-weight: 700;
            font-size: 6vw;
            color: #8B0000;
            text-transform: uppercase;
            letter-spacing: 0.3em;
            text-shadow: 
                0 0 10px #8B0000,
                0 0 20px #8B0000,
                0 0 30px #5c0000,
                0 0 40px #5c0000,
                0 0 50px #3d0000,
                0 0 60px #3d0000;
            opacity: 0;
            animation: textReveal 4s ease-in-out forwards;
            animation-delay: 0.5s;
        }

        @keyframes fadeInOut {
            0% {
                opacity: 0;
            }
            20% {
                opacity: 1;
            }
            80% {
                opacity: 1;
            }
            100% {
                opacity: 0;
            }
        }

        @keyframes textReveal {
            0% {
                opacity: 0;
                transform: scale(0.8);
                filter: blur(10px);
            }
            30% {
                opacity: 1;
                transform: scale(1);
                filter: blur(0px);
            }
            70% {
                opacity: 1;
                transform: scale(1);
                filter: blur(0px);
            }
            100% {
                opacity: 0;
                transform: scale(1.1);
                filter: blur(5px);
            }
        }

        /* Vignette effect */
        .vignette {
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            box-shadow: inset 0 0 150px rgba(0, 0, 0, 0.9);
            pointer-events: none;
        }

        /* Subtle blood drip effect */
        .blood-drip {
            position: absolute;
            top: 0;
            left: 50%;
            transform: translateX(-50%);
            width: 2px;
            height: 0;
            background: linear-gradient(to bottom, transparent, #8B0000);
            animation: drip 3s ease-in forwards;
            animation-delay: 1s;
        }

        @keyframes drip {
            0% {
                height: 0;
                opacity: 0;
            }
            50% {
                height: 100px;
                opacity: 0.5;
            }
            100% {
                height: 200px;
                opacity: 0;
            }
        }
    </style>
</head>
<body>
    <div class="vignette"></div>
    <div class="blood-drip"></div>
    <div class="container">
        <h1 class="message">YOU PUSHED</h1>
    </div>
</body>
</html>`;
}

export function deactivate() {
    if (currentPanel) {
        currentPanel.dispose();
    }
    if (debounceTimer) {
        clearTimeout(debounceTimer);
    }
}

