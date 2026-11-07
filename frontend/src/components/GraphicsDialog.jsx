import { useEffect, useState } from 'react';
import { Gauge, Sparkles, Leaf, Zap, Check, Cpu, Monitor, SunMedium } from 'lucide-react';
import { GameDialog } from './GameDialog';

const MODES = [
  ['auto', 'Auto', Gauge, 'Reads the device and steps down if frames drop.'],
  ['high', 'High', Sparkles, 'Full window grid, sharp shadows, 60 FPS target.'],
  ['balanced', 'Balanced', Zap, 'Native pixels, lighter shadows, 45 FPS target.'],
  ['battery', 'Saver', Leaf, 'No shadows, lower resolution, 30 FPS target.'],
];

const specFor = (id, profile) => {
  if (id === 'auto') return { dpr: 'Adaptive', shadow: profile.shadows ? `${profile.shadowSize}` : 'Off', fps: String(profile.fps) };
  if (id === 'high') return { dpr: '1.25×', shadow: '1024', fps: '60' };
  if (id === 'balanced') return { dpr: '1.00×', shadow: '512', fps: '45' };
  return { dpr: '0.75×', shadow: 'Off', fps: '30' };
};

const fmt = n => n == null ? '—' : n >= 1000 ? `${(n / 1000).toFixed(1)}k` : String(n);

export const GraphicsDialog = ({ open, onClose, graphics }) => {
  const [stats, setStats] = useState(graphics.metrics.current);
  useEffect(() => { const id = setInterval(() => setStats(graphics.metrics.current), 500); return () => clearInterval(id); }, [graphics.metrics]);
  const profile = graphics.profile;
  return <GameDialog open={open} onClose={onClose} id="graphics" title="Render core" subtitle="Quality, shadows and the live frame budget." className="graphics-dialog">
    <div className="gfx-readout" data-testid="graphics-live-stats">
      <div><Monitor size={14}/><span>FPS<strong data-testid="measured-fps">{stats ? stats.fps : '—'}</strong></span></div>
      <div><Cpu size={14}/><span>FRAME<strong>{stats ? `${stats.frameMs} ms` : '—'}</strong></span></div>
      <div><SunMedium size={14}/><span>DRAWS<strong>{fmt(stats?.drawCalls)}</strong></span></div>
      <div><Gauge size={14}/><span>TRIS<strong>{fmt(stats?.triangles)}</strong></span></div>
    </div>
    <div className="graphics-options">{MODES.map(([id, name, Icon, detail]) => {
      const spec = specFor(id, profile);
      const on = graphics.mode === id;
      return <button key={id} className={`graphics-option ${on ? 'selected' : ''}`} data-testid={`graphics-mode-${id}`} aria-pressed={on} onClick={() => graphics.setMode(id)}>
        <span className="gfx-option-head"><Icon size={16}/><strong>{name}</strong>{on && <Check className="graphics-check" size={14}/>}</span>
        <span className="gfx-spec"><em>DPR {spec.dpr}</em><em>SHADOW {spec.shadow}</em><em>{spec.fps} FPS</em></span>
        <span>{detail}</span>
      </button>;
    })}</div>
    <div className="gfx-active">
      <span>ACTIVE PIPELINE</span>
      <strong data-testid="active-graphics-quality">{profile.tier === 'battery' ? 'Battery saver' : profile.tier}</strong>
      <em>{profile.dpr.toFixed(2)}× · {profile.shadows ? `${profile.shadowSize} shadow map` : 'shadows off'} · cap {profile.fps}</em>
    </div>
    <p className="graphics-note" data-testid="graphics-device-note">The scene pauses while a menu is open or this tab is in the background. Auto drops a tier after two slow windows.</p>
  </GameDialog>;
};
