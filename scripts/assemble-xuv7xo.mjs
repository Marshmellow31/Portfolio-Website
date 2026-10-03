import { readFile, writeFile, mkdir } from 'node:fs/promises';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import { createRequire } from 'node:module';
import sharp from 'sharp';
import { Color } from 'three';

// Dependencies live outside the portfolio: npm install --prefix <tools-directory>
// @gltf-transform/core @gltf-transform/extensions @gltf-transform/functions draco3dgltf
const [toolsDir, manifestPath, configPath, materialPath] = process.argv.slice(2);
const requireTools = createRequire(path.join(path.resolve(toolsDir), 'package.json'));
const { Document, NodeIO } = await import(pathToFileURL(requireTools.resolve('@gltf-transform/core')));
const { ALL_EXTENSIONS, KHRMaterialsClearcoat, KHRTextureTransform } = await import(pathToFileURL(requireTools.resolve('@gltf-transform/extensions')));
const { mergeDocuments, unpartition, prune, dedup } = await import(pathToFileURL(requireTools.resolve('@gltf-transform/functions')));
const draco = requireTools('draco3dgltf');
const io = new NodeIO().registerExtensions(ALL_EXTENSIONS).registerDependencies({ 'draco3d.decoder': await draco.createDecoderModule() });
const urls = JSON.parse(await readFile(manifestPath, 'utf8'));
const config = JSON.parse(await readFile(configPath, 'utf8')).sceneConfig;
const settings = JSON.parse(await readFile(materialPath, 'utf8'));
const cache = path.join(toolsDir, 'source'); await mkdir(cache, { recursive: true });
async function download(url) {
  const file = path.join(cache, decodeURIComponent(new URL(url).pathname).replaceAll('/', '_'));
  try { return await readFile(file); } catch { /* first retrieval */ }
  const response = await fetch(url);
  if (!response.ok) throw new Error(`${response.status}: ${url}`);
  const bytes = Buffer.from(await response.arrayBuffer()); await writeFile(file, bytes); return bytes;
}
// Door-clamp animation helpers are authored metres below the static car and
// positioned by the vendor's animation code. Omit that auxiliary part here.
const modelUrls = urls.filter(u => /\.glb$/i.test(u) && !/ENV_DOME|Shadow_Plane|Roof_Open_Glass_Sky|Door_Clamp_Anim/i.test(u));
const bytes = new Map();
for (let i = 0; i < modelUrls.length; i += 4) {
  await Promise.all(modelUrls.slice(i, i + 4).map(async u => bytes.set(u, await download(u))));
  console.log(`Downloaded ${Math.min(i + 4, modelUrls.length)}/${modelUrls.length} model parts`);
}
const doc = new Document();
for (const u of modelUrls) mergeDocuments(doc, await io.readBinary(bytes.get(u)));
const root = doc.getRoot();
const scene = doc.createScene('Mahindra XUV 7XO AX7L');
for (const old of root.listScenes()) if (old !== scene) { for (const child of old.listChildren()) scene.addChild(child); old.dispose(); }
root.setDefaultScene(scene);
const hide = new Set(config.defaulModelHideList.map(x => x.name));
const variant = config.modelVariants.find(v => v.variantName === 'AX7L');
for (const [key, value] of Object.entries({ fuel: 'Gasoline', transmission: 'AT', driveTrain: 'FWD', seatingCapacity: '7 Seater' })) {
  const spec = variant.specification[key]?.find(s => s.type === value);
  for (const name of spec?.meshesToHide || []) hide.add(name);
  for (const name of spec?.meshesToShow || []) hide.delete(name);
}
for (const node of root.listNodes()) if (hide.has(node.getName())) node.dispose();
// Static learning export: retain the authored closed-door pose, without app controls.
for (const animation of root.listAnimations()) animation.dispose();
const materialSettings = { ...settings.materials, ...settings.baseVariantMaterials, ...settings.variantMaterials.AX7L };
for (const m of config.colorMaterialsList.find(c => c.colorName === 'Ruby Velvet').meshes) materialSettings[m.materialName] = m.material;
const textures = new Map();
const clearcoat = doc.createExtension(KHRMaterialsClearcoat);
const textureTransform = doc.createExtension(KHRTextureTransform);
function color(value) { return new Color(value || '#ffffff').toArray(); }
async function getTexture(file) {
  if (!file) return null;
  if (textures.has(file)) return textures.get(file);
  const stem = file.replace(/\.[^.]+$/, '').toLowerCase();
  const url = urls.find(u => /textures\//.test(u) && decodeURIComponent(u.split('/').at(-1)).replace(/\.[^.]+$/, '').toLowerCase() === stem);
  if (!url) return null;
  const png = await sharp(await download(url)).png().toBuffer();
  const texture = doc.createTexture(file).setImage(png).setMimeType('image/png'); textures.set(file, texture); return texture;
}
let matched = 0;
for (const mat of root.listMaterials()) {
  const m = materialSettings[mat.getName()]; if (!m) continue;
  matched++;
  mat.setBaseColorFactor([...color(m.color), m.opacity ?? 1]).setMetallicFactor(Math.min(1, Math.max(0, m.metalness ?? 0))).setRoughnessFactor(Math.min(1, Math.max(.04, m.roughness ?? .5))).setDoubleSided(m.side === 2);
  mat.setAlphaMode(m.transparent ? 'BLEND' : 'OPAQUE');
  if (m.clearcoat) mat.setExtension('KHR_materials_clearcoat', clearcoat.createClearcoat().setClearcoatFactor(Math.min(1, m.clearcoat)).setClearcoatRoughnessFactor(Math.max(0, Math.min(1, m.clearcoatRoughness || 0))));
  const map = await getTexture(m.textures?.map?.file);
  mat.setBaseColorTexture(map);
  if (map) {
    const info = mat.getBaseColorTextureInfo();
    const source = m.textures.map;
    const wrap = value => value === 'ClampToEdgeWrapping' ? 33071 : value === 'MirroredRepeatWrapping' ? 33648 : 10497;
    info.setWrapS(wrap(source.wrapS)).setWrapT(wrap(source.wrapT));
    if (source.repeat) info.setExtension('KHR_texture_transform', textureTransform.createTransform().setScale(source.repeat));
  }
}
root.getAsset().copyright = 'Mahindra. Learning export from https://auto.mahindra.com/360-view?cid=XUV7XO';
for (const extension of root.listExtensionsUsed()) if (extension.extensionName === 'KHR_draco_mesh_compression') extension.dispose();
await doc.transform(prune(), dedup(), unpartition());
await mkdir('public/models', { recursive: true });
await io.write('public/models/xuv7xo.glb', doc);
console.log(JSON.stringify({ parts: modelUrls.length, meshes: root.listMeshes().length, materialsMatched: matched, textures: textures.size, bytes: (await readFile('public/models/xuv7xo.glb')).length }));
