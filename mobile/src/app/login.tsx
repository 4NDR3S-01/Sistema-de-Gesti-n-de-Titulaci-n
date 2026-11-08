import { useRef, useState } from "react";
import {
  Image,
  Pressable,
  StyleSheet,
  useWindowDimensions,
  View,
  type TextInputInstance,
} from "react-native";
import Animated, {
  FadeIn,
  FadeInDown,
  useAnimatedStyle,
} from "react-native-reanimated";
import {
  useKeyboardState,
  useReanimatedKeyboardAnimation,
} from "react-native-keyboard-controller";
import { router } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { LinearGradient } from "expo-linear-gradient";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import {
  ArrowRight,
  BriefcaseBusiness,
  CircleAlert,
  Eye,
  EyeOff,
  GraduationCap,
  IdCard,
  Info,
  LockKeyhole,
  Mail,
} from "lucide-react-native";
import { Button, Input, Segmented, T } from "@/components/ui";
import { ApiError, API_URL } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { colors, radius } from "@/lib/theme";

type Audience = "student" | "staff";

const copy = {
  student: {
    label: "Correo institucional o cédula",
    placeholder: "usuario@live.uleam.edu.ec",
    hint: "Correo completo @live.uleam.edu.ec o cédula de 10 dígitos.",
    keyboard: "email-address" as const,
    forgot:
      "Pide a la secretaría académica de tu facultad que restablezca tu contraseña. Lleva tu cédula.",
  },
  staff: {
    label: "Correo institucional",
    placeholder: "nombre.apellido@uleam.edu.ec",
    hint: "Usa tu cuenta del personal @uleam.edu.ec.",
    keyboard: "email-address" as const,
    forgot:
      "Solicita el restablecimiento al administrador del sistema de titulación.",
  },
};

type FieldError = {
  field: "identifier" | "password" | "form";
  text: string;
} | null;

/** Espacio que ocupan el logo y los márgenes de la zona superior (sin la barra de estado). */
const BRAND_CHROME = 18 + 44 + 26;

