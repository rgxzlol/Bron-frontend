import { branchesApi, servicesApi } from "@/lib/api";
import type { BranchListItem, ServiceListItem } from "@/lib/api/types";
import type { ShopService } from "@/types/shops.types";

export type BookingTargetIds = {
  serviceId: number;
  branchId: number;
  durationMin: number;
};

function parsePositiveId(value: string | number | null | undefined): number | null {
  if (typeof value === "number" && Number.isInteger(value) && value > 0) {
    return value;
  }

  if (typeof value === "string" && /^\d+$/.test(value)) {
    const parsed = Number(value);
    return parsed > 0 ? parsed : null;
  }

  return null;
}

function isActiveService(service: ServiceListItem) {
  return service.is_active !== false;
}

function isBookableShopService(service: ShopService) {
  return service.kind !== "product";
}

export function pickBookableShopService(
  services: ShopService[] | undefined,
  selectedServiceIds: string[] = [],
): ShopService | undefined {
  const items = (services ?? []).filter(isBookableShopService);

  if (selectedServiceIds.length > 0) {
    const selected = items.find((item) => selectedServiceIds.includes(item.id));
    if (selected) return selected;
  }

  return items[0];
}

function pickLiveService(
  services: ServiceListItem[],
  preferredId: number | null,
): ServiceListItem | undefined {
  const active = services.filter(isActiveService);
  const pool = active.length > 0 ? active : services;

  if (preferredId != null) {
    const preferred = pool.find((item) => item.id === preferredId);
    if (preferred) return preferred;
  }

  return pool[0];
}

function pickLiveBranch(
  branches: BranchListItem[],
  preferredId: number | null,
): BranchListItem | undefined {
  if (preferredId != null) {
    const preferred = branches.find((item) => item.id === preferredId);
    if (preferred) return preferred;
  }

  return branches[0];
}

export async function resolveBookingTargetIds(params: {
  businessId: number;
  preferredServiceId?: string | number | null;
  preferredBranchId?: number | null;
  fallbackDurationMin?: number;
}): Promise<
  | { ok: true; targets: BookingTargetIds }
  | { ok: false; reason: "service" | "branch" }
> {
  const [services, branches] = await Promise.all([
    servicesApi.listByBusiness(params.businessId).catch(() => [] as ServiceListItem[]),
    branchesApi.listByBusiness(params.businessId).catch(() => [] as BranchListItem[]),
  ]);

  const preferredServiceId = parsePositiveId(params.preferredServiceId);
  const service = pickLiveService(services, preferredServiceId);

  if (!service) {
    return { ok: false, reason: "service" };
  }

  const branch = pickLiveBranch(branches, params.preferredBranchId ?? null);

  if (!branch) {
    return { ok: false, reason: "branch" };
  }

  const durationMin =
    (typeof service.duration === "number" && service.duration > 0
      ? service.duration
      : params.fallbackDurationMin) ?? 60;

  return {
    ok: true,
    targets: {
      serviceId: service.id,
      branchId: branch.id,
      durationMin,
    },
  };
}
