import type { Metadata } from "next";
import Link from "next/link";
import { Search, UserPlus, UsersRound } from "lucide-react";
import { listCareers, listFaculties } from "@/lib/data/catalogs";
import { registrationStatusByStudent } from "@/lib/data/pat";
import { listStudents } from "@/lib/data/students";
import { patStatusLabel, patStatusTone } from "@/lib/labels";
import { PAGE_SIZE } from "@/lib/data/users";
import {
  Alert,
  Badge,
  EmptyState,
  PageHeader,
  Pagination,
  pageParam,
  searchParam,
} from "@/components/ui";

const flashMessages: Record<string, string> = {
  creado: "Estudiante registrado correctamente.",
  actualizado: "Los datos del estudiante se actualizaron correctamente.",
};

export const metadata: Metadata = { title: "Estudiantes" };

export default async function StudentsPage(props: PageProps<"/estudiantes">) {
  const params = await props.searchParams;
  const search = searchParam(params.q);
  const facultyId = Number(searchParam(params.facultad)) || undefined;
  const careerId = Number(searchParam(params.carrera)) || undefined;
  const page = pageParam(params.pagina);
  const ok = searchParam(params.ok);

  const [{ rows, total }, faculties, careers] = await Promise.all([
    listStudents({ search, facultyId, careerId, page }),
    listFaculties(),
    listCareers(),
  ]);
  const titulacion = await registrationStatusByStudent(rows.map((row) => row.id));
  const visibleCareers = facultyId
    ? careers.filter((career) => career.faculty_id === facultyId)
    : careers;
  const hasFilters = Boolean(search || facultyId || careerId);

  return (
    <>
      <PageHeader
        eyebrow="Gestión académica"
        title="Estudiantes"
        description="Consulta, busca y actualiza la información de los estudiantes registrados."
        actions={
          <Link className="btn btn-primary" href="/estudiantes/nuevo">
            <UserPlus aria-hidden="true" /> Nuevo estudiante
          </Link>
        }
      />

      {ok && flashMessages[ok] && <Alert tone="success">{flashMessages[ok]}</Alert>}

      <section className="panel-card" style={{ marginTop: ok ? 20 : 0 }}>
        <form className="toolbar" role="search">
          <label className="toolbar-search">
            <span className="sr-only">Buscar estudiante</span>
            <Search aria-hidden="true" />
            <input
              type="search"
              name="q"
              defaultValue={search}
              placeholder="Buscar por nombre, cédula o correo"
            />
          </label>
          <label>
            <span className="sr-only">Facultad</span>
            <select name="facultad" defaultValue={facultyId ?? ""}>
              <option value="">Todas las facultades</option>
              {faculties.map((faculty) => (
                <option value={faculty.id} key={faculty.id}>
                  {faculty.name}
                </option>
              ))}
            </select>
          </label>
          <label>
            <span className="sr-only">Carrera</span>
            <select name="carrera" defaultValue={careerId ?? ""}>
              <option value="">Todas las carreras</option>
              {visibleCareers.map((career) => (
                <option value={career.id} key={career.id}>
                  {career.name}
                </option>
              ))}
            </select>
          </label>
          <button className="btn btn-secondary" type="submit">
            Filtrar
          </button>
          {hasFilters && (
            <Link className="btn btn-ghost" href="/estudiantes">
              Limpiar
            </Link>
          )}
        </form>

        {rows.length === 0 ? (
          <EmptyState
            icon={UsersRound}
            title={hasFilters ? "Sin resultados" : "Aún no hay estudiantes"}
          >
            {hasFilters
              ? "Ningún estudiante coincide con los filtros aplicados."
              : "Registra el primer estudiante para empezar."}
          </EmptyState>
        ) : (
          <>
            <p className="table-count">
              {total} {total === 1 ? "estudiante" : "estudiantes"}
            </p>
            <div className="table-wrap">
              <table className="data-table">
                <thead>
                  <tr>
                    <th scope="col">Estudiante</th>
                    <th scope="col">Cédula</th>
                    <th scope="col">Carrera</th>
                    <th scope="col">Semestre</th>
                    <th scope="col">Titulación</th>
                    <th scope="col">Cuenta</th>
                    <th scope="col">
                      <span className="sr-only">Acciones</span>
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((student) => (
                    <tr key={student.id}>
                      <td data-label="Estudiante">
                        <strong>
                          {student.lastname} {student.name}
                        </strong>
                        <small>{student.email}</small>
                      </td>
                      <td data-label="Cédula" className="tabular">{student.cedula ?? "—"}</td>
                      <td data-label="Carrera">
                        {student.career}
                        <small>{student.faculty}</small>
                      </td>
                      <td data-label="Semestre">
                        {student.semester ? `${student.semester}.º` : "—"}
                      </td>
                      <td data-label="Titulación">
                        {titulacion.get(student.id) ? (
                          <Badge tone={patStatusTone(titulacion.get(student.id)!.status)}>
                            {patStatusLabel(titulacion.get(student.id)!.status)}
                          </Badge>
                        ) : (
                          <span className="text-muted">Sin registro</span>
                        )}
                      </td>
                      <td data-label="Cuenta">
                        <Badge tone={student.is_active ? "success" : "danger"}>
                          {student.is_active ? "Activa" : "Inactiva"}
                        </Badge>
                      </td>
                      <td className="cell-actions">
                        <Link
                          className="btn btn-secondary btn-sm"
                          href={`/estudiantes/${student.id}/editar`}
                        >
                          Editar
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
              basePath="/estudiantes"
              params={{
                q: search,
                facultad: facultyId?.toString(),
                carrera: careerId?.toString(),
              }}
            />
          </>
        )}
      </section>
    </>
  );
}
