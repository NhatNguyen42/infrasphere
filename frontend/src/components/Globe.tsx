"use client";
/**
 * Globe — interactive 3D infrastructure globe using React Three Fiber.
 * Shows data-centre clusters, power plants, renewables, grid hubs,
 * and animated energy-flow arcs between them.
 */
import React, { useRef, useMemo, useState, useCallback } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { OrbitControls, Stars, Line, Html } from "@react-three/drei";
import * as THREE from "three";

import type { InfraNode, Connection } from "@/lib/api";
import {
  latLngToVector3,
  generateArcPoints,
  nodeColor,
  nodeSize,
} from "@/lib/globe-utils";

// ---------------------------------------------------------------------------
// Sub-components (inside Canvas)
// ---------------------------------------------------------------------------

/** The earth sphere with atmosphere glow. */
function Earth() {
  const meshRef = useRef<THREE.Mesh>(null);

  useFrame((_, delta) => {
    if (meshRef.current) {
      meshRef.current.rotation.y += delta * 0.02; // slow auto-rotate
    }
  });

  return (
    <group>
      {/* Globe body */}
      <mesh ref={meshRef}>
        <sphereGeometry args={[1, 64, 64]} />
        <meshStandardMaterial
          color="#0f172a"
          roughness={0.9}
          metalness={0.1}
        />
      </mesh>

      {/* Wireframe overlay */}
      <mesh>
        <sphereGeometry args={[1.002, 36, 18]} />
        <meshBasicMaterial
          color="#1e3a5f"
          wireframe
          transparent
          opacity={0.12}
        />
      </mesh>

      {/* Atmosphere glow */}
      <mesh>
        <sphereGeometry args={[1.08, 64, 64]} />
        <meshBasicMaterial
          color="#1e40af"
          transparent
          opacity={0.06}
          side={THREE.BackSide}
        />
      </mesh>
    </group>
  );
}

/** Glowing marker for an infrastructure node. */
function NodeMarker({
  node,
  onHover,
  onClick,
}: {
  node: InfraNode;
  onHover: (node: InfraNode | null) => void;
  onClick: (node: InfraNode) => void;
}) {
  const pos = useMemo(
    () => latLngToVector3(node.lat, node.lng, 1.01),
    [node.lat, node.lng]
  );
  const color = nodeColor(node.type);
  const size = nodeSize(node.type) * 0.018;
  const ref = useRef<THREE.Mesh>(null);

  useFrame((state) => {
    if (ref.current) {
      const s = 1 + Math.sin(state.clock.elapsedTime * 2 + pos.x * 10) * 0.15;
      ref.current.scale.setScalar(s);
    }
  });

  return (
    <mesh
      ref={ref}
      position={pos}
      onPointerEnter={() => onHover(node)}
      onPointerLeave={() => onHover(null)}
      onClick={() => onClick(node)}
    >
      <sphereGeometry args={[size, 12, 12]} />
      <meshBasicMaterial color={color} />
      {/* Point light for glow */}
      <pointLight color={color} intensity={0.3} distance={0.15} />
    </mesh>
  );
}

/** Animated arc between two nodes. */
function ArcConnection({
  from,
  to,
  flow,
  capacity,
}: {
  from: InfraNode;
  to: InfraNode;
  flow: number;
  capacity: number;
}) {
  const points = useMemo(() => {
    const start = latLngToVector3(from.lat, from.lng, 1.01);
    const end = latLngToVector3(to.lat, to.lng, 1.01);
    return generateArcPoints(start, end, 48, 0.12);
  }, [from, to]);

  const opacity = Math.min(flow / Math.max(capacity, 1), 1) * 0.6 + 0.2;

  return (
    <Line
      points={points}
      color="#3b82f6"
      lineWidth={1.2}
      transparent
      opacity={opacity}
      dashed
      dashScale={8}
      dashSize={0.03}
      gapSize={0.02}
    />
  );
}

