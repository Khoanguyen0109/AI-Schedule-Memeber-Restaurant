import type { Deployment } from "../../services/types";

function pad2(n: number): string {
  return String(n).padStart(2, "0");
}

export function formatLocalYMD(d: Date): string {
  return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`;
}

function startOfLocalDay(anchor: Date): Date {
  return new Date(anchor.getFullYear(), anchor.getMonth(), anchor.getDate());
}

/** Seven strings Mon..Sun in local timezone, each `YYYY-MM-DD`. */
export function getMondayToSundayDates(anchor: Date): string[] {
  const day = startOfLocalDay(anchor);
  const dow = day.getDay();
  const monday = new Date(day);
  monday.setDate(day.getDate() - ((dow + 6) % 7));
  const days: string[] = [];
  for (let i = 0; i < 7; i++) {
    const x = new Date(monday.getFullYear(), monday.getMonth(), monday.getDate() + i);
    days.push(formatLocalYMD(x));
  }
  return days;
}

/** For each `date`, keep the deployment with the latest `updated_at` (ISO parse). */
export function pickLatestDeploymentPerDate(deployments: Deployment[]): Map<string, Deployment> {
  const m = new Map<string, Deployment>();
  for (const d of deployments) {
    const prev = m.get(d.date);
    if (!prev) {
      m.set(d.date, d);
      continue;
    }
    const nextT = new Date(d.updated_at).getTime();
    const prevT = new Date(prev.updated_at).getTime();
    if (nextT >= prevT) m.set(d.date, d);
  }
  return m;
}

export function formatStationFallback(stationId: string): string {
  return stationId
    .split(/[_\s]+/)
    .filter(Boolean)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
    .join(" ");
}
