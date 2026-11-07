export const DAY_SECONDS = 480;
export const WEATHER_SECONDS = 120;
export const PHASES = ['morning', 'noon', 'evening', 'night'];
export const LIGHT_KEYS = [
  { sun: '#ffc48a', sunI: 2.4, amb: '#ffe0c8', ambI: .62, sky: '#ffcfae', ground: '#3e4654', hemiI: .85, bright: 1.0, sunset: .55 },
  { sun: '#fff3d6', sunI: 3.1, amb: '#ffffff', ambI: .74, sky: '#bfe4ff', ground: '#4a5566', hemiI: .95, bright: 1.12, sunset: .06 },
  { sun: '#ff8a66', sunI: 2.2, amb: '#f6b3d4', ambI: .56, sky: '#ffb0c8', ground: '#323848', hemiI: .8, bright: .95, sunset: 1 },
  { sun: '#d5e2ff', sunI: 1.35, amb: '#8ea0d8', ambI: .58, sky: '#2a3a78', ground: '#1c2438', hemiI: .72, bright: .78, sunset: 0 },
];
// Shared, mutable render-side environment values written by DayCycle and read by shaders.
export const env = { bright: 1, sunset: 1 };

export function dayInfo() {
  return { t: .875, phase: 'night', weights: [0, 0, 0, 1] };
}
export function weatherAt() {
  return 'matrix';
}
