'use client';

import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { OrbitControls, Html, Sky, Stars } from '@react-three/drei';
import { useRef, useMemo, useState, Suspense, useCallback, useEffect } from 'react';
import * as THREE from 'three';
import type { PlotData, SpecialBlock } from '@/lib/plotData';
import { ALL_PLOTS, SPECIAL_BLOCKS, ROADS } from '@/lib/plotData';

// ============================================================
// CONSTANTS — Isinya terrain aesthetics
// ============================================================

const SOIL_COLOR = new THREE.Color('#B0622A');      // red-brown laterite
const SOIL_COLOR_DARK = new THREE.Color('#7A3E18'); // darker wet areas
const GRASS_COLOR = new THREE.Color('#A89040');     // dry savanna grass
const ROAD_MURRAM = new THREE.Color('#C89060');     // murram/gravel road
const ROAD_PAVED = new THREE.Color('#7A6850');      // paved road/tarmac
const SKY_HAZE = new THREE.Color('#E8D8B0');        // horizon haze colour

// Plot visual elevation above terrain
const PLOT_Y = 0.25;

const ZONE_COLORS: Record<string, string> = {
  A: '#D97706',
  B: '#F97316',
  C: '#14B8A6',
  D: '#8B5CF6',
  SCHOOL: '#EC4899',
  COMMERCIAL: '#F59E0B',
};

const STATUS_COLORS: Record<string, string> = {
  available: '#22C55E',
  reserved: '#EAB308',
  sold: '#6B7280',
};

// ============================================================
// TERRAIN — authentic Isinya rolling savanna
// ============================================================

function IsinyaTerrain() {
  const ref = useRef<THREE.Mesh>(null);

  const geometry = useMemo(() => {
    const SEGS = 160;
    const geo = new THREE.PlaneGeometry(120, 90, SEGS, SEGS);
    const pos = geo.attributes.position.array as Float32Array;
    const colors = new Float32Array((pos.length / 3) * 3);

    for (let i = 0; i < pos.length; i += 3) {
      const px = pos[i];
      const py = pos[i + 1];

      // Gentle Isinya plateau — mostly flat with subtle undulation
      const h =
        Math.sin(px * 0.04) * 0.8 +
        Math.cos(py * 0.035) * 0.6 +
        Math.sin(px * 0.08 + py * 0.065) * 0.35 +
        Math.cos(px * 0.018 - py * 0.03) * 0.5 +
        Math.sin(px * 0.13 + 1.2) * 0.15 +
        Math.cos(py * 0.11 + 0.7) * 0.1;

      pos[i + 2] = h;

      // Vertex colour: red-brown soil with subtle grass variation
      const t = Math.max(0, Math.min(1, (h + 1.0) / 2.5));
      const soilR = 0.69, soilG = 0.38, soilB = 0.16;
      const grassR = 0.67, grassG = 0.55, grassB = 0.25;
      const vi = (i / 3) * 3;
      colors[vi]     = THREE.MathUtils.lerp(soilR, grassR, t * 0.5);
      colors[vi + 1] = THREE.MathUtils.lerp(soilG, grassG, t * 0.5);
      colors[vi + 2] = THREE.MathUtils.lerp(soilB, grassB, t * 0.5);
    }
    geo.setAttribute('color', new THREE.BufferAttribute(colors, 3));
    geo.computeVertexNormals();
    return geo;
  }, []);

  return (
    <mesh
      ref={ref}
      geometry={geometry}
      rotation={[-Math.PI / 2, 0, 0]}
      position={[0, -0.5, 0]}
      receiveShadow
    >
      <meshStandardMaterial
        vertexColors
        roughness={0.97}
        metalness={0.0}
      />
    </mesh>
  );
}

// ============================================================
// ACACIA TREE — iconic flat-top African tree
// ============================================================

