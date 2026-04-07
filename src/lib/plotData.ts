// ============================================================
// ISINYA CHUNA ESTATE — PLOT DATA (Based on official blueprint)
// Scale 1:2000 | Isinya, Kajiado County
// In 3D world units: 1 unit ≈ 10 metres
// ============================================================

export type PlotZone = 'A' | 'B' | 'C' | 'D' | 'SCHOOL' | 'COMMERCIAL';
export type PlotStatus = 'available' | 'reserved' | 'sold';
export type PaymentPlan = 'full' | 'installment' | 'deposit';

export interface PlotData {
  id: string;
  plotNumber: string;
  parcelRef: string;
  zone: PlotZone;
  status: PlotStatus;
  price: number;          // KES
  priceAfterPromo: number; // KES after July 2026
  sizeAcres: number;
  sizeSqM: number;
  x: number;              // 3D world X
  z: number;              // 3D world Z
  width: number;          // 3D width
  depth: number;          // 3D depth
  features: string[];
}

export interface ZoneSummary {
  id: string;
  label: string;
  description: string;
  color: string;          // hex
  accentColor: string;
  isAvailableForSale: boolean;
  pricePerPlot: number;
  priceAfterPromo: number;
}

export const ZONE_SUMMARIES: ZoneSummary[] = [
  {
    id: 'A',
    label: 'Zone A — West Large Lots',
    description: 'Spacious larger parcels on the western boundary. Ideal for private residence or agri-investment.',
    color: '#D97706',
    accentColor: '#FDE68A',
    isAvailableForSale: true,
    pricePerPlot: 1200000,
    priceAfterPromo: 1500000,
  },
  {
    id: 'B',
    label: 'Zone B — Prime Centre',
    description: 'Premium medium plots in the central-eastern section, excellent road access and serviced.',
    color: '#F97316',
    accentColor: '#FED7AA',
    isAvailableForSale: true,
    pricePerPlot: 1000000,
    priceAfterPromo: 1200000,
  },
  {
    id: 'C',
    label: 'Zone C — South Residential Grid',
    description: 'Largest zone with 70 plots in a regular residential grid. Best value for investors & families.',
    color: '#14B8A6',
    accentColor: '#CCFBF1',
    isAvailableForSale: true,
    pricePerPlot: 750000,
    priceAfterPromo: 900000,
  },
  {
    id: 'D',
    label: 'Zone D — North Cluster',
    description: 'Upper northern cluster adjacent to the main arterial road. High visibility and accessibility.',
    color: '#8B5CF6',
    accentColor: '#DDD6FE',
    isAvailableForSale: true,
    pricePerPlot: 950000,
    priceAfterPromo: 1100000,
  },
  {
    id: 'SCHOOL',
    label: 'School Reserve',
    description: 'Reserved for a community school facility.',
    color: '#EC4899',
    accentColor: '#FBCFE8',
    isAvailableForSale: false,
    pricePerPlot: 0,
    priceAfterPromo: 0,
  },
  {
    id: 'COMMERCIAL',
    label: 'Commercial Block',
    description: 'Designated commercial / shopping centre area serving the estate.',
    color: '#F59E0B',
    accentColor: '#FEF3C7',
    isAvailableForSale: false,
    pricePerPlot: 0,
    priceAfterPromo: 0,
  },
];

// ----------------------------------------------------------------
// HELPERS
// ----------------------------------------------------------------

function sold(n: number, modSold = 17, modReserved = 7): PlotStatus {
  if (n % modSold === 0) return 'sold';
  if (n % modReserved === 0) return 'reserved';
  return 'available';
}

