/**
 * Composant Hero 3D avec React Three Fiber.
 * Affiche une scène interactive (particules/formes) aux couleurs de FACAM.
 */

'use client';

import { useRef } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Float, Stars } from '@react-three/drei';
import type { Mesh } from 'three';

function FloatingShape({ position, color }: { position: [number, number, number]; color: string }) {
  const meshRef = useRef<Mesh>(null);

  useFrame((state, delta) => {
    if (meshRef.current) {
      meshRef.current.rotation.x += delta * 0.2;
      meshRef.current.rotation.y += delta * 0.3;
      meshRef.current.rotation.z = Math.sin(state.clock.elapsedTime) * 0.15;
    }
  });

  return (
    <Float speed={2} rotationIntensity={1.5} floatIntensity={2}>
      <mesh ref={meshRef} position={position}>
        <icosahedronGeometry args={[1, 0]} />
        <meshStandardMaterial color={color} roughness={0.3} metalness={0.8} />
      </mesh>
    </Float>
  );
}

export function Hero3D() {
  return (
    <div className="absolute inset-0 -z-10 bg-facam-dark">
      <Canvas camera={{ position: [0, 0, 8], fov: 45 }}>
        <ambientLight intensity={0.5} />
        <pointLight position={[10, 10, 10]} intensity={1} color="#ffae03" />
        <pointLight position={[-10, -10, -10]} intensity={0.5} color="#001b61" />

        <Stars radius={100} depth={50} count={5000} factor={4} saturation={0} fade speed={1} />

        <FloatingShape position={[3, 1, -2]} color="#ffae03" />
        <FloatingShape position={[-3, -1, -1]} color="#001b61" />
        <FloatingShape position={[0, 2, -5]} color="#002a6e" />

        <fog attach="fog" args={['#000d32', 5, 20]} />
      </Canvas>
      <div className="absolute inset-0 bg-gradient-to-r from-facam-dark/90 to-transparent pointer-events-none" />
    </div>
  );
}
