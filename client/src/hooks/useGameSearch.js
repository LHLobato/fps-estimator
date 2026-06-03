import { useEffect, useState } from 'react';
import * as hardwareAPI from '../api/hardware';

/**
 * Busca jogos no backend com debounce (sem carregar catálogo completo no cliente).
 */
export function useGameSearch(searchTerm, limit = 10, debounceMs = 300) {
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const term = searchTerm.trim();
    if (!term) {
      setResults([]);
      setLoading(false);
      return undefined;
    }

    let cancelled = false;
    setLoading(true);

    const timer = setTimeout(async () => {
      try {
        const data = await hardwareAPI.search_games(term, limit);
        if (!cancelled) {
          setResults(data.games ?? []);
        }
      } catch (err) {
        if (!cancelled) {
          console.error('Erro ao buscar jogos:', err);
          setResults([]);
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }, debounceMs);

    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [searchTerm, limit, debounceMs]);

  return { results, loading };
}
