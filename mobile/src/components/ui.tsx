import { useState, type ComponentType, type ReactNode } from "react";
import {
  ActivityIndicator,
  FlatList,
  Modal,
  Platform,
  Pressable,
  RefreshControl,
  StyleSheet,
  Text,
  TextInput,
  View,
  type StyleProp,
  type TextInputInstance,
  type TextInputProps,
  type TextProps,
  type TextStyle,
  type ViewStyle,
} from "react-native";
import { KeyboardAwareScrollView } from "react-native-keyboard-controller";
import DateTimePicker, { DateTimePickerAndroid } from "@react-native-community/datetimepicker";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import {
  CalendarDays,
  Check,
  ChevronDown,
  ChevronRight,
  CircleAlert,
  CircleCheck,
  Clock,
  Info,
  TriangleAlert,
  X,
  type LucideProps,
} from "lucide-react-native";
import { useTabBarSpace } from "@/components/floating-tab-bar";
import { colors, elevation, fonts, radius, toneColors, type Tone } from "@/lib/theme";

type Icon = ComponentType<LucideProps>;

/* ================================================================ Texto */

const textVariants = StyleSheet.create({
  display: { fontFamily: fonts.extrabold, fontSize: 30, lineHeight: 35, letterSpacing: -0.8, color: colors.ink },
  title: { fontFamily: fonts.extrabold, fontSize: 26, lineHeight: 31, letterSpacing: -0.6, color: colors.ink },
  heading: { fontFamily: fonts.bold, fontSize: 17, lineHeight: 22, letterSpacing: -0.2, color: colors.ink },
  body: { fontFamily: fonts.regular, fontSize: 15, lineHeight: 22, color: colors.ink },
  small: { fontFamily: fonts.regular, fontSize: 13, lineHeight: 18, color: colors.muted },
  label: { fontFamily: fonts.semibold, fontSize: 14, lineHeight: 19, color: colors.ink2 },
  caption: { fontFamily: fonts.medium, fontSize: 12, lineHeight: 16, color: colors.muted },
});

export function T({
  variant = "body",
  color,
  weight,
  center,
  style,
  ...props
}: TextProps & {
  variant?: keyof typeof textVariants;
  color?: string;
  weight?: keyof typeof fonts;
  center?: boolean;
}) {
  return (
    <Text
      {...props}
      style={[
        textVariants[variant],
        color ? { color } : null,
        weight ? { fontFamily: fonts[weight] } : null,
        center ? { textAlign: "center" } : null,
        style,
      ]}
    />
  );
}

/* ================================================================ Estructura */

export function Screen({
  children,
  refreshing,
  onRefresh,
  header,
  contentStyle,
  edges = ["top"],
  tabbed,
}: {
  children: ReactNode;
  refreshing?: boolean;
  onRefresh?: () => void;
  header?: ReactNode;
  contentStyle?: StyleProp<ViewStyle>;
  edges?: ("top" | "bottom")[];
  /** Pantalla dentro de las pestañas: deja espacio para la barra flotante. */
  tabbed?: boolean;
}) {
  const tabSpace = useTabBarSpace();
  return (
    <SafeAreaView style={styles.screen} edges={edges}>
      {header}
      <KeyboardAwareScrollView
        bottomOffset={24}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[styles.screenContent, tabbed && { paddingBottom: tabSpace }, contentStyle]}
        keyboardShouldPersistTaps="handled"
        refreshControl={
          onRefresh ? (
            <RefreshControl refreshing={Boolean(refreshing)} onRefresh={onRefresh} tintColor={colors.uleam} colors={[colors.uleam]} />
          ) : undefined
        }
      >
        {children}
      </KeyboardAwareScrollView>
    </SafeAreaView>
  );
}

/** Encabezado de página: contexto pequeño arriba y título grande. */
export function PageHeader({ overline, title, subtitle, right }: { overline?: string; title: string; subtitle?: string; right?: ReactNode }) {
  return (
    <View style={styles.pageHeader}>
      <View style={{ flex: 1, gap: 2 }}>
        {overline ? (
          <T variant="label" color={colors.uleam}>
            {overline}
          </T>
        ) : null}
        <T variant="title">{title}</T>
        {subtitle ? <T variant="small" style={{ marginTop: 2 }}>{subtitle}</T> : null}
      </View>
      {right}
    </View>
  );
}

