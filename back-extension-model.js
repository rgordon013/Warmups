import * as THREE from './vendor/three.module.js';
import { GLTFLoader } from './vendor/GLTFLoader.js';
import { installFreeAssets } from './free-assets.js';

const SIDES = Object.freeze([
  { suffix: 'L', sign: 1 },
  { suffix: 'R', sign: -1 }
]);

function recolorAndPrepare(object) {
  if (!object.isMesh) return;
  if (/^(?:field-cap|stitched-cap|fitted-standing-collar|reinforced-button-placket|left-map-pocket|right-instrument-pocket|bronze-shirt-button|placket-fold-seam|pocket-stitched-edge|field-boot|layered-sole|boot-lacing|boot-tongue|boot-eyelet|boot-tread)/i.test(object.name)) {
    object.visible = false;
  }
  const materials = Array.isArray(object.material) ? object.material : [object.material];
  object.material = materials.map(source => {
    const material = source.clone();
    if (material.name === 'scout-skin') material.color.set('#f4cdb8');
    if (material.name === 'scout-cloth') material.color.set('#1768d5');
    if (material.name === 'scout-pants') material.color.set('#202b4d');
    if (material.name === 'scout-trim') material.color.set('#1768d5');
    if (material.name === 'scout-leather') material.color.set('#e4e9ed');
    if (material.name === 'scout-sole') material.color.set('#aeb9c1');
    material.roughness = Math.max(material.roughness ?? 0.7, 0.62);
    material.metalness = Math.min(material.metalness ?? 0, 0.08);
    material.side = THREE.DoubleSide;
    return material;
  });
  if (materials.length === 1) object.material = object.material[0];
  object.castShadow = true;
  object.receiveShadow = true;
  object.frustumCulled = false;
}

function applyVertexPalette(skinnedMesh, colorForVertex) {
  if (!skinnedMesh?.isSkinnedMesh) return;
  skinnedMesh.geometry = skinnedMesh.geometry.clone();
  skinnedMesh.updateMatrixWorld(true);
  skinnedMesh.skeleton.update();
  const position = skinnedMesh.geometry.attributes.position;
  const colors = new Float32Array(position.count * 3);
  const vertex = new THREE.Vector3();
  for (let index = 0; index < position.count; index++) {
    skinnedMesh.getVertexPosition(index, vertex);
    const color = colorForVertex(vertex);
    colors[index * 3] = color.r;
    colors[index * 3 + 1] = color.g;
    colors[index * 3 + 2] = color.b;
  }
  skinnedMesh.geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
  const materials = Array.isArray(skinnedMesh.material) ? skinnedMesh.material : [skinnedMesh.material];
  skinnedMesh.material = materials.map(source => {
    const material = source.clone();
    material.map = null;
    material.color.set('#ffffff');
    material.vertexColors = true;
    material.needsUpdate = true;
    return material;
  });
  if (materials.length === 1) skinnedMesh.material = skinnedMesh.material[0];
}

function convertOvershirtToAthleticTee(overshirt) {
  if (!overshirt?.isSkinnedMesh) return;
  overshirt.geometry = overshirt.geometry.clone();
  overshirt.updateMatrixWorld(true);
  overshirt.skeleton.update();
  const positions = overshirt.geometry.attributes.position;
  const sleeveMask = new Float32Array(positions.count);
  const vertex = new THREE.Vector3();
  for (let index = 0; index < positions.count; index++) {
    overshirt.getVertexPosition(index, vertex);
    sleeveMask[index] = Math.min(Math.abs(vertex.x) - 0.39, 1.43 - vertex.y);
  }
  overshirt.geometry.setAttribute('athleticSleeveMask', new THREE.BufferAttribute(sleeveMask, 1));
  const materials = Array.isArray(overshirt.material) ? overshirt.material : [overshirt.material];
  overshirt.material = materials.map(source => {
    const material = source.clone();
    material.map = null;
    material.vertexColors = false;
    material.color.set('#1768d5');
    material.side = THREE.DoubleSide;
    material.polygonOffset = true;
    material.polygonOffsetFactor = -1;
    material.polygonOffsetUnits = -1;
    material.onBeforeCompile = shader => {
      shader.vertexShader = shader.vertexShader
        .replace('#include <common>', '#include <common>\nattribute float athleticSleeveMask;\nvarying float vAthleticSleeveMask;')
        .replace('#include <begin_vertex>', '#include <begin_vertex>\nvAthleticSleeveMask = athleticSleeveMask;');
      shader.fragmentShader = shader.fragmentShader
        .replace('#include <common>', '#include <common>\nvarying float vAthleticSleeveMask;')
        .replace('#include <color_fragment>', `#include <color_fragment>
          if (vAthleticSleeveMask > 0.0)
            diffuseColor.rgb = vec3(0.9047, 0.6105, 0.4793);`);
    };
    material.customProgramCacheKey = () => 'clean-athletic-short-sleeves-v4';
    material.needsUpdate = true;
    return material;
  });
  if (materials.length === 1) overshirt.material = overshirt.material[0];
}

