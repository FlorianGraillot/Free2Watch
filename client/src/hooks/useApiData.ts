import { useEffect, useRef, useState, type DependencyList } from 'react';
import { apiErrorMessage } from '../services/api';

interface AsyncState<T> {
  data: T | null;
  loading: boolean;
  error: string | null;
}

/**
 * Small data-fetching hook with cancellation-safe state updates.
 * Existing data stays visible while a new request is in flight.
 */
export function useApiData<T>(
  loader: () => Promise<T>,
  deps: DependencyList,
  options: { enabled?: boolean } = {}
) {
  const enabled = options.enabled !== false;
  const [state, setState] = useState<AsyncState<T>>({ data: null, loading: enabled, error: null });
  const [tick, setTick] = useState(0);
  const loaderRef = useRef(loader);
  loaderRef.current = loader;

  useEffect(() => {
    if (!enabled) {
      setState({ data: null, loading: false, error: null });
      return;
    }

    let active = true;
    setState((current) => ({ ...current, loading: true, error: null }));

    loaderRef
      .current()
      .then((data) => {
        if (active) setState({ data, loading: false, error: null });
      })
      .catch((error: unknown) => {
        if (active) {
          setState((current) => ({
            ...current,
            loading: false,
            error: apiErrorMessage(error, 'Unable to load data. Please try again.'),
          }));
        }
      });

    return () => {
      active = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [...deps, enabled, tick]);

  const refresh = () => setTick((value) => value + 1);

  return { ...state, refresh, setData: (data: T) => setState({ data, loading: false, error: null }) };
}

export function useDebouncedValue<T>(value: T, delay = 350): T {
  const [debounced, setDebounced] = useState(value);

  useEffect(() => {
    const timer = window.setTimeout(() => setDebounced(value), delay);
    return () => window.clearTimeout(timer);
  }, [value, delay]);

  return debounced;
}