export default function Login() {
  const insets = useSafeAreaInsets();
  const win = useWindowDimensions();
  const { signIn } = useAuth();
  const keyboardOpen = useKeyboardState((state) => state.isVisible);
  // La pantalla se encoge exactamente lo que ocupa el teclado, animada junto con él.
  const { height: keyboardHeight } = useReanimatedKeyboardAnimation();
  const keyboardSpace = useAnimatedStyle(() => ({
    paddingBottom: Math.abs(keyboardHeight.value),
  }));
  // El hueco que deja el teclado se pinta blanco: al cerrarlo no asoma una franja azul bajo la hoja.
  const keyboardFill = useAnimatedStyle(() => ({
    height: Math.abs(keyboardHeight.value) + 2,
  }));
  const passwordRef = useRef<TextInputInstance>(null);
  const [audience, setAudience] = useState<Audience>("student");
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showForgot, setShowForgot] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<FieldError>(null);
  // La foto conserva el alto de la zona superior con el teclado cerrado.
  const [photoHeight, setPhotoHeight] = useState(win.height * 0.45);
  // Alto disponible ahora mismo: decide cuánto del titular cabe sin cortarse.
  const [brandSpace, setBrandSpace] = useState(win.height * 0.45);
  const text = copy[audience];
  // Espacio libre bajo el logo: el titular y la frase siempre se muestran, con un tamaño que quepa.
  const free = brandSpace - insets.top - BRAND_CHROME;
  const type =
    free >= 190
      ? "large"
      : free >= 140
        ? "compact"
        : free >= 80
          ? "headline"
          : "none";

  async function submit() {
    // Mismas reglas que el inicio de sesión web: correo institucional completo o cédula.
    const value = identifier.trim().toLowerCase();
    const isCedula = /^\d{10}$/.test(value);
    const identifierIssue = !value
      ? audience === "student"
        ? "Escribe tu correo institucional o tu cédula."
        : "Escribe tu correo institucional."
      : /^\d+$/.test(value) && !isCedula
        ? "La cédula debe tener exactamente 10 dígitos."
        : audience === "student" && !isCedula && !value.endsWith("@live.uleam.edu.ec")
          ? "Usa tu correo completo @live.uleam.edu.ec o tu cédula."
          : audience === "staff" && !value.endsWith("@uleam.edu.ec")
            ? "Para personal, usa tu correo @uleam.edu.ec."
            : null;
    if (identifierIssue) {
      setError({ field: "identifier", text: identifierIssue });
      return;
    }
    if (!password) {
      setError({ field: "password", text: "Escribe tu contraseña." });
      passwordRef.current?.focus();
      return;
    }
    setLoading(true);
    setError(null);
    try {
      await signIn(identifier.trim(), password, audience);
      router.replace("/");
    } catch (caught) {
      setError({
        field: "form",
        text:
          caught instanceof ApiError
            ? caught.message
            : "No se pudo iniciar sesión. Inténtalo de nuevo.",
      });
    } finally {
      setLoading(false);
    }
  }

  // El error del servidor se muestra bajo la contraseña, en una línea, para no empujar la pantalla.
  const passwordMessage =
    error?.field === "password" || error?.field === "form" ? error.text : null;

  return (
    <View style={s.root}>
      <StatusBar style="light" />
      {/* Mural del campus; el degradado oscurece la zona del titular para que se lea bien. */}
      <Image
        source={require("../../assets/login-photo.jpg")}
        style={[s.photo, { width: win.width, height: photoHeight + 40 }]}
        resizeMode="cover"
      />
      <LinearGradient
        colors={[
          "rgba(4,31,51,0.7)",
          "rgba(4,31,51,0.28)",
          "rgba(4,31,51,0.78)",
          colors.harbor,
        ]}
        locations={[0, 0.22, 0.52, 0.86]}
        style={[s.photo, { width: win.width, height: photoHeight + 41 }]}
        pointerEvents="none"
      />

      {/* Sin desplazamiento: la hoja queda fija abajo y la foto ocupa el resto; con el teclado, la hoja sube compacta. */}
      <Animated.View
        style={[s.keyboardFill, keyboardFill]}
        pointerEvents="none"
      />
      <Animated.View style={[{ flex: 1 }, keyboardSpace]}>
        <Animated.View
          entering={FadeIn.duration(500)}

          style={[
            s.brand,
            keyboardOpen ? s.brandCompact : null,
            { paddingTop: insets.top + 18 },
          ]}
          onLayout={(event) => {
            const height = event.nativeEvent.layout.height;
            if (keyboardOpen) return;
            setBrandSpace(height);
            setPhotoHeight((previous) => Math.max(previous, height));
          }}
        >
          <Image
            source={require("../../assets/logo-white.png")}
            style={s.logo}
            resizeMode="contain"
            accessibilityLabel="Uleam, Universidad Laica Eloy Alfaro de Manabí"
          />
          {!keyboardOpen && type !== "none" ? (
            <Animated.View
              entering={FadeIn.duration(200)}
              style={s.headlineBox}
            >
              <T
                variant="display"
                color="#fff"
                style={[s.headline, type !== "large" && s.headlineCompact]}
              >
                Tu titulación,{"\n"}paso a paso.
              </T>
              {type !== "headline" ? (
                <T
                  variant="body"
                  color="rgba(255,255,255,0.92)"
                  style={[s.tagline, type !== "large" && s.taglineCompact]}
                >
                  Registra tu tema, firma desde tu celular y sigue cada etapa
                  hasta tu defensa.
                </T>
              ) : null}
            </Animated.View>
          ) : null}
        </Animated.View>

        <Animated.View
          entering={FadeInDown.duration(550).delay(120)}

          style={[
            s.sheet,
            keyboardOpen && s.sheetExpanded,
            { paddingBottom: keyboardOpen ? 16 : insets.bottom + 8 },
          ]}
        >
          <Animated.View>
            <T variant="title">Inicia sesión</T>
            <T variant="small" style={{ marginTop: 4 }}>
              Usa tu cuenta institucional de la ULEAM.
            </T>
          </Animated.View>
          {keyboardOpen ? null : (
            <Animated.View entering={FadeIn.duration(180)}>
              <View style={{ marginTop: 16 }}>
                <Segmented
                  value={audience}
                  onChange={(value) => {
                    setAudience(value);
                    setError(null);
                    setShowForgot(false);
                  }}
                  options={[
                    {
                      value: "student",
                      label: "Estudiante",
                      icon: GraduationCap,
                    },
                    {
                      value: "staff",
                      label: "Personal",
                      icon: BriefcaseBusiness,
                    },
                  ]}
                />
              </View>
            </Animated.View>
          )}

          <Animated.View style={{ marginTop: keyboardOpen ? 20 : 16, gap: 6 }}>
            <T variant="label">{text.label}</T>
            <View>
              <View style={s.inputIcon} pointerEvents="none">
                {audience === "student" ? (
                  <IdCard color={colors.uleam} size={19} />
                ) : (
                  <Mail color={colors.uleam} size={19} />
                )}
              </View>
              <Input
                value={identifier}
                onChangeText={(value) => {
                  setIdentifier(value);
                  if (error?.field === "identifier" || error?.field === "form")
                    setError(null);
                }}
                placeholder={text.placeholder}
                autoCapitalize="none"
                autoCorrect={false}
                autoComplete="username"
                textContentType="username"
                keyboardType={text.keyboard}
                returnKeyType="next"
                submitBehavior="submit"
                onSubmitEditing={() => passwordRef.current?.focus()}
                invalid={error?.field === "identifier"}
                style={s.withIcon}
                accessibilityLabel={text.label}
              />
            </View>
            {error?.field === "identifier" ? (
              <FieldMessage text={error.text} />
            ) : keyboardOpen ? null : (
              <T variant="small">{text.hint}</T>
            )}
          </Animated.View>

          <Animated.View style={{ marginTop: 14, gap: 6 }}>
            <T variant="label">Contraseña</T>
            <View>
              <View style={s.inputIcon} pointerEvents="none">
                <LockKeyhole color={colors.uleam} size={19} />
              </View>
              <Input
                ref={passwordRef}
                value={password}
                onChangeText={(value) => {
                  setPassword(value);
                  if (error?.field === "password" || error?.field === "form")
                    setError(null);
                }}
                placeholder="Tu contraseña"
                secureTextEntry={!showPassword}
                autoComplete="current-password"
                textContentType="password"
                returnKeyType="go"
                onSubmitEditing={submit}
                invalid={Boolean(passwordMessage)}
                style={[s.withIcon, { paddingRight: 52 }]}
                accessibilityLabel="Contraseña"
              />
              <Pressable
                style={s.eye}
                onPress={() => setShowPassword((v) => !v)}
                accessibilityRole="button"
                accessibilityLabel={
                  showPassword ? "Ocultar contraseña" : "Mostrar contraseña"
                }
                hitSlop={8}
              >
                {showPassword ? (
                  <EyeOff color={colors.muted} size={20} />
                ) : (
                  <Eye color={colors.muted} size={20} />
                )}
              </Pressable>
            </View>
            {passwordMessage ? (
              <FieldMessage
                text={passwordMessage}
                alert={error?.field === "form"}
              />
            ) : null}
          </Animated.View>

          <Animated.View>
            <Button
              title="Ingresar"
              icon={ArrowRight}
              size="lg"
              onPress={submit}
              loading={loading}
              style={{ marginTop: 18 }}
            />
          </Animated.View>

          {keyboardOpen ? null : (
            <Animated.View entering={FadeIn.duration(180)}>
              <Pressable
                onPress={() => setShowForgot((v) => !v)}
                style={({ pressed }) => [
                  s.forgotLink,
                  pressed && { opacity: 0.6 },
                ]}
                accessibilityRole="button"
                accessibilityState={{ expanded: showForgot }}
              >
                <T variant="label" color={colors.uleam}>
                  ¿Olvidaste tu contraseña?
                </T>
              </Pressable>
              {showForgot ? (
                <View style={s.forgot}>
                  <Info color={colors.uleam} size={18} />
                  <T variant="small" color={colors.ink2} style={{ flex: 1 }}>
                    {text.forgot}
                  </T>
                </View>
              ) : null}
              {__DEV__ ? (
                <T variant="caption" color={colors.faint} center>
                  Servidor: {API_URL}
                </T>
              ) : null}
            </Animated.View>
          )}
        </Animated.View>
      </Animated.View>
    </View>
  );
}