function addAthleticHair(headBone) {
  const hairMaterial = new THREE.MeshStandardMaterial({
    color: '#6b402c',
    roughness: 0.94,
    metalness: 0
  });
  const hair = new THREE.Mesh(
    new THREE.SphereGeometry(0.108, 32, 18, 0, Math.PI * 2, 0, Math.PI * 0.56),
    hairMaterial
  );
  hair.name = 'short athletic hair';
  hair.position.set(0, 0.104, -0.006);
  hair.scale.set(0.98, 0.68, 0.90);
  hair.castShadow = true;
  hair.receiveShadow = true;
  headBone.add(hair);
}

function convertTrousersToAthleticShorts(trousers) {
  if (!trousers?.isSkinnedMesh) return;
  const materials = Array.isArray(trousers.material) ? trousers.material : [trousers.material];
  trousers.material = materials.map(source => {
    const material = source.clone();
    material.map = null;
    material.vertexColors = false;
    material.color.set('#ffffff');
    material.onBeforeCompile = shader => {
      shader.vertexShader = shader.vertexShader
        .replace('#include <common>', '#include <common>\nvarying float vAthleticY;')
        .replace('#include <skinning_vertex>', '#include <skinning_vertex>\nvAthleticY = transformed.y;');
      shader.fragmentShader = shader.fragmentShader
        .replace('#include <common>', '#include <common>\nvarying float vAthleticY;')
        .replace('#include <color_fragment>', `#include <color_fragment>
          diffuseColor.rgb = vAthleticY >= 0.77
            ? vec3(0.0144, 0.0242, 0.0742)
            : vec3(0.9047, 0.6105, 0.4793);`);
    };
    material.customProgramCacheKey = () => 'athletic-shorts-v2';
    material.needsUpdate = true;
    return material;
  });
  if (materials.length === 1) trousers.material = trousers.material[0];
}

function makeSneakerUpper(material) {
  const stations = [
    { z: -0.12, width: 0.068, height: 0.112 },
    { z: -0.075, width: 0.076, height: 0.135 },
    { z: 0.005, width: 0.074, height: 0.122 },
    { z: 0.09, width: 0.082, height: 0.082 },
    { z: 0.155, width: 0.087, height: 0.055 }
  ];
  const arcSegments = 14;
  const baseY = 0;
  const vertices = [];
  const indices = [];

  for (const station of stations) {
    for (let segment = 0; segment <= arcSegments; segment++) {
      const angle = segment / arcSegments * Math.PI;
      vertices.push(
        Math.cos(angle) * station.width,
        baseY + Math.sin(angle) * station.height,
        station.z
      );
    }
  }
  const ring = arcSegments + 1;
  for (let station = 0; station < stations.length - 1; station++) {
    for (let segment = 0; segment < arcSegments; segment++) {
      const a = station * ring + segment;
      const b = a + ring;
      indices.push(a, b, a + 1, b, b + 1, a + 1);
    }
    const rightA = station * ring;
    const rightB = rightA + ring;
    const leftA = rightA + arcSegments;
    const leftB = rightB + arcSegments;
    indices.push(rightA, leftA, rightB, rightB, leftA, leftB);
  }
  for (const station of [0, stations.length - 1]) {
    const center = vertices.length / 3;
    vertices.push(0, baseY + stations[station].height * 0.34, stations[station].z);
    for (let segment = 0; segment < arcSegments; segment++) {
      const a = station * ring + segment;
      const b = a + 1;
      if (station === 0) indices.push(center, b, a);
      else indices.push(center, a, b);
    }
  }

  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3));
  geometry.setIndex(indices);
  geometry.computeVertexNormals();
  const upper = new THREE.Mesh(geometry, material);
  upper.castShadow = true;
  upper.receiveShadow = true;
  return upper;
}

