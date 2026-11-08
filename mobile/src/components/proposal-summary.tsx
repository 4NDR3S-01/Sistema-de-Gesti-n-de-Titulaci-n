import { View } from "react-native";
import { T } from "@/components/ui";
import { colors, radius } from "@/lib/theme";
import type { Registration } from "@/lib/types";

const articulationLabels: Record<string, string> = {
  investigacion: "Investigación",
  vinculacion: "Vinculación",
  docencia: "Docencia (asignaturas)",
  ninguna: "Ninguna",
};

/** Propuesta en solo lectura. */
export function ProposalSummary({ registration: r, collapsed }: { registration: Registration; collapsed?: boolean }) {
  return (
    <View style={{ gap: 12 }}>
      <View style={{ gap: 4 }}>
        <T variant="small">{r.modality}</T>
        <T variant="heading">{r.title}</T>
      </View>
      <View style={{ gap: 4 }}>
        <T variant="caption">Problemática</T>
        <T variant="body" color={colors.ink2} numberOfLines={collapsed ? 4 : undefined} style={{ fontSize: 14 }}>
          {r.problem}
        </T>
      </View>
      <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
        <Tag text={r.participation_type === "GRUPAL" ? "En pareja" : "Individual"} />
        <Tag text={r.presentation_mechanism} />
        {r.articulations.map((value) => (
          <Tag key={value} text={articulationLabels[value] ?? value} />
        ))}
      </View>
      <T variant="small">Tutor/a sugerido/a: {r.requested_tutor || "sin sugerencia"}</T>
    </View>
  );
}

function Tag({ text }: { text: string }) {
  return (
    <View style={{ borderWidth: 1, borderColor: colors.line, borderRadius: radius.pill, paddingHorizontal: 10, paddingVertical: 4 }}>
      <T variant="caption" color={colors.ink2}>
        {text}
      </T>
    </View>
  );
}
