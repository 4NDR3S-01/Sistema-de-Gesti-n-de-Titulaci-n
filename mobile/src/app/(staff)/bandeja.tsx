import { useEffect, useRef, useState } from "react";
import { Pressable, ScrollView, Text, View } from "react-native";
import { router } from "expo-router";
import { ClipboardCheck, FilePen, Search, Users } from "lucide-react-native";
import { Badge, Card, EmptyState, Input, ListRow, Loading, PageHeader, Screen } from "@/components/ui";
import { useResource } from "@/hooks/use-resource";
import { api } from "@/lib/api";
import { dateTime, statusLabel, statusTone } from "@/lib/format";
import { colors, fonts, radius } from "@/lib/theme";
import type { PatStatus, Registration } from "@/lib/types";

type Inbox = { rows: Registration[]; total: number; counts: Record<PatStatus, number> };
const tabs: { value: string; label: string }[] = [
  { value: "PENDING", label: "Por revisar" },
  { value: "RETURNED", label: "Devueltos" },
  { value: "APPROVED", label: "Aprobados" },
  { value: "todos", label: "Todos" },
];

export default function Bandeja() {
  const [status, setStatus] = useState("PENDING");
  const [query, setQuery] = useState("");
  const [submitted, setSubmitted] = useState("");
  const { data, refreshing, refresh, reload } = useResource(() =>
    api.get<Inbox>(`/api/v1/registrations?estado=${status === "todos" ? "" : status}&q=${encodeURIComponent(submitted)}`),
  );
  // Recarga al cambiar de pestaña o búsqueda (la carga inicial la hace el foco).
  const first = useRef(true);
  useEffect(() => {
    if (first.current) {
      first.current = false;
      return;
    }
    void reload();
  }, [status, submitted, reload]);

  const count = (value: string) =>
    data ? (value === "todos" ? data.counts.PENDING + data.counts.RETURNED + data.counts.APPROVED : data.counts[value as PatStatus]) : 0;

  return (
    <Screen tabbed refreshing={refreshing} onRefresh={refresh}>
      <PageHeader overline="Secretaría" title="Aprobación de temas" />

      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8 }}>
        {tabs.map((tab) => {
          const active = status === tab.value;
          return (
            <Pressable
              key={tab.value}
              onPress={() => setStatus(tab.value)}
              accessibilityRole="tab"
              accessibilityState={{ selected: active }}
              style={{
                flexDirection: "row",
                alignItems: "center",
                gap: 6,
                paddingHorizontal: 14,
                paddingVertical: 9,
                borderRadius: radius.pill,
                backgroundColor: active ? colors.uleam : colors.surface,
                borderWidth: 1,
                borderColor: active ? colors.uleam : colors.line,
              }}
            >
              <Text style={{ fontFamily: fonts.semibold, fontSize: 14, color: active ? "#fff" : colors.ink2 }}>{tab.label}</Text>
              <Text style={{ fontFamily: fonts.bold, fontSize: 12, color: active ? "rgba(255,255,255,0.8)" : colors.muted }}>{count(tab.value)}</Text>
            </Pressable>
          );
        })}
      </ScrollView>

      <View>
        <View style={{ position: "absolute", left: 14, top: 0, bottom: 0, justifyContent: "center", zIndex: 1 }} pointerEvents="none">
          <Search color={colors.faint} size={18} />
        </View>
        <Input
          value={query}
          onChangeText={setQuery}
          onSubmitEditing={() => setSubmitted(query.trim())}
          returnKeyType="search"
          placeholder="Estudiante, cédula o título"
          style={{ paddingLeft: 42 }}
          accessibilityLabel="Buscar registro"
        />
      </View>

      {!data ? (
        <Loading />
      ) : data.rows.length === 0 ? (
        <EmptyState icon={ClipboardCheck} title={submitted ? "Sin resultados" : status === "PENDING" ? "No hay registros por revisar" : "No hay registros"}>
          {submitted ? "Ningún registro coincide con la búsqueda." : status === "PENDING" ? "Cuando un estudiante envíe su tema aparecerá aquí." : "Todavía no hay registros en este estado."}
        </EmptyState>
      ) : (
        <Card padded={false}>
          {data.rows.map((row, index) => (
            <ListRow
              key={row.id}
              icon={row.member_count > 1 ? Users : FilePen}
              title={row.members_label}
              subtitle={`${row.title}\n${row.career} · ${dateTime(row.submitted_at)}`}
              right={<Badge tone={statusTone(row.status)}>{statusLabel(row.status)}</Badge>}
              onPress={() => router.push(`/staff/revision/${row.id}`)}
              last={index === data.rows.length - 1}
            />
          ))}
        </Card>
      )}
    </Screen>
  );
}
