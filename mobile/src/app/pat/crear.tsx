import { router } from "expo-router";
import { Save } from "lucide-react-native";
import { FormScreen } from "@/components/form-screen";
import { FormError, PersonalFields, ProposalFields } from "@/components/pat-forms";
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
  const { refresh } = useAuth();
  const form = useForm({ participationType: "INDIVIDUAL", nationality: "Ecuatoriana", province: "Manabí" });

  if (!catalog) return <Loading />;

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
        <T variant="small">Datos del formato oficial que no están en tu ficha. Cada integrante completa los suyos.</T>
        <PersonalFields catalog={catalog} values={form.values} set={form.set} errors={form.errors} />
      </Card>
    </FormScreen>
  );
}
