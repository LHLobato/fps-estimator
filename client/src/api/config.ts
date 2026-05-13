import api from "./config";

export interface UserCreateSchema {
  email: string;
  password: string;
  name?: string;
  profile_photo?: string;
  gpu?: string;
  cpu?: string;
  ram?: string;
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
  refresh_token?: string;
  token_type: string;
  user_id?: string;
  message?: string;
}

export interface RefreshTokenRequest {
  refresh_token: string;
}

export interface UserBase {
  email: string;
  name?: string;
}

export interface VerifyRecoveryResponse {
  reset_token: string;
}

export interface PasswordResetSchema {
  new_password: string;
  reset_token: string;
}

export interface UserResponse {
  id: string;
  email: string;
  name?: string;
  profile_photo?: string;
  gpu_id?: string;
  cpu_id?: string;
  ram?: string;
}

export async function sign_in(
  userData: UserCreateSchema,
): Promise<SignupResponse> {
  const response = await api.post<SignupResponse>("/auth/sign_in", userData);
  return response.data;
}

export async function verify_code_sign(
  userData: CodeSchema,
): Promise<AuthResponse> {
  const response = await api.post<AuthResponse>(
    "/auth/verify_code_sig",
    userData,
  );
  return response.data;
}

export async function login(userData: LoginSchema): Promise<DefaultResponse> {
  const response = await api.post<DefaultResponse>("/auth/login", userData);
  return response.data;
}

export async function verify_code_login(
  userData: CodeSchema,
): Promise<AuthResponse> {
  const response = await api.post<AuthResponse>(
    "/auth/verify_code_log",
    userData,
  );
  return response.data;
}

export async function refresh_token(
  data: RefreshTokenRequest,
): Promise<AuthResponse> {
  const response = await api.post<AuthResponse>("/auth/refresh_token", data);
  return response.data;
}

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