function addAthleticSneakers(character, byName) {
  const skinMaterial = new THREE.MeshStandardMaterial({ color: '#f4cdb8', roughness: 0.78, metalness: 0 });
  const upperMaterial = new THREE.MeshStandardMaterial({ color: '#f7f8f9', roughness: 0.72, metalness: 0 });
  const soleMaterial = new THREE.MeshStandardMaterial({ color: '#c8cdd2', roughness: 0.86, metalness: 0 });
  const laceMaterial = new THREE.MeshStandardMaterial({ color: '#ffffff', roughness: 0.75, metalness: 0 });
  const collarMaterial = new THREE.MeshStandardMaterial({ color: '#aeb7c0', roughness: 0.95, metalness: 0 });
  for (const suffix of ['L', 'R']) {
    const foot = byName.get(`scoutfoot${suffix}`);
    if (!foot) continue;
    character.updateMatrixWorld(true);
    const footPosition = character.worldToLocal(foot.getWorldPosition(new THREE.Vector3()));

    const ankle = new THREE.Mesh(new THREE.CylinderGeometry(0.049, 0.045, 0.16, 32), skinMaterial);
    ankle.name = `visible ankle ${suffix}`;
    ankle.position.set(footPosition.x, 0.17, footPosition.z - 0.055);
    ankle.scale.y = 1.2;
    ankle.castShadow = true;
    ankle.receiveShadow = true;
    character.add(ankle);

    const soleGeometry = new THREE.CapsuleGeometry(0.086, 0.135, 8, 20);
    soleGeometry.rotateX(Math.PI / 2);
    soleGeometry.scale(1, 0.29, 1);
    const sole = new THREE.Mesh(soleGeometry, soleMaterial);
    sole.name = `cushioned trainer sole ${suffix}`;
    sole.position.set(footPosition.x, 0.041, footPosition.z + 0.018);
    sole.castShadow = true;
    sole.receiveShadow = true;
    character.add(sole);

    const upper = makeSneakerUpper(upperMaterial);
    upper.name = `white trainer upper ${suffix}`;
    upper.position.set(footPosition.x, 0.066, footPosition.z + 0.02);
    character.add(upper);

    const collar = new THREE.Mesh(new THREE.CylinderGeometry(0.043, 0.047, 0.008, 28), collarMaterial);
    collar.name = `trainer collar ${suffix}`;
    collar.position.set(footPosition.x, 0.183, footPosition.z - 0.055);
    collar.scale.z = 1.28;
    collar.castShadow = true;
    character.add(collar);

    const tongue = new THREE.Mesh(new THREE.BoxGeometry(0.083, 0.012, 0.105), upperMaterial);
    tongue.name = `trainer tongue ${suffix}`;
    tongue.position.set(footPosition.x, 0.174, footPosition.z + 0.005);
    tongue.rotation.x = -0.18;
    tongue.castShadow = true;
    character.add(tongue);

    for (let row = 0; row < 4; row++) {
      const lace = new THREE.Mesh(new THREE.CapsuleGeometry(0.004, 0.074 - row * 0.004, 4, 8), laceMaterial);
      lace.name = `trainer lace ${suffix} ${row + 1}`;
      lace.rotation.z = Math.PI / 2;
      lace.position.set(footPosition.x, 0.186 - row * 0.011, footPosition.z - 0.02 + row * 0.026);
      lace.rotation.x = -0.16;
      lace.castShadow = true;
      character.add(lace);
    }
  }
}

function armChain(byName, suffix) {
  return [
    `scoutshoulder01${suffix}`,
    `scoutupperarm01${suffix}`,
    `scoutupperarm02${suffix}`,
    `scoutlowerarm01${suffix}`,
    `scoutlowerarm02${suffix}`,
    `scoutwrist${suffix}`
  ].map(name => byName.get(name));
}

function legChain(byName, suffix) {
  return [
    `scoutpelvis${suffix}`,
    `scoutupperleg01${suffix}`,
    `scoutupperleg02${suffix}`,
    `scoutlowerleg01${suffix}`,
    `scoutlowerleg02${suffix}`,
    `scoutfoot${suffix}`
  ].map(name => byName.get(name));
}

