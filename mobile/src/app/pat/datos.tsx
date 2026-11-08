import { useEffect } from "react";
import { router } from "expo-router";
import { Save } from "lucide-react-native";
import { FormScreen } from "@/components/form-screen";
import { FormError, PersonalFields } from "@/components/pat-forms";
import { Banner, Button, Card, Loading, T } from "@/components/ui";
import { useCatalog } from "@/hooks/use-catalog";
import { useForm } from "@/hooks/use-form";
import { useResource } from "@/hooks/use-resource";
import { api } from "@/lib/api";
import type { StudentPat } from "@/lib/types";

export default function EditPersonal() {
  const catalog = useCatalog();
  const { data } = useResource(() => api.get<StudentPat>("/api/v1/pat"));
  const form = useForm();
  const full = data && data.registration && "members" in data ? data : null;
  const me = full?.members.find((m) => m.student_id === full.me.studentId);
  const { setValues } = form;

  useEffect(() => {
    if (!me) return;
    const values: Record<string, string> = { nationality: "Ecuatoriana", province: "Manabí" };
    for (const [key, value] of Object.entries(me.extra_data ?? {})) if (typeof value === "string") values[key] = value;
    setValues(values);
    // Solo al cargar el registro.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [me?.id]);

  if (!catalog || !me || !form.values.nationality) return <Loading />;

  return (
    <FormScreen
      footer={
        <Button
          title="Guardar mis datos"
          icon={Save}
          size="lg"
          loading={form.submitting}
          onPress={async () => {
            if (await form.submit((values) => api.put("/api/v1/pat/personal", values))) router.back();
          }}
        />
      }
    >
      <T variant="small">Aparecen en tu página del formato PAT-04-F-002. Tus datos de contacto se editan en Cuenta › Mis datos personales.</T>
      {me.signature || full?.scan ? <Banner tone="warning">Al guardar cambios tu firma se borrará y deberás firmar de nuevo.</Banner> : null}
      <FormError message={form.message} />
      <Card>
        <PersonalFields catalog={catalog} values={form.values} set={form.set} errors={form.errors} />
      </Card>
    </FormScreen>
  );
}