export function Loading({ label = "Cargando…" }: { label?: string }) {
  return (
    <View style={styles.loading}>
      <ActivityIndicator color={colors.uleam} size="large" />
      <T variant="small">{label}</T>
    </View>
  );
}

export function Card({ children, style, padded = true }: { children: ReactNode; style?: StyleProp<ViewStyle>; padded?: boolean }) {
  return <View style={[styles.card, padded && styles.cardPadded, style]}>{children}</View>;
}

export function CardHeader({ title, right, subtitle }: { title: string; right?: ReactNode; subtitle?: string }) {
  return (
    <View style={styles.cardHeader}>
      <View style={{ flex: 1 }}>
        <T variant="heading" style={{ fontSize: 16 }}>
          {title}
        </T>
        {subtitle ? <T variant="small">{subtitle}</T> : null}
      </View>
      {right}
    </View>
  );
}

export function Divider() {
  return <View style={styles.divider} />;
}

export function SectionTitle({ children, right, caption }: { children: string; right?: ReactNode; caption?: string }) {
  return (
    <View style={styles.sectionTitle}>
      <View style={{ flex: 1 }}>
        <T variant="heading" style={{ fontSize: 18 }}>
          {children}
        </T>
        {caption ? <T variant="small">{caption}</T> : null}
      </View>
      {right}
    </View>
  );
}

/* ================================================================ Botones */

type ButtonVariant = "primary" | "secondary" | "ghost" | "danger" | "success" | "light";

const buttonColors: Record<ButtonVariant, { bg: string; fg: string; border: string; pressed: string }> = {
  primary: { bg: colors.uleam, fg: "#fff", border: colors.uleam, pressed: colors.harbor },
  secondary: { bg: colors.surface, fg: colors.ink, border: colors.line, pressed: colors.sunken },
  ghost: { bg: "transparent", fg: colors.uleam, border: "transparent", pressed: colors.uleam50 },
  danger: { bg: colors.danger, fg: "#fff", border: colors.danger, pressed: "#8F1C13" },
  success: { bg: colors.success, fg: "#fff", border: colors.success, pressed: "#0D5E39" },
  light: { bg: "#fff", fg: colors.harbor, border: "#fff", pressed: colors.uleam50 },
};

export function Button({
  title,
  onPress,
  variant = "primary",
  icon: IconComponent,
  loading,
  disabled,
  size = "md",
  full,
  style,
  accessibilityLabel,
}: {
  title: string;
  accessibilityLabel?: string;
  onPress?: () => void;
  variant?: ButtonVariant;
  icon?: Icon;
  loading?: boolean;
  disabled?: boolean;
  size?: "sm" | "md" | "lg";
  full?: boolean;
  style?: StyleProp<ViewStyle>;
}) {
  const palette = buttonColors[variant];
  const height = size === "sm" ? 40 : size === "lg" ? 56 : 50;
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel ?? title}
      accessibilityState={{ disabled: disabled || loading, busy: loading }}
      onPress={onPress}
      disabled={disabled || loading}
      style={({ pressed }) => [
        styles.button,
        {
          minHeight: height,
          paddingHorizontal: size === "sm" ? 12 : 18,
          backgroundColor: pressed ? palette.pressed : palette.bg,
          borderColor: palette.border,
          opacity: disabled ? 0.45 : 1,
          transform: [{ scale: pressed ? 0.97 : 1 }],
        },
        full && { alignSelf: "stretch" },
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator color={palette.fg} size="small" />
      ) : IconComponent ? (
        <IconComponent color={palette.fg} size={size === "sm" ? 16 : 18} />
      ) : null}
      {title ? <Text style={[styles.buttonText, { color: palette.fg, fontSize: size === "sm" ? 14 : 15 }]}>{title}</Text> : null}
    </Pressable>
  );
}

/* ================================================================ Estado */

export function Badge({ tone = "neutral", children }: { tone?: Tone; children: string }) {
  const c = toneColors[tone];
  return (
    <View style={[styles.badge, { backgroundColor: c.bg }]}>
      <View style={[styles.badgeDot, { backgroundColor: c.fg }]} />
      <Text style={[styles.badgeText, { color: c.fg }]}>{children}</Text>
    </View>
  );
}

