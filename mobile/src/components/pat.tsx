import { Image, StyleSheet, View } from "react-native";
import { CalendarDays, Check, Circle, CircleCheck, Clock, Crown, MapPin } from "lucide-react-native";
import { Avatar, Badge, T } from "@/components/ui";
import { dateTime, eventLabels, longDate, requiredPersonalFields } from "@/lib/format";
import { colors, fonts, radius } from "@/lib/theme";
import type { Member, PatEvent, Requirement, Tribunal } from "@/lib/types";

/* ---------------------------------------------------------- Ruta */

export type StepState = "done" | "current" | "upcoming" | "blocked";

export function Journey({ steps, light }: { steps: { title: string; detail: string; state: StepState }[]; light?: boolean }) {
  const palette = light
    ? { done: colors.success, current: colors.ochre, blocked: colors.danger, upcoming: colors.lineStrong, line: colors.line, title: colors.ink, detail: colors.muted, check: "#fff" }
    : { done: "#6FD3A4", current: colors.ochre, blocked: "#FF9D94", upcoming: "rgba(255,255,255,0.25)", line: "rgba(255,255,255,0.2)", title: "#fff", detail: "rgba(255,255,255,0.7)", check: colors.harbor };
  return (
    <View style={s.journey} accessibilityRole="list" accessibilityLabel="Ruta de titulación">
      {steps.map((step, index) => {
        const color = palette[step.state];
        const current = step.state === "current";
        return (
          <View key={step.title} style={s.journeyStep} accessibilityRole="text">
            <View style={s.journeyRail}>
              <View
                style={[
                  s.journeyDot,
                  { borderColor: color, backgroundColor: step.state === "done" ? color : "transparent" },
                  current && { borderWidth: 5 },
                ]}
              >
                {step.state === "done" ? <Check color={palette.check} size={11} strokeWidth={3.5} /> : null}
              </View>
              {index < steps.length - 1 ? <View style={[s.journeyLine, { backgroundColor: step.state === "done" ? palette.done : palette.line }]} /> : null}
            </View>
            <View style={{ flex: 1, paddingBottom: index < steps.length - 1 ? 16 : 0 }}>
              <T variant="label" color={palette.title} weight={current ? "bold" : "semibold"}>
                {step.title}
              </T>
              <T variant="small" color={palette.detail}>
                {step.detail}
              </T>
            </View>
          </View>
        );
      })}
    </View>
  );
}

/* ---------------------------------------------------------- Requisitos */

export function Requirements({ items }: { items: Requirement[] }) {
  return (
    <View style={{ gap: 10 }}>
      {items.map((item) => (
        <View key={item.key} style={s.requirement} accessibilityLabel={`${item.label}: ${item.done ? "listo" : "pendiente"}`}>
          {item.done ? <CircleCheck color={colors.success} size={20} /> : <Circle color={colors.lineStrong} size={20} />}
          <T variant="body" color={item.done ? colors.muted : colors.ink} style={{ flex: 1, fontSize: 14 }}>
            {item.label}
          </T>
        </View>
      ))}
    </View>
  );
}

/* ---------------------------------------------------------- Integrantes */

export const personalComplete = (member: Member) => requiredPersonalFields.every((field) => Boolean(member.extra_data?.[field]));

function memberState(member: Member, signedByScan: boolean): { label: string; tone: "success" | "warning" | "info" } {
  if (member.status === "INVITED") return { label: "Invitación pendiente", tone: "warning" };
  if (member.signature) return { label: "Firmó", tone: "success" };
  if (signedByScan) return { label: "Firmó (escaneado)", tone: "success" };
  if (!personalComplete(member)) return { label: "Faltan sus datos", tone: "warning" };
  return { label: "Falta su firma", tone: "info" };
}

export function MemberRow({ member, isYou, signedByScan = false, last }: { member: Member; isYou?: boolean; signedByScan?: boolean; last?: boolean }) {
  const name = `${member.name} ${member.lastname}`;
  const state = memberState(member, signedByScan);
  return (
    <View style={[s.member, !last && { borderBottomWidth: 1, borderBottomColor: colors.line }]}>
      <Avatar name={name} pending={member.status === "INVITED"} />
      <View style={{ flex: 1, gap: 3 }}>
        <View style={{ flexDirection: "row", flexWrap: "wrap", alignItems: "center", gap: 6 }}>
          <T variant="label" color={colors.ink}>
            {name}
            {isYou ? <T variant="small"> (tú)</T> : null}
          </T>
          {member.role === "LEADER" ? (
            <View style={s.role}>
              <Crown color={colors.ochre700} size={12} />
              <T variant="caption" color={colors.ochre700}>
                Autor/a
              </T>
            </View>
          ) : null}
        </View>
        <T variant="small" numberOfLines={1}>
          {member.email}
        </T>
        <View style={{ flexDirection: "row", alignItems: "center", gap: 10, marginTop: 2 }}>
          <Badge tone={state.tone}>{state.label}</Badge>
          {member.signature ? <Image source={{ uri: member.signature }} style={s.signatureThumb} resizeMode="contain" accessibilityLabel={`Firma de ${name}`} /> : null}
        </View>
      </View>
    </View>
  );
}

export function Members({ members, youStudentId, signedByScan }: { members: Member[]; youStudentId?: number; signedByScan?: boolean }) {
  return (
    <View>
      {members.map((member, index) => (
        <MemberRow key={member.id} member={member} isYou={member.student_id === youStudentId} signedByScan={signedByScan} last={index === members.length - 1} />
      ))}
    </View>
  );
}

/* ---------------------------------------------------------- Historial */

export function Timeline({ events, limit }: { events: PatEvent[]; limit?: number }) {
  const shown = limit ? events.slice(0, limit) : events;
  if (shown.length === 0) return <T variant="small">Sin actividad todavía.</T>;
  return (
    <View>
      {shown.map((event, index) => {
        const positive = ["APPROVED", "SIGNED", "ACCEPTED"].includes(event.type);
        const negative = ["RETURNED", "SIGNATURES_RESET", "DECLINED"].includes(event.type);
        const dotColor = positive ? colors.success : negative ? colors.danger : colors.uleam;
        return (
          <View key={event.id} style={s.event}>
            <View style={s.eventRail}>
              <View style={[s.eventDot, { backgroundColor: dotColor }]} />
              {index < shown.length - 1 ? <View style={s.eventLine} /> : null}
            </View>
            <View style={{ flex: 1, paddingBottom: 14, gap: 2 }}>
              <T variant="body" style={{ fontSize: 14 }}>
                {event.type === "SIGNATURES_RESET" ? (
                  eventLabels[event.type]
                ) : (
                  <>
                    <T variant="body" weight="semibold" style={{ fontSize: 14 }}>
                      {event.actor_name ?? "Sistema"}
                    </T>{" "}
                    {eventLabels[event.type] ?? event.type}
                    {event.type === "INVITED" && event.detail ? ` a ${event.detail}` : ""}
                  </>
                )}
              </T>
              {event.detail && ["RETURNED", "APPROVED"].includes(event.type) ? (
                <View style={s.eventNote}>
                  <T variant="small" color={colors.ink2}>
                    {event.detail}
                  </T>
                </View>
              ) : null}
              <T variant="caption">{dateTime(event.created_at)}</T>
            </View>
          </View>
        );
      })}
    </View>
  );
}

/* ---------------------------------------------------------- Defensa */

export function Defense({ tribunal }: { tribunal: Tribunal }) {
  const members = [
    { name: tribunal.president, role: "Preside" },
    { name: tribunal.member_one, role: "Docente evaluador" },
    { name: tribunal.member_two, role: "Docente evaluador" },
    { name: tribunal.tutor, role: "Tutor/a, observador/a" },
  ];
  return (
    <View style={{ gap: 14 }}>
      <View style={{ gap: 8 }}>
        <Info icon={CalendarDays} text={longDate(tribunal.defense_date)} />
        <Info icon={Clock} text={tribunal.defense_time} />
        <Info icon={MapPin} text={tribunal.place} />
      </View>
      <View style={{ gap: 6 }}>
        {members.map((member) => (
          <View key={member.role + member.name} style={s.tribunalRow}>
            <T variant="label" color={colors.ink} style={{ flex: 1 }}>
              {member.name}
            </T>
            <T variant="caption">{member.role}</T>
          </View>
        ))}
      </View>
    </View>
  );
}

function Info({ icon: IconComponent, text }: { icon: typeof Clock; text: string }) {
  return (
    <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
      <IconComponent color={colors.uleam} size={18} />
      <T variant="body" style={{ flex: 1, fontSize: 14 }}>
        {text}
      </T>
    </View>
  );
}

const s = StyleSheet.create({
  journey: { marginTop: 4 },
  journeyStep: { flexDirection: "row", gap: 12 },
  journeyRail: { alignItems: "center", width: 18 },
  journeyDot: { width: 18, height: 18, borderRadius: 9, borderWidth: 2, alignItems: "center", justifyContent: "center", marginTop: 1 },
  journeyLine: { width: 2, flex: 1, marginVertical: 2 },
  requirement: { flexDirection: "row", alignItems: "flex-start", gap: 10 },
  member: { flexDirection: "row", gap: 12, paddingHorizontal: 16, paddingVertical: 14 },
  role: { flexDirection: "row", alignItems: "center", gap: 3 },
  signatureThumb: { width: 90, height: 30 },
  event: { flexDirection: "row", gap: 12 },
  eventRail: { alignItems: "center", width: 12 },
  eventDot: { width: 10, height: 10, borderRadius: 5, marginTop: 5 },
  eventLine: { width: 2, flex: 1, backgroundColor: colors.line, marginTop: 3 },
  eventNote: { backgroundColor: colors.canvas, borderRadius: radius.sm, padding: 8, marginTop: 2 },
  tribunalRow: { flexDirection: "row", alignItems: "center", gap: 10, backgroundColor: colors.canvas, borderRadius: radius.sm, padding: 10 },
});

export const patFonts = fonts;