function AcaciaTree({ position, scale = 1.0 }: { position: [number, number, number]; scale?: number }) {
  return (
    <group position={position} scale={[scale, scale, scale]}>
      {/* Trunk */}
      <mesh position={[0, 0.75, 0]} castShadow>
        <cylinderGeometry args={[0.06, 0.10, 1.5, 7]} />
        <meshStandardMaterial color="#4A2A0A" roughness={0.95} />
      </mesh>
      {/* Lower branches spread */}
      <mesh position={[0, 1.82, 0]} castShadow>
        <cylinderGeometry args={[1.0, 0.4, 0.32, 12]} />
        <meshStandardMaterial color="#5C6B2A" roughness={0.88} />
      </mesh>
      {/* Top canopy — flat umbrella */}
      <mesh position={[0, 2.0, 0]} castShadow>
        <cylinderGeometry args={[1.25, 0.95, 0.18, 14]} />
        <meshStandardMaterial color="#6E7E30" roughness={0.85} />
      </mesh>
      {/* Highlight fringe */}
      <mesh position={[0, 1.95, 0]} castShadow>
        <cylinderGeometry args={[1.35, 1.0, 0.08, 14]} />
        <meshStandardMaterial color="#8A9A42" roughness={0.82} transparent opacity={0.7} />
      </mesh>
    </group>
  );
}

// ============================================================
// THORN BUSH
// ============================================================

function ThornBush({ position }: { position: [number, number, number] }) {
  return (
    <group position={position}>
      <mesh position={[0, 0.25, 0]}>
        <sphereGeometry args={[0.35, 8, 6]} />
        <meshStandardMaterial color="#5A6020" roughness={0.9} />
      </mesh>
      <mesh position={[0.2, 0.18, 0.15]}>
        <sphereGeometry args={[0.22, 7, 5]} />
        <meshStandardMaterial color="#484D18" roughness={0.92} />
      </mesh>
    </group>
  );
}

// ============================================================
// ROCK OUTCROP
// ============================================================

function Rock({ position, scale = 1 }: { position: [number, number, number]; scale?: number }) {
  return (
    <group position={position} scale={[scale, scale * 0.55, scale]}>
      <mesh>
        <dodecahedronGeometry args={[0.45, 0]} />
        <meshStandardMaterial color="#8B7355" roughness={0.98} metalness={0.02} />
      </mesh>
    </group>
  );
}

// ============================================================
// DISTANT HILLS — Ngong Hills / escarpment silhouette
// ============================================================

function DistantHills() {
  const hillChain = useMemo(() => {
    const hills: { x: number; z: number; sx: number; sy: number; sz: number }[] = [];
    for (let i = 0; i < 12; i++) {
      hills.push({
        x: -60 + i * 12 + Math.sin(i * 1.7) * 4,
        z: -55,
        sx: 16 + Math.cos(i * 1.3) * 4,
        sy: 7 + Math.sin(i * 2.1) * 3,
        sz: 5,
      });
    }
    return hills;
  }, []);

  return (
    <group>
      {hillChain.map((h, i) => (
        <mesh key={i} position={[h.x, h.sy / 2 - 0.8, h.z]}>
          <ellipsoidGeometry args={[h.sx, h.sy, h.sz] as never} />
          <meshStandardMaterial color="#7A8B65" roughness={1} metalness={0} fog />
        </mesh>
      ))}
    </group>
  );
}

// Use sphere approximation for hills since ellipsoid isn't standard
function HillRange() {
  const hills = useMemo(() => {
    return Array.from({ length: 10 }, (_, i) => ({
      x: -55 + i * 13 + Math.sin(i * 1.7) * 5,
      y: 3.5 + Math.sin(i * 2.1) * 2,
      z: -52,
      sx: 12 + Math.cos(i * 1.3) * 3,
      sy: 7 + Math.sin(i * 2.1) * 2.5,
    }));
  }, []);

  return (
    <group>
      {hills.map((h, i) => (
        <mesh key={i} position={[h.x, h.y - 6, h.z]} scale={[h.sx, h.sy, 5]}>
          <sphereGeometry args={[1, 12, 8]} />
          <meshStandardMaterial color="#6A7A58" roughness={1} fog />
        </mesh>
      ))}
    </group>
  );
}

