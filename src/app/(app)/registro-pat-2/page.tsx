import type { Metadata } from "next";
import Link from "next/link";
import {
  Check,
  FileDown,
  FileText,
  LogOut,
  MailOpen,
  PenLine,
  Pencil,
  Send,
  Trash2,
  UserMinus,
  X,
} from "lucide-react";
import {
  createPatAction,
  deleteDraftAction,
  deleteScanAction,
  leaveRegistrationAction,
  removeSignatureAction,
  removeTeammateAction,
  respondInvitationAction,
  submitPatAction,
  updatePersonalAction,
  updateProposalAction,
} from "@/app/(app)/registro-pat-2/actions";
import { DefenseDetails } from "@/components/defense-card";
import { ConfirmButton, SubmitButton } from "@/components/form-controls";
import { PatPdfButton } from "@/components/pat-document";
import { PatCreateForm, PatPersonalForm, PatProposalForm } from "@/components/pat-form";
import { MembersList, ProposalSummary, RequirementList, Timeline } from "@/components/pat-parts";
import { ScanUpload } from "@/components/scan-upload";
import { SignaturePad } from "@/components/signature-pad";
import { TeammatePicker } from "@/components/teammate-picker";
import { Alert, Badge, BackLink, PageHeader, searchParam } from "@/components/ui";
import { requireUser } from "@/lib/current-user";
import { getPatDetailForStudent } from "@/lib/data/pat";
import { getStudentByUserId } from "@/lib/data/students";
import { getTribunalByStudent } from "@/lib/data/tribunals";
import { patStatusLabel, patStatusTone, shortDateTime } from "@/lib/labels";
import { personalFormValues, proposalFormValues } from "@/lib/pat-document-data";
import { canSubmit, isEditable, personalDataComplete } from "@/lib/pat-rules";

export const metadata: Metadata = { title: "Registro de tema PAT 2" };

const flashMessages: Record<string, string> = {
  creado: "Borrador guardado. Completa las firmas y envíalo a revisión.",
  "creado-grupal": "Borrador guardado. Ahora busca e invita a tu compañero/a.",
  propuesta: "Propuesta actualizada.",
  datos: "Tus datos informativos se guardaron.",
  invitado: "Invitación enviada. Tu compañero/a la verá al iniciar sesión.",
  "companero-quitado": "Quitaste a tu compañero/a del registro.",
  aceptado: "Te uniste al trabajo. Completa tus datos y firma.",
  rechazado: "Rechazaste la invitación. Ya puedes crear tu propio registro.",
  salio: "Saliste del trabajo. Ya puedes crear tu propio registro.",
  "firma-borrada": "Tu firma se borró.",
  escaneado: "Formato escaneado subido.",
  "escaneado-quitado": "Formato escaneado quitado.",
  enviado: "Registro enviado. Secretaría lo revisará y verás la decisión en tu panel.",
  eliminado: "Borrador eliminado.",
};

const errorMessages: Record<string, string> = {
  only_leader: "Esa acción solo la puede hacer quien creó el registro.",
  only_member: "Quien creó el registro no puede salir; puede eliminar el borrador.",
  not_editable: "El registro ya está en revisión o aprobado y no se puede modificar.",
  not_draft: "Solo se puede eliminar un registro en borrador.",
  not_group: "Para invitar a alguien, cambia la propuesta a «En pareja».",
  invalid_teammate: "Ese estudiante no está disponible: debe estar activo y ser de tu carrera.",
  teammate_busy: "Ese estudiante ya forma parte de otro registro PAT 2.",
  no_invitation: "La invitación ya no está disponible.",
  incomplete: "Aún faltan requisitos para enviar el registro. Revisa la lista.",
  not_member: "No eres integrante de este registro.",
  no_registration: "No tienes un registro PAT 2.",
};

function Step({
  number,
  title,
  done,
  children,
  action,
}: {
  number: number;
  title: string;
  done?: boolean;
  children: React.ReactNode;
  action?: React.ReactNode;
}) {
  return (
    <section className={`work-step${done ? " is-done" : ""}`} aria-labelledby={`step-${number}`}>
      <header className="work-step-head">
        <span className="work-step-number" aria-hidden="true">
          {done ? <Check /> : number}
        </span>
        <h2 id={`step-${number}`}>{title}</h2>
        {action && <div className="work-step-action">{action}</div>}
      </header>
      <div className="work-step-body">{children}</div>
    </section>
  );
}

