import { useState, type ReactNode } from "react";
import { Alert, Image, StyleSheet, View } from "react-native";
import { router } from "expo-router";
import * as DocumentPicker from "expo-document-picker";
import * as Haptics from "expo-haptics";
import {
  Check,
  Download,
  Eye,
  FilePen,
  FileText,
  FileUp,
  LogOut,
  MailOpen,
  Pencil,
  PenLine,
  Send,
  Trash2,
  UserMinus,
  UserPlus,
  X,
} from "lucide-react-native";
import { Defense, Members, Requirements, Timeline, personalComplete } from "@/components/pat";
import { ProposalSummary } from "@/components/proposal-summary";
import { Badge, Banner, Button, Card, CardHeader, EmptyState, Loading, Screen, T } from "@/components/ui";
import { useResource } from "@/hooks/use-resource";
import { api, ApiError } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { openPdf } from "@/lib/documents";
import { dateTime, statusLabel, statusTone } from "@/lib/format";
import { colors, radius, elevation } from "@/lib/theme";
import type { StudentPat } from "@/lib/types";

type Full = Extract<StudentPat, { members: unknown }>;

function confirm(title: string, message: string, label: string, destructive = false) {
  return new Promise<boolean>((resolve) =>
    Alert.alert(title, message, [
      { text: "Cancelar", style: "cancel", onPress: () => resolve(false) },
      { text: label, style: destructive ? "destructive" : "default", onPress: () => resolve(true) },
    ]),
  );
}

function Step({ number, title, done, action, last, children }: { number: number; title: string; done?: boolean; action?: ReactNode; last?: boolean; children: ReactNode }) {
  return (
    <View style={[s.step, last && { borderBottomWidth: 0, paddingBottom: 0, marginBottom: 0 }]}>
      <View style={s.stepHead}>
        <View style={[s.stepNumber, done && s.stepNumberDone]}>
          {done ? <Check color="#fff" size={15} strokeWidth={3} /> : <T variant="label" color={colors.uleam}>{String(number)}</T>}
        </View>
        <T variant="heading" style={{ flex: 1 }}>
          {title}
        </T>
        {action}
      </View>
      <View style={{ gap: 12 }}>{children}</View>
    </View>
  );
}

