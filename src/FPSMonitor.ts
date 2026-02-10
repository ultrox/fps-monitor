/**
 * Real-time FPS Monitor
 * Zero dependencies, framework-agnostic
 * 
 * Styles: import 'fps-monitor/fps-monitor.css'
 * Or use your own styles targeting .fps-monitor and data attributes
 */

type Position = 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left';
type Status = 'good' | 'warn' | 'bad';

export interface FPSMonitorOptions {
  position?: Position;
  collapsed?: boolean;
  /** Auto-inject CSS. Set false if importing CSS separately. Default: true */
  injectStyles?: boolean;
}

const BUFFER_SIZE = 120;
const TARGET_FPS = 60;
const TARGET_FRAME_MS = 1000 / TARGET_FPS;
const GRAPH_WIDTH = 280;
const GRAPH_HEIGHT = 80;
const BAR_GAP = 1;

function classifyFps(fps: number): Status {
  if (fps >= 55) return 'good';
  if (fps >= 30) return 'warn';
  return 'bad';
}

function classifyMs(ms: number): Status {
  if (ms <= 18) return 'good';
  if (ms <= 33) return 'warn';
  return 'bad';
}

export class FPSMonitor {
  private container: HTMLDivElement;
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private fpsDisplay: HTMLSpanElement;
  private msDisplay: HTMLSpanElement;
  private minStat: HTMLDivElement;
  private avgStat: HTMLDivElement;
  private maxStat: HTMLDivElement;
  private frameStat: HTMLDivElement;

  private buffer = new Float64Array(BUFFER_SIZE).fill(TARGET_FRAME_MS);
  private index = 0;
  private lastTime = performance.now();
  private rafId: number | null = null;
  private sampleCount = 0;
  private minFps = 60;
  private maxFps = 60;
  private _collapsed: boolean;

  constructor(options: FPSMonitorOptions = {}) {
    const { position = 'top-right', collapsed = false, injectStyles = true } = options;
    this._collapsed = collapsed;

    if (injectStyles) {
      this.injectStyles();
    }

    // Build DOM
    this.container = document.createElement('div');
    this.container.className = 'fps-monitor';
    this.container.dataset.position = position;
    this.container.dataset.collapsed = String(collapsed);
    this.container.dataset.status = 'good';

    this.container.innerHTML = `
      <div class="fps-monitor-inner">
        <div class="fps-monitor-header">
          <div class="fps-monitor-left">
            <div class="fps-monitor-dot"></div>
            <span class="fps-monitor-fps">60</span>
            <span class="fps-monitor-label">FPS</span>
          </div>
          <div class="fps-monitor-right">
            <span class="fps-monitor-ms">16.7ms</span>
            <span class="fps-monitor-arrow">▼</span>
          </div>
        </div>
        <div class="fps-monitor-expanded">
          <canvas class="fps-monitor-canvas"></canvas>
          <div class="fps-monitor-stats">
            <div class="fps-monitor-stat" data-stat="min" data-status="good">
              <div class="fps-monitor-stat-label">MIN</div>
              <div class="fps-monitor-stat-value">60</div>
            </div>
            <div class="fps-monitor-stat" data-stat="avg" data-status="good">
              <div class="fps-monitor-stat-label">AVG</div>
              <div class="fps-monitor-stat-value">60</div>
            </div>
            <div class="fps-monitor-stat" data-stat="max" data-status="good">
              <div class="fps-monitor-stat-label">MAX</div>
              <div class="fps-monitor-stat-value">60</div>
            </div>
            <div class="fps-monitor-stat" data-stat="frame" data-status="neutral">
              <div class="fps-monitor-stat-label">FRAME</div>
              <div class="fps-monitor-stat-value">16.7ms</div>
            </div>
          </div>
          <div class="fps-monitor-legend">
            <div class="fps-monitor-legend-item">
              <div class="fps-monitor-legend-dot" data-status="good"></div>
              <span>≥55</span>
            </div>
            <div class="fps-monitor-legend-item">
              <div class="fps-monitor-legend-dot" data-status="warn"></div>
              <span>30–55</span>
            </div>
            <div class="fps-monitor-legend-item">
              <div class="fps-monitor-legend-dot" data-status="bad"></div>
              <span>&lt;30</span>
            </div>
            <span class="fps-monitor-legend-fps">fps</span>
          </div>
        </div>
      </div>
    `;

    // Get references
    this.canvas = this.container.querySelector('.fps-monitor-canvas')!;
    this.ctx = this.canvas.getContext('2d')!;
    this.fpsDisplay = this.container.querySelector('.fps-monitor-fps')!;
    this.msDisplay = this.container.querySelector('.fps-monitor-ms')!;
    this.minStat = this.container.querySelector('[data-stat="min"]')!;
    this.avgStat = this.container.querySelector('[data-stat="avg"]')!;
    this.maxStat = this.container.querySelector('[data-stat="max"]')!;
    this.frameStat = this.container.querySelector('[data-stat="frame"]')!;

    // Header click to toggle
    const header = this.container.querySelector('.fps-monitor-header')!;
    header.addEventListener('click', () => this.toggle());

    // Mount
    document.body.appendChild(this.container);

    // Start
    this.start();
  }

