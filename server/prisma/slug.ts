/**
 * 把工具名转成 URL 友好的 slug。
 * 中文等非 ASCII 字符无法安全用于 URL，统一转成短哈希后缀，
 * 保证 slug 只包含 [a-z0-9-]，与后端 uniqueSlug 行为一致。
 */
export function toSlug(name: string): string {
  const base = name
    .toLowerCase()
    .replace(/[^a-z0-9\u4e00-\u9fa5]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 50);

  // 纯 ASCII 直接使用；含中文则取稳定哈希，避免 URL 出现中文
  const isAscii = /^[a-z0-9-]*$/.test(base);
  if (isAscii && base) return base;

  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = (hash << 5) - hash + name.charCodeAt(i);
    hash |= 0;
  }
  const suffix = Math.abs(hash).toString(36).slice(0, 8);
  return base ? `${base}-${suffix}` : `tool-${suffix}`;
}
