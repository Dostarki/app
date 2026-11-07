import { useEffect, useRef } from 'react';

const GLYPHS = '01アイウエオカキクケコサシスセソタチツテトナニヌネノハヒフヘホマミムメモヤユヨラリルレロワン#$%*';

export const WeatherOverlay = ({ density = 1 }) => {
  const ref = useRef();
  useEffect(() => {
    const canvas = ref.current, ctx = canvas.getContext('2d');
    let raf, last = performance.now(), W = 0, H = 0, columns = [];
    const glyph = () => GLYPHS[Math.floor(Math.random() * GLYPHS.length)];
    const make = (x, init) => ({
      x, y: init ? Math.random() * H : -40 - Math.random() * H * .4,
      speed: 70 + Math.random() * 240, size: 13 + Math.random() * 8,
      len: 8 + Math.floor(Math.random() * 16),
      chars: Array.from({ length: 28 }, glyph),
    });
    const layout = () => {
      const count = Math.max(18, Math.round((W / 28) * density));
      columns = Array.from({ length: count }, (_, i) => make((i + .5) * (W / count) + (Math.random() - .5) * 8, true));
    };
    const resize = () => {
      const d = Math.min(window.devicePixelRatio || 1, 1.5);
      W = canvas.clientWidth; H = canvas.clientHeight;
      canvas.width = W * d; canvas.height = H * d;
      ctx.setTransform(d, 0, 0, d, 0, 0);
      layout();
    };
    resize(); window.addEventListener('resize', resize);
    const frame = now => {
      raf = requestAnimationFrame(frame);
      const dt = Math.max(0, Math.min(.05, (now - last) / 1000)); last = now;
      if (document.hidden) return;
      ctx.clearRect(0, 0, W, H);
      ctx.textAlign = 'center'; ctx.textBaseline = 'top';
      for (const col of columns) {
        col.y += col.speed * dt;
        ctx.font = `${col.size}px monospace`;
        for (let i = 0; i < col.len; i++) {
          const y = col.y - i * col.size * .92;
          if (y < -col.size || y > H) continue;
          if (Math.random() < .012) col.chars[i] = glyph();
          const fade = i === 0 ? 1 : Math.max(.08, 1 - i / col.len);
          ctx.fillStyle = i === 0 ? `rgba(236,255,236,${fade})` : `rgba(57,255,110,${fade * .9})`;
          ctx.fillText(col.chars[i], col.x, y);
        }
        if (col.y - col.len * col.size > H + 20) Object.assign(col, make(col.x, false));
      }
    };
    raf = requestAnimationFrame(frame);
    return () => { cancelAnimationFrame(raf); window.removeEventListener('resize', resize); };
  }, [density]);
  return <canvas ref={ref} className="weather-layer weather-matrix" data-testid="weather-overlay" data-weather="matrix" aria-hidden="true" />;
};
