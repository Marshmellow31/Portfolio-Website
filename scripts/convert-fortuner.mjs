import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { Matrix4, Vector3, Matrix3 } from 'three';

const source = JSON.parse(await readFile(process.argv[2], 'utf8'));
const output = 'public/models/fortuner.glb';
const chunks = [];
let size = 0;
const gltf = { asset: { version: '2.0', generator: 'Fortuner learning scene export', copyright: 'Toyota / ONE3D. Source: https://www.toyotabharat.com/virtual-showroom/fortuner.html' }, scene: 0, scenes: [{ nodes: [] }], nodes: [], meshes: [], materials: [], accessors: [], bufferViews: [], buffers: [{ byteLength: 0 }], images: [], textures: [], samplers: [{ wrapS: 10497, wrapT: 10497 }] };
function bufferView(bytes) {
  const data = Buffer.from(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  const index = gltf.bufferViews.length;
  gltf.bufferViews.push({ buffer: 0, byteOffset: size, byteLength: data.length });
  chunks.push(data); size += data.length;
  const pad = (4 - size % 4) % 4;
  if (pad) { chunks.push(Buffer.alloc(pad)); size += pad; }
  return index;
}
function accessor(values, type, integer = false, bounds = false) {
  const array = integer ? new Uint32Array(values) : new Float32Array(values);
  const width = { SCALAR: 1, VEC2: 2, VEC3: 3 }[type];
  const item = { bufferView: bufferView(array), componentType: integer ? 5125 : 5126, count: values.length / width, type };
  if (bounds) {
    item.min = Array(width).fill(Infinity); item.max = Array(width).fill(-Infinity);
    values.forEach((v, i) => { const c = i % width; item.min[c] = Math.min(item.min[c], v); item.max[c] = Math.max(item.max[c], v); });
  }
  gltf.accessors.push(item); return gltf.accessors.length - 1;
}
const textureCache = new Map();
async function texture(url) {
  if (!url) return undefined;
  if (textureCache.has(url)) return textureCache.get(url);
  const response = await fetch(url);
  if (!response.ok) throw new Error(`Texture ${response.status}: ${url}`);
  // Embed PNG for broad Blender/glTF compatibility rather than vendor WebP.
  const sharp = (await import('sharp')).default;
  const bytes = await sharp(Buffer.from(await response.arrayBuffer())).png().toBuffer();
  const image = gltf.images.push({ bufferView: bufferView(bytes), mimeType: 'image/png' }) - 1;
  const index = gltf.textures.push({ source: image, sampler: 0 }) - 1;
  textureCache.set(url, index); return index;
}
const materialIds = new Map();
for (const [id, m] of Object.entries(source.materials)) {
  const tex = await texture(m.albedo);
  const material = { name: m.name, doubleSided: true, pbrMetallicRoughness: { baseColorFactor: [...m.color, m.alpha ?? 1], metallicFactor: m.metallic, roughnessFactor: Math.max(.08, m.roughness) } };
  if (tex !== undefined) material.pbrMetallicRoughness.baseColorTexture = { index: tex };
  if (m.alpha < 1) material.alphaMode = 'BLEND';
  materialIds.set(Number(id), gltf.materials.length); gltf.materials.push(material);
}
let vertices = 0, triangles = 0;
for (const mesh of source.meshes) {
  const matrix = new Matrix4().fromArray(mesh.matrix);
  const normals = new Matrix3().getNormalMatrix(matrix);
  const p = new Vector3();
  for (let i = 0; i < mesh.positions.length; i += 3) {
    p.fromArray(mesh.positions, i).applyMatrix4(matrix).toArray(mesh.positions, i);
    if (mesh.normals.length) p.fromArray(mesh.normals, i).applyMatrix3(normals).normalize().toArray(mesh.normals, i);
  }
  // Preserve the authored handedness by baking world transforms and mirroring Z.
  for (let i = 2; i < mesh.positions.length; i += 3) mesh.positions[i] *= -1;
  for (let i = 2; i < mesh.normals.length; i += 3) mesh.normals[i] *= -1;
  if (matrix.determinant() > 0) for (let i = 0; i < mesh.indices.length; i += 3) [mesh.indices[i + 1], mesh.indices[i + 2]] = [mesh.indices[i + 2], mesh.indices[i + 1]];
  const attributes = { POSITION: accessor(mesh.positions, 'VEC3', false, true) };
  if (mesh.normals.length) attributes.NORMAL = accessor(mesh.normals, 'VEC3');
  if (mesh.uv.length) attributes.TEXCOORD_0 = accessor(mesh.uv, 'VEC2');
  gltf.meshes.push({ name: mesh.name, primitives: [{ attributes, indices: accessor(mesh.indices, 'SCALAR', true), material: materialIds.get(mesh.material) }] });
  gltf.scenes[0].nodes.push(gltf.nodes.length); gltf.nodes.push({ name: mesh.name, mesh: gltf.meshes.length - 1 });
  vertices += mesh.positions.length / 3; triangles += mesh.indices.length / 3;
}
gltf.buffers[0].byteLength = size;
let json = Buffer.from(JSON.stringify(gltf));
json = Buffer.concat([json, Buffer.alloc((4 - json.length % 4) % 4, 32)]);
const header = Buffer.alloc(20); header.write('glTF'); header.writeUInt32LE(2, 4); header.writeUInt32LE(28 + json.length + size, 8); header.writeUInt32LE(json.length, 12); header.writeUInt32LE(0x4e4f534a, 16);
const binHeader = Buffer.alloc(8); binHeader.writeUInt32LE(size); binHeader.writeUInt32LE(0x004e4942, 4);
await mkdir('public/models', { recursive: true });
await writeFile(output, Buffer.concat([header, json, binHeader, ...chunks]));
console.log(JSON.stringify({ output, meshes: gltf.meshes.length, vertices, triangles, textures: textureCache.size, bytes: 28 + json.length + size }));
