'use client';

import { useCallback, useEffect, useState } from 'react';
import { apiRequest, errorMessage } from '@/lib/api';

interface QueryResult<T> {
  key: string;
  data?: T;
  error?: string;
}

/**
 * Fetches `path` whenever it changes. Keeps showing the previous data while a new request is in
 * flight (no flicker when paging or searching) and exposes `reload()` after mutations.
 */
export function useApiQuery<T>(path: string) {
  const [reloadCount, setReloadCount] = useState(0);
  const [result, setResult] = useState<QueryResult<T> | null>(null);
  const [lastData, setLastData] = useState<T | undefined>(undefined);
  const requestKey = `${path}#${reloadCount}`;

  useEffect(() => {
    const controller = new AbortController();
    apiRequest<T>(path, { signal: controller.signal })
      .then((data) => {
        setResult({ key: requestKey, data });
        setLastData(data);
      })
      .catch((err: unknown) => {
        if (!controller.signal.aborted) setResult({ key: requestKey, error: errorMessage(err) });
      });
    return () => controller.abort();
  }, [path, requestKey]);

  const reload = useCallback(() => setReloadCount((count) => count + 1), []);
  const loading = result?.key !== requestKey;

  return {
    data: lastData,
    error: loading ? undefined : result?.error,
    loading,
    reload,
  };
}
