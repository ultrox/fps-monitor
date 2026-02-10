/**
 * Real-time FPS Monitor
 * Zero dependencies, framework-agnostic
 */

type Position = 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left';
type Classification = 'good' | 'warn' | 'bad';

interface FPSMonitorOptions {
  position?: Position;
  collapsed?: boolean;
}

const BUFFER_SIZE = 120;
const TARGET_FPS = 60;
const TARGET_FRAME_MS = 1000 / TARGET_FPS;
const GRAPH_WIDTH = 280;
const GRAPH_HEIGHT = 80;
const BAR_GAP = 1;

const COLORS: Record<Classification, string> = {
  good: '#22c55e',
  warn: '#eab308',
  bad: '#ef4444',
};

const POSITIONS: Record<Position, string> = {
  'top-right': 'top:12px;right:12px',
  'top-left': 'top:12px;left:12px',
  'bottom-right': 'bottom:12px;right:12px',
  'bottom-left': 'bottom:12px;left:12px',
};

function classifyFps(fps: number): Classification {
  if (fps >= 55) return 'good';
  if (fps >= 30) return 'warn';
  return 'bad';
}

function classifyMs(ms: number): Classification {
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
  private minDisplay: HTMLSpanElement;
  private avgDisplay: HTMLSpanElement;
  private maxDisplay: HTMLSpanElement;
  private frameDisplay: HTMLSpanElement;
  private dot: HTMLDivElement;
  private arrow: HTMLSpanElement;
  private expandedPanel: HTMLDivElement;

  private buffer = new Float64Array(BUFFER_SIZE).fill(TARGET_FRAME_MS);
  private index = 0;
  private lastTime = performance.now();
  private rafId: number | null = null;
  private sampleCount = 0;
  private minFps = 60;
  private maxFps = 60;
  private collapsed: boolean;

  constructor(options: FPSMonitorOptions = {}) {
    const { position = 'top-right', collapsed = false } = options;
    this.collapsed = collapsed;

    // Inject styles
    this.injectStyles();

    // Build DOM
    this.container = document.createElement('div');
    this.container.className = 'fps-monitor';
    this.container.style.cssText = POSITIONS[position];

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
            <div class="fps-monitor-stat"><div class="fps-monitor-stat-label">MIN</div><div class="fps-monitor-stat-value fps-monitor-min">60</div></div>
            <div class="fps-monitor-stat"><div class="fps-monitor-stat-label">AVG</div><div class="fps-monitor-stat-value fps-monitor-avg">60</div></div>
            <div class="fps-monitor-stat"><div class="fps-monitor-stat-label">MAX</div><div class="fps-monitor-stat-value fps-monitor-max">60</div></div>
            <div class="fps-monitor-stat"><div class="fps-monitor-stat-label">FRAME</div><div class="fps-monitor-stat-value fps-monitor-frame">16.7ms</div></div>
          </div>
          <div class="fps-monitor-legend">
            <div class="fps-monitor-legend-item"><div class="fps-monitor-legend-dot" style="background:#22c55e"></div><span>≥55</span></div>
            <div class="fps-monitor-legend-item"><div class="fps-monitor-legend-dot" style="background:#eab308"></div><span>30–55</span></div>
            <div class="fps-monitor-legend-item"><div class="fps-monitor-legend-dot" style="background:#ef4444"></div><span>&lt;30</span></div>
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
    this.minDisplay = this.container.querySelector('.fps-monitor-min')!;
    this.avgDisplay = this.container.querySelector('.fps-monitor-avg')!;
    this.maxDisplay = this.container.querySelector('.fps-monitor-max')!;
    this.frameDisplay = this.container.querySelector('.fps-monitor-frame')!;
    this.dot = this.container.querySelector('.fps-monitor-dot')!;
    this.arrow = this.container.querySelector('.fps-monitor-arrow')!;
    this.expandedPanel = this.container.querySelector('.fps-monitor-expanded')!;

    // Header click to toggle
    const header = this.container.querySelector('.fps-monitor-header')!;
    header.addEventListener('click', () => this.toggle());

    // Set initial state
    if (collapsed) {
      this.expandedPanel.style.display = 'none';
      this.arrow.style.transform = 'rotate(0deg)';
    }

    // Mount
    document.body.appendChild(this.container);

    // Start
    this.start();
  }

  private injectStyles(): void {
    if (document.getElementById('fps-monitor-styles')) return;

    const style = document.createElement('style');
    style.id = 'fps-monitor-styles';
    style.textContent = `
      .fps-monitor {
        position: fixed;
        z-index: 999999;
        font-family: 'JetBrains Mono', 'SF Mono', 'Fira Code', monospace;
        font-size: 11px;
        color: #e2e8f0;
        user-select: none;
      }
      .fps-monitor-inner {
        background: rgba(15, 23, 42, 0.92);
        backdrop-filter: blur(12px);
        border: 1px solid rgba(255,255,255,0.08);
        border-radius: 10px;
        overflow: hidden;
        box-shadow: 0 8px 32px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.05);
        min-width: ${GRAPH_WIDTH + 20}px;
      }
      .fps-monitor.collapsed .fps-monitor-inner { min-width: auto; }
      .fps-monitor-header {
        display: flex;
        align-items: center;
        justify-content: space-between;
        padding: 8px 12px;
        cursor: pointer;
        border-bottom: 1px solid rgba(255,255,255,0.06);
        transition: background 0.15s;
      }
      .fps-monitor.collapsed .fps-monitor-header { border-bottom: none; }
      .fps-monitor-header:hover { background: rgba(255,255,255,0.04); }
      .fps-monitor-left, .fps-monitor-right { display: flex; align-items: center; gap: 8px; }
      .fps-monitor-right { gap: 10px; }
      .fps-monitor-dot {
        width: 7px; height: 7px; border-radius: 50%;
        background: #22c55e;
        box-shadow: 0 0 6px #22c55e;
      }
      .fps-monitor-dot.bad { animation: fpsPulse 0.6s ease-in-out infinite alternate; }
      .fps-monitor-fps { font-weight: 700; font-size: 13px; letter-spacing: -0.02em; }
      .fps-monitor-label { color: #94a3b8; font-size: 10px; font-weight: 500; }
      .fps-monitor-ms { color: #64748b; font-size: 10px; }
      .fps-monitor-arrow { color: #64748b; font-size: 9px; transition: transform 0.2s; display: inline-block; transform: rotate(180deg); }
      .fps-monitor-expanded { padding: 8px 10px 10px; }
      .fps-monitor-canvas { border-radius: 6px; display: block; width: ${GRAPH_WIDTH}px; height: ${GRAPH_HEIGHT}px; }
      .fps-monitor-stats { display: flex; justify-content: space-between; margin-top: 8px; padding: 0 2px; }
      .fps-monitor-stat { text-align: center; }
      .fps-monitor-stat-label { font-size: 9px; color: #475569; font-weight: 600; letter-spacing: 0.05em; }
      .fps-monitor-stat-value { font-size: 12px; font-weight: 700; margin-top: 1px; }
      .fps-monitor-legend { display: flex; gap: 12px; margin-top: 8px; justify-content: center; }
      .fps-monitor-legend-item { display: flex; align-items: center; gap: 4px; }
      .fps-monitor-legend-dot { width: 6px; height: 6px; border-radius: 2px; }
      .fps-monitor-legend-item span, .fps-monitor-legend-fps { color: #64748b; font-size: 9px; }
      .fps-monitor-legend-fps { color: #475569; }
      @keyframes fpsPulse { from { opacity: 0.5; } to { opacity: 1; } }
    `;
    document.head.appendChild(style);
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

    // 60fps line
    const y60 = (TARGET_FRAME_MS / maxMs) * h;
    this.ctx.strokeStyle = 'rgba(34,197,94,0.3)';
    this.ctx.lineWidth = 1;
    this.ctx.setLineDash([4, 4]);
    this.ctx.beginPath();
    this.ctx.moveTo(0, h - y60);
    this.ctx.lineTo(w, h - y60);
    this.ctx.stroke();

    // 30fps line
    const y30 = (33.33 / maxMs) * h;
    this.ctx.strokeStyle = 'rgba(239,68,68,0.3)';
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

      this.ctx.fillStyle = COLORS[classifyMs(ms)];
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

      // Update DOM
      const classification = classifyFps(avgFps);
      const color = COLORS[classification];

      this.fpsDisplay.textContent = String(avgFps);
      this.fpsDisplay.style.color = color;
      this.msDisplay.textContent = `${avgMs.toFixed(1)}ms`;
      this.dot.style.background = color;
      this.dot.style.boxShadow = `0 0 6px ${color}`;
      this.dot.classList.toggle('bad', classification === 'bad');

      if (!this.collapsed) {
        this.minDisplay.textContent = String(Math.round(this.minFps));
        this.minDisplay.style.color = COLORS[classifyFps(this.minFps)];
        this.avgDisplay.textContent = String(avgFps);
        this.avgDisplay.style.color = color;
        this.maxDisplay.textContent = String(Math.round(this.maxFps));
        this.maxDisplay.style.color = COLORS[classifyFps(this.maxFps)];
        this.frameDisplay.textContent = `${avgMs.toFixed(1)}ms`;
        this.drawGraph();
      }
    }

    this.rafId = requestAnimationFrame(this.tick);
  };

  toggle(): void {
    this.collapsed = !this.collapsed;
    this.container.classList.toggle('collapsed', this.collapsed);
    this.expandedPanel.style.display = this.collapsed ? 'none' : 'block';
    this.arrow.style.transform = this.collapsed ? 'rotate(0deg)' : 'rotate(180deg)';
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

export default FPSMonitor;
