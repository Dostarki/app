import { cityLand } from './villageBuilder.js';

const PALETTE = ['#3d7eff', '#f2c14e', '#d23b52', '#7dffb3', '#c9a6ff', '#ff7a3c', '#39e7ff', '#ff4f8b', '#ffd15c', '#f4fbff'];
const OUTFITS = ['#d7e7ff', '#ffd1e4', '#ffe7a3', '#c9ffe4', '#e4d4ff', '#ffd0b0'];
const LANE = 0.26;

export function buildRoadGraph(roads) {
  const horiz = roads.filter(([, , w, d]) => w >= d);
  const vert = roads.filter(([, , w, d]) => d > w);
  const nodes = [];
  const edges = [];
  const map = new Map();
  const node = (x, z) => {
    const k = `${x.toFixed(2)}|${z.toFixed(2)}`;
    let n = map.get(k);
    if (!n) { n = { x, z, edges: [] }; map.set(k, n); nodes.push(n); }
    return n;
  };
  const link = (ax, az, bx, bz, half) => {
    const len = Math.hypot(ax - bx, az - bz);
    if (len < 1.05) return;
    const a = node(ax, az), b = node(bx, bz);
    const edge = { a, b, len, half };
    a.edges.push({ to: b, edge });
    b.edges.push({ to: a, edge });
    edges.push(edge);
  };
  const collect = (lo, hi, crossings) => {
    const pts = crossings.filter(p => p > lo + 0.35 && p < hi - 0.35);
    if (!pts.some(p => Math.abs(p - lo) < 1.15)) pts.push(lo);
    if (!pts.some(p => Math.abs(p - hi) < 1.15)) pts.push(hi);
    pts.sort((a, b) => a - b);
    const out = [];
    pts.forEach(p => { if (!out.length || Math.abs(p - out[out.length - 1]) > 0.85) out.push(p); });
    return out;
  };
  horiz.forEach(([x, z, w, d]) => {
    const lo = x - w / 2 + 0.7, hi = x + w / 2 - 0.7;
    const crossings = vert.filter(([vx, vz, , vd]) => Math.abs(z - vz) <= vd / 2 + 0.2 && vx > lo && vx < hi).map(([vx]) => vx);
    const pts = collect(lo, hi, crossings);
    for (let i = 1; i < pts.length; i++) link(pts[i - 1], z, pts[i], z, d / 2);
  });
  vert.forEach(([x, z, w, d]) => {
    const lo = z - d / 2 + 0.7, hi = z + d / 2 - 0.7;
    const crossings = horiz.filter(([hx, hz, hw]) => Math.abs(x - hx) <= hw / 2 + 0.2 && hz > lo && hz < hi).map(([, hz]) => hz);
    const pts = collect(lo, hi, crossings);
    for (let i = 1; i < pts.length; i++) link(x, pts[i - 1], x, pts[i], w / 2);
  });
  return { nodes, edges };
}

export function roadPose(from, to, t) {
  const dx = to.x - from.x, dz = to.z - from.z;
  const len = Math.hypot(dx, dz) || 1;
  const fx = dx / len, fz = dz / len;
  const u = Math.max(0, Math.min(1, t));
  return {
    x: from.x + dx * u - fz * LANE,
    z: from.z + dz * u + fx * LANE,
    yaw: Math.atan2(-fz, fx),
    fx, fz,
  };
}

const lerpAngle = (a, b, t) => {
  let d = b - a;
  while (d > Math.PI) d -= Math.PI * 2;
  while (d < -Math.PI) d += Math.PI * 2;
  return a + d * t;
};

const turn = (node, previous) => {
  const options = node.edges.filter(link => link.to !== previous);
  const pool = options.length ? options : node.edges;
  return pool[Math.floor(Math.random() * pool.length)];
};

function curbSpot(building, px, pz, dx, dz, half, yaw) {
  const len = Math.hypot(building.x - px, building.z - pz) || 1;
  const nx = (building.x - px) / len, nz = (building.z - pz) / len;
  const x = px + nx * (half + 0.58);
  const z = pz + nz * (half + 0.58);
  if (!cityLand(x, z)) return null;
  if (Math.abs(x - building.x) < building.w / 2 + 0.35 && Math.abs(z - building.z) < building.d / 2 + 0.35) return null;
  return { x, z, yaw, building, doorX: building.x, doorZ: building.z + building.d / 2 + 0.2 };
}

