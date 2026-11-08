import { useEffect } from "react";
import { View } from "react-native";
import { router } from "expo-router";
import { Save } from "lucide-react-native";
import { FormScreen } from "@/components/form-screen";
import { FormError } from "@/components/pat-forms";
import { Button, Card, Field, Input, Loading, Select, T } from "@/components/ui";
import { useForm } from "@/hooks/use-form";
import { api } from "@/lib/api";
import { useAuth } from "@/lib/auth";

export default function EditProfile() {
  const { me, refresh } = useAuth();
  const form = useForm();
  const student = me?.student;
  const { setValues } = form;

  useEffect(() => {
    if (!student) return;
    setValues({
      cedula: student.cedula ?? "",
      name: student.name,
      lastname: student.lastname,
      sex: student.sex ?? "",
      personalEmail: student.personal_email ?? "",
      address: student.address ?? "",
      landline: student.landline ?? "",
      phone: student.phone ?? "",
      curriculumChanges: student.curriculum_changes?.toString() ?? "",
    });
    // Solo al abrir la pantalla.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [student?.id]);

  if (!student) return <Loading />;
  if (!form.values.name) return <Loading />;
  const e = (name: string) => form.errors[name]?.[0];

  return (
    <FormScreen
      footer={
        <Button
          title="Guardar cambios"
          icon={Save}
          size="lg"
          loading={form.submitting}
          onPress={async () => {
            if (await form.submit((values) => api.put("/api/v1/me/profile", values))) {
              await refresh();
              router.back();
            }
          }}
        />
      }
    >
      <T variant="small">Estos datos aparecen en el formato oficial. Tu carrera y semestre los registra secretaría.</T>
      <FormError message={form.message} />
      <Card style={{ gap: 16 }}>
        <Field label="Correo institucional" hint="Es tu cuenta de acceso; solo secretaría puede cambiarlo.">
          <Input value={student.email} editable={false} />
        </Field>
        <Field label="Cédula" required error={e("cedula")}>
          <Input value={form.values.cedula} onChangeText={(v) => form.set("cedula", v.replace(/\D/g, ""))} keyboardType="number-pad" maxLength={10} invalid={Boolean(e("cedula"))} />
        </Field>
        <Field label="Nombres" required error={e("name")}>
          <Input value={form.values.name} onChangeText={(v) => form.set("name", v)} autoComplete="given-name" invalid={Boolean(e("name"))} />
        </Field>
        <Field label="Apellidos" required error={e("lastname")}>
          <Input value={form.values.lastname} onChangeText={(v) => form.set("lastname", v)} autoComplete="family-name" invalid={Boolean(e("lastname"))} />
        </Field>
        <Field label="Sexo" required error={e("sex")}>
          <Select title="Sexo" value={form.values.sex} options={[{ value: "MASCULINO", label: "Masculino" }, { value: "FEMENINO", label: "Femenino" }]} onChange={(v) => form.set("sex", v)} invalid={Boolean(e("sex"))} />
        </Field>
        <Field label="Correo personal" required error={e("personalEmail")}>
          <Input value={form.values.personalEmail} onChangeText={(v) => form.set("personalEmail", v)} keyboardType="email-address" autoCapitalize="none" invalid={Boolean(e("personalEmail"))} />
        </Field>
        <Field label="Domicilio" required error={e("address")}>
          <Input value={form.values.address} onChangeText={(v) => form.set("address", v)} autoComplete="street-address" invalid={Boolean(e("address"))} />
        </Field>
        <View style={{ flexDirection: "row", gap: 10 }}>
          <View style={{ flex: 1 }}>
            <Field label="Celular" required error={e("phone")}>
              <Input value={form.values.phone} onChangeText={(v) => form.set("phone", v.replace(/\D/g, ""))} keyboardType="phone-pad" maxLength={10} placeholder="09XXXXXXXX" invalid={Boolean(e("phone"))} />
            </Field>
          </View>
          <View style={{ flex: 1 }}>
            <Field label="Teléfono" required error={e("landline")}>
              <Input value={form.values.landline} onChangeText={(v) => form.set("landline", v.replace(/\D/g, ""))} keyboardType="phone-pad" maxLength={10} invalid={Boolean(e("landline"))} />
            </Field>
          </View>
        </View>
        <Field label="Número de cambio de malla" hint="Opcional." error={e("curriculumChanges")}>
          <Input value={form.values.curriculumChanges} onChangeText={(v) => form.set("curriculumChanges", v.replace(/\D/g, ""))} keyboardType="number-pad" maxLength={2} />
        </Field>
      </Card>
    </FormScreen>
  );
}
