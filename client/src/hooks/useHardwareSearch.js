import { useEffect, useState } from 'react';
import * as hardwareAPI from '../api/hardware';

function useDebouncedHardwareSearch(searchTerm, fetcher, resultKey, limit = 10, debounceMs = 300) {
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
        const data = await fetcher(term, limit);
        if (!cancelled) {
          setResults(data[resultKey] ?? []);
        }
      } catch (err) {
        if (!cancelled) {
          console.error(`Erro ao buscar ${resultKey}:`, err);
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

export function useCpuSearch(searchTerm, limit = 10, debounceMs = 300) {
  return useDebouncedHardwareSearch(
    searchTerm,
    hardwareAPI.search_cpus,
    'cpus',
    limit,
    debounceMs,
  );
}

export function useGpuSearch(searchTerm, limit = 10, debounceMs = 300) {
  return useDebouncedHardwareSearch(
    searchTerm,
    hardwareAPI.search_gpus,
    'gpus',
    limit,
    debounceMs,
  );
}
