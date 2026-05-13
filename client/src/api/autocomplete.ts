import api from "./config";

// --- INTERFACES ---

export interface AutocompleteItem {
  id: string; // UUID vindo do backend
  name: string;
  type: "cpu" | "gpu" | "game";
  image_url?: string | null;
}

export interface AutocompleteData {
  status: string;
  timestamp: string; // ISO 8601
  cpus: AutocompleteItem[];
  gpus: AutocompleteItem[];
  games: AutocompleteItem[];
  total_items: number;
}

// --- FUNÇÕES DE API ---

/**
 * Retorna todos os CPUs, GPUs e jogos em uma única chamada.
 * Ideal para ser chamado uma vez no carregamento da aplicação (App.tsx ou Contexto)
 * e guardado em estado/cache no frontend.
 */
export async function get_autocomplete_data(): Promise<AutocompleteData> {
  const response = await api.get<AutocompleteData>("/autocomplete/data");
  return response.data;
}

/**
 * Retorna apenas a lista de CPUs.
 */
export async function get_autocomplete_cpus(): Promise<AutocompleteItem[]> {
  const response = await api.get<AutocompleteItem[]>("/autocomplete/cpus");
  return response.data;
}

/**
 * Retorna apenas a lista de GPUs.
 */
export async function get_autocomplete_gpus(): Promise<AutocompleteItem[]> {
  const response = await api.get<AutocompleteItem[]>("/autocomplete/gpus");
  return response.data;
}

/**
 * Retorna apenas a lista de Games.
 */
export async function get_autocomplete_games(): Promise<AutocompleteItem[]> {
  const response = await api.get<AutocompleteItem[]>("/autocomplete/games");
  return response.data;
}