function FieldMessage({ text, alert }: { text: string; alert?: boolean }) {
  return (
    <View
      style={s.fieldMessage}
      accessibilityRole={alert ? "alert" : undefined}
    >
      <CircleAlert color={colors.danger} size={15} style={{ marginTop: 2 }} />
      <T
        variant="small"
        color={colors.danger}
        weight="medium"
        style={{ flex: 1 }}
      >
        {text}
      </T>
    </View>
  );
}

const s = StyleSheet.create({
  // Blanco: si al cerrar el teclado la ventana crece antes que el contenido, asoma blanco (la hoja), no una franja azul.
  root: { flex: 1, backgroundColor: colors.surface },
  photo: { position: "absolute", top: 0, left: 0 },
  keyboardFill: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: colors.surface,
  },
  brand: {
    flex: 1,
    minHeight: 0,
    overflow: "hidden",
    paddingHorizontal: 24,
    paddingBottom: 26,
  },
  // Con el teclado abierto solo queda el logo y la hoja blanca sube hasta él.
  brandCompact: { flex: 0, paddingBottom: 22 },
  logo: { width: 150, height: 44 },
  headlineBox: { marginTop: "auto" },
  headline: {
    fontSize: 36,
    lineHeight: 40,
    letterSpacing: -1,
    textShadowColor: "rgba(4,31,51,0.85)",
    textShadowRadius: 14,
    textShadowOffset: { width: 0, height: 2 },
  },
  headlineCompact: { fontSize: 30, lineHeight: 34, letterSpacing: -0.8 },
  tagline: {
    marginTop: 10,
    maxWidth: 340,
    textShadowColor: "rgba(4,31,51,0.9)",
    textShadowRadius: 10,
    textShadowOffset: { width: 0, height: 1 },
  },
  taglineCompact: { marginTop: 6, fontSize: 14, lineHeight: 20 },
  // La hoja ocupa todo el espacio bajo el logo mientras se escribe.
  sheetExpanded: { flex: 1 },
  sheet: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: radius.xl + 4,
    borderTopRightRadius: radius.xl + 4,
    paddingHorizontal: 24,
    paddingTop: 24,
    // Sin sombra: sobre la foto no se nota y al cerrar el teclado dibujaba una raya gris bajo la hoja.
  },
  inputIcon: {
    position: "absolute",
    left: 15,
    top: 0,
    bottom: 0,
    justifyContent: "center",
    zIndex: 1,
  },
  withIcon: { paddingLeft: 46 },
  eye: {
    position: "absolute",
    right: 6,
    top: 0,
    bottom: 0,
    width: 44,
    alignItems: "center",
    justifyContent: "center",
  },
  fieldMessage: { flexDirection: "row", alignItems: "flex-start", gap: 6 },
  forgotLink: {
    alignSelf: "center",
    paddingVertical: 12,
    paddingHorizontal: 8,
    marginTop: 2,
  },
  forgot: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 10,
    backgroundColor: colors.uleam50,
    borderRadius: radius.md,
    padding: 14,
    marginBottom: 8,
  },
});
