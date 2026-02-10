"use strict";(()=>{var u=16.666666666666668,S=280,y=80,g=1;function m(i){return i>=55?"good":i>=30?"warn":"bad"}function F(i){return i<=18?"good":i<=33?"warn":"bad"}var f=class{constructor(t={}){this.buffer=new Float64Array(120).fill(u);this.index=0;this.lastTime=performance.now();this.rafId=null;this.sampleCount=0;this.minFps=60;this.maxFps=60;this.tick=t=>{let o=t-this.lastTime;if(this.lastTime=t,o>0&&o<500){this.buffer[this.index]=o,this.index=(this.index+1)%120,this.sampleCount++;let s=1e3/o;this.sampleCount>60&&(s<this.minFps&&(this.minFps=s),s>this.maxFps&&(this.maxFps=s));let e=0,p=Math.min(20,120);for(let n=0;n<p;n++){let a=(this.index-1-n+120)%120;e+=this.buffer[a]}let l=e/p,r=Math.round(1e3/l),d=m(r);if(this.container.dataset.status=d,this.fpsDisplay.textContent=String(r),this.msDisplay.textContent=`${l.toFixed(1)}ms`,!this._collapsed){let n=Math.round(this.minFps),a=Math.round(this.maxFps);this.minStat.dataset.status=m(n),this.minStat.querySelector(".fps-monitor-stat-value").textContent=String(n),this.avgStat.dataset.status=d,this.avgStat.querySelector(".fps-monitor-stat-value").textContent=String(r),this.maxStat.dataset.status=m(a),this.maxStat.querySelector(".fps-monitor-stat-value").textContent=String(a),this.frameStat.querySelector(".fps-monitor-stat-value").textContent=`${l.toFixed(1)}ms`,this.drawGraph()}}this.rafId=requestAnimationFrame(this.tick)};let{position:o="top-right",collapsed:s=!1,injectStyles:e=!0}=t;this._collapsed=s,e&&this.injectStyles(),this.container=document.createElement("div"),this.container.className="fps-monitor",this.container.dataset.position=o,this.container.dataset.collapsed=String(s),this.container.dataset.status="good",this.container.innerHTML=`
      <div class="fps-monitor-inner">
        <div class="fps-monitor-header">
          <div class="fps-monitor-left">
            <div class="fps-monitor-dot"></div>
            <span class="fps-monitor-fps">60</span>
            <span class="fps-monitor-label">FPS</span>
          </div>
          <div class="fps-monitor-right">
            <span class="fps-monitor-ms">16.7ms</span>
            <span class="fps-monitor-arrow">\u25BC</span>
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
              <span>\u226555</span>
            </div>
            <div class="fps-monitor-legend-item">
              <div class="fps-monitor-legend-dot" data-status="warn"></div>
              <span>30\u201355</span>
            </div>
            <div class="fps-monitor-legend-item">
              <div class="fps-monitor-legend-dot" data-status="bad"></div>
              <span>&lt;30</span>
            </div>
            <span class="fps-monitor-legend-fps">fps</span>
          </div>
        </div>
      </div>
    `,this.canvas=this.container.querySelector(".fps-monitor-canvas"),this.ctx=this.canvas.getContext("2d"),this.fpsDisplay=this.container.querySelector(".fps-monitor-fps"),this.msDisplay=this.container.querySelector(".fps-monitor-ms"),this.minStat=this.container.querySelector('[data-stat="min"]'),this.avgStat=this.container.querySelector('[data-stat="avg"]'),this.maxStat=this.container.querySelector('[data-stat="max"]'),this.frameStat=this.container.querySelector('[data-stat="frame"]'),this.container.querySelector(".fps-monitor-header").addEventListener("click",()=>this.toggle()),document.body.appendChild(this.container),this.start()}injectStyles(){if(document.getElementById("fps-monitor-styles"))return;let t=document.createElement("style");t.id="fps-monitor-styles",t.textContent=w,document.head.appendChild(t)}getColor(t){return getComputedStyle(this.container).getPropertyValue(`--fps-color-${t}`).trim()||(t==="good"?"#22c55e":t==="warn"?"#eab308":"#ef4444")}drawGraph(){let t=window.devicePixelRatio||1,o=S,s=y;this.canvas.width=o*t,this.canvas.height=s*t,this.ctx.scale(t,t),this.ctx.clearRect(0,0,o,s),this.ctx.fillStyle="rgba(0,0,0,0.3)",this.ctx.fillRect(0,0,o,s);let e=50,p=this.getColor("good"),l=this.getColor("bad"),r=u/e*s;this.ctx.strokeStyle=p+"4D",this.ctx.lineWidth=1,this.ctx.setLineDash([4,4]),this.ctx.beginPath(),this.ctx.moveTo(0,s-r),this.ctx.lineTo(o,s-r),this.ctx.stroke();let d=33.33/e*s;this.ctx.strokeStyle=l+"4D",this.ctx.beginPath(),this.ctx.moveTo(0,s-d),this.ctx.lineTo(o,s-d),this.ctx.stroke(),this.ctx.setLineDash([]);let n=(o-g*119)/120;for(let a=0;a<120;a++){let x=(this.index+a)%120,h=this.buffer[x],v=Math.min(h,e)/e*s,b=a*(n+g);this.ctx.fillStyle=this.getColor(F(h)),this.ctx.globalAlpha=.4+.6*(a/120),this.ctx.fillRect(b,s-v,n,v)}this.ctx.globalAlpha=1}get collapsed(){return this._collapsed}set collapsed(t){this._collapsed=t,this.container.dataset.collapsed=String(t)}toggle(){this.collapsed=!this._collapsed}start(){this.rafId||(this.lastTime=performance.now(),this.rafId=requestAnimationFrame(this.tick))}stop(){this.rafId&&(cancelAnimationFrame(this.rafId),this.rafId=null)}destroy(){this.stop(),this.container.remove()}},w=`
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
`;var c=null;chrome.runtime.onMessage.addListener((i,t,o)=>(i.action==="toggle"?c?(c.destroy(),c=null,o({active:!1})):(c=new f({position:"top-right",collapsed:!1}),o({active:!0})):i.action==="status"&&o({active:!!c}),!0));})();
