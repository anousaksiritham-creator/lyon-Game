import * as THREE from './three.module.js';

/* ---------- Renderer, scene and lights ---------- */
const view = document.querySelector('#view');
let renderer;
try { renderer = new THREE.WebGLRenderer({ antialias: true }); }
catch (e) { document.querySelector('#error').textContent = 'ອຸປະກອນນີ້ບໍ່ຮອງຮັບ WebGL'; throw e; }
renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
renderer.shadowMap.enabled = true;
view.appendChild(renderer.domElement);

const scene = new THREE.Scene();
const bg = new THREE.Color('#bfe8ed');
scene.background = bg;
scene.fog = new THREE.Fog('#bfe8ed', 35, 75);
const camera = new THREE.PerspectiveCamera(45, 1, 0.1, 100);
const target = new THREE.Vector3(0, 2, 0);
let angle = 0.7, elev = 0.45, distance = 20;

const hemi = new THREE.HemisphereLight(0xffffff, 0x71946a, 2.2);
scene.add(hemi);
const sun = new THREE.DirectionalLight(0xfff0d2, 2.4);
sun.castShadow = true;
sun.shadow.mapSize.set(1024, 1024);
Object.assign(sun.shadow.camera, { left: -15, right: 15, top: 15, bottom: -15 });
scene.add(sun);
const moon = new THREE.DirectionalLight(0x9fb6ff, 0);
moon.position.set(-8, 12, -6);
scene.add(moon);
const houseLight = new THREE.PointLight('#ffd08a', 0, 9);
houseLight.position.set(0, 2.4, 3.4);
scene.add(houseLight);
const schoolLight = new THREE.PointLight('#ffd08a', 0, 9);
schoolLight.position.set(0, 2.2, -8.2);
scene.add(schoolLight);

/* ---------- Colours and helpers ---------- */
const NIGHT = new THREE.Color('#1c2748');
const DAY = new THREE.Color('#bfe8ed');
const DUSK = new THREE.Color('#f3a77e');
const RAINY = new THREE.Color('#a5b9c1');
const sky = new THREE.Color();
const glowMats = [];
const clamp01 = v => Math.min(1, Math.max(0, v));
const smooth = (a, b, x) => { const t = clamp01((x - a) / (b - a)); return t * t * (3 - 2 * t); };
const dayAmount = h => smooth(5.2, 6.9, h) * (1 - smooth(17.8, 19.4, h));

function mat(c) { return new THREE.MeshStandardMaterial({ color: c, roughness: 0.85 }); }
function glowMat(c) {
  const m = new THREE.MeshStandardMaterial({ color: c, emissive: '#ffcc66', emissiveIntensity: 0, roughness: 0.4 });
  glowMats.push(m);
  return m;
}
function box(w, h, d, c, x, y, z, parent = scene) {
  const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), typeof c === 'string' ? mat(c) : c);
  m.position.set(x, y, z); m.castShadow = true; m.receiveShadow = true; parent.add(m); return m;
}
function ball(r, c, x, y, z, parent = scene) {
  const m = new THREE.Mesh(new THREE.SphereGeometry(r, 16, 12), typeof c === 'string' ? mat(c) : c);
  m.position.set(x, y, z); m.castShadow = true; parent.add(m); return m;
}
// Areas that are already occupied, so random ground speckles stay clear of them
const BLOCKED = [[0, 0, 4, 4], [-4, 8.5, 3, 2], [6.2, 9.2, 2.2, 2.2], [9.4, -4, 2.5, 2], [0, -11, 5, 3]];

/* ---------- Village ---------- */
box(32, 0.3, 32, '#a6d18d', 0, -0.2, 0);
const wall = mat('#f5ca7b');
box(6, 3.8, 5, wall, 0, 2, 0);
const roof = new THREE.Mesh(new THREE.ConeGeometry(4.9, 2.5, 4), mat('#db8270'));
roof.rotation.y = Math.PI / 4; roof.position.set(0, 5.1, 0); roof.castShadow = true; scene.add(roof);

