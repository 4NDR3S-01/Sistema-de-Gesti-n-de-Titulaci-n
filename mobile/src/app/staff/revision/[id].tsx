import { useState } from "react";
import { Image, Pressable, View } from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import * as Haptics from "expo-haptics";
import { ChevronDown, ChevronUp, CircleCheck, Download, Eye, Gavel, Undo2 } from "lucide-react-native";
import { Members, Timeline } from "@/components/pat";
import { ProposalSummary } from "@/components/proposal-summary";
import { Badge, Banner, Button, Card, CardHeader, Choice, EmptyState, Field, Input, KeyValue, Loading, Screen, T } from "@/components/ui";
import { useResource } from "@/hooks/use-resource";
import { api, ApiError } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { openPdf } from "@/lib/documents";
import { ageFrom, dateTime, statusLabel, statusTone } from "@/lib/format";
import { colors } from "@/lib/theme";
import type { Member, PatDetail } from "@/lib/types";

function MemberData({ member, signedByScan }: { member: Member; signedByScan: boolean }) {
  const [open, setOpen] = useState(false);
  const x = member.extra_data ?? {};
  const age = ageFrom(x.birthDate);
  return (
    <Card padded={false}>
      <Pressable onPress={() => setOpen(!open)} style={{ flexDirection: "row", alignItems: "center", gap: 12, padding: 16 }} accessibilityRole="button" accessibilityState={{ expanded: open }}>
        <View style={{ flex: 1, gap: 2 }}>
          <T variant="heading" style={{ fontSize: 16 }}>
            {member.name} {member.lastname}
          </T>
          <T variant="small" numberOfLines={1}>
            {member.email}
          </T>
        </View>
        {member.signature ? (
          <Image source={{ uri: member.signature }} style={{ width: 90, height: 34 }} resizeMode="contain" accessibilityLabel="Firma" />
        ) : (
          <Badge tone={signedByScan ? "info" : "warning"}>{signedByScan ? "En escaneado" : "Sin firma"}</Badge>
        )}
        {open ? <ChevronUp color={colors.muted} size={20} /> : <ChevronDown color={colors.muted} size={20} />}
      </Pressable>
      {open ? (
        <View style={{ paddingHorizontal: 16, paddingBottom: 16 }}>
          <KeyValue
            items={[
              { label: "Cédula", value: member.cedula },
              { label: "Sexo", value: member.sex === "MASCULINO" ? "Masculino" : member.sex === "FEMENINO" ? "Femenino" : null },
              { label: "Nivel y paralelo", value: [x.level, x.parallel && `paralelo ${x.parallel}`].filter(Boolean).join(", ") },
              { label: "Curso", value: x.curso || (member.semester ? `${member.semester}.º` : null) },
              { label: "Nacimiento", value: x.birthDate ? `${x.birthDate}${age !== null ? ` (${age} años)` : ""}` : null },
              { label: "Nacionalidad", value: x.nationality },
              { label: "Estado civil", value: x.maritalStatus },
              { label: "Residencia", value: [x.parish, x.canton, x.province].filter(Boolean).join(", "), wide: true },
              { label: "Celular", value: member.phone },
              { label: "Teléfono", value: member.landline },
              { label: "Correo personal", value: member.personal_email, wide: true },
              { label: "Discapacidad", value: x.disabilityType ? `${x.disabilityType}, ${x.disabilityDegree ?? "?"} %` : "Ninguna", wide: true },
            ]}
          />
        </View>
      ) : null}
    </Card>
  );
}

