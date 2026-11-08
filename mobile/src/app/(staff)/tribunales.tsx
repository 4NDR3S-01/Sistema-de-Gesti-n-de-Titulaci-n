import { useState } from "react";
import { Alert, View } from "react-native";
import { router } from "expo-router";
import { CalendarDays, Gavel, Trash2 } from "lucide-react-native";
import { Banner, Button, Card, CardHeader, EmptyState, Loading, PageHeader, Screen, T } from "@/components/ui";
import { useResource } from "@/hooks/use-resource";
import { api, ApiError } from "@/lib/api";
import { longDate, todayIso } from "@/lib/format";
import { colors } from "@/lib/theme";
import type { Candidate, Tribunal } from "@/lib/types";

export default function Tribunales() {
  const { data, refreshing, refresh, reload } = useResource(() => api.get<{ tribunals: Tribunal[]; candidates: Candidate[] }>("/api/v1/tribunals"));
  const [error, setError] = useState("");
  if (!data) return <Loading />;
  const today = todayIso();

  function remove(row: Tribunal) {
    Alert.alert("Eliminar convocatoria", `¿Eliminar la convocatoria de ${row.student_name}? Podrás asignarla de nuevo.`, [
      { text: "Cancelar", style: "cancel" },
      {
        text: "Eliminar",
        style: "destructive",
        onPress: async () => {
          try {
            await api.del(`/api/v1/tribunals/${row.id}`);
            await reload();
          } catch (caught) {
            setError(caught instanceof ApiError ? caught.message : "No se pudo eliminar.");
          }
        },
      },
    ]);
  }

  return (
    <Screen tabbed refreshing={refreshing} onRefresh={refresh}>
      <PageHeader overline="Secretaría" title="Tribunales de defensa" />
      {error ? <Banner tone="danger">{error}</Banner> : null}

      <Card padded={false}>
        <CardHeader title="Esperan tribunal" subtitle="Temas aprobados sin convocatoria" />
        {data.candidates.length === 0 ? (
          <View style={{ padding: 16 }}>
            <T variant="small">No hay temas esperando tribunal.</T>
          </View>
        ) : (
          data.candidates.map((row, index) => (
            <View key={row.registration_id} style={{ padding: 16, gap: 8, borderTopWidth: index ? 1 : 0, borderTopColor: colors.line }}>
              <T variant="label" color={colors.ink}>
                {row.student_name}
              </T>
              <T variant="small" numberOfLines={2}>
                {row.title}
              </T>
              <Button
                title="Asignar tribunal"
                icon={Gavel}
                size="sm"
                style={{ alignSelf: "flex-start" }}
                onPress={() => router.push({ pathname: "/staff/tribunal-nuevo", params: { registro: String(row.registration_id) } })}
              />
            </View>
          ))
        )}
      </Card>

      <Card padded={false}>
        <CardHeader title="Convocatorias" right={<T variant="small">{String(data.tribunals.length)}</T>} />
        {data.tribunals.length === 0 ? (
          <EmptyState icon={CalendarDays} title="Sin convocatorias">
            Las defensas que programes aparecerán aquí ordenadas por fecha.
          </EmptyState>
        ) : (
          data.tribunals.map((row, index) => (
            <View key={row.id} style={{ padding: 16, gap: 4, borderTopWidth: index ? 1 : 0, borderTopColor: colors.line, opacity: row.defense_date < today ? 0.6 : 1 }}>
              <View style={{ flexDirection: "row", alignItems: "flex-start", gap: 8 }}>
                <View style={{ flex: 1, gap: 2 }}>
                  <T variant="label" color={colors.ink}>
                    {row.student_name}
                  </T>
                  <T variant="small" color={colors.uleam} weight="semibold">
                    {longDate(row.defense_date)}, {row.defense_time}
                  </T>
                  <T variant="small">{row.place}</T>
                </View>
                <Button title="" accessibilityLabel={`Eliminar convocatoria de ${row.student_name}`} icon={Trash2} variant="ghost" size="sm" onPress={() => remove(row)} />
              </View>
              <T variant="small">
                Preside: {row.president}. Evaluadores: {row.member_one}; {row.member_two}. Observador/a: {row.tutor}.
              </T>
            </View>
          ))
        )}
      </Card>
    </Screen>
  );
}
