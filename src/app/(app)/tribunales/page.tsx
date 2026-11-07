import type { Metadata } from "next";
import Link from "next/link";
import { CalendarDays, Gavel } from "lucide-react";
import { createTribunalAction, deleteTribunalAction } from "@/app/(app)/tribunales/actions";
import { ConfirmButton } from "@/components/form-controls";
import { TribunalForm } from "@/components/tribunal-form";
import { Alert, EmptyState, PageHeader, searchParam } from "@/components/ui";
import { listApprovedWithoutTribunal, listTribunals } from "@/lib/data/tribunals";
import { longDate } from "@/lib/labels";

export const metadata: Metadata = { title: "Tribunales de defensa" };

const flashMessages: Record<string, string> = {
  asignado: "Tribunal asignado. Los integrantes ya ven la convocatoria en su panel.",
  eliminado: "Convocatoria eliminada. El tema vuelve a la lista de pendientes.",
};

export default async function TribunalPage(props: PageProps<"/tribunales">) {
  const params = await props.searchParams;
  const ok = searchParam(params.ok);
  const preselected = Number(searchParam(params.registro)) || undefined;
  const [candidates, tribunals] = await Promise.all([listApprovedWithoutTribunal(), listTribunals()]);
  const today = new Intl.DateTimeFormat("en-CA", { timeZone: "America/Guayaquil" }).format(new Date());

  return (
    <div className="stack">
      <PageHeader
        eyebrow="Secretaría"
        title="Tribunales de defensa"
        description="Asigna el tribunal y la convocatoria de los estudiantes con tema aprobado."
      />

      {ok && flashMessages[ok] && <Alert tone="success">{flashMessages[ok]}</Alert>}

      {candidates.length === 0 ? (
        <section className="panel-card">
          <EmptyState icon={Gavel} title="No hay temas esperando tribunal">
            Cuando apruebes un registro PAT 2 podrás asignar aquí su tribunal.{" "}
            <Link href="/aprobacion-pat-2">Ir a la bandeja de aprobación</Link>.
          </EmptyState>
        </section>
      ) : (
        <TribunalForm
          action={createTribunalAction}
          candidates={candidates}
          preselected={preselected}
          minDate={today}
        />
      )}

      <section className="panel-card" aria-labelledby="assigned-title">
        <header className="panel-card-head">
          <h2 id="assigned-title">Convocatorias registradas</h2>
          <span className="text-muted tabular" style={{ fontSize: 13 }}>
            {tribunals.length}
          </span>
        </header>
        {tribunals.length === 0 ? (
          <EmptyState icon={CalendarDays} title="Sin convocatorias">
            Las defensas que programes aparecerán aquí ordenadas por fecha.
          </EmptyState>
        ) : (
          <div className="table-wrap">
            <table className="data-table">
              <thead>
                <tr>
                  <th scope="col">Estudiante</th>
                  <th scope="col">Defensa</th>
                  <th scope="col">Tribunal</th>
                  <th scope="col">
                    <span className="sr-only">Acciones</span>
                  </th>
                </tr>
              </thead>
              <tbody>
                {tribunals.map((row) => (
                  <tr key={row.id}>
                    <td data-label="Estudiante" className="cell-title">
                      <strong style={{ fontWeight: 600 }}>{row.student_name}</strong>
                      <small>{row.title}</small>
                    </td>
                    <td data-label="Defensa">
                      <span style={{ color: row.defense_date < today ? "var(--muted)" : undefined }}>
                        {longDate(row.defense_date)}
                      </span>
                      <small>
                        {row.defense_time}, {row.place}
                      </small>
                    </td>
                    <td data-label="Tribunal">
                      {row.president}
                      <small>
                        {row.member_one}; {row.member_two}
                      </small>
                      <small>Observador/a: {row.tutor}</small>
                    </td>
                    <td className="cell-actions">
                      <form action={deleteTribunalAction.bind(null, row.id)}>
                        <ConfirmButton
                          className="btn btn-danger-ghost btn-sm"
                          message={`¿Eliminar la convocatoria de ${row.student_name}? Podrás asignarla de nuevo.`}
                        >
                          Eliminar
                        </ConfirmButton>
                      </form>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
