"use client";

export default function AppError({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <section className="empty-state" role="alert">
      <span className="empty-state-icon" aria-hidden="true">!</span>
      <h2>No se pudo cargar esta sección</h2>
      <p>
        Ocurrió un problema al consultar la información. Verifica que la base
        de datos esté disponible e inténtalo de nuevo.
      </p>
      <button className="btn btn-primary" type="button" onClick={reset}>
        Reintentar
      </button>
    </section>
  );
}