// Base door and windows (the designer's own door/windows are drawn on top of these)
const winGlass = glowMat('#fff3cf');
box(0.95, 1.9, 0.06, '#6b4329', 0, 0.95, 2.53);
for (const x of [-1.9, 1.9]) {
  box(1.05, 1.05, 0.06, '#fff6df', x, 2.3, 2.53);
  box(0.85, 0.85, 0.07, winGlass, x, 2.3, 2.57);
}

function tree(x, z) { box(0.35, 2, 0.35, '#9b7650', x, 1, z); ball(1.25, '#70a56a', x, 2.9, z); ball(0.8, '#8dba79', x + 0.7, 2.65, z); }
[[-7, -5], [7, -6], [-7, 5], [8, 5], [10, 0], [-10, 0]].forEach(p => tree(...p));

for (let i = 0; i < 36; i++) {
  const x = Math.sin(i * 19) * 11, z = Math.cos(i * 13) * 11;
  if (BLOCKED.some(([cx, cz, hw, hd]) => Math.abs(x - cx) < hw && Math.abs(z - cz) < hd)) continue;
  box(0.06, 0.3, 0.06, '#5d9d62', x, 0.15, z);
  ball(0.13, ['#f8b4af', '#ffdd79', '#d3a6e5'][i % 3], x, 0.35, z);
}

/* ---------- Flower garden (watered during the day) ---------- */
const FLOWER_BED = { x: -4, z: 8.5 };
box(4.6, 0.16, 2.4, '#7a5234', FLOWER_BED.x, 0.08, FLOWER_BED.z);
const petals = ['#f59cb4', '#ffd35c', '#ff8a5c', '#c59cf0', '#ffffff'];
for (let r = 0; r < 3; r++) for (let c = 0; c < 6; c++) {
  const x = FLOWER_BED.x - 2.1 + c * 0.7, z = FLOWER_BED.z - 0.8 + r * 0.8;
  box(0.05, 0.5, 0.05, '#4f8f4a', x, 0.33, z);
  ball(0.16, petals[(r * 6 + c) % petals.length], x, 0.62, z);
}
const waterDrops = Array.from({ length: 5 }, () => { const m = ball(0.07, '#7cc7f0', 0, -5, 0); m.castShadow = false; m.visible = false; return m; });

/* ---------- Chicken coop (fed during the day) ---------- */
const FENCE = '#f2e3c4';
for (const y of [0.5, 0.9]) {
  box(1.5, 0.07, 0.07, FENCE, 4.25, y, 8);
  box(1.5, 0.07, 0.07, FENCE, 6.75, y, 8);
  box(4, 0.07, 0.07, FENCE, 5.5, y, 11);
  box(0.07, 0.07, 3, FENCE, 3.5, y, 9.5);
  box(0.07, 0.07, 3, FENCE, 7.5, y, 9.5);
}
for (const [x, z] of [[3.5, 8], [5, 8], [6, 8], [7.5, 8], [3.5, 11], [7.5, 11]]) box(0.12, 1.1, 0.12, '#a87d56', x, 0.55, z);
box(1.6, 1.1, 1.3, '#d9a77b', 4.6, 0.55, 10.3);
const coopRoof = new THREE.Mesh(new THREE.ConeGeometry(1.15, 0.8, 4), mat('#c86a52'));
coopRoof.rotation.y = Math.PI / 4; coopRoof.position.set(4.6, 1.5, 10.3); coopRoof.castShadow = true; scene.add(coopRoof);
const hens = [];
for (let i = 0; i < 4; i++) {
  const g = new THREE.Group();
  g.rotation.order = 'YXZ';
  scene.add(g);
  ball(0.2, '#fff8ee', 0, 0.28, 0, g);
  ball(0.12, '#fff8ee', 0.14, 0.45, 0, g);
  ball(0.05, '#e0463d', 0.16, 0.56, 0, g);
  box(0.07, 0.05, 0.08, '#f2a53a', 0.27, 0.44, 0, g);
  hens.push({ g, i });
}

/* ---------- Blanket folding table and washing line ---------- */
const TABLE = { x: 9.4, z: -4 };
box(1.8, 0.1, 1.1, '#b58a5c', TABLE.x, 0.95, TABLE.z);
for (const [dx, dz] of [[-0.8, -0.45], [0.8, -0.45], [-0.8, 0.45], [0.8, 0.45]]) box(0.08, 0.9, 0.08, '#8c6640', TABLE.x + dx, 0.45, TABLE.z + dz);
box(1.2, 0.12, 0.9, '#e77f9c', TABLE.x, 1.06, TABLE.z);
box(1.2, 0.12, 0.9, '#7fb0e0', TABLE.x, 1.18, TABLE.z);
const foldBlanket = box(1.3, 0.08, 1.0, '#f2c46d', TABLE.x, 1.3, TABLE.z);
foldBlanket.visible = false;
for (const z of [-2.2, -5.8]) box(0.1, 2.2, 0.1, '#8c6640', 12, 1.1, z);
box(0.03, 0.03, 3.6, '#555555', 12, 2.0, -4);
[['#e58f8f', -3.2], ['#8fd0e5', -4.0], ['#f3d27a', -4.8]].forEach(([c, z]) => box(0.05, 1.0, 0.8, c, 12, 1.5, z));

/* ---------- School (children are inside during the day) ---------- */
box(8, 3.2, 4, '#f6e6b8', 0, 1.6, -11);
box(8.4, 0.4, 4.4, '#c86a52', 0, 3.4, -11);
box(1.2, 1.1, 1.2, '#f6e6b8', 0, 4.15, -11);
const bell = new THREE.Mesh(new THREE.ConeGeometry(1.0, 1.0, 4), mat('#c86a52'));
bell.rotation.y = Math.PI / 4; bell.position.set(0, 5.2, -11); bell.castShadow = true; scene.add(bell);
box(0.05, 1.2, 0.05, '#666666', 0, 6.3, -11);
box(0.7, 0.4, 0.03, '#e54b4b', 0.35, 6.7, -11);
box(1.0, 2.0, 0.08, '#7a4f35', 0, 1.0, -9.05);
const schoolGlass = glowMat('#fff3cf');
for (const x of [-2.6, 2.6]) {
  box(1.2, 1.1, 0.06, '#fff6df', x, 2.0, -9.03);
  box(0.95, 0.9, 0.07, schoolGlass, x, 2.0, -9.06);
}

/* ---------- Villagers and their daily timelines ---------- */
// Walk/work spots. Walking paths are chosen to stay clear of the house and trees.
const P = (x, z) => ({ x, z });
const K = (h, p, a, face) => ({ h, p, a, face }); // p = null means "wander around the village"
const HOUSE_IN = P(0, 0), DOOR = P(0, 3.4), LEFT_WP = P(-4, 3.4), LEFT_BACK = P(-5.5, 0);
const RIGHT_WP = P(4.8, 3.6), RIGHT_BACK = P(5, -2.5);
const FLOWER_STAND = P(-4, 6.8);
const COOP_STAND = P(5.5, 6.8), COOP_CENTER = P(6.2, 9.2);
const FOLD_STAND = P(7.9, -4);
const SCHOOL_DOOR = P(0, -9.4);

