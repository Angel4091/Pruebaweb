import { useCallback, useEffect, useRef, useState } from 'react';

/**
 * Ejecuta una función asíncrona y expone { data, loading, error, reload }.
 * Se vuelve a ejecutar cuando cambian las dependencias e ignora respuestas
 * que llegan tarde (si el componente cambió de sucursal, por ejemplo).
 */
export function useFetch(fn, deps = []) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const requestId = useRef(0);

  // eslint-disable-next-line react-hooks/exhaustive-deps
  const run = useCallback(fn, deps);

  const reload = useCallback(async ({ silencioso = false } = {}) => {
    const id = ++requestId.current;
    if (!silencioso) setLoading(true);
    setError(null);
    try {
      const result = await run();
      if (id === requestId.current) setData(result);
    } catch (err) {
      if (id === requestId.current) setError(err);
    } finally {
      if (id === requestId.current) setLoading(false);
    }
  }, [run]);

  useEffect(() => {
    reload();
  }, [reload]);

  return { data, loading, error, reload, setData };
}
