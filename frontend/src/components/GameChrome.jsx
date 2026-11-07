import { ArrowUpRight, ArrowRight, Plus, Minus, Focus, Play, Store, Users, SlidersHorizontal, Trophy, Gift, Coins, Backpack, Sunrise, Sun, Sunset, Moon, Binary, LogOut, TrendingUp } from 'lucide-react';
import { Button } from './ui/button';
import { useEnvironment } from '../hooks/useEnvironment';
import { fmtUsd, fmtTokens } from '../hooks/useEconomy';

export const fmtCompactUsd = v => v == null ? '—' : `$${v.toLocaleString('en-US', { notation: 'compact', maximumFractionDigits: 2 })}`;

export const MarketCapBadge = ({ config, className = '' }) => {
  const live = config?.marketCapUsd != null;
  return <a className={`mcap-badge ${live ? '' : 'mcap-pending'} ${className}`} data-testid="market-cap-badge" href={config?.launchpadUrl || '#'} target="_blank" rel="noreferrer" title={live ? `${config.symbol} · ${config.totalSupply?.toLocaleString('en-US', { maximumFractionDigits: 0 })} supply · ${fmtUsd(config.tokenUsd, 6)}` : 'Market cap unavailable'}>
    <TrendingUp size={13}/><small>{config?.symbol || 'TOKEN'} MCAP</small><strong data-testid="market-cap-value">{live ? fmtCompactUsd(config.marketCapUsd) : '…'}</strong><span className={`online-dot ${live ? '' : 'offline'}`}/>
  </a>;
};

export const OnlineBadge = ({ online, className = '' }) => <div className={`mcap-badge online-badge ${online == null ? 'mcap-pending' : ''} ${className}`} data-testid="online-badge" title="People on the site right now">
  <Users size={13}/><small>ONLINE</small><strong data-testid="online-count">{online == null ? '…' : online.toLocaleString('en-US')}</strong><span className={`online-dot ${online == null ? 'offline' : ''}`}/>
</div>;

const SHOW_HEADER_ACCOUNT = false;
const SHOW_HEADER_MCAP = false;
const RENDER_NAME = { auto: 'AUTO', high: 'HIGH', balanced: 'BALANCED', battery: 'SAVER' };
export const GraphicsLaunch = ({ onClick, mode = 'auto', tier = 'high' }) => <button className="gfx-launch" data-testid="graphics-settings-button" onClick={onClick} title="Graphics settings">
  <span className="gfx-orb" aria-hidden="true"><SlidersHorizontal size={15}/></span>
  <span className="gfx-copy"><small>RENDER</small><strong>{RENDER_NAME[mode] || 'AUTO'}</strong></span>
  <em>{tier === 'battery' ? '30 FPS' : tier === 'balanced' ? '45 FPS' : '60 FPS'}</em>
</button>;

export const TokenChip = ({ config, className = '' }) => {
  const live = config?.tokenUsd != null;
  const addr = config?.tokenAddress;
  return <a className={`stat-chip chip-ca ${className}`} data-testid="token-info-chip" href={config?.launchpadUrl || '#'} target="_blank" rel="noreferrer" title="Open on Ponsfamily">
    <span className="chip-icon"><TrendingUp size={20}/></span>
    <div><small>{config?.symbol || 'TOKEN'} · {addr ? `${addr.slice(0, 6)}…${addr.slice(-4)}` : '—'}</small><strong data-testid="token-info-price">{live ? fmtUsd(config.tokenUsd, 8) : '…'}</strong></div>
    <em data-testid="token-info-mcap">MCAP {fmtCompactUsd(config?.marketCapUsd)} <ArrowUpRight size={10}/></em>
  </a>;
};

export const Header = ({ config, online, onGraphics, renderMode, renderTier, onPlay }) => <header className="site-header">
  <div className="header-left">
  <div className="brand" data-testid="frostfish-brand"><div className="brand-mark brand-fish-emblem" aria-hidden="true"><svg className="brand-fish-pixel" viewBox="0 0 48 48" shapeRendering="crispEdges"><rect className="brand-fish-fin" x="8" y="16" width="8" height="26"/><rect className="brand-fish-body" x="18" y="6" width="12" height="36"/><rect className="brand-fish-tail" x="32" y="12" width="8" height="30"/><rect className="brand-fish-eye" x="21" y="12" width="2" height="2"/><rect className="brand-fish-eye" x="25" y="12" width="2" height="2"/><rect className="brand-fish-eye" x="21" y="18" width="2" height="2"/><rect className="brand-fish-eye" x="25" y="18" width="2" height="2"/><rect className="brand-fish-eye" x="11" y="22" width="2" height="2"/><rect className="brand-fish-eye" x="35" y="20" width="2" height="2"/></svg><span className="brand-star">✦</span></div><div className="brand-copy"><strong className="brand-wordmark">ROBINHACKERS</strong></div></div>
  <GraphicsLaunch onClick={onGraphics} mode={renderMode} tier={renderTier}/>
  </div>
  {onPlay && <div className="header-play"><Button className="pixel-button play-button" data-testid="play-button" onClick={onPlay}><Play size={21} fill="currentColor"/><span>PLAY</span><ArrowRight size={23}/></Button></div>}
  {SHOW_HEADER_MCAP && <MarketCapBadge config={config} className="header-mcap"/>}
  {config && <TokenChip config={config} className="header-token"/>}
  {SHOW_HEADER_ACCOUNT && <OnlineBadge online={online} className="header-online"/>}
