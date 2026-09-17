import {
  blockedDatesApi,
  branchesApi,
  bookingsApi,
  staffApi,
  workingHoursApi,
} from "@/lib/api";
import { formatBookingDate } from "@/lib/api/mappers";
import type {
  BlockedDate,
  BranchListItem,
  StaffListItem,
  WorkingHours,
} from "@/lib/api/types";
import { workingHoursToRangeString } from "@/lib/booking/timeSlots";

export type BookingApiContext = {
  branches: BranchListItem[];
  staff: StaffListItem[];
  workingHours: WorkingHours[];
  todayHours: WorkingHours | null;
  blockedDates: Set<string>;
};

function collectBlockedDates(items: BlockedDate[]) {
  return new Set(items.map((item) => item.date.slice(0, 10)));
}

export async function fetchBookingApiContext(
  businessId: number,
): Promise<BookingApiContext> {
  const [branches, staff, workingHours, todayHours, blockedDates] =
    await Promise.all([
      branchesApi.listByBusiness(businessId).catch(() => []),
      staffApi.listByBusiness(businessId).catch(() => []),
      workingHoursApi.getByBusiness(businessId).catch(() => []),
      workingHoursApi.getToday(businessId).catch(() => null),
      blockedDatesApi.getByBusiness(businessId).catch(() => []),
    ]);

  return {
    branches,
    staff: staff.filter((member) => member.is_active),
    workingHours,
    todayHours,
    blockedDates: collectBlockedDates(blockedDates),
  };
}

export function getShopHoursForDate(
  context: BookingApiContext | null,
  fallbackHours: string,
  date: Date,
) {
  if (!context?.workingHours.length) return fallbackHours;
  return workingHoursToRangeString(context.workingHours, date) ?? "Закрыто";
}

export function isBookingDateUnavailable(
  context: BookingApiContext | null,
  date: Date,
) {
  const dateKey = formatBookingDate(date);
  if (context?.blockedDates.has(dateKey)) return true;

  if (!context?.workingHours.length) return false;

  return workingHoursToRangeString(context.workingHours, date) == null;
}

type AvailableSlotsParams = {
  businessId: number;
  serviceId: number;
  branchId: number;
  date: string;
  staffId?: number | null;
};

export async function fetchAvailableSlots({
  businessId,
  serviceId,
  branchId,
  date,
  staffId,
}: AvailableSlotsParams) {
  try {
    const slots = await bookingsApi.availableSlots({
      business_id: businessId,
      service_id: serviceId,
      branch_id: branchId,
      date,
      staff_id: staffId ?? undefined,
    });

    return slots
      .map((slot) => slot.slice(0, 5))
      .filter((slot) => /^\d{2}:\d{2}$/.test(slot));
  } catch {
    return null;
  }
}
