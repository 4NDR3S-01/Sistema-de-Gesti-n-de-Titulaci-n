"use client";

import { RefreshCw, ServerCrash } from "lucide-react";

export default function AppError({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <section className="panel-card" role="alert">
      <div className="empty-state">
        <span className="empty-state-icon" aria-hidden="true">
          <ServerCrash />
        </span>
        <h2>No se pudo cargar esta sección</h2>
        <p>
          El sistema no obtuvo respuesta de la base de datos. Espera unos segundos y vuelve a
          intentarlo; si el problema continúa, avisa al administrador.
        </p>
        <button className="btn btn-primary" type="button" onClick={reset}>
          <RefreshCw aria-hidden="true" /> Reintentar
        </button>
      </div>
    </section>
  );
}
