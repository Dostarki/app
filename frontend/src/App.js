import { lazy, Suspense, useCallback, useEffect, useRef, useState } from 'react';
import { toast } from 'sonner';
import { useGame } from './hooks/useGame';
import { useEconomy, useTokenWallet, fmtTokens, fmtUsd } from './hooks/useEconomy';
import { Header, Welcome, TopHUD, BottomBar, Footer } from './components/GameChrome';
import { MarketDialog, InventoryDialog, LeaderboardDialog } from './components/InfoDialogs';
import { Toaster } from './components/ui/sonner';
import { SunsetSky } from './components/SunsetSky';
import { WeatherOverlay } from './components/WeatherOverlay';
import { GraphicsDialog } from './components/GraphicsDialog';
import { useGraphics } from './hooks/useGraphics';
import { useBoot } from './hooks/useBoot';
import { usePresence } from './hooks/usePresence';
import { BootScreen } from './components/BootScreen';
import { PlayGate } from './components/PlayGate';
import { EntryGate } from './components/EntryGate';
import { useEntryFee } from './hooks/useEntryFee';
import { useConnectModal } from '@rainbow-me/rainbowkit';
import { TIER_BY_ID } from './lib/gameData';
import './App.css';
import './sunset.css';
import './mobile.css';
import './hud.css';
import './auth.css';
import './economy.css';
import './neon.css';
const World=lazy(()=>import('./game/World').then(module=>({default:module.World})));
const PENDING_KEY='frostfish-pending-purchase';
const rejected=e=>e?.code===4001||e?.name==='UserRejectedRequestError'||/reject|denied|cancel/i.test(e?.shortMessage||e?.message||'');

