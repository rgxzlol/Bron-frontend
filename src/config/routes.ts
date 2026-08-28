export const routes = {
  home: "/",
  map: "/map",
  business: "/business",
  businessApplication: "/business/application",
  bookings: "/bookings",
  support: "/support",
  auth: "/auth",
  login: "/login",
  register: "/register",
  profile: "/profile",
  book: "/book",
} as const;

export type AppRoute = (typeof routes)[keyof typeof routes];