  private injectStyles(): void {
    if (document.getElementById('fps-monitor-styles')) return;

    const style = document.createElement('style');
    style.id = 'fps-monitor-styles';
    style.textContent = CSS_CONTENT;
    document.head.appendChild(style);
  }

  private getColor(status: Status): string {
    const styles = getComputedStyle(this.container);
    return styles.getPropertyValue(`--fps-color-${status}`).trim() || 
      (status === 'good' ? '#22c55e' : status === 'warn' ? '#eab308' : '#ef4444');
  }

  private drawGraph(): void {
    const dpr = window.devicePixelRatio || 1;
    const w = GRAPH_WIDTH;
    const h = GRAPH_HEIGHT;

    this.canvas.width = w * dpr;
    this.canvas.height = h * dpr;
    this.ctx.scale(dpr, dpr);
    this.ctx.clearRect(0, 0, w, h);

    // Background
    this.ctx.fillStyle = 'rgba(0,0,0,0.3)';
    this.ctx.fillRect(0, 0, w, h);

    const maxMs = 50;
    const goodColor = this.getColor('good');
    const badColor = this.getColor('bad');

    // 60fps line
    const y60 = (TARGET_FRAME_MS / maxMs) * h;
    this.ctx.strokeStyle = goodColor + '4D'; // 30% opacity
    this.ctx.lineWidth = 1;
    this.ctx.setLineDash([4, 4]);
    this.ctx.beginPath();
    this.ctx.moveTo(0, h - y60);
    this.ctx.lineTo(w, h - y60);
    this.ctx.stroke();

    // 30fps line
    const y30 = (33.33 / maxMs) * h;
    this.ctx.strokeStyle = badColor + '4D';
    this.ctx.beginPath();
    this.ctx.moveTo(0, h - y30);
    this.ctx.lineTo(w, h - y30);
    this.ctx.stroke();
    this.ctx.setLineDash([]);

    // Bars
    const barWidth = (w - BAR_GAP * (BUFFER_SIZE - 1)) / BUFFER_SIZE;

    for (let i = 0; i < BUFFER_SIZE; i++) {
      const idx = (this.index + i) % BUFFER_SIZE;
      const ms = this.buffer[idx];
      const clampedMs = Math.min(ms, maxMs);
      const barH = (clampedMs / maxMs) * h;
      const x = i * (barWidth + BAR_GAP);

      this.ctx.fillStyle = this.getColor(classifyMs(ms));
      this.ctx.globalAlpha = 0.4 + 0.6 * (i / BUFFER_SIZE);
      this.ctx.fillRect(x, h - barH, barWidth, barH);
    }
    this.ctx.globalAlpha = 1;
  }

