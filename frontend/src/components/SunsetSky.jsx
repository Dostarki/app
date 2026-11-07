import { useEnvironment } from '../hooks/useEnvironment';

export const SunsetSky = () => {
  const { weather } = useEnvironment();
  return <div className={`sunset-sky sky-${weather}`} aria-hidden="true" data-testid="sunset-sky" data-daytime="night" style={{ '--night': 1 }}>
    <div className="sky-layer sky-night" />
    <div className="sky-stars" />
    <div className="sky-moon" />
    <div className="sky-mountains mountains-back"/><div className="sky-mountains mountains-front"/>
    {['one', 'two', 'three', 'four', 'five'].map(n => <div key={n} className={`sky-cloud cloud-${n}`}><i/><b/><span/></div>)}
  </div>;
};