function planStop(car, sim) {
  car.parkAt = null;
  if (car.cooldown > 0 || car.driven < 12 || sim.busy.size >= 3 || Math.random() > 0.42) return;
  const dx = car.to.x - car.from.x, dz = car.to.z - car.from.z;
  const len2 = dx * dx + dz * dz || 1;
  let best = null;
  for (const building of sim.buildings) {
    if (sim.busy.has(building)) continue;
    let u = ((building.x - car.from.x) * dx + (building.z - car.from.z) * dz) / len2;
    if (u < 0.15 || u > 0.86) continue;
    const px = car.from.x + dx * u, pz = car.from.z + dz * u;
    const dist = Math.hypot(building.x - px, building.z - pz);
    if (dist < 2.5 || dist > 5.5) continue;
    const spot = curbSpot(building, px, pz, dx, dz, car.half, Math.atan2(-dz, dx));
    if (!spot) continue;
    if (!best || dist < best.dist) best = { u, dist, spot };
  }
  if (best) car.parkAt = best;
}

function enterPath(car) {
  const building = car.park.building;
  const door = { x: car.park.doorX, z: car.park.doorZ };
  const points = [{ x: car.x, z: car.z }];
  if (car.z < building.z - 0.15) {
    const side = car.x >= building.x ? 1 : -1;
    const sx = building.x + side * (building.w / 2 + 0.62);
    points.push({ x: sx, z: car.z });
    points.push({ x: sx, z: door.z });
  }
  points.push(door);
  points.push({ x: building.x, z: building.z + building.d / 2 - 0.4 });
  return points;
}

function walkPose(points, dist) {
  let left = dist;
  for (let i = 1; i < points.length; i++) {
    const dx = points[i].x - points[i - 1].x, dz = points[i].z - points[i - 1].z;
    const len = Math.hypot(dx, dz);
    if (len < 0.001) continue;
    if (left <= len) {
      const t = left / len;
      return { x: points[i - 1].x + dx * t, z: points[i - 1].z + dz * t, yaw: Math.atan2(-dz, dx), done: false };
    }
    left -= len;
  }
  const a = points[Math.max(0, points.length - 2)], b = points[points.length - 1];
  return { x: b.x, z: b.z, yaw: Math.atan2(-(b.z - a.z), b.x - a.x) || 0, done: true };
}

function beginPark(car, sim) {
  sim.busy.add(car.parkAt.spot.building);
  car.park = car.parkAt.spot;
  car.resume = { from: car.from, to: car.to, t: car.parkAt.u, half: car.half };
  car.parkAt = null;
  car.phase = 'approach';
  car.approach = { x: car.x, z: car.z, yaw: car.yaw, u: 0 };
  car.person = false;
}

function finishDepart(car, sim) {
  sim.busy.delete(car.park.building);
  car.from = car.resume.from;
  car.to = car.resume.to;
  car.half = car.resume.half;
  car.t = Math.min(0.94, car.resume.t + 0.04);
  car.phase = 'drive';
  car.cooldown = 18 + Math.random() * 16;
  car.driven = 0;
  car.park = null;
  car.exitPose = null;
  car.depart = null;
  const pose = roadPose(car.from, car.to, car.t);
  car.x = pose.x; car.z = pose.z; car.yaw = pose.yaw;
}

export function createTraffic(city, count) {
  const graph = buildRoadGraph(city.roads);
  const cars = [];
  const sim = { graph, buildings: city.buildings, cars, busy: new Set() };
  if (!graph.edges.length) return sim;
  for (let i = 0; i < count; i++) {
    let from, to, half, pose, guard = 0;
    do {
      const edge = graph.edges[Math.floor(Math.random() * graph.edges.length)];
      const flip = Math.random() < 0.5;
      from = flip ? edge.b : edge.a;
      to = flip ? edge.a : edge.b;
      half = edge.half;
      pose = roadPose(from, to, 0.15 + Math.random() * 0.7);
      guard++;
    } while (guard < 16 && cars.some(other => Math.hypot(other.x - pose.x, other.z - pose.z) < 4.5));
    const car = {
      color: PALETTE[i % PALETTE.length],
      outfit: OUTFITS[i % OUTFITS.length],
      from, to, half, t: 0.4, speed: 1.15 + Math.random() * 0.55,
      phase: 'drive', driven: 0, cooldown: 5 + Math.random() * 7,
      x: pose.x, z: pose.z, yaw: pose.yaw,
      person: false, px: pose.x, pz: pose.z, pyaw: pose.yaw, stride: Math.random() * 4,
      parkAt: null, park: null, path: null, walk: 0, timer: 0,
      approach: null, exitPose: null, depart: null,
    };
    const along = roadPose(from, to, 0);
    const span = Math.hypot(to.x - from.x, to.z - from.z) || 1;
    car.t = Math.max(0.05, Math.min(0.9, ((pose.x - along.x) * (to.x - from.x) + (pose.z - along.z) * (to.z - from.z)) / (span * span)));
    cars.push(car);
  }
  return sim;
}

