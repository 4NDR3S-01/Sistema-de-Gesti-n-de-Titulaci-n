import {
  createCareerAction,
  createFacultyAction,
  deleteCareerAction,
  deleteFacultyAction,
  setCareerActiveAction,
  setFacultyActiveAction,
  updateCareerAction,
  updateFacultyAction,
} from "@/app/(app)/admin/carreras/actions";
import { ConfirmButton, SubmitButton } from "@/components/form-controls";
import { Alert, Badge, EmptyState, PageHeader, searchParam } from "@/components/ui";
import { listCareers, listFaculties } from "@/lib/data/catalogs";

const flashMessages: Record<string, string> = {
  "facultad-creada": "Facultad creada correctamente.",
  "facultad-actualizada": "Facultad actualizada correctamente.",
  "facultad-eliminada": "Facultad eliminada.",
  "carrera-creada": "Carrera creada correctamente.",
  "carrera-actualizada": "Carrera actualizada correctamente.",
  "carrera-eliminada": "Carrera eliminada.",
  activada: "Registro activado.",
  desactivada: "Registro desactivado. Ya no aparecerá al registrar estudiantes.",
};

const errorMessages: Record<string, string> = {
  duplicado: "Ya existe un registro con ese nombre.",
  "en-uso":
    "No se puede eliminar porque tiene carreras o estudiantes asociados. Puedes desactivarlo.",
  invalido: "El nombre debe tener entre 3 y 150 caracteres y debes elegir una facultad.",
  desconocido: "No se pudo completar la operación. Inténtalo de nuevo.",
};

