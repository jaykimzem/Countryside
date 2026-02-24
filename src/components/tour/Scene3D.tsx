'use client';

import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { OrbitControls, Environment } from '@react-three/drei';
import { useRef, useMemo, useState, useEffect, Suspense } from 'react';
import * as THREE from 'three';

// ============================================
// TYPES
// ============================================

interface Plot {
  id: string;
  plotNumber: string;
  zone: 'A' | 'B' | 'C' | 'SCHOOL' | 'NURSERY' | 'RESIDENTIAL' | 'EXTENSION';
  status: 'available' | 'reserved' | 'sold';
  price?: number;
  size?: number;
  position: [number, number, number];
  dimensions: [number, number];
  elevation: number;
}

interface Zone {
  id: string;
  name: string;
  color: string;
  position: [number, number, number];
  bounds: { min: [number, number]; max: [number, number]; };
  isOnOffer: boolean;
}

const ZONES: Zone[] = [
  { id: 'zone-a', name: 'Zone A', color: '#6b7280', position: [-8, 0.1, 6], bounds: { min: [-12, 2], max: [-4, 10] }, isOnOffer: false },
  { id: 'zone-b', name: 'Zone B', color: '#f97316', position: [0, 0.1, 6], bounds: { min: [-4, 2], max: [4, 10] }, isOnOffer: true },
  { id: 'zone-c', name: 'Zone C', color: '#14b8a6', position: [0, 0.1, -4], bounds: { min: [-6, -10], max: [6, 2] }, isOnOffer: true },
  { id: 'school', name: 'School Zone', color: '#8b5cf6', position: [10, 0.1, 0], bounds: { min: [6, -4], max: [14, 4] }, isOnOffer: false },
  { id: 'nursery', name: 'Nursery Zone', color: '#22c55e', position: [10, 0.1, -8], bounds: { min: [6, -12], max: [14, -4] }, isOnOffer: false },
  { id: 'extension', name: 'Extension Area', color: '#64748b', position: [-10, 0.1, -8], bounds: { min: [-16, -14], max: [-4, -2] }, isOnOffer: false },
];

// ============================================
// GENERATE PLOTS
// ============================================

function generatePlotsForZone(zone: Zone): Plot[] {
  const plots: Plot[] = [];
  const { bounds, id } = zone;
  const width = bounds.max[0] - bounds.min[0];
  const depth = bounds.max[1] - bounds.min[1];

  if (id === 'zone-b') {
    const cols = 6, rows = 5;
    const plotWidth = width / cols;
    const plotDepth = depth / rows;
    for (let row = 0; row < rows; row++) {
      for (let col = 0; col < cols; col++) {
        const plotId = 29300 + row * cols + col + 1;
        const x = bounds.min[0] + col * plotWidth + plotWidth / 2;
        const z = bounds.min[1] + row * plotDepth + plotDepth / 2;
        plots.push({
          id: `plot-${plotId}`, plotNumber: `${plotId}`, zone: 'B',
          status: Math.random() > 0.3 ? 'available' : 'reserved',
          price: 1000000, size: 0.25,
          position: [x, 0.15, z], dimensions: [plotWidth * 0.9, plotDepth * 0.9], elevation: 0.1,
        });
      }
    }
  } else if (id === 'zone-c') {
    const cols = 10, rows = 7;
    const plotWidth = width / cols;
    const plotDepth = depth / rows;
    for (let row = 0; row < rows; row++) {
      for (let col = 0; col < cols; col++) {
        const plotId = 29000 + row * cols + col + 1;
        const x = bounds.min[0] + col * plotWidth + plotWidth / 2;
        const z = bounds.min[1] + row * plotDepth + plotDepth / 2;
        plots.push({
          id: `plot-${plotId}`, plotNumber: `${plotId}`, zone: 'C',
          status: Math.random() > 0.2 ? 'available' : 'reserved',
          price: 750000, size: 0.2,
          position: [x, 0.15, z], dimensions: [plotWidth * 0.9, plotDepth * 0.9], elevation: 0.05,
        });
      }
    }
  }
  return plots;
}

// ============================================
// RIVER COMPONENT
// ============================================

function River() {
  const meshRef = useRef<THREE.Mesh>(null);
  const materialRef = useRef<THREE.ShaderMaterial | null>(null);

  const waterMaterial = useMemo(() => {
    const mat = new THREE.ShaderMaterial({
      uniforms: { time: { value: 0 }, color1: { value: new THREE.Color('#0ea5e9') }, color2: { value: new THREE.Color('#06b6d4') } },
      vertexShader: `varying vec2 vUv; void main() { vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }`,
      fragmentShader: `uniform float time; uniform vec3 color1; uniform vec3 color2; varying vec2 vUv; void main() { float wave = sin(vUv.x * 10.0 + time * 2.0) * 0.5 + 0.5; float wave2 = sin(vUv.y * 8.0 + time * 1.5) * 0.5 + 0.5; vec3 color = mix(color1, color2, wave * wave2); float alpha = 0.7 + wave * 0.2; gl_FragColor = vec4(color, alpha); }`,
      transparent: true,
    });
    materialRef.current = mat;
    return mat;
  }, []);

  useEffect(() => { materialRef.current = waterMaterial; }, [waterMaterial]);

  useFrame((state) => {
    if (materialRef.current && materialRef.current.uniforms) {
      materialRef.current.uniforms.time.value = state.clock.elapsedTime;
    }
  });

  return (
    <mesh ref={meshRef} position={[-14, 0.1, -8]} rotation={[-Math.PI / 2, 0, 0]}>
      <planeGeometry args={[4, 16, 32, 32]} />
      <primitive object={waterMaterial} attach="material" />
    </mesh>
  );
}

