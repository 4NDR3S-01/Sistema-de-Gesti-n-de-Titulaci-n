import { useEffect, useState } from "react";
import { router } from "expo-router";
import { Save } from "lucide-react-native";
import { FormScreen } from "@/components/form-screen";
import { CedulaScanner, FormError, PersonalFields, ProposalFields } from "@/components/pat-forms";
import { Button, Card, Loading, T } from "@/components/ui";
import { useCatalog } from "@/hooks/use-catalog";
import { useForm } from "@/hooks/use-form";
import { api } from "@/lib/api";
import { useAuth } from "@/lib/auth";

const toPayload = (values: Record<string, string>) => ({
  ...values,
  articulations: (values.articulations ?? "").split(",").filter(Boolean),
});

export default function CreatePat() {
  const catalog = useCatalog();
  const { me, refresh } = useAuth();
  const form = useForm({ participationType: "INDIVIDUAL", nationality: "Ecuatoriana", province: "Manabí" });
  const [prefilled, setPrefilled] = useState(false);
  const { setValues } = form;

  // Prellena los datos informativos con lo que el sistema ya sabe (ficha y registros anteriores).
  useEffect(() => {
    api
      .get<Record<string, string>>("/api/v1/pat/personal")
      .then((defaults) => setValues((current) => ({ ...current, ...defaults })))
      .catch(() => undefined)
      .finally(() => setPrefilled(true));
  }, [setValues]);

  if (!catalog || !prefilled) return <Loading />;

  return (
    <FormScreen
      footer={
        <Button
          title="Guardar borrador"
          icon={Save}
          size="lg"
          loading={form.submitting}
          onPress={async () => {
            if (await form.submit((values) => api.post("/api/v1/pat", toPayload(values)))) {
              await refresh();
              router.replace("/(student)/registro");
            }
          }}
        />
      }
    >
      <T variant="small">Se guarda como borrador: aún no llega a secretaría. Después agregarás integrantes (si aplica) y firmarás.</T>
      <FormError message={form.message} />
      <Card style={{ gap: 14 }}>
        <T variant="heading">Propuesta</T>
        <ProposalFields catalog={catalog} values={form.values} set={form.set} errors={form.errors} />
      </Card>
      <Card style={{ gap: 14 }}>
        <T variant="heading">Tus datos informativos</T>
        <T variant="small">Datos del formato oficial. Llenamos lo que ya conocemos de tu ficha; revisa y completa el resto. Cada integrante completa los suyos.</T>
        <CedulaScanner expectedCedula={me?.student?.cedula} onData={(data) => Object.entries(data).forEach(([k, v]) => v && form.set(k, v))} />
        <PersonalFields catalog={catalog} values={form.values} set={form.set} errors={form.errors} />
      </Card>
    </FormScreen>
  );
}
