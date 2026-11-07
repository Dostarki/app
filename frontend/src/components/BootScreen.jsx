import { useEffect, useState } from 'react';
import '../boot.css';

const GLYPH = '01ｱｲｳｴｵｶｷｸｹｺｻｼｽｾｿﾀﾁﾂﾃﾄﾅﾆﾇﾈﾉﾊﾋﾌﾍﾎﾏﾐﾑﾒﾓﾔﾕﾖﾗﾘﾙﾚﾛﾜﾝ#$%<>/';
const rain = (seed, count) => {
  let n = seed, text = '';
  for (let i = 0; i < count; i++) { n = (n * 1103515245 + 12345) & 0x7fffffff; text += GLYPH[n % GLYPH.length] + '\n'; }
  return text;
};
const COLUMNS = [11, 29, 47, 63, 81, 97, 113, 131, 149, 167].map((seed, i) => ({
  text: rain(seed, 16),
  duration: `${1.15 + (i % 4) * .38}s`,
  delay: `${-(i * .17)}s`,
}));

const LaptopArt = () => <div className="boot-laptop" data-testid="boot-mark" aria-hidden="true">
  <div className="boot-lid">
    <div className="boot-glass">
      {COLUMNS.map((col, i) => <span key={i} className="boot-col" style={{ animationDuration: col.duration, animationDelay: col.delay }}>{col.text}{col.text}</span>)}
    </div>
  </div>
  <div className="boot-hinge" />
  <div className="boot-base">{Array.from({ length: 11 }, (_, i) => <i key={i} className={i % 4 === 1 ? 'is-hot' : ''} />)}<b /></div>
</div>;

const statusFor = progress => progress >= 100 ? 'ACCESS GRANTED' : progress >= 70 ? 'OPENING THE CITY…' : progress >= 35 ? 'SCANNING NODES…' : 'ESTABLISHING LINK…';

export const BootScreen = ({ targetRef, fading }) => {
  const [progress, setProgress] = useState(0);
  useEffect(() => {
    let raf, shown = 0;
    const tick = () => { shown += (targetRef.current - shown) * .085; if (targetRef.current >= 100 && shown > 99.3) shown = 100; setProgress(Math.round(shown)); if (shown < 100) raf = requestAnimationFrame(tick); };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [targetRef]);
  return <div className={`boot-screen ${fading ? 'boot-fading' : ''}`} data-testid="boot-screen" role="status" aria-live="polite">
    <div className="boot-frame">
      <p className="boot-brand">ROBINHACKERS</p>
      <div className="boot-stage"><LaptopArt /><div className="boot-shadow" /></div>
      <p className="boot-text" data-testid="boot-text">{statusFor(progress)}</p>
      <div className="boot-bar" data-testid="boot-progress" aria-valuenow={progress} aria-valuemin={0} aria-valuemax={100}><i style={{ width: `${progress}%` }} /></div>
      <p className="boot-pct">{String(progress).padStart(2, '0')}%</p>
    </div>
  </div>;
};
