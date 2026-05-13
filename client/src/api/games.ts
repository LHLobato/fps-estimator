import api from "./config";

// --- INTERFACES (Alinhadas com schemas.py) ---

export interface GameSchema {
  game_name: string;
  game_id: string; // UUID
  avg_fps: number;
  min_fps: number;
  max_fps: number;
  preset: string;
  resolution: string;
  upscaling: string;
}

export interface GameListResponse {
  status: string;
  items?: GameSchema[];
}

export interface GameInfo {
  id: string; // UUID
  name: string;
  image_url?: string;
}

export interface GameListInfoResponse {
  status: string;
  count?: number;
  games: GameInfo[];
}

export interface GameInfoResponse {
  status: string;
  game: GameInfo;
}

export interface DefaultResponse {
  status: string;
  message: string;
}

// --- FUNÇÕES DE API (Alinhadas com game_router.py) ---

// Retorna apenas uma lista simples com os nomes dos jogos (string[])
export async function list_games_names(): Promise<{ games: string[] }> {
  const response = await api.get<{ games: string[] }>("/games/list");
  return response.data;
}

// Retorna todos os jogos com UUID, Nome e Imagem
export async function get_all_games_info(): Promise<GameListInfoResponse> {
  const response = await api.get<GameListInfoResponse>("/games/all-info");
  return response.data;
}

// Busca a info de um jogo específico pelo UUID ou pelo Nome
export async function get_game_info(
  game_identifier: string,
): Promise<GameInfoResponse> {
  const response = await api.get<GameInfoResponse>(
    `/games/${game_identifier}/info`,
  );
  return response.data;
}

// Salva o benchmark de um jogo no perfil do usuário (Requer Autenticação)
export async function include_game(
  gameData: GameSchema,
): Promise<DefaultResponse> {
  const response = await api.post<DefaultResponse>("/games/include", gameData);
  return response.data;
}

// Lista os jogos salvos no perfil do usuário logado (Requer Autenticação)
export async function get_user_games(): Promise<GameListResponse> {
  const response = await api.get<GameListResponse>("/games/user_list");
  return response.data;
}
