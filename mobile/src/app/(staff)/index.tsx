import { RefreshControl, ScrollView, StyleSheet, View, Pressable } from "react-native";
import { router } from "expo-router";
import { CalendarDays, ClipboardCheck, FilePen, Gavel, PencilLine, ThumbsUp, Users } from "lucide-react-native";
import { Hero } from "@/components/hero";
import { useTabBarSpace } from "@/components/floating-tab-bar";
import { Card, ListRow, Loading, SectionTitle, T } from "@/components/ui";
import { useResource } from "@/hooks/use-resource";
import { api } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { dateTime, eventLabels, longDate } from "@/lib/format";
import { colors, elevation, fonts, radius } from "@/lib/theme";
import type { StaffSummary } from "@/lib/types";

export default function StaffHome() {
  const { me, refresh: refreshMe } = useAuth();
  const { data, refreshing, refresh } = useResource(() => api.get<StaffSummary>("/api/v1/staff/summary"));
  const tabSpace = useTabBarSpace();
  if (!me) return null;
  if (!data) return <Loading />;

  const { counts, waitingTribunal } = data;
  const text =
    counts.PENDING > 0
      ? `Tienes ${counts.PENDING} ${counts.PENDING === 1 ? "registro pendiente" : "registros pendientes"} de revisión.`
      : waitingTribunal > 0
        ? `${waitingTribunal} ${waitingTribunal === 1 ? "tema aprobado espera" : "temas aprobados esperan"} su tribunal.`
        : "No hay trámites pendientes. Todo está al día.";
  const action =
    counts.PENDING > 0
      ? { title: "Revisar registros", onPress: () => router.push("/(staff)/bandeja") }
      : waitingTribunal > 0
        ? { title: "Asignar tribunales", onPress: () => router.push("/(staff)/tribunales") }
        : undefined;

  const tiles = [
    { label: "Por revisar", value: counts.PENDING, icon: ClipboardCheck, attention: counts.PENDING > 0, go: "/(staff)/bandeja" as const },
    { label: "Esperan tribunal", value: waitingTribunal, icon: Gavel, attention: waitingTribunal > 0, go: "/(staff)/tribunales" as const },
    { label: "Aprobados", value: counts.APPROVED, icon: ThumbsUp, go: "/(staff)/bandeja" as const },
    { label: "En preparación", value: counts.DRAFT, icon: PencilLine, go: "/(staff)/bandeja" as const },
  ];

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: colors.canvas }}
      contentContainerStyle={{ paddingBottom: tabSpace }}
      showsVerticalScrollIndicator={false}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => void Promise.all([refresh(), refreshMe()])} tintColor="#fff" />}
    >
      <Hero
        name={me.user.name.split(" ")[0]}
        fullName={`${me.user.name} ${me.user.lastname}`}
        accountHref="/(staff)/cuenta"
        nextLabel="Pendientes de hoy"
        text={text}
        action={action}
      />
      <View style={{ padding: 20, gap: 18 }}>
        <View style={s.tiles}>
          {tiles.map((tile) => {
            const Icon = tile.icon;
            return (
              <Pressable
                key={tile.label}
                style={({ pressed }) => [s.tile, tile.attention && s.tileAttention, pressed && { transform: [{ scale: 0.97 }] }]}
                onPress={() => router.push(tile.go)}
                accessibilityRole="button"
                accessibilityLabel={`${tile.label}: ${tile.value}`}
              >
                <View style={[s.tileIcon, tile.attention && { backgroundColor: colors.ochre }]}>
                  <Icon color={tile.attention ? colors.harbor900 : colors.uleam} size={18} />
                </View>
                <T style={[s.tileValue, tile.attention && { color: colors.ochre700 }]}>{String(tile.value)}</T>
                <T variant="small" color={colors.ink2}>
                  {tile.label}
                </T>
              </Pressable>
            );
          })}
        </View>

        <SectionTitle caption="Los más antiguos primero">Por revisar</SectionTitle>
        <Card padded={false}>
          {data.pending.length === 0 ? (
            <View style={{ padding: 16 }}>
              <T variant="small">No hay registros pendientes.</T>
            </View>
          ) : (
            data.pending.map((row, index) => (
              <ListRow
                key={row.id}
                icon={row.member_count > 1 ? Users : FilePen}
                title={row.members_label}
                subtitle={`${row.career} · ${dateTime(row.submitted_at)}`}
                onPress={() => router.push(`/staff/revision/${row.id}`)}
                last={index === data.pending.length - 1}
              />
            ))
          )}
        </Card>

        <SectionTitle>Próximas defensas</SectionTitle>
        <Card padded={false}>
          {data.upcoming.length === 0 ? (
            <View style={{ padding: 16 }}>
              <T variant="small">No hay defensas programadas.</T>
            </View>
          ) : (
            data.upcoming.map((row, index) => (
              <View key={row.id} style={[s.defenseRow, index > 0 && s.rowBorder]}>
                <View style={s.dateChip}>
                  <CalendarDays color={colors.uleam} size={18} />
                </View>
                <View style={{ flex: 1, gap: 2 }}>
                  <T variant="label" color={colors.ink}>
                    {row.student_name}
                  </T>
                  <T variant="small" color={colors.uleam} weight="semibold">
                    {longDate(row.defense_date)}, {row.defense_time}
                  </T>
                  <T variant="small">{row.place}</T>
                </View>
              </View>
            ))
          )}
        </Card>

        <SectionTitle>Actividad reciente</SectionTitle>
        <Card padded={false}>
          {data.activity.length === 0 ? (
            <View style={{ padding: 16 }}>
              <T variant="small">Aún no hay movimientos.</T>
            </View>
          ) : (
            data.activity.map((event, index) => (
              <Pressable
                key={event.id}
                onPress={() => router.push(`/staff/revision/${event.registration_id}`)}
                style={({ pressed }) => [s.defense, index > 0 && s.rowBorder, pressed && { backgroundColor: colors.uleam50 }]}
              >
                <T variant="body" style={{ fontSize: 14 }}>
                  <T variant="body" weight="semibold" style={{ fontSize: 14 }}>
                    {event.actor_name ?? "Sistema"}
                  </T>{" "}
                  {eventLabels[event.type] ?? event.type}
                </T>
                <T variant="small" numberOfLines={1}>
                  «{event.title}» · {dateTime(event.created_at)}
                </T>
              </Pressable>
            ))
          )}
        </Card>
      </View>
    </ScrollView>
  );
}

const s = StyleSheet.create({
  tiles: { flexDirection: "row", flexWrap: "wrap", justifyContent: "space-between", rowGap: 12 },
  tile: { width: "48.3%", padding: 16, gap: 2, borderRadius: radius.lg, backgroundColor: colors.surface, ...elevation.low },
  tileAttention: { backgroundColor: colors.ochre50 },
  tileIcon: { width: 34, height: 34, borderRadius: 11, backgroundColor: colors.uleam50, alignItems: "center", justifyContent: "center", marginBottom: 10 },
  tileValue: { fontFamily: fonts.extrabold, fontSize: 30, lineHeight: 34, color: colors.ink, letterSpacing: -0.8 },
  defense: { paddingHorizontal: 16, paddingVertical: 14, gap: 2 },
  defenseRow: { flexDirection: "row", alignItems: "center", gap: 14, paddingHorizontal: 16, paddingVertical: 14 },
  dateChip: { width: 42, height: 42, borderRadius: 13, backgroundColor: colors.uleam50, alignItems: "center", justifyContent: "center" },
  rowBorder: { borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: colors.lineStrong },
});
