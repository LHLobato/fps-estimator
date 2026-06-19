import api, {
  clearAccessToken,
  refreshAccessToken,
  setAccessToken,
} from "./config";

export interface UserCreateSchema {
  email: string;
  password: string;
  name?: string;
  profile_photo?: string;
  gpu: string;
  cpu: string;
  ram: string;
}

export interface LoginSchema {
  email: string;
  password: string;
}

export interface CodeSchema {
  email: string;
  code: string;
}

export interface DefaultResponse {
  status: string;
  message: string;
}

export interface SignupResponse extends DefaultResponse {
  user_id: string;
}

export interface AuthResponse {
  access_token: string;
  token_type: string;
  user_id?: string;
  message?: string;
}

export interface UserBase {
  email: string;
  name?: string;
}

export interface PasswordResetSchema {
  new_password: string;
  reset_token: string;
}

export interface UserResponse {
  id: string;
  name?: string;
  email: string;
  profile_photo?: string;
  gpu?: string;
  cpu?: string;
  ram?: string;
}

export async function sign_in(userData: UserCreateSchema): Promise<SignupResponse> {
  const response = await api.post<SignupResponse>("/auth/sign_in", userData);
  return response.data;
}

export async function verify_code_sign(userData: CodeSchema): Promise<AuthResponse> {
  const response = await api.post<AuthResponse>("/auth/verify_code_sig", userData);
  setAccessToken(response.data.access_token);
  return response.data;
}

export async function login(userData: LoginSchema): Promise<DefaultResponse> {
  const response = await api.post<DefaultResponse>("/auth/login", userData);
  return response.data;
}

export async function verify_code_login(userData: CodeSchema): Promise<AuthResponse> {
  const response = await api.post<AuthResponse>("/auth/verify_code_log", userData);
  setAccessToken(response.data.access_token);
  return response.data;
}

export async function refresh_token(): Promise<AuthResponse> {
  const access_token = await refreshAccessToken();
  return { access_token, token_type: "bearer" };
}

export async function get_current_user(): Promise<UserResponse> {
  const response = await api.get<UserResponse>("/auth/me");
  return response.data;
}

export async function logout(): Promise<void> {
  try {
    await api.post("/auth/logout");
  } finally {
    clearAccessToken();
  }
}

export async function forgot_password(userData: UserBase): Promise<DefaultResponse> {
  const response = await api.post<DefaultResponse>("/auth/forgotpassword", userData);
  return response.data;
}

export async function verify_recovery_code(
  userData: CodeSchema,
): Promise<{ reset_token: string }> {
  const response = await api.post<{ reset_token: string }>(
    "/auth/verify_recovery_code",
    userData,
  );
  return response.data;
}

export async function reset_password(
  userData: PasswordResetSchema,
): Promise<AuthResponse> {
  const response = await api.post<AuthResponse>(
    "/auth/change_password",
    userData,
  );
  setAccessToken(response.data.access_token);
  return response.data;
}
