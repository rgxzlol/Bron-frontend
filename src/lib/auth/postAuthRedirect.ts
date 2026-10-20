import { routes } from "@/config/routes";

export function getPostAuthRedirect(search: string): string {
  const next = new URLSearchParams(search).get("next");
  if (!next) return routes.home;

  const currentOrigin = "https://bron.local";
  const target = new URL(next, currentOrigin);
  if (target.origin !== currentOrigin || target.pathname !== routes.book) {
    return routes.home;
  }

  const shopId = target.searchParams.get("shopId");
  if (!shopId || !/^[1-9]\d*$/.test(shopId)) return routes.home;

  const safeParams = new URLSearchParams({ shopId });
  for (const key of ["serviceId", "branchId"] as const) {
    const value = target.searchParams.get(key);
    if (value && /^[1-9]\d*$/.test(value)) {
      safeParams.set(key, value);
    }
  }

  return `${routes.book}?${safeParams.toString()}`;
}
