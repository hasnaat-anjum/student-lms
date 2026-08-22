import { describe, expect, it } from "vitest";
import { mergeMonthlyInstitutionTrendRows } from "./db";

describe("live monthly chart aggregation", () => {
  it("merges paid-fee collection and attendance records by calendar month", () => {
    const result = mergeMonthlyInstitutionTrendRows(
      [
        { month: "2026-08", fees: "10000" },
        { month: "2026-07", fees: "9000" },
      ],
      [
        { month: "2026-07", attendance: "91.6" },
        { month: "2026-08", attendance: "94.0" },
      ],
    );

    expect(result).toEqual([
      { month: "2026-07", fees: 9000, attendance: 91.6 },
      { month: "2026-08", fees: 10000, attendance: 94 },
    ]);
  });

  it("retains attendance-only months with a zero fee total", () => {
    const result = mergeMonthlyInstitutionTrendRows([], [{ month: "2026-06", attendance: "88.5" }]);
    expect(result).toEqual([{ month: "2026-06", fees: 0, attendance: 88.5 }]);
  });
});
