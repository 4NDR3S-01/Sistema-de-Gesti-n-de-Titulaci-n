import Link from "next/link";
import type { ReactNode } from "react";

export function PageHeader({
  eyebrow,
  title,
  description,
  actions,
}: {
  eyebrow: string;
  title: string;
  description?: ReactNode;
  actions?: ReactNode;
}) {
  return (
    <header className="page-header">
      <div>
        <span className="page-eyebrow">{eyebrow}</span>
        <h1>{title}</h1>
        {description && <p>{description}</p>}
      </div>
      {actions && <div className="page-actions">{actions}</div>}
    </header>
  );
}

export function Alert({
  tone,
  title,
  children,
}: {
  tone: "success" | "error" | "info" | "warning";
  title?: string;
  children?: ReactNode;
}) {
  return (
    <div className={`alert alert-${tone}`} role={tone === "error" ? "alert" : "status"}>
      {title && <strong>{title}</strong>}
      {children && <span>{children}</span>}
    </div>
  );
}

export function EmptyState({
  icon,
  title,
  children,
  action,
}: {
  icon: string;
  title: string;
  children?: ReactNode;
  action?: ReactNode;
}) {
  return (
    <section className="empty-state">
      <span className="empty-state-icon" aria-hidden="true">{icon}</span>
      <h2>{title}</h2>
      {children && <p>{children}</p>}
      {action}
    </section>
  );
}

export function Badge({
  tone = "neutral",
  children,
}: {
  tone?: "neutral" | "success" | "warning" | "danger" | "info";
  children: ReactNode;
}) {
  return <span className={`badge badge-${tone}`}>{children}</span>;
}

/** Paginación por query string; conserva los demás filtros. */
export function Pagination({
  page,
  total,
  pageSize,
  basePath,
  params,
}: {
  page: number;
  total: number;
  pageSize: number;
  basePath: string;
  params: Record<string, string | undefined>;
}) {
  const pages = Math.max(1, Math.ceil(total / pageSize));
  if (pages <= 1) return null;

  const href = (target: number) => {
    const search = new URLSearchParams();
    for (const [key, value] of Object.entries(params)) {
      if (value) search.set(key, value);
    }
    search.set("pagina", String(target));
    return `${basePath}?${search.toString()}`;
  };

  return (
    <nav className="pagination" aria-label="Paginación">
      {page > 1 ? (
        <Link className="btn btn-ghost btn-sm" href={href(page - 1)}>
          ← Anterior
        </Link>
      ) : (
        <span className="btn btn-ghost btn-sm is-disabled">← Anterior</span>
      )}
      <span className="pagination-info">
        Página {page} de {pages}
      </span>
      {page < pages ? (
        <Link className="btn btn-ghost btn-sm" href={href(page + 1)}>
          Siguiente →
        </Link>
      ) : (
        <span className="btn btn-ghost btn-sm is-disabled">Siguiente →</span>
      )}
    </nav>
  );
}

/** Lee un parámetro de búsqueda como texto simple. */
export function searchParam(value: string | string[] | undefined): string | undefined {
  const text = Array.isArray(value) ? value[0] : value;
  return text?.trim() || undefined;
}

export function pageParam(value: string | string[] | undefined): number {
  const page = Number(searchParam(value));
  return Number.isInteger(page) && page > 0 ? page : 1;
}
