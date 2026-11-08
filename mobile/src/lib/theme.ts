import { Platform, type ViewStyle } from "react-native";

/** Tokens visuales: los mismos del sistema web (azul del logo, puerto, ocre del mural). */
export const colors = {
  uleam: "#00578A",
  uleam600: "#004A76",
  uleam50: "#EAF3F9",
  uleam100: "#D3E6F2",
  harbor: "#06314F",
  harbor900: "#041F33",
  ochre: "#C98A1B",
  ochre50: "#FBF3E2",
  ochre700: "#8A5C0C",
  ink: "#0F1E2C",
  ink2: "#3C4B5A",
  muted: "#5F6F80",
  faint: "#94A3B8",
  line: "#E3E9EF",
  lineStrong: "#C5D0DB",
  surface: "#FFFFFF",
  canvas: "#F1F4F8",
  sunken: "#E9EEF3",
  success: "#127A4B",
  success50: "#E7F5EE",
  danger: "#B42318",
  danger50: "#FDECEB",
  warning: "#8A5C0C",
  warning50: "#FBF3E2",
};

export const fonts = {
  regular: "PublicSans_400Regular",
  medium: "PublicSans_500Medium",
  semibold: "PublicSans_600SemiBold",
  bold: "PublicSans_700Bold",
  extrabold: "PublicSans_800ExtraBold",
};

/** Radios por jerarquía: controles < tarjetas < superficies grandes. */
export const radius = { sm: 8, md: 14, lg: 20, xl: 28, pill: 999 };
export const space = (n: number) => n * 4;

/** Elevaciones: sombras azuladas suaves en lugar de bordes grises. */
export const elevation: Record<"low" | "mid" | "high", ViewStyle> = {
  low: Platform.select<ViewStyle>({
    android: { elevation: 2, shadowColor: "#0B2A44" },
    default: { shadowColor: "#0B2A44", shadowOpacity: 0.06, shadowRadius: 8, shadowOffset: { width: 0, height: 2 } },
  })!,
  mid: Platform.select<ViewStyle>({
    android: { elevation: 6, shadowColor: "#0B2A44" },
    default: { shadowColor: "#0B2A44", shadowOpacity: 0.1, shadowRadius: 16, shadowOffset: { width: 0, height: 6 } },
  })!,
  high: Platform.select<ViewStyle>({
    android: { elevation: 14, shadowColor: "#041F33" },
    default: { shadowColor: "#041F33", shadowOpacity: 0.25, shadowRadius: 24, shadowOffset: { width: 0, height: 10 } },
  })!,
};

export type Tone = "neutral" | "success" | "warning" | "danger" | "info";

export const toneColors: Record<Tone, { bg: string; fg: string }> = {
  neutral: { bg: colors.sunken, fg: colors.ink2 },
  success: { bg: colors.success50, fg: colors.success },
  warning: { bg: colors.warning50, fg: colors.warning },
  danger: { bg: colors.danger50, fg: colors.danger },
  info: { bg: colors.uleam50, fg: colors.uleam },
};
