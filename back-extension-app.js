import * as THREE from './vendor/three.module.js';
import { createMannequin } from './back-extension-model.js';

const exercise = {
  id: 'back-extension',
  title: 'Back Extension',
  repsPerDirection: 10,
  secondsPerRep: 4,
  speeds: [0.6, 1, 1.4],
  cues: [
    'Stand with your feet shoulder-width apart and place your hands on your hips.',
    'Lean backward slowly through a comfortable, controlled range.',
    'Hold briefly, then return to the starting position.'
  ],
  safety: 'Use a comfortable range. Stop for pain, dizziness, or unusual discomfort.'
};

const app = document.getElementById('app');
const stage = document.getElementById('stage');
const threeStage = document.getElementById('three-stage');
const count = document.getElementById('count');
const directionLabel = document.getElementById('direction');
const status = document.getElementById('status');
const announcement = document.getElementById('announcement');
const toggle = document.getElementById('toggle');
const reverse = document.getElementById('reverse');
const speed = document.getElementById('speed');
const reset = document.getElementById('reset');

document.getElementById('exercise-title').textContent = exercise.title;
document.getElementById('rep-guidance').textContent = `${exercise.repsPerDirection} repetitions · 2 sets`;
document.getElementById('safety-message').textContent = exercise.safety;
document.getElementById('cue-list').innerHTML = exercise.cues.map((cue, index) =>
  `<div class="cue"><span class="num">${index + 1}</span><span>${cue}</span></div>`
).join('');

let renderer;
try {
  renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, preserveDrawingBuffer: true });
} catch (error) {
  threeStage.innerHTML = '<p class="render-error">This exercise needs WebGL. Open it in a current version of Edge, Chrome, Firefox, or Safari.</p>';
  throw error;
}

renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.setClearColor(0x000000, 0);
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.domElement.setAttribute('aria-hidden', 'true');
threeStage.append(renderer.domElement);

const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(32, 1, 0.05, 30);
const cameraTarget = new THREE.Vector3(0, 1.08, 0);
let azimuth = 0.36;
let elevation = 0.08;
let cameraDistance = 4.25;

function positionCamera() {
  camera.position.set(
    Math.sin(azimuth) * Math.cos(elevation) * cameraDistance,
    cameraTarget.y + Math.sin(elevation) * cameraDistance,
    Math.cos(azimuth) * Math.cos(elevation) * cameraDistance
  );
  camera.lookAt(cameraTarget);
}

scene.add(new THREE.HemisphereLight('#d9f7ff', '#15394f', 2.3));
const keyLight = new THREE.DirectionalLight('#fff1df', 3.2);
keyLight.position.set(-2.5, 4, 4);
keyLight.castShadow = true;
keyLight.shadow.mapSize.set(2048, 2048);
Object.assign(keyLight.shadow.camera, { left: -2, right: 2, top: 3, bottom: -2, near: 0.1, far: 12 });
keyLight.shadow.bias = -0.0004;
keyLight.shadow.normalBias = 0.015;
scene.add(keyLight);
const rimLight = new THREE.DirectionalLight('#6bd7e4', 2.1);
rimLight.position.set(3, 3, -3);
scene.add(rimLight);

const platform = new THREE.Mesh(
  new THREE.CylinderGeometry(0.56, 0.59, 0.018, 80),
  new THREE.MeshStandardMaterial({ color: '#12394c', roughness: 0.95 })
);
platform.position.y = 0.008;
platform.receiveShadow = true;
scene.add(platform);

const model = createMannequin();
scene.add(model.mesh);
model.ready.then(() => draw()).catch(error => {
  const message = document.createElement('p');
  message.className = 'render-error';
  message.textContent = 'The exercise model could not be loaded. Refresh the page to try again.';
  threeStage.append(message);
  console.error(error);
});

const speeds = exercise.speeds;
const baseSecondsPerRep = exercise.secondsPerRep;
let speedIndex = 1;
let started = false;
let running = false;
let direction = 1;
const pageParameters = new URLSearchParams(window.location.search);
let phase = pageParameters.has('phase') ? Number(pageParameters.get('phase')) * Math.PI / 180 || 0 : 0;
let distanceSinceRep = 0;
let reps = 0;
let lastTime = performance.now();

function draw() {
  model.pose(phase);
  renderer.render(scene, camera);
}

