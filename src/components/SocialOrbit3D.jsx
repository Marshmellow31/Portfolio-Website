import { Suspense, useEffect, useMemo, useRef, useState } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { FaGithub, FaInstagram, FaLinkedinIn } from 'react-icons/fa';
import * as THREE from 'three';

const platforms = [
  { Icon: FaGithub, name: 'GitHub', href: 'https://github.com/Marshmellow31', position: [-2.15, 0.65, 0], brand: '#24292f', accent: '#39d353', viewBox: '0 0 496 512', path: 'M165.9 397.4c0 2-2.3 3.6-5.2 3.6-3.3.3-5.6-1.3-5.6-3.6 0-2 2.3-3.6 5.2-3.6 3-.3 5.6 1.3 5.6 3.6zm78.9-389.4C106.1 8 0 113.3 0 252c0 110.9 69.8 205.8 169.5 239.2 12.8 2.3 17.3-5.6 17.3-12.1 0-6.2-.3-40.4-.3-61.4-70 15-84.7-29.8-84.7-29.8-11.4-29.1-27.8-36.6-27.8-36.6-22.9-15.7 1.6-15.4 1.6-15.4 24.9 2 38.6 25.8 38.6 25.8 21.9 38.6 58.6 27.5 72.9 20.9 2.3-16 8.8-27.1 16-33.7-55.9-6.2-112.3-14.3-112.3-110.5 0-27.5 7.6-41.3 23.6-58.9-2.6-6.5-11.1-33.3 2.6-67.9 20.9-6.5 69 27 69 27 40-11.2 85.6-11.2 125.6 0 0 0 48.1-33.6 69-27 13.7 34.7 5.2 61.4 2.6 67.9 16 17.7 25.8 31.5 25.8 58.9 0 96.5-58.9 104.2-114.8 110.5 9.2 7.9 17 22.9 17 46.4 0 33.7-.3 75.4-.3 83.6 0 6.5 4.6 14.4 17.3 12.1C428.2 457.8 496 362.9 496 252 496 113.3 383.5 8 244.8 8z' },
  { Icon: FaLinkedinIn, name: 'LinkedIn', href: 'https://linkedin.com/in/harshil-patel-5a7373333', position: [0, -0.9, 0.35], brand: '#0a66c2', viewBox: '0 0 448 512', path: 'M100.28 448H7.4V148.9h92.88zM53.79 108.1C24.09 108.1 0 83.5 0 53.8a53.79 53.79 0 01107.58 0c0 29.7-24.1 54.3-53.79 54.3zM447.9 448h-92.68V302.4c0-34.7-.7-79.2-48.29-79.2-48.29 0-55.69 37.7-55.69 76.7V448h-92.78V148.9h89.08v40.8h1.3c12.4-23.5 42.69-48.3 87.88-48.3 94 0 111.28 61.9 111.28 142.3V448z' },
  { Icon: FaInstagram, name: 'Instagram', href: 'https://www.instagram.com/harshil_3105_/', position: [2.15, 0.65, 0], brand: '#c13584', gradient: true, viewBox: '0 0 448 512', path: 'M224.1 141c-63.6 0-114.9 51.3-114.9 114.9s51.3 114.9 114.9 114.9S339 319.5 339 255.9 287.7 141 224.1 141zm0 189.6c-41.1 0-74.7-33.5-74.7-74.7s33.5-74.7 74.7-74.7 74.7 33.5 74.7 74.7-33.6 74.7-74.7 74.7zm146.4-194.3c0 14.9-12 26.8-26.8 26.8-14.9 0-26.8-12-26.8-26.8s12-26.8 26.8-26.8 26.8 12 26.8 26.8zm76.1 27.2c-1.7-35.9-9.9-67.7-36.2-93.9-26.2-26.2-58-34.4-93.9-36.2-37-2.1-147.9-2.1-184.9 0-35.8 1.7-67.6 9.9-93.9 36.1s-34.4 58-36.2 93.9c-2.1 37-2.1 147.9 0 184.9 1.7 35.9 9.9 67.7 36.2 93.9s58 34.4 93.9 36.2c37 2.1 147.9 2.1 184.9 0 35.9-1.7 67.7-9.9 93.9-36.2 26.2-26.2 34.4-58 36.2-93.9 2.1-37 2.1-147.8 0-184.8z' },
];

function makeIconTexture(platform) {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 512;
  const ctx = canvas.getContext('2d');
  const background = platform.gradient
    ? Object.assign(ctx.createLinearGradient(50, 460, 462, 45), { })
    : platform.brand;
  if (platform.gradient) {
    background.addColorStop(0, '#ffdc80');
    background.addColorStop(0.28, '#fcaf45');
    background.addColorStop(0.52, '#f77737');
    background.addColorStop(0.72, '#e1306c');
    background.addColorStop(1, '#833ab4');
  }
  ctx.fillStyle = background;
  ctx.beginPath();
  ctx.roundRect(18, 18, 476, 476, 108);
  ctx.fill();
  if (platform.accent) {
    ctx.strokeStyle = platform.accent;
    ctx.lineWidth = 12;
    ctx.stroke();
  }
  const [, , width, height] = platform.viewBox.split(' ').map(Number);
  const scale = Math.min(326 / width, 326 / height);
  ctx.save();
  ctx.translate((512 - width * scale) / 2, (512 - height * scale) / 2);
  ctx.scale(scale, scale);
  ctx.fillStyle = '#ffffff';
  ctx.fill(new Path2D(platform.path));
  ctx.restore();
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.anisotropy = 4;
  return texture;
}

