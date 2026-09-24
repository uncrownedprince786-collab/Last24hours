export function slugify(input: string, maxLen = 90): string {
  const s = input
    .toLowerCase()
    .replace(/['"’`]/g, "")
    .replace(/[^a-z0-9\s-]/g, " ")
    .replace(/[\s_]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, maxLen)
    .replace(/-+$/g, "");
  return s || "story";
}

export function ensureUniqueSlug(base: string, existing: Set<string>): string {
  if (!existing.has(base)) {
    existing.add(base);
    return base;
  }
  let i = 2;
  while (existing.has(`${base}-${i}`)) i += 1;
  existing.add(`${base}-${i}`);
  return `${base}-${i}`;
}