// ============================================================
// ROAD SEGMENT
// ============================================================

function RoadSegment({
  x1, z1, x2, z2, width, isPrimary = false,
}: {
  x1: number; z1: number; x2: number; z2: number; width: number; isPrimary?: boolean;
}) {
  const length = Math.sqrt((x2 - x1) ** 2 + (z2 - z1) ** 2);
  const angle = Math.atan2(z2 - z1, x2 - x1);
  const cx = (x1 + x2) / 2;
  const cz = (z1 + z2) / 2;

  return (
    <mesh
      position={[cx, -0.12, cz]}
      rotation={[-Math.PI / 2, 0, -angle]}
      receiveShadow
    >
      <planeGeometry args={[length, width]} />
      <meshStandardMaterial
        color={isPrimary ? ROAD_PAVED : ROAD_MURRAM}
        roughness={0.9}
        metalness={0.05}
      />
    </mesh>
  );
}

// ============================================================
// SPECIAL BLOCK (School / Commercial)
// ============================================================

function SpecialBlockMesh({ block }: { block: SpecialBlock }) {
  const [hovered, setHovered] = useState(false);
  return (
    <group>
      <mesh
        position={[block.x, 0.08, block.z]}
        rotation={[-Math.PI / 2, 0, 0]}
        onPointerOver={() => setHovered(true)}
        onPointerOut={() => setHovered(false)}
      >
        <planeGeometry args={[block.width, block.depth]} />
        <meshStandardMaterial
          color={block.color}
          transparent
          opacity={hovered ? 0.75 : 0.45}
          roughness={0.8}
        />
      </mesh>
      {/* Raised outline box */}
      <mesh position={[block.x, 0.25, block.z]} castShadow>
        <boxGeometry args={[block.width, 0.3, block.depth]} />
        <meshStandardMaterial color={block.color} transparent opacity={0.55} roughness={0.7} />
      </mesh>
      {/* Label */}
      <Html
        position={[block.x, 1.6, block.z]}
        center
        distanceFactor={22}
        style={{ pointerEvents: 'none' }}
      >
        <div
          style={{
            background: block.color,
            color: '#fff',
            padding: '3px 8px',
            borderRadius: 6,
            fontSize: 11,
            fontWeight: 700,
            whiteSpace: 'nowrap',
            boxShadow: '0 2px 8px rgba(0,0,0,0.5)',
            fontFamily: 'sans-serif',
          }}
        >
          {block.label}
        </div>
      </Html>
    </group>
  );
}

// ============================================================
// INDIVIDUAL PLOT MESH
// ============================================================

