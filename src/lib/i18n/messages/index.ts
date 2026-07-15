import type { ProfileLanguage } from "@/store/profile.store";
import type { MessageTree } from "../types";
import { en } from "./en";
import { ru } from "./ru";
import { uz } from "./uz";
import { extraEn } from "./extraEn";
import { extraRu } from "./extraRu";
import { extraUz } from "./extraUz";
import { deepMergeMessages } from "./merge";

const MESSAGES: Record<ProfileLanguage, MessageTree> = {
  ru: deepMergeMessages(ru, extraRu),
  uz: deepMergeMessages(uz, extraUz),
  en: deepMergeMessages(en, extraEn),
};

export function getMessages(language: ProfileLanguage): MessageTree {
  return MESSAGES[language] ?? MESSAGES.ru;
}
