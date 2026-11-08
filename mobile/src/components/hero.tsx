import { useState, type ReactNode } from "react";
import { Image, Pressable, StyleSheet, useWindowDimensions, View } from "react-native";
import { router, useIsFocused } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { LinearGradient } from "expo-linear-gradient";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Avatar, Button, T } from "@/components/ui";
import { greeting } from "@/lib/format";
import { colors, elevation, radius } from "@/lib/theme";

/**
 * Portada con la foto del monumento del ingreso de fondo y, superpuesta,
 * la tarjeta del siguiente paso: lo primero que la persona debe hacer.
 */
export function Hero({
  name,
  fullName,
  text,
  action,
  progress,
  nextLabel = "Tu siguiente paso",
  accountHref,
  children,
}: {
  name: string;
  fullName: string;
  text: string;
  action?: { title: string; onPress: () => void };
  progress?: { done: number; total: number };
  nextLabel?: string;
  accountHref: string;
  children?: ReactNode;
}) {
  const insets = useSafeAreaInsets();
  const focused = useIsFocused();
  // Medidas explícitas: en Android la imagen con absoluteFill no se escala a la caja y sale ampliada.
  const { width } = useWindowDimensions();
  const [heroHeight, setHeroHeight] = useState(0);
  const today = new Intl.DateTimeFormat("es-EC", {
    weekday: "long",
    day: "numeric",
    month: "long",
    timeZone: "America/Guayaquil",
  }).format(new Date());

  return (
    <View>
      {focused ? <StatusBar style="light" /> : null}
      <View style={[s.hero, { paddingTop: insets.top + 14 }]} onLayout={(event) => setHeroHeight(event.nativeEvent.layout.height)}>
        {/* Foto de fondo: el monumento queda a la derecha y el saludo a la izquierda, sobre los árboles. */}
        <Image
          source={require("../../assets/home-photo.jpg")}
          style={[s.photo, { width, height: heroHeight }]}
          resizeMode="cover"
          accessibilityLabel="Monumento a Eloy Alfaro en el ingreso de la ULEAM"
        />
        {/* Sombra solo a la izquierda (detrás del texto) para no tapar el monumento. */}
        <LinearGradient
          colors={["rgba(4,31,51,0.72)", "rgba(4,31,51,0.35)", "rgba(4,31,51,0)"]}
          locations={[0, 0.55, 0.85]}
          start={{ x: 0, y: 0.5 }}
          end={{ x: 1, y: 0.5 }}
          style={StyleSheet.absoluteFill}
          pointerEvents="none"
        />
        {/* Arriba para el logo y la barra de estado; abajo para la barra de avance. */}
        <LinearGradient
          colors={["rgba(4,31,51,0.55)", "rgba(4,31,51,0)", "rgba(4,31,51,0)", "rgba(4,31,51,0.6)"]}
          locations={[0, 0.28, 0.62, 1]}
          style={StyleSheet.absoluteFill}
          pointerEvents="none"
        />
        <View style={s.top}>
          <Image source={require("../../assets/logo-white.png")} style={s.logo} resizeMode="contain" accessibilityLabel="Uleam" />
          <Pressable
            onPress={() => router.navigate(accountHref)}
            hitSlop={8}
            accessibilityRole="button"
            accessibilityLabel="Abrir mi cuenta"
            style={s.avatarRing}
          >
            <Avatar name={fullName} size={38} />
          </Pressable>
        </View>
        <T variant="small" color="rgba(255,255,255,0.85)" style={[s.shadow, { textTransform: "capitalize", marginTop: 26 }]}>
          {today}
        </T>
        <T variant="display" color="#fff" style={[s.shadow, { marginTop: 2 }]}>
          {greeting()},{"\n"}
          {name}
        </T>
        {progress ? (
          <View style={{ marginTop: 18, gap: 8 }} accessibilityLabel={`Avance: ${progress.done} de ${progress.total} etapas`}>
            <View style={s.progressRow}>
              {Array.from({ length: progress.total }, (_, i) => (
                <View
                  key={i}
                  style={[s.progressSeg, i < progress.done && { backgroundColor: "#6FD3A4" }, i === progress.done && { backgroundColor: colors.ochre }]}
                />
              ))}
            </View>
            <T variant="caption" color="rgba(255,255,255,0.85)" style={s.shadow}>
              {progress.done} de {progress.total} etapas completadas
            </T>
          </View>
        ) : null}
      </View>

      <View style={s.next}>
        <T variant="label" color={colors.uleam}>
          {nextLabel}
        </T>
        <T variant="body" color={colors.ink} style={{ marginTop: 4 }}>
          {text}
        </T>
        {action ? <Button title={action.title} onPress={action.onPress} full style={{ marginTop: 14 }} /> : null}
        {children}
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  hero: {
    backgroundColor: colors.harbor,
    paddingHorizontal: 20,
    paddingBottom: 64,
    overflow: "hidden",
    borderBottomLeftRadius: radius.xl,
    borderBottomRightRadius: radius.xl,
  },
  photo: { position: "absolute", top: 0, left: 0 },
  top: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  logo: { width: 116, height: 34 },
  avatarRing: { padding: 2, borderRadius: 22, borderWidth: 1.5, borderColor: "rgba(255,255,255,0.45)" },
  shadow: { textShadowColor: "rgba(4,31,51,0.75)", textShadowRadius: 10, textShadowOffset: { width: 0, height: 1 } },
  progressRow: { flexDirection: "row", gap: 6 },
  progressSeg: { flex: 1, height: 5, borderRadius: 3, backgroundColor: "rgba(255,255,255,0.3)" },
  next: {
    marginTop: -44,
    marginHorizontal: 20,
    padding: 18,
    borderRadius: radius.lg,
    backgroundColor: colors.surface,
    ...elevation.mid,
  },
});