function resizeRenderer() {
  const rect = stage.getBoundingClientRect();
  renderer.setSize(Math.max(1, rect.width), Math.max(1, rect.height));
  camera.aspect = Math.max(0.1, rect.width / Math.max(1, rect.height));
  camera.updateProjectionMatrix();
  cameraDistance = camera.aspect < 0.85 ? 5.3 : 4.25;
  positionCamera();
  draw();
}

function setRunning(next) {
  if (!started) {
    started = true;
    app.classList.add('has-started');
  }
  running = next;
  toggle.textContent = running ? 'Pause' : 'Resume';
  status.textContent = running ? 'Exercise in progress' : 'Paused';
  announcement.textContent = running ? 'Exercise started' : 'Exercise paused';
  lastTime = performance.now();
}

toggle.addEventListener('click', () => setRunning(!running));
reverse.addEventListener('click', () => {
  direction *= -1;
  distanceSinceRep = 0;
  const isForward = direction === 1;
  app.classList.toggle('reverse-mode', !isForward);
  directionLabel.textContent = isForward ? 'Extend and return' : 'Return and extend';
  announcement.textContent = isForward ? 'Extend and return direction selected' : 'Return and extend direction selected';
});
speed.addEventListener('click', () => {
  speedIndex = (speedIndex + 1) % speeds.length;
  speed.textContent = `Speed: ${speeds[speedIndex]}×`;
  announcement.textContent = `Speed ${speeds[speedIndex]} times`;
});
reset.addEventListener('click', () => {
  reps = 0;
  distanceSinceRep = 0;
  count.textContent = '0';
  announcement.textContent = 'Repetition count reset';
});

document.addEventListener('keydown', event => {
  if (event.code === 'Space') { event.preventDefault(); toggle.click(); }
  else if (event.key.toLowerCase() === 'r') reverse.click();
  else if (event.key.toLowerCase() === 'f') document.documentElement.requestFullscreen?.();
});

let pointer = null;
renderer.domElement.addEventListener('pointerdown', event => {
  pointer = { x: event.clientX, y: event.clientY };
  renderer.domElement.setPointerCapture(event.pointerId);
});
renderer.domElement.addEventListener('pointermove', event => {
  if (!pointer) return;
  azimuth -= (event.clientX - pointer.x) * 0.008;
  elevation = THREE.MathUtils.clamp(elevation + (event.clientY - pointer.y) * 0.006, -0.2, 0.55);
  pointer = { x: event.clientX, y: event.clientY };
  positionCamera();
  draw();
});
renderer.domElement.addEventListener('pointerup', () => { pointer = null; });
renderer.domElement.addEventListener('pointercancel', () => { pointer = null; });

new ResizeObserver(resizeRenderer).observe(stage);
resizeRenderer();

async function verifyMotion() {
  await model.ready;
  return model.inspectRig();
}

window.__warmupPOC = {
  exercise,
  state: () => ({ started, running, direction, speed: speeds[speedIndex], reps, phase, distanceSinceRep }),
  setPhase: degrees => { phase = Number(degrees) * Math.PI / 180 || 0; draw(); },
  verifyMotion
};

// Opt-in browser diagnostic used during packaging; normal exercise loads do
// not pay the cost of sampling every vertex through the complete motion.
if (pageParameters.has('verify')) {
  const verificationOutput = document.createElement('output');
  verificationOutput.id = 'motion-verification';
  verificationOutput.hidden = true;
  document.body.append(verificationOutput);
  model.ready
    .then(() => verifyMotion())
    .then(result => {
      verificationOutput.textContent = JSON.stringify(result);
      document.title = `${result.pass ? 'PASS' : 'FAIL'} — ${document.title}`;
    })
    .catch(error => {
      verificationOutput.textContent = JSON.stringify({ pass: false, error: String(error) });
      document.title = `FAIL — ${document.title}`;
    });
}

function renderTime(now) {
  const delta = Math.min((now - lastTime) / 1000, 0.08);
  lastTime = now;
  if (running) {
    const radiansPerSecond = Math.PI * 2 / (baseSecondsPerRep / speeds[speedIndex]);
    const travel = radiansPerSecond * delta;
    phase += travel * direction;
    distanceSinceRep += travel;
    while (distanceSinceRep >= Math.PI * 2) {
      distanceSinceRep -= Math.PI * 2;
      reps += 1;
      count.textContent = reps;
      announcement.textContent = `Repetition ${reps} complete`;
    }
  }
  draw();
  requestAnimationFrame(renderTime);
}

requestAnimationFrame(renderTime);