export default function App() {
  const { game, gameRef, signIn, challengeFor, resume, logout, quote, confirmPurchase, claim, claimHistory, busy, online, actionError, clearActionError, leaderboard, entryQuote, confirmEntry } = useGame();
  const { openConnectModal } = useConnectModal();
  const [signError, setSignError] = useState('');
  const { config, refresh: refreshConfig } = useEconomy();
  const wallet = useTokenWallet(config);
  const boot=useBoot(resume);
  const visitors=usePresence();
  const [modal, setModal] = useState(null);
  const [buying, setBuying] = useState(null);
  const [pendingPurchase, setPendingPurchase] = useState(()=>{ try { return JSON.parse(localStorage.getItem(PENDING_KEY)); } catch { return null; } });
  const [zoom, setZoom] = useState(1), [cameraReset, setCameraReset] = useState(0);
  const active = !!game;
  const graphics=useGraphics();
  const close=useCallback(()=>setModal(null),[]);
  const openMarket=useCallback(()=>setModal('market'),[]);
  const openInventory=useCallback(()=>setModal('inventory'),[]);
  const openLeaderboard=useCallback(()=>setModal('leaderboard'),[]);
  const openGraphics=useCallback(()=>setModal('graphics'),[]);
  const openPlay=useCallback(()=>{setSignError('');setModal('play');},[]);
  const entry=useEntryFee({active,entryQuote,confirmEntry});
  const doSignIn=useCallback(async(args)=>{
    setSignError('');
    const r=await signIn(args);
    if(r.error)setSignError(r.error); else { setModal(null); toast.success('Wallet linked. Welcome to RobinHackers!'); }
  },[signIn]);
  const signOut=useCallback(async()=>{setModal(null);await logout();toast.success('Signed out of RobinHackers.');},[logout]);
  const savePending=useCallback((value)=>{ setPendingPurchase(value); if(value)localStorage.setItem(PENDING_KEY,JSON.stringify(value)); else localStorage.removeItem(PENDING_KEY); },[]);
  const finishPurchase=useCallback(async(p)=>{
    try{
      const data=await confirmPurchase(p.quoteId,p.txHash);
      savePending(null); wallet.refetch();
      toast.success(`${TIER_BY_ID[data.purchase.character]?.name||'Hacker'} hired for ${fmtUsd(data.purchase.price_usd,0)}! Hashing has started.`);
      return true;
    }catch(e){
      if(e.status&&e.status!==503&&!/pending/i.test(e.message))savePending(null);
      toast.error(e.message); return false;
    }
  },[confirmPurchase,savePending,wallet]);
  const resumedPending=useRef(false);
  useEffect(()=>{ if(active&&pendingPurchase&&!resumedPending.current){resumedPending.current=true;finishPurchase(pendingPurchase);} },[active,pendingPurchase,finishPurchase]);
  const buy=async(character,afford)=>{
    clearActionError();
    if(!afford){ window.open(config.launchpadUrl,'_blank','noopener'); toast.info(`Not enough ${config.symbol}. Buy some on the launchpad, then come back.`); return; }
    setBuying(character);
    try{
      const q=await quote(character);
      if(wallet.raw!=null&&BigInt(wallet.raw)<BigInt(q.amount)){ window.open(config.launchpadUrl,'_blank','noopener'); toast.info(`You need ${fmtTokens(q.amountTokens)} ${q.symbol}. Buy some on the launchpad first.`); return; }
      toast.message(`Confirm the transfer of ${fmtTokens(q.amountTokens)} ${q.symbol} (${fmtUsd(q.priceUsd,0)}) in your wallet.`);
      let txHash;
      try{ txHash=await wallet.transfer(q.treasuryAddress,q.amount); }
      catch(e){ toast.error(rejected(e)?'Transfer cancelled in your wallet.':(e.shortMessage||e.message)); return; }
      const pending={quoteId:q.quoteId,txHash,character};
      savePending(pending);
      toast.loading('Transfer sent. Waiting for Robinhood Chain to confirm…',{id:'purchase'});
      await finishPurchase(pending);
      toast.dismiss('purchase');
    }catch(e){ toast.dismiss('purchase'); toast.error(e.message); }
    finally{ setBuying(null); refreshConfig(); }
  };
  const onClaim=async()=>{
    const data=await claim();
    if(data){ toast.success(`Claim request sent: ${fmtTokens(data.claim.amount_tokens)} ${data.claim.symbol} (${fmtUsd(data.claim.usd,4)}). Tokens arrive once the admin approves it.`); }
  };
  const blocked=!!modal||graphics.hidden;
  const tier=graphics.profile.tier;
  return <main className={`frostfish-app ${active?'is-playing':''}`} data-testid="frostfish-app" data-graphics-tier={tier} data-render-paused={blocked} data-booted={boot.done}>
    {!boot.done&&<BootScreen targetRef={boot.targetRef} fading={boot.fading}/>}
    <SunsetSky/>
    <Suspense fallback={<div className="world-loading" data-testid="world-loading">Preparing RobinHackers<span>···</span></div>}>
      <World gameRef={gameRef} roster={roster(game)} rosterReady={!!game} active={active} zoom={zoom} reset={cameraReset} profile={graphics.profile} onMeasure={graphics.measure} blocked={blocked} onReady={boot.frameReady}/>
    </Suspense>
    <WeatherOverlay density={tier==='battery'?.45:graphics.profile.mobile?.7:1}/>
    {!active && <Header config={config} online={visitors} onGraphics={openGraphics} renderMode={graphics.mode} renderTier={tier} onPlay={openPlay}/>}
    {active ? <><TopHUD game={game} config={config} wallet={wallet} online={online} onLeaderboard={openLeaderboard} onInventory={openInventory} onGraphics={openGraphics} renderMode={graphics.mode} renderTier={tier}/><BottomBar onMarket={openMarket} onInventory={openInventory} owned={game.workers.length}/></> : <Welcome/>}
    {actionError && <div role="alert" className="action-error" data-testid="game-action-error">{actionError}<button onClick={clearActionError} data-testid="dismiss-action-error-button" aria-label="Dismiss error">×</button></div>}
    <Footer active={active} zoom={zoom} setZoom={setZoom} onResetCamera={()=>{setZoom(1);setCameraReset(v=>v+1);}} onLogout={signOut}/>
    {active&&modal==='market'&&<MarketDialog open onClose={close} game={game} config={config} wallet={wallet} onBuy={buy} buying={buying} pending={!!pendingPurchase&&!buying}/>}
    {active&&modal==='inventory'&&<InventoryDialog open onClose={close} game={game} config={config} onMarket={openMarket} onClaim={onClaim} busy={busy} loadClaims={claimHistory}/>}
    {active&&modal==='leaderboard'&&<LeaderboardDialog open onClose={close} load={leaderboard}/>}
    {modal==='graphics'&&<GraphicsDialog open onClose={close} graphics={graphics}/>}
    {!active&&modal==='play'&&<PlayGate open onClose={close} onSignIn={doSignIn} onChallenge={challengeFor} onConnect={openConnectModal} busy={busy} error={signError} betaNft={config?.betaNft}/>}
    {active&&game.entry_required&&<EntryGate feeUsd={game.entry_fee_usd} ethUsd={config?.ethUsd} onPay={entry.pay} paying={entry.paying} pending={entry.pending} onLogout={signOut}/>}
    <Toaster theme="dark" position="top-center" toastOptions={{className:'frost-toast'}}/>
  </main>;
}

function roster(game){ return (game?.workers||[]).map(w=>`${w.uid}:${w.character}:${w.slot}`).join(','); }