/** Floating tooltip when hovering a node. */
function NodeTooltip({ node }: { node: InfraNode }) {
  const pos = latLngToVector3(node.lat, node.lng, 1.15);

  return (
    <Html position={pos} center distanceFactor={3}>
      <div
        style={{
          background: "rgba(10,10,30,0.92)",
          border: "1px solid rgba(255,255,255,0.15)",
          borderRadius: 10,
          padding: "10px 14px",
          color: "#f1f5f9",
          fontSize: 12,
          lineHeight: 1.5,
          maxWidth: 220,
          pointerEvents: "none",
          whiteSpace: "nowrap",
          backdropFilter: "blur(8px)",
        }}
      >
        <div style={{ fontWeight: 700, fontSize: 13, marginBottom: 2, color: nodeColor(node.type) }}>
          {node.name}
        </div>
        <div style={{ color: "#94a3b8" }}>
          {node.type.replace("_", " ").toUpperCase()} &middot; {node.subtype}
        </div>
        <div>Capacity: {node.capacity_mw.toLocaleString()} MW</div>
        <div>Utilization: {(node.utilization * 100).toFixed(0)}%</div>
        <div>Renewable: {(node.renewable_pct * 100).toFixed(0)}%</div>
        <div style={{ color: "#94a3b8", fontSize: 11 }}>{node.operator}</div>
      </div>
    </Html>
  );
}

// ---------------------------------------------------------------------------
// Scene — composed inside <Canvas>
// ---------------------------------------------------------------------------
function GlobeScene({
  nodes,
  connections,
  onNodeClick,
}: {
  nodes: InfraNode[];
  connections: Connection[];
  onNodeClick: (node: InfraNode) => void;
}) {
  const [hoveredNode, setHoveredNode] = useState<InfraNode | null>(null);

  const nodeMap = useMemo(() => {
    const m: Record<string, InfraNode> = {};
    nodes.forEach((n) => (m[n.id] = n));
    return m;
  }, [nodes]);

  return (
    <>
      <ambientLight intensity={0.35} />
      <directionalLight position={[5, 3, 5]} intensity={0.8} />
      <Stars radius={80} depth={60} count={2500} factor={3} fade speed={0.5} />

      <Earth />

      {nodes.map((n) => (
        <NodeMarker
          key={n.id}
          node={n}
          onHover={setHoveredNode}
          onClick={onNodeClick}
        />
      ))}

      {connections.map((c) => {
        const from = nodeMap[c.from_id];
        const to = nodeMap[c.to_id];
        if (!from || !to) return null;
        return (
          <ArcConnection
            key={c.id}
            from={from}
            to={to}
            flow={c.flow_mw}
            capacity={c.capacity_mw}
          />
        );
      })}

      {hoveredNode && <NodeTooltip node={hoveredNode} />}

      <OrbitControls
        enablePan={false}
        enableZoom={true}
        minDistance={1.5}
        maxDistance={4}
        autoRotate
        autoRotateSpeed={0.3}
        enableDamping
      />
    </>
  );
}

// ---------------------------------------------------------------------------
// Exported component
// ---------------------------------------------------------------------------
interface GlobeProps {
  nodes: InfraNode[];
  connections: Connection[];
  onNodeClick?: (node: InfraNode) => void;
}

export default function Globe({ nodes, connections, onNodeClick }: GlobeProps) {
  const handleClick = useCallback(
    (node: InfraNode) => onNodeClick?.(node),
    [onNodeClick]
  );

  return (
    <div style={{ width: "100%", height: "100%", minHeight: 400 }}>
      <Canvas
        camera={{ position: [0, 0, 2.8], fov: 45 }}
        style={{ background: "transparent" }}
        gl={{ alpha: true, antialias: true }}
      >
        <GlobeScene
          nodes={nodes}
          connections={connections}
          onNodeClick={handleClick}
        />
      </Canvas>
    </div>
  );
}
