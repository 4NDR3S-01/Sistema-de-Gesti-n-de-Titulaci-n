import { useEffect } from "react";
import { router, useLocalSearchParams } from "expo-router";
import { Gavel } from "lucide-react-native";
import { FormScreen } from "@/components/form-screen";
import { FormError } from "@/components/pat-forms";
import { Button, Card, Choice, DateField, Field, Input, Loading, Select, T } from "@/components/ui";
import { useForm } from "@/hooks/use-form";
import { useResource } from "@/hooks/use-resource";
import { api } from "@/lib/api";
import type { Candidate, Tribunal } from "@/lib/types";

const checks = [
  ["confirmPresident", "La presidencia corresponde al decano/a o a su delegado/a."],
  ["confirmMembers", "Los dos docentes son de la carrera y tienen título de cuarto nivel."],
  ["confirmTutor", "El tutor/a consta solo como observador/a, no como evaluador/a."],
] as const;

export default function NewTribunal() {
  const { registro } = useLocalSearchParams<{ registro?: string }>();
  const { data } = useResource(() => api.get<{ tribunals: Tribunal[]; candidates: Candidate[] }>("/api/v1/tribunals"));
  const form = useForm({ registrationId: registro ?? "" });
  const candidate = data?.candidates.find((c) => String(c.registration_id) === form.values.registrationId);
  const { set } = form;

  useEffect(() => {
    if (candidate?.requested_tutor && !form.values.tutor) set("tutor", candidate.requested_tutor);
    // Precarga el tutor sugerido al elegir estudiante.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [candidate?.registration_id]);

  if (!data) return <Loading />;
  const e = (name: string) => form.errors[name]?.[0];
  const tomorrow = new Date();

  return (
    <FormScreen
      footer={
        <Button
          title="Asignar tribunal"
          icon={Gavel}
          size="lg"
          loading={form.submitting}
          onPress={async () => {
            const ok = await form.submit((values) =>
              api.post("/api/v1/tribunals", {
                ...values,
                confirmPresident: values.confirmPresident === "1",
                confirmMembers: values.confirmMembers === "1",
                confirmTutor: values.confirmTutor === "1",
              }),
            );
            if (ok) router.back();
          }}
        />
      }
    >
      <FormError message={form.message} />
      <Card style={{ gap: 16 }}>
        <T variant="heading">Defensa</T>
        <Field label="Estudiante(s)" required error={e("registrationId")}>
          <Select
            title="Tema aprobado"
            value={form.values.registrationId}
            options={data.candidates.map((c) => ({ value: String(c.registration_id), label: `${c.student_name} · ${c.career}` }))}
            onChange={(v) => form.set("registrationId", v)}
            placeholder={data.candidates.length ? "Selecciona un tema aprobado" : "No hay temas esperando tribunal"}
            invalid={Boolean(e("registrationId"))}
          />
        </Field>
        {candidate ? <T variant="small">Tema: {candidate.title}</T> : null}
        <Field label="Fecha" required error={e("defenseDate")}>
          <DateField value={form.values.defenseDate ?? ""} onChange={(v) => form.set("defenseDate", v)} minimumDate={tomorrow} invalid={Boolean(e("defenseDate"))} />
        </Field>
        <Field label="Hora" required error={e("defenseTime")}>
          <DateField mode="time" value={form.values.defenseTime ?? ""} onChange={(v) => form.set("defenseTime", v)} invalid={Boolean(e("defenseTime"))} />
        </Field>
        <Field label="Lugar" required error={e("place")}>
          <Input value={form.values.place ?? ""} onChangeText={(v) => form.set("place", v)} placeholder="Ej. Auditorio FACCI, edificio B01" invalid={Boolean(e("place"))} />
        </Field>
      </Card>
      <Card style={{ gap: 16 }}>
        <T variant="heading">Integrantes</T>
        <T variant="small">Tres personas distintas: quien preside y dos docentes de la carrera. El tutor/a asiste como observador/a.</T>
        <Field label="Presidencia" required hint="Decano/a o su delegado/a." error={e("president")}>
          <Input value={form.values.president ?? ""} onChangeText={(v) => form.set("president", v)} invalid={Boolean(e("president"))} />
        </Field>
        <Field label="Docente evaluador 1" required error={e("memberOne")}>
          <Input value={form.values.memberOne ?? ""} onChangeText={(v) => form.set("memberOne", v)} invalid={Boolean(e("memberOne"))} />
        </Field>
        <Field label="Docente evaluador 2" required error={e("memberTwo")}>
          <Input value={form.values.memberTwo ?? ""} onChangeText={(v) => form.set("memberTwo", v)} invalid={Boolean(e("memberTwo"))} />
        </Field>
        <Field label="Tutor/a (observador/a)" required error={e("tutor")} hint={candidate?.requested_tutor ? `Sugerido por los estudiantes: ${candidate.requested_tutor}.` : undefined}>
          <Input value={form.values.tutor ?? ""} onChangeText={(v) => form.set("tutor", v)} invalid={Boolean(e("tutor"))} />
        </Field>
        {checks.map(([name, text]) => (
          <Choice key={name} selected={form.values[name] === "1"} onPress={() => form.set(name, form.values[name] === "1" ? "" : "1")} title={text} subtitle={e(name)} />
        ))}
      </Card>
    </FormScreen>
  );
}