const TIMELINES = {
  // Waters the flowers, then goes to school
  water: [
    K(0, HOUSE_IN, 'hidden'),
    K(5.5, DOOR, 'walk'), K(5.7, LEFT_WP, 'walk'),
    K(5.85, FLOWER_STAND, 'water', FLOWER_BED), K(6.95, FLOWER_STAND, 'walk'),
    K(7.25, LEFT_BACK, 'walk'), K(7.65, SCHOOL_DOOR, 'walk'), K(7.9, SCHOOL_DOOR, 'hidden'),
    K(15, SCHOOL_DOOR, 'walk'), K(15.5, null, 'roam'), K(19.6, null, 'walk'), K(20.1, DOOR, 'walk'),
    K(20.3, HOUSE_IN, 'hidden'),
  ],
  // Feeds the chickens, then goes to school
  feed: [
    K(0, HOUSE_IN, 'hidden'),
    K(5.6, DOOR, 'walk'), K(5.8, RIGHT_WP, 'walk'),
    K(5.95, COOP_STAND, 'feed', COOP_CENTER), K(7.0, COOP_STAND, 'walk'),
    K(7.15, RIGHT_WP, 'walk'), K(7.45, RIGHT_BACK, 'walk'), K(7.9, SCHOOL_DOOR, 'walk'), K(8.1, SCHOOL_DOOR, 'hidden'),
    K(15, SCHOOL_DOOR, 'walk'), K(15.5, null, 'roam'), K(19.8, null, 'walk'), K(20.2, DOOR, 'walk'),
    K(20.4, HOUSE_IN, 'hidden'),
  ],
  // Folds blankets, then goes to school
  fold: [
    K(0, HOUSE_IN, 'hidden'),
    K(5.9, DOOR, 'walk'), K(6.2, RIGHT_WP, 'walk'),
    K(6.5, FOLD_STAND, 'fold', TABLE), K(7.8, FOLD_STAND, 'walk'),
    K(7.95, RIGHT_BACK, 'walk'), K(8.35, SCHOOL_DOOR, 'walk'), K(8.5, SCHOOL_DOOR, 'hidden'),
    K(15, SCHOOL_DOOR, 'walk'), K(15.5, null, 'roam'), K(19.7, null, 'walk'), K(20.2, DOOR, 'walk'),
    K(20.4, HOUSE_IN, 'hidden'),
  ],
};

function makePerson(shirt, skin, scale, phase, timeline) {
  const g = new THREE.Group();
  g.scale.setScalar(scale);
  g.rotation.order = 'YXZ';
  scene.add(g);
  box(0.65, 0.75, 0.35, shirt, 0, 1.15, 0, g);
  ball(0.32, skin, 0, 1.93, 0, g);
  const hair = ball(0.325, '#543f34', 0, 2.07, 0, g); hair.scale.y = 0.55;
  const legs = [box(0.21, 0.7, 0.22, '#657a9d', -0.18, 0.4, 0, g), box(0.21, 0.7, 0.22, '#657a9d', 0.18, 0.4, 0, g)];
  const arms = [box(0.18, 0.65, 0.2, skin, -0.43, 1.15, 0, g), box(0.18, 0.65, 0.2, skin, 0.43, 1.15, 0, g)];
  return { g, legs, arms, phase, timeline, heading: 0 };
}
const people = [
  makePerson('#ef9b83', '#e7ba93', 1, 0, TIMELINES.water),
  makePerson('#f3ce62', '#dfad88', 0.7, 2.4, TIMELINES.feed),
  makePerson('#87b8c8', '#eac5a5', 0.9, 4.4, TIMELINES.fold),
];

