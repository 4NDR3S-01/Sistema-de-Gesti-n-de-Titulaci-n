import { useState } from "react";
import { router } from "expo-router";
import { KeyRound } from "lucide-react-native";
import { FormScreen } from "@/components/form-screen";
import { FormError } from "@/components/pat-forms";
import { Banner, Button, Card, Field, Input, T } from "@/components/ui";
import { useForm } from "@/hooks/use-form";
import { api } from "@/lib/api";

export default function ChangePassword() {
  const form = useForm({ currentPassword: "", newPassword: "", confirmPassword: "" });
  const [done, setDone] = useState(false);
  const e = (name: string) => form.errors[name]?.[0];

  return (
    <FormScreen
      footer={
        done ? (
          <Button title="Volver" size="lg" onPress={() => router.back()} />
        ) : (
          <Button
            title="Cambiar contraseña"
            icon={KeyRound}
            size="lg"
            loading={form.submitting}
            onPress={async () => {
              if (await form.submit((values) => api.post("/api/v1/me/password", values))) setDone(true);
            }}
          />
        )
      }
    >
      <T variant="small">Mínimo 8 caracteres, combinando letras y números. No la compartas con nadie.</T>
      {done ? <Banner tone="success" title="Contraseña actualizada">Úsala la próxima vez que inicies sesión, en la app o en la web.</Banner> : null}
      <FormError message={done ? undefined : form.message} />
      <Card style={{ gap: 16 }}>
        <Field label="Contraseña actual" required error={e("currentPassword")}>
          <Input value={form.values.currentPassword} onChangeText={(v) => form.set("currentPassword", v)} secureTextEntry autoComplete="current-password" invalid={Boolean(e("currentPassword"))} />
        </Field>
        <Field label="Nueva contraseña" required error={e("newPassword")}>
          <Input value={form.values.newPassword} onChangeText={(v) => form.set("newPassword", v)} secureTextEntry autoComplete="new-password" invalid={Boolean(e("newPassword"))} />
        </Field>
        <Field label="Repite la nueva contraseña" required error={e("confirmPassword")}>
          <Input value={form.values.confirmPassword} onChangeText={(v) => form.set("confirmPassword", v)} secureTextEntry autoComplete="new-password" invalid={Boolean(e("confirmPassword"))} />
        </Field>
      </Card>
    </FormScreen>
  );
}
