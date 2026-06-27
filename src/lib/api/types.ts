export type LoginRequest = {
  username: string;
  password: string;
};

export type RegisterRequest = {
  username: string;
  email: string;
  phone: string;
  password: string;
};

export type LoginResponse = {
  access_token: string;
  user_id: number;
  username: string;
};

export type UserOut = {
  id: number;
  username: string;
  email: string;
  phone: string;
  role?: string;
};

export type UserProfile = {
  id: number;
  username: string;
  email: string;
  phone: string;
  telegram_id: number | null;
  role: string;
  language: string;
  is_verified: boolean;
};

export type UserProfileUpdate = {
  email?: string | null;
  phone?: string | null;
  language?: string | null;
  telegram_id?: number | null;
};

export type BusinessListItem = {
  id: number;
  name: string;
  category: string;
  address: string;
  phone: string;
  logo: string | null;
};

export type Business = {
  id: number;
  owner_id: number;
  owner_username: string;
  name: string;
  description: string | null;
  logo: string | null;
  category: string;
  address: string;
  phone: string;
  latitude: number | null;
  longitude: number | null;
  created_at: string;
};

export type BusinessCreate = {
  name: string;
  description?: string | null;
  category: string;
  address: string;
  phone: string;
  latitude?: number | null;
  longitude?: number | null;
};

export type BusinessUpdate = Partial<BusinessCreate>;

export type Service = {
  id: number;
  business_id: number;
  title: string;
  description: string;
  category: string;
  duration: number;
  price: number;
  is_active: boolean;
};

export type ServiceListItem = {
  id: number;
  title: string;
  category: string;
  duration: number;
  price: number;
};

export type ServiceCreate = {
  business_id: number;
  title: string;
  description: string;
  category: string;
  duration: number;
  price: number;
};

export type ServiceUpdate = Partial<
  Pick<Service, "title" | "description" | "category" | "duration" | "price" | "is_active">
>;

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
  price: number;
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
};

export type BookingListItem = {
  id: number;
  booking_date: string;
  start_time: string;
  status: string;
  total_price: number;
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
};

export type BookingUpdate = {
  status?: string | null;
  staff_id?: number | null;
};
