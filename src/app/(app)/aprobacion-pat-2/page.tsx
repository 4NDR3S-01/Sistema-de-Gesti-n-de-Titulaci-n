import Link from "next/link";
import { getRoleLabel, staffRoles } from "@/lib/auth-roles";
import { requireUser } from "@/lib/current-user";

export default async function PatApprovalPage() {
  const { role } = await requireUser(staffRoles);

  return (
    <section className="workflow-content">
      <Link className="back-link" href="/panel">← Volver al panel</Link>
      <div className="workflow-title-row">
        <div>
          <span className="workflow-eyebrow">REVISIÓN ACADÉMICA · PAT 2</span>
          <h1>Aprobación de temas</h1>
          <p>
            Bandeja de revisión de las propuestas registradas por los
            estudiantes.
          </p>
        </div>
        <span className="draft-badge">{getRoleLabel(role)}</span>
      </div>

      <div className="privacy-notice" role="note">
        <strong>La aprobación aún no está conectada</strong>
        <span>
          El formulario de registro todavía no guarda solicitudes en el
          servidor. Por eso no hay propuestas que podamos mostrar o aprobar
          y no se simulará una aprobación. Esta bandeja se habilitará al
          conectar el registro con la base de datos.
        </span>
      </div>

      <section className="approval-empty-state" aria-labelledby="queue-title">
        <span className="approval-empty-icon" aria-hidden="true">P2</span>
        <h2 id="queue-title">Bandeja de solicitudes</h2>
        <p>
          Cuando los estudiantes registren su tema y el sistema lo guarde,
          aquí podrás revisar cada propuesta, dejar observaciones y aprobarla
          o devolverla para corrección.
        </p>
        <span className="approval-status">Pendiente de conexión con datos</span>
      </section>
    </section>
  );
}
