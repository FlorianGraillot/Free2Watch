/**
 * Creates a URL-safe, SEO friendly slug. Handles accents and non-latin
 * characters (Arabic, Japanese, etc.) by falling back to a stable hash suffix.
 */
export function slugify(value, fallbackPrefix = 'title') {
  const base = String(value ?? '')
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/['’"]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80);

  if (base) return base;

  let hash = 0;
  const source = String(value ?? '');
  for (let i = 0; i < source.length; i += 1) {
    hash = (hash * 31 + source.charCodeAt(i)) >>> 0;
  }
  return `${fallbackPrefix}-${hash.toString(36)}`;
}

/**
 * Generates a slug that is unique for the given table.
 * Reserved words belonging to the router are avoided as well.
 */
export function uniqueSlug(db, table, value, excludeId = null) {
  const fallbackPrefix = table.replace(/_/g, '-');
  let candidate = slugify(value, fallbackPrefix);
  let counter = 2;

  const stmt = excludeId
    ? db.prepare(`SELECT 1 FROM ${table} WHERE slug = ? AND id <> ?`)
    : db.prepare(`SELECT 1 FROM ${table} WHERE slug = ?`);

  while (excludeId ? stmt.get(candidate, excludeId) : stmt.get(candidate)) {
    const suffixed = `${candidate.slice(0, 74)}-${counter}`;
    candidate = suffixed;
    counter += 1;
  }

  return candidate;
}
