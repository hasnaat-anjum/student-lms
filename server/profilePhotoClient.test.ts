import { describe, expect, it } from "vitest";
import { profilePhotoStorageKey, validateProfilePhotoFile } from "../client/src/lib/profilePhoto";

describe("student profile-photo client helpers", () => {
  it("creates a student-specific persistence key", () => {
    expect(profilePhotoStorageKey("SCI-2026-041")).toBe("student-lms-profile-photo-SCI-2026-041");
  });

  it("accepts supported images within the profile size limit", () => {
    expect(validateProfilePhotoFile({ type: "image/webp", size: 3 * 1024 * 1024 })).toBeNull();
  });

  it("rejects unsupported and oversized images", () => {
    expect(validateProfilePhotoFile({ type: "image/gif", size: 1000 })).toContain("PNG, JPEG, or WebP");
    expect(validateProfilePhotoFile({ type: "image/png", size: 4 * 1024 * 1024 + 1 })).toContain("smaller than 4 MB");
  });
});
