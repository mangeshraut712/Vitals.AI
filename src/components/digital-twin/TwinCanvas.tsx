'use client';

import { Suspense } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, ContactShadows, Environment, Float } from '@react-three/drei';
import { EffectComposer, Bloom, Vignette, Noise } from '@react-three/postprocessing';
import type { ReactNode } from 'react';

interface TwinCanvasProps {
  children?: ReactNode;
}

function Lighting(): React.JSX.Element {
  return (
    <>
      <hemisphereLight
        intensity={0.68}
        color="#e4ebf5"
        groundColor="#0a0f16"
      />

      <directionalLight
        position={[1.8, 4.6, 3.2]}
        intensity={1.25}
        color="#f3f6fb"
        castShadow
        shadow-bias={-0.00012}
      />

      <directionalLight
        position={[-2.4, 2.1, 1.4]}
        intensity={0.45}
        color="#cad6e8"
      />

      <pointLight position={[0, 2.4, -3]} intensity={0.28} color="#96a6be" />
      <ambientLight intensity={0.3} color="#d6deeb" />
      <Environment preset="studio" />
    </>
  );
}

function LoadingFallback(): React.JSX.Element {
  return (
    <mesh position={[0, 1, 0]}>
      <sphereGeometry args={[0.2, 16, 16]} />
      <meshPhysicalMaterial
        color="#64748b"
        transparent
        opacity={0.5}
        roughness={0}
        transmission={1}
        thickness={1}
      />
    </mesh>
  );
}

export function TwinCanvas({ children }: TwinCanvasProps): React.JSX.Element {
  return (
    <div className="relative w-full h-full bg-[#090b10] rounded-xl overflow-hidden shadow-2xl border border-white/5">
      {/* Soft neutral background */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            'radial-gradient(circle at 50% 35%, rgba(24,31,43,0.62) 0%, rgba(9,11,16,0.94) 56%, rgba(4,6,11,1) 100%)',
        }}
      />

      <Canvas
        shadows
        dpr={[1, 2]}
        camera={{ position: [0, 1.08, 2.95], fov: 24 }}
        style={{ position: 'absolute', inset: 0 }}
        gl={{
          antialias: true,
          powerPreference: 'high-performance',
          alpha: false,
          stencil: false,
          depth: true,
        }}
      >
        <Suspense fallback={<LoadingFallback />}>
          <Lighting />

          <ContactShadows
            position={[0, 0, 0]}
            opacity={0.32}
            scale={6.8}
            blur={2.2}
            far={3.4}
            color="#000000"
          />

          <Float
            speed={0.44}
            rotationIntensity={0.015}
            floatIntensity={0.035}
            floatingRange={[-0.005, 0.01]}
          >
            {children}
          </Float>

          <OrbitControls
            enablePan={false}
            enableZoom={false}
            minDistance={2.95}
            maxDistance={2.95}
            minPolarAngle={Math.PI / 2.5}
            maxPolarAngle={Math.PI / 1.82}
            minAzimuthAngle={-Math.PI / 8}
            maxAzimuthAngle={Math.PI / 8}
            autoRotate={false}
            target={[0, 1.02, 0.05]}
          />

          <EffectComposer multisampling={0}>
            <Bloom
              luminanceThreshold={0.75}
              luminanceSmoothing={0.95}
              height={300}
              intensity={0.22}
            />
            <Vignette eskil={false} offset={0.3} darkness={0.34} />
            <Noise opacity={0.008} />
          </EffectComposer>
        </Suspense>
      </Canvas>

      {/* Subtle bottom fade */}
      <div className="absolute inset-x-0 bottom-0 h-32 bg-gradient-to-t from-black/50 to-transparent pointer-events-none" />
    </div>
  );
}