export default function Review() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { refresh: refreshMe } = useAuth();
  const { data, error, refreshing, refresh, reload } = useResource(() => api.get<PatDetail>(`/api/v1/registrations/${id}`));
  const [decision, setDecision] = useState<"APPROVED" | "RETURNED" | "">("");
  const [observations, setObservations] = useState("");
  const [fieldError, setFieldError] = useState<string>();
  const [message, setMessage] = useState<{ tone: "success" | "danger"; text: string }>();
  const [busy, setBusy] = useState<string | null>(null);

  if (error && !data) return <EmptyState icon={Eye} title="No se pudo abrir el registro">{error.message}</EmptyState>;
  if (!data) return <Loading />;
  const { registration: r, members, scan } = data;
  const accepted = members.filter((m) => m.status === "ACCEPTED");

  async function decide() {
    if (!decision) {
      setFieldError("Elige aprobar o devolver.");
      return;
    }
    setBusy("decide");
    setFieldError(undefined);
    setMessage(undefined);
    try {
      await api.post(`/api/v1/registrations/${r.id}/review`, { decision, observations });
      void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      setMessage({ tone: "success", text: decision === "APPROVED" ? "Tema aprobado. Ya puedes asignar el tribunal." : "Registro devuelto. Los estudiantes verán tus observaciones." });
      setDecision("");
      setObservations("");
      await Promise.all([reload(), refreshMe()]);
    } catch (caught) {
      if (caught instanceof ApiError) {
        setFieldError(caught.fields.observations?.[0] ?? caught.fields.decision?.[0]);
        if (!caught.fields.observations && !caught.fields.decision) setMessage({ tone: "danger", text: caught.message });
      }
    } finally {
      setBusy(null);
    }
  }

  async function pdf(path: string, name: string, key: string) {
    setBusy(key);
    try {
      await openPdf(path, name, "Formato PAT-04-F-002");
    } catch (caught) {
      setMessage({ tone: "danger", text: caught instanceof ApiError ? caught.message : "No se pudo abrir el documento." });
    } finally {
      setBusy(null);
    }
  }

  return (
    <Screen edges={[]} refreshing={refreshing} onRefresh={refresh}>
      <View style={{ gap: 4 }}>
        <T variant="caption" color={colors.uleam}>
          {r.career}
        </T>
        <T variant="title">{r.members_label}</T>
        <View style={{ flexDirection: "row", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
          <Badge tone={statusTone(r.status)}>{statusLabel(r.status)}</Badge>
          <T variant="small">
            {r.participation_type === "GRUPAL" ? "En pareja" : "Individual"} · enviado {dateTime(r.submitted_at)}
          </T>
        </View>
      </View>

      {message ? <Banner tone={message.tone}>{message.text}</Banner> : null}

      {r.status === "PENDING" ? (
        <Card style={{ gap: 12 }}>
          <T variant="heading">Tu decisión</T>
          <Choice type="radio" tone="success" selected={decision === "APPROVED"} onPress={() => setDecision("APPROVED")} title="Aprobar tema" subtitle="Se crea el proyecto de titulación y pasa a tribunales." />
          <Choice type="radio" tone="danger" selected={decision === "RETURNED"} onPress={() => setDecision("RETURNED")} title="Devolver para corrección" subtitle="Los estudiantes podrán editar y reenviar." />
          <Field label="Observaciones" required={decision === "RETURNED"} hint={decision === "RETURNED" ? "Indica qué deben corregir." : "Opcional al aprobar."} error={fieldError}>
            <Input value={observations} onChangeText={setObservations} multiline maxLength={2000} style={{ minHeight: 110 }} />
          </Field>
          <Button
            title={decision === "RETURNED" ? "Devolver registro" : decision === "APPROVED" ? "Aprobar tema" : "Guardar decisión"}
            icon={decision === "RETURNED" ? Undo2 : CircleCheck}
            variant={decision === "RETURNED" ? "danger" : decision === "APPROVED" ? "success" : "primary"}
            size="lg"
            loading={busy === "decide"}
            onPress={decide}
          />
        </Card>
      ) : (
        <Card style={{ gap: 8 }}>
          <T variant="heading">Decisión registrada</T>
          <T variant="small">
            {r.reviewer_name ?? "Secretaría"} · {dateTime(r.reviewed_at)}
          </T>
          {r.observations ? (
            <View style={{ backgroundColor: colors.canvas, borderRadius: 8, padding: 10 }}>
              <T variant="small" color={colors.ink2}>
                {r.observations}
              </T>
            </View>
          ) : null}
          {r.status === "APPROVED" && !r.has_tribunal ? (
            <Button title="Asignar tribunal" icon={Gavel} onPress={() => router.push({ pathname: "/staff/tribunal-nuevo", params: { registro: String(r.id) } })} />
          ) : null}
        </Card>
      )}

      <Card padded={false}>
        <CardHeader title="Documento" subtitle={scan ? "Formato firmado a mano y escaneado" : "Firma digital de cada integrante"} />
        <View style={{ padding: 16, gap: 8 }}>
          <Button title="Descargar formato PDF" icon={Download} variant="secondary" loading={busy === "pdf"} onPress={() => pdf(`/api/pat/${r.id}/pdf`, `PAT-04-F-002_registro-${r.id}.pdf`, "pdf")} />
          {scan ? <Button title="Ver escaneado" icon={Eye} variant="ghost" loading={busy === "scan"} onPress={() => pdf(`/api/pat/${r.id}/escaneado`, scan.file_name, "scan")} /> : null}
        </View>
      </Card>

      <Card>
        <ProposalSummary registration={r} />
      </Card>

      <T variant="heading">Integrantes</T>
      {accepted.map((member) => (
        <MemberData key={member.id} member={member} signedByScan={Boolean(scan)} />
      ))}
      {members.some((m) => m.status === "INVITED") ? (
        <Card padded={false}>
          <Members members={members.filter((m) => m.status === "INVITED")} />
        </Card>
      ) : null}

      <Card padded={false}>
        <CardHeader title="Historial" />
        <View style={{ padding: 16 }}>
          <Timeline events={data.events} />
        </View>
      </Card>
    </Screen>
  );
}