  private tick = (now: number): void => {
    const delta = now - this.lastTime;
    this.lastTime = now;

    if (delta > 0 && delta < 500) {
      this.buffer[this.index] = delta;
      this.index = (this.index + 1) % BUFFER_SIZE;
      this.sampleCount++;

      const currentFps = 1000 / delta;

      if (this.sampleCount > 60) {
        if (currentFps < this.minFps) this.minFps = currentFps;
        if (currentFps > this.maxFps) this.maxFps = currentFps;
      }

      // Average from last 20 frames
      let sum = 0;
      const sampleSize = Math.min(20, BUFFER_SIZE);
      for (let i = 0; i < sampleSize; i++) {
        const idx = (this.index - 1 - i + BUFFER_SIZE) % BUFFER_SIZE;
        sum += this.buffer[idx];
      }
      const avgMs = sum / sampleSize;
      const avgFps = Math.round(1000 / avgMs);

      // Update status
      const status = classifyFps(avgFps);
      this.container.dataset.status = status;

      // Update displays
      this.fpsDisplay.textContent = String(avgFps);
      this.msDisplay.textContent = `${avgMs.toFixed(1)}ms`;

      if (!this._collapsed) {
        const minFpsRounded = Math.round(this.minFps);
        const maxFpsRounded = Math.round(this.maxFps);

        this.minStat.dataset.status = classifyFps(minFpsRounded);
        this.minStat.querySelector('.fps-monitor-stat-value')!.textContent = String(minFpsRounded);

        this.avgStat.dataset.status = status;
        this.avgStat.querySelector('.fps-monitor-stat-value')!.textContent = String(avgFps);

        this.maxStat.dataset.status = classifyFps(maxFpsRounded);
        this.maxStat.querySelector('.fps-monitor-stat-value')!.textContent = String(maxFpsRounded);

        this.frameStat.querySelector('.fps-monitor-stat-value')!.textContent = `${avgMs.toFixed(1)}ms`;

        this.drawGraph();
      }
    }

    this.rafId = requestAnimationFrame(this.tick);
  };

  get collapsed(): boolean {
    return this._collapsed;
  }

  set collapsed(value: boolean) {
    this._collapsed = value;
    this.container.dataset.collapsed = String(value);
  }

  toggle(): void {
    this.collapsed = !this._collapsed;
  }

  start(): void {
    if (this.rafId) return;
    this.lastTime = performance.now();
    this.rafId = requestAnimationFrame(this.tick);
  }

  stop(): void {
    if (this.rafId) {
      cancelAnimationFrame(this.rafId);
      this.rafId = null;
    }
  }

  destroy(): void {
    this.stop();
    this.container.remove();
  }
}

