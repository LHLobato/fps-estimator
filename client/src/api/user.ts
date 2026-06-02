import api from "./config";

// --- INTERFACES ---

export interface UserAlterSetup {
  email?: string;
  name?: string;
  gpu?: string;
  cpu?: string;
  ram?: string;
}

export interface UserAlter {
  email?: string;
  name?: string;
  profile_photo?: string;
  gpu?: string;
  cpu?: string;
  ram?: string;
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

export interface ExcludeAccountRequest {
  password: string;
}

export interface ExcludeAccountResponse {
  status: string;
  message: string;
  user_id: string;
}

// --- FUNÇÕES DE API ---

// Obtém os dados do usuário atual autenticado (Requer Autenticação)
export async function get_current_user(): Promise<UserResponse> {
  const response = await api.get<UserResponse>("/auth/me");
  return response.data;
}

// Atualiza especificamente o setup (hardware) do usuário (Requer Autenticação)
export async function edit_user_setup(
  data: UserAlterSetup,
): Promise<UserResponse> {
  const response = await api.post<UserResponse>("/profile/edit_setup", data);
  return response.data;
}

// Atualiza o perfil completo do usuário (Requer Autenticação)
export async function edit_user_profile(
  data: UserAlter,
): Promise<UserResponse> {
  const response = await api.post<UserResponse>("/profile/edit", data);
  return response.data;
}

// Exclui a conta do usuário (Requer Autenticação e Confirmação de Senha)
export async function exclude_account(
  data: ExcludeAccountRequest,
): Promise<ExcludeAccountResponse> {
  // Atenção: No Axios, métodos DELETE que exigem envio de JSON no corpo
  // precisam passar a informação dentro da propriedade "data" no objeto de configuração.
  const response = await api.delete<ExcludeAccountResponse>(
    "/profile/exclude-account",
    {
      data: data,
    },
  );
  return response.data;
}
