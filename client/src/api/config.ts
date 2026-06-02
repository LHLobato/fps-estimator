import axios, { AxiosInstance } from "axios";

const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:8000";

const api: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

// Interceptador para adicionar token JWT aos headers
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("access_token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
      console.log('[API] Token adicionado ao request:', { url: config.url, token: token.slice(0, 20) + '...' });
    } else {
      console.log('[API] Nenhum token disponível para:', config.url);
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Interceptador para lidar com respostas
api.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    // Se receber 401, limpar token e redirecionar para login
    if (error.response?.status === 401) {
      localStorage.removeItem("access_token");
      localStorage.removeItem("refresh_token");
      // Aqui você pode redirecionar para a página de login
      // window.location.href = "/login";
    }
    return Promise.reject(error);
  }
);

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
