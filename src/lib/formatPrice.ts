import type { ClipboardEvent, KeyboardEvent } from "react";

export function formatPrice(price: number): string {
  return price.toLocaleString("ru-RU");
}

export function parsePrice(value: string): number {
  const normalized = value
    .replace(/[\s\u00a0\u202f]/g, "")
    .replace(/,/g, "");
  const price = Number(normalized);
  return Number.isFinite(price) ? price : 0;
}

export function formatPriceInput(price: number): string {
  return price > 0 ? formatPrice(price) : "";
}

export function formatPriceInputOnChange(value: string): string {
  const digits = value.replace(/\D/g, "");
  if (!digits) return "";
  const num = Number(digits);
  return Number.isFinite(num) ? formatPrice(num) : "";
}

const PRICE_INPUT_CONTROL_KEYS = new Set([
  "Backspace",
  "Delete",
  "Tab",
  "Escape",
  "Enter",
  "ArrowLeft",
  "ArrowRight",
  "ArrowUp",
  "ArrowDown",
  "Home",
  "End",
]);

export function isPriceInputKeyAllowed(key: string, withModifier: boolean): boolean {
  if (withModifier) return true;
  if (PRICE_INPUT_CONTROL_KEYS.has(key)) return true;
  if (key.length !== 1) return true;
  return /\d/.test(key);
}

export function hasInvalidPriceInput(value: string): boolean {
  const trimmed = value.trim();
  if (!trimmed) return false;
  return !/^[\d\s\u00a0\u202f]+$/.test(trimmed);
}

export function pasteContainsInvalidPriceChars(value: string): boolean {
  return /[^\d\s\u00a0\u202f,]/.test(value);
}

export function handlePriceInputKeyDown(
  event: KeyboardEvent<HTMLInputElement>,
  onInvalid?: () => void,
): void {
  if (isPriceInputKeyAllowed(event.key, event.ctrlKey || event.metaKey)) return;
  event.preventDefault();
  onInvalid?.();
}

export function handlePriceInputPaste(
  event: ClipboardEvent<HTMLInputElement>,
  onValue: (value: string) => void,
  onInvalid?: () => void,
): void {
  event.preventDefault();
  const pasted = event.clipboardData.getData("text");
  if (pasteContainsInvalidPriceChars(pasted)) {
    onInvalid?.();
    return;
  }
  onValue(formatPriceInputOnChange(pasted));
}

export function formatRating(rating: number): string {
  return rating.toLocaleString("ru-RU", {
    minimumFractionDigits: 1,
    maximumFractionDigits: 1,
  });
}
