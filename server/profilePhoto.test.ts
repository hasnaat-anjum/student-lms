import { describe, expect, it } from "vitest";
import { parseProfilePhotoDataUrl } from "./profilePhoto";

describe("profile photo validation", () => {
  it("accepts an image data URL and returns S3 upload metadata", () => {
    const parsed = parseProfilePhotoDataUrl("data:image/png;base64,aGVsbG8=");
    expect(parsed.contentType).toBe("image/png");
    expect(parsed.extension).toBe("png");
    expect(parsed.data.toString()).toBe("hello");
  });

  it("rejects non-image payloads", () => {
    expect(() => parseProfilePhotoDataUrl("data:text/plain;base64,aGVsbG8=")).toThrow("PNG, JPEG, or WebP");
  });

  it("rejects images larger than the permitted profile-photo size", () => {
    const oversized = Buffer.alloc(4 * 1024 * 1024 + 1).toString("base64");
    expect(() => parseProfilePhotoDataUrl(`data:image/jpeg;base64,${oversized}`)).toThrow("smaller than 4 MB");
  });
});
