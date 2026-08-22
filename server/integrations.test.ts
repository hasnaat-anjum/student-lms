import { describe, expect, it } from "vitest";
import { createCloudinaryUploadSignature, createPaymentInitiation, feeReminderCandidates, getIntegrationReadiness } from "./integrations";

describe("LMS external integration contracts", () => {
  it("creates tracked payment initiations for the exact supported provider names", () => {
    const payment = createPaymentInitiation({ provider: "JazzCash", amount: 10000, returnUrl: "https://example.org/payments/return", issuedAt: new Date("2026-08-22T10:00:00Z") });
    expect(payment.provider).toBe("JazzCash");
    expect(payment.status).toBe("initiated");
    expect(payment.reference).toMatch(/^LMS-JAZ-20260822-/);
  });

  it("does not claim integrations are ready unless the necessary secret contract is fulfilled", () => {
    expect(getIntegrationReadiness({})).toMatchObject({ cloudinary: false, jazzCash: false, easypaisa: false, bankTransfer: false });
    expect(getIntegrationReadiness({ CLOUDINARY_CLOUD_NAME: "academy", CLOUDINARY_API_KEY: "key", CLOUDINARY_API_SECRET: "secret" }).cloudinary).toBe(true);
  });

  it("creates deterministic Cloudinary signatures and selects unpaid overdue fees for reminders", () => {
    expect(createCloudinaryUploadSignature({ timestamp: 123, folder: "student-lms", apiSecret: "secret" })).toBe("eef0c4ff752a7a8f96b9d4706081543241258dfc");
    const due = feeReminderCandidates([
      { dueDate: new Date("2026-08-01"), feeStatus: "due" as const },
      { dueDate: new Date("2026-08-10"), feeStatus: "paid" as const },
      { dueDate: new Date("2026-08-30"), feeStatus: "overdue" as const },
    ], new Date("2026-08-22"));
    expect(due).toHaveLength(1);
  });
});
