"use client";

import { Float, OrbitControls, Sparkles } from "@react-three/drei";
import { Canvas } from "@react-three/fiber";
import * as THREE from "three";

import { WorldState } from "@/domain/model/types";

interface BoardSceneProps {
  worldState: WorldState;
}

function BoardSquare({ x, y, dark }: { x: number; y: number; dark: boolean }) {
  return (
    <mesh position={[x, 0.16, y]} receiveShadow castShadow>
      <boxGeometry args={[1, 0.18, 1]} />
      <meshStandardMaterial color={dark ? "#181818" : "#d8d1c4"} metalness={0.08} roughness={0.8} />
    </mesh>
  );
}

function sideColor(color: string) {
  return new THREE.Color(color).multiplyScalar(0.15);
}

function PieceMesh({
  x,
  y,
  z,
  color,
  kind
}: {
  x: number;
  y: number;
  z: number;
  color: string;
  kind: string;
}) {
  const height = kind === "king" ? 1.5 : kind === "queen" ? 1.35 : kind === "pawn" ? 0.8 : 1.05;
  const radius = kind === "pawn" ? 0.22 : 0.28;
  const emissive = sideColor(color);

  return (
    <Float speed={1.5} rotationIntensity={0.05} floatIntensity={0.08}>
      <group position={[x, z + height / 2, y]}>
        <mesh castShadow>
          <cylinderGeometry args={[radius * 1.04, radius * 1.18, height, 24]} />
          <meshStandardMaterial color={color} metalness={0.28} roughness={0.38} emissive={emissive} emissiveIntensity={0.08} />
        </mesh>
        <mesh position={[0, height / 2 + 0.14, 0]} castShadow>
          <sphereGeometry args={[radius * 0.44, 20, 20]} />
          <meshStandardMaterial color={color} metalness={0.2} roughness={0.25} emissive={emissive} emissiveIntensity={0.08} />
        </mesh>
      </group>
    </Float>
  );
}

function ArtifactMesh({ x, y, z }: { x: number; y: number; z: number }) {
  return (
    <Float speed={2} rotationIntensity={0.3} floatIntensity={0.35}>
      <group position={[x, z + 0.18, y]}>
        <mesh castShadow>
          <octahedronGeometry args={[0.28, 0]} />
          <meshStandardMaterial emissive="#f4c95d" emissiveIntensity={0.8} color="#5f4d1c" />
        </mesh>
        <mesh rotation={[Math.PI / 2, 0, 0]} position={[0, 0.02, 0]}>
          <torusGeometry args={[0.38, 0.03, 12, 42]} />
          <meshStandardMaterial color="#d1a83e" emissive="#f4c95d" emissiveIntensity={0.3} transparent opacity={0.9} />
        </mesh>
      </group>
    </Float>
  );
}

function Table() {
  return (
    <group position={[3.5, -0.68, 3.5]}>
      <mesh receiveShadow castShadow>
        <cylinderGeometry args={[7.2, 7.8, 0.8, 40]} />
        <meshStandardMaterial color="#0d0d0d" roughness={0.82} metalness={0.12} />
      </mesh>
      <mesh receiveShadow position={[0, -0.56, 0]}>
        <cylinderGeometry args={[2.1, 2.5, 0.42, 32]} />
        <meshStandardMaterial color="#111111" roughness={0.84} metalness={0.16} />
      </mesh>
    </group>
  );
}

function ChaosProps() {
  return (
    <>
      <Float speed={1.2} rotationIntensity={0.25} floatIntensity={0.4}>
        <mesh position={[-1.6, 1.25, -1.1]} castShadow>
          <dodecahedronGeometry args={[0.7, 0]} />
          <meshStandardMaterial color="#7560ff" emissive="#6a52ff" emissiveIntensity={0.9} roughness={0.24} />
        </mesh>
      </Float>
      <Float speed={1.6} rotationIntensity={0.2} floatIntensity={0.3}>
        <mesh position={[8.9, 1.15, 8.2]} rotation={[0, 0, Math.PI / 3]} castShadow>
          <torusKnotGeometry args={[0.44, 0.14, 110, 16]} />
          <meshStandardMaterial color="#ffdf8a" emissive="#f7cb51" emissiveIntensity={0.4} roughness={0.3} />
        </mesh>
      </Float>
      <mesh position={[3.5, 0.2, -2.2]} rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[1.2, 0.06, 18, 80]} />
        <meshStandardMaterial color="#58b1ff" emissive="#58b1ff" emissiveIntensity={1} transparent opacity={0.85} />
      </mesh>
      <mesh position={[3.5, 0.2, -2.2]} rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[1.65, 0.03, 18, 80]} />
        <meshStandardMaterial color="#58b1ff" emissive="#58b1ff" emissiveIntensity={0.7} transparent opacity={0.45} />
      </mesh>
    </>
  );
}

export function BoardScene({ worldState }: BoardSceneProps) {
  return (
    <div className="board-wrap">
      <Canvas camera={{ position: [0.8, 8.8, 11.5], fov: 34 }} shadows dpr={[1, 2]}>
        <color attach="background" args={["#020202"]} />
        <fog attach="fog" args={["#020202", 12, 28]} />
        <ambientLight intensity={0.42} />
        <directionalLight position={[8, 12, 6]} intensity={2.1} castShadow shadow-mapSize-width={2048} shadow-mapSize-height={2048} />
        <spotLight position={[-8, 11, 9]} intensity={35} angle={0.28} penumbra={0.6} color="#8cc9ff" />
        <spotLight position={[7, 9, -6]} intensity={22} angle={0.24} penumbra={0.7} color="#f4c95d" />
        <Sparkles count={28} scale={[18, 6, 18]} size={2.2} speed={0.2} color="#f4c95d" position={[0, 3, 0]} />
        <group rotation={[-0.08, Math.PI / 4, 0]}>
          <Table />
          <mesh receiveShadow position={[3.5, 0.04, 3.5]}>
            <boxGeometry args={[9.4, 0.18, 9.4]} />
            <meshStandardMaterial color="#101010" roughness={0.88} />
          </mesh>
          {Array.from({ length: 8 }, (_, rank) =>
            Array.from({ length: 8 }, (_, file) => (
              <BoardSquare key={`${file}-${rank}`} x={file} y={rank} dark={(file + rank) % 2 === 1} />
            ))
          )}
          {worldState.entities
            .filter((entity) => entity.status === "active" && entity.boardId === "main-board")
            .map((entity) => (
              <PieceMesh
                key={entity.id}
                x={entity.position.x}
                y={entity.position.y}
                z={entity.position.z ?? 0.5}
                color={entity.side === "white" ? "#ece7d7" : entity.side === "black" ? "#90372d" : "#7fd1ff"}
                kind={entity.kind}
              />
            ))}
          {worldState.artifacts
            .filter((artifact) => artifact.boardId === "main-board")
            .map((artifact) => (
              <ArtifactMesh key={artifact.id} x={artifact.position.x} y={artifact.position.y} z={artifact.position.z ?? 0.12} />
            ))}
          <ChaosProps />
        </group>
        <OrbitControls
          enablePan={false}
          minDistance={7}
          maxDistance={16}
          maxPolarAngle={Math.PI / 2.05}
          minPolarAngle={Math.PI / 3.3}
          target={[3.5, 0.8, 3.5]}
        />
      </Canvas>
    </div>
  );
}
