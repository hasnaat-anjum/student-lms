import { describe, expect, it } from "vitest";
import { calculateFeeTotal, FEE_RULES } from "./routers";

describe("LMS fee calculation", () => {
  it("uses the specified fixed PKR amounts for a current monthly invoice", () => {
    const fee = calculateFeeTotal({
      subjectCount: 3,
      includeAdmission: true,
      includeExam: true,
      dueDate: new Date("2026-09-10"),
      now: new Date("2026-08-22"),
    });

    expect(FEE_RULES).toEqual({ admission: 5000, monthlyPerSubject: 3000, semesterExam: 1000, late: 200 });
    expect(fee).toEqual({ monthly: 9000, lateFee: 0, total: 15000 });
  });

  it("adds the exact 200 PKR late fee after the due date", () => {
    const fee = calculateFeeTotal({
      subjectCount: 1,
      dueDate: new Date("2026-08-10"),
      now: new Date("2026-08-22"),
    });

    expect(fee).toEqual({ monthly: 3000, lateFee: 200, total: 3200 });
  });
});
