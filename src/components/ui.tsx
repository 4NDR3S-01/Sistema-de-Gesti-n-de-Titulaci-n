import Link from "next/link";
import type { ReactNode } from "react";
import {
  ArrowLeft,
  ChevronLeft,
  ChevronRight,
  CircleAlert,
  CircleCheck,
  Info,
  TriangleAlert,
  type LucideIcon,
} from "lucide-react";

export function PageHeader({
  eyebrow,
  title,
  description,
  actions,
}: {
  eyebrow?: string;
  title: string;
  description?: ReactNode;
  actions?: ReactNode;
}) {
  return (
    <header className="page-header">
      <div>
        {eyebrow && <span className="page-eyebrow">{eyebrow}</span>}
        <h1>{title}</h1>
        {description && <p>{description}</p>}
      </div>
      {actions && <div className="page-actions">{actions}</div>}
    </header>
  );
}

export function BackLink({ href, children }: { href: string; children: ReactNode }) {
  return (
    <Link className="back-link" href={href}>
      <ArrowLeft aria-hidden="true" />
      {children}
    </Link>
  );
}

const alertIcons: Record<string, LucideIcon> = {
  success: CircleCheck,
  error: CircleAlert,
  warning: TriangleAlert,
  info: Info,
};

export function Alert({
  tone,
  title,
  children,
}: {
  tone: "success" | "error" | "info" | "warning";
  title?: string;
  children?: ReactNode;
}) {
  const Icon = alertIcons[tone];
  return (
    <div className={`alert alert-${tone}`} role={tone === "error" ? "alert" : "status"}>
      <Icon aria-hidden="true" />
      {title && <strong>{title}</strong>}
      {children && <span>{children}</span>}
    </div>
  );
}

export function EmptyState({
  icon: Icon,
  title,
  children,
  action,
}: {
  icon: LucideIcon;
  title: string;
  children?: ReactNode;
  action?: ReactNode;
}) {
  return (
    <section className="empty-state">
      <span className="empty-state-icon" aria-hidden="true">
        <Icon />
      </span>
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
        <Link className="btn btn-secondary btn-sm" href={href(page - 1)}>
          <ChevronLeft aria-hidden="true" /> Anterior
        </Link>
      ) : (
        <span className="btn btn-secondary btn-sm is-disabled">
          <ChevronLeft aria-hidden="true" /> Anterior
        </span>
      )}
      <span className="pagination-info">
        Página {page} de {pages}
      </span>
      {page < pages ? (
        <Link className="btn btn-secondary btn-sm" href={href(page + 1)}>
          Siguiente <ChevronRight aria-hidden="true" />
        </Link>
      ) : (
        <span className="btn btn-secondary btn-sm is-disabled">
          Siguiente <ChevronRight aria-hidden="true" />
        </span>
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
