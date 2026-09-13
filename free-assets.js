import * as THREE from './vendor/three.module.js';
import { OBJLoader } from './vendor/OBJLoader.js';

// Authored CC0 MakeHuman meshes, fitted without changing the exercise skeleton.
export async function installFreeAssets(character, byName) {
  const obj = new OBJLoader();
  const textures = new THREE.TextureLoader();
  const base = './assets/makehuman/';
  const [hair, shoes, hairMap, shoesMap] = await Promise.all([
    obj.loadAsync(base + 'culturalibre_hair_02/mhair02.obj'),
    obj.loadAsync(base + 'shoes05/shoes05.obj'),
    textures.loadAsync(base + 'culturalibre_hair_02/male02_diffuse_black.png'),
    textures.loadAsync(base + 'shoes05/shoes05_diffuse.png')
  ]);
  hairMap.colorSpace = shoesMap.colorSpace = THREE.SRGBColorSpace;
  hairMap.anisotropy = shoesMap.anisotropy = 4;
  const hairMaterial = new THREE.MeshStandardMaterial({
    map: hairMap, color: '#7a5947', emissive: '#160b07', emissiveIntensity: 0.24,
    roughness: 0.9, side: THREE.DoubleSide, alphaTest: 0.38, metalness: 0
  });
  const shoesMaterial = new THREE.MeshStandardMaterial({
    map: shoesMap, color: '#ffffff', roughness: 0.85, metalness: 0,
    side: THREE.DoubleSide
  });
  character.updateMatrixWorld(true);
  const head = byName.get('scouthead');
  hair.name = 'CC0 standard short brown hair';
  hair.traverse(part => {
    if (!part.isMesh) return;
    part.material = hairMaterial;
    // Preserve the authored men's haircut contour and fit it uniformly to the
    // existing head. Source coordinates are decimeters in MakeHuman space.
    const positions = part.geometry.attributes.position;
    const point = new THREE.Vector3();
    for (let i = 0; i < positions.count; i++) {
      point.fromBufferAttribute(positions, i);
      point.set(
        point.x * 0.123,
        1.575 + (point.y - 7.3652) * 0.108,
        -0.072 + (point.z + 0.4955) * 0.101
      );
      character.localToWorld(point);
      head.worldToLocal(point);
      positions.setXYZ(i, point.x, point.y, point.z);
    }
    part.geometry.computeVertexNormals();
    part.geometry.computeBoundingSphere();
    part.castShadow = part.receiveShadow = true;
  });
  head.add(hair);

  // Split the authored pair into foot-bound meshes, keeping UVs and shoe details.
  for (const [suffix, sign] of [['L', 1], ['R', -1]]) {
    const foot = byName.get('scoutfoot' + suffix);
    const group = new THREE.Group();
    group.name = 'CC0 white athletic sneaker and sock ' + suffix;
    shoes.traverse(part => {
      if (!part.isMesh) return;
      const geometry = part.geometry.index ? part.geometry.toNonIndexed() : part.geometry;
      const positions = geometry.attributes.position;
      const uv = geometry.attributes.uv;
      const out = [], outUV = [];
      const point = new THREE.Vector3();
      for (let i = 0; i < positions.count; i += 3) {
        if (positions.getX(i) * sign < 0) continue;
        for (let j = i; j < i + 3; j++) {
          point.fromBufferAttribute(positions, j);
          point.set(point.x * 0.1, point.y * 0.1 + 0.855, point.z * 0.1 - 0.005);
          character.localToWorld(point);
          foot.worldToLocal(point);
          out.push(point.x, point.y, point.z);
          outUV.push(uv.getX(j), uv.getY(j));
        }
      }
      const fitted = new THREE.BufferGeometry();
      fitted.setAttribute('position', new THREE.Float32BufferAttribute(out, 3));
      fitted.setAttribute('uv', new THREE.Float32BufferAttribute(outUV, 2));
      fitted.computeVertexNormals();
      const sneaker = new THREE.Mesh(fitted, shoesMaterial);
      sneaker.castShadow = sneaker.receiveShadow = true;
      group.add(sneaker);
    });
    foot.add(group);
  }
}
