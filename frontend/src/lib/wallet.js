import { createConfig, http } from 'wagmi';
import { connectorsForWallets } from '@rainbow-me/rainbowkit';
import { injectedWallet, metaMaskWallet, rainbowWallet, base, trustWallet, walletConnectWallet } from '@rainbow-me/rainbowkit/wallets';
import { defineChain } from 'viem';

const rpcUrl = process.env.REACT_APP_ROBINHOOD_RPC_URL;

export const robinhood = defineChain({
  id: 4663,
  name: 'Robinhood Chain',
  nativeCurrency: { name: 'Ether', symbol: 'ETH', decimals: 18 },
  rpcUrls: { default: { http: [rpcUrl] } },
  blockExplorers: { default: { name: 'Blockscout', url: 'https://robinhoodchain.blockscout.com' } },
});

const appUrl = window.location.origin;
export const walletConfig = createConfig({
  chains: [robinhood],
  connectors: connectorsForWallets(
    [{ groupName: 'Recommended', wallets: [metaMaskWallet, rainbowWallet, base, trustWallet] }, { groupName: 'Other wallets', wallets: [injectedWallet, walletConnectWallet] }],
    { appName: 'ROBINHACKERS', projectId: process.env.REACT_APP_WALLETCONNECT_PROJECT_ID, appDescription: 'A neon harbor city on Robinhood Chain.', appUrl, appIcon: `${appUrl}/cpu-icon.svg` },
  ),
  transports: { [robinhood.id]: http(rpcUrl) },
});

export const isMobile = () => /android|iphone|ipad|ipod|mobile/i.test(navigator.userAgent) || (navigator.maxTouchPoints > 1 && /mac/i.test(navigator.userAgent));
export const hasInjectedWallet = () => typeof window !== 'undefined' && !!window.ethereum;
// RainbowKit stores the wallet the user picked on mobile here; WalletConnect reuses it for deep links.
export const walletDeepLink = () => {
  try { const v = JSON.parse(localStorage.getItem('WALLETCONNECT_DEEPLINK_CHOICE') || 'null'); return v?.href ? { href: v.href, name: v.name || 'wallet' } : null; }
  catch { return null; }
};
export const openWalletApp = () => {
  const link = walletDeepLink();
  if (!link) return false;
  window.location.href = link.href;
  return true;
};
