/* eslint-disable react-hooks/immutability */
"use client";

import { useRef, useEffect, Suspense } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { Float, useGLTF, useTexture } from "@react-three/drei";
import * as THREE from "three";

function HouseModel() {
  const groupRef = useRef<THREE.Group>(null);
  const gltf = useGLTF("/models/house.glb");
  const scene = gltf.scene;

  const [basecolor, normal, roughness, metallic] = useTexture([
    "/models/basecolor.jpg",
    "/models/normal.jpg",
    "/models/roughness.jpg",
    "/models/metallic.jpg",
  ]);

  useEffect(() => {
    // Configure textures for GLTF coordinate space (flipY = false)
    if (basecolor.flipY !== false) {
      basecolor.flipY = false;
      basecolor.needsUpdate = true;
    }
    if (normal.flipY !== false) {
      normal.flipY = false;
      normal.needsUpdate = true;
    }
    if (roughness.flipY !== false) {
      roughness.flipY = false;
      roughness.needsUpdate = true;
    }
    if (metallic.flipY !== false) {
      metallic.flipY = false;
      metallic.needsUpdate = true;
    }

    if (basecolor.colorSpace !== THREE.SRGBColorSpace) {
      basecolor.colorSpace = THREE.SRGBColorSpace;
      basecolor.needsUpdate = true;
    }

    scene.traverse((child) => {
      if (child instanceof THREE.Mesh) {
        const mat = child.material as THREE.MeshStandardMaterial;
        if (mat && mat.map !== basecolor) {
          mat.map = basecolor;
          mat.normalMap = normal;
          mat.roughnessMap = roughness;
          mat.metalnessMap = metallic;
          mat.needsUpdate = true;
        }
      }
    });
  }, [scene, basecolor, normal, roughness, metallic]);

  useFrame((state) => {
    if (groupRef.current) {
      groupRef.current.rotation.y = state.clock.elapsedTime * 0.15;
    }
  });

  return (
    <Float speed={1.5} rotationIntensity={0.2} floatIntensity={0.5}>
      <group ref={groupRef} scale={2.2} position={[0, -0.1, 0]}>
        <primitive object={scene} />
      </group>
    </Float>
  );
}

function seededRandom(seed: number) {
  const x = Math.sin(seed * 12.9898 + seed * 78.233) * 43758.5453;
  return x - Math.floor(x);
}

function Particles() {
  const particlesRef = useRef<THREE.Points>(null);
  const count = 50;

  const positions = new Float32Array(count * 3);
  for (let i = 0; i < count; i++) {
    positions[i * 3] = (seededRandom(i * 3) - 0.5) * 10;
    positions[i * 3 + 1] = (seededRandom(i * 3 + 1) - 0.5) * 8;
    positions[i * 3 + 2] = (seededRandom(i * 3 + 2) - 0.5) * 10;
  }

  useFrame((state) => {
    if (particlesRef.current) {
      particlesRef.current.rotation.y = state.clock.elapsedTime * 0.03;
      particlesRef.current.rotation.x =
        Math.sin(state.clock.elapsedTime * 0.02) * 0.1;
    }
  });

  return (
    <points ref={particlesRef}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          args={[positions, 3]}
          count={count}
          itemSize={3}
        />
      </bufferGeometry>
      <pointsMaterial
        size={0.04}
        color="#8fcdff"
        transparent
        opacity={0.6}
        sizeAttenuation
      />
    </points>
  );
}

function GlowOrbs() {
  const orbs = [
    {
      position: [-2.5, 1.2, 1.8] as [number, number, number],
      scale: 0.2,
      color: "#0284c7",
    },
    {
      position: [2.8, -0.5, -1.5] as [number, number, number],
      scale: 0.18,
      color: "#6366f1",
    },
    {
      position: [-1.0, 2.0, -2.5] as [number, number, number],
      scale: 0.15,
      color: "#7dd3fc",
    },
    {
      position: [1.5, 1.8, 2.0] as [number, number, number],
      scale: 0.22,
      color: "#8fcdff",
    },
    {
      position: [-2.0, -0.8, -1.0] as [number, number, number],
      scale: 0.17,
      color: "#a5b4fc",
    },
  ];

  return (
    <>
      {orbs.map((orb, i) => (
        <Float
          key={i}
          speed={0.8 + i * 0.3}
          rotationIntensity={0}
          floatIntensity={2}
          floatingRange={[-0.5, 0.5]}
        >
          <mesh position={orb.position}>
            <sphereGeometry args={[orb.scale, 16, 16]} />
            <meshStandardMaterial
              color={orb.color}
              transparent
              opacity={0.6}
              roughness={0.2}
              metalness={0.5}
            />
          </mesh>
        </Float>
      ))}
    </>
  );
}

function Scene() {
  return (
    <>
      <ambientLight intensity={0.6} />
      <directionalLight position={[5, 8, 5]} intensity={1.5} color="#ffffff" />
      <directionalLight
        position={[-3, 5, -3]}
        intensity={0.5}
        color="#8fcdff"
      />
      <pointLight
        position={[0, 3, 3]}
        intensity={0.8}
        color="#6366f1"
        distance={10}
      />
      <HouseModel />
      <Particles />
      <GlowOrbs />
      <fog attach="fog" args={["#051424", 6, 18]} />
    </>
  );
}

function DesktopLoader() {
  return (
    <div className="w-full h-full flex flex-col items-center justify-center gap-4">
      <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      <span className="text-[14px] font-medium text-on-surface-variant/70 select-none">
        Cargando visualización 3D...
      </span>
    </div>
  );
}

export function ThreeHouseCanvas() {
  return (
    <Suspense fallback={<DesktopLoader />}>
      <Canvas
        camera={{ position: [3, 2.5, 4], fov: 35, near: 0.1, far: 100 }}
        dpr={[1, 2]}
        gl={{ antialias: true, alpha: true }}
        style={{ background: "transparent" }}
      >
        <Scene />
      </Canvas>
    </Suspense>
  );
}
