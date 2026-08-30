// Mock data contract for sea-ice forecasts.
// Matches the FastAPI contract: { timestamp, forecastHour, grid, confidence, uncertainty }

const HORIZONS = [0, 24, 48, 72, 96, 120];

// Deterministic pseudo-random so the demo looks the same every run.
function seeded(seed) {
  let s = seed;
  return () => {
    s = (s * 9301 + 49297) % 233280;
    return s / 233280;
  };
}
const ANTARCTICA_MASK_BOTTOM = [
  "                                        ",
  "                                        ",
  "                                        ",
  "   1                                    ",
  "   11                                   ",
  "   11                                   ",
  "   111                 11               ",
  "  11111               11111      11     ",
  "  11111             111111111  11111    ",
  " 1111111           111111111111111111   ",
  "1111111111      11111111111111111111111 ",
  "111111111111   1111111111111111111111111",
  "1111111111111111111111111111111111111111",
  "1111111111111111111111111111111111111111",
  "1111111111111111111111111111111111111111"
];

// Generates a lat/lon-ish grid of sea-ice concentration values (0-1) around Antarctica.
function buildGrid(forecastHour) {
  const rand = seeded(forecastHour + 7);
  const rows = 40; // 40x40 grid ensures square cells (2.5 units each in 100x100 viewBox)
  const cols = 40;
  const cells = [];
  
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      let isLand = false;
      const maskOffset = rows - ANTARCTICA_MASK_BOTTOM.length;
      
      if (r >= maskOffset) {
        const maskR = r - maskOffset;
        isLand = ANTARCTICA_MASK_BOTTOM[maskR][c] === '1';
      }
      
      let base = isLand ? 1.0 : 0.05;
      
      if (!isLand && r >= maskOffset - 8) {
        // Generate sea ice tapering off above the coast
        let coastDist = 10;
        for (let ir = maskOffset; ir < rows; ir++) {
          for (let ic = 0; ic < cols; ic++) {
            if (ANTARCTICA_MASK_BOTTOM[ir - maskOffset][ic] === '1') {
              let d = Math.sqrt((r-ir)*(r-ir) + (c-ic)*(c-ic));
              if (d < coastDist) coastDist = d;
            }
          }
        }
        if (coastDist < 6) {
           base = Math.max(0, 0.95 - coastDist * 0.18);
        }
      }

      const drift = forecastHour / 120;
      base = Math.max(0, base - drift * 0.15); // Ice melts over time

      const noise = (rand() - 0.5) * 0.2;
      let sic = Math.min(1, Math.max(0, base + noise));
      
      // Clear out the very top of the map so it's pure open ocean
      if (r < maskOffset - 10) sic = 0;

      cells.push({ row: r, col: c, sic: Number(sic.toFixed(3)), isLand });
    }
  }
  return { rows, cols, cells };
}

export function getForecastFrame(forecastHour) {
  const grid = buildGrid(forecastHour);
  const confidence = Math.max(0.6, 0.94 - forecastHour / 900);
  return {
    timestamp: new Date().toISOString(),
    forecastHour,
    grid,
    confidence: Number(confidence.toFixed(2)),
    uncertainty: grid.cells.map((c) => Number((Math.abs(0.5 - c.sic) * 0.3 + forecastHour / 1200).toFixed(3))),
  };
}

export const forecastHorizons = HORIZONS;

export const forecastFrames = HORIZONS.reduce((acc, h) => {
  acc[h] = getForecastFrame(h);
  return acc;
}, {});

export const seaIceLegend = [
  { label: "Low (0–20%)", range: [0, 0.2], color: "#173a52", desc: "Open-water conditions" },
  { label: "Moderate (20–50%)", range: [0.2, 0.5], color: "#1596c9" },
  { label: "High (50–80%)", range: [0.5, 0.8], color: "#5ff2ff" },
  { label: "Critical (80–100%)", range: [0.8, 1.01], color: "#f5fbff" },
];

export function sicColor(sic) {
  if (sic < 0.2) return "#122b3f";
  if (sic < 0.5) return "#12699b";
  if (sic < 0.8) return "#22b8e6";
  return "#eafcff";
}

export const forecastMeta = {
  iceEdgeMovementKm: -6.4,
  updated: "2026-08-26T08:30:00Z",
  status: "NOMINAL",
};
