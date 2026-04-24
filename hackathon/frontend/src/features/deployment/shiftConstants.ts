import type { Shift } from "../../services/types";

export const SHIFTS: Shift[] = ["Morning", "Afternoon", "Evening"];

export const SHIFT_LABELS: Record<Shift, string> = {
  Morning: "Morning (6\u201312)",
  Afternoon: "Afternoon (12\u201318)",
  Evening: "Evening (18\u201323)",
};
