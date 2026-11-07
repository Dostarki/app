import { useEffect, useRef, useState } from 'react';
import { buildVillage } from '../game/villageBuilder';
import { minedNow } from '../hooks/useOps';
import { TIERS } from '../lib/gameData';

const LOOKS = [
  { hair: '#24160f', skin: '#f0c09a', shirt: '#3f9a4c', desk: '#6b4330', screen: '#7dffb3', dots: ['#39e7ff', '#ff4f8b'], monitors: 1 },
  { hair: '#f4f6fb', skin: '#f3c7a6', shirt: '#e7ebf4', desk: '#f3ece4', screen: '#8eb6ff', dots: ['#3d7eff', '#ff4f6a', '#ffd15c'], monitors: 3 },
  { hair: '#f7f7f7', skin: '#e7b48f', shirt: '#e23d3d', desk: '#d7dbe6', screen: '#b9dcff', dots: ['#7eb6ff', '#ff5a6a'], monitors: 1, glasses: true, mustache: true },
];
const LINES = ['COMPILING', 'LISTENING', 'ROUTING', 'LINKED', 'SYNCING'];
const W = 72;
const H = 80;

const hex = value => {
  const n = parseInt(value.slice(1), 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255, 255];
};

function paint(view, look, frame, bits, body) {
  view.fill(0);
  const set = (x, y, color) => {
    const px = x | 0;
    const py = y | 0;
    if (px < 0 || py < 0 || px >= W || py >= H) return;
    const i = (py * W + px) * 4;
    view[i] = color[0]; view[i + 1] = color[1]; view[i + 2] = color[2]; view[i + 3] = color[3];
  };
  const rect = (x, y, w, h, color) => {
    for (let yy = 0; yy < h; yy++) for (let xx = 0; xx < w; xx++) set(x + xx, y + yy, color);
  };
  const bg = hex('#120c18');
  const skin = hex(look.skin);
  const hair = hex(look.hair);
  const shirt = hex(look.shirt);
  const desk = hex(look.desk);
  const screen = hex(look.screen);
  rect(0, 0, W, H, bg);
  const bob = Math.sin(frame * 0.08) > 0 ? 0 : 1;
  const split = 37 + Math.round(Math.sin(frame * 0.05));
  rect(20, 2 + bob, 32, 12, hair);
  rect(22, 12 + bob, 28, 18, skin);
  rect(28, 18 + bob, 4, 4, hex('#1a1422'));
  rect(40, 18 + bob, 4, 4, hex('#1a1422'));
  if (look.glasses) rect(26, 18 + bob, 20, 3, hex('#241820'));
  if (look.mustache) rect(32, 26 + bob, 8, 3, hex('#6a3a28'));
  rect(16, 30 + bob, 40, 28, shirt);
  rect(8, 34 + bob, 10, 16, shirt);
  rect(54, 34 + bob, 10, 16, shirt);
  const hand = frame % 12 < 6 ? 0 : 1;
  rect(18, 56 + hand, 8, 4, skin);
  rect(46, 56 + (1 - hand), 8, 4, skin);
  rect(4, 64, 64, 8, desk);
  rect(4, 72, 64, 6, hex('#1a1218'));
  if (body !== 'full') {
    for (let y = 0; y < 64; y++) {
      const from = body === 'dark' ? 0 : split;
      for (let x = from; x < W; x++) {
        const i = (y * W + x) * 4;
        if (!view[i + 3]) continue;
        view[i] = Math.round(view[i] * 0.08);
        view[i + 1] = Math.round(view[i + 1] * 0.08);
        view[i + 2] = Math.round(view[i + 2] * 0.1);
      }
    }
  }
  const screens = look.monitors === 3 ? [[6, 40, 18, 18], [26, 36, 20, 22], [48, 40, 18, 18]] : [[22, 40, 28, 20]];
  screens.forEach((box, index) => {
    rect(box[0], box[1], box[2], box[3], hex('#101418'));
    rect(box[0] + 2, box[1] + 2, box[2] - 4, box[3] - 6, screen);
    const scan = (frame + index * 4) % Math.max(1, box[3] - 6);
    rect(box[0] + 2, box[1] + 2 + scan, box[2] - 4, 1, hex('#f4fbff'));
    look.dots.forEach((dot, dotIndex) => set(box[0] + 3 + dotIndex * 4, box[1] + box[3] - 3, hex(dot)));
  });
  if (body === 'split') for (let y = 6; y < 62; y++) {
    for (let x = 6; x < 30; x++) {
      if (((x * 13 + y * 7 + frame) % 11) !== 0) continue;
      const i = (y * W + x) * 4;
      if (!view[i + 3]) continue;
      if (bits.motes.length < 40) bits.motes.push({ x, y, vx: -0.55 - Math.random() * 0.4, vy: -0.25 + Math.random() * 0.2, life: 14 + Math.random() * 16, color: [view[i], view[i + 1], view[i + 2], 255] });
      view[i + 3] = 0;
    }
  }
  if (bits.glitch > 0) {
    const copy = view.slice();
    for (let y = bits.band; y < bits.band + 3 && y < H; y++) {
      for (let x = 0; x < W; x++) {
        const from = Math.max(0, Math.min(W - 1, x - bits.shift));
        const si = (y * W + from) * 4;
        const di = (y * W + x) * 4;
        view[di] = copy[si]; view[di + 1] = copy[si + 1]; view[di + 2] = copy[si + 2]; view[di + 3] = copy[si + 3];
      }
    }
  }
  bits.motes = bits.motes.filter(mote => mote.life > 0);
  bits.motes.forEach(mote => {
    mote.x += mote.vx; mote.y += mote.vy; mote.life -= 1;
    set(mote.x, mote.y, mote.color);
  });
  if (bits.glitch > 0) bits.glitch -= 1;
  else if (frame % 110 === 0) { bits.glitch = 4; bits.band = 18 + Math.floor(Math.random() * 30); bits.shift = Math.random() < 0.5 ? -3 : 3; }
}