const alertIcons: Record<Tone, Icon> = {
  success: CircleCheck,
  danger: CircleAlert,
  warning: TriangleAlert,
  info: Info,
  neutral: Info,
};

export function Banner({ tone = "info", title, children }: { tone?: Tone; title?: string; children?: ReactNode }) {
  const c = toneColors[tone];
  const IconComponent = alertIcons[tone];
  return (
    <View style={[styles.banner, { backgroundColor: c.bg, borderColor: c.fg + "33" }]} accessibilityRole={tone === "danger" ? "alert" : undefined}>
      <IconComponent color={c.fg} size={20} />
      <View style={{ flex: 1, gap: 2 }}>
        {title ? (
          <T variant="label" color={c.fg}>
            {title}
          </T>
        ) : null}
        {typeof children === "string" ? <T variant="small" color={colors.ink2}>{children}</T> : children}
      </View>
    </View>
  );
}

export function EmptyState({ icon: IconComponent, title, children, action }: { icon: Icon; title: string; children?: string; action?: ReactNode }) {
  return (
    <View style={styles.empty}>
      <View style={styles.emptyIcon}>
        <IconComponent color={colors.uleam} size={26} />
      </View>
      <T variant="heading" center>
        {title}
      </T>
      {children ? (
        <T variant="small" center style={{ maxWidth: 300 }}>
          {children}
        </T>
      ) : null}
      {action}
    </View>
  );
}

export function Avatar({ name, size = 40, pending }: { name: string; size?: number; pending?: boolean }) {
  return (
    <View
      style={[
        styles.avatar,
        { width: size, height: size, borderRadius: size / 2 },
        pending && { backgroundColor: colors.ochre50, borderWidth: 2, borderStyle: "dashed", borderColor: colors.ochre },
      ]}
    >
      <Text style={{ color: pending ? colors.ochre700 : "#fff", fontFamily: fonts.bold, fontSize: size * 0.36 }}>
        {name
          .split(" ")
          .filter(Boolean)
          .slice(0, 2)
          .map((w) => w[0]?.toUpperCase())
          .join("")}
      </Text>
    </View>
  );
}

/* ================================================================ Listas */

export function ListRow({
  title,
  subtitle,
  icon: IconComponent,
  right,
  onPress,
  last,
}: {
  title: string;
  subtitle?: string;
  icon?: Icon;
  right?: ReactNode;
  onPress?: () => void;
  last?: boolean;
}) {
  return (
    <Pressable
      onPress={onPress}
      disabled={!onPress}
      accessibilityRole={onPress ? "button" : undefined}
      style={({ pressed }) => [styles.listRow, !last && styles.listRowBorder, pressed && { backgroundColor: colors.uleam50 }]}
    >
      {IconComponent ? (
        <View style={styles.listIcon}>
          <IconComponent color={colors.uleam} size={20} />
        </View>
      ) : null}
      <View style={{ flex: 1, gap: 2 }}>
        <T variant="label" color={colors.ink} numberOfLines={2}>
          {title}
        </T>
        {subtitle ? (
          <T variant="small" numberOfLines={2}>
            {subtitle}
          </T>
        ) : null}
      </View>
      {right}
      {onPress ? <ChevronRight color={colors.faint} size={18} /> : null}
    </Pressable>
  );
}

export function KeyValue({ items }: { items: { label: string; value?: string | null; wide?: boolean }[] }) {
  return (
    <View style={styles.kvGrid}>
      {items.map((item) => (
        <View key={item.label} style={[styles.kvItem, item.wide && { width: "100%" }]}>
          <T variant="caption">{item.label}</T>
          <T variant="body" weight="medium" style={{ fontSize: 14 }}>
            {item.value || "Sin registrar"}
          </T>
        </View>
      ))}
    </View>
  );
}

/* ================================================================ Formularios */

export function Field({
  label,
  required,
  hint,
  error,
  children,
}: {
  label: string;
  required?: boolean;
  hint?: string;
  error?: string;
  children: ReactNode;
}) {
  return (
    <View style={styles.field}>
      <T variant="label">
        {label}
        {required ? <Text style={{ color: colors.danger }}> *</Text> : null}
      </T>
      {children}
      {error ? (
        <T variant="small" color={colors.danger} weight="medium">
          {error}
        </T>
      ) : hint ? (
        <T variant="small">{hint}</T>
      ) : null}
    </View>
  );
}

