import { apiRequest } from "./client";
import type {
  LoginRequest,
  LoginResponse,
  RegisterRequest,
  UserOut,
} from "./types";

export const authApi = {
  register: (body: RegisterRequest) =>
    apiRequest<unknown>("/auth/register", { method: "POST", body }),

  login: (body: LoginRequest) =>
    apiRequest<LoginResponse>("/auth/login", { method: "POST", body }),

  me: (token?: string) =>
    apiRequest<UserOut>("/auth/me", { auth: true, token }),
};
