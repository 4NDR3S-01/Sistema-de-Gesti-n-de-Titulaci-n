import type { Metadata } from "next";
import Link from "next/link";
import { ClipboardCheck, Search } from "lucide-react";
import {
  Alert,
  Badge,
  EmptyState,
  PageHeader,
  Pagination,
  pageParam,
  searchParam,
} from "@/components/ui";
import { countRegistrationsByStatus, listRegistrations } from "@/lib/data/pat";
import { PAGE_SIZE } from "@/lib/data/users";
import { patStatusLabel, patStatusTone, shortDateTime } from "@/lib/labels";

export const metadata: Metadata = { title: "Aprobación de PAT 2" };

const flashMessages: Record<string, string> = {
  aprobado: "Tema aprobado. El estudiante ya puede ver su aprobación y el registro pasa a tribunales.",
  devuelto: "Registro devuelto. El estudiante verá tus observaciones en su panel.",
};

const tabs = [
  { value: "PENDING", label: "Por revisar" },
  { value: "RETURNED", label: "Devueltos" },
  { value: "APPROVED", label: "Aprobados" },
  { value: "", label: "Todos" },
] as const;

export default async function PatApprovalPage(props: PageProps<"/aprobacion-pat-2">) {
  const params = await props.searchParams;
  const rawStatus = searchParam(params.estado);
  const status = rawStatus === "todos" ? "" : (rawStatus ?? "PENDING");
  const search = searchParam(params.q);
  const page = pageParam(params.pagina);
  const ok = searchParam(params.ok);

  const [{ rows, total }, counts] = await Promise.all([
    listRegistrations({ status: status || undefined, search, page }),
    countRegistrationsByStatus(),
  ]);
  const allCount = counts.PENDING + counts.RETURNED + counts.APPROVED;

  return (
    <>
      <PageHeader
        eyebrow="Secretaría"
        title="Aprobación de temas PAT 2"
        description="Revisa cada registro y apruébalo o devuélvelo con observaciones para que el estudiante lo corrija."
      />

      {ok && flashMessages[ok] && <Alert tone="success">{flashMessages[ok]}</Alert>}

      <section className="panel-card" style={{ marginTop: ok ? 20 : 0 }}>
        <nav className="tabs" aria-label="Estado del registro">
          {tabs.map((tab) => {
            const count = tab.value ? counts[tab.value] : allCount;
            const href = `/aprobacion-pat-2?estado=${tab.value || "todos"}${search ? `&q=${encodeURIComponent(search)}` : ""}`;
            return (
              <Link href={href} key={tab.label} aria-current={status === tab.value ? "page" : undefined}>
                {tab.label} <span className="tab-count tabular">{count}</span>
              </Link>
            );
          })}
        </nav>

        <form className="toolbar" role="search">
          <input type="hidden" name="estado" value={status || "todos"} />
          <label className="toolbar-search">
            <span className="sr-only">Buscar registro</span>
            <Search aria-hidden="true" />
            <input type="search" name="q" defaultValue={search} placeholder="Buscar por estudiante, cédula o título" />
          </label>
          <button className="btn btn-secondary" type="submit">
            Buscar
          </button>
        </form>

        {rows.length === 0 ? (
          <EmptyState
            icon={ClipboardCheck}
            title={search ? "Sin resultados" : status === "PENDING" ? "No hay registros por revisar" : "No hay registros"}
          >
            {search
              ? "Ningún registro coincide con la búsqueda."
              : status === "PENDING"
                ? "Cuando un estudiante envíe su tema aparecerá aquí."
                : "Todavía no hay registros en este estado."}
          </EmptyState>
        ) : (
          <>
            <div className="table-wrap">
              <table className="data-table">
                <thead>
                  <tr>
                    <th scope="col">Estudiantes</th>
                    <th scope="col">Tema</th>
                    <th scope="col">Enviado</th>
                    <th scope="col">Estado</th>
                    <th scope="col">
                      <span className="sr-only">Acciones</span>
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((row) => (
                    <tr key={row.id}>
                      <td data-label="Estudiantes">
                        <strong>{row.members_label}</strong>
                        <small>{row.career}</small>
                      </td>
                      <td data-label="Tema" className="cell-title">
                        <strong>{row.title}</strong>
                        <small>
                          {row.participation_type === "GRUPAL" ? "En pareja" : "Individual"}
                          {" · "}
                          {row.has_scan ? "Escaneado firmado" : "Firma digital"}
                        </small>
                      </td>
                      <td data-label="Enviado" className="tabular">
                        {row.submitted_at ? shortDateTime(row.submitted_at) : "—"}
                      </td>
                      <td data-label="Estado">
                        <Badge tone={patStatusTone(row.status)}>{patStatusLabel(row.status)}</Badge>
                      </td>
                      <td className="cell-actions">
                        <Link
                          className={`btn btn-sm ${row.status === "PENDING" ? "btn-primary" : "btn-secondary"}`}
                          href={`/aprobacion-pat-2/${row.id}`}
                        >
                          {row.status === "PENDING" ? "Revisar" : "Ver"}
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <Pagination
              page={page}
              total={total}
              pageSize={PAGE_SIZE}
              basePath="/aprobacion-pat-2"
              params={{ estado: status || "todos", q: search }}
            />
          </>
        )}
      </section>
    </>
  );
}
