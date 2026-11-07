# ROBINHACKERS (Frostfish)
## Problem
Clone github.com/Dostarki/robinhackers into /app and run it. Then: EARLY LIST -> PLAY (wallet connect + sign opens game), wallets saved in MongoDB, market shows only 5 tier hacker images with ascending prices, purchase token set in admin (/errorlogin404495959), purchase stored in DB, hacker starts hashing automatically.
## Stack
React (craco, RainbowKit/wagmi) + FastAPI + MongoDB, SIWE on Robinhood Chain 4663
## Done
- 2026-06: repo running in preview
- 2026-06: PLAY button + PlayGate (SIWE) + EntryGate; wallets in db.wallets; 5 tiers (rod,net,boat,yacht,sub ids -> Sherwood Scout, Merry Byte, Longbow Cracker, Hood Phantom, Robin Legend, images /public/hackers/tierN.jpg); backend only sells SHOP tiers; payback 48h for all; admin shows 5 tier prices and enforces ascending order (front+back)
## Backlog
- 3D world still shows fishermen models for workers (could be swapped for hacker visuals)
- Remove unused guest/early-list endpoints, GuideDialog
- Reown domain allowlist; change ADMIN_PASSWORD
- 2026-06: Neon token info chip top-right (symbol, CA, price, MCAP) linking to Ponsfamily launchpad (landing + in-game); HUD stat chips restyled neon; admin "Token display name" (default RECLAIM) overrides on-chain symbol everywhere
- 2026-06: Wallet connect adapted for mobile (PlayGate.jsx, lib/wallet.js): in-app wallet browsers connect to injected provider directly; mobile browsers use RainbowKit list that deep-links to installed app; WalletConnect sessions on mobile no longer auto-sign (needs tap gesture) — tap opens wallet app, SIWE challenge pre-fetched, "Open <wallet> to confirm" fallback button while waiting; Trust Wallet added to list

## 2026-06 Neon dialogs + CPU favicon
- All GameDialog windows and RainbowKit modal restyled to dark neon hacker theme (src/neon.css, neonTheme in index.js)
- Favicon/wallet app icon -> public/cpu-icon.svg; theme-color #0b1030; leaderboard empty state
- MetaMask "phishing/wallet-draining" warning = domain reputation flag (Blockaid/MetaMask) on preview domain; not code-fixable. Fix: custom domain + false-positive report to MetaMask/Blockaid

## 2026-06 Hacker network lighting + source download
- Right-island buildings dark except SECURITY (cyber) & BANK; road neon/lamps stay on
- Each hacker -> one floor slot on a right building (front/visible first); source building lights fully, roof dish sends satellite beam to left tower chosen by tier (T1 smallest ... T5 tallest); target lights after packet arrives (1.8s); pre-login demo cycles
- Files: game/hackNetwork.js, game/HackLinks.jsx, Island.jsx, villageBuilder.js (dark/hostile/hackFloors)
- Source zip served at /api/download/robinhackers-wExZfRIneBKyDB1x9L9PKw.zip (backend/downloads; no .env secrets)
- Floor bubble on owned right-side building shows purchased hacker tier PNG, animated (OwnedHacker in HackerBubble.jsx); other buildings keep generic canvas hacker