export default function Registro() {
  const { refresh: refreshMe } = useAuth();
  const { data, error, refreshing, refresh, reload } = useResource(() => api.get<StudentPat>("/api/v1/pat"));
  const [busy, setBusy] = useState<string | null>(null);
  const [flash, setFlash] = useState<{ tone: "success" | "danger"; text: string } | null>(null);

  /** Ejecuta una acción, muestra el resultado y recarga el registro. */
  async function act(key: string, fn: () => Promise<unknown>, success: string) {
    setBusy(key);
    setFlash(null);
    try {
      await fn();
      void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      setFlash({ tone: "success", text: success });
      await Promise.all([reload(), refreshMe()]);
    } catch (caught) {
      void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      setFlash({ tone: "danger", text: caught instanceof ApiError ? caught.message : "No se pudo completar la acción." });
    } finally {
      setBusy(null);
    }
  }

  async function download(id: number, unsigned = false) {
    setBusy(unsigned ? "pdf-unsigned" : "pdf");
    try {
      await openPdf(
        `/api/pat/${id}/pdf${unsigned ? "?firmas=0" : ""}`,
        `PAT-04-F-002_registro-${id}${unsigned ? "_para-firmar" : ""}.pdf`,
        "Formato PAT-04-F-002",
      );
    } catch (caught) {
      setFlash({ tone: "danger", text: caught instanceof ApiError ? caught.message : "No se pudo abrir el PDF." });
    } finally {
      setBusy(null);
    }
  }

  async function uploadScan() {
    const picked = await DocumentPicker.getDocumentAsync({ type: "application/pdf", copyToCacheDirectory: true, multiple: false });
    if (picked.canceled) return;
    const file = picked.assets[0];
    if (file.size && file.size > 5 * 1024 * 1024) {
      setFlash({ tone: "danger", text: "El archivo supera 5 MB. Escanéalo con menor resolución." });
      return;
    }
    await act(
      "scan",
      () => api.upload("/api/v1/pat/scan", "scan", { uri: file.uri, name: file.name, type: file.mimeType ?? "application/pdf" }),
      "Formato escaneado subido.",
    );
  }

  const content = () => {
    if (error?.code === "no_profile") {
      return (
        <Banner tone="warning" title="Tu perfil académico aún no está registrado">
          Pide a secretaría académica que registre tus datos de estudiante para poder registrar tu tema.
        </Banner>
      );
    }
    if (error && !data) {
      return <EmptyState icon={FileText} title="No se pudo cargar tu registro" action={<Button title="Reintentar" onPress={reload} />}>{error.message}</EmptyState>;
    }
    if (!data) return null;

    /* ------------------------------------------------------ Sin registro */
    if (!data.registration) {
      return (
        <>
          <View style={{ gap: 4 }}>
            <T variant="label" color={colors.uleam}>
              Formato PAT-04-F-002
            </T>
            <T variant="title">Registro de modalidad y tema</T>
            <T variant="small">Registra tu propuesta de titulación, solo/a o en pareja con un compañero/a de tu carrera.</T>
          </View>
          <Card>
            {[
              ["Propuesta", "Modalidad, tema y problemática."],
              ["Integrantes", "Si es en pareja, invitas a tu compañero/a y acepta."],
              ["Firmas", "Cada uno firma en pantalla, con una foto o con el PDF escaneado."],
              ["Envío", "Secretaría aprueba o devuelve con observaciones."],
            ].map(([title, detail], index) => (
              <View key={title} style={[s.howRow, index > 0 && { borderTopWidth: 1, borderTopColor: colors.line }]}>
                <View style={s.howNumber}>
                  <T variant="label" color={colors.uleam}>
                    {String(index + 1)}
                  </T>
                </View>
                <View style={{ flex: 1 }}>
                  <T variant="label" color={colors.ink}>
                    {title}
                  </T>
                  <T variant="small">{detail}</T>
                </View>
              </View>
            ))}
          </Card>
          <Button title="Registrar mi tema" icon={FilePen} size="lg" onPress={() => router.push("/pat/crear")} />
        </>
      );
    }

    const full = data as Full;
    const { registration: r, members, membership, scan, requirements, tribunal } = full;
    const me = members.find((m) => m.student_id === full.me.studentId)!;
    const leader = members.find((m) => m.role === "LEADER");
    const teammate = members.find((m) => m.role === "MEMBER");
    const isLeader = membership.role === "LEADER";
    const membersDone = r.participation_type === "INDIVIDUAL" || (Boolean(teammate) && members.every((m) => m.status === "ACCEPTED"));
    const myDataDone = personalComplete(me);
    const signaturesDone = requirements.find((item) => item.key === "signatures")?.done ?? false;

    /* ------------------------------------------------------ Invitación */
    if (membership.status === "INVITED") {
      return (
        <>
          <View style={s.invite}>
            <MailOpen color={colors.ochre700} size={28} />
            <T variant="heading">Te invitaron a un trabajo en pareja</T>
            <T variant="body" color={colors.ink2} style={{ fontSize: 14 }}>
              {leader ? `${leader.name} ${leader.lastname}` : "Un compañero/a"} quiere desarrollar su trabajo de titulación contigo. Si aceptas, compartirán este registro: completarás tus datos y firmarás el formato.
            </T>
            <View style={{ gap: 10, marginTop: 6 }}>
              <Button title="Aceptar invitación" icon={Check} loading={busy === "accept"} onPress={() => act("accept", () => api.post("/api/v1/pat/invitation", { accept: true }), "Te uniste al trabajo. Completa tus datos y firma.")} />
              <Button
                title="Rechazar"
                icon={X}
                variant="secondary"
                loading={busy === "decline"}
                onPress={async () => {
                  if (await confirm("Rechazar invitación", "Tu compañero/a podrá invitar a otra persona y tú podrás crear tu propio registro.", "Rechazar", true)) {
                    await act("decline", () => api.post("/api/v1/pat/invitation", { accept: false }), "Rechazaste la invitación.");
                  }
                }}
              />
            </View>
          </View>
          <Card>
            <ProposalSummary registration={r} />
          </Card>
        </>
      );
    }

    /* ------------------------------------------------------ En revisión o aprobado */
    if (!full.editable) {
      const approved = r.status === "APPROVED";
      return (
        <>
          <View style={[s.status, { borderLeftColor: approved ? colors.success : colors.ochre }]}>
            <View style={{ flexDirection: "row", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
              <T variant="heading">{approved ? "Tema aprobado" : "Registro en revisión"}</T>
              <Badge tone={statusTone(r.status)}>{statusLabel(r.status)}</Badge>
            </View>
            <T variant="small">
              {approved
                ? tribunal
                  ? "Tu tribunal ya está asignado. Revisa la convocatoria."
                  : "El siguiente paso es la asignación de tu tribunal de defensa."
                : `Secretaría está revisando tu registro. Enviado el ${dateTime(r.submitted_at)}`}
            </T>
            {approved && r.observations ? (
              <View style={[s.note, { backgroundColor: colors.success50 }]}>
                <T variant="small" color={colors.ink2}>
                  {r.observations}
                </T>
              </View>
            ) : null}
            <View style={{ gap: 8, marginTop: 4 }}>
              <Button title="Descargar formato PDF" icon={Download} variant="secondary" loading={busy === "pdf"} onPress={() => download(r.id)} />
              {scan ? <Button title="Ver escaneado" icon={Eye} variant="ghost" onPress={() => openPdf(`/api/pat/${r.id}/escaneado`, scan.file_name, "Formato escaneado")} /> : null}
            </View>
          </View>
          {tribunal ? (
            <Card padded={false}>
              <CardHeader title="Convocatoria a la defensa" />
              <View style={{ padding: 16 }}>
                <Defense tribunal={tribunal} />
              </View>
            </Card>
          ) : null}
          <Card>
            <ProposalSummary registration={r} />
          </Card>
          <Card padded={false}>
            <CardHeader title="Integrantes" />
            <Members members={members} youStudentId={full.me.studentId} signedByScan={Boolean(scan)} />
          </Card>
          <Card padded={false}>
            <CardHeader title="Historial" />
            <View style={{ padding: 16 }}>
              <Timeline events={full.events} limit={10} />
            </View>
          </Card>
        </>
      );
    }

    /* ------------------------------------------------------ Espacio de trabajo */
    return (
      <>
        <View style={{ flexDirection: "row", alignItems: "flex-start", gap: 10 }}>
          <View style={{ flex: 1, gap: 2 }}>
            <T variant="label" color={colors.uleam}>
              Formato PAT-04-F-002
            </T>
            <T variant="title">Mi registro</T>
            <T variant="small">{r.participation_type === "GRUPAL" ? "Registro compartido: los cambios los ven ambos integrantes." : "Completa los pasos y envíalo a revisión."}</T>
          </View>
          <Badge tone={statusTone(r.status)}>{statusLabel(r.status)}</Badge>
        </View>

        {r.status === "RETURNED" ? (
          <Banner tone="danger" title="Secretaría devolvió el registro">
            <T variant="small" color={colors.ink2}>
              {r.observations ?? "Corrige lo indicado y vuelve a enviarlo."}
              {"\n"}Si cambias la propuesta o los datos, habrá que firmar de nuevo.
            </T>
          </Banner>
        ) : null}

        <Card style={{ gap: 0 }}>
          <Step number={1} title="Propuesta" done action={isLeader ? <Button title="Editar" icon={Pencil} variant="ghost" size="sm" onPress={() => router.push("/pat/propuesta")} /> : undefined}>
            <ProposalSummary registration={r} collapsed />
            {!isLeader ? <T variant="small">Solo {leader?.name} puede editar la propuesta.</T> : null}
          </Step>

          <Step number={2} title="Integrantes" done={membersDone}>
            <View style={s.inner}>
              <Members members={members} youStudentId={full.me.studentId} signedByScan={Boolean(scan)} />
            </View>
            {isLeader && r.participation_type === "GRUPAL" ? (
              teammate ? (
                <View style={{ flexDirection: "row", gap: 8 }}>
                  <Button title="Cambiar" icon={UserPlus} variant="secondary" size="sm" style={{ flex: 1 }} onPress={() => router.push("/pat/companero")} />
                  <Button
                    title="Quitar"
                    icon={UserMinus}
                    variant="secondary"
                    size="sm"
                    style={{ flex: 1 }}
                    loading={busy === "remove"}
                    onPress={async () => {
                      if (await confirm("Quitar compañero/a", `¿Quitar a ${teammate.name} del registro? Las firmas se anularán.`, "Quitar", true)) {
                        await act("remove", () => api.del("/api/v1/pat/teammate"), "Quitaste a tu compañero/a.");
                      }
                    }}
                  />
                </View>
              ) : (
                <Button title="Buscar a mi compañero/a" icon={UserPlus} onPress={() => router.push("/pat/companero")} />
              )
            ) : null}
            {isLeader && r.participation_type === "INDIVIDUAL" ? <T variant="small">Trabajo individual. Para hacerlo en pareja, edita la propuesta.</T> : null}
            {!isLeader ? (
              <Button
                title="Salir del trabajo"
                icon={LogOut}
                variant="ghost"
                size="sm"
                loading={busy === "leave"}
                style={{ alignSelf: "flex-start" }}
                onPress={async () => {
                  if (await confirm("Salir del trabajo", "Tu firma se borrará y podrás crear tu propio registro.", "Salir", true)) {
                    await act("leave", () => api.post("/api/v1/pat/leave"), "Saliste del trabajo.");
                  }
                }}
              />
            ) : null}
          </Step>

          <Step number={3} title="Mis datos informativos" done={myDataDone} action={<Button title={myDataDone ? "Editar" : "Completar"} icon={Pencil} variant="ghost" size="sm" onPress={() => router.push("/pat/datos")} />}>
            <T variant="small">{myDataDone ? "Tus datos están completos. Aparecen en tu página del formato." : "Te faltan nivel, paralelo, nacimiento, estado civil o residencia."}</T>
          </Step>

          <Step number={4} title="Firmas" done={signaturesDone}>
            {!membersDone ? (
              <Banner tone="info" title="Las firmas se habilitan con el equipo completo">
                {teammate ? `Cuando ${teammate.name} acepte la invitación, ambos podrán firmar.` : "Primero agrega a tu compañero/a."}
              </Banner>
            ) : scan ? (
              <View style={s.ok}>
                <FileText color={colors.success} size={26} />
                <View style={{ flex: 1 }}>
                  <T variant="label" color={colors.ink}>
                    Formato escaneado subido
                  </T>
                  <T variant="small" numberOfLines={1}>
                    {scan.file_name} · {(scan.size_bytes / 1024 / 1024).toFixed(1)} MB
                  </T>
                </View>
                <Button title="Quitar" variant="ghost" size="sm" loading={busy === "scan-del"} onPress={() => act("scan-del", () => api.del("/api/v1/pat/scan"), "Formato escaneado quitado.")} />
              </View>
            ) : me.signature ? (
              <View style={s.ok}>
                <Image source={{ uri: me.signature }} style={{ width: 110, height: 44 }} resizeMode="contain" accessibilityLabel="Tu firma" />
                <View style={{ flex: 1 }}>
                  <T variant="label" color={colors.ink}>
                    Ya firmaste
                  </T>
                  <T variant="small">{me.signature_method === "PHOTO" ? "Con foto" : "Dibujada"}</T>
                </View>
                <Button title="Rehacer" variant="ghost" size="sm" loading={busy === "unsign"} onPress={() => act("unsign", () => api.del("/api/v1/pat/signature"), "Tu firma se borró. Vuelve a firmar.")} />
              </View>
            ) : myDataDone ? (
              <>
                <T variant="small">Firma con el dedo en pantalla o con una foto de tu firma en una hoja blanca. Se coloca sola en el PDF.</T>
                <Button title="Firmar ahora" icon={PenLine} onPress={() => router.push("/pat/firmar")} />
              </>
            ) : (
              <Banner tone="info">Completa tus datos informativos (paso 3) antes de firmar.</Banner>
            )}

            {membersDone ? (
              <View style={s.manual}>
                <T variant="label" color={colors.ink}>
                  ¿Prefieres firmar a mano?
                </T>
                <T variant="small">Descarga el formato, fírmenlo, escanéenlo en un solo PDF (máx. 5 MB) y súbelo.</T>
                <View style={{ flexDirection: "row", gap: 8 }}>
                  <Button title="Descargar" icon={Download} variant="secondary" size="sm" style={{ flex: 1 }} loading={busy === "pdf-unsigned"} onPress={() => download(r.id, true)} />
                  <Button title={scan ? "Reemplazar" : "Subir PDF"} icon={FileUp} variant="secondary" size="sm" style={{ flex: 1 }} loading={busy === "scan"} onPress={uploadScan} />
                </View>
              </View>
            ) : null}
          </Step>

          <Step number={5} title="Enviar a revisión" last>
            <Requirements items={requirements} />
            {isLeader ? (
              <Button
                title={r.status === "RETURNED" ? "Reenviar a revisión" : "Enviar a revisión"}
                icon={Send}
                size="lg"
                disabled={!full.canSubmit}
                loading={busy === "submit"}
                onPress={async () => {
                  if (await confirm("Enviar a revisión", "Secretaría revisará el registro. No podrán modificarlo mientras esté en revisión.", "Enviar")) {
                    await act("submit", () => api.post("/api/v1/pat/submit"), "Registro enviado. Verás la decisión de secretaría aquí.");
                  }
                }}
              />
            ) : (
              <T variant="small">{leader?.name} enviará el registro cuando todo esté listo.</T>
            )}
            <Button title="Vista previa del PDF" icon={Eye} variant="ghost" loading={busy === "pdf"} onPress={() => download(r.id)} />
          </Step>
        </Card>

        <Card padded={false}>
          <CardHeader title="Historial" />
          <View style={{ padding: 16 }}>
            <Timeline events={full.events} limit={8} />
          </View>
        </Card>

        {isLeader && r.status === "DRAFT" ? (
          <Button
            title="Eliminar borrador"
            icon={Trash2}
            variant="ghost"
            size="sm"
            style={{ alignSelf: "center" }}
            loading={busy === "delete"}
            onPress={async () => {
              if (await confirm("Eliminar borrador", "Se perderán la propuesta, las firmas y la invitación.", "Eliminar", true)) {
                await act("delete", () => api.del("/api/v1/pat"), "Borrador eliminado.");
              }
            }}
          />
        ) : null}
      </>
    );
  };

  if (!data && !error) return <Loading />;

  return (
    <Screen tabbed refreshing={refreshing} onRefresh={refresh}>
      {flash ? <Banner tone={flash.tone}>{flash.text}</Banner> : null}
      {content()}
    </Screen>
  );
}

const s = StyleSheet.create({
  step: { gap: 12, paddingBottom: 18, marginBottom: 18, borderBottomWidth: 1, borderBottomColor: colors.line },
  stepHead: { flexDirection: "row", alignItems: "center", gap: 10 },
  stepNumber: { width: 28, height: 28, borderRadius: 14, borderWidth: 2, borderColor: colors.uleam, alignItems: "center", justifyContent: "center" },
  stepNumberDone: { backgroundColor: colors.success, borderColor: colors.success },
  inner: { borderWidth: 1, borderColor: colors.line, borderRadius: radius.md, overflow: "hidden", marginHorizontal: -2 },
  ok: { flexDirection: "row", alignItems: "center", gap: 12, padding: 12, borderRadius: radius.md, borderWidth: 1, borderColor: "#B5DFC9", backgroundColor: colors.success50 },
  manual: { gap: 8, padding: 14, borderRadius: radius.md, borderWidth: 1, borderStyle: "dashed", borderColor: colors.lineStrong },
  invite: { gap: 8, padding: 18, borderRadius: radius.lg, borderWidth: 1, borderColor: colors.ochre, backgroundColor: colors.ochre50 },
  status: { gap: 8, padding: 16, borderRadius: radius.lg, borderLeftWidth: 4, backgroundColor: colors.surface, ...elevation.low },
  note: { borderRadius: radius.sm, padding: 10 },
  howRow: { flexDirection: "row", alignItems: "center", gap: 12, paddingVertical: 12 },
  howNumber: { width: 30, height: 30, borderRadius: 15, backgroundColor: colors.uleam50, alignItems: "center", justifyContent: "center" },
});
