/**
 * InfraSphere API client — typed fetch functions for all endpoints.
 */

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8090";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------
export interface InfraNode {
  id: string;
  name: string;
  type: "data_center" | "power_plant" | "renewable" | "grid_hub";
  subtype: string;
  lat: number;
  lng: number;
  region: string;
  capacity_mw: number;
  utilization: number;
  operator: string;
  growth_rate: number;
  renewable_pct: number;
  capex_bn: number;
}

export interface Connection {
  id: string;
  from_id: string;
  to_id: string;
  capacity_mw: number;
  flow_mw: number;
  type: string;
}

export interface GlobeData {
  nodes: InfraNode[];
  connections: Connection[];
}

export interface Security {
  ticker: string;
  name: string;
  sector: string;
  category: string;
  price: number;
  market_cap_bn: number;
  pe_ratio: number;
  dividend_yield: number;
  beta: number;
  ytd_return: number;
  one_year_return: number;
  ai_infra_revenue_pct: number;
  power_demand_sensitivity: number;
  regions: string[];
  esg_score: number;
  carbon_intensity: number;
}

export interface HeatmapCell {
  ticker: string;
  name: string;
  category: string;
  market_cap_bn: number;
  ytd_return: number;
  ai_infra_revenue_pct: number;
}

export interface SectorBreakdown {
  category: string;
  label: string;
  count: number;
  total_market_cap_bn: number;
  avg_ytd_return: number;
  avg_ai_revenue: number;
}

export interface Region {
  id: string;
  name: string;
  country: string;
  grid_capacity_gw: number;
  current_demand_gw: number;
  ai_demand_gw: number;
  ai_demand_growth_pct: number;
  renewable_capacity_gw: number;
  planned_additions_gw: number;
  grid_strain_index: number;
  avg_electricity_price_kwh: number;
  data_center_count: number;
  total_dc_capacity_mw: number;
}

export interface Insight {
  id: string;
  severity: "critical" | "warning" | "opportunity" | "info";
  category: string;
  title: string;
  description: string;
  tickers: string[];
  region: string | null;
  metric_value: number | null;
  metric_unit: string | null;
}

export interface ScenarioInput {
  ai_demand_growth_pct: number;
  interest_rate_pct: number;
  power_price_change_pct: number;
  renewable_buildout_multiplier: number;
}

export interface RegionImpact {
  region_id: string;
  region_name: string;
  baseline_strain: number;
  scenario_strain: number;
  strain_delta: number;
  capacity_gap_gw: number;
  capex_required_bn: number;
}

export interface SecurityImpact {
  ticker: string;
  name: string;
  category: string;
  baseline_score: number;
  scenario_score: number;
  score_delta: number;
  signal: string;
}

export interface ScenarioResult {
  inputs: ScenarioInput;
  aggregate_capex_bn: number;
  aggregate_strain_delta: number;
  avg_security_impact: number;
  region_impacts: RegionImpact[];
  top_beneficiaries: SecurityImpact[];
  top_losers: SecurityImpact[];
  insights: string[];
}

export interface DemandPoint {
  year: number;
  total_demand_gw: number;
  ai_demand_gw: number;
  renewable_supply_gw: number;
  capacity_gap_gw: number;
  confidence_lower: number;
  confidence_upper: number;
}

export interface ForecastResult {
  region_id: string;
  region_name: string;
  historical: DemandPoint[];
  forecast: DemandPoint[];
}

// ---------------------------------------------------------------------------
// Fetch helpers
// ---------------------------------------------------------------------------
async function get<T>(path: string): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`);
  if (!res.ok) throw new Error(`API error: ${res.status} ${res.statusText}`);
  return res.json();
}

async function post<T>(path: string, body: unknown): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(`API error: ${res.status} ${res.statusText}`);
  return res.json();
}

// ---------------------------------------------------------------------------
// API functions
// ---------------------------------------------------------------------------
export const fetchGlobeData = () => get<GlobeData>("/api/infra/globe");

export const fetchRegions = () => get<Region[]>("/api/infra/regions");

export const fetchInsights = () => get<Insight[]>("/api/infra/insights");

export const fetchSecurities = (params?: Record<string, string | number>) => {
  const q = params ? "?" + new URLSearchParams(
    Object.entries(params).map(([k, v]) => [k, String(v)])
  ).toString() : "";
  return get<Security[]>(`/api/securities/list${q}`);
};

export const fetchHeatmap = () => get<HeatmapCell[]>("/api/securities/heatmap");

export const fetchSectors = () => get<SectorBreakdown[]>("/api/securities/sectors");

export const fetchTopMovers = (n = 5) => get<{ ticker: string; name: string; ytd_return: number; category: string }[]>(
  `/api/securities/top-movers?n=${n}`
);

export const fetchPowerSensitivity = () => get<{
  ticker: string; name: string; category: string;
  power_demand_sensitivity: number; ytd_return: number;
  ai_infra_revenue_pct: number; market_cap_bn: number;
}[]>("/api/securities/power-sensitivity");

export const runScenario = (input: ScenarioInput) =>
  post<ScenarioResult>("/api/scenarios/run", input);

export const fetchScenarioDefaults = () => get<ScenarioInput>("/api/scenarios/defaults");

export const fetchForecast = (regionId: string, horizon = 5) =>
  get<ForecastResult>(`/api/forecasts/region/${regionId}?horizon=${horizon}`);

export const fetchAllForecasts = (horizon = 5) =>
  get<ForecastResult[]>(`/api/forecasts/all?horizon=${horizon}`);

export const getReportUrl = () => `${API_BASE}/api/securities/report`;