export default async function CatalogsPage(props: PageProps<"/admin/carreras">) {
  const params = await props.searchParams;
  const ok = searchParam(params.ok);
  const error = searchParam(params.error);
  const [faculties, careers] = await Promise.all([listFaculties(), listCareers()]);

  return (
    <>
      <PageHeader
        eyebrow="ADMINISTRACIÓN"
        title="Carreras y facultades"
        description="Catálogo usado al registrar y editar estudiantes. Desactiva un registro para ocultarlo sin perder el historial."
      />

      {ok && flashMessages[ok] && <Alert tone="success">{flashMessages[ok]}</Alert>}
      {error && errorMessages[error] && <Alert tone="error">{errorMessages[error]}</Alert>}

      <div className="catalog-grid">
        <section className="panel-card" aria-labelledby="faculties-title">
          <header className="panel-card-head">
            <h2 id="faculties-title">Facultades</h2>
            <Badge>{faculties.length}</Badge>
          </header>

          <form className="inline-form" action={createFacultyAction}>
            <label className="sr-only" htmlFor="new-faculty">
              Nombre de la nueva facultad
            </label>
            <input id="new-faculty" name="name" placeholder="Nueva facultad" required minLength={3} maxLength={150} />
            <SubmitButton pendingLabel="Agregando…">Agregar</SubmitButton>
          </form>

          {faculties.length === 0 ? (
            <EmptyState icon="0" title="Sin facultades">
              Agrega la primera facultad.
            </EmptyState>
          ) : (
            <ul className="catalog-list">
              {faculties.map((faculty) => (
                <li key={faculty.id} className={faculty.is_active ? undefined : "is-inactive"}>
                  <div className="catalog-item">
                    <div>
                      <strong>{faculty.name}</strong>
                      <small>
                        {faculty.career_count} carreras · {faculty.student_count} estudiantes
                      </small>
                    </div>
                    {!faculty.is_active && <Badge>Inactiva</Badge>}
                  </div>
                  <details className="catalog-edit">
                    <summary>Editar</summary>
                    <form className="inline-form" action={updateFacultyAction.bind(null, faculty.id)}>
                      <label className="sr-only" htmlFor={`faculty-${faculty.id}`}>
                        Nombre
                      </label>
                      <input id={`faculty-${faculty.id}`} name="name" defaultValue={faculty.name} required minLength={3} maxLength={150} />
                      <SubmitButton>Guardar</SubmitButton>
                    </form>
                    <div className="catalog-actions">
                      <form action={setFacultyActiveAction.bind(null, faculty.id, !faculty.is_active)}>
                        <ConfirmButton
                          className="btn btn-ghost btn-sm"
                          message={
                            faculty.is_active
                              ? `¿Desactivar ${faculty.name}? Sus carreras dejarán de ofrecerse al registrar estudiantes.`
                              : `¿Activar ${faculty.name}?`
                          }
                        >
                          {faculty.is_active ? "Desactivar" : "Activar"}
                        </ConfirmButton>
                      </form>
                      <form action={deleteFacultyAction.bind(null, faculty.id)}>
                        <ConfirmButton
                          className="btn btn-danger-ghost btn-sm"
                          message={`¿Eliminar ${faculty.name}? Esta acción no se puede deshacer.`}
                        >
                          Eliminar
                        </ConfirmButton>
                      </form>
                    </div>
                  </details>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="panel-card" aria-labelledby="careers-title">
          <header className="panel-card-head">
            <h2 id="careers-title">Carreras</h2>
            <Badge>{careers.length}</Badge>
          </header>

          {faculties.length === 0 ? (
            <Alert tone="info">Crea una facultad antes de agregar carreras.</Alert>
          ) : (
            <form className="inline-form" action={createCareerAction}>
              <label className="sr-only" htmlFor="new-career">
                Nombre de la nueva carrera
              </label>
              <input id="new-career" name="name" placeholder="Nueva carrera" required minLength={3} maxLength={150} />
              <label className="sr-only" htmlFor="new-career-faculty">
                Facultad
              </label>
              <select id="new-career-faculty" name="facultyId" required defaultValue="">
                <option value="" disabled>
                  Facultad
                </option>
                {faculties.map((faculty) => (
                  <option value={faculty.id} key={faculty.id}>
                    {faculty.name}
                  </option>
                ))}
              </select>
              <SubmitButton pendingLabel="Agregando…">Agregar</SubmitButton>
            </form>
          )}

          {careers.length === 0 ? (
            <EmptyState icon="0" title="Sin carreras">
              Agrega la primera carrera.
            </EmptyState>
          ) : (
            <ul className="catalog-list">
              {careers.map((career) => (
                <li key={career.id} className={career.is_active ? undefined : "is-inactive"}>
                  <div className="catalog-item">
                    <div>
                      <strong>{career.name}</strong>
                      <small>
                        {career.faculty} · {career.student_count} estudiantes
                      </small>
                    </div>
                    {!career.is_active && <Badge>Inactiva</Badge>}
                  </div>
                  <details className="catalog-edit">
                    <summary>Editar</summary>
                    <form className="inline-form" action={updateCareerAction.bind(null, career.id)}>
                      <label className="sr-only" htmlFor={`career-${career.id}`}>
                        Nombre
                      </label>
                      <input id={`career-${career.id}`} name="name" defaultValue={career.name} required minLength={3} maxLength={150} />
                      <label className="sr-only" htmlFor={`career-faculty-${career.id}`}>
                        Facultad
                      </label>
                      <select id={`career-faculty-${career.id}`} name="facultyId" defaultValue={career.faculty_id}>
                        {faculties.map((faculty) => (
                          <option value={faculty.id} key={faculty.id}>
                            {faculty.name}
                          </option>
                        ))}
                      </select>
                      <SubmitButton>Guardar</SubmitButton>
                    </form>
                    <div className="catalog-actions">
                      <form action={setCareerActiveAction.bind(null, career.id, !career.is_active)}>
                        <ConfirmButton
                          className="btn btn-ghost btn-sm"
                          message={
                            career.is_active
                              ? `¿Desactivar ${career.name}? Dejará de ofrecerse al registrar estudiantes.`
                              : `¿Activar ${career.name}?`
                          }
                        >
                          {career.is_active ? "Desactivar" : "Activar"}
                        </ConfirmButton>
                      </form>
                      <form action={deleteCareerAction.bind(null, career.id)}>
                        <ConfirmButton
                          className="btn btn-danger-ghost btn-sm"
                          message={`¿Eliminar ${career.name}? Esta acción no se puede deshacer.`}
                        >
                          Eliminar
                        </ConfirmButton>
                      </form>
                    </div>
                  </details>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </>
  );
}
