# AI SFX Premiere Plugin

An AI-powered sound effects generator plugin for Adobe Premiere Pro using the Common Extensibility Platform (CEP) and Eleven Labs API.

## Features

- **AI Sound Generation**: Generate custom sound effects using AI prompts via Eleven Labs API
- **Spacebar Search**: Quick search for existing SFX in your library
- **Smart Timeline Placement**: Automatically places audio at playhead or In/Out points
- **Track Management**: Auto-creates dedicated SFX audio tracks
- **Real-time Preview**: Preview sounds before adding to timeline

## Installation

1. Clone this repository
2. Navigate to the `AI-SFX-Bolt` directory
3. Install dependencies: `npm install` or `yarn install`
4. Build the plugin: `npm run build`
5. Copy the built plugin to your Adobe CEP extensions folder

## Development

- Built with BOLT CEP framework
- React-based UI
- ExtendScript for Premiere Pro integration
- TypeScript for type safety

## Usage

1. Open Adobe Premiere Pro
2. Access the plugin from the Window > Extensions menu
3. Use spacebar to search existing SFX or type prompts to generate new ones
4. Audio automatically places at your playhead position

## Requirements

- Adobe Premiere Pro CC 2019 or later
- Eleven Labs API key (for AI generation)
- Node.js (for development)

## License

MIT License - see LICENSE file for details