"use client";

import { Clone, ContactShadows, Float, OrbitControls, Sparkles, useGLTF } from "@react-three/drei";
import { Canvas } from "@react-three/fiber";

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

const PIECE_ASSET_PATHS = {
  white: {
    bishop: "/assets/chess-pieces/Bishop_White.glb",
    king: "/assets/chess-pieces/King_White.glb",
    knight: "/assets/chess-pieces/Knight_White.glb",
    pawn: "/assets/chess-pieces/Pawn_White.glb",
    queen: "/assets/chess-pieces/Queen_White.glb",
    rook: "/assets/chess-pieces/Rook_White.glb"
  },
  black: {
    bishop: "/assets/chess-pieces/Bishop_Black.glb",
    king: "/assets/chess-pieces/King_Black.glb",
    knight: "/assets/chess-pieces/Knight_Black.glb",
    pawn: "/assets/chess-pieces/Pawn_Black.glb",
    queen: "/assets/chess-pieces/Queen_Black.glb",
    rook: "/assets/chess-pieces/Rook_Black.glb"
  }
} as const;

const PIECE_SCALES = {
  bishop: 0.68,
  king: 0.72,
  knight: 0.66,
  pawn: 0.58,
  queen: 0.7,
  rook: 0.64
} as const;

function PieceMesh({
  x,
  y,
  z,
  side,
  kind
}: {
  x: number;
  y: number;
  z: number;
  side: "white" | "black" | "neutral";
  kind: string;
}) {
  const normalizedKind = (["bishop", "king", "knight", "pawn", "queen", "rook"].includes(kind) ? kind : "pawn") as keyof typeof PIECE_SCALES;
  const palette = side === "black" ? "black" : "white";
  const model = useGLTF(PIECE_ASSET_PATHS[palette][normalizedKind]);
  const scale = PIECE_SCALES[normalizedKind];
  const baseColor = side === "white" ? "#e7dcc3" : side === "black" ? "#4c211c" : "#62bdf4";

  return (
    <Float speed={1} rotationIntensity={0.008} floatIntensity={0.016}>
      <group position={[x, z - 0.08, y]} scale={scale}>
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.012, 0]} receiveShadow>
          <circleGeometry args={[0.47, 40]} />
          <meshStandardMaterial color={baseColor} transparent opacity={side === "neutral" ? 0.85 : 0.14} />
        </mesh>
        <Clone object={model.scene} castShadow receiveShadow />
        {side === "neutral" ? (
          <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.04, 0]}>
            <torusGeometry args={[0.52, 0.03, 12, 42]} />
            <meshStandardMaterial color="#62bdf4" emissive="#62bdf4" emissiveIntensity={0.7} transparent opacity={0.95} />
          </mesh>
        ) : null}
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

function CastleKitProps() {
  const gate = useGLTF("/assets/kenney/castle-kit/gate.glb");
  const arch = useGLTF("/assets/kenney/castle-kit/tower-square-arch.glb");
  const tower = useGLTF("/assets/kenney/castle-kit/wall-corner-half-tower.glb");
  const rocks = useGLTF("/assets/kenney/castle-kit/rocks-large.glb");
  const stairs = useGLTF("/assets/kenney/castle-kit/stairs-stone-square.glb");
  const trebuchet = useGLTF("/assets/kenney/castle-kit/siege-trebuchet-demolished.glb");
  const ground = useGLTF("/assets/kenney/castle-kit/ground-hills.glb");
  const tree = useGLTF("/assets/kenney/castle-kit/tree-large.glb");
  const banner = useGLTF("/assets/kenney/castle-kit/flag-banner-long.glb");
  const siegeTower = useGLTF("/assets/kenney/castle-kit/siege-tower-demolished.glb");

  return (
    <>
      <Clone object={ground.scene} position={[3.5, -0.24, 3.5]} scale={2.6} castShadow receiveShadow />
      <Clone object={gate.scene} position={[3.5, 0.18, -2.55]} rotation={[0, Math.PI, 0]} scale={0.88} castShadow receiveShadow />
      <Clone object={arch.scene} position={[3.5, 0.18, 9.55]} scale={0.92} castShadow receiveShadow />
      <Clone object={tower.scene} position={[-1.95, 0.18, 3.5]} rotation={[0, Math.PI / 2, 0]} scale={0.72} castShadow receiveShadow />
      <Clone object={tower.scene} position={[8.95, 0.18, 3.5]} rotation={[0, -Math.PI / 2, 0]} scale={0.72} castShadow receiveShadow />
      <Clone object={rocks.scene} position={[-2.6, 0.18, 8.9]} rotation={[0, Math.PI / 6, 0]} scale={0.95} castShadow receiveShadow />
      <Clone object={rocks.scene} position={[9.7, 0.18, -0.7]} rotation={[0, -Math.PI / 4, 0]} scale={0.82} castShadow receiveShadow />
      <Clone object={stairs.scene} position={[3.5, 0.18, -4.25]} rotation={[0, Math.PI, 0]} scale={0.9} castShadow receiveShadow />
      <Clone object={trebuchet.scene} position={[10.3, 0.18, 8.5]} rotation={[0, -Math.PI / 2.6, 0]} scale={0.52} castShadow receiveShadow />
      <Clone object={siegeTower.scene} position={[-3.7, 0.18, 9.7]} rotation={[0, Math.PI / 8, 0]} scale={0.58} castShadow receiveShadow />
      <Clone object={tree.scene} position={[-4.45, 0.18, 0.4]} rotation={[0, Math.PI / 7, 0]} scale={0.92} castShadow receiveShadow />
      <Clone object={tree.scene} position={[11.2, 0.18, 1.1]} rotation={[0, -Math.PI / 5, 0]} scale={0.78} castShadow receiveShadow />
      <Clone object={banner.scene} position={[-1.8, 1.45, 3.45]} rotation={[0, Math.PI / 2, 0]} scale={0.8} castShadow receiveShadow />
      <Clone object={banner.scene} position={[8.8, 1.45, 3.55]} rotation={[0, -Math.PI / 2, 0]} scale={0.8} castShadow receiveShadow />
    </>
  );
}

export function BoardScene({ worldState }: BoardSceneProps) {
  return (
    <div className="board-wrap">
      <Canvas camera={{ position: [0.8, 8.8, 11.5], fov: 34 }} shadows dpr={[1, 2]}>
        <color attach="background" args={["#020202"]} />
        <fog attach="fog" args={["#020202", 12, 28]} />
        <ambientLight intensity={0.6} />
        <hemisphereLight args={["#a6d7ff", "#0b0908", 0.55]} />
        <directionalLight
          position={[9, 13, 7]}
          intensity={2.4}
          castShadow
          shadow-mapSize-width={2048}
          shadow-mapSize-height={2048}
          shadow-bias={-0.00012}
          shadow-camera-left={-11}
          shadow-camera-right={11}
          shadow-camera-top={11}
          shadow-camera-bottom={-11}
          shadow-camera-near={1}
          shadow-camera-far={32}
        />
        <spotLight position={[-9, 10, 8]} intensity={12} angle={0.34} penumbra={0.75} color="#7dbfff" />
        <spotLight position={[8, 8, -5]} intensity={9} angle={0.28} penumbra={0.8} color="#f4c95d" />
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
                side={entity.side}
                kind={entity.kind}
              />
            ))}
          {worldState.artifacts
            .filter((artifact) => artifact.boardId === "main-board")
            .map((artifact) => (
              <ArtifactMesh key={artifact.id} x={artifact.position.x} y={artifact.position.y} z={artifact.position.z ?? 0.12} />
            ))}
          <ContactShadows
            position={[3.5, 0.22, 3.5]}
            scale={11}
            opacity={0.4}
            blur={2.8}
            far={12}
            resolution={1024}
            color="#000000"
          />
          <CastleKitProps />
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

useGLTF.preload("/assets/kenney/castle-kit/gate.glb");
useGLTF.preload("/assets/kenney/castle-kit/tower-square-arch.glb");
useGLTF.preload("/assets/kenney/castle-kit/wall-corner-half-tower.glb");
useGLTF.preload("/assets/kenney/castle-kit/rocks-large.glb");
useGLTF.preload("/assets/kenney/castle-kit/stairs-stone-square.glb");
useGLTF.preload("/assets/kenney/castle-kit/siege-trebuchet-demolished.glb");
useGLTF.preload("/assets/kenney/castle-kit/ground-hills.glb");
useGLTF.preload("/assets/kenney/castle-kit/tree-large.glb");
useGLTF.preload("/assets/kenney/castle-kit/flag-banner-long.glb");
useGLTF.preload("/assets/kenney/castle-kit/siege-tower-demolished.glb");
useGLTF.preload("/assets/chess-pieces/Bishop_Black.glb");
useGLTF.preload("/assets/chess-pieces/Bishop_White.glb");
useGLTF.preload("/assets/chess-pieces/King_Black.glb");
useGLTF.preload("/assets/chess-pieces/King_White.glb");
useGLTF.preload("/assets/chess-pieces/Knight_Black.glb");
useGLTF.preload("/assets/chess-pieces/Knight_White.glb");
useGLTF.preload("/assets/chess-pieces/Pawn_Black.glb");
useGLTF.preload("/assets/chess-pieces/Pawn_White.glb");
useGLTF.preload("/assets/chess-pieces/Queen_Black.glb");
useGLTF.preload("/assets/chess-pieces/Queen_White.glb");
useGLTF.preload("/assets/chess-pieces/Rook_Black.glb");
useGLTF.preload("/assets/chess-pieces/Rook_White.glb");
