import { describe, expect, it } from "vitest";
import { applyProfilePhotoPrivacy, canViewProfilePhoto } from "../client/src/lib/profilePhotoPrivacy";

describe("student profile-photo privacy policy", () => {
  const privateForPeers = { visibleToTeachers: true, visibleToClassmates: false };

  it("keeps a student's own picture visible", () => {
    expect(canViewProfilePhoto("self", privateForPeers)).toBe(true);
  });

  it("honours independent teacher and classmate visibility choices", () => {
    expect(canViewProfilePhoto("teacher", privateForPeers)).toBe(true);
    expect(canViewProfilePhoto("classmate", privateForPeers)).toBe(false);
  });

  it("keeps administrative records visible for institute administration", () => {
    expect(canViewProfilePhoto("admin", { visibleToTeachers: false, visibleToClassmates: false })).toBe(true);
  });

  it("updates a learner from visible to private and back without changing other record fields", () => {
    const learner = { name: "Hania Raza", roll: "SCI-2026-041", visibleToTeachers: true, visibleToClassmates: true };
    const hidden = applyProfilePhotoPrivacy(learner, { visibleToTeachers: false, visibleToClassmates: false });
    expect(hidden).toMatchObject({ name: "Hania Raza", roll: "SCI-2026-041", visibleToTeachers: false, visibleToClassmates: false });
    expect(canViewProfilePhoto("teacher", hidden)).toBe(false);
    expect(canViewProfilePhoto("classmate", hidden)).toBe(false);
    const restored = applyProfilePhotoPrivacy(hidden, { visibleToTeachers: true, visibleToClassmates: true });
    expect(canViewProfilePhoto("teacher", restored)).toBe(true);
    expect(canViewProfilePhoto("classmate", restored)).toBe(true);
  });

  it("covers every teacher and classmate preview combination", () => {
    const visibleToEveryone = { visibleToTeachers: true, visibleToClassmates: true };
    const hiddenFromEveryone = { visibleToTeachers: false, visibleToClassmates: false };
    expect(canViewProfilePhoto("teacher", visibleToEveryone)).toBe(true);
    expect(canViewProfilePhoto("classmate", visibleToEveryone)).toBe(true);
    expect(canViewProfilePhoto("teacher", hiddenFromEveryone)).toBe(false);
    expect(canViewProfilePhoto("classmate", hiddenFromEveryone)).toBe(false);
  });
});
