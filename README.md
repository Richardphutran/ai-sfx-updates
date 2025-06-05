# AI SFX Generator for Adobe Premiere Pro

A UXP plugin that generates AI-powered sound effects using Eleven Labs and imports them directly into your Premiere Pro project.

## Features

- 🤖 **AI-Powered Sound Generation**: Describe any sound effect in natural language
- 📁 **Automatic Import**: Generated sounds are imported directly to your project bin
- 🗂️ **Organized File Management**: All sounds saved in project folder > "Sfx ai" subfolder
- ⚡ **Fast Workflow**: Simple chat interface with keyboard shortcuts
- 🎯 **Professional UI**: Clean interface inspired by professional plugins like Boombox

## Installation

1. Download the plugin files
2. In Premiere Pro: Window > Extensions > UXP Developer Tool
3. Click "Load" and select the plugin folder
4. The plugin will appear in Window > Extensions > AI SFX Generator

## Usage

1. **First Time Setup**: Enter your Eleven Labs API key
2. **Generate Sound**: Type a description (e.g., "dog barking", "thunder rumble")
3. **Press Enter**: The sound will be generated and imported to your project
4. **Manual Placement**: Drag the imported audio from the Project panel to your timeline

## Keyboard Shortcuts

- **Enter**: Generate sound effect (when input is focused)
- **Ctrl/Cmd + D**: Debug mode (shows Premiere state)
- **Esc**: Go back to main view

## Requirements

- Adobe Premiere Pro 2024 or later
- Eleven Labs API key with sound generation permissions
- Active internet connection

## Known Limitations

- **Manual Timeline Placement Required**: Due to Adobe UXP API limitations, the plugin cannot automatically place clips on the timeline. After import, you need to manually drag the audio file from the Project panel to your desired track and position.
- **Bin Organization**: The plugin attempts to create an "SFX AI" bin but may not succeed in all cases due to API limitations.

## File Organization

Generated files are saved with descriptive names:
```
Project Folder/
└── Sfx ai/
    ├── dog_barking_2025-05-30T16-10-54.mp3
    ├── thunder_rumble_2025-05-30T16-15-32.mp3
    └── ...
```

## Technical Details

Built with:
- Adobe UXP (Unified Extensibility Platform)
- Spectrum Web Components for UI
- Eleven Labs API for sound generation

## Support

For issues or feature requests, please create an issue on GitHub.