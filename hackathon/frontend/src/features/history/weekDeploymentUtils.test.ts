import { describe, it, expect } from "vitest";
import type { Deployment } from "../../services/types";
import {
  getMondayToSundayDates,
  pickLatestDeploymentPerDate,
  formatStationFallback,
} from "./weekDeploymentUtils";

describe("getMondayToSundayDates", () => {
  it("returns Mon–Sun local YYYY-MM-DD for a Wednesday in April 2026", () => {
    const anchor = new Date(2026, 3, 22, 15, 0, 0);
    expect(getMondayToSundayDates(anchor)).toEqual([
      "2026-04-20",
      "2026-04-21",
      "2026-04-22",
      "2026-04-23",
      "2026-04-24",
      "2026-04-25",
      "2026-04-26",
    ]);
  });
});

describe("pickLatestDeploymentPerDate", () => {
  it("keeps deployment with greater updated_at for same date", () => {
    const older: Deployment = {
      deployment_id: "a",
      store_id: "s1",
      date: "2026-04-20",
      created_at: "2026-04-19T10:00:00Z",
      updated_at: "2026-04-19T10:00:00Z",
      cells: [],
    };
    const newer: Deployment = {
      deployment_id: "b",
      store_id: "s1",
      date: "2026-04-20",
      created_at: "2026-04-19T11:00:00Z",
      updated_at: "2026-04-20T08:00:00Z",
      cells: [],
    };
    const m = pickLatestDeploymentPerDate([older, newer, older]);
    expect(m.get("2026-04-20")?.deployment_id).toBe("b");
  });
});

describe("formatStationFallback", () => {
  it("title-cases snake_case station ids", () => {
    expect(formatStationFallback("makeline_front")).toBe("Makeline Front");
  });
});
