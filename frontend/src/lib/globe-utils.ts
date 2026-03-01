/**
 * Globe utility functions — coordinate conversion, arc generation, colours.
 */
import * as THREE from "three";

/** Convert lat/lng (degrees) to a Three.js Vector3 on a sphere of given radius. */
export function latLngToVector3(
  lat: number,
  lng: number,
  radius: number = 1
): THREE.Vector3 {
  const phi = (90 - lat) * (Math.PI / 180);
  const theta = (lng + 180) * (Math.PI / 180);
  return new THREE.Vector3(
    -(radius * Math.sin(phi) * Math.cos(theta)),
    radius * Math.cos(phi),
    radius * Math.sin(phi) * Math.sin(theta)
  );
}

/** Generate points along a great-circle arc elevated above the sphere surface. */
export function generateArcPoints(
  start: THREE.Vector3,
  end: THREE.Vector3,
  segments: number = 48,
  altitude: number = 0.15
): THREE.Vector3[] {
  const points: THREE.Vector3[] = [];
  for (let i = 0; i <= segments; i++) {
    const t = i / segments;
    // Spherical interpolation
    const point = new THREE.Vector3().lerpVectors(start, end, t).normalize();
    // Elevate at the middle of the arc (parabolic)
    const elevate = 1 + altitude * Math.sin(Math.PI * t);
    point.multiplyScalar(elevate);
    points.push(point);
  }
  return points;
}

/** Node type → colour mapping. */
export function nodeColor(type: string): string {
  switch (type) {
    case "data_center":
      return "#f97316"; // orange
    case "power_plant":
      return "#06b6d4"; // cyan
    case "renewable":
      return "#10b981"; // green
    case "grid_hub":
      return "#8b5cf6"; // purple
    default:
      return "#3b82f6"; // blue
  }
}

/** Node type → size multiplier. */
export function nodeSize(type: string): number {
  switch (type) {
    case "data_center":
      return 1.0;
    case "power_plant":
      return 0.85;
    case "renewable":
      return 0.8;
    case "grid_hub":
      return 0.7;
    default:
      return 0.6;
  }
}

/** Map category to a consistent colour for charts. */
export const CATEGORY_COLORS: Record<string, string> = {
  data_center_reit: "#f97316",
  utility: "#06b6d4",
  nuclear: "#8b5cf6",
  renewable: "#10b981",
  hyperscaler: "#3b82f6",
  semiconductor: "#eab308",
  power_equipment: "#ec4899",
  dc_services: "#14b8a6",
  etf: "#6b7280",
};

/** Severity colour class. */
export function severityColor(severity: string): string {
  switch (severity) {
    case "critical":
      return "#ef4444";
    case "warning":
      return "#f59e0b";
    case "opportunity":
      return "#10b981";
    case "info":
      return "#3b82f6";
    default:
      return "#94a3b8";
  }
}

/** Format large numbers: 1800 → "1.8K", 1500000 → "1.5M" */
export function formatNumber(n: number): string {
  if (Math.abs(n) >= 1e12) return `${(n / 1e12).toFixed(1)}T`;
  if (Math.abs(n) >= 1e9) return `${(n / 1e9).toFixed(1)}B`;
  if (Math.abs(n) >= 1e6) return `${(n / 1e6).toFixed(1)}M`;
  if (Math.abs(n) >= 1e3) return `${(n / 1e3).toFixed(1)}K`;
  return n.toFixed(1);
}
