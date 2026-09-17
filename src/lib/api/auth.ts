import { ApiError, apiRequest } from "./client";
import type {
  LoginRequest,
  LoginResponse,
  RegisterRequest,
  RegisterResponse,
  UserOut,
} from "./types";

const DUPLICATE_ACCOUNT_MESSAGE = (phone: string) =>
  `Аккаунт с номером ${phone} уже зарегистрирован. Войдите с этим номером и паролем.`;

function isDuplicateRegistrationResponse(response: RegisterResponse) {
  const message = response.message ?? "";

  return (
    (response.user_id == null || response.user_id <= 0) &&
    /already registered|proceeding to login/i.test(message)
  );
}

function mapAuthError(status: number, message: string): string {
  if (status !== 401) return message;

  if (/invalid username or password/i.test(message)) {
    return "Неверный телефон или пароль. Войдите по номеру, указанному при регистрации.";
  }

  if (/unauthorized/i.test(message)) {
    return "Сессия истекла. Войдите в аккаунт снова.";
  }

  return message;
}

function assertRegisterSucceeded(response: RegisterResponse) {
  if (response.user_id != null && response.user_id > 0) {
    return response;
  }

  const message = response.message ?? "";

  if (/created successfully/i.test(message)) {
    return response;
  }

  return response;
}

async function withAuthErrorMapping<T>(request: () => Promise<T>): Promise<T> {
  try {
    return await request();
  } catch (error) {
    if (error instanceof ApiError) {
      throw new ApiError(
        error.status,
        mapAuthError(error.status, error.message),
        error.data,
      );
    }

    throw error;
  }
}

export const authApi = {
  register: async (body: RegisterRequest) => {
    const response = await apiRequest<RegisterResponse>("/auth/register", {
      method: "POST",
      body,
    });

    return assertRegisterSucceeded(response);
  },

  registerOrSignIn: async (
    registerBody: RegisterRequest,
    loginBody: LoginRequest,
  ) => {
    const response = await apiRequest<RegisterResponse>("/auth/register", {
      method: "POST",
      body: registerBody,
    });

    if (isDuplicateRegistrationResponse(response)) {
      try {
        return await withAuthErrorMapping(() =>
          apiRequest<LoginResponse>("/auth/login", { method: "POST", body: loginBody }),
        );
      } catch (error) {
        if (error instanceof ApiError && error.status === 401) {
          throw new ApiError(
            409,
            DUPLICATE_ACCOUNT_MESSAGE(registerBody.phone),
            response,
          );
        }

        throw error;
      }
    }

    assertRegisterSucceeded(response);

    return withAuthErrorMapping(() =>
      apiRequest<LoginResponse>("/auth/login", { method: "POST", body: loginBody }),
    );
  },

  login: (body: LoginRequest) =>
    withAuthErrorMapping(() =>
      apiRequest<LoginResponse>("/auth/login", { method: "POST", body }),
    ),

  me: (token?: string) =>
    withAuthErrorMapping(() =>
      apiRequest<UserOut>("/auth/me", { auth: true, token }),
    ),
};
