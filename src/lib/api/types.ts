export type LoginRequest = {
  username: string;
  password: string;
};

export type RegisterRequest = {
  username: string;
  email: string;
  phone: string;
  password: string;
  first_name?: string;
  last_name?: string;
};

export type RegisterResponse = {
  message?: string;
  user_id?: number | null;
};

export type LoginResponse = {
  access_token: string;
  user_id: number;
  username: string;
  tg_token?: string | null;
};

export type UserOut = {
  id: number;
  username: string;
  email: string;
  phone: string;
  first_name?: string | null;
  last_name?: string | null;
  avatar?: string | null;
  role?: string;
};

export type UserNotificationSettings = {
  push: boolean;
  email: boolean;
  bookingReminder: boolean;
  promotions: boolean;
};

export type InAppNotificationType =
  | "booking"
  | "payment"
  | "promotion"
  | "booking_created"
  | "booking_confirmed"
  | "booking_rejected"
  | "booking_cancelled";

export type InAppNotification = {
  id: string;
  type: InAppNotificationType;
  time: string;
  read: boolean;
  title?: string;
  description?: string;
  booking_id?: number | null;
};

export type ApiNotification = {
  id: number;
  notification_type: InAppNotificationType;
  title: string;
  message: string;
  is_read: boolean;
  booking_id: number | null;
  created_at: string;
};

export type NotificationsResponse = {
  items: ApiNotification[];
  count: number;
};

export type UserProfile = {
  id: number;
  username: string;
  email: string;
  phone: string;
  first_name?: string | null;
  last_name?: string | null;
  full_name?: string | null;
  avatar?: string | null;
  rating?: number | null;
  reviews_count?: number | null;
  telegram_id: number | null;
  role: string;
  language: string;
  is_verified: boolean;
  notification_settings?: UserNotificationSettings;
};

export type UserProfileUpdate = {
  username?: string | null;
  email?: string | null;
  phone?: string | null;
  first_name?: string | null;
  last_name?: string | null;
  language?: string | null;
  telegram_id?: number | null;
  notification_settings?: UserNotificationSettings;
};

export type ChangePasswordRequest = {
  old_password: string;
  new_password: string;
};

export type BusinessListItem = {
  id: number;
  owner_id?: number;
  name: string;
  category: BusinessCategory | string;
  address: string;
  phone: string;
  logo: string | null;
  views_count?: number;
};

export type BusinessCategory = {
  id: number;
  name: string;
  slug: string;
  icon?: string | null;
  business_count?: number;
};

export type Category = BusinessCategory;

export type Business = {
  id: number;
  owner_id: number;
  owner_username: string;
  name: string;
  description: string | null;
  logo: string | null;
  category: BusinessCategory | string;
  address: string;
  phone: string;
  latitude: number | null;
  longitude: number | null;
  tin?: string | null;
  website?: string | null;
  social_links?: Record<string, string | null | undefined>;
  comments?: string | null;
  status?: string | null;
  created_at: string;
  email?: string | null;
  owner_name?: string | null;
  views_count?: number;
};

export type BusinessCreate = {
  name: string;
  category_id: number;
  description?: string | null;
  address: string;
  phone: string;
  email: string;
  owner_name: string;
  latitude?: number | null;
  longitude?: number | null;
  tin?: string | null;
  website?: string | null;
  social_links?: Record<string, string | null | undefined>;
  comments?: string | null;
};

export type BusinessUpdate = Partial<BusinessCreate>;

export type BusinessCreateResponse = {
  message: string;
  business_id: number;
};

export type BusinessViewResponse = {
  counted: boolean;
  views_count: number;
};

export type BusinessStats = {
  total_bookings: number;
  pending_bookings: number;
  approved_bookings: number;
  cancelled_bookings: number;
  total_revenue: string;
};

export type Service = {
  id: number;
  business_id: number;
  title: string;
  description: string;
  category: string;
  duration: number;
  price: number | string;
  is_active: boolean;
  image?: string | null;
  capacity?: number;
};

export type ServiceListItem = {
  id: number;
  title: string;
  category: string;
  duration: number;
  price: number | string;
  description?: string | null;
  is_active?: boolean;
  image?: string | null;
  capacity?: number;
};

export type ServiceCreate = {
  business_id: number;
  title: string;
  description: string;
  category: string;
  duration: number;
  price: number;
  capacity?: number;
};

export type ServiceUpdate = Partial<
  Pick<Service, "title" | "description" | "category" | "duration" | "price" | "is_active" | "capacity">
>;

export type ServiceAvailableDate = {
  date: string;
  free_slots: number;
};

export type ServiceAvailabilitySlot = {
  start_time: string;
  end_time: string;
  available_spots: number;
  is_available: boolean;
};

export type ServiceAvailability = {
  slots: ServiceAvailabilitySlot[];
  capacity: number;
};

export type Product = {
  id: number;
  business_id: number;
  name: string;
  description: string | null;
  image: string | null;
  price: number;
  is_active: boolean;
};

export type ProductListItem = {
  id: number;
  name: string;
  price: number | string;
  description?: string | null;
  is_active?: boolean;
  image: string | null;
};