const MAX_LEVEL = () => buildVillage().buildings.filter(b => b.role === 'hostile').length;

const OwnedHacker = ({ crew, floor }) => {
  const mine = crew.find(l => l.floorId === floor.id) || crew[0];
  const tier = TIERS[mine.tier - 1];
  return <div className="owned-hacker" data-testid="owned-hacker" style={{ '--tier': mine.color }}>
    <div className="owned-hacker-stage"><img src={tier.image} alt={tier.name} draggable="false" data-testid="owned-hacker-image" /><i className="owned-hacker-scan" /></div>
    <strong data-testid="owned-hacker-name">{tier.name}</strong>
    <span data-testid="owned-hacker-meta">TIER {mine.tier} · #{mine.uid} · LINKED{crew.length > 1 ? ` · ${crew.length} HACKERS` : ''}</span>
  </div>;
};

export function HackerBubble({ floor, onClose, elRef, ops, crew = [] }) {
  const canvas = useRef(null);
  const role = floor.role || 'city';
  const body = role === 'hostile' ? 'dark' : role === 'base' ? 'full' : 'split';
  const owned = crew.length > 0 && role !== 'bank' && role !== 'cyber' && role !== 'hostile';
  const panel = role === 'bank' || role === 'cyber' || owned;
  const look = LOOKS[floor.id % LOOKS.length];
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    if (role !== 'bank' || !ops?.mining) return;
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, [role, ops?.mining]);
  useEffect(() => {
    const node = canvas.current;
    if (!node || panel) return;
    const ctx = node.getContext('2d', { alpha: true });
    const view = new Uint8ClampedArray(W * H * 4);
    const bits = { motes: [], glitch: 0, band: 0, shift: 0 };
    let frame = 0;
    let raf = 0;
    const draw = () => {
      paint(view, look, frame, bits, body);
      const image = new ImageData(view.slice(), W, H);
      ctx.putImageData(image, 0, 0);
      frame += 1;
      raf = requestAnimationFrame(draw);
    };
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    draw();
    if (reduce) cancelAnimationFrame(raf);
    return () => cancelAnimationFrame(raf);
  }, [look, body, panel]);
  const mined = ops ? minedNow(ops) : 0;
  void now;
  const linked = !!(ops?.mining && ops.miningGate === floor.gate);
  const title = role === 'bank' ? 'BANK' : role === 'cyber' ? 'SECURITY' : role === 'base' ? 'HOME BASE' : role === 'hostile' ? `NODE ${String(floor.gate).padStart(2, '0')}` : `FLOOR ${String(floor.level).padStart(2, '0')}`;
  const status = role === 'hostile'
    ? (floor.gate > ops.level ? 'DARK' : linked ? 'LINK' : floor.gate === ops.level ? 'READY' : 'OFF')
    : role === 'bank' ? (ops.mining ? 'LIVE' : 'IDLE') : `LV ${ops?.level || 1}`;
  const maxed = ops && ops.level >= MAX_LEVEL();
  return <aside ref={elRef} className="floor-bubble" data-testid="floor-bubble" role="dialog" aria-label={title}>
    <header><span>{title}</span><em>{role === 'city' ? LINES[floor.level % LINES.length] : status}</em><button type="button" onClick={onClose} aria-label="Close floor">×</button></header>
    {!panel && <canvas ref={canvas} width={W} height={H} className="hacker-stage" />}
    {owned && <OwnedHacker crew={crew} floor={floor} />}
    {role === 'hostile' && <div className="ops-sheet">
      {floor.gate > ops.level && <p className="ops-note">Locked. Its lights turn on when your level reaches it.</p>}
      {floor.gate < ops.level && linked && <p className="ops-note">Lights are out. Mining keeps running while this antenna stays on.</p>}
      {floor.gate < ops.level && !linked && <p className="ops-note">This building is dark.</p>}
      {floor.gate === ops.level && linked && <p className="ops-note">Antenna is lit. Mining runs until you link the next building.</p>}
      {floor.gate === ops.level && !linked && <button type="button" className="ops-go" data-testid="hack-start" onClick={() => ops.start(floor.gate)}>START HACK</button>}
    </div>}
    {role === 'base' && !owned && <p className="ops-note">Home base. Lights stay on. Links are opened from here.</p>}
    {role === 'bank' && <div className="ops-sheet" data-testid="bank-sheet">
      <div className="ops-row"><span>MINED</span><strong data-testid="mine-total">{mined.toFixed(1)}</strong></div>
      <div className="ops-row"><span>LEVEL</span><strong>{ops.level}</strong></div>
      <div className="ops-row"><span>RATE</span><strong>{(ops.rate * 3600).toFixed(0)} /h</strong></div>
      <div className="ops-row"><span>STATUS</span><strong>{ops.mining ? `NODE ${String(ops.miningGate).padStart(2, '0')}` : 'OFF'}</strong></div>
    </div>}
    {role === 'cyber' && <div className="ops-sheet" data-testid="upgrade-sheet">
      {maxed ? <p className="ops-note">Max level.</p> : <>
        <p className="ops-note">A new hacker turns the old building dark and lights the next one. Mining keeps the old rate until you start the new building.</p>
        <div className="ops-row"><span>COST</span><strong data-testid="upgrade-cost">{ops.cost}</strong></div>
        <button type="button" className="ops-go" data-testid="hack-upgrade" disabled={mined < ops.cost} onClick={ops.upgrade}>{mined < ops.cost ? 'SHORT' : 'UPGRADE'}</button>
      </>}
    </div>}
  </aside>;
}