// Where a villager is at a given hour. Roaming uses the same circle as before.
function roamSpot(phase) {
  const a = time * 0.32 + phase;
  return { x: Math.cos(a) * 7, z: Math.sin(a) * 6, heading: Math.atan2(-7 * Math.sin(a), 6 * Math.cos(a)) };
}
const spotOf = (p, phase) => p ?? roamSpot(phase);
function locate(person, h) {
  const tl = person.timeline;
  let i = 0;
  for (let k = 0; k < tl.length; k++) if (tl[k].h <= h) i = k;
  const a = tl[i], b = tl[(i + 1) % tl.length];
  const dur = (b.h - a.h + 24) % 24 || 24;
  const f = Math.min(1, ((h - a.h + 24) % 24) / dur);
  if (a.a === 'hidden') return { visible: false };
  if (a.a === 'roam') return { visible: true, act: 'walk', ...roamSpot(person.phase) };
  const pa = spotOf(a.p, person.phase);
  if (a.a === 'walk') {
    const pb = spotOf(b.p, person.phase);
    const dx = pb.x - pa.x, dz = pb.z - pa.z;
    return { visible: true, act: 'walk', x: pa.x + dx * f, z: pa.z + dz * f, heading: Math.atan2(dx, dz) };
  }
  return { visible: true, act: a.a, x: pa.x, z: pa.z, heading: Math.atan2(a.face.x - pa.x, a.face.z - pa.z) };
}
function turnTowards(cur, goal, k) {
  const d = Math.atan2(Math.sin(goal - cur), Math.cos(goal - cur));
  return cur + d * k;
}
function updatePeople(h, dt) {
  let watering = null, folding = false;
  for (const p of people) {
    const s = locate(p, h);
    p.g.visible = s.visible;
    if (!s.visible) continue;
    p.heading = turnTowards(p.heading, s.heading, Math.min(1, dt * 8));
    p.g.position.set(s.x, 0, s.z);
    const swing = paused ? 0 : Math.sin(time * 6 + p.phase) * 0.55;
    let lean = 0, legSwing = s.act === 'walk' ? swing : 0, armL = -swing, armR = swing;
    if (s.act === 'water') {
      lean = 0.35; legSwing = 0; armL = -0.9; armR = -1.3 + Math.sin(time * 5) * 0.35;
      watering = s;
    } else if (s.act === 'feed') {
      lean = 0.65; legSwing = 0; armL = -0.9 + Math.sin(time * 4) * 0.25; armR = -0.9 + Math.sin(time * 4 + 1.5) * 0.25;
    } else if (s.act === 'fold') {
      lean = 0.1; legSwing = 0; const f = Math.sin(time * 7) * 0.3; armL = -1.2 + f; armR = -1.2 + f;
      folding = true;
    }
    p.legs[0].rotation.x = legSwing; p.legs[1].rotation.x = -legSwing;
    p.arms[0].rotation.x = armL; p.arms[1].rotation.x = armR;
    p.g.rotation.set(lean, p.heading, 0);
  }
  waterDrops.forEach((m, i) => {
    if (!watering) { m.visible = false; return; }
    const f = (time * 1.6 + i / waterDrops.length) % 1;
    m.visible = true;
    m.position.set(
      watering.x + (FLOWER_BED.x - watering.x) * f,
      1.2 * (1 - f) + 0.3 + Math.sin(f * Math.PI) * 0.35,
      watering.z + (FLOWER_BED.z - watering.z) * f,
    );
  });
  foldBlanket.visible = folding;
  if (folding) {
    const f = (time * 0.6) % 1;
    foldBlanket.position.set(TABLE.x - 0.5 + f * 1.0, 1.3 + Math.sin(f * Math.PI) * 0.35, TABLE.z);
    foldBlanket.rotation.z = -Math.sin(f * Math.PI) * 0.4;
  }
}
function updateHens() {
  for (const hen of hens) {
    const a = time * 0.5 + hen.i * 1.9;
    hen.g.position.set(COOP_CENTER.x + Math.cos(a) * 0.8, 0, COOP_CENTER.z + Math.sin(a * 1.3) * 0.6);
    hen.g.rotation.y = Math.atan2(-Math.sin(a) * 0.4, Math.cos(a * 1.3) * 0.9);
  }
}

/* ---------- Rain ---------- */
const rainArr = new Float32Array(450 * 3);
for (let i = 0; i < rainArr.length; i += 3) {
  rainArr[i] = (Math.random() - 0.5) * 30; rainArr[i + 1] = Math.random() * 16; rainArr[i + 2] = (Math.random() - 0.5) * 30;
}
const rainGeo = new THREE.BufferGeometry();
rainGeo.setAttribute('position', new THREE.BufferAttribute(rainArr, 3));
const rain = new THREE.Points(rainGeo, new THREE.PointsMaterial({ color: '#c9e9ff', size: 0.1, transparent: true, opacity: 0.8 }));
rain.visible = false;
scene.add(rain);

/* ---------- Clock and lighting ---------- */
const DAY_SECONDS = 240; // one full in-game day takes 4 real minutes
let weather = 'sun', paused = false, autoClock = true, time = 0, hour = 6.2, last = performance.now();

