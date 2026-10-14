import Link from "next/link";
import { setUserActiveAction } from "@/app/(app)/admin/usuarios/actions";
import { ConfirmButton } from "@/components/form-controls";
import {
  Alert,
  Badge,
  EmptyState,
  PageHeader,
  Pagination,
  pageParam,
  searchParam,
} from "@/components/ui";
import { getDbRoleLabel } from "@/lib/auth-roles";
import { requireUser } from "@/lib/current-user";
import { listUsers, PAGE_SIZE } from "@/lib/data/users";

const flashMessages: Record<string, string> = {
  creado: "Usuario creado correctamente.",
  actualizado: "Usuario actualizado correctamente.",
  activado: "La cuenta fue activada.",
  desactivado: "La cuenta fue desactivada. Ya no podrá iniciar sesión.",
};

const errorMessages: Record<string, string> = {
  propio: "No puedes desactivar tu propia cuenta.",
  "ultimo-admin": "No puedes desactivar al único administrador activo.",
  "no-existe": "El usuario ya no existe.",
};

const roleFilters = [
  { value: "ADMIN", label: "Administración" },
  { value: "SECRETARY", label: "Secretaría" },
  { value: "STUDENT", label: "Estudiante" },
  { value: "COORDINATOR", label: "Coordinación" },
  { value: "ADVISOR", label: "Docente asesor" },
];

export default async function UsersPage(props: PageProps<"/admin/usuarios">) {
  const admin = await requireUser(["ADMIN"]);
  const params = await props.searchParams;
  const search = searchParam(params.q);
  const role = searchParam(params.rol);
  const status = searchParam(params.estado);
  const page = pageParam(params.pagina);
  const ok = searchParam(params.ok);
  const error = searchParam(params.error);

  const { rows, total } = await listUsers({ search, role, status, page });
  const hasFilters = Boolean(search || role || status);

  return (
    <>
      <PageHeader
        eyebrow="ADMINISTRACIÓN"
        title="Usuarios"
        description="Gestiona las cuentas de acceso del personal y de los estudiantes."
        actions={
          <Link className="btn btn-primary" href="/admin/usuarios/nuevo">
            + Nuevo usuario
          </Link>
        }
      />

      {ok && flashMessages[ok] && <Alert tone="success">{flashMessages[ok]}</Alert>}
      {error && errorMessages[error] && <Alert tone="error">{errorMessages[error]}</Alert>}

      <section className="panel-card">
        <form className="toolbar" role="search">
          <label className="toolbar-search">
            <span className="sr-only">Buscar usuario</span>
            <svg viewBox="0 0 24 24" aria-hidden="true">
              <circle cx="11" cy="11" r="6" />
              <path d="m20 20-4.5-4.5" />
            </svg>
            <input type="search" name="q" defaultValue={search} placeholder="Buscar por nombre o correo" />
          </label>
          <label>
            <span className="sr-only">Rol</span>
            <select name="rol" defaultValue={role ?? ""}>
              <option value="">Todos los roles</option>
              {roleFilters.map((item) => (
                <option value={item.value} key={item.value}>
                  {item.label}
                </option>
              ))}
            </select>
          </label>
          <label>
            <span className="sr-only">Estado</span>
            <select name="estado" defaultValue={status ?? ""}>
              <option value="">Todos los estados</option>
              <option value="active">Activos</option>
              <option value="inactive">Inactivos</option>
            </select>
          </label>
          <button className="btn btn-secondary" type="submit">
            Filtrar
          </button>
          {hasFilters && (
            <Link className="btn btn-ghost" href="/admin/usuarios">
              Limpiar
            </Link>
          )}
        </form>

        {rows.length === 0 ? (
          <EmptyState icon="0" title="Sin resultados">
            Ningún usuario coincide con los filtros aplicados.
          </EmptyState>
        ) : (
          <>
            <p className="table-count">
              {total} {total === 1 ? "usuario" : "usuarios"}
            </p>
            <div className="table-wrap">
              <table className="data-table">
                <thead>
                  <tr>
                    <th scope="col">Usuario</th>
                    <th scope="col">Rol</th>
                    <th scope="col">Estado</th>
                    <th scope="col">Creado</th>
                    <th scope="col">
                      <span className="sr-only">Acciones</span>
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((user) => (
                    <tr key={user.id}>
                      <td data-label="Usuario">
                        <strong>
                          {user.lastname} {user.name}
                          {user.id === admin.id && <span className="text-muted"> (tú)</span>}
                        </strong>
                        <small>{user.email}</small>
                      </td>
                      <td data-label="Rol">
                        <Badge tone={user.role === "ADMIN" ? "info" : "neutral"}>
                          {getDbRoleLabel(user.role)}
                        </Badge>
                      </td>
                      <td data-label="Estado">
                        <Badge tone={user.is_active ? "success" : "danger"}>
                          {user.is_active ? "Activo" : "Inactivo"}
                        </Badge>
                      </td>
                      <td data-label="Creado">
                        {new Intl.DateTimeFormat("es-EC", { dateStyle: "medium" }).format(user.created_at)}
                      </td>
                      <td className="cell-actions">
                        <Link
                          className="btn btn-secondary btn-sm"
                          href={
                            user.student_id
                              ? `/estudiantes/${user.student_id}/editar`
                              : `/admin/usuarios/${user.id}/editar`
                          }
                        >
                          Editar
                        </Link>
                        {user.id !== admin.id && (
                          <form action={setUserActiveAction.bind(null, user.id, !user.is_active)}>
                            <ConfirmButton
                              className={`btn btn-sm ${user.is_active ? "btn-danger-ghost" : "btn-ghost"}`}
                              message={
                                user.is_active
                                  ? `¿Desactivar la cuenta de ${user.name} ${user.lastname}? No podrá iniciar sesión.`
                                  : `¿Activar la cuenta de ${user.name} ${user.lastname}?`
                              }
                            >
                              {user.is_active ? "Desactivar" : "Activar"}
                            </ConfirmButton>
                          </form>
                        )}
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
              basePath="/admin/usuarios"
              params={{ q: search, rol: role, estado: status }}
            />
          </>
        )}
      </section>
    </>
  );
}
