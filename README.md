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
- 🎛️ CSS variables for theming
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

// Create and mount (CSS auto-injected)
const monitor = new FPSMonitor();

// With options
const monitor = new FPSMonitor({
  position: 'bottom-left',  // 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left'
  collapsed: true,          // start collapsed
  injectStyles: true        // auto-inject CSS (default: true)
});

// Control
monitor.toggle();      // toggle collapsed state
monitor.collapsed = true;  // set directly
monitor.stop();        // pause monitoring
monitor.start();       // resume monitoring
monitor.destroy();     // remove from DOM
```

## Customization

### CSS Variables

Override these on `.fps-monitor` or `:root`:

```css
.fps-monitor {
  --fps-color-good: #22c55e;    /* ≥55 fps */
  --fps-color-warn: #eab308;    /* 30-55 fps */
  --fps-color-bad: #ef4444;     /* <30 fps */
  --fps-graph-width: 280px;
  --fps-graph-height: 80px;
  --fps-font-family: 'JetBrains Mono', monospace;
  --fps-bg: rgba(15, 23, 42, 0.92);
  --fps-border-radius: 10px;
}
```

### Custom CSS

Use your own styles by disabling auto-injection:

```ts
import { FPSMonitor } from 'fps-monitor';
import './my-fps-styles.css';

new FPSMonitor({ injectStyles: false });
```

### Data Attributes

The component uses data attributes for state, making CSS targeting easy:

```css
/* Target by position */
.fps-monitor[data-position="bottom-left"] { /* ... */ }

/* Target by status */
.fps-monitor[data-status="bad"] { /* ... */ }

/* Target when collapsed */
.fps-monitor[data-collapsed="true"] { /* ... */ }

/* Stat items */
.fps-monitor-stat[data-status="good"] { /* ... */ }
```

## API

### `new FPSMonitor(options?)`

Creates and mounts the FPS monitor.

**Options:**

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `position` | `'top-right' \| 'top-left' \| 'bottom-right' \| 'bottom-left'` | `'top-right'` | Screen position |
| `collapsed` | `boolean` | `false` | Start collapsed |
| `injectStyles` | `boolean` | `true` | Auto-inject CSS |

### Properties

| Property | Type | Description |
|----------|------|-------------|
| `collapsed` | `boolean` | Get/set collapsed state |

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
- Uses CSS variables for colors (reads at render time)
- Data attributes drive all visual state changes

### Why a ring buffer?

A performance monitor shouldn't tank your performance. The ring buffer is a fixed-size array (120 slots) that wraps around:

```
Frame 1:   write at index 0
Frame 2:   write at index 1
...
Frame 120: write at index 119
Frame 121: write at index 0 (overwrites oldest)
```

**No allocations.** No `.push()`, no `.shift()`, no array resizing. Just:

```ts
buffer[index] = delta;
index = (index + 1) % 120;
```

O(1) writes, zero GC pressure. At 60fps that's 60 potential allocation sites per second eliminated. The monitor stays invisible to the metrics it's measuring.

## License

MIT
