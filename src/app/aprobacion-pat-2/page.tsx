import Link from "next/link";
import { auth } from "@/auth";
import { getRoleLabel } from "@/lib/auth-roles";
import { WorkflowNavigation } from "@/components/workflow-navigation";

export default async function PatApprovalPage() {
  const session = await auth();
  const role = session?.user?.role;
  if (role !== "SECRETARY" && role !== "ADMIN") {
    throw new Error("El acceso a esta bandeja requiere un rol autorizado.");
  }

  return (
    <main className="workflow-page">
      <header className="workflow-topbar">
        <Link className="workflow-brand" href="/panel" aria-label="Volver al panel">
          <span className="workflow-brand-icon" aria-hidden="true">GT</span>
          <span><strong>GESTIÓN</strong><small>DE TITULACIÓN</small></span>
        </Link>
        <WorkflowNavigation />
      </header>

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
    </main>
  );
}
