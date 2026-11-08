import { useCallback, useEffect, useRef, useState } from "react";
import { useFocusEffect } from "expo-router";
import { ApiError } from "@/lib/api";

/**
 * Carga un recurso de la API, lo vuelve a pedir cada vez que la pantalla
 * recupera el foco (p. ej. al volver de un formulario) y expone `refresh`
 * para el gesto de deslizar hacia abajo.
 */
export function useResource<T>(load: () => Promise<T>) {
  const [data, setData] = useState<T | null>(null);
  const [error, setError] = useState<ApiError | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const loadRef = useRef(load);
  // Siempre usa la última función de carga (p. ej. con filtros nuevos).
  useEffect(() => {
    loadRef.current = load;
  });

  const run = useCallback(async (manual: boolean) => {
    if (manual) setRefreshing(true);
    try {
      setData(await loadRef.current());
      setError(null);
    } catch (caught) {
      setError(caught instanceof ApiError ? caught : new ApiError(0, "error", "No se pudo cargar la información."));
    } finally {
      setRefreshing(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      void run(false);
    }, [run]),
  );

  const refresh = useCallback(() => run(true), [run]);
  const reload = useCallback(() => run(false), [run]);
  return { data, error, refreshing, refresh, reload, setData };
}
