import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { FileText, Gavel } from "lucide-react";
import { reviewPatAction } from "@/app/(app)/aprobacion-pat-2/actions";
import { PatPdfButton } from "@/components/pat-document";
import { MemberDataSummary, MembersList, ProposalSummary, Timeline } from "@/components/pat-parts";
import { ReviewForm } from "@/components/review-form";
import { Alert, BackLink, Badge, PageHeader } from "@/components/ui";
import { getPatDetail } from "@/lib/data/pat";
import { patStatusLabel, patStatusTone, shortDateTime } from "@/lib/labels";

export const metadata: Metadata = { title: "Revisión de registro PAT 2" };

export default async function PatReviewPage(props: PageProps<"/aprobacion-pat-2/[id]">) {
  const { id } = await props.params;
  const registrationId = Number(id);
  if (!Number.isInteger(registrationId) || registrationId <= 0) notFound();

  const detail = await getPatDetail(registrationId);
  // Los borradores siguen siendo privados de los estudiantes.
  if (!detail || detail.registration.status === "DRAFT") notFound();

  const { registration: r, members, scan } = detail;
  const accepted = members.filter((member) => member.status === "ACCEPTED");
  const signatureMode = scan ? "Formato firmado a mano y escaneado" : "Firma digital de cada integrante";

  return (
    <>
      <BackLink href="/aprobacion-pat-2">Volver a la bandeja</BackLink>
      <PageHeader
        eyebrow={`${r.career}, ${r.faculty}`}
        title={r.members_label}
        description={`${r.participation_type === "GRUPAL" ? "Trabajo en pareja" : "Trabajo individual"}. Enviado el ${r.submitted_at ? shortDateTime(r.submitted_at) : "—"}`}
        actions={<Badge tone={patStatusTone(r.status)}>{patStatusLabel(r.status)}</Badge>}
      />

      <div className="review-layout">
        <div className="stack">
          <section className="panel-card">
            <header className="panel-card-head">
              <h2>Propuesta</h2>
            </header>
            <ProposalSummary detail={detail} />
          </section>

          {accepted.map((member) => (
            <section className="panel-card" key={member.id}>
              <header className="panel-card-head">
                <div>
                  <h2>
                    {member.name} {member.lastname}
                  </h2>
                  <p>
                    {member.email}
                    {member.role === "LEADER" && accepted.length > 1 ? " · creó el registro" : ""}
                  </p>
                </div>
                {member.signature ? (
                  // eslint-disable-next-line @next/next/no-img-element -- firma en data URL
                  <img className="member-signature is-large" src={member.signature} alt={`Firma de ${member.name}`} />
                ) : (
                  <Badge tone={scan ? "info" : "warning"}>{scan ? "Firma en escaneado" : "Sin firma"}</Badge>
                )}
              </header>
              <div className="panel-card-body">
                <MemberDataSummary member={member} />
              </div>
            </section>
          ))}
        </div>

        <aside className="review-aside">
          {r.status === "PENDING" ? (
            <section className="panel-card" aria-labelledby="decision-title">
              <header className="panel-card-head">
                <h2 id="decision-title">Tu decisión</h2>
              </header>
              <ReviewForm action={reviewPatAction.bind(null, r.id)} />
            </section>
          ) : (
            <section className="panel-card" aria-labelledby="decision-title">
              <header className="panel-card-head">
                <h2 id="decision-title">Decisión registrada</h2>
              </header>
              <div className="panel-card-body stack" style={{ gap: 10 }}>
                <p className="text-muted" style={{ fontSize: 14 }}>
                  {r.reviewer_name ?? "Personal de secretaría"}
                  {r.reviewed_at && `, ${shortDateTime(r.reviewed_at)}`}
                </p>
                {r.observations && <p className="observations">{r.observations}</p>}
                {r.status === "RETURNED" && (
                  <Alert tone="info">Volverá a la bandeja cuando los estudiantes lo reenvíen.</Alert>
                )}
                {r.status === "APPROVED" && !r.has_tribunal && (
                  <Link className="btn btn-primary" href={`/tribunales?registro=${r.id}`}>
                    <Gavel aria-hidden="true" /> Asignar tribunal
                  </Link>
                )}
              </div>
            </section>
          )}

          <section className="panel-card">
            <header className="panel-card-head">
              <h2>Documento</h2>
            </header>
            <div className="panel-card-body stack" style={{ gap: 12 }}>
              <p className="text-muted" style={{ fontSize: 14 }}>{signatureMode}.</p>
              <PatPdfButton
                registrationId={r.id}
                className="btn btn-secondary btn-block"
              />
              {scan && (
                <a className="btn btn-ghost btn-block" href={`/api/pat/${r.id}/escaneado`} target="_blank" rel="noreferrer">
                  <FileText aria-hidden="true" /> Ver escaneado ({scan.file_name})
                </a>
              )}
            </div>
          </section>

          <section className="panel-card">
            <header className="panel-card-head">
              <h2>Integrantes</h2>
            </header>
            <MembersList members={members} signedByScan={Boolean(scan)} />
          </section>

          <section className="panel-card">
            <header className="panel-card-head">
              <h2>Historial</h2>
            </header>
            <div className="panel-card-body">
              <Timeline events={detail.events} />
            </div>
          </section>
        </aside>
      </div>
    </>
  );
}
