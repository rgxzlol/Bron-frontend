import {
  branchesApi,
  servicesApi,
  staffApi,
  workingHoursApi,
} from "@/lib/api";
import type {
  BranchListItem,
  ServiceAvailability,
  StaffListItem,
  WorkingHours,
} from "@/lib/api/types";

export type BookingApiContext = {
  branches: BranchListItem[];
  staff: StaffListItem[];
  workingHours: WorkingHours[];
};

export async function fetchBookingApiContext(
  businessId: number,
): Promise<BookingApiContext> {
  const [branches, staff, workingHours] = await Promise.all([
    branchesApi.listByBusiness(businessId),
    staffApi.listByBusiness(businessId),
    workingHoursApi.getByBusiness(businessId),
  ]);

  return {
    branches,
    staff: staff.filter((member) => member.is_active),
    workingHours,
  };
}

export function getShopHoursForDate(
  context: BookingApiContext | null,
  fallbackHours: string,
  date: Date,
) {
  if (!context?.workingHours.length) return fallbackHours;
  const dayOfWeek = (date.getDay() + 6) % 7;
  const day = context.workingHours.find(
    (item) => item.day_of_week === dayOfWeek,
  );
  if (!day) return "";
  if (day.is_closed) return "closed";
  return `${day.open_time.slice(0, 5)} - ${day.close_time.slice(0, 5)}`;
}

type AvailableSlotsParams = {
  serviceId: number;
  date: string;
  staffId?: number | null;
};

export async function fetchAvailableSlots({
  serviceId,
  date,
  staffId,
}: AvailableSlotsParams): Promise<ServiceAvailability> {
  return servicesApi.availability(serviceId, date, staffId ?? undefined);
}
