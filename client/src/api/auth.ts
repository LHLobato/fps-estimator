import api from "./config";

// --- INTERFACES (Alinhadas com schemas.py) ---

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

// --- FUNÇÕES DE API (Alinhadas com auth_router.py) ---

// Criar nova conta (requer GPU, CPU, RAM)
export async function sign_in(userData: UserCreateSchema): Promise<SignupResponse> {
  const response = await api.post<SignupResponse>("/auth/sign_in", userData);
  return response.data;
}

// Verificar código OTP de signup
export async function verify_code_sign(userData: CodeSchema): Promise<AuthResponse> {
  const response = await api.post<AuthResponse>("/auth/verify_code_sig", userData);
  return response.data;
}

// Login (envia OTP por email)
export async function login(userData: LoginSchema): Promise<DefaultResponse> {
  const response = await api.post<DefaultResponse>("/auth/login", userData);
  return response.data;
}

// Verificar código OTP de login
export async function verify_code_login(userData: CodeSchema): Promise<AuthResponse> {
  const response = await api.post<AuthResponse>("/auth/verify_code_log", userData);
  return response.data;
}

// Renovar access_token usando refresh_token
export async function refresh_token(
  body: RefreshTokenRequest,
): Promise<AuthResponse> {
  const response = await api.post<AuthResponse>("/auth/refresh_token", body);
  return response.data;
}

// Obter dados do usuário logado (Requer Autenticação)
export async function get_current_user(): Promise<UserResponse> {
  const response = await api.get<UserResponse>("/auth/me");
  return response.data;
}

// Solicitar recuperação de senha (envia OTP por email)
export async function forgot_password(userData: UserBase): Promise<DefaultResponse> {
  const response = await api.post<DefaultResponse>("/auth/forgotpassword", userData);
  return response.data;
}

// Verificar código de recuperação de senha
export async function verify_recovery_code(
  userData: CodeSchema,
): Promise<{ reset_token: string }> {
  const response = await api.post<{ reset_token: string }>(
    "/auth/verify_recovery_code",
    userData,
  );
  return response.data;
}

// Resetar senha com token
export async function reset_password(
  userData: PasswordResetSchema,
): Promise<AuthResponse> {
  const response = await api.post<AuthResponse>(
    "/auth/change_password",
    userData,
  );
  return response.data;
}
