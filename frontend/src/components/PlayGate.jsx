import { useCallback, useEffect, useRef } from 'react';
import { useAccount, useConnect, useSwitchChain, useDisconnect, useSignMessage } from 'wagmi';
import { ArrowRight, Wallet, ShieldCheck, Loader2, Network, PenLine, Smartphone, ExternalLink } from 'lucide-react';
import { GameDialog } from './GameDialog';
import { Button } from './ui/button';
import { robinhood, isMobile, hasInjectedWallet, walletDeepLink, openWalletApp } from '../lib/wallet';

const short = a => `${a.slice(0, 6)}…${a.slice(-4)}`;
const mobile = isMobile();

export const PlayGate = ({ open, onClose, onSignIn, onChallenge, onConnect, busy, error, betaNft }) => {
  const { isConnected, address, chainId, connector } = useAccount();
  const { connectAsync, connectors, isPending: connecting } = useConnect();
  const { switchChain, isPending, error: switchError } = useSwitchChain();
  const { signMessageAsync } = useSignMessage();
  const { disconnect } = useDisconnect();
  const wrongNetwork = isConnected && chainId !== robinhood.id;
  const remoteWallet = isConnected && connector?.id === 'walletConnect';
  const deepLink = mobile && remoteWallet ? walletDeepLink() : null;
  const challenge = useRef(null);
  const autoSigned = useRef(null);

  // In-app wallet browsers (MetaMask, Trust, Rainbow…) expose an injected provider: connect to it directly.
  const connect = useCallback(async () => {
    const injected = mobile && hasInjectedWallet() && connectors.find(c => c.id === 'injected');
    if (!injected) return onConnect?.();
    try { await connectAsync({ connector: injected }); }
    catch (e) { if (!/reject|denied|cancel/i.test(e?.shortMessage || e?.message || '')) onConnect?.(); }
  }, [connectors, connectAsync, onConnect]);

  // Prepare the SIWE challenge up front so a mobile tap only has to publish the signature request.
  useEffect(() => {
    challenge.current = null;
    if (!isConnected || wrongNetwork || !deepLink || !onChallenge) return;
    let stale = false;
    onChallenge({ address, chainId }).then(c => { if (!stale) challenge.current = { ...c, address }; }).catch(() => {});
    return () => { stale = true; };
  }, [isConnected, wrongNetwork, deepLink, address, chainId, onChallenge]);

  const sign = useCallback(() => {
    const prepared = challenge.current?.address === address && new Date(challenge.current.expiresAt) > new Date(Date.now() + 30_000) ? challenge.current : null;
    challenge.current = null;
    const p = onSignIn({ address, chainId, signMessageAsync, challenge: prepared });
    if (deepLink) openWalletApp();
    return p;
  }, [address, chainId, signMessageAsync, onSignIn, deepLink]);

  // Desktop extensions prompt instantly; mobile wallet apps need a tap so the deep link opens from a user gesture.
  useEffect(() => {
    if (!isConnected || wrongNetwork || busy || deepLink || autoSigned.current === address) return;
    autoSigned.current = address;
    sign();
  }, [isConnected, wrongNetwork, busy, deepLink, address, sign]);

  return <GameDialog open={open} onClose={onClose} id="play-gate" title="Sign in to play." subtitle="Your island is tied to your wallet on Robinhood Chain." className="wallet-dialog">
    <div className="wallet-emblem"><Wallet size={30} strokeWidth={1.5}/><span className="online-dot"/></div>
    {!isConnected ? <>
      <Button className="pixel-button" data-testid="play-gate-connect-button" disabled={connecting} onClick={connect}>{connecting ? <Loader2 className="spin"/> : <Wallet/>} {connecting ? 'Connecting…' : 'Connect wallet'} <ArrowRight/></Button>
      {mobile && !hasInjectedWallet() && <p className="mobile-wallet-note" data-testid="play-gate-mobile-note"><Smartphone size={16}/>On mobile, pick your wallet and it opens the app installed on your phone. Approve the connection there, then come back here to sign in.</p>}
    </> : <>
      <p className="connected-address" data-testid="play-gate-address">{short(address)}{connector?.name && <span className="connector-name"> · {connector.name}</span>}</p>
      {wrongNetwork
        ? <Button className="pixel-button" data-testid="play-gate-switch-network-button" disabled={isPending} onClick={() => { switchChain({ chainId: robinhood.id }); if (deepLink) openWalletApp(); }}>{isPending ? <Loader2 className="spin"/> : <Network/>}Switch to Robinhood Chain<ArrowRight/></Button>
        : <Button className="pixel-button" data-testid="play-gate-sign-button" disabled={busy} onClick={sign}>{busy ? <Loader2 className="spin"/> : <PenLine/>}{busy ? 'Waiting for signature…' : deepLink ? `Sign in ${deepLink.name}` : 'Sign message & play'}<ArrowRight/></Button>}
      {deepLink && (busy || isPending) && <>
        <button className="text-button open-wallet-button" data-testid="play-gate-open-wallet-button" onClick={openWalletApp}><ExternalLink size={14}/> Open {deepLink.name} to confirm</button>
        <p className="mobile-wallet-note" data-testid="play-gate-mobile-sign-note"><Smartphone size={16}/>The request was sent to {deepLink.name}. If the app did not open, tap the link above, approve it there and return to this tab.</p>
      </>}
      <button className="text-button" data-testid="play-gate-disconnect-button" onClick={() => disconnect()}>Use a different wallet</button>
    </>}
    {wrongNetwork && <p role="alert" className="form-error" data-testid="play-gate-wrong-network">Wrong network. The game is locked until you switch to Robinhood Chain (chain {robinhood.id}).</p>}
    {switchError && <p role="alert" className="form-error" data-testid="play-gate-switch-error">{switchError.shortMessage || 'Network switch was declined.'}</p>}
    {error && <p role="alert" className="form-error" data-testid="play-gate-error">{error}</p>}
    {error && betaNft && /closed beta/i.test(error) && <a className="text-button" href={betaNft.url} target="_blank" rel="noreferrer" data-testid="play-gate-nft-link">Get a {betaNft.name} NFT on OpenSea ({betaNft.chain}) to join the beta</a>}
    <p className="wallet-note" data-testid="play-gate-notice"><ShieldCheck size={16}/>You only sign a text message. It is not a transaction: no gas, no funds moved, no approvals.</p>
    <div className="network-note" data-testid="play-gate-network-note"><span className="online-dot"/> Robinhood Chain Mainnet <span>·</span> Chain {robinhood.id}</div>
  </GameDialog>;
};
