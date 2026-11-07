import { useCallback, useEffect, useState } from 'react';

const KEY = 'robinhackers-ops';

export const mineRate = level => 0.2 * level;
export const upgradeCost = level => 30 * level * level;

const fresh = () => ({ level: 1, mining: false, since: 0, banked: 0, miningGate: 0 });

export const minedNow = ops => ops.banked + (ops.mining && ops.since && ops.miningGate ? (Date.now() - ops.since) / 1000 * mineRate(ops.miningGate) : 0);

export function useOps() {
  const [ops, setOps] = useState(() => {
    try {
      const saved = JSON.parse(localStorage.getItem(KEY));
      if (saved && saved.level >= 1) return { ...fresh(), ...saved, miningGate: saved.miningGate || (saved.mining ? saved.level : 0) };
    } catch { /* keep a fresh operation */ }
    return fresh();
  });
  useEffect(() => { localStorage.setItem(KEY, JSON.stringify(ops)); }, [ops]);
  const start = useCallback(gate => {
    setOps(cur => {
      if (cur.level !== gate || (cur.mining && cur.miningGate === gate)) return cur;
      return { ...cur, mining: true, miningGate: gate, since: Date.now(), banked: minedNow(cur) };
    });
  }, []);
  const upgrade = useCallback(() => {
    setOps(cur => {
      const total = minedNow(cur);
      const cost = upgradeCost(cur.level);
      if (total < cost) return cur;
      return { ...cur, level: cur.level + 1, banked: total - cost, since: cur.mining ? Date.now() : 0 };
    });
  }, []);
  return { ...ops, start, upgrade, rate: ops.mining && ops.miningGate ? mineRate(ops.miningGate) : mineRate(ops.level), cost: upgradeCost(ops.level) };
}