export function Input({ invalid, style, multiline, ...props }: TextInputProps & { invalid?: boolean; ref?: React.Ref<TextInputInstance> }) {
  const [focused, setFocused] = useState(false);
  return (
    <TextInput
      placeholderTextColor={colors.faint}
      {...props}
      multiline={multiline}
      onFocus={(event) => {
        setFocused(true);
        props.onFocus?.(event);
      }}
      onBlur={(event) => {
        setFocused(false);
        props.onBlur?.(event);
      }}
      style={[
        styles.input,
        multiline && { minHeight: 140, textAlignVertical: "top", paddingTop: 12 },
        focused && styles.inputFocused,
        invalid && { borderColor: colors.danger },
        props.editable === false && { backgroundColor: colors.sunken, color: colors.ink2 },
        style as StyleProp<TextStyle>,
      ]}
    />
  );
}

/** Selector en hoja inferior (React Native no tiene un <select> nativo multiplataforma). */
export function Select({
  value,
  options,
  placeholder = "Selecciona una opción",
  onChange,
  invalid,
  title,
}: {
  value: string;
  options: readonly (string | { value: string; label: string })[];
  placeholder?: string;
  onChange: (value: string) => void;
  invalid?: boolean;
  title?: string;
}) {
  const [open, setOpen] = useState(false);
  const insets = useSafeAreaInsets();
  const normalized = options.map((option) => (typeof option === "string" ? { value: option, label: option } : option));
  const current = normalized.find((option) => option.value === value);
  return (
    <>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={title ?? placeholder}
        accessibilityHint="Abre la lista de opciones"
        onPress={() => setOpen(true)}
        style={[styles.input, styles.selectTrigger, invalid && { borderColor: colors.danger }]}
      >
        <Text style={[styles.selectText, !current && { color: colors.faint }]} numberOfLines={2}>
          {current?.label ?? placeholder}
        </Text>
        <ChevronDown color={colors.muted} size={18} />
      </Pressable>
      <Modal visible={open} transparent animationType="slide" onRequestClose={() => setOpen(false)}>
        <Pressable style={styles.sheetBackdrop} onPress={() => setOpen(false)} />
        <View style={[styles.sheet, { paddingBottom: insets.bottom + 8 }]}>
          <View style={styles.sheetHandle} />
          <View style={styles.sheetHeader}>
            <T variant="heading">{title ?? placeholder}</T>
            <Pressable onPress={() => setOpen(false)} hitSlop={12} accessibilityLabel="Cerrar">
              <X color={colors.muted} size={22} />
            </Pressable>
          </View>
          <FlatList
            showsVerticalScrollIndicator={false}
            data={normalized}
            keyExtractor={(item) => item.value}
            renderItem={({ item }) => {
              const selected = item.value === value;
              return (
                <Pressable
                  onPress={() => {
                    onChange(item.value);
                    setOpen(false);
                  }}
                  style={({ pressed }) => [styles.sheetOption, (pressed || selected) && { backgroundColor: colors.uleam50 }]}
                  accessibilityState={{ selected }}
                >
                  <Text style={[styles.sheetOptionText, selected && { color: colors.uleam, fontFamily: fonts.semibold }]}>{item.label}</Text>
                  {selected ? <Check color={colors.uleam} size={18} /> : null}
                </Pressable>
              );
            }}
          />
        </View>
      </Modal>
    </>
  );
}

const pad = (n: number) => String(n).padStart(2, "0");
const toIsoDate = (d: Date) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
const toTime = (d: Date) => `${pad(d.getHours())}:${pad(d.getMinutes())}`;