function setHour(h) { hour = ((h % 24) + 24) % 24; }
function updateLighting(h, rainy) {
  const day = dayAmount(h), night = 1 - day;
  const mul = rainy ? 0.5 : 1;
  hemi.intensity = (0.55 + 1.65 * day) * mul;
  sun.intensity = 2.4 * day * mul;
  const a = ((h - 6) / 12) * Math.PI;
  sun.position.set(-Math.cos(a) * 14, Math.sin(a) * 16 + 0.5, 6);
  moon.intensity = 0.35 * night;
  houseLight.intensity = 3 * night;
  schoolLight.intensity = 2 * night;
  for (const m of glowMats) m.emissiveIntensity = 1.2 * night;
  const dusk = clamp01(1 - Math.abs(h - 6.4) / 1.4) + clamp01(1 - Math.abs(h - 18.3) / 1.4);
  sky.copy(NIGHT).lerp(DAY, day);
  sky.lerp(DUSK, 0.55 * Math.min(1, dusk));
  if (rainy) sky.lerp(RAINY, 0.6);
  bg.copy(sky);
  scene.fog.color.copy(sky);
}

/* ---------- Controls ---------- */
const timeInput = document.querySelector('#time');
const clockEl = document.querySelector('#clock');
const autoBtn = document.querySelector('#auto');
const pauseBtn = document.querySelector('#pause');
const fmt = h => `${String(Math.floor(h)).padStart(2, '0')}:${String(Math.floor((h % 1) * 60)).padStart(2, '0')}`;
function phaseName(h) {
  if (h < 5.5 || h >= 20.5) return '🌙 ກາງຄືນ · ນອນຫຼັບ';
  if (h < 7.9) return '🌅 ຕອນເຊົ້າ · ອອກມາເຮັດວຽກ';
  if (h < 15) return '🏫 ຢູ່ໂຮງຮຽນ';
  return '🌇 ຕອນແລງ · ຫຼິ້ນກັນ';
}
let shownClock = '';
function updateClockUi() {
  const text = `${fmt(hour)} · ${phaseName(hour)}`;
  if (text !== shownClock) { clockEl.textContent = text; shownClock = text; }
  if (document.activeElement !== timeInput) timeInput.value = hour.toFixed(2);
}
function setWeather(name) {
  weather = name;
  document.querySelectorAll('[data-weather]').forEach(q => q.setAttribute('aria-pressed', String(q.dataset.weather === name)));
  rain.visible = name === 'rain';
}
document.querySelectorAll('[data-weather]').forEach(b => b.onclick = () => setWeather(b.dataset.weather));
document.querySelectorAll('[data-hour]').forEach(b => b.onclick = () => setHour(+b.dataset.hour));
timeInput.addEventListener('input', () => setHour(parseFloat(timeInput.value)));
autoBtn.onclick = () => { autoClock = !autoClock; autoBtn.setAttribute('aria-pressed', String(autoClock)); };
pauseBtn.onclick = () => {
  paused = !paused;
  pauseBtn.textContent = paused ? '▶ ໃຫ້ເວລາເດີນ' : '⏸ ຢຸດເວລາ';
};
let ci = 0;
document.querySelector('#color').onclick = () => wall.color.set(['#f5ca7b', '#f2aa9c', '#a4c5dd', '#b7d79f', '#c9b5e6'][++ci % 5]);

let drag = null;
renderer.domElement.addEventListener('pointerdown', e => { drag = [e.clientX, e.clientY]; renderer.domElement.setPointerCapture(e.pointerId); });
renderer.domElement.addEventListener('pointermove', e => {
  if (!drag) return;
  angle -= (e.clientX - drag[0]) * 0.008;
  elev = Math.max(0.18, Math.min(1.15, elev + (e.clientY - drag[1]) * 0.006));
  drag = [e.clientX, e.clientY];
});
renderer.domElement.addEventListener('pointerup', () => drag = null);
renderer.domElement.addEventListener('pointercancel', () => drag = null);
renderer.domElement.addEventListener('wheel', e => { e.preventDefault(); distance = Math.max(10, Math.min(32, distance + e.deltaY * 0.015)); }, { passive: false });
function resize() {
  const w = view.clientWidth, h = view.clientHeight;
  renderer.setSize(w, h);
  camera.aspect = w / h;
  camera.updateProjectionMatrix();
}
window.addEventListener('resize', resize);

