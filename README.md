# Frostfish

A React voxel fishing game with a FastAPI + MongoDB backend. Players sign in with an EVM wallet on **Robinhood Chain Mainnet (chain 4663)**. There is no guest mode.

## Stack
- Frontend: React (CRA/craco) + RainbowKit + wagmi + viem, custom Robinhood chain in `frontend/src/lib/wallet.js`
- Backend: FastAPI (`backend/server.py`), `eth-account` signature checks, MongoDB via Motor

## Sign-in flow (SIWE)
1. **Play** opens the RainbowKit modal and the wallet connects.
2. If the wallet is on another network, the game stays locked and asks you to switch networks.
3. `POST /api/auth/challenge` returns an EIP-4361 message. The nonce works once and expires after 5 minutes. The message says plainly that signing is not a transaction.
4. `POST /api/auth/verify` checks the Origin/domain, chain ID, nonce, the exact message and the recovered signer. It returns a bearer token that lasts 24 hours (only its SHA-256 hash is stored).
5. `GET /api/game`, `POST /api/game/action`, `GET /api/leaderboard` and `GET /api/characters` all need that token. `POST /api/auth/logout` revokes it.

The game session is stored per wallet address in the `games` collection.

## Environment
Copy the examples and fill them in locally. `.env` files are not part of the repository.

- `frontend/.env.example` → `frontend/.env`
- `backend/.env.example` → `backend/.env`

`ADMIN_PASSWORD` lives only in `backend/.env`. Pick a new one before you publish the app.

## Reown / WalletConnect
Add every domain that serves the app (preview and production) to the allowed domains in the Reown dashboard. If you skip this, WalletConnect/QR connections fail without any error. The project ID is public by design, so the domain allowlist is its only protection.
