export const routes = {
  home: "/",
  map: "/map",
  business: "/business",
  bookings: "/bookings",
  support: "/support",
  auth: "/auth",
  profile: "/profile",
} as const;

export type AppRoute = (typeof routes)[keyof typeof routes];