// ============================================
// PLOT MESH
// ============================================

function PlotMesh({ plot, isSelected, isHovered, onClick, onHover }: { plot: Plot; isSelected: boolean; isHovered: boolean; onClick: () => void; onHover: (hovered: boolean) => void }) {
  const meshRef = useRef<THREE.Mesh>(null);
  const zoneConfig = ZONES.find(z => z.id === `zone-${plot.zone.toLowerCase()}`);

  const baseColor = useMemo(() => {
    if (plot.status === 'sold') return '#6b7280';
    if (plot.status === 'reserved') return '#eab308';
    return zoneConfig?.color || '#14b8a6';
  }, [plot.status, plot.zone, zoneConfig]);

  useFrame(() => {
    if (meshRef.current) {
      const targetY = isSelected ? 0.5 : isHovered ? 0.3 : plot.elevation;
      meshRef.current.position.y = THREE.MathUtils.lerp(meshRef.current.position.y, targetY, 0.1);
    }
  });

  return (
    <mesh ref={meshRef} position={plot.position} onClick={onClick} onPointerEnter={() => onHover(true)} onPointerLeave={() => onHover(false)} castShadow receiveShadow>
      <boxGeometry args={[plot.dimensions[0], 0.2, plot.dimensions[1]]} />
      <meshStandardMaterial color={isHovered ? '#ffffff' : baseColor} metalness={0.1} roughness={0.8} emissive={isSelected ? '#ffffff' : baseColor} emissiveIntensity={isSelected ? 0.3 : 0} />
    </mesh>
  );
}

// ============================================
// ZONE AREA
// ============================================

function ZoneArea({ zone, isActive }: { zone: Zone; isActive: boolean }) {
  const meshRef = useRef<THREE.Mesh>(null);
  const width = zone.bounds.max[0] - zone.bounds.min[0];
  const depth = zone.bounds.max[1] - zone.bounds.min[1];

  useFrame(() => {
    if (meshRef.current && zone.isOnOffer) {
      const material = meshRef.current.material as THREE.MeshStandardMaterial;
      material.emissiveIntensity = 0.1 + Math.sin(Date.now() * 0.003) * 0.05;
    }
  });

  return (
    <mesh ref={meshRef} position={[zone.position[0], 0.02, zone.position[2]]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
      <planeGeometry args={[width, depth]} />
      <meshStandardMaterial color={zone.color} transparent opacity={isActive ? 0.6 : 0.3} emissive={zone.color} emissiveIntensity={zone.isOnOffer ? 0.1 : 0} />
    </mesh>
  );
}

// ============================================
// ROAD
// ============================================

function Road({ start, end, width, color }: { start: [number, number]; end: [number, number]; width: number; color: string }) {
  const length = Math.sqrt(Math.pow(end[0] - start[0], 2) + Math.pow(end[1] - start[1], 2));
  const angle = Math.atan2(end[1] - start[1], end[0] - start[0]);

  return (
    <mesh position={[(start[0] + end[0]) / 2, 0.05, (start[1] + end[1]) / 2]} rotation={[-Math.PI / 2, 0, angle]} receiveShadow>
      <planeGeometry args={[length, width]} />
      <meshStandardMaterial color={color} metalness={0.3} roughness={0.7} />
    </mesh>
  );
}

// ============================================
// TERRAIN
// ============================================

function Terrain() {
  const geometry = useMemo(() => {
    const geo = new THREE.PlaneGeometry(60, 50, 64, 64);
    const positions = geo.attributes.position.array as Float32Array;
    for (let i = 0; i < positions.length; i += 3) {
      const x = positions[i], y = positions[i + 1];
      positions[i + 2] = Math.sin(x * 0.1) * 0.3 + Math.cos(y * 0.08) * 0.2 + Math.sin(x * 0.05 + y * 0.05) * 0.4;
    }
    geo.computeVertexNormals();
    return geo;
  }, []);

  return (
    <mesh geometry={geometry} rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.5, 0]} receiveShadow>
      <meshStandardMaterial color="#4ade80" metalness={0.1} roughness={0.9} />
    </mesh>
  );
}

// ============================================
// CAMERA CONTROLLER
// ============================================