// ----------------------------------------------------------------
// ZONE A — Left section large lots  (2 rows × 8 = 16 plots)
// Blueprint parcels 2431 family, large irregular western lots
// Each plot ≈ 0.5 acres / ~2000 m²
// ----------------------------------------------------------------
function buildZoneA(): PlotData[] {
  const plots: PlotData[] = [];
  const COLS = 8, ROWS = 2;
  const pw = 2.9, pd = 2.3, gx = 0.28, gz = 0.28;
  const ox = -27.5, oz = 4.5; // top-left corner of zone A
  let n = 1;
  for (let r = 0; r < ROWS; r++) {
    for (let c = 0; c < COLS; c++) {
      const x = ox + c * (pw + gx) + pw / 2;
      const z = oz - r * (pd + gz) - pd / 2;
      plots.push({
        id: `A-${n}`,
        plotNumber: `A${String(n).padStart(3, '0')}`,
        parcelRef: `2431/${n}`,
        zone: 'A',
        status: sold(n, 19, 5),
        price: 1200000,
        priceAfterPromo: 1500000,
        sizeAcres: 0.5,
        sizeSqM: 2023,
        x, z, width: pw, depth: pd,
        features: ['Large lot', 'West boundary', 'Gentle slope', 'Serene views'],
      });
      n++;
    }
  }
  return plots;
}

// ----------------------------------------------------------------
// ZONE B — Centre-right upper grid  (5 rows × 6 = 30 plots)
// Blueprint 2940X family
// Each plot ≈ 0.25 acres / ~1012 m²
// ----------------------------------------------------------------
function buildZoneB(): PlotData[] {
  const plots: PlotData[] = [];
  const COLS = 6, ROWS = 5;
  const pw = 1.85, pd = 1.65, gx = 0.22, gz = 0.22;
  const ox = 4.0, oz = 12.0;
  let n = 1;
  for (let r = 0; r < ROWS; r++) {
    for (let c = 0; c < COLS; c++) {
      const x = ox + c * (pw + gx) + pw / 2;
      const z = oz - r * (pd + gz) - pd / 2;
      plots.push({
        id: `B-${n}`,
        plotNumber: `B${String(n).padStart(3, '0')}`,
        parcelRef: `2940${String(n).padStart(2, '0')}`,
        zone: 'B',
        status: sold(n, 11, 4),
        price: 1000000,
        priceAfterPromo: 1200000,
        sizeAcres: 0.25,
        sizeSqM: 1012,
        x, z, width: pw, depth: pd,
        features: ['Prime location', 'Road frontage', 'Ready title', 'Serviced'],
      });
      n++;
    }
  }
  return plots;
}

// ----------------------------------------------------------------
// ZONE C — South dense residential grid  (7 rows × 10 = 70 plots)
// Blueprint 2900X family
// Each plot ≈ 0.2 acres / ~809 m²
// ----------------------------------------------------------------
function buildZoneC(): PlotData[] {
  const plots: PlotData[] = [];
  const COLS = 10, ROWS = 7;
  const pw = 1.55, pd = 1.45, gx = 0.18, gz = 0.18;
  const ox = 4.0, oz = -0.8;
  let n = 1;
  for (let r = 0; r < ROWS; r++) {
    for (let c = 0; c < COLS; c++) {
      const x = ox + c * (pw + gx) + pw / 2;
      const z = oz - r * (pd + gz) - pd / 2;
      plots.push({
        id: `C-${n}`,
        plotNumber: `C${String(n).padStart(3, '0')}`,
        parcelRef: `2900${String(n).padStart(2, '0')}`,
        zone: 'C',
        status: sold(n, 13, 6),
        price: 750000,
        priceAfterPromo: 900000,
        sizeAcres: 0.2,
        sizeSqM: 809,
        x, z, width: pw, depth: pd,
        features: ['Best value', 'Family zone', 'Internal access road', 'Flat terrain'],
      });
      n++;
    }
  }
  return plots;
}