export default async function PatRegistrationPage(props: PageProps<"/registro-pat-2">) {
  const user = await requireUser(["STUDENT"]);
  const params = await props.searchParams;
  const ok = searchParam(params.ok);
  const error = searchParam(params.error);
  const editing = searchParam(params.editar);
  const student = await getStudentByUserId(user.id);

  const flash = (
    <>
      {ok && flashMessages[ok] && <Alert tone="success">{flashMessages[ok]}</Alert>}
      {error && errorMessages[error] && <Alert tone="error">{errorMessages[error]}</Alert>}
    </>
  );

  if (!student) {
    return (
      <div className="stack">
        <PageHeader eyebrow="Formato PAT-04-F-002" title="Registro de modalidad y tema" />
        <Alert tone="warning" title="Tu perfil académico aún no está registrado">
          Pide a secretaría académica que registre tus datos de estudiante para poder registrar tu tema.
        </Alert>
      </div>
    );
  }

  const detail = await getPatDetailForStudent(student.id);

  /* ------------------------------------------------ Sin registro: crear */
  if (!detail) {
    return (
      <div className="stack">
        <PageHeader
          eyebrow="Formato PAT-04-F-002"
          title="Registro de modalidad y tema"
          description="Registra tu propuesta de titulación. Puedes hacerlo solo/a o en pareja con un compañero/a de tu carrera."
        />
        {flash}
        <ol className="process-strip" aria-label="Cómo funciona">
          <li>
            <strong>Propuesta</strong>
            <span>Modalidad, tema y problemática.</span>
          </li>
          <li>
            <strong>Integrantes</strong>
            <span>Si es en pareja, invitas a tu compañero/a y acepta.</span>
          </li>
          <li>
            <strong>Firmas</strong>
            <span>Cada uno firma en pantalla, con foto o con el PDF escaneado.</span>
          </li>
          <li>
            <strong>Envío</strong>
            <span>Secretaría revisa y aprueba o devuelve con observaciones.</span>
          </li>
        </ol>
        {!student.cedula && (
          <Alert tone="warning" title="Falta tu cédula">
            Agrégala en <Link href="/perfil">Mis datos</Link>; es obligatoria en el formato oficial.
          </Alert>
        )}
        <PatCreateForm action={createPatAction} />
      </div>
    );
  }

  const { registration: r, members, membership, scan, requirements } = detail;
  const me = members.find((member) => member.student_id === student.id)!;
  const leader = members.find((member) => member.role === "LEADER");
  const teammate = members.find((member) => member.role === "MEMBER");
  const isLeader = membership.role === "LEADER";
  const editable = isEditable(r.status);
  const anySigned = members.some((member) => member.signature) || Boolean(scan);

  /* ------------------------------------------------ Invitación */
  if (membership.status === "INVITED") {
    return (
      <div className="stack">
        <PageHeader eyebrow="Invitación" title="Te invitaron a un trabajo en pareja" />
        {flash}
        <div className="invite-card">
          <MailOpen aria-hidden="true" />
          <div>
            <strong>
              {leader ? `${leader.name} ${leader.lastname}` : "Un compañero/a"} quiere desarrollar su trabajo de
              titulación contigo.
            </strong>
            <p>
              Revisa la propuesta. Si aceptas, ambos compartirán este registro: completarás tus datos informativos y
              firmarás el formato. Si la rechazas, podrás crear tu propio registro.
            </p>
            <div className="invite-actions">
              <form action={respondInvitationAction.bind(null, true)}>
                <SubmitButton className="btn btn-primary" pendingLabel="Uniéndote…">
                  <Check aria-hidden="true" /> Aceptar invitación
                </SubmitButton>
              </form>
              <form action={respondInvitationAction.bind(null, false)}>
                <ConfirmButton className="btn btn-ghost" message="¿Rechazar la invitación? Tu compañero/a podrá invitar a otra persona.">
                  <X aria-hidden="true" /> Rechazar
                </ConfirmButton>
              </form>
            </div>
          </div>
        </div>
        <section className="panel-card">
          <header className="panel-card-head">
            <h2>Propuesta</h2>
            <Badge tone="neutral">Borrador</Badge>
          </header>
          <ProposalSummary detail={detail} />
        </section>
      </div>
    );
  }

  /* ------------------------------------------------ Edición de formularios */
  if (editing === "propuesta" && isLeader && editable) {
    return (
      <div className="stack">
        <div>
          <BackLink href="/registro-pat-2">Volver al registro</BackLink>
          <PageHeader eyebrow="Registro PAT 2" title="Editar propuesta" />
        </div>
        <PatProposalForm
          action={updateProposalAction}
          initial={proposalFormValues(detail)}
          hasTeammate={Boolean(teammate)}
          signed={anySigned}
        />
      </div>
    );
  }

  if (editing === "datos" && editable) {
    return (
      <div className="stack">
        <div>
          <BackLink href="/registro-pat-2">Volver al registro</BackLink>
          <PageHeader eyebrow="Registro PAT 2" title="Mis datos informativos" />
        </div>
        <PatPersonalForm action={updatePersonalAction} initial={personalFormValues(me)} signed={Boolean(me.signature) || Boolean(scan)} />
      </div>
    );
  }

  /* ------------------------------------------------ En revisión o aprobado */
  if (!editable) {
    const approved = r.status === "APPROVED";
    const tribunal = approved ? await getTribunalByStudent(student.id) : null;
    return (
      <div className="stack">
        <PageHeader eyebrow="Formato PAT-04-F-002" title="Registro de modalidad y tema" />
        {flash}
        <div className={`status-banner${approved ? " is-approved" : ""}`}>
          <div className="status-banner-text">
            <strong>
              {approved ? "Tema aprobado" : "Registro en revisión"}{" "}
              <Badge tone={patStatusTone(r.status)}>{patStatusLabel(r.status)}</Badge>
            </strong>
            <p>
              {approved
                ? tribunal
                  ? "Tu tribunal ya está asignado. Revisa la convocatoria abajo."
                  : "El siguiente paso es la asignación de tu tribunal de defensa."
                : `Secretaría está revisando tu registro. Enviado el ${r.submitted_at ? shortDateTime(r.submitted_at) : "—"}`}
            </p>
            {approved && r.observations && <p className="observations is-positive">{r.observations}</p>}
          </div>
          <div className="status-banner-actions">
            <PatPdfButton registrationId={r.id} />
            {scan && (
              <a className="btn btn-ghost" href={`/api/pat/${r.id}/escaneado`} target="_blank" rel="noreferrer">
                <FileText aria-hidden="true" /> Ver escaneado
              </a>
            )}
          </div>
        </div>

        <div className="review-layout">
          <div className="stack">
            {tribunal && (
              <section className="panel-card">
                <header className="panel-card-head">
                  <h2>Convocatoria a la defensa</h2>
                </header>
                <DefenseDetails tribunal={tribunal} />
              </section>
            )}
            <section className="panel-card">
              <header className="panel-card-head">
                <h2>Propuesta</h2>
              </header>
              <ProposalSummary detail={detail} />
            </section>
          </div>
          <aside className="review-aside">
            <section className="panel-card">
              <header className="panel-card-head">
                <h2>Integrantes</h2>
              </header>
              <MembersList members={members} youStudentId={student.id} signedByScan={Boolean(scan)} />
            </section>
            <section className="panel-card">
              <header className="panel-card-head">
                <h2>Historial</h2>
              </header>
              <div className="panel-card-body">
                <Timeline events={detail.events} limit={8} />
              </div>
            </section>
          </aside>
        </div>
      </div>
    );
  }

  /* ------------------------------------------------ Espacio de trabajo */
  const myDataDone = personalDataComplete(me.extra_data);
  const everyoneAccepted = members.every((member) => member.status === "ACCEPTED");
  const ready = canSubmit(requirements);
  const signaturesDone = requirements.find((item) => item.key === "signatures")?.done ?? false;
  const membersDone =
    r.participation_type === "INDIVIDUAL" || (Boolean(teammate) && everyoneAccepted);

  return (
    <div className="stack">
      <PageHeader
        eyebrow="Formato PAT-04-F-002"
        title="Registro de modalidad y tema"
        description={
          r.participation_type === "GRUPAL"
            ? "Registro compartido: los cambios los ven ambos integrantes."
            : "Completa los pasos y envía tu registro a revisión."
        }
        actions={<Badge tone={patStatusTone(r.status)}>{patStatusLabel(r.status)}</Badge>}
      />
      {flash}

      {r.status === "RETURNED" && (
        <div className="status-banner is-returned">
          <div className="status-banner-text">
            <strong>Secretaría devolvió el registro</strong>
            <p>
              Corrige lo indicado y vuelve a enviarlo.
              {r.reviewer_name && ` Revisado por ${r.reviewer_name}.`} Si cambias la propuesta o los datos, habrá que
              firmar de nuevo.
            </p>
            {r.observations && (
              <p className="observations">
                <span className="observations-label">Observaciones</span>
                {r.observations}
              </p>
            )}
          </div>
        </div>
      )}

      <div className="review-layout">
        <div className="work-steps">
          <Step
            number={1}
            title="Propuesta"
            done
            action={
              isLeader ? (
                <Link className="btn btn-ghost btn-sm" href="/registro-pat-2?editar=propuesta">
                  <Pencil aria-hidden="true" /> Editar
                </Link>
              ) : undefined
            }
          >
            <div className="panel-card">
              <ProposalSummary detail={detail} />
            </div>
            {!isLeader && (
              <p className="field-hint" style={{ marginTop: 10 }}>
                Solo {leader?.name} puede editar la propuesta. Si necesitas un cambio, coordínalo con él o ella.
              </p>
            )}
          </Step>

          <Step number={2} title="Integrantes" done={membersDone}>
            <div className="panel-card">
              <MembersList members={members} youStudentId={student.id} signedByScan={Boolean(scan)} />
            </div>
            {isLeader && r.participation_type === "GRUPAL" && !teammate && (
              <div className="step-callout">
                <strong>Busca a tu compañero/a</strong>
                <TeammatePicker />
              </div>
            )}
            {isLeader && teammate && (
              <details className="disclosure" style={{ marginTop: 12 }}>
                <summary>
                  <UserMinus aria-hidden="true" /> Cambiar o quitar al compañero/a
                </summary>
                <div className="disclosure-body stack" style={{ gap: 14 }}>
                  <TeammatePicker replacing />
                  <form action={removeTeammateAction}>
                    <ConfirmButton
                      className="btn btn-danger-ghost btn-sm"
                      message={`¿Quitar a ${teammate.name} ${teammate.lastname}? Las firmas se anularán.`}
                    >
                      <UserMinus aria-hidden="true" /> Quitar a {teammate.name}
                    </ConfirmButton>
                  </form>
                </div>
              </details>
            )}
            {isLeader && r.participation_type === "INDIVIDUAL" && (
              <p className="field-hint" style={{ marginTop: 10 }}>
                Trabajo individual. Para hacerlo en pareja, edita la propuesta y elige «En pareja».
              </p>
            )}
            {!isLeader && (
              <form action={leaveRegistrationAction} style={{ marginTop: 12 }}>
                <ConfirmButton
                  className="btn btn-danger-ghost btn-sm"
                  message="¿Salir de este trabajo? Tu firma se borrará y podrás crear tu propio registro."
                >
                  <LogOut aria-hidden="true" /> Salir del trabajo
                </ConfirmButton>
              </form>
            )}
          </Step>

          <Step
            number={3}
            title="Mis datos informativos"
            done={myDataDone}
            action={
              <Link className="btn btn-ghost btn-sm" href="/registro-pat-2?editar=datos">
                <Pencil aria-hidden="true" /> {myDataDone ? "Editar" : "Completar"}
              </Link>
            }
          >
            <p className="text-muted">
              {myDataDone
                ? "Tus datos están completos. Aparecen en tu página del formato."
                : "Te faltan datos obligatorios (nivel, paralelo, nacimiento, estado civil y residencia)."}
            </p>
          </Step>

          <Step number={4} title="Firmas" done={signaturesDone}>
            {!membersDone ? (
              <Alert tone="info" title="Las firmas se habilitan con el equipo completo">
                {teammate
                  ? `Cuando ${teammate.name} acepte la invitación, ambos podrán firmar el mismo formato.`
                  : "Primero agrega a tu compañero/a: así ambos firman la versión final del formato."}
              </Alert>
            ) : scan ? (
              <div className="scan-card">
                <FileText aria-hidden="true" />
                <div>
                  <strong>Formato escaneado subido</strong>
                  <small>
                    {scan.file_name} · {(scan.size_bytes / 1024 / 1024).toFixed(1)} MB · {scan.uploader_name},{" "}
                    {shortDateTime(scan.uploaded_at)}
                  </small>
                </div>
                <a className="btn btn-ghost btn-sm" href={`/api/pat/${r.id}/escaneado`} target="_blank" rel="noreferrer">
                  Ver
                </a>
                <form action={deleteScanAction}>
                  <ConfirmButton className="btn btn-danger-ghost btn-sm" message="¿Quitar el formato escaneado?">
                    Quitar
                  </ConfirmButton>
                </form>
              </div>
            ) : (
              <>
                <p className="text-muted" style={{ marginBottom: 14 }}>
                  Cada integrante firma por su cuenta. El PDF incluye las firmas automáticamente y ambos descargan la
                  misma versión.
                </p>
                {me.signature ? (
                  <div className="my-signature">
                    {/* eslint-disable-next-line @next/next/no-img-element -- firma en data URL */}
                    <img src={me.signature} alt="Tu firma" />
                    <div>
                      <strong>Ya firmaste</strong>
                      <small>
                        {me.signature_method === "PHOTO" ? "Con foto" : "Dibujada"}
                        {me.signed_at && `, ${shortDateTime(me.signed_at)}`}
                      </small>
                    </div>
                    <form action={removeSignatureAction}>
                      <ConfirmButton className="btn btn-ghost btn-sm" message="¿Borrar tu firma para volver a firmar?">
                        Volver a firmar
                      </ConfirmButton>
                    </form>
                  </div>
                ) : myDataDone ? (
                  <SignaturePad signerName={`${me.name} ${me.lastname}`} />
                ) : (
                  <Alert tone="info">Completa tus datos informativos (paso 3) antes de firmar.</Alert>
                )}
              </>
            )}

            {membersDone && (
            <details className="disclosure" style={{ marginTop: 16 }}>
              <summary>
                <PenLine aria-hidden="true" /> {scan ? "Reemplazar el escaneado" : "Prefiero firmar a mano y subir el escaneado"}
              </summary>
              <div className="disclosure-body stack" style={{ gap: 14 }}>
                <ol className="mini-steps">
                  <li>Descarga el formato sin firmas.</li>
                  <li>Imprímelo; cada integrante firma en su casilla.</li>
                  <li>Escanéalo en un solo PDF y súbelo aquí.</li>
                </ol>
                <PatPdfButton
                  registrationId={r.id}
                  unsigned
                  label="Descargar para firmar a mano"
                  className="btn btn-secondary btn-sm"
                />
                <ScanUpload />
                <p className="field-hint">
                  Si después cambian la propuesta o los datos, el escaneado se anula para evitar documentos que no
                  coincidan.
                </p>
              </div>
            </details>
            )}
          </Step>
        </div>

        <aside className="review-aside">
          <section className="panel-card">
            <header className="panel-card-head">
              <h2>Para enviar</h2>
              <span className="text-muted tabular" style={{ fontSize: 13 }}>
                {requirements.filter((item) => item.done).length}/{requirements.length}
              </span>
            </header>
            <div className="panel-card-body stack" style={{ gap: 16 }}>
              <RequirementList items={requirements} />
              {isLeader ? (
                <form action={submitPatAction}>
                  <ConfirmButton
                    className={`btn btn-block ${ready ? "btn-primary" : "btn-secondary"}`}
                    message="¿Enviar el registro a secretaría? No podrán modificarlo mientras esté en revisión."
                    disabled={!ready}
                  >
                    <Send aria-hidden="true" /> {r.status === "RETURNED" ? "Reenviar a revisión" : "Enviar a revisión"}
                  </ConfirmButton>
                </form>
              ) : (
                <p className="field-hint">{leader?.name} enviará el registro cuando todo esté listo.</p>
              )}
              <PatPdfButton
                registrationId={r.id}
                label="Vista previa del PDF"
                className="btn btn-ghost btn-block"
              />
            </div>
          </section>

          <section className="panel-card">
            <header className="panel-card-head">
              <h2>Historial</h2>
            </header>
            <div className="panel-card-body">
              <Timeline events={detail.events} limit={8} />
            </div>
          </section>

          {isLeader && r.status === "DRAFT" && (
            <form action={deleteDraftAction}>
              <ConfirmButton
                className="btn btn-danger-ghost btn-sm"
                message="¿Eliminar el borrador? Se perderán la propuesta, las firmas y la invitación."
              >
                <Trash2 aria-hidden="true" /> Eliminar borrador
              </ConfirmButton>
            </form>
          )}
        </aside>
      </div>

      <p className="text-muted" style={{ fontSize: 13 }}>
        <FileDown aria-hidden="true" style={{ width: 14, height: 14, display: "inline", verticalAlign: "-2px" }} /> El
        PDF lleva el número de registro y la versión; cualquier integrante puede descargarlo sin conflictos.
      </p>
    </div>
  );
}
