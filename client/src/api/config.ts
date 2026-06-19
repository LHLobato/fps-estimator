import axios, { AxiosInstance } from "axios";
import {
  clearAccessToken,
  getAccessToken,
  setAccessToken,
} from "./token";

const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:8000";

const api: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true,
  headers: {
    "Content-Type": "application/json",
  },
});

// Interceptador para adicionar token JWT aos headers
api.interceptors.request.use(
  (config) => {
    const token = getAccessToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

const refreshClient = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true,
  headers: { "Content-Type": "application/json" },
});

let refreshPromise: Promise<string> | null = null;

export function refreshAccessToken(): Promise<string> {
  if (!refreshPromise) {
    refreshPromise = refreshClient
      .post<{ access_token: string }>("/auth/refresh_token")
      .then(({ data }) => {
        setAccessToken(data.access_token);
        return data.access_token;
      })
      .catch((error) => {
        clearAccessToken();
        throw error;
      })
      .finally(() => {
        refreshPromise = null;
      });
  }

  return refreshPromise;
}

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    const url = originalRequest?.url || "";
    const isAuthRequest = [
      "/auth/login",
      "/auth/verify_code_log",
      "/auth/verify_code_sig",
      "/auth/refresh_token",
      "/auth/logout",
    ].some((path) => url.includes(path));

    if (error.response?.status !== 401 || originalRequest?._retry || isAuthRequest) {
      return Promise.reject(error);
    }

    originalRequest._retry = true;
    try {
      const token = await refreshAccessToken();
      originalRequest.headers.Authorization = `Bearer ${token}`;
      return api(originalRequest);
    } catch (refreshError) {
      window.dispatchEvent(new Event("auth:session-expired"));
      return Promise.reject(refreshError);
    }
  },
);

export { clearAccessToken, getAccessToken, setAccessToken };
export default api;
export { API_BASE_URL };

export async function get_me(): Promise<UserResponse> {
  const response = await api.get<UserResponse>("/auth/me");
  return response.data;
}

export async function forgot_password(
  data: UserBase,
): Promise<DefaultResponse> {
  const response = await api.post<DefaultResponse>(
    "/auth/forgotpassword",
    data,
  );
  return response.data;
}

export async function verify_recovery_code(
  data: CodeSchema,
): Promise<VerifyRecoveryResponse> {
  const response = await api.post<VerifyRecoveryResponse>(
    "/auth/verify_recovery_code",
    data,
  );
  return response.data;
}

export async function change_password(
  data: PasswordResetSchema,
): Promise<AuthResponse> {
  const response = await api.post<AuthResponse>("/auth/change_password", data);
  return response.data;
}
