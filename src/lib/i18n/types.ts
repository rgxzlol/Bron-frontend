import type { ProfileLanguage } from "@/store/profile.store";

export type { ProfileLanguage as Language };

export type MessageValue = string | MessageTree;
export type MessageTree = { [key: string]: MessageValue };

export type TranslateParams = Record<string, string | number>;
