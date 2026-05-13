import api from "./config";

// --- INTERFACES ---

export interface HardwareItem {
  id: string; // UUID em formato de string
  name: string;
}

export interface GameHardwareItem {
  id: string; // UUID em formato de string
  name: string;
  image_url?: string;
}

export interface GpusResponse {
  gpus: HardwareItem[];
}

export interface CpusResponse {
  cpus: HardwareItem[];
}

export interface GamesHardwareResponse {
  games: GameHardwareItem[];
}

// --- FUNÇÕES DE API ---

// Retorna a lista de todas as GPUs cadastradas no banco
export async function get_gpus_list(): Promise<GpusResponse> {
  const response = await api.get<GpusResponse>("/hardware/gpus");
  return response.data;
}

// Retorna a lista de todas as CPUs cadastradas no banco
export async function get_cpus_list(): Promise<CpusResponse> {
  const response = await api.get<CpusResponse>("/hardware/cpus");
  return response.data;
}

// Retorna a lista de jogos disponíveis para preenchimento (com imagens)
export async function get_games_list(): Promise<GamesHardwareResponse> {
  const response = await api.get<GamesHardwareResponse>("/hardware/games");
  return response.data;
}
