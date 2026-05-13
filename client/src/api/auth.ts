import api from "./config";

export interface UserSchema {
  nome: string;
  email: string;
  senha: string;
}

export interface LoginSchema {
  email: string;
  senha: string;
}

export interface CodeSchema {
  email: string;
  code: string;
}

export interface DefaultResponse {
  status: string;
  message: string;
}

export interface AuthResponse {
  access_token: string;
  refresh_token?: string;
  token_type: string;
  message?: string;
}

export async function sign_in(userData: UserSchema): Promise<DefaultResponse> {
  const response = await api.post<DefaultResponse>("/auth/sign_in", userData);
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

export async function verify_code_login(
  userData: CodeSchema,
): Promise<AuthResponse> {
  const response = await api.post<AuthResponse>(
    "/auth/verify_code_log",
    userData,
  );
  return response.data;
}

export async function login(userData: LoginSchema): Promise<DefaultResponse> {
  const response = await api.post<DefaultResponse>("/auth/login", userData);
  return response.data;
}
