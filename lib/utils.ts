export function normalizeText(value: string) {
  return value
    .trim()
    .replace(/\s+/g, " ");
}

export function createSlug(value: string) {
  return value
    .trim()
    .toLowerCase()
    .replace(/\s+/g, "-")
    .replace(/[^\p{L}\p{N}-]+/gu, "")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}

export function emptyToNull(
  value: string | null | undefined
) {
  if (!value) {
    return null;
  }

  const normalized = value.trim();

  return normalized.length ? normalized : null;
}