/** Fecha (AAAA-MM-DD) u hora (HH:MM) con el selector nativo del sistema. */
export function DateField({
  value,
  onChange,
  mode = "date",
  placeholder,
  minimumDate,
  maximumDate,
  invalid,
}: {
  value: string;
  onChange: (value: string) => void;
  mode?: "date" | "time";
  placeholder?: string;
  minimumDate?: Date;
  maximumDate?: Date;
  invalid?: boolean;
}) {
  const [iosOpen, setIosOpen] = useState(false);
  const current = (() => {
    if (!value) return new Date(2000, 0, 1, 9, 0);
    if (mode === "time") {
      const [h, m] = value.split(":").map(Number);
      return new Date(2000, 0, 1, h, m);
    }
    const [y, mo, d] = value.split("-").map(Number);
    return new Date(y, mo - 1, d);
  })();

  function apply(date?: Date) {
    if (date) onChange(mode === "time" ? toTime(date) : toIsoDate(date));
  }

  function open() {
    if (Platform.OS === "android") {
      DateTimePickerAndroid.open({
        value: current,
        mode,
        is24Hour: true,
        minimumDate,
        maximumDate,
        onChange: (event, date) => {
          if (event.type === "set") apply(date);
        },
      });
    } else {
      setIosOpen(true);
    }
  }

  const IconComponent = mode === "time" ? Clock : CalendarDays;
  const label = value
    ? mode === "time"
      ? value
      : new Intl.DateTimeFormat("es-EC", { day: "numeric", month: "long", year: "numeric" }).format(current)
    : placeholder ?? (mode === "time" ? "Selecciona la hora" : "Selecciona la fecha");

  return (
    <>
      <Pressable onPress={open} accessibilityRole="button" style={[styles.input, styles.selectTrigger, invalid && { borderColor: colors.danger }]}>
        <Text style={[styles.selectText, !value && { color: colors.faint }]}>{label}</Text>
        <IconComponent color={colors.muted} size={18} />
      </Pressable>
      {Platform.OS === "ios" && iosOpen ? (
        <Modal transparent animationType="slide" onRequestClose={() => setIosOpen(false)}>
          <Pressable style={styles.sheetBackdrop} onPress={() => setIosOpen(false)} />
          <View style={[styles.sheet, { paddingBottom: 24 }]}>
            <DateTimePicker
              value={current}
              mode={mode}
              display="spinner"
              minimumDate={minimumDate}
              maximumDate={maximumDate}
              onChange={(_, date) => apply(date)}
              locale="es-EC"
            />
            <Button title="Listo" onPress={() => setIosOpen(false)} style={{ marginHorizontal: 16 }} />
          </View>
        </Modal>
      ) : null}
    </>
  );
}

