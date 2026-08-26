// Frontend-facing API service.
//
// For the prototype every function resolves against local mock data with a
// small artificial delay so loading states can be demonstrated. Once FastAPI
// is available, swap the body of each function for a fetch() call against
// the same shape of response — no page code should need to change.
//
// Example future implementation:
//   const res = await fetch(`${API_BASE}/sea-ice/forecast?hour=${hour}`);
//   return res.json();

import { getForecastFrame, forecastMeta } from "../data/seaIceData";
import { icebergs, getIceberg } from "../data/icebergData";
import { simulateRoutes } from "../data/routeData";

export const API_BASE = import.meta.env.VITE_API_BASE || "/api";

const MOCK_LATENCY = 450;

function mockResolve(value, ms = MOCK_LATENCY) {
  return new Promise((resolve) => setTimeout(() => resolve(value), ms));
}

export async function fetchSeaIceForecast(forecastHour) {
  return mockResolve({ ...getForecastFrame(forecastHour), meta: forecastMeta });
}

export async function fetchIcebergs() {
  return mockResolve(icebergs);
}

export async function fetchIcebergById(id) {
  return mockResolve(getIceberg(id));
}

export async function runRouteSimulation(scenario) {
  return mockResolve(simulateRoutes(scenario), 700);
}

export async function fetchAlerts() {
  return mockResolve([
    {
      id: "evt-01",
      type: "ENVIRONMENTAL",
      message: "Unexpected environmental event detected.",
      severity: "CRITICAL",
    },
  ]);
}
