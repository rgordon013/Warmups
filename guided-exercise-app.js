import * as THREE from './vendor/three.module.js';
import { createMannequin } from './back-extension-model.js?v=slide4-4';
import { createExerciseProgress } from './exercise-progress.js?v=2';
import { createTimedHoldProgress } from './timed-hold-progress.js?v=2';
import { ADDITIONAL_EXERCISES } from './additional-exercises.js';

const pageParameters = new URLSearchParams(window.location.search);
const exercise = ADDITIONAL_EXERCISES[pageParameters.get('exercise')] || ADDITIONAL_EXERCISES['active-chest-stretch'];
const speeds = [0.6, 1, 1.4];
const safety = 'Use a comfortable range. Stop for pain, dizziness, or unusual discomfort.';

const app = document.getElementById('app');
const stage = document.getElementById('stage');
const threeStage = document.getElementById('three-stage');
const count = document.getElementById('count');
const progressLabel = document.getElementById('progress-label');
const directionLabel = document.getElementById('direction');
const status = document.getElementById('status');
const announcement = document.getElementById('announcement');
const toggle = document.getElementById('toggle');
const reverse = document.getElementById('reverse');
const speed = document.getElementById('speed');
const reset = document.getElementById('reset');
const targetReps = document.getElementById('target-reps');
const targetSets = document.getElementById('target-sets');

document.title = `Shipbuilder Warmup — ${exercise.title}`;
document.getElementById('exercise-title').textContent = exercise.title;
document.getElementById('safety-message').textContent = safety;
document.getElementById('cue-list').innerHTML = exercise.cues.map((cue, index) =>
  `<div class="cue"><span class="num">${index + 1}</span><span>${cue}</span></div>`
).join('');
threeStage.setAttribute('aria-label', exercise.ariaLabel);
directionLabel.textContent = exercise.direction;
if (exercise.timed) {
  targetReps.closest('label').firstChild.textContent = 'Seconds ';
  targetReps.setAttribute('aria-label', 'Hold duration in seconds');
  reverse.hidden = true;
  speed.hidden = true;
}

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
if (exercise.id === 'standing-inner-thigh-stretch') platform.scale.x = 1.45;
platform.receiveShadow = true;
scene.add(platform);

const model = createMannequin(exercise.id);
scene.add(model.mesh);
model.ready.then(() => draw()).catch(error => {
  const message = document.createElement('p');
  message.className = 'render-error';
  message.textContent = 'The exercise model could not be loaded. Refresh the page to try again.';
  threeStage.append(message);
  console.error(error);
});

let speedIndex = 1;
let direction = 1;
let phase = pageParameters.has('phase') ? Number(pageParameters.get('phase')) * Math.PI / 180 || 0 : 0;
let distanceSinceRep = 0;
let lastTime = performance.now();
const progress = (exercise.timed ? createTimedHoldProgress : createExerciseProgress)({
  exerciseId: exercise.id, app, count, progressLabel, status, announcement, toggle,
  resetButton: reset, repsSelect: targetReps, setsSelect: targetSets,
  onSideChange: side => model.setSide(side),
  onReset: () => { distanceSinceRep = 0; },
  onRunningChange: () => { lastTime = performance.now(); }
});

function draw() {
  model.pose(phase);
  renderer.render(scene, camera);
}

function resizeRenderer() {
  const rect = stage.getBoundingClientRect();
  renderer.setSize(Math.max(1, rect.width), Math.max(1, rect.height));
  camera.aspect = Math.max(0.1, rect.width / Math.max(1, rect.height));
  camera.updateProjectionMatrix();
  const baseDistance = exercise.id === 'trunk-side-bend' ? 4.75 : 4.25;
  cameraDistance = camera.aspect < 0.85 ? baseDistance + 1.05 : baseDistance;
  positionCamera();
  draw();
}

reverse.addEventListener('click', () => {
  direction *= -1;
  distanceSinceRep = 0;
  const forward = direction === 1;
  app.classList.toggle('reverse-mode', !forward);
  directionLabel.textContent = forward ? exercise.direction : exercise.reverseDirection;
  announcement.textContent = `${directionLabel.textContent} selected`;
});
speed.addEventListener('click', () => {
  speedIndex = (speedIndex + 1) % speeds.length;
  speed.textContent = `Speed: ${speeds[speedIndex]}×`;
  announcement.textContent = `Speed ${speeds[speedIndex]} times`;
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
  state: () => ({ ...progress.state(), direction, speed: speeds[speedIndex], phase, distanceSinceRep }),
  setPhase: degrees => { phase = Number(degrees) * Math.PI / 180 || 0; draw(); },
  verifyMotion
};

if (pageParameters.has('markers')) {
  const markers = document.createElement('output');
  markers.id = 'pose-markers';
  markers.hidden = true;
  document.body.append(markers);
  model.ready.then(() => { model.pose(phase); markers.textContent = JSON.stringify(model.inspectPose()); });
}

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
  if (progress.running && exercise.timed) {
    progress.tick(delta);
  } else if (progress.running) {
    const radiansPerSecond = Math.PI * 2 / (exercise.secondsPerRep / speeds[speedIndex]);
    const travel = radiansPerSecond * delta;
    phase += travel * direction;
    distanceSinceRep += travel;
    while (distanceSinceRep >= Math.PI * 2) {
      distanceSinceRep -= Math.PI * 2;
      progress.recordRep();
    }
  }
  draw();
  requestAnimationFrame(renderTime);
}

requestAnimationFrame(renderTime);
