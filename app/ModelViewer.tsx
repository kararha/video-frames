"use client";

import { Suspense, useRef } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { OrbitControls, useGLTF, Environment, Center } from "@react-three/drei";
import * as THREE from "three";

if (typeof window !== "undefined") {
  const originalError = console.error;
  console.error = (...args: unknown[]) => {
    if (typeof args[0] === "string" && args[0].includes("Couldn't load texture")) {
      return;
    }
    originalError.apply(console, args);
  };
}

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
      className="relative w-full rounded-3xl overflow-hidden bg-zinc-950/80 border border-white/[0.08] backdrop-blur-xl shadow-[inset_0_1px_0_0_rgba(255,255,255,0.1),0_20px_50px_rgba(0,0,0,0.6)] group"
      style={{
        aspectRatio: "1 / 1",
      }}
    >
      {/* Subtle ambient glow behind model */}
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(255,85,0,0.08),transparent_70%)]" />

      {/* Loading spinner overlay */}
      <div
        className="absolute inset-0 flex items-center justify-center z-10 pointer-events-none"
        id="model-loader"
      >
        <div
          className="w-8 h-8 rounded-full border-2 border-t-transparent animate-spin"
          style={{ borderColor: "rgba(255,255,255,0.1)", borderTopColor: "#ff5500" }}
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
        <ambientLight intensity={0.8} />
        <directionalLight position={[5, 8, 5]} intensity={1.5} castShadow />
        <directionalLight
          position={[-4, 3, -3]}
          intensity={0.6}
          color="#ffaa66"
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
        className="absolute bottom-3 left-1/2 -translate-x-1/2 flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-mono bg-black/60 border border-white/10 text-zinc-300 backdrop-blur-md shadow-lg"
      >
        <svg
          className="w-3 h-3 text-amber-500"
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
        <span>اسحب للتدوير ثلاثي الأبعاد</span>
      </div>
    </div>
  );
}
