import {
  branchesApi,
  bookingsApi,
  staffApi,
  workingHoursApi,
} from "@/lib/api";
import type {
  BookingAvailableSlotsResponse,
  BranchListItem,
  StaffListItem,
  WorkingHours,
} from "@/lib/api/types";
import { workingHoursToRangeString } from "@/lib/booking/timeSlots";

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
  return workingHoursToRangeString(context.workingHours, date) ?? "Закрыто";
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
}: AvailableSlotsParams): Promise<BookingAvailableSlotsResponse> {
  return bookingsApi.availableSlots({
    business_id: businessId,
    service_id: serviceId,
    branch_id: branchId,
    date,
    staff_id: staffId ?? undefined,
  });
}