function PlotMesh({
  plot,
  isSelected,
  isHovered,
  onClick,
  onHoverChange,
}: {
  plot: PlotData;
  isSelected: boolean;
  isHovered: boolean;
  onClick: () => void;
  onHoverChange: (h: boolean) => void;
}) {
  const meshRef = useRef<THREE.Mesh>(null);
  const pulseRef = useRef(0);

  const baseColor = useMemo(() => {
    if (isSelected) return '#FFFFFF';
    if (isHovered) return '#FFE082';
    return STATUS_COLORS[plot.status];
  }, [isSelected, isHovered, plot.status]);

  const zoneColor = ZONE_COLORS[plot.zone] || '#888';

  useFrame((state) => {
    if (!meshRef.current) return;
    const targetY = isSelected ? 0.55 : isHovered ? 0.35 : 0.08;
    meshRef.current.position.y = THREE.MathUtils.lerp(
      meshRef.current.position.y,
      targetY,
      0.12
    );
    if (isSelected) {
      pulseRef.current = state.clock.elapsedTime;
      const mat = meshRef.current.material as THREE.MeshStandardMaterial;
      mat.emissiveIntensity = 0.3 + Math.sin(pulseRef.current * 3) * 0.15;
    }
  });

  return (
    <group>
      {/* Ground fill for this plot */}
      <mesh position={[plot.x, PLOT_Y - 0.12, plot.z]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[plot.width, plot.depth]} />
        <meshStandardMaterial
          color={plot.status === 'available' ? '#C8D8A0' : plot.status === 'reserved' ? '#F5E090' : '#9AA0A8'}
          roughness={0.95}
          transparent
          opacity={0.6}
        />
      </mesh>

      {/* Raised plot slab */}
      <mesh
        ref={meshRef}
        position={[plot.x, PLOT_Y, plot.z]}
        onClick={(e) => { e.stopPropagation(); onClick(); }}
        onPointerOver={(e) => { e.stopPropagation(); onHoverChange(true); document.body.style.cursor = 'pointer'; }}
        onPointerOut={() => { onHoverChange(false); document.body.style.cursor = 'auto'; }}
        castShadow
        receiveShadow
      >
        <boxGeometry args={[plot.width, 0.18, plot.depth]} />
        <meshStandardMaterial
          color={baseColor}
          roughness={0.6}
          metalness={0.08}
          emissive={isSelected ? new THREE.Color(zoneColor) : new THREE.Color('#000000')}
          emissiveIntensity={isSelected ? 0.3 : 0}
        />
      </mesh>

      {/* Zone-colour border frame */}
      <lineSegments position={[plot.x, PLOT_Y + 0.01, plot.z]}>
        <edgesGeometry args={[new THREE.BoxGeometry(plot.width + 0.03, 0.2, plot.depth + 0.03)]} />
        <lineBasicMaterial color={zoneColor} linewidth={1} />
      </lineSegments>

      {/* Floating plot number label (visible at medium zoom) */}
      <Html
        position={[plot.x, PLOT_Y + 0.85, plot.z]}
        center
        distanceFactor={18}
        style={{ pointerEvents: 'none' }}
      >
        <div
          style={{
            background: isSelected
              ? zoneColor
              : isHovered
              ? 'rgba(0,0,0,0.85)'
              : 'rgba(0,0,0,0.65)',
            color: '#fff',
            padding: '2px 5px',
            borderRadius: 4,
            fontSize: 9,
            fontWeight: 600,
            whiteSpace: 'nowrap',
            letterSpacing: 0.3,
            fontFamily: 'sans-serif',
            border: isSelected ? `1px solid ${zoneColor}` : 'none',
            transition: 'all 0.2s',
          }}
        >
          {plot.plotNumber}
        </div>
      </Html>
    </group>
  );
}

// ============================================================
// COMPASS ROSE (decorative)
// ============================================================

function CompassRose() {
  return (
    <Html position={[22, 0.5, -20]} distanceFactor={30} style={{ pointerEvents: 'none' }}>
      <div style={{
        width: 48, height: 48,
        background: 'rgba(0,0,0,0.7)',
        borderRadius: '50%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        border: '2px solid rgba(255,255,255,0.3)',
        color: '#fff',
        fontFamily: 'sans-serif',
        fontSize: 10,
        fontWeight: 700,
        flexDirection: 'column',
      }}>
        <span style={{ color: '#EF4444', lineHeight: 1 }}>N</span>
        <span style={{ fontSize: 18, lineHeight: 1 }}>↑</span>
      </div>
    </Html>
  );
}

// ============================================================
// SCALE BAR
// ============================================================

function ScaleBar() {
  return (
    <Html position={[-26, 0.2, -22]} distanceFactor={30} style={{ pointerEvents: 'none' }}>
      <div style={{
        background: 'rgba(0,0,0,0.7)',
        color: '#fff',
        padding: '4px 8px',
        borderRadius: 5,
        fontSize: 9,
        fontFamily: 'sans-serif',
        border: '1px solid rgba(255,255,255,0.25)',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginBottom: 2 }}>
          <div style={{ width: 40, height: 4, background: 'white', borderRadius: 1 }} />
          <span>200 m</span>
        </div>
        <div>Scale 1:2000</div>
      </div>
    </Html>
  );
}

