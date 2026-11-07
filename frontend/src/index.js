import React from "react";
document.title = "ROBINHACKERS";
import ReactDOM from "react-dom/client";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import "@/index.css";
import App from "@/App";
import AdminPage from "@/pages/AdminPage";
import { WagmiProvider } from 'wagmi';
import { RainbowKitProvider, darkTheme } from '@rainbow-me/rainbowkit';
import '@rainbow-me/rainbowkit/styles.css';
import { walletConfig } from './lib/wallet';

const base = darkTheme({ accentColor: '#39e7ff', accentColorForeground: '#041422', overlayBlur: 'small', borderRadius: 'small', fontStack: 'system' });
const neonTheme = { ...base, colors: { ...base.colors, modalBackground: '#0b1030', modalBorder: 'rgba(57,231,255,.55)', modalText: '#e8fbff', modalTextSecondary: '#8ea9c4', modalBackdrop: 'rgba(2,4,14,.72)', actionButtonSecondaryBackground: 'rgba(57,231,255,.1)', menuItemBackground: 'rgba(57,231,255,.12)', closeButton: '#39e7ff', closeButtonBackground: 'rgba(57,231,255,.1)', generalBorder: 'rgba(57,231,255,.28)', generalBorderDim: 'rgba(57,231,255,.14)', profileForeground: '#0b1030', selectedOptionBorder: '#39e7ff' }, shadows: { ...base.shadows, dialog: '0 0 44px rgba(57,231,255,.25), 0 0 90px rgba(255,63,164,.12)' } };

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 60_000,
      refetchOnWindowFocus: false,
    },
  },
});

const root = ReactDOM.createRoot(document.getElementById("root"));
root.render(
  <React.StrictMode>
    <BrowserRouter>
      <WagmiProvider config={walletConfig}>
        <QueryClientProvider client={queryClient}>
          <RainbowKitProvider theme={neonTheme}>
            <Routes>
              <Route path="/errorlogin404495959" element={<AdminPage />} />
              <Route path="*" element={<App />} />
            </Routes>
          </RainbowKitProvider>
        </QueryClientProvider>
      </WagmiProvider>
    </BrowserRouter>
  </React.StrictMode>,
);
