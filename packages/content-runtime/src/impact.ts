import type { ContentRegistry } from '@psychsim/schemas';

/**
 * Traverse reverse dependency edges for a proposed catalog/content change.
 * This reports what needs review; it never mutates or auto-approves content.
 */
export const findAffectedContentIds = (
  registry: ContentRegistry,
  targetIds: readonly string[],
): string[] => {
  const affected = new Set(targetIds);
  let changed = true;
  while (changed) {
    changed = false;
    for (const entry of registry.entries) {
      if (affected.has(entry.id)) continue;
      if (entry.dependsOnIds.some((dependencyId) => affected.has(dependencyId))) {
        affected.add(entry.id);
        changed = true;
      }
    }
  }
  return [...affected].filter((id) => !targetIds.includes(id)).sort();
};
