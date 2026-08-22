export function profilePhotoStorageKey(studentKey: string) {
  return `student-lms-profile-photo-${studentKey}`;
}

export function validateProfilePhotoFile(file: { type: string; size: number }) {
  if (!["image/jpeg", "image/png", "image/webp"].includes(file.type)) {
    return "Choose a PNG, JPEG, or WebP image";
  }
  if (file.size > 4 * 1024 * 1024) {
    return "Choose an image smaller than 4 MB";
  }
  return null;
}
