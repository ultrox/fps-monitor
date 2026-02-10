# fps-monitor

Real-time FPS monitor with canvas visualization. Zero dependencies. Works anywhere.

![TypeScript](https://img.shields.io/badge/TypeScript-5.0+-3178c6) ![Zero deps](https://img.shields.io/badge/dependencies-0-brightgreen)

## Features

- 📊 Real-time frame time graph (last 120 frames)
- 🎨 Color-coded status (green ≥55, yellow 30-55, red <30)
- 📈 Min/Max/Avg stats tracking
- 🔄 Collapsible UI
- 📍 Configurable position
- 🎯 High-DPI canvas support
- 0️⃣ Zero dependencies
- 💙 Full TypeScript support
- 🌐 Framework-agnostic (vanilla JS)

## Install

```bash
npm install fps-monitor
```

Or just copy `src/FPSMonitor.ts` into your project.

## Usage

```ts
import { FPSMonitor } from 'fps-monitor';

// Create and mount
const monitor = new FPSMonitor();

// With options
const monitor = new FPSMonitor({
  position: 'bottom-left',  // 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left'
  collapsed: true           // start collapsed
});

// Control
monitor.toggle();   // toggle collapsed state
monitor.stop();     // pause monitoring
monitor.start();    // resume monitoring
monitor.destroy();  // remove from DOM
```

### Script tag

```html
<script type="module">
  import { FPSMonitor } from 'https://unpkg.com/fps-monitor/dist/index.js';
  new FPSMonitor();
</script>
```

### Dev-only usage

```ts
if (import.meta.env.DEV) {
  new FPSMonitor();
}
```

### Keyboard toggle

```ts
import { FPSMonitor } from 'fps-monitor';

let monitor: FPSMonitor | null = null;

document.addEventListener('keydown', (e) => {
  if (e.key === 'F' && e.shiftKey) {
    if (monitor) {
      monitor.destroy();
      monitor = null;
    } else {
      monitor = new FPSMonitor();
    }
  }
});
```

## API

### `new FPSMonitor(options?)`

Creates and mounts the FPS monitor.

**Options:**

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `position` | `'top-right' \| 'top-left' \| 'bottom-right' \| 'bottom-left'` | `'top-right'` | Screen position |
| `collapsed` | `boolean` | `false` | Start collapsed |

### Methods

| Method | Description |
|--------|-------------|
| `toggle()` | Toggle collapsed state |
| `start()` | Start/resume monitoring |
| `stop()` | Pause monitoring |
| `destroy()` | Remove from DOM and cleanup |

## How it works

- Uses `requestAnimationFrame` to measure actual frame times
- Stores last 120 frame deltas in a ring buffer
- Calculates rolling average from last 20 frames
- Renders to canvas for minimal overhead
- Skips graph updates when collapsed

## Color thresholds

| FPS | Frame time | Color |
|-----|------------|-------|
| ≥55 | ≤18ms | 🟢 Green |
| 30-55 | 18-33ms | 🟡 Yellow |
| <30 | >33ms | 🔴 Red |

## License

MIT