// ============================================================
// SCENE CONTENT
// ============================================================

function SceneContent({
  selectedPlotId,
  onPlotSelect,
  highlightZone,
}: {
  selectedPlotId: string | null;
  onPlotSelect: (p: PlotData | null) => void;
  highlightZone: string | null;
}) {
  const [hoveredId, setHoveredId] = useState<string | null>(null);

  const filteredPlots = useMemo(() => {
    if (!highlightZone) return ALL_PLOTS;
    return ALL_PLOTS.filter(p => p.zone === highlightZone);
  }, [highlightZone]);

  const handlePlotClick = useCallback((plot: PlotData) => {
    onPlotSelect(selectedPlotId === plot.id ? null : plot);
  }, [selectedPlotId, onPlotSelect]);

  return (
    <>
      {/* ── LIGHTING ── */}
      {/* Key light: African sun from ESE, warm golden */}
      <directionalLight
        position={[40, 50, 15]}
        intensity={3.2}
        color="#FFCB80"
        castShadow
        shadow-mapSize={[4096, 4096]}
        shadow-camera-far={220}
        shadow-camera-left={-65}
        shadow-camera-right={65}
        shadow-camera-top={65}
        shadow-camera-bottom={-65}
        shadow-bias={-0.0005}
      />
      {/* Cool fill from opposite side */}
      <directionalLight position={[-30, 18, -15]} intensity={0.6} color="#C8D8FF" />
      {/* Hemisphere: warm African sky above, red earth below */}
      <hemisphereLight args={['#5BA3D9', '#C06828', 1.1]} />
      {/* Ground bounce */}
      <pointLight position={[0, 3, 0]} intensity={0.5} color="#E08030" distance={80} />

      {/* ── TERRAIN ── */}
      <IsinyaTerrain />

      {/* ── DISTANT HILLS ── */}
      <HillRange />

      {/* ── ROADS ── */}
      {ROADS.map(([x1, z1, x2, z2, w], i) => (
        <RoadSegment
          key={i}
          x1={x1} z1={z1} x2={x2} z2={z2}
          width={w}
          isPrimary={w >= 1.8}
        />
      ))}

      {/* ── SPECIAL BLOCKS ── */}
      {SPECIAL_BLOCKS.map(b => (
        <SpecialBlockMesh key={b.id} block={b} />
      ))}

      {/* ── PLOTS ── */}
      {filteredPlots.map(plot => (
        <PlotMesh
          key={plot.id}
          plot={plot}
          isSelected={selectedPlotId === plot.id}
          isHovered={hoveredId === plot.id}
          onClick={() => handlePlotClick(plot)}
          onHoverChange={(h) => setHoveredId(h ? plot.id : null)}
        />
      ))}

      {/* ── ACACIA TREES (perimeter & non-plot areas) ── */}
      {/* Western perimeter */}
      {[-18, -14, -10, -6, -2, 2, 6, 10].map((z, i) => (
        <AcaciaTree key={`tw-${i}`} position={[-31, -0.3, z]} scale={0.9 + Math.sin(i * 1.3) * 0.2} />
      ))}
      {/* Eastern perimeter */}
      {[-16, -12, -8, -4, 0, 4, 8, 12].map((z, i) => (
        <AcaciaTree key={`te-${i}`} position={[25, -0.3, z]} scale={0.8 + Math.sin(i * 1.7) * 0.2} />
      ))}
      {/* Southern belt */}
      {[-24, -18, -12, -6, 0, 6, 12, 18].map((x, i) => (
        <AcaciaTree key={`ts-${i}`} position={[x, -0.3, -23]} scale={1.0 + Math.cos(i * 1.4) * 0.25} />
      ))}
      {/* Northern belt */}
      {[-22, -16, -10, -4, 2, 8, 14, 20].map((x, i) => (
        <AcaciaTree key={`tn-${i}`} position={[x, -0.3, 17]} scale={0.85 + Math.sin(i * 1.1) * 0.2} />
      ))}
      {/* Scattered interior trees in non-plot areas */}
      <AcaciaTree position={[-2, 0, 8]} scale={0.8} />
      <AcaciaTree position={[-3.5, 0, -6]} scale={1.1} />
      <AcaciaTree position={[-3, 0, -13]} scale={0.9} />
      <AcaciaTree position={[-6.5, 0, -5]} scale={0.75} />

      {/* Thorn bushes */}
      {[[-28, 0], [-25, -5], [23, -10], [23, 5], [-28, 10], [0, 16], [10, 16], [-15, 16]].map(
        ([x, z], i) => (
          <ThornBush key={`b-${i}`} position={[x as number, 0, z as number]} />
        )
      )}

      {/* Rocks */}
      {[[-30, -8, 1.2], [-28, -15, 0.8], [24, 8, 1.0], [-12, -20, 0.9], [20, -20, 1.1]].map(
        ([x, z, s], i) => (
          <Rock key={`r-${i}`} position={[x as number, 0, z as number]} scale={s as number} />
        )
      )}

      {/* ── DECORATIVE ELEMENTS ── */}
      <CompassRose />
      <ScaleBar />

      {/* ── SKY ── vivid African daytime sky */}
      <Sky
        distance={4500}
        sunPosition={[2, 0.6, 1]}
        turbidity={5}
        rayleigh={1.5}
        mieCoefficient={0.004}
        mieDirectionalG={0.85}
        exposure={0.5}
      />

      {/* Warm horizon haze */}
      <fog attach="fog" args={['#D4C8A8', 70, 200]} />
    </>
  );
}

