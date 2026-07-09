import { useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { Canvas, useFrame } from '@react-three/fiber';

/* ────────────────────────────────────────────────────────────────
   DriveTeaser — the monochrome 3D car on the Home page.
   The whole site is grayscale; this car is secretly hot pink.
   Hovering leaks the color through, clicking opens /drive where
   the world floods into full saturation.
   ──────────────────────────────────────────────────────────────── */

function TeaserCar() {
  const group = useRef();

  useFrame(({ clock, pointer }, dt) => {
    if (!group.current) return;
    const t = clock.getElapsedTime();
    // slow turntable + mouse parallax
    const targetY = t * 0.45 + pointer.x * 0.5;
    const targetX = 0.12 - pointer.y * 0.18;
    group.current.rotation.y += (targetY - group.current.rotation.y) * Math.min(1, dt * 4);
    group.current.rotation.x += (targetX - group.current.rotation.x) * Math.min(1, dt * 4);
    group.current.position.y = Math.sin(t * 1.2) * 0.08;
  });

  return (
    <group ref={group}>
      {/* chassis */}
      <mesh castShadow position={[0, 0.55, 0]}>
        <boxGeometry args={[1.9, 0.55, 3.4]} />
        <meshStandardMaterial color="#FF2E63" metalness={0.35} roughness={0.35} />
      </mesh>
      {/* cabin */}
      <mesh castShadow position={[0, 1.0, -0.25]}>
        <boxGeometry args={[1.45, 0.5, 1.5]} />
        <meshStandardMaterial color="#08D9D6" metalness={0.55} roughness={0.15} />
      </mesh>
      {/* spoiler */}
      <mesh castShadow position={[0, 1.05, -1.65]}>
        <boxGeometry args={[1.7, 0.09, 0.42]} />
        <meshStandardMaterial color="#FFD93D" metalness={0.3} roughness={0.4} />
      </mesh>
      <mesh position={[-0.6, 0.85, -1.65]}><boxGeometry args={[0.09, 0.35, 0.09]} /><meshStandardMaterial color="#252A34" /></mesh>
      <mesh position={[0.6, 0.85, -1.65]}><boxGeometry args={[0.09, 0.35, 0.09]} /><meshStandardMaterial color="#252A34" /></mesh>
      {/* headlights */}
      <mesh position={[-0.55, 0.58, 1.71]}><boxGeometry args={[0.32, 0.16, 0.05]} /><meshStandardMaterial color="#FFF6C3" emissive="#FFF6C3" emissiveIntensity={1.4} /></mesh>
      <mesh position={[0.55, 0.58, 1.71]}><boxGeometry args={[0.32, 0.16, 0.05]} /><meshStandardMaterial color="#FFF6C3" emissive="#FFF6C3" emissiveIntensity={1.4} /></mesh>
      {/* wheels */}
      {[[-0.95, 1.1], [0.95, 1.1], [-0.95, -1.15], [0.95, -1.15]].map(([wx, wz], i) => (
        <mesh key={i} castShadow position={[wx, 0.42, wz]} rotation={[0, 0, Math.PI / 2]}>
          <cylinderGeometry args={[0.42, 0.42, 0.3, 14]} />
          <meshStandardMaterial color="#1B1B24" roughness={0.9} />
        </mesh>
      ))}
      {/* plinth */}
      <mesh receiveShadow position={[0, -0.15, 0]}>
        <cylinderGeometry args={[3.4, 3.6, 0.3, 48]} />
        <meshStandardMaterial color="#17171B" roughness={0.8} />
      </mesh>
    </group>
  );
}

export default function DriveTeaser() {
  const [hovered, setHovered] = useState(false);

  return (
    <Link
      to="/drift"
      className="group relative block rounded-2xl border border-border overflow-hidden bg-surface no-underline"
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      aria-label="Open Race — the F1 oval racing game"
    >
      {/* the car — grayscale until hover leaks the color through */}
      <div
        className="h-[320px] md:h-[380px]"
        style={{ filter: hovered ? 'saturate(1)' : 'saturate(0)', transition: 'filter 1.2s ease' }}
      >
        <Canvas shadows camera={{ position: [4.2, 2.4, 5.2], fov: 42 }} dpr={[1, 1.5]}>
          <ambientLight intensity={0.7} />
          <directionalLight castShadow position={[4, 7, 3]} intensity={1.5} shadow-mapSize={[512, 512]} />
          <TeaserCar />
        </Canvas>
      </div>

      <div className="absolute inset-x-0 bottom-0 p-6 md:p-8 flex flex-wrap items-end justify-between gap-4 pointer-events-none bg-gradient-to-t from-black/80 to-transparent">
        <div>
          <div className="mono-label mb-2">Playable</div>
          <div className="font-bold text-text-bright" style={{ fontSize: 'clamp(20px,2.4vw,30px)', letterSpacing: '-0.02em' }}>
            The only color on this site<br />is behind this door.
          </div>
        </div>
        <div className="font-mono text-[11px] tracking-[.12em] text-text-dim group-hover:text-text transition-colors border-b border-white/20 group-hover:border-white pb-0.5">
          DRIVE →
        </div>
      </div>
    </Link>
  );
}
