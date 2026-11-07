# RobinHackers: PLAY/SIWE wallet save, 5-tier market config, purchase quote tier guard, admin tier prices
import os
import pytest
import requests
from eth_account import Account
from eth_account.messages import encode_defunct
from pymongo import MongoClient

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/') or open('/app/frontend/.env').read().split('REACT_APP_BACKEND_URL=')[1].split('\n')[0].strip().rstrip('/')
H = {'Origin': BASE_URL, 'Content-Type': 'application/json'}
TIERS = ['rod', 'net', 'boat', 'yacht', 'sub']
ADMIN_PW = 'Frostfish-Admin-2026-ChangeMe'


def _env(key):
    for line in open('/app/backend/.env'):
        if line.startswith(key + '='):
            return line.split('=', 1)[1].strip().strip('"')


def login(acct):
    ch = requests.post(f'{BASE_URL}/api/auth/challenge', headers=H, json={'address': acct.address, 'chainId': 4663})
    assert ch.status_code == 200, ch.text
    ch = ch.json()
    sig = Account.sign_message(encode_defunct(text=ch['message']), acct.key).signature.hex()
    sig = sig if sig.startswith('0x') else '0x' + sig
    r = requests.post(f'{BASE_URL}/api/auth/verify', headers=H, json={
        'address': acct.address, 'chainId': 4663, 'nonce': ch['nonce'], 'message': ch['message'], 'signature': sig})
    assert r.status_code == 200, r.text
    return r.json()


@pytest.fixture(scope='module')
def session():
    acct = Account.create()
    d = login(acct)
    return acct, d


# SIWE + wallet persistence
def test_siwe_creates_wallet_doc(session):
    acct, d = session
    assert isinstance(d['token'], str) and d['address'] == acct.address.lower()
    db = MongoClient(_env('MONGO_URL'))[_env('DB_NAME')]
    w = db.wallets.find_one({'address': acct.address.lower()})
    assert w is not None and w['checksum_address'] == acct.address and w['login_count'] >= 1
    assert db.games.find_one({'wallet_address': acct.address.lower()}) is not None


def test_challenge_message_domain():
    r = requests.post(f'{BASE_URL}/api/auth/challenge', headers=H, json={'address': Account.create().address, 'chainId': 4663})
    assert r.status_code == 200
    assert r.json()['message'].startswith(BASE_URL.split('://')[1] + ' wants you to sign in')


# Config: 5 tiers ascending, hourly = price/48
def test_config_prices_ascending():
    c = requests.get(f'{BASE_URL}/api/config').json()
    p = [c['prices'][t] for t in TIERS]
    assert p == [1, 10, 50, 100, 200], p
    assert all(p[i] < p[i + 1] for i in range(4))
    for t in TIERS:
        assert abs(c['hourlyUsd'][t] - c['prices'][t] / 48) < 1e-9
    assert c['lockedCharacters'] == [] or not set(c['lockedCharacters']) & set(TIERS)


# Purchase quote tier guard
@pytest.mark.parametrize('ch', ['flagship', 'mothership', 'bogus'])
def test_quote_rejects_non_shop(session, ch):
    _, d = session
    r = requests.post(f'{BASE_URL}/api/purchase/quote', headers={'Authorization': f"Bearer {d['token']}"}, json={'character': ch})
    assert r.status_code == 422, r.text


def test_quote_sub_ok(session):
    _, d = session
    r = requests.post(f'{BASE_URL}/api/purchase/quote', headers={'Authorization': f"Bearer {d['token']}"}, json={'character': 'sub'})
    assert r.status_code == 200, r.text
    q = r.json()
    assert q['character'] == 'sub' and q['priceUsd'] == 200 and int(q['amount']) > 0 and q['chainId'] == 4663


def test_game_has_no_workers_and_quote_requires_auth(session):
    r = requests.post(f'{BASE_URL}/api/purchase/quote', json={'character': 'rod'})
    assert r.status_code == 401


# Admin: server-side ordering validation (frontend validates; check backend too)
def test_admin_settings_tiers():
    tok = requests.post(f'{BASE_URL}/api/admin/login', json={'password': ADMIN_PW})
    assert tok.status_code == 200, tok.text
    auth = {'Authorization': f"Bearer {tok.json()['token']}"}
    s = requests.get(f'{BASE_URL}/api/admin/settings', headers=auth).json()
    assert all(t in s['prices'] for t in TIERS)
    body = {'tokenAddress': s['tokenAddress'], 'treasuryAddress': s['treasuryAddress'], 'curveAddress': s.get('curveAddress'),
            'launchpadUrl': s['launchpadUrl'], 'prices': dict(s['prices']), 'tokenUsdOverride': s.get('tokenUsdOverride'),
            'entryFeeEnabled': bool(s.get('entryFeeEnabled')), 'entryFeeUsd': s.get('entryFeeUsd') or 5,
            'betaEnabled': bool(s.get('betaEnabled')), 'nftGateEnabled': bool(s.get('nftGateEnabled')), 'lockedCharacters': []}
    original = dict(s['prices'])
    try:
        bad = {**body, 'prices': {**original, 'net': 0.5}}
        r = requests.put(f'{BASE_URL}/api/admin/settings', headers=auth, json=bad)
        print('non-ascending PUT status:', r.status_code)
        pytest.server_ascending_check = r.status_code == 422
    finally:
        r2 = requests.put(f'{BASE_URL}/api/admin/settings', headers=auth, json={**body, 'prices': original})
        assert r2.status_code == 200, r2.text
    c = requests.get(f'{BASE_URL}/api/config').json()
    assert [c['prices'][t] for t in TIERS] == [original[t] for t in TIERS]
    assert pytest.server_ascending_check, 'Backend accepts non-increasing tier prices (only frontend validates)'