export function Segmented<V extends string>({
  value,
  options,
  onChange,
}: {
  value: V;
  options: { value: V; label: string; icon?: Icon }[];
  onChange: (value: V) => void;
}) {
  return (
    <View style={styles.segmented} accessibilityRole="tablist">
      {options.map((option) => {
        const selected = option.value === value;
        const IconComponent = option.icon;
        return (
          <Pressable
            key={option.value}
            accessibilityRole="tab"
            accessibilityState={{ selected }}
            onPress={() => onChange(option.value)}
            style={[styles.segment, selected && styles.segmentActive]}
          >
            {IconComponent ? <IconComponent color={selected ? colors.uleam : colors.ink2} size={17} /> : null}
            <Text style={[styles.segmentText, selected && { color: colors.uleam }]}>{option.label}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

/** Opción seleccionable (radio o casilla) con tarjeta táctil grande. */
export function Choice({
  selected,
  onPress,
  title,
  subtitle,
  type = "checkbox",
  tone = "info",
}: {
  selected: boolean;
  onPress: () => void;
  title: string;
  subtitle?: string;
  type?: "checkbox" | "radio";
  tone?: "info" | "success" | "danger";
}) {
  const accent = tone === "success" ? colors.success : tone === "danger" ? colors.danger : colors.uleam;
  const soft = tone === "success" ? colors.success50 : tone === "danger" ? colors.danger50 : colors.uleam50;
  return (
    <Pressable
      accessibilityRole={type}
      accessibilityState={{ checked: selected }}
      onPress={onPress}
      style={[styles.choice, selected && { borderColor: accent, backgroundColor: soft }]}
    >
      <View
        style={[
          styles.choiceMark,
          type === "radio" && { borderRadius: 11 },
          selected && { backgroundColor: accent, borderColor: accent },
        ]}
      >
        {selected ? <Check color="#fff" size={14} strokeWidth={3} /> : null}
      </View>
      <View style={{ flex: 1, gap: 2 }}>
        <T variant="label" color={colors.ink}>
          {title}
        </T>
        {subtitle ? <T variant="small">{subtitle}</T> : null}
      </View>
    </Pressable>
  );
}

export const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.canvas },
  screenContent: { padding: 20, paddingBottom: 40, gap: 18 },
  pageHeader: { flexDirection: "row", alignItems: "flex-end", gap: 12, paddingTop: 8, paddingBottom: 2 },
  loading: { flex: 1, alignItems: "center", justifyContent: "center", gap: 12, padding: 32, backgroundColor: colors.canvas },
  card: { backgroundColor: colors.surface, borderRadius: radius.lg, ...elevation.low, ...(Platform.OS === "android" ? { overflow: "hidden" as const } : null) },
  cardPadded: { padding: 16 },
  cardHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 6,
  },
  divider: { height: 1, backgroundColor: colors.line },
  sectionTitle: { flexDirection: "row", alignItems: "flex-end", justifyContent: "space-between", gap: 12, marginTop: 6, marginBottom: -6 },
  button: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, borderRadius: radius.md, borderWidth: 1 },
  buttonText: { fontFamily: fonts.semibold },
  badge: { flexDirection: "row", alignItems: "center", gap: 6, paddingHorizontal: 9, paddingVertical: 4, borderRadius: radius.pill, alignSelf: "flex-start" },
  badgeDot: { width: 6, height: 6, borderRadius: 3 },
  badgeText: { fontFamily: fonts.semibold, fontSize: 12 },
  banner: { flexDirection: "row", gap: 12, padding: 16, borderRadius: radius.lg, borderWidth: 1 },
  empty: { alignItems: "center", gap: 8, paddingVertical: 32, paddingHorizontal: 16 },
  emptyIcon: { width: 56, height: 56, borderRadius: 28, backgroundColor: colors.uleam50, alignItems: "center", justifyContent: "center", marginBottom: 4 },
  avatar: { backgroundColor: colors.uleam, alignItems: "center", justifyContent: "center" },
  listRow: { flexDirection: "row", alignItems: "center", gap: 14, paddingHorizontal: 16, paddingVertical: 14 },
  listRowBorder: { borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: colors.lineStrong, marginLeft: 0 },
  listIcon: { width: 42, height: 42, borderRadius: 13, backgroundColor: colors.uleam50, alignItems: "center", justifyContent: "center" },
  kvGrid: { flexDirection: "row", flexWrap: "wrap", rowGap: 14 },
  kvItem: { width: "50%", paddingRight: 8, gap: 2 },
  field: { gap: 6 },
  input: {
    minHeight: 52,
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: radius.md,
    backgroundColor: "#F7F9FB",
    paddingHorizontal: 14,
    fontFamily: fonts.regular,
    fontSize: 15,
    color: colors.ink,
  },
  inputFocused: { borderColor: colors.uleam, borderWidth: 2, paddingHorizontal: 13, backgroundColor: colors.surface },
  selectTrigger: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 8, paddingVertical: 10 },
  selectText: { flex: 1, fontFamily: fonts.regular, fontSize: 15, color: colors.ink },
  sheetBackdrop: { flex: 1, backgroundColor: "rgba(4,31,51,0.45)" },
  sheet: { maxHeight: "75%", backgroundColor: colors.surface, borderTopLeftRadius: radius.xl, borderTopRightRadius: radius.xl, paddingTop: 10 },
  sheetHandle: { alignSelf: "center", width: 40, height: 4, borderRadius: 2, backgroundColor: colors.lineStrong, marginBottom: 6 },
  sheetHeader: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 20, paddingVertical: 12 },
  sheetOption: { flexDirection: "row", alignItems: "center", gap: 12, paddingHorizontal: 20, paddingVertical: 15 },
  sheetOptionText: { flex: 1, fontFamily: fonts.regular, fontSize: 15, color: colors.ink },
  segmented: { flexDirection: "row", gap: 4, padding: 4, backgroundColor: colors.sunken, borderRadius: radius.md + 2 },
  segment: { flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 6, minHeight: 42, borderRadius: radius.md - 2 },
  segmentActive: {
    backgroundColor: colors.surface,
    shadowColor: "#000",
    shadowOpacity: 0.08,
    shadowRadius: 3,
    shadowOffset: { width: 0, height: 1 },
    elevation: 1,
  },
  segmentText: { fontFamily: fonts.semibold, fontSize: 14, color: colors.ink2 },
  choice: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 12,
    padding: 14,
    borderWidth: 1.5,
    borderColor: colors.line,
    borderRadius: radius.md,
    backgroundColor: colors.surface,
  },
  choiceMark: {
    width: 22,
    height: 22,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: colors.lineStrong,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 1,
  },
});