export type ProductCreate = {
  business_id: number;
  name: string;
  description?: string | null;
  price: number;
};

export type ProductUpdate = Partial<
  Pick<Product, "name" | "description" | "price" | "is_active">
>;

export type BranchListItem = {
  id: number;
  name: string;
  address: string;
  phone: string;
};

export type Branch = {
  id: number;
  business_id: number;
  name: string;
  address: string;
  phone: string;
  latitude: number | null;
  longitude: number | null;
};

export type BranchCreate = {
  business_id: number;
  name: string;
  address: string;
  phone: string;
  latitude?: number | null;
  longitude?: number | null;
};

export type BranchUpdate = Partial<Omit<BranchCreate, "business_id">>;

export type StaffListItem = {
  id: number;
  full_name: string;
  position: string;
  phone: string;
  is_active: boolean;
};

export type Staff = {
  id: number;
  business_id: number;
  full_name: string;
  position: string;
  phone: string;
  is_active: boolean;
};

export type StaffCreate = {
  business_id: number;
  full_name: string;
  position: string;
  phone?: string | null;
};

export type StaffUpdate = Partial<
  Pick<Staff, "full_name" | "position" | "phone" | "is_active">
>;

export type WorkingHours = {
  id: number;
  business_id: number;
  day_of_week: number;
  open_time: string;
  close_time: string;
  is_closed: boolean;
};

export type WorkingHoursCreate = {
  business_id: number;
  day_of_week: number;
  open_time: string;
  close_time: string;
  is_closed?: boolean;
};

export type WorkingHoursUpdate = Partial<
  Pick<WorkingHours, "open_time" | "close_time" | "is_closed">
>;

export type BlockedDate = {
  id: number;
  business_id: number;
  date: string;
  reason: string | null;
};

export type BlockedDateCreate = {
  business_id: number;
  date: string;
  reason?: string | null;
};

export type BlockedDateUpdate = {
  reason?: string | null;
};

export type BookingOrderItem = {
  id: string;
  name: string;
  price: number;
  quantity: number;
  kind?: "service" | "extra" | "product";
};

export type Booking = {
  id: number;
  user_id: number;
  business_id: number;
  service_id: number;
  branch_id: number;
  staff_id: number | null;
  booking_date: string;
  start_time: string;
  end_time: string;
  guest_count: number;
  total_price: number;
  status: string;
  items?: BookingOrderItem[];
};

export type BookingListItem = {
  id: number;
  booking_date: string;
  start_time: string;
  end_time?: string;
  status: string;
  total_price: number;
  business_id?: number;
  guest_count?: number;
  items?: BookingOrderItem[];
};

export type BookingCreate = {
  business_id: number;
  service_id: number;
  branch_id: number;
  staff_id?: number | null;
  booking_date: string;
  start_time: string;
  end_time: string;
  guest_count?: number;
  product_ids?: number[];
  items?: BookingOrderItem[];
  total_price?: number;
};

export type BookingUpdate = {
  staff_id?: number | null;
};

export type BookingAttendanceUpdate = {
  status: string;
  extra_wait_minutes?: number;
};

export type BookingReschedule = {
  booking_date: string;
  start_time: string;
  end_time: string;
};

export type BookingAvailableSlotsResponse = {
  slots: ServiceAvailabilitySlot[];
  capacity: number;
};

export type BusinessGalleryImage = {
  id: number;
  business_id: number;
  image: string;
  created_at: string;
};

export type BusinessLogoResponse = {
  id: number;
  logo: string;
};

export type Review = {
  id: number;
  user_id: number;
  user_username: string;
  business_id: number;
  customer_id?: number | null;
  booking_id?: number | null;
  review_type?: string;
  rating: number;
  comment: string;
  created_at: string;
};

export type ReviewCreate = {
  business_id: number;
  rating: number;
  comment: string;
};

export type CustomerReviewCreate = {
  booking_id: number;
  rating: number;
  comment?: string | null;
};

export type CustomerRating = {
  user_id: number;
  username: string;
  rating: number;
  reviews_count: number;
};

export type ReviewUpdate = {
  rating?: number;
  comment?: string;
};

export type Favorite = {
  id: number;
  user_id: number;
  business_id: number;
  business_name: string;
  created_at: string;
};

export type FavoriteCreate = {
  business_id: number;
};

export type BusinessApplicationStatusValue =
  | "pending"
  | "approved"
  | "rejected";

export type BusinessApplication = {
  id: number;
  user_id: number;
  company_name: string;
  tin?: string | null;
  sphere: string;
  location: string;
  phone: string;
  description?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  website?: string | null;
  social_links?: Record<string, unknown>;
  comments?: string | null;
  email?: string | null;
  owner_name?: string | null;
  category_id?: number | null;
  status: BusinessApplicationStatusValue | string;
  created_at: string;
};

export type BusinessApplicationCreate = {
  name: string;
  category_id: number;
  address: string;
  phone: string;
  email: string;
  owner_name: string;
  tin?: string | null;
  description?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  website?: string | null;
  social_links?: Record<string, string | null | undefined>;
  comments?: string | null;
};
