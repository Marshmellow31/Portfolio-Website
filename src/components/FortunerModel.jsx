import { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';

export default function FortunerModel({ model }) {
  const host = useRef(null);
  const [status, setStatus] = useState(`Loading ${model.name}…`);
  useEffect(() => {
    const el = host.current;
    let disposed = false;
    const scene = new THREE.Scene();
    scene.background = new THREE.Color('#111114');
    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setPixelRatio(Math.min(devicePixelRatio, 1.5));
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.4;
    el.appendChild(renderer.domElement);
    const camera = new THREE.PerspectiveCamera(40, 1, .01, 1000);
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    const pmrem = new THREE.PMREMGenerator(renderer);
    const room = new RoomEnvironment();
    const environment = pmrem.fromScene(room);
    scene.environment = environment.texture;
    room.dispose(); pmrem.dispose();
    scene.add(new THREE.HemisphereLight(0xffffff, 0x444444, 2));
    const light = new THREE.DirectionalLight(0xffffff, 3);
    light.position.set(4, 8, 5); scene.add(light);
    const resize = () => {
      renderer.setSize(el.clientWidth, el.clientHeight);
      camera.aspect = el.clientWidth / el.clientHeight; camera.updateProjectionMatrix();
    };
    const observer = new ResizeObserver(resize); observer.observe(el); resize();
    function disposeObject(object) {
      object.traverse(m => {
        m.geometry?.dispose();
        for (const material of Array.isArray(m.material) ? m.material : m.material ? [m.material] : []) {
          for (const value of Object.values(material)) if (value?.isTexture) value.dispose();
          material.dispose();
        }
      });
    }
    new GLTFLoader().load(model.file, gltf => {
      if (disposed) { disposeObject(gltf.scene); return; }
      const box = new THREE.Box3().setFromObject(gltf.scene);
      const center = box.getCenter(new THREE.Vector3());
      const size = box.getSize(new THREE.Vector3());
      gltf.scene.position.sub(center); scene.add(gltf.scene);
      const radius = Math.max(size.x, size.y, size.z);
      camera.position.set(radius * .8, radius * .35, radius * .9);
      camera.near = radius / 1000; camera.far = radius * 20; camera.updateProjectionMatrix();
      controls.minDistance = radius * .12; controls.maxDistance = radius * 3; controls.update();
      setStatus('');
    }, event => {
      if (!disposed && event.total) setStatus(`Loading ${model.name} · ${Math.round(event.loaded / event.total * 100)}%`);
    }, () => { if (!disposed) setStatus('Unable to load the model. Reload the page to retry.'); });
    renderer.setAnimationLoop(() => { controls.update(); renderer.render(scene, camera); });
    return () => {
      disposed = true; observer.disconnect(); renderer.setAnimationLoop(null); controls.dispose();
      disposeObject(scene); environment.dispose(); renderer.dispose(); renderer.domElement.remove();
    };
  }, [model.file, model.name]);
  return <section id={`${model.id}-viewer`} aria-label={`${model.name} 3D viewer`} className="my-8 scroll-mt-20 overflow-hidden rounded-2xl border border-border">
    <h2 className="px-5 pt-4 text-xl">{model.order} — {model.maker} {model.name}</h2>
    <div className="relative">
      <div ref={host} className="h-[60vh] min-h-[320px] max-h-[720px] w-full touch-none" />
      {status && <p role="status" className="absolute inset-x-0 top-5 text-center text-sm">{status}</p>}
    </div>
    <div className="flex flex-wrap items-center justify-between gap-4 p-5 text-sm">
      <span>Drag to rotate · Scroll or pinch to zoom</span>
      <a className="rounded-full bg-white px-5 py-3 text-black" href={model.file} download>Download {model.name} GLB</a>
    </div>
  </section>;
}
