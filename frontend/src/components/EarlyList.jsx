import { useEffect, useState } from 'react';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;
const KEY = 'robinhackers-early';
const X_HANDLE = 'robinhackers';
const LINKS = {
  follow: `https://x.com/intent/follow?screen_name=${X_HANDLE}`,
  like: `https://x.com/${X_HANDLE}`,
  quote: `https://x.com/intent/post?text=${encodeURIComponent(`Joining the ROBINHACKERS early list. @${X_HANDLE}`)}`,
};
const TASKS = [
  { id: 'follow', code: '01', title: 'X FOLLOW', note: 'Follow the account on X.', href: LINKS.follow },
  { id: 'like', code: '02', title: 'LIKE & RT', note: 'Like the post and repost it.', href: LINKS.like },
  { id: 'quote', code: '03', title: 'QUOTE POST', note: 'Quote the post with your own line.', href: LINKS.quote },
];
const validAddress = value => /^0x[a-fA-F0-9]{40}$/.test(value.trim());
const short = value => `${value.slice(0, 6)}…${value.slice(-4)}`;

export const EarlyList = ({ open, onClose }) => {
  const [step, setStep] = useState('address');
  const [address, setAddress] = useState('');
  const [error, setError] = useState('');
  const [tasks, setTasks] = useState({ follow: false, like: false, quote: false });
  const [saving, setSaving] = useState(false);
  useEffect(() => {
    if (!open) return;
    const saved = localStorage.getItem(KEY);
    setError('');
    setSaving(false);
    if (saved && validAddress(saved)) { setAddress(saved); setStep('done'); }
    else { setAddress(''); setStep('address'); setTasks({ follow: false, like: false, quote: false }); }
  }, [open]);
  if (!open) return null;
  const continueAddress = event => {
    event.preventDefault();
    const next = address.trim();
    if (!validAddress(next)) { setError('Enter a valid EVM address.'); return; }
    setAddress(next);
    setError('');
    setStep('tasks');
  };
  const openTask = task => {
    window.open(task.href, '_blank', 'noopener');
    setTasks(current => ({ ...current, [task.id]: true }));
  };
  const ready = tasks.follow && tasks.like && tasks.quote;
  const join = async () => {
    if (!ready || saving) return;
    setSaving(true);
    setError('');
    try {
      const res = await fetch(`${API}/early-list`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ address: address.trim(), follow: true, likeRt: true, quote: true }) });
      const data = await res.json();
      if (!res.ok) throw new Error(data.detail || 'The list could not be reached.');
      localStorage.setItem(KEY, address.trim());
      setStep('done');
    } catch (e) { setError(e.message); }
    finally { setSaving(false); }
  };
  return <div className="early-screen" role="dialog" aria-modal="true" aria-labelledby="early-title" data-testid="early-list">
    <div className="early-panel">
      <button type="button" className="early-close" onClick={onClose} aria-label="Close">×</button>
      <p className="early-kicker">ROBINHACKERS // EARLY ACCESS</p>
      <h2 id="early-title">EARLY LIST</h2>
      {step === 'address' && <form className="early-form" onSubmit={continueAddress}>
        <p className="early-prompt">&gt; STEP 01 · LINK AN EVM ADDRESS<span className="early-cursor"/></p>
        <label htmlFor="early-address">EVM ADDRESS</label>
        <input id="early-address" data-testid="early-address" value={address} onChange={event => { setAddress(event.target.value); setError(''); }} placeholder="0x" autoComplete="off" spellCheck="false"/>
        {error && <p className="early-error" role="alert" data-testid="early-error">{error}</p>}
        <button type="submit" className="early-go" data-testid="early-continue">CONTINUE</button>
      </form>}
      {step === 'tasks' && <div className="early-tasks">
        <p className="early-prompt">&gt; STEP 02 · BROADCAST THE SIGNAL<span className="early-cursor"/></p>
        <p className="early-address-chip" data-testid="early-address-chip">{short(address)}</p>
        {TASKS.map(task => <button type="button" key={task.id} className={`early-task ${tasks[task.id] ? 'is-open' : ''}`} data-testid={`early-task-${task.id}`} onClick={() => openTask(task)}>
          <span className="early-code">{task.code}</span>
          <span><strong>{task.title}</strong><small>{task.note}</small></span>
          <em>{tasks[task.id] ? 'LINKED' : 'OPEN'}</em>
        </button>)}
        {error && <p className="early-error" role="alert" data-testid="early-error">{error}</p>}
        <button type="button" className="early-go" data-testid="early-join" disabled={!ready || saving} onClick={join}>{saving ? 'LOCKING…' : 'JOIN LIST'}</button>
      </div>}
      {step === 'done' && <div className="early-done" data-testid="early-done">
        <p className="early-prompt">&gt; SIGNAL LOCKED<span className="early-cursor"/></p>
        <strong>YOU'RE ON THE LIST</strong>
        <p>{short(address)} is locked in. The city stays closed until early access opens.</p>
      </div>}
    </div>
  </div>;
};
