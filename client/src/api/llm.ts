import api from "./config";

// --- INTERFACES (Alinhadas com schemas.py) ---

export interface EstimateInput {
  gamename: string;
  preset: string;
  resolution: string;
  upscaling: string;
  // Para usuários não logados, o hardware é obrigatório na requisição
  gpu: string; // Ex: "RTX 5060"
  cpu: string; // Ex: "Ryzen 7 5700X"
  ram: string; // Ex: "16GB" ou "32GB"
}

export interface AuthEstimateInput {
  gamename: string;
  preset: string;
  resolution: string;
  upscaling: string;
  // Hardware não é enviado aqui, o FastAPI puxa do banco usando o token JWT
}

export interface EstimateOutput {
  avg_fps: number;
  min_fps: number;
  max_fps: number;
}

// --- FUNÇÕES DE API (Alinhadas com llm_router.py) ---

// Estimativa para usuários anônimos
export async function estimate_fps(
  data: EstimateInput,
): Promise<EstimateOutput> {
  const response = await api.post<EstimateOutput>("/estimate/ask_llm", data);
  return response.data;
}

// Estimativa para usuários logados (Requer Autenticação)
// O usuário já precisa ter GPU, CPU e RAM cadastrados no perfil, senão o backend retorna 400.
export async function estimate_fps_auth(
  data: AuthEstimateInput,
): Promise<EstimateOutput> {
  const response = await api.post<EstimateOutput>(
    "/estimate/ask_llm/auth",
    data,
  );
  return response.data;
}
