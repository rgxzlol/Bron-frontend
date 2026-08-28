const STORAGE_KEY = "bron:slot-locks";

function readLocks(): Record<string, number> {
  if (typeof window === "undefined") return {};

  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as Record<string, number>) : {};
  } catch {
    return {};
  }
}

function writeLocks(locks: Record<string, number>) {
  if (typeof window === "undefined") return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(locks));
}

export function buildSlotKey(
  businessId: number | string,
  branchId: number | string,
  date: string,
  time: string,
) {
  return `${businessId}:${branchId}:${date}:${time}`;
}

export function isSlotLocked(key: string): boolean {
  return key in readLocks();
}

/** Returns true when the slot lock was acquired. */
export function tryReserveSlot(key: string): boolean {
  const locks = readLocks();
  if (key in locks) return false;

  locks[key] = Date.now();
  writeLocks(locks);
  return true;
}

export function releaseSlot(key: string) {
  const locks = readLocks();
  delete locks[key];
  writeLocks(locks);
}
