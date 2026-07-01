export const routes = {
  home: "/",
  map: "/map",
  business: "/business",
  bookings: "/bookings",
  support: "/support",
  auth: "/auth",
  login: "/login",
  register: "/register",
  profile: "/profile",
} as const;

export type AppRoute = (typeof routes)[keyof typeof routes];
