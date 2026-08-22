export type ProfilePhotoAudience = "admin" | "teacher" | "classmate" | "self";
export type ProfilePhotoVisibility = { visibleToTeachers: boolean; visibleToClassmates: boolean };

export function applyProfilePhotoPrivacy<T extends ProfilePhotoVisibility>(learner: T, visibility: ProfilePhotoVisibility): T {
  return { ...learner, ...visibility };
}

export function canViewProfilePhoto(audience: ProfilePhotoAudience, visibility: ProfilePhotoVisibility) {
  if (audience === "admin" || audience === "self") return true;
  if (audience === "teacher") return visibility.visibleToTeachers;
  return visibility.visibleToClassmates;
}
