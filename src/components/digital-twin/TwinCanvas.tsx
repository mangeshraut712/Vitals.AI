'use client';

import { Suspense } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, ContactShadows, Environment, Float } from '@react-three/drei';
import type { ReactNode } from 'react';

interface TwinCanvasProps {
  children?: ReactNode;
}

function Lighting(): React.JSX.Element {
  return (
    <>
      <ambientLight intensity={0.52} />
      <spotLight
        position={[6, 12, 8]}
        angle={0.28}
        penumbra={0.9}
        intensity={1.35}
        castShadow
        shadow-mapSize={[1024, 1024]}
      />
      <pointLight position={[-6, 4, -4]} intensity={0.45} color="#fff3e9" />
      <Environment preset="studio" />
    </>
  );
}

function TestBox(): React.JSX.Element {
  return (
    <mesh position={[0, 0.5, 0]}>
      <boxGeometry args={[1, 1, 1]} />
      <meshStandardMaterial color="#f5f5f5" />
    </mesh>
  );
}

function LoadingFallback(): React.JSX.Element {
  return (
    <mesh position={[0, 1, 0]}>
      <sphereGeometry args={[0.2, 16, 16]} />
      <meshStandardMaterial color="#e0e0e0" transparent opacity={0.5} />
    </mesh>
  );
}

export function TwinCanvas({ children }: TwinCanvasProps): React.JSX.Element {
  return (
    <div className="relative w-full h-full bg-slate-100 rounded-xl overflow-hidden shadow-inner">
      {/* Soft studio backdrop */}
      <div
        className="absolute inset-0 opacity-40 pointer-events-none"
        style={{
          background: 'radial-gradient(circle at 50% 30%, #f8fafc 0%, #dbe4f1 70%, #c7d2e3 100%)'
        }}
      />

      <Canvas
        shadows
        dpr={[1, 2]}
        camera={{ position: [0, 1.2, 4], fov: 45 }}
        style={{ position: 'absolute', inset: 0 }}
        gl={{
          antialias: true,
          powerPreference: 'high-performance',
          alpha: true,
        }}
      >
        <Suspense fallback={<LoadingFallback />}>
          <Lighting />

          <ContactShadows
            position={[0, 0, 0]}
            opacity={0.42}
            scale={8}
            blur={2}
            far={10}
            color="#1f2937"
          />

          <Float
            speed={1.5}
            rotationIntensity={0.2}
            floatIntensity={0.5}
            floatingRange={[-0.05, 0.05]}
          >
            {children ?? <TestBox />}
          </Float>

          <OrbitControls
            enablePan={false}
            enableZoom={true}
            minDistance={3}
            maxDistance={8}
            minPolarAngle={Math.PI / 4}
            maxPolarAngle={Math.PI / 1.8}
            autoRotate
            autoRotateSpeed={0.35}
            target={[0, 1.2, 0]}
          />
        </Suspense>
      </Canvas>
    </div>
  );
}
