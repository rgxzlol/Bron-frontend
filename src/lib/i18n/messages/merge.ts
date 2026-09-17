import type { MessageTree } from "../types";

export function deepMergeMessages(
  base: MessageTree,
  extra: MessageTree,
): MessageTree {
  const result: MessageTree = { ...base };

  for (const [key, value] of Object.entries(extra)) {
    const existing = result[key];
    if (
      value != null &&
      typeof value === "object" &&
      !Array.isArray(value) &&
      existing != null &&
      typeof existing === "object" &&
      !Array.isArray(existing)
    ) {
      result[key] = deepMergeMessages(existing as MessageTree, value as MessageTree);
    } else {
      result[key] = value;
    }
  }

  return result;
}
