# Desktop Application Build Guide (macOS)

This guide documents the process for building the macOS desktop application using Electron.

## Tech Stack
- **Electron**: Desktop wrapper.
- **Electron Builder**: Packaging tool for macOS (.dmg).
- **Vite**: Build tool for the frontend.
- **Concurrently**: Utility to run Vite and Electron together during development.

## Project Structure
- `electron/`: Contains Electron-specific main process code.
  - `main.js`: Main entry point (ESM).
  - `preload.js`: Preload script (currently optional/empty).
- `package.json`: Contains `electron:dev` and `electron:build` scripts and `build` configuration.
- `vite.config.ts`: Base path set to `./` for Electron compatibility.

## Prerequisites
- Node.js (v18+ recommended)
- npm

## Development
To run the desktop application in development mode (with Hot Module Replacement):

```bash
npm run electron:dev
```
This command:
1. Starts the Vite dev server (`npm run dev`).
2. Waits for port 3000 to be ready.
3. Launches the Electron window loading `http://localhost:3000`.

## Building for Production (macOS)
To create a distributable `.dmg` file:

```bash
npm run electron:build
```

**Output Location:**
`release/FourThings-0.1.0-arm64.dmg` (for Apple Silicon)

**Build Process:**
1. `npm run build`: Compiles React/TypeScript to `dist/`.
2. `electron-builder`: Packages `dist/` and `electron/` into a macOS application.

## Configuration Details

### `package.json`
The `build` section configures `electron-builder`:
```json
"build": {
  "appId": "com.fourthings.app",
  "productName": "FourThings",
  "mac": {
    "category": "public.app-category.productivity",
    "target": ["dmg"],
    "icon": "public/icons/icon-512x512.png" // Uses the high-res app icon
  },
  "files": [
    "dist/**/*",
    "electron/**/*",
    "package.json"
  ],
  "extends": null
}
```

### `electron/main.js`
Uses ESM syntax (`import`) and `createRequire` to handle Electron dependencies.
Important: Removed `electron-squirrel-startup` check as it is unnecessary for macOS and causes missing module errors.

## Troubleshooting
**"ReferenceError: require is not defined"**:
Ensure `electron/main.js` uses:
```javascript
import { createRequire } from 'module';
const require = createRequire(import.meta.url);
```
instead of direct `require()` calls at the top level, as the project is configured as `"type": "module"`.