function countShoulderBlendVertices(skinnedMeshes, suffix) {
  const armPattern = new RegExp(`(?:shoulder|upperarm|lowerarm).*${suffix}$`, 'i');
  const torsoPattern = /(?:clavicle|spine|neck)/i;
  let count = 0;
  for (const mesh of skinnedMeshes) {
    if (!/connected-anatomy/i.test(mesh.name)) continue;
    const indices = mesh.geometry.attributes.skinIndex;
    const weights = mesh.geometry.attributes.skinWeight;
    if (!indices || !weights) continue;
    for (let vertex = 0; vertex < indices.count; vertex++) {
      let armWeight = 0;
      let torsoWeight = 0;
      for (let channel = 0; channel < 4; channel++) {
        const joint = indices.getComponent(vertex, channel);
        const weight = weights.getComponent(vertex, channel);
        const name = mesh.skeleton.bones[joint]?.name || '';
        if (armPattern.test(name)) armWeight += weight;
        if (torsoPattern.test(name)) torsoWeight += weight;
      }
      if (armWeight > 0.02 && torsoWeight > 0.02) count++;
    }
  }
  return count;
}

export function createMannequin(exerciseId = 'back-extension') {
  const mesh = new THREE.Group();
  mesh.name = 'realistic exercise model';
  let rig = null;
  let lastPhase = 0;
  let activeSide = 0;
  let loadError = null;

  const ready = new Promise((resolve, reject) => {
    new GLTFLoader().load('./assets/exercise-model.glb', async gltf => {
      try {
      const character = gltf.scene;
      character.name = 'exercise athlete';
      const byName = new Map();
      const skinnedMeshes = [];
      const bones = [];
      character.traverse(object => {
        byName.set(object.name, object);
        recolorAndPrepare(object);
        if (object.isSkinnedMesh) skinnedMeshes.push(object);
        if (object.isBone) bones.push(object);
      });

      const chains = SIDES.map(side => armChain(byName, side.suffix));
      const legChains = SIDES.map(side => legChain(byName, side.suffix));
      const root = byName.get('scoutroot');
      const lowerSpine = byName.get('scoutspine05');
      const midSpine = byName.get('scoutspine04');
      const spine = byName.get('scoutspine03');
      const neck = byName.get('scoutneck01');
      const head = byName.get('scouthead');
      const required = [...chains.flat(), ...legChains.flat(), root, lowerSpine, midSpine, spine, neck, head];
      if (required.some(item => !item)) throw new Error('The exercise model is missing required shoulder or torso joints.');
      convertOvershirtToAthleticTee(byName.get('overshirt'));
      convertTrousersToAthleticShorts(byName.get('trousers'));
      await installFreeAssets(character, byName);

      const rest = new Map(bones.map(bone => [bone, bone.quaternion.clone()]));
      character.updateMatrixWorld(true);
      const spineRestWorldQuaternion = spine.getWorldQuaternion(new THREE.Quaternion());
      const motionChains = [...chains, ...legChains];
      const restSegmentLengths = motionChains.map(chain => chain.slice(0, -1).map((bone, i) =>
        bone.getWorldPosition(new THREE.Vector3()).distanceTo(chain[i + 1].getWorldPosition(new THREE.Vector3()))
      ));
      const restFeet = legChains.map(chain => chain.at(-1).getWorldPosition(new THREE.Vector3()));
      rig = {
        character, byName, skinnedMeshes, bones, chains: motionChains, armChains: chains, legChains,
        root, rootRestPosition: root.position.clone(), lowerSpine, midSpine, spine, neck,
        neckRestPosition: neck.position.clone(), head, rest,
        spineRestWorldQuaternion,
        restSegmentLengths, restFeet,
        shoulderBlendVertices: {
          left: countShoulderBlendVertices(skinnedMeshes, 'L'),
          right: countShoulderBlendVertices(skinnedMeshes, 'R')
        }
      };
      mesh.add(character);
      pose(lastPhase);
      resolve(rig);
      } catch (error) {
        loadError = error;
        reject(error);
      }
    }, undefined, error => {
      loadError = error;
      reject(error);
    });
  });

  const parentWorldQuaternion = new THREE.Quaternion();
  const localTarget = new THREE.Vector3();
  const alignment = new THREE.Quaternion();
  const torsoWorldQuaternion = new THREE.Quaternion();
  const torsoDirectionDelta = new THREE.Quaternion();
  const target = new THREE.Vector3();

  function aimChain(chain, worldTarget) {
    for (let i = 0; i < chain.length - 1; i++) {
      const bone = chain[i];
      const child = chain[i + 1];
      bone.quaternion.copy(rig.rest.get(bone));
      mesh.updateMatrixWorld(true);
      bone.parent.getWorldQuaternion(parentWorldQuaternion).invert();
      localTarget.copy(worldTarget).applyQuaternion(parentWorldQuaternion).normalize();
      alignment.setFromUnitVectors(child.position.clone().normalize(), localTarget);
      bone.quaternion.copy(alignment);
      mesh.updateMatrixWorld(true);
    }
  }

  function aimChainRange(chain, start, end, worldDirection) {
    for (let i = start; i < end; i++) {
      const bone = chain[i];
      const child = chain[i + 1];
      bone.quaternion.copy(rig.rest.get(bone));
      mesh.updateMatrixWorld(true);
      bone.parent.getWorldQuaternion(parentWorldQuaternion).invert();
      localTarget.copy(worldDirection).applyQuaternion(parentWorldQuaternion).normalize();
      alignment.setFromUnitVectors(child.position.clone().normalize(), localTarget);
      bone.quaternion.copy(alignment);
      mesh.updateMatrixWorld(true);
    }
  }

  function pose(phase) {
    lastPhase = phase;
    if (!rig) return;
    rig.bones.forEach(bone => bone.quaternion.copy(rig.rest.get(bone)));
    rig.root.position.copy(rig.rootRestPosition);
    rig.neck.position.copy(rig.neckRestPosition);

    const cycle = THREE.MathUtils.euclideanModulo(phase, Math.PI * 2) / (Math.PI * 2);
    const pulse = (1 - Math.cos(phase)) * 0.5;
    let upperForSide;
    let forearmForSide;

    if (exerciseId === 'active-chest-stretch') {
      const open = 0.30 + 0.70 * pulse;
      rig.spine.rotation.set(-0.035 * open, 0, 0);
      upperForSide = side => new THREE.Vector3(side.sign * 0.84, 0.22, -0.26 - 0.12 * open);
      forearmForSide = side => new THREE.Vector3(-side.sign * 0.88, 0.12, -0.12);
    } else if (exerciseId === 'high-knees') {
      const leftLift = Math.max(0, Math.sin(phase));
      const rightLift = Math.max(0, -Math.sin(phase));
      [leftLift, rightLift].forEach((lift, index) => {
        const leg = rig.legChains[index];
        leg[1].rotateX(-1.20 * lift);
        leg[3].rotateX(1.45 * lift);
      });
      upperForSide = side => new THREE.Vector3(side.sign * 0.38, -0.91, 0.12);
      forearmForSide = side => new THREE.Vector3(side.sign * 0.30, -0.94, 0.14);
    } else if (exerciseId === 'heel-raises') {
      const rise = pulse * pulse * (3 - 2 * pulse);
      rig.root.position.y = rig.rootRestPosition.y + 0.065 * rise;
      rig.legChains.forEach(leg => leg.at(-1).rotateX(0.68 * rise));
      upperForSide = side => new THREE.Vector3(side.sign * 0.30, -0.88, 0.36);
      forearmForSide = side => new THREE.Vector3(side.sign * 0.20, -0.91, 0.40);
    } else if (exerciseId === 'standing-trunk-rotation') {
      const turn = Math.sin(phase) * 0.65;
      rig.lowerSpine.rotation.set(0, turn * 0.28, 0);
      rig.midSpine.rotation.set(0, turn * 0.34, 0);
      rig.spine.rotation.set(0, turn * 0.38, 0);
      rig.neck.rotation.set(0, -turn * 0.05, 0);
      upperForSide = side => new THREE.Vector3(side.sign * 0.70, -0.71, -0.08);
      forearmForSide = side => new THREE.Vector3(-side.sign * 0.16, -0.80, 0.48);
    } else if (exerciseId === 'neck-retraction') {
      rig.neck.position.z -= 0.050 * pulse;
      rig.neck.rotation.x = 0.025 * pulse;
      upperForSide = side => new THREE.Vector3(side.sign * 0.38, -0.91, 0.10);
      forearmForSide = side => new THREE.Vector3(side.sign * 0.28, -0.95, 0.10);
    } else if (exerciseId === 'chin-to-chest-neck-stretch') {
      rig.neck.rotation.set(0.38, (activeSide === 0 ? 1 : -1) * 0.18, 0);
      rig.head.rotation.x = 0.12;
      upperForSide = side => new THREE.Vector3(side.sign * 0.38, -0.91, 0.10);
      forearmForSide = side => new THREE.Vector3(side.sign * 0.28, -0.95, 0.10);
    } else if (exerciseId === 'wrist-extensor-stretch' || exerciseId === 'wrist-flexor-stretch') {
      upperForSide = side => side === SIDES[activeSide]
        ? new THREE.Vector3(side.sign * 0.10, -0.17, 0.98)
        : new THREE.Vector3(-side.sign * 0.58, -0.39, 0.71);
      forearmForSide = side => side === SIDES[activeSide]
        ? new THREE.Vector3(-side.sign * 0.05, 0.03, 1)
        : new THREE.Vector3(-side.sign * 0.20, 0.30, 0.93);
    } else if (exerciseId === 'trunk-side-bend') {
      const bend = SIDES[activeSide].sign;
      rig.lowerSpine.rotation.z = -bend * 0.10;
      rig.midSpine.rotation.z = -bend * 0.12;
      rig.spine.rotation.z = -bend * 0.12;
      rig.neck.rotation.z = bend * 0.04;
      upperForSide = side => side === SIDES[activeSide]
        ? new THREE.Vector3(side.sign * 0.20, -0.98, 0.08)
        : new THREE.Vector3(side.sign * 0.30, 0.95, 0.05);
      forearmForSide = side => side === SIDES[activeSide]
        ? new THREE.Vector3(side.sign * 0.16, -0.98, 0.08)
        : new THREE.Vector3(-side.sign * 0.60, 0.80, 0.03);
    } else if (exerciseId === 'standing-quad-stretch') {
      rig.legChains[activeSide][3].rotateX(2.22);
      upperForSide = side => side === SIDES[activeSide]
        ? new THREE.Vector3(side.sign * 0.30, -0.93, -0.22)
        : new THREE.Vector3(side.sign * 0.48, -0.78, 0.30);
      forearmForSide = side => side === SIDES[activeSide]
        ? new THREE.Vector3(side.sign * 0.08, -0.83, -0.56)
        : new THREE.Vector3(side.sign * 0.50, -0.78, 0.20);
    } else if (exerciseId === 'standing-inner-thigh-stretch') {
      const bend = SIDES[activeSide].sign;
      rig.root.position.x += bend * 0.08;
      rig.root.position.y -= 0.11;
      rig.legChains.forEach((leg, index) => leg[1].rotateZ(SIDES[index].sign * 0.42));
      rig.legChains[activeSide][1].rotateX(-0.28);
      rig.legChains[activeSide][3].rotateX(0.52);
      rig.legChains[activeSide][3].rotateZ(-bend * 0.42);
      rig.lowerSpine.rotation.z = -bend * 0.04;
      rig.midSpine.rotation.z = -bend * 0.04;
      upperForSide = side => new THREE.Vector3(side.sign * 0.56, -0.82, 0.10);
      forearmForSide = side => new THREE.Vector3(side.sign * 0.15, -0.80, 0.60);
    } else if (exerciseId === 'hamstring-stretch') {
      rig.legChains[activeSide][1].rotateX(-0.31);
      rig.legChains[1 - activeSide][1].rotateX(-0.10);
      rig.legChains[1 - activeSide][3].rotateX(0.22);
      rig.lowerSpine.rotation.x = 0.27;
      rig.midSpine.rotation.x = 0.13;
      rig.spine.rotation.x = 0.05;
      upperForSide = side => new THREE.Vector3(side.sign * 0.27, -0.93, 0.25);
      forearmForSide = side => new THREE.Vector3(side.sign * 0.17, -0.92, 0.35);
    } else {
      const blend = cycle < 0.35
        ? THREE.MathUtils.smoothstep(cycle / 0.35, 0, 1)
        : cycle <= 0.65
          ? 1
          : 1 - THREE.MathUtils.smoothstep((cycle - 0.65) / 0.35, 0, 1);
      rig.lowerSpine.rotation.set(-0.11 * blend, 0, 0);
      rig.midSpine.rotation.set(-0.07 * blend, 0, 0);
      rig.spine.rotation.set(-0.04 * blend, 0, 0);
      rig.neck.rotation.set(0.04 * blend, 0, 0);
      upperForSide = side => new THREE.Vector3(side.sign * 0.70, -0.71, -0.08);
      forearmForSide = side => new THREE.Vector3(-side.sign * 0.42, -0.80, 0.42);
    }
    mesh.updateMatrixWorld(true);
    rig.spine.getWorldQuaternion(torsoWorldQuaternion);
    torsoDirectionDelta.copy(torsoWorldQuaternion)
      .multiply(rig.spineRestWorldQuaternion.clone().invert());

    SIDES.forEach((side, index) => {
      const chain = rig.armChains[index];
      const upperDirection = upperForSide(side).normalize().applyQuaternion(torsoDirectionDelta);
      const forearmDirection = forearmForSide(side).normalize().applyQuaternion(torsoDirectionDelta);
      aimChainRange(chain, 0, 3, upperDirection);
      aimChainRange(chain, 3, chain.length - 1, forearmDirection);
    });
    if (exerciseId === 'wrist-extensor-stretch' || exerciseId === 'wrist-flexor-stretch') {
      const activeWrist = rig.armChains[activeSide].at(-1);
      activeWrist.rotateX(0.62);
      if (exerciseId === 'wrist-flexor-stretch') activeWrist.rotateY(Math.PI);
    }

    mesh.updateMatrixWorld(true);
    rig.skinnedMeshes.forEach(skinned => skinned.skeleton.update());
  }

  function inspectRig() {
    if (!rig) return { ready: false, loadError: loadError ? String(loadError) : null, pass: false };
    const worldA = new THREE.Vector3();
    const worldB = new THREE.Vector3();
    let nonFiniteBoneValues = 0;
    let maxSegmentLengthError = 0;
    let maxLoopError = 0;
    let minWristTorsoClearance = Infinity;
    let minDistalArmTorsoClearance = Infinity;
    let maxRootRise = 0;
    let maxSpineTurn = 0;
    let maxSpineSideBend = 0;
    let maxSpineFlexion = 0;
    let maxFootSpread = 0;
    let maxFootGroundError = 0;
    const quadHandFootDistance = [Infinity, Infinity];
    const frontFootAdvance = [0, 0];
    const footBaseline = rig.restFeet.map(point => point.y);
    const maxFootRise = [0, 0];
    const footwearAttached = rig.legChains.every(chain => chain.at(-1).children
      .some(child => child.name.startsWith('CC0 white athletic sneaker and sock')));
    const originalSide = activeSide;
    const sideVariants = /^(?:chin-to-chest-neck-stretch|wrist-extensor-stretch|wrist-flexor-stretch|trunk-side-bend|standing-quad-stretch|standing-inner-thigh-stretch|hamstring-stretch)$/.test(exerciseId)
      ? [0, 1] : [activeSide];
    for (const variant of sideVariants) {
      activeSide = variant;
      pose(0);
      const loopStart = rig.bones.map(bone => bone.quaternion.clone());
      for (let frame = 0; frame <= 72; frame++) {
      pose(frame / 72 * Math.PI * 2);
      rig.bones.forEach(bone => {
        for (const value of bone.matrixWorld.elements) if (!Number.isFinite(value)) nonFiniteBoneValues++;
      });
      maxRootRise = Math.max(maxRootRise, rig.root.position.y - rig.rootRestPosition.y);
      maxSpineTurn = Math.max(maxSpineTurn,
        Math.abs(rig.lowerSpine.rotation.y) + Math.abs(rig.midSpine.rotation.y) + Math.abs(rig.spine.rotation.y));
      maxSpineSideBend = Math.max(maxSpineSideBend,
        Math.abs(rig.lowerSpine.rotation.z) + Math.abs(rig.midSpine.rotation.z) + Math.abs(rig.spine.rotation.z));
      maxSpineFlexion = Math.max(maxSpineFlexion,
        rig.lowerSpine.rotation.x + rig.midSpine.rotation.x + rig.spine.rotation.x);
      rig.legChains.forEach((chain, index) => {
        chain.at(-1).getWorldPosition(worldB);
        maxFootRise[index] = Math.max(maxFootRise[index], worldB.y - footBaseline[index]);
        if (exerciseId === 'standing-inner-thigh-stretch')
          maxFootGroundError = Math.max(maxFootGroundError, Math.abs(worldB.y - footBaseline[index]));
      });
      if (exerciseId === 'standing-inner-thigh-stretch') {
        const feet = rig.legChains.map(chain => chain.at(-1).getWorldPosition(new THREE.Vector3()));
        maxFootSpread = Math.max(maxFootSpread, Math.abs(feet[0].x - feet[1].x));
      }
      if (exerciseId === 'standing-quad-stretch') {
        rig.armChains[variant].at(-1).getWorldPosition(worldA);
        rig.legChains[variant].at(-1).getWorldPosition(worldB);
        quadHandFootDistance[variant] = Math.min(quadHandFootDistance[variant], worldA.distanceTo(worldB));
      }
      if (exerciseId === 'hamstring-stretch') {
        rig.legChains[variant].at(-1).getWorldPosition(worldB);
        frontFootAdvance[variant] = Math.max(frontFootAdvance[variant], worldB.z - rig.restFeet[variant].z);
      }
      rig.chains.forEach((chain, chainIndex) => {
        chain.slice(0, -1).forEach((bone, segmentIndex) => {
          bone.getWorldPosition(worldA);
          chain[segmentIndex + 1].getWorldPosition(worldB);
          maxSegmentLengthError = Math.max(maxSegmentLengthError,
            Math.abs(worldA.distanceTo(worldB) - rig.restSegmentLengths[chainIndex][segmentIndex]));
        });
      });
      rig.midSpine.getWorldPosition(worldA);
      const torsoClearance = point => Math.hypot(point.x - worldA.x, point.z - worldA.z,
        Math.max(0, 0.85 - point.y, point.y - 1.53));
      rig.armChains.forEach(chain => {
        chain.at(-1).getWorldPosition(worldB);
        minWristTorsoClearance = Math.min(minWristTorsoClearance,
          torsoClearance(worldB));
        chain.slice(3).forEach(bone => {
          bone.getWorldPosition(worldB);
          minDistalArmTorsoClearance = Math.min(minDistalArmTorsoClearance,
            torsoClearance(worldB));
        });
      });
      }
      rig.bones.forEach((bone, index) => {
        maxLoopError = Math.max(maxLoopError, 1 - Math.abs(bone.quaternion.dot(loopStart[index])));
      });
    }
    activeSide = originalSide;
    pose(lastPhase);

    const vertices = rig.skinnedMeshes.reduce((sum, item) => sum + item.geometry.attributes.position.count, 0);
    const triangles = rig.skinnedMeshes.reduce((sum, item) => sum +
      (item.geometry.index ? item.geometry.index.count / 3 : item.geometry.attributes.position.count / 3), 0);
    const { left, right } = rig.shoulderBlendVertices;
    const exerciseMotionPass = exerciseId === 'high-knees'
      ? maxFootRise.every(value => value > 0.16)
      : exerciseId === 'heel-raises'
        ? maxRootRise > 0.05
        : exerciseId === 'standing-trunk-rotation'
          ? maxSpineTurn > 0.50
          : exerciseId === 'trunk-side-bend'
            ? maxSpineSideBend > 0.30
            : exerciseId === 'standing-quad-stretch'
              ? maxFootRise.every(value => value > 0.55) && quadHandFootDistance.every(value => value < 0.24)
              : exerciseId === 'standing-inner-thigh-stretch'
                ? maxFootSpread > 0.85 && maxFootGroundError < 0.07
                : exerciseId === 'hamstring-stretch'
                  ? maxSpineFlexion > 0.40 && frontFootAdvance.every(value => value > 0.20)
          : true;
    return {
      ready: true,
      model: 'rigged realistic exercise athlete',
      skinnedMeshes: rig.skinnedMeshes.length,
      bones: rig.bones.length,
      vertices,
      triangles,
      shoulderBlendVertices: { left, right },
      sampledPoses: 73 * sideVariants.length,
      footwearAttached,
      nonFiniteBoneValues,
      maxSegmentLengthError,
      maxLoopError,
      minWristTorsoClearance,
      wristTorsoClearancePass: minWristTorsoClearance > 0.10,
      minDistalArmTorsoClearance,
      distalArmTorsoClearancePass: minDistalArmTorsoClearance > 0.10,
      exerciseId,
      exerciseMotion: { maxRootRise, maxSpineTurn, maxSpineSideBend, maxSpineFlexion,
        maxFootRise, maxFootSpread, maxFootGroundError, quadHandFootDistance, frontFootAdvance },
      exerciseMotionPass,
      pass: left > 0 && right > 0 && footwearAttached && nonFiniteBoneValues === 0 &&
        maxSegmentLengthError < 1e-5 && maxLoopError < 1e-8 &&
        minWristTorsoClearance > 0.10 && minDistalArmTorsoClearance > 0.10 && exerciseMotionPass
    };
  }

  function inspectPose() {
    if (!rig) return null;
    mesh.updateMatrixWorld(true);
    const point = bone => bone.getWorldPosition(new THREE.Vector3()).toArray().map(value => Number(value.toFixed(3)));
    return {
      head: point(rig.byName.get('scouthead')),
      torso: point(rig.midSpine),
      arms: rig.armChains.map(chain => ({ shoulder: point(chain[0]), elbow: point(chain[3]), wrist: point(chain.at(-1)) })),
      legs: rig.legChains.map(chain => ({ hip: point(chain[1]), knee: point(chain[3]), ankle: point(chain.at(-1)) }))
    };
  }

  function setSide(index) {
    activeSide = index === 1 ? 1 : 0;
    pose(lastPhase);
  }

  return { mesh, pose, setSide, ready, inspectRig, inspectPose };
}
