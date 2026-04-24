import type { AreaEmployee } from "../../services/types";

export const AREA_STAFF: AreaEmployee[] = [
  {
    employee_id: "area-001",
    employee_name: "Sophia Martinez",
    store_id: "store-westside",
    store_name: "Westside Plaza",
    role: "Crew",
    available_shifts: ["Morning", "Afternoon", "Evening"],
    skills: ["makeline", "oven", "cut_table"],
  },
  {
    employee_id: "area-002",
    employee_name: "James Lee",
    store_id: "store-downtown",
    store_name: "Downtown Station",
    role: "Crew",
    available_shifts: ["Morning", "Afternoon"],
    skills: ["front_counter", "drive_through"],
  },
  {
    employee_id: "area-003",
    employee_name: "Priya Patel",
    store_id: "store-northgate",
    store_name: "Northgate Mall",
    role: "Shift Lead",
    available_shifts: ["Afternoon", "Evening"],
    skills: ["makeline", "front_counter", "oven"],
  },
];