// ----------------------------------------------------------------
// ZONE D — North cluster near arterial road  (3 rows × 6 = 18 plots)
// ----------------------------------------------------------------
function buildZoneD(): PlotData[] {
  const plots: PlotData[] = [];
  const COLS = 6, ROWS = 3;
  const pw = 1.7, pd = 1.55, gx = 0.2, gz = 0.2;
  const ox = -5.0, oz = 12.5;
  let n = 1;
  for (let r = 0; r < ROWS; r++) {
    for (let c = 0; c < COLS; c++) {
      const x = ox + c * (pw + gx) + pw / 2;
      const z = oz - r * (pd + gz) - pd / 2;
      plots.push({
        id: `D-${n}`,
        plotNumber: `D${String(n).padStart(3, '0')}`,
        parcelRef: `2647${String(n).padStart(2, '0')}`,
        zone: 'D',
        status: sold(n, 9, 3),
        price: 950000,
        priceAfterPromo: 1100000,
        sizeAcres: 0.22,
        sizeSqM: 890,
        x, z, width: pw, depth: pd,
        features: ['Road frontage', 'Northern aspect', 'High visibility', 'Easy access'],
      });
      n++;
    }
  }
  return plots;
}

export const ALL_PLOTS: PlotData[] = [
  ...buildZoneA(),
  ...buildZoneB(),
  ...buildZoneC(),
  ...buildZoneD(),
];

// Special non-saleable blocks for 3D rendering
export interface SpecialBlock {
  id: string;
  label: string;
  zone: PlotZone;
  x: number;
  z: number;
  width: number;
  depth: number;
  color: string;
}

export const SPECIAL_BLOCKS: SpecialBlock[] = [
  {
    id: 'school',
    label: 'School Reserve',
    zone: 'SCHOOL',
    x: -1.5, z: -10.5,
    width: 7, depth: 6,
    color: '#EC4899',
  },
  {
    id: 'commercial',
    label: 'Commercial Block',
    zone: 'COMMERCIAL',
    x: -1.5, z: 4.5,
    width: 7, depth: 5,
    color: '#F59E0B',
  },
];

// Road network for 3D rendering
// Each road: [x1, z1, x2, z2, widthUnits]
export const ROADS: [number, number, number, number, number][] = [
  // Main diagonal arterial (Farmer Road / access road — NW to SE)
  [-30, 14, 4, -20, 2.2],
  // North boundary road (East–West)
  [-30, 14, 22, 14, 1.8],
  // South boundary road (East–West)
  [-30, -20, 22, -20, 1.8],
  // East boundary road (North–South)
  [22, -20, 22, 14, 1.8],
  // West boundary road (North–South)
  [-30, -20, -30, 14, 1.8],
  // Internal NS road dividing zones (x ≈ 3)
  [3, -20, 3, 14, 1.4],
  // Internal EW road above Zone C
  [3, -0.8, 22, -0.8, 1.2],
  // Internal EW road mid Zone B
  [3, 6.5, 22, 6.5, 1.0],
  // Internal EW roads within Zone C
  [3, -5.0, 22, -5.0, 1.0],
  [3, -9.5, 22, -9.5, 1.0],
  [3, -14.5, 22, -14.5, 1.0],
  // Internal NS roads in Zone B+C grid
  [7.2, -20, 7.2, 14, 0.9],
  [11.2, -20, 11.2, 14, 0.9],
  [15.2, -20, 15.2, 14, 0.9],
  [19.5, -20, 19.5, 14, 0.9],
  // Zone A internal road
  [-27.5, 4.5, -27.5, -2.0, 0.8],
  [-5.5, 4.5, -5.5, -2.0, 0.8],
  [-27.5, 4.5, -5.5, 4.5, 0.8],
  [-27.5, -2.0, -5.5, -2.0, 0.8],
  // Zone D internal road
  [-5.0, 14, -5.0, 9.5, 0.9],
  [5.5, 9.5, -5.0, 9.5, 0.9],
  // Access roads from diagonal to zones
  [-5.0, 2.0, 3.0, 2.0, 1.2],
];
