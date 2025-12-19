# You Pushed - Dark Souls Style Git Push Notification

A VS Code extension that displays an epic Dark Souls "YOU DIED" style message every time you push code to a remote branch.


## Features

- **Automatic Detection**: Monitors your git repository and triggers when you push to any remote
- **Souls-like Animation**: Full-screen dark red text with the iconic fade-in effect
- **Gothic Aesthetic**: Dark background with vignette and glowing red text

## Installation

### From Source

1. Clone this repository
2. Run `npm install` to install dependencies
3. Run `npm run compile` to build the extension
4. Press `F5` in VS Code to launch the Extension Development Host

### Font

The extension uses **Cinzel** from Google Fonts - a gothic/medieval font that captures the Dark Souls aesthetic. No manual font installation required!

## Usage

The extension activates automatically when you open a workspace with a git repository.

### Manual Test

1. Open the Command Palette (`Cmd+Shift+P` / `Ctrl+Shift+P`)
2. Run `You Pushed: Test Animation`

### Automatic Trigger

Simply push to any remote branch - the "YOU PUSHED" message will appear automatically!

```bash
git push origin main
```

## How It Works

The extension monitors the `.git/logs/refs/remotes/` directory for file changes. When VS Code's git integration (or command-line git) pushes to a remote, the reflog files in this directory are updated, triggering the notification.

## Development

```bash
# Install dependencies
npm install

# Compile TypeScript
npm run compile

# Watch mode
npm run watch

# Run extension
Press F5 in VS Code
```

## License

MIT

---

*"You Pushed" - Because every git push is a small victory.*

