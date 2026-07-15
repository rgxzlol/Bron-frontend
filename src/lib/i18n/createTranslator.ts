import type { MessageTree, TranslateParams } from "./types";

function getNestedValue(tree: MessageTree, path: string): string | undefined {
  const parts = path.split(".");
  let current: unknown = tree;

  for (const part of parts) {
    if (current == null || typeof current !== "object" || !(part in (current as object))) {
      return undefined;
    }
    current = (current as MessageTree)[part];
  }

  return typeof current === "string" ? current : undefined;
}

function interpolate(template: string, params?: TranslateParams): string {
  if (!params) return template;
  return template.replace(/\{(\w+)\}/g, (_, key: string) =>
    params[key] != null ? String(params[key]) : `{${key}}`,
  );
}

export function createTranslator(messages: MessageTree) {
  return function t(key: string, params?: TranslateParams): string {
    const value = getNestedValue(messages, key);
    if (value == null) return key;
    return interpolate(value, params);
  };
}

export type Translator = ReturnType<typeof createTranslator>;
