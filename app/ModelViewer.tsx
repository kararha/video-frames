"use client";

import { Suspense, useRef } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { OrbitControls, useGLTF, Environment, Center } from "@react-three/drei";
import * as THREE from "three";

function Model({ url }: { url: string }) {
  const { scene } = useGLTF(url);
  const groupRef = useRef<THREE.Group>(null);

  // Gentle idle float animation using performance.now() to prevent THREE.Clock deprecation notices
  useFrame(() => {
    if (groupRef.current) {
      const time = performance.now() * 0.001;
      groupRef.current.position.y = Math.sin(time * 0.6) * 0.08;
    }
  });

  return (
    <Center>
      <group ref={groupRef}>
        <primitive object={scene} />
      </group>
    </Center>
  );
}

function LoadingFallback() {
  return (
    <mesh>
      <sphereGeometry args={[0.3, 16, 16]} />
      <meshStandardMaterial color="#ff5500" wireframe opacity={0.4} transparent />
    </mesh>
  );
}

export default function ModelViewer() {
  return (
    <div
      className="relative w-full rounded-3xl overflow-hidden"
      style={{
        aspectRatio: "1 / 1",
        backgroundColor: "rgba(255,255,255,0.5)",
        boxShadow: "0 1px 3px rgba(0,0,0,0.06), 0 8px 24px rgba(0,0,0,0.04)",
      }}
    >
      {/* Loading spinner overlay */}
      <div
        className="absolute inset-0 flex items-center justify-center z-10 pointer-events-none"
        id="model-loader"
      >
        <div
          className="w-8 h-8 rounded-full border-2 border-t-transparent animate-spin"
          style={{ borderColor: "rgba(0,0,0,0.1)", borderTopColor: "#ff5500" }}
        />
      </div>

      <Canvas
        gl={{ antialias: true, alpha: true }}
        camera={{ position: [0, 1.2, 3.5], fov: 40 }}
        style={{ background: "transparent" }}
        onCreated={() => {
          // Hide loader once canvas is up
          const el = document.getElementById("model-loader");
          if (el) el.style.display = "none";
        }}
      >
        <ambientLight intensity={0.6} />
        <directionalLight position={[5, 8, 5]} intensity={1.2} castShadow />
        <directionalLight
          position={[-4, 3, -3]}
          intensity={0.4}
          color="#ffd4b8"
        />

        <Suspense fallback={<LoadingFallback />}>
          <Model url="/3d/luffy2.glb" />
          <Environment preset="city" />
        </Suspense>

        <OrbitControls
          enablePan={false}
          enableZoom={false}
          autoRotate
          autoRotateSpeed={1.8}
          minPolarAngle={Math.PI / 3}
          maxPolarAngle={Math.PI / 1.8}
        />
      </Canvas>

      {/* Drag-to-rotate hint */}
      <div
        className="absolute bottom-3 left-1/2 -translate-x-1/2 flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-mono"
        style={{
          backgroundColor: "rgba(255,255,255,0.8)",
          color: "#71717a",
          backdropFilter: "blur(8px)",
        }}
      >
        <svg
          className="w-3 h-3"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M5 9l-3 3 3 3" />
          <path d="M19 9l3 3-3 3" />
          <path d="M2 12h20" />
        </svg>
        اسحب للتدوير ثلاثي الأبعاد
      </div>
    </div>
  );
}
