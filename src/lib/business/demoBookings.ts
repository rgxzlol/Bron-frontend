import type { BusinessBookingRequest, BusinessService } from "@/store/business.store";
import type { Booking } from "@/lib/api/types";

export type DemoBusinessBooking = Booking & {
  customer_name: string;
};

export const DEMO_BUSINESS_BOOKINGS: DemoBusinessBooking[] = [
  {
    id: 101,
    user_id: 2,
    business_id: 1,
    service_id: 1,
    branch_id: 1,
    staff_id: null,
    booking_date: "2026-08-29",
    start_time: "18:00",
    end_time: "19:00",
    guest_count: 2,
    total_price: 98000,
    status: "pending",
    customer_name: "Maria Petrova",
  },
  {
    id: 102,
    user_id: 3,
    business_id: 1,
    service_id: 1,
    branch_id: 1,
    staff_id: null,
    booking_date: "2026-08-30",
    start_time: "12:00",
    end_time: "13:00",
    guest_count: 1,
    total_price: 80000,
    status: "approved",
    customer_name: "Иван Иванов",
  },
];

export function getDemoBusinessBookingsForApi(businessId: number): DemoBusinessBooking[] {
  return DEMO_BUSINESS_BOOKINGS.filter((booking) => booking.business_id === businessId);
}

export function getFallbackBusinessBookings(
  services: BusinessService[],
): BusinessBookingRequest[] {
  const serviceName =
    services.find((service) => service.type !== "product")?.name ?? "Йога";

  return [
    {
      id: "demo-booking-pending",
      time: "18:00",
      customerName: "Maria Petrova",
      serviceName,
      price: 98000,
      status: "pending",
    },
    {
      id: "demo-booking-confirmed",
      time: "12:00",
      customerName: "Иван Иванов",
      serviceName,
      price: 80000,
      status: "accepted",
    },
  ];
}