// Embedded CSS for auto-injection
const CSS_CONTENT = `
.fps-monitor {
  --fps-color-good: #22c55e;
  --fps-color-warn: #eab308;
  --fps-color-bad: #ef4444;
  --fps-graph-width: 280px;
  --fps-graph-height: 80px;
  --fps-font-family: 'JetBrains Mono', 'SF Mono', 'Fira Code', 'Cascadia Code', monospace;
  --fps-bg: rgba(15, 23, 42, 0.92);
  --fps-border-radius: 10px;
  --fps-current-color: var(--fps-color-good);
  position: fixed;
  z-index: 999999;
  font-family: var(--fps-font-family);
  font-size: 11px;
  color: #e2e8f0;
  user-select: none;
}
.fps-monitor[data-position="top-right"] { top: 12px; right: 12px; }
.fps-monitor[data-position="top-left"] { top: 12px; left: 12px; }
.fps-monitor[data-position="bottom-right"] { bottom: 12px; right: 12px; }
.fps-monitor[data-position="bottom-left"] { bottom: 12px; left: 12px; }
.fps-monitor[data-status="good"] { --fps-current-color: var(--fps-color-good); }
.fps-monitor[data-status="warn"] { --fps-current-color: var(--fps-color-warn); }
.fps-monitor[data-status="bad"] { --fps-current-color: var(--fps-color-bad); }
.fps-monitor-inner {
  background: var(--fps-bg);
  backdrop-filter: blur(12px);
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: var(--fps-border-radius);
  overflow: hidden;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.4), inset 0 1px 0 rgba(255, 255, 255, 0.05);
  min-width: calc(var(--fps-graph-width) + 20px);
}
.fps-monitor[data-collapsed="true"] .fps-monitor-inner { min-width: auto; }
.fps-monitor-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 8px 12px;
  cursor: pointer;
  border-bottom: 1px solid rgba(255, 255, 255, 0.06);
  transition: background 0.15s;
}
.fps-monitor[data-collapsed="true"] .fps-monitor-header { border-bottom: none; }
.fps-monitor-header:hover { background: rgba(255, 255, 255, 0.04); }
.fps-monitor-left, .fps-monitor-right { display: flex; align-items: center; }
.fps-monitor-left { gap: 8px; }
.fps-monitor-right { gap: 10px; }
.fps-monitor-dot {
  width: 7px; height: 7px; border-radius: 50%;
  background: var(--fps-current-color);
  box-shadow: 0 0 6px var(--fps-current-color);
}
.fps-monitor[data-status="bad"] .fps-monitor-dot { animation: fps-pulse 0.6s ease-in-out infinite alternate; }
.fps-monitor-fps { font-weight: 700; font-size: 13px; letter-spacing: -0.02em; color: var(--fps-current-color); }
.fps-monitor-label { color: #94a3b8; font-size: 10px; font-weight: 500; }
.fps-monitor-ms { color: #64748b; font-size: 10px; }
.fps-monitor-arrow { color: #64748b; font-size: 9px; display: inline-block; transition: transform 0.2s; transform: rotate(180deg); }
.fps-monitor[data-collapsed="true"] .fps-monitor-arrow { transform: rotate(0deg); }
.fps-monitor-expanded { padding: 8px 10px 10px; }
.fps-monitor[data-collapsed="true"] .fps-monitor-expanded { display: none; }
.fps-monitor-canvas { border-radius: 6px; display: block; width: var(--fps-graph-width); height: var(--fps-graph-height); }
.fps-monitor-stats { display: flex; justify-content: space-between; margin-top: 8px; padding: 0 2px; }
.fps-monitor-stat { text-align: center; }
.fps-monitor-stat-label { font-size: 9px; color: #475569; font-weight: 600; letter-spacing: 0.05em; }
.fps-monitor-stat-value { font-size: 12px; font-weight: 700; margin-top: 1px; }
.fps-monitor-stat[data-status="good"] .fps-monitor-stat-value { color: var(--fps-color-good); }
.fps-monitor-stat[data-status="warn"] .fps-monitor-stat-value { color: var(--fps-color-warn); }
.fps-monitor-stat[data-status="bad"] .fps-monitor-stat-value { color: var(--fps-color-bad); }
.fps-monitor-stat[data-status="neutral"] .fps-monitor-stat-value { color: #94a3b8; }
.fps-monitor-legend { display: flex; gap: 12px; margin-top: 8px; justify-content: center; }
.fps-monitor-legend-item { display: flex; align-items: center; gap: 4px; }
.fps-monitor-legend-dot { width: 6px; height: 6px; border-radius: 2px; }
.fps-monitor-legend-dot[data-status="good"] { background: var(--fps-color-good); }
.fps-monitor-legend-dot[data-status="warn"] { background: var(--fps-color-warn); }
.fps-monitor-legend-dot[data-status="bad"] { background: var(--fps-color-bad); }
.fps-monitor-legend-item span, .fps-monitor-legend-fps { color: #64748b; font-size: 9px; }
.fps-monitor-legend-fps { color: #475569; }
@keyframes fps-pulse { from { opacity: 0.5; } to { opacity: 1; } }
`;

export default FPSMonitor;