/* ---------- Design messages from the 2D editor ---------- */
const designGroup = new THREE.Group();
scene.add(designGroup);
window.addEventListener('message', e => {
  if (e.origin !== location.origin || e.data?.type !== 'lyon-design') return;
  const d = e.data;
  if (/^#[0-9a-f]{6}$/i.test(d.wall)) wall.color.set(d.wall);
  if (/^#[0-9a-f]{6}$/i.test(d.roof)) roof.material.color.set(d.roof);
  setWeather('sun');
  if (d.sky === 2) setHour(22);
  else if (hour > 19 || hour < 5.5) setHour(12);
  if (d.design) applyDesign(d.design);
});

/* ---------- Main loop ---------- */
function animate(now) {
  requestAnimationFrame(animate);
  const dt = Math.min((now - last) / 1000, 0.05);
  last = now;
  if (!paused) {
    time += dt;
    if (autoClock) setHour(hour + (dt * 24) / DAY_SECONDS);
  }
  updatePeople(hour, dt);
  updateHens();
  updateLighting(hour, weather === 'rain');
  if (rain.visible && !paused) {
    for (let i = 1; i < rainArr.length; i += 3) { rainArr[i] -= dt * 9; if (rainArr[i] < 0) rainArr[i] = 16; }
    rainGeo.attributes.position.needsUpdate = true;
  }
  updateClockUi();
  camera.position.set(Math.sin(angle) * Math.cos(elev) * distance, Math.sin(elev) * distance + 2, Math.cos(angle) * Math.cos(elev) * distance);
  camera.lookAt(target);
  renderer.render(scene, camera);
}

setWeather('sun');
setHour(hour);
resize();
requestAnimationFrame(animate);

function applyDesign(d){
 while(designGroup.children.length){const o=designGroup.children[0];designGroup.remove(o);o.traverse(n=>{if(n.geometry)n.geometry.dispose();if(n.material&&n.material!==wall&&n.material!==roof.material){(Array.isArray(n.material)?n.material:[n.material]).forEach(m=>m.dispose())}})}
 const g=designGroup, color=['#668e80','#b98061','#a58aba'][d.door]||'#668e80';
 box(1.3,2.3,.15,color,0,1.2,2.58,g);ball(.08,'#f9d779',.43,1.15,2.7,g);if(d.door===1)box(.95,1.5,.05,'#d9ac83',0,1.3,2.68,g);if(d.door===2)ball(.28,'#bee0e5',0,1.8,2.7,g);
 for(const x of [-2,2]){if(d.windows===1){const frame=ball(.65,'#fff6df',x,2.3,2.57,g);frame.scale.z=.15;const pane=ball(.48,'#9ed2d8',x,2.3,2.68,g);pane.scale.z=.15}else{box(1.05,1.05,.16,'#fff6df',x,2.3,2.58,g);box(.83,.83,.18,'#9ed2d8',x,2.3,2.68,g);if(d.windows===2)box(1.2,.2,.4,'#bc8063',x,1.72,2.7,g)}box(.07,.85,.2,'#fff6df',x,2.3,2.8,g);box(.85,.07,.2,'#fff6df',x,2.3,2.8,g)}
 roof.geometry.dispose();roof.geometry=d.home===2?new THREE.SphereGeometry(3.8,24,12,0,Math.PI*2,0,Math.PI/2):d.shape===1?new THREE.ConeGeometry(4.5,2.3,24):d.shape===2?new THREE.ConeGeometry(4.6,1.3,4):new THREE.ConeGeometry(4.9,2.5,4);roof.position.y=d.home===2?3.9:d.shape===2?4.7:5.1;roof.rotation.y=d.home===2?0:Math.PI/4;
 if(d.home===2){for(const [x,z] of [[-1.5,0],[1.5,0],[0,1.5]]){const dot=ball(.45,'#fff2d9',x,5.7,z,g);dot.scale.y=.25}}if(d.home===1)for(const x of [-3.3,3.3]){box(1,4,1,wall,x,2,1.9,g);const turret=new THREE.Mesh(new THREE.ConeGeometry(.9,1.5,4),roof.material);turret.position.set(x,4.7,1.9);turret.rotation.y=Math.PI/4;g.add(turret)}
 box(2,.04,8,d.path===1?'#b5b8ad':d.path===2?'#eecfd0':'#e7d8b9',0,.01,7,g);if(d.path===1)for(let i=0;i<6;i++)box(1.4,.1,.6,'#ecebe0',0,.1,3.8+i,g);if(d.path===2)for(let i=0;i<6;i++)for(const x of [-1.2,1.2])ball(.16,'#ee98aa',x,.18,3.5+i,g);
 if(d.texture)for(let i=0;i<8;i++)box(d.texture===1?5.8:.05,.04,.03,'#f6dfb8',d.texture===1?0:-2.7+i*.77,3.7-i*.4,2.6,g);
 if(d.garden===1||d.garden===4)for(let i=0;i<12;i++){const x=-6+(i%4)*.6,z=3+Math.floor(i/4)*.65;ball(.16,d.garden===1?'#f59cb4':'#ed9d4a',x,.28,z,g)}
 if(d.garden===2)for(let i=0;i<8;i++)box(.15,.9,.15,'#fff0dc',5.2,.45,-3+i*.8,g);
 if(d.garden===3){const pond=ball(1.5,'#80c7d4',5,.1,4,g);pond.scale.y=.08}
 if(d.garden===5){for(const x of [5,7])box(.15,2.8,.15,'#a47d58',x,1.4,3,g);box(2.2,.15,.15,'#a47d58',6,2.8,3,g);box(.8,.12,.5,'#e68f7b',6,.9,3,g)}
 if(d.fence>0){const fc=d.fence===1?'#fff4e2':'#a87d56';for(let i=0;i<10;i++){box(.14,1.1,.14,fc,-7+i*1.5,.55,-7,g)}box(13.7,.13,.13,fc,-.25,.45,-7,g);box(13.7,.13,.13,fc,-.25,.9,-7,g)}
 if(d.lighting>0)for(const x of [-1.7,1.7])for(const z of [4.5,7]){box(.12,1.15,.12,'#7d7c69',x,.58,z,g);const lamp=ball(.22,d.lighting===1?'#fff4ba':'#f2a9d0',x,1.25,z,g);lamp.material.emissive.set(d.lighting===1?'#d4ad55':'#c667a0');lamp.material.emissiveIntensity=.6}
 if(d.plants>0)for(let i=0;i<12;i++){const x=-5+(i%6)*.55,z=4+Math.floor(i/6)*.6;box(.06,.4,.06,'#628b50',x,.2,z,g);ball(.2,d.plants===1?'#e797b5':'#f1ca59',x,.48,z,g)}
 const animal=ball(.38,['#dca06d','#ad8162','#f1e7dd'][d.friend]||'#dca06d',-4,.45,4,g);animal.scale.set(1,.8,1.4);ball(.3,['#dca06d','#ad8162','#f1e7dd'][d.friend]||'#dca06d',-4,.8,4.35,g);
 if(d.decor===0)for(let i=0;i<3;i++)ball(.35,['#e99e9d','#efd179','#a7cadc'][i],-5+i*.7,3+i*.2,2,g);if(d.decor===1)for(let i=0;i<7;i++)box(.4,.3,.08,['#efa798','#f4d080','#b1c9dd'][i%3],-2.5+i*.8,3.45,2.8,g);if(d.decor===2){box(.12,1,.12,'#a47d58',4,.5,4,g);box(.7,.55,.5,'#e19d86',4,1.25,4,g)}
}
