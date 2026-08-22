const ALLOWED_IMAGE_TYPES = new Set(["image/jpeg", "image/png", "image/webp"]);
const MAX_PROFILE_IMAGE_BYTES = 4 * 1024 * 1024;

export function parseProfilePhotoDataUrl(dataUrl: string) {
  const match = /^data:(image\/(?:jpeg|png|webp));base64,([A-Za-z0-9+/=]+)$/.exec(dataUrl);
  if (!match) throw new Error("Use a PNG, JPEG, or WebP image file");
  const contentType = match[1];
  if (!ALLOWED_IMAGE_TYPES.has(contentType)) throw new Error("Unsupported image type");
  const data = Buffer.from(match[2], "base64");
  if (data.length === 0 || data.length > MAX_PROFILE_IMAGE_BYTES) {
    throw new Error("Profile images must be smaller than 4 MB");
  }
  const extension = contentType === "image/jpeg" ? "jpg" : contentType.split("/")[1];
  return { contentType, data, extension };
}
