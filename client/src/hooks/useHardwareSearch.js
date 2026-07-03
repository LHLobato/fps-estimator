import { useEffect, useMemo, useState } from 'react';
import * as hardwareAPI from '../api/hardware';

function useDebouncedHardwareSearch(searchTerm, fetcher, resultKey, limit = 10, debounceMs = 300) {
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
  }, [term, fetcher, resultKey, limit, debounceMs]);

  return { results: term ? results : [], loading: term ? loading : false };
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
