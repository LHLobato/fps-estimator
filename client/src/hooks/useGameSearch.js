import { useEffect, useMemo, useState } from 'react';
import * as hardwareAPI from '../api/hardware';

/**
 * Busca jogos no backend com debounce (sem carregar catálogo completo no cliente).
 */
export function useGameSearch(searchTerm, limit = 10, debounceMs = 300) {
  const term = useMemo(() => searchTerm.trim(), [searchTerm]);
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!term) {
      return undefined;
    }

    let cancelled = false;

    const timer = setTimeout(async () => {
      setLoading(true);

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
  }, [term, limit, debounceMs]);

  return { results: term ? results : [], loading: term ? loading : false };
}