function PlatformTile({ platform, index }) {
  const ref = useRef();
  const [hovered, setHovered] = useState(false);
  const texture = useMemo(() => makeIconTexture(platform), [platform]);
  useEffect(() => () => texture.dispose(), [texture]);

  useFrame(({ clock }) => {
    if (!ref.current) return;
    const t = clock.getElapsedTime();
    ref.current.position.y = platform.position[1] + Math.sin(t * 1.25 + index * 2.1) * 0.13;
    ref.current.rotation.x = THREE.MathUtils.lerp(ref.current.rotation.x, hovered ? -0.08 : 0.16, 0.08);
    ref.current.rotation.y = THREE.MathUtils.lerp(ref.current.rotation.y, hovered ? 0 : (index - 1) * -0.18, 0.08);
    const scale = THREE.MathUtils.lerp(ref.current.scale.x, hovered ? 1.12 : 1, 0.1);
    ref.current.scale.setScalar(scale);
  });

  return (
    <group
      ref={ref}
      position={platform.position}
      onPointerOver={e => { e.stopPropagation(); setHovered(true); document.body.style.cursor = 'pointer'; }}
      onPointerOut={() => { setHovered(false); document.body.style.cursor = ''; }}
      onClick={() => window.open(platform.href, '_blank', 'noopener,noreferrer')}
    >
      <mesh castShadow>
        <boxGeometry args={[1.35, 1.35, 0.22]} />
        <meshStandardMaterial color={hovered ? '#303036' : '#1b1b20'} metalness={0.45} roughness={0.34} />
      </mesh>
      <mesh position={[0, 0, 0.118]}>
        <planeGeometry args={[0.82, 0.82]} />
        <meshBasicMaterial map={texture} transparent toneMapped={false} />
      </mesh>
    </group>
  );
}

function OrbitScene() {
  const group = useRef();

  useFrame(({ pointer }) => {
    if (!group.current) return;
    group.current.rotation.x = THREE.MathUtils.lerp(group.current.rotation.x, pointer.y * 0.1, 0.035);
    group.current.rotation.y = THREE.MathUtils.lerp(group.current.rotation.y, pointer.x * 0.16, 0.035);
  });

  return (
    <group ref={group}>
      <mesh scale={[1, 0.46, 1]} position={[0, 0.1, -0.4]}>
        <torusGeometry args={[2.45, 0.012, 8, 96]} />
        <meshBasicMaterial color="#3f3f46" transparent opacity={0.75} />
      </mesh>
      <mesh position={[0, 0.12, -0.2]}>
        <sphereGeometry args={[0.22, 24, 24]} />
        <meshStandardMaterial color="#fafafa" emissive="#ffffff" emissiveIntensity={0.2} />
      </mesh>
      {platforms.map((platform, index) => (
        <PlatformTile key={platform.name} platform={platform} index={index} />
      ))}
    </group>
  );
}

export default function SocialOrbit3D() {
  const [useStaticLayout, setUseStaticLayout] = useState(false);

  useEffect(() => {
    const compact = window.matchMedia('(max-width: 767px)');
    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
    const update = () => setUseStaticLayout(compact.matches || reducedMotion.matches);
    update();
    compact.addEventListener('change', update);
    reducedMotion.addEventListener('change', update);
    return () => {
      compact.removeEventListener('change', update);
      reducedMotion.removeEventListener('change', update);
    };
  }, []);

  if (useStaticLayout) {
    return (
      <div className="border border-border rounded-xl bg-bg p-5" aria-label="Social profiles">
        <div className="mono-label mb-4">Find me online</div>
        <div className="grid grid-cols-3 gap-3">
          {platforms.map(({ Icon, name, href }) => (
            <a
              key={name}
              href={href}
              target="_blank"
              rel="noreferrer"
              aria-label={`Open ${name}`}
              className="group flex min-h-[88px] flex-col items-center justify-center gap-2 rounded-lg border border-border bg-surface text-text no-underline shadow-[0_7px_0_#101014] active:translate-y-1 active:shadow-[0_3px_0_#101014] transition-all"
            >
              <Icon size={25} aria-hidden="true" className="transition-transform group-hover:scale-110" />
              <span className="font-mono text-[9px] tracking-[.1em] text-text-dim">{name.toUpperCase()}</span>
            </a>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="relative h-[280px] sm:h-[320px] border border-border rounded-xl overflow-hidden bg-bg" aria-label="Social profiles">
      <div className="absolute left-5 top-5 z-10 pointer-events-none">
        <div className="mono-label">Find me online</div>
        <p className="m-0 mt-2 text-[12px] text-text-faint">Hover and select a platform</p>
      </div>
      <Canvas camera={{ position: [0, 0.1, 7], fov: 40 }} dpr={[1, 1.25]} gl={{ antialias: true, alpha: true, powerPreference: 'high-performance' }}>
        <ambientLight intensity={1.4} />
        <directionalLight position={[3, 5, 6]} intensity={2.2} />
        <Suspense fallback={null}><OrbitScene /></Suspense>
      </Canvas>
      <div className="sr-only">
        {platforms.map(platform => <a key={platform.name} href={platform.href}>{platform.name}</a>)}
      </div>
    </div>
  );
}
