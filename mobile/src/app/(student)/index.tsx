import { useCallback, useState } from "react";
import { Pressable, RefreshControl, ScrollView, StyleSheet, View } from "react-native";
import { router, useFocusEffect } from "expo-router";
import { ChevronRight, FilePen, LifeBuoy, MailOpen } from "lucide-react-native";
import { Hero } from "@/components/hero";
import { Defense, Journey, Members } from "@/components/pat";
import { useTabBarSpace } from "@/components/floating-tab-bar";
import { Badge, Banner, Card, Loading, SectionTitle, T } from "@/components/ui";
import { api } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { statusLabel, statusTone } from "@/lib/format";
import { studentJourney } from "@/lib/journey";
import { colors, radius } from "@/lib/theme";
import type { StudentPat } from "@/lib/types";

export default function StudentHome() {
  const { me, refresh: refreshMe } = useAuth();
  const [pat, setPat] = useState<StudentPat | null>(null);
  const [loaded, setLoaded] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const tabSpace = useTabBarSpace();

  const load = useCallback(async () => {
    try {
      const [data] = await Promise.all([api.get<StudentPat>("/api/v1/pat"), refreshMe()]);
      setPat(data);
    } catch {
      setPat(null);
    } finally {
      setLoaded(true);
    }
  }, [refreshMe]);

  useFocusEffect(
    useCallback(() => {
      void load();
    }, [load]),
  );

  if (!me) return null;
  if (!loaded) return <Loading />;

  const student = me.student;
  const { steps, next } = studentJourney(student, pat);
  const full = pat && pat.registration && "members" in pat ? pat : null;
  const r = full?.registration;
  const invited = full?.membership.status === "INVITED";
  const leader = full?.members.find((m) => m.role === "LEADER");

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: colors.canvas }}
      contentContainerStyle={{ paddingBottom: tabSpace }}
      showsVerticalScrollIndicator={false}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={async () => {
            setRefreshing(true);
            await load();
            setRefreshing(false);
          }}
          tintColor="#fff"
        />
      }
    >
      <Hero
        name={me.user.name.split(" ")[0]}
        fullName={`${me.user.name} ${me.user.lastname}`}
        accountHref="/(student)/cuenta"
        text={next.text}
        action={{ title: next.action, onPress: () => router.push(next.route) }}
        progress={{ done: steps.filter((step) => step.state === "done").length, total: steps.length }}
      />

      <View style={{ padding: 20, gap: 18 }}>
        {!student ? (
          <Banner tone="warning" title="Tu perfil académico aún no está registrado">
            Pide a la secretaría académica de tu facultad que registre tus datos de estudiante.
          </Banner>
        ) : null}

        {invited && leader ? (
          <Pressable style={s.invite} onPress={() => router.push("/(student)/registro")} accessibilityRole="button">
            <MailOpen color={colors.ochre700} size={24} />
            <View style={{ flex: 1 }}>
              <T variant="label" color={colors.ink}>
                {leader.name} {leader.lastname} te invitó a su trabajo en pareja
              </T>
              <T variant="small" numberOfLines={2}>
                «{r?.title}»
              </T>
            </View>
            <ChevronRight color={colors.ochre700} size={20} />
          </Pressable>
        ) : null}

        {r?.status === "RETURNED" && !invited ? (
          <Banner tone="danger" title="El registro fue devuelto con observaciones">
            {r.observations ?? "Revisa las observaciones de secretaría."}
          </Banner>
        ) : null}

        <SectionTitle right={r && !invited ? <Badge tone={statusTone(r.status)}>{statusLabel(r.status)}</Badge> : undefined}>Mi tema</SectionTitle>
        <Card padded={false}>
          {r && !invited ? (
            <>
              <Pressable
                style={({ pressed }) => [s.topic, pressed && { backgroundColor: colors.uleam50 }]}
                onPress={() => router.push("/(student)/registro")}
                accessibilityRole="button"
              >
                <View style={{ flex: 1, gap: 6 }}>
                  <T variant="heading" style={{ fontSize: 16, lineHeight: 22 }}>
                    {r.title}
                  </T>
                  <T variant="small">{r.modality}</T>
                </View>
                <ChevronRight color={colors.faint} size={20} />
              </Pressable>
              {full!.members.length > 1 ? <Members members={full!.members} youStudentId={full!.me.studentId} signedByScan={Boolean(full!.scan)} /> : null}
            </>
          ) : (
            <View style={{ padding: 16, gap: 12 }}>
              <T variant="small">
                {invited
                  ? "Responde la invitación para unirte al tema propuesto o crear el tuyo."
                  : "Aún no registras tu tema. Puedes hacerlo solo/a o en pareja con un compañero/a de tu carrera."}
              </T>
              {!invited && student ? (
                <Pressable style={s.cta} onPress={() => router.push("/pat/crear")} accessibilityRole="button">
                  <FilePen color={colors.uleam} size={20} />
                  <T variant="label" color={colors.uleam} style={{ flex: 1 }}>
                    Registrar mi tema
                  </T>
                  <ChevronRight color={colors.uleam} size={18} />
                </Pressable>
              ) : null}
            </View>
          )}
        </Card>

        <SectionTitle caption="Cada etapa se completa en orden">Ruta de titulación</SectionTitle>
        <Card>
          <Journey steps={steps} light />
        </Card>

        <SectionTitle>Mi defensa</SectionTitle>
        <Card padded={false}>
          <View style={{ padding: 16 }}>
            {full?.tribunal ? (
              <Defense tribunal={full.tribunal} />
            ) : (
              <T variant="small">Cuando tu tema esté aprobado, secretaría asignará el tribunal y verás aquí la fecha, hora y lugar.</T>
            )}
          </View>
        </Card>

        <View style={s.help}>
          <LifeBuoy color={colors.uleam} size={22} />
          <View style={{ flex: 1, gap: 2 }}>
            <T variant="label" color={colors.ink}>
              ¿Tienes dudas?
            </T>
            <T variant="small" color={colors.ink2}>
              Escribe a la secretaría académica de tu facultad indicando tu cédula y carrera.
            </T>
          </View>
        </View>
      </View>
    </ScrollView>
  );
}

const s = StyleSheet.create({
  invite: { flexDirection: "row", alignItems: "center", gap: 14, padding: 16, borderRadius: radius.lg, borderWidth: 1, borderColor: colors.ochre, backgroundColor: colors.ochre50 },
  cta: { flexDirection: "row", alignItems: "center", gap: 10, padding: 14, borderRadius: radius.md, backgroundColor: colors.uleam50 },
  help: { flexDirection: "row", alignItems: "flex-start", gap: 14, backgroundColor: colors.uleam50, borderRadius: radius.lg, padding: 16 },
  topic: { flexDirection: "row", alignItems: "center", gap: 12, padding: 18 },
});