// ============================================================
// CAMERA CONTROLLER
// ============================================================

function CameraController({
  isAutoRotating,
  targetPosition,
}: {
  isAutoRotating: boolean;
  targetPosition: [number, number, number] | null;
}) {
  const { camera } = useThree();
  const startTime = useRef<number | null>(null);

  useEffect(() => {
    // Fly-in animation on mount
    camera.position.set(0, 60, 60);
    camera.lookAt(0, 0, 0);
  }, [camera]);

  useFrame((state) => {
    if (isAutoRotating) {
      const t = state.clock.elapsedTime * 0.06;
      const radius = 58;
      camera.position.set(
        Math.cos(t) * radius,
        28 + Math.sin(t * 0.4) * 4,
        Math.sin(t) * radius
      );
      camera.lookAt(0, 0, 0);
    }
  });

  return null;
}

// ============================================================
// MAIN EXPORT
// ============================================================

interface Scene3DProps {
  selectedPlotId: string | null;
  onPlotSelect: (plot: PlotData | null) => void;
  highlightZone: string | null;
  isAutoRotating: boolean;
}

export default function Scene3D({
  selectedPlotId,
  onPlotSelect,
  highlightZone,
  isAutoRotating,
}: Scene3DProps) {
  return (
    <div style={{ width: '100%', height: '100%', background: 'linear-gradient(to bottom, #4A90C4 0%, #87CEEB 40%, #D4B896 100%)' }}>
      <Canvas
        shadows
        camera={{ position: [0, 52, 52], fov: 44 }}
        gl={{
          antialias: true,
          alpha: false,
          toneMapping: THREE.ACESFilmicToneMapping,
          toneMappingExposure: 1.2,
        }}
        onPointerMissed={() => onPlotSelect(null)}
      >
        <Suspense fallback={null}>
          <SceneContent
            selectedPlotId={selectedPlotId}
            onPlotSelect={onPlotSelect}
            highlightZone={highlightZone}
          />
          <CameraController
            isAutoRotating={isAutoRotating}
            targetPosition={null}
          />
          <OrbitControls
            enablePan
            enableZoom
            enableRotate
            minDistance={8}
            maxDistance={85}
            minPolarAngle={Math.PI / 9}
            maxPolarAngle={Math.PI / 2.15}
            target={[0, 0, 0]}
          />
        </Suspense>
      </Canvas>
    </div>
  );
}