function CameraController({ isAutoRotating }: { isAutoRotating: boolean }) {
  const { camera } = useThree();

  useFrame(() => {
    if (isAutoRotating) {
      const time = Date.now() * 0.0002;
      const radius = 30;
      camera.position.set(Math.cos(time) * radius, 20, Math.sin(time) * radius);
      camera.lookAt(0, 0, 0);
    }
  });

  return null;
}

// ============================================
// SCENE CONTENT
// ============================================

function SceneContent({ activeZone, selectedPlot, onPlotSelect, onPlotHover, hoveredPlot }: { activeZone: string | null; selectedPlot: Plot | null; onPlotSelect: (plot: Plot | null) => void; onPlotHover: (plot: Plot | null) => void; hoveredPlot: Plot | null }) {
  const allPlots = useMemo(() => {
    const zoneB = ZONES.find(z => z.id === 'zone-b');
    const zoneC = ZONES.find(z => z.id === 'zone-c');
    return [...(zoneB ? generatePlotsForZone(zoneB) : []), ...(zoneC ? generatePlotsForZone(zoneC) : [])];
  }, []);

  return (
    <>
      <ambientLight intensity={0.4} />
      <directionalLight position={[20, 30, 10]} intensity={1} castShadow shadow-mapSize={[2048, 2048]} shadow-camera-far={100} shadow-camera-left={-30} shadow-camera-right={30} shadow-camera-top={30} shadow-camera-bottom={-30} />
      <pointLight position={[-10, 10, -10]} intensity={0.5} color="#fbbf24" />

      <Terrain />
      <River />

      {ZONES.map((zone) => <ZoneArea key={zone.id} zone={zone} isActive={activeZone === zone.id} />)}

      {/* Primary Roads */}
      <Road start={[-16, 0]} end={[16, 0]} width={1.5} color="#f97316" />
      <Road start={[0, -14]} end={[0, 12]} width={1.5} color="#f97316" />
      <Road start={[-10, -6]} end={[14, -6]} width={1} color="#f97316" />

      {/* Secondary Roads */}
      <Road start={[-12, 4]} end={[-4, 4]} width={0.8} color="#3b82f6" />
      <Road start={[-4, 4]} end={[4, 4]} width={0.8} color="#3b82f6" />
      <Road start={[4, 4]} end={[12, 4]} width={0.8} color="#3b82f6" />
      <Road start={[-10, -10]} end={[10, -10]} width={0.8} color="#3b82f6" />

      {allPlots.map((plot) => (
        <PlotMesh key={plot.id} plot={plot} isSelected={selectedPlot?.id === plot.id} isHovered={hoveredPlot?.id === plot.id} onClick={() => onPlotSelect(selectedPlot?.id === plot.id ? null : plot)} onHover={(hovered) => onPlotHover(hovered ? plot : null)} />
      ))}

      {/* School */}
      <mesh position={[10, 0.5, 0]} castShadow>
        <boxGeometry args={[6, 1, 6]} />
        <meshStandardMaterial color="#8b5cf6" />
      </mesh>

      {/* Trees */}
      {[...Array(5)].map((_, i) => (
        <mesh key={i} position={[8 + i * 1.2, 0.3, -8]} castShadow>
          <coneGeometry args={[0.4, 1, 8]} />
          <meshStandardMaterial color="#22c55e" />
        </mesh>
      ))}

      <Environment preset="sunset" />
    </>
  );
}

// ============================================
// MAIN EXPORT
// ============================================

export default function Scene3D({ activeZone, selectedPlot, onPlotSelect, isAutoRotating = false }: { activeZone: string | null; selectedPlot: Plot | null; onPlotSelect: (plot: Plot | null) => void; isAutoRotating?: boolean }) {
  const [hoveredPlot, setHoveredPlot] = useState<Plot | null>(null);

  return (
    <div className="w-full h-full">
      <Canvas shadows camera={{ position: [25, 25, 25], fov: 45 }} gl={{ antialias: true }}>
        <Suspense fallback={null}>
          <SceneContent activeZone={activeZone} selectedPlot={selectedPlot} onPlotSelect={onPlotSelect} onPlotHover={setHoveredPlot} hoveredPlot={hoveredPlot} />
          <CameraController isAutoRotating={isAutoRotating} />
          <OrbitControls enablePan={true} enableZoom={true} enableRotate={true} minDistance={10} maxDistance={50} minPolarAngle={Math.PI / 6} maxPolarAngle={Math.PI / 2.5} />
        </Suspense>
      </Canvas>

      {hoveredPlot && (
        <div className="absolute bottom-4 left-4 bg-black/80 text-white px-4 py-2 rounded-lg text-sm backdrop-blur-sm">
          <div className="font-semibold">Plot #{hoveredPlot.plotNumber}</div>
          <div>Zone {hoveredPlot.zone} • {hoveredPlot.size} acres</div>
          <div className="text-green-400">KES {hoveredPlot.price?.toLocaleString()}</div>
          <div className={`text-xs ${hoveredPlot.status === 'available' ? 'text-green-400' : 'text-yellow-400'}`}>{hoveredPlot.status === 'available' ? 'Available' : 'Reserved'}</div>
        </div>
      )}
    </div>
  );
}
