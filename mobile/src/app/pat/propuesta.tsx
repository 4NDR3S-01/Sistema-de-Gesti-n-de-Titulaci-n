import { useEffect } from "react";
import { router } from "expo-router";
import { Save } from "lucide-react-native";
import { FormScreen } from "@/components/form-screen";
import { FormError, ProposalFields } from "@/components/pat-forms";
import { Banner, Button, Card, Loading } from "@/components/ui";
import { useCatalog } from "@/hooks/use-catalog";
import { useForm } from "@/hooks/use-form";
import { useResource } from "@/hooks/use-resource";
import { api } from "@/lib/api";
import type { StudentPat } from "@/lib/types";

export default function EditProposal() {
  const catalog = useCatalog();
  const { data } = useResource(() => api.get<StudentPat>("/api/v1/pat"));
  const form = useForm();
  const full = data && data.registration && "members" in data ? data : null;
  const { setValues } = form;

  useEffect(() => {
    if (!full) return;
    const r = full.registration;
    setValues({
      modality: r.modality,
      participationType: r.participation_type,
      presentationMechanism: r.presentation_mechanism,
      requestedTutor: r.requested_tutor ?? "",
      title: r.title,
      problem: r.problem,
      articulations: r.articulations.join(","),
    });
    // Solo al cargar el registro.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [full?.registration.id]);

  if (!catalog || !full || !form.values.modality) return <Loading />;
  const signed = full.members.some((m) => m.signature) || Boolean(full.scan);

  return (
    <FormScreen
      footer={
        <Button
          title="Guardar propuesta"
          icon={Save}
          size="lg"
          loading={form.submitting}
          onPress={async () => {
            const ok = await form.submit((values) =>
              api.put("/api/v1/pat/proposal", { ...values, articulations: (values.articulations ?? "").split(",").filter(Boolean) }),
            );
            if (ok) router.back();
          }}
        />
      }
    >
      {signed ? <Banner tone="warning">Al guardar cambios se anularán las firmas y el escaneado: todos deberán firmar de nuevo.</Banner> : null}
      <FormError message={form.message} />
      <Card>
        <ProposalFields
          catalog={catalog}
          values={form.values}
          set={form.set}
          errors={form.errors}
          warnGroupChange={full.members.some((m) => m.role === "MEMBER")}
        />
      </Card>
    </FormScreen>
  );
}
