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
  trousers.geometry = trousers.geometry.clone();
  trousers.updateMatrixWorld(true);
  trousers.skeleton.update();
  const positions = trousers.geometry.attributes.position;
  const shortsMask = new Float32Array(positions.count);
  const vertex = new THREE.Vector3();
  for (let index = 0; index < positions.count; index++) {
    trousers.getVertexPosition(index, vertex);
    shortsMask[index] = vertex.y - 0.77;
  }
  trousers.geometry.setAttribute('athleticShortsMask', new THREE.BufferAttribute(shortsMask, 1));
  const materials = Array.isArray(trousers.material) ? trousers.material : [trousers.material];
  trousers.material = materials.map(source => {
    const material = source.clone();
    material.map = null;
    material.vertexColors = false;
    material.color.set('#ffffff');
    material.onBeforeCompile = shader => {
      shader.vertexShader = shader.vertexShader
        .replace('#include <common>', '#include <common>\nattribute float athleticShortsMask;\nvarying float vAthleticShortsMask;')
        .replace('#include <begin_vertex>', '#include <begin_vertex>\nvAthleticShortsMask = athleticShortsMask;');
      shader.fragmentShader = shader.fragmentShader
        .replace('#include <common>', '#include <common>\nvarying float vAthleticShortsMask;')
        .replace('#include <color_fragment>', `#include <color_fragment>
          diffuseColor.rgb = vAthleticShortsMask >= 0.0
            ? vec3(0.0144, 0.0242, 0.0742)
            : vec3(0.9047, 0.6105, 0.4793);`);
    };
    material.customProgramCacheKey = () => 'athletic-shorts-rest-mask-v1';
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

export function createMannequin() {
  const mesh = new THREE.Group();
  mesh.name = 'realistic exercise model';
  let rig = null;
  let lastPhase = 0;
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
      const spine = byName.get('scoutspine03');
      const neck = byName.get('scoutneck01');
      const head = byName.get('scouthead');
      const required = [...chains.flat(), ...legChains.flat(), root, spine, neck, head];
      if (required.some(item => !item)) throw new Error('The exercise model is missing required shoulder or torso joints.');
      convertOvershirtToAthleticTee(byName.get('overshirt'));
      convertTrousersToAthleticShorts(byName.get('trousers'));
      await installFreeAssets(character, byName);

      const rest = new Map(bones.map(bone => [bone, bone.quaternion.clone()]));
      character.updateMatrixWorld(true);
      const motionChains = [...chains, ...legChains];
      const restSegmentLengths = motionChains.map(chain => chain.slice(0, -1).map((bone, i) =>
        bone.getWorldPosition(new THREE.Vector3()).distanceTo(chain[i + 1].getWorldPosition(new THREE.Vector3()))
      ));
      rig = {
        character, byName, skinnedMeshes, bones, chains: motionChains,
        armChains: chains, legChains, root, rootRestPosition: root.position.clone(), spine, neck, rest,
        restSegmentLengths,
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

    // One full phase lowers into a comfortable squat and returns to standing.
    const travel = (1 - Math.cos(phase)) * 0.5;
    const blend = travel * travel * (3 - 2 * travel);
      rig.root.position.set(
        rig.rootRestPosition.x,
        rig.rootRestPosition.y - 0.14 * blend,
        rig.rootRestPosition.z - 0.12 * blend
    );
    rig.spine.rotation.set(
      0.16 * blend,
      0,
      0
    );
    rig.neck.rotation.set(
      -rig.spine.rotation.x * 0.35,
      0,
      0
    );
    mesh.updateMatrixWorld(true);

    SIDES.forEach((side, index) => {
      target.set(
        side.sign * THREE.MathUtils.lerp(0.42, 0.18, blend),
        THREE.MathUtils.lerp(-0.90, 0.05, blend),
        THREE.MathUtils.lerp(0.10, 0.98, blend)
      ).normalize();
      aimChain(rig.armChains[index], target);

      const leg = rig.legChains[index];
      leg[1].rotateX(-0.36 * blend);
      leg[2].rotateX(-0.36 * blend);
      leg[3].rotateX(0.54 * blend);
      leg[4].rotateX(0.54 * blend);
      mesh.updateMatrixWorld(true);
      leg[5].parent.getWorldQuaternion(parentWorldQuaternion).invert();
      leg[5].quaternion.copy(parentWorldQuaternion);
    });

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

    pose(0);
    const loopStart = rig.bones.map(bone => bone.quaternion.clone());
    for (let frame = 0; frame <= 72; frame++) {
      pose(frame / 72 * Math.PI * 2);
      rig.bones.forEach(bone => {
        for (const value of bone.matrixWorld.elements) if (!Number.isFinite(value)) nonFiniteBoneValues++;
      });
      rig.chains.forEach((chain, chainIndex) => {
        chain.slice(0, -1).forEach((bone, segmentIndex) => {
          bone.getWorldPosition(worldA);
          chain[segmentIndex + 1].getWorldPosition(worldB);
          maxSegmentLengthError = Math.max(maxSegmentLengthError,
            Math.abs(worldA.distanceTo(worldB) - rig.restSegmentLengths[chainIndex][segmentIndex]));
        });
      });
      rig.spine.getWorldPosition(worldA);
      rig.armChains.forEach(chain => {
        chain.at(-1).getWorldPosition(worldB);
        minWristTorsoClearance = Math.min(minWristTorsoClearance, Math.abs(worldB.x - worldA.x));
        chain.slice(3).forEach(bone => {
          bone.getWorldPosition(worldB);
          minDistalArmTorsoClearance = Math.min(minDistalArmTorsoClearance, Math.abs(worldB.x - worldA.x));
        });
      });
    }
    rig.bones.forEach((bone, index) => {
      maxLoopError = Math.max(maxLoopError, 1 - Math.abs(bone.quaternion.dot(loopStart[index])));
    });
    pose(lastPhase);

    const vertices = rig.skinnedMeshes.reduce((sum, item) => sum + item.geometry.attributes.position.count, 0);
    const triangles = rig.skinnedMeshes.reduce((sum, item) => sum +
      (item.geometry.index ? item.geometry.index.count / 3 : item.geometry.attributes.position.count / 3), 0);
    const { left, right } = rig.shoulderBlendVertices;
    return {
      ready: true,
      model: 'rigged realistic exercise athlete',
      skinnedMeshes: rig.skinnedMeshes.length,
      bones: rig.bones.length,
      vertices,
      triangles,
      shoulderBlendVertices: { left, right },
      sampledPoses: 73,
      nonFiniteBoneValues,
      maxSegmentLengthError,
      maxLoopError,
      minWristTorsoClearance,
      wristTorsoClearancePass: minWristTorsoClearance > 0.10,
      minDistalArmTorsoClearance,
      distalArmTorsoClearancePass: minDistalArmTorsoClearance > 0.10,
      pass: left > 0 && right > 0 && nonFiniteBoneValues === 0 &&
        maxSegmentLengthError < 1e-5 && maxLoopError < 1e-8 &&
        minWristTorsoClearance > 0.10 && minDistalArmTorsoClearance > 0.10
    };
  }

  return { mesh, pose, ready, inspectRig };
}