</header>;

export const Welcome = () => <section className="welcome-copy">
    <h1 data-testid="welcome-title">ROBINHACKERS</h1>
    <div className="play-note" data-testid="play-note"><span className="online-dot"/> Open a floor <span>·</span> Start a link</div>
  </section>;

const PHASE_ICON = { morning: Sunrise, noon: Sun, evening: Sunset, night: Moon };
export const EnvChip = () => {
  const { phase, weather } = useEnvironment();
  const Icon = PHASE_ICON[phase], Weather = weather === 'matrix' ? Binary : Sun;
  return <div className={`hud-env env-${phase} weather-${weather}`} data-testid="day-weather-chip"><span data-testid="day-phase"><Icon size={14}/> {phase.toUpperCase()}</span><i/><span data-testid="weather-state"><Weather size={14}/> {weather === 'matrix' ? 'MATRIX' : weather.toUpperCase()}</span></div>;
};

const Stat = ({ className, icon: Icon, label, value, testid, extra }) => <div className={`stat-chip ${className}`} data-testid={`${testid}-stat`}>
  <span className="chip-icon"><Icon size={20}/></span><div><small>{label}</small><strong data-testid={`${testid}-value`}>{value}</strong></div>{extra}
</div>;

export const TopHUD = ({ game, config, wallet, online, onLeaderboard, onInventory, onGraphics, renderMode, renderTier }) => {
  const symbol = config?.symbol || 'TOKEN';
  const tokens = config?.tokenUsd ? game.claimable_usd / config.tokenUsd : null;
  return <>
  <div className="hud-top-left">
    <GraphicsLaunch onClick={onGraphics} mode={renderMode} tier={renderTier}/>
    <button className="game-btn btn-violet" data-testid="leaderboard-button" onClick={onLeaderboard}><span className="btn-icon"><Trophy size={20}/></span><span className="btn-label">LEADERBOARD<small>{game.name}</small></span></button>
  </div>
  <div className="hud-top-right">
    <div className="hud-stats">
      <TokenChip config={config}/>
      <Stat className="chip-workers" icon={Users} label="ACTIVE WORKERS" testid="active-workers" value={`${game.active_workers}/${game.workers.length}`}/>
      <button className="stat-chip chip-rewards stat-button" data-testid="rewards-stat" onClick={onInventory} title="Open inventory to claim">
        <span className="chip-icon"><Gift size={20}/></span><div><small>CLAIMABLE</small><strong data-testid="rewards-value">{fmtUsd(game.claimable_usd, 4)}</strong></div><em data-testid="hourly-yield-total">+{fmtUsd(game.hourly_usd, 4)}/h</em>
      </button>
      <Stat className="chip-token" icon={Coins} label={`${symbol} WALLET`} testid="token" value={fmtTokens(wallet.balance)} extra={<em data-testid="token-usd-value">{wallet.balance != null && config?.tokenUsd ? `≈ ${fmtUsd(wallet.balance * config.tokenUsd)}` : tokens != null ? `≈ ${fmtTokens(tokens)} claimable` : '…'}</em>}/>
    </div>
    <div className="hud-sub">{SHOW_HEADER_MCAP && <MarketCapBadge config={config} className="hud-mcap"/>}<EnvChip/>{!online&&<span className="hud-offline" data-testid="offline-indicator">Reconnecting…</span>}</div>
  </div>
</>;
};

export const BottomBar = ({ onMarket, onInventory, owned }) => <div className="hud-bottom">
  <button className="game-btn btn-gold" data-testid="market-button" onClick={onMarket}><span className="btn-icon"><Store size={24}/></span><span className="btn-label">MARKET<small>Hire hackers</small></span></button>
  <button className="game-btn btn-teal" data-testid="inventory-button" onClick={onInventory}><span className="btn-icon"><Backpack size={24}/></span><span className="btn-label">INVENTORY<small>Your workers</small></span><span className="btn-count" data-testid="inventory-count">{owned}</span></button>
</div>;

export const Footer = ({ active, zoom, setZoom, onResetCamera, onLogout }) => <footer className="world-footer">
  {!active&&<div className="world-location" data-testid="world-location"><span className="compass-symbol">✥</span><span>ROBINHACKERS <i>/</i> <b>DISTRICT 01</b></span><span className="footer-coordinates">40° 42′ N &nbsp; 74° 00′ W</span></div>}
  <div className="world-controls">
    <div className="zoom-controls"><button title="Zoom out" aria-label="Zoom out" data-testid="zoom-out-button" onClick={()=>setZoom(Math.max(.4,zoom-.15))} disabled={zoom<=.4}><Minus size={16}/></button><button title="Reset view" aria-label="Reset view" data-testid="reset-camera-button" onClick={onResetCamera}><Focus size={17}/></button><button title="Zoom in" aria-label="Zoom in" data-testid="zoom-in-button" onClick={()=>setZoom(Math.min(1.6,zoom+.15))} disabled={zoom>=1.6}><Plus size={16}/></button></div>
    {active && <button className="footer-icon footer-logout" title="Sign out" aria-label="Sign out" data-testid="logout-button" onClick={onLogout}><LogOut size={16}/></button>}
  </div>
</footer>;