export function stepTraffic(sim, dt) {
  const step = Math.max(0, Math.min(dt, 0.05));
  if (!step) return;
  for (const car of sim.cars) {
    if (car.phase === 'drive') drive(car, sim, step);
    else if (car.phase === 'approach') approach(car, step);
    else if (car.phase === 'pause') pause(car, step);
    else if (car.phase === 'walk-in' || car.phase === 'walk-out') walk(car, step);
    else if (car.phase === 'inside') inside(car, step);
    else if (car.phase === 'depart') depart(car, sim, step);
  }
}

function drive(car, sim, dt) {
  const pose = roadPose(car.from, car.to, car.t);
  let speed = car.speed;
  for (const other of sim.cars) {
    if (other === car || other.phase !== 'drive') continue;
    const ox = other.x - pose.x, oz = other.z - pose.z;
    const ahead = ox * pose.fx + oz * pose.fz;
    const side = Math.abs(-oz * pose.fx + ox * pose.fz);
    if (ahead > 0.35 && ahead < 2.5 && side < 0.55) speed = Math.min(speed, other.speed * 0.82);
  }
  const len = Math.hypot(car.to.x - car.from.x, car.to.z - car.from.z) || 1;
  car.t += speed * dt / len;
  car.driven += speed * dt;
  car.cooldown -= dt;
  if (car.parkAt && car.t >= car.parkAt.u) {
    if (sim.busy.size >= 3) car.parkAt = null;
    else {
      const at = roadPose(car.from, car.to, car.parkAt.u);
      car.x = at.x; car.z = at.z; car.yaw = at.yaw;
      car.t = car.parkAt.u;
      beginPark(car, sim);
      return;
    }
  }
  if (car.t >= 1) {
    const prev = car.from;
    const arrived = car.to;
    const next = turn(arrived, prev);
    car.from = arrived;
    car.to = next.to;
    car.half = next.edge.half;
    car.t = 0;
    planStop(car, sim);
  }
  const nextPose = roadPose(car.from, car.to, car.t);
  car.x = nextPose.x; car.z = nextPose.z; car.yaw = nextPose.yaw;
  car.person = false;
}

function approach(car, dt) {
  car.approach.u += dt / 1.15;
  const u = Math.min(1, car.approach.u);
  const e = u * u * (3 - 2 * u);
  car.x = car.approach.x + (car.park.x - car.approach.x) * e;
  car.z = car.approach.z + (car.park.z - car.approach.z) * e;
  car.yaw = lerpAngle(car.approach.yaw, car.park.yaw, e);
  if (u < 1) return;
  car.x = car.park.x; car.z = car.park.z; car.yaw = car.park.yaw;
  car.phase = 'pause';
  car.timer = 0.4;
}

function pause(car, dt) {
  car.timer -= dt;
  if (car.timer > 0) return;
  car.path = enterPath(car);
  car.walk = 0;
  car.person = true;
  car.phase = 'walk-in';
}

function walk(car, dt) {
  car.walk += 1.65 * dt;
  car.stride += dt * 8;
  const pose = walkPose(car.path, car.walk);
  car.px = pose.x; car.pz = pose.z; car.pyaw = pose.yaw;
  car.person = true;
  if (!pose.done) return;
  if (car.phase === 'walk-in') {
    car.person = false;
    car.phase = 'inside';
    car.timer = 5.5 + Math.random() * 6.5;
    return;
  }
  car.person = false;
  car.phase = 'depart';
  car.depart = { x: car.x, z: car.z, yaw: car.yaw, u: 0 };
  const back = roadPose(car.resume.from, car.resume.to, Math.min(0.94, car.resume.t + 0.04));
  car.exitPose = back;
}

function inside(car, dt) {
  car.person = false;
  car.timer -= dt;
  if (car.timer > 0) return;
  const door = car.path[car.path.length - 2];
  const back = car.path.slice(0, -1).reverse();
  if (back[0] !== door) back.unshift(door);
  car.path = back;
  car.walk = 0;
  car.person = true;
  car.px = door.x; car.pz = door.z;
  car.phase = 'walk-out';
}

function depart(car, sim, dt) {
  car.depart.u += dt / 1.1;
  const u = Math.min(1, car.depart.u);
  const e = u * u * (3 - 2 * u);
  car.x = car.depart.x + (car.exitPose.x - car.depart.x) * e;
  car.z = car.depart.z + (car.exitPose.z - car.depart.z) * e;
  car.yaw = lerpAngle(car.depart.yaw, car.exitPose.yaw, e);
  if (u < 1) return;
  finishDepart(car, sim);
}
