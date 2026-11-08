import { useEffect } from "react";
import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import * as SplashScreen from "expo-splash-screen";
import {
  PublicSans_400Regular,
  PublicSans_500Medium,
  PublicSans_600SemiBold,
  PublicSans_700Bold,
  PublicSans_800ExtraBold,
  useFonts,
} from "@expo-google-fonts/public-sans";
import { KeyboardProvider } from "react-native-keyboard-controller";
import { AuthProvider, useAuth } from "@/lib/auth";
import { colors, fonts } from "@/lib/theme";

SplashScreen.preventAutoHideAsync();

function RootStack() {
  const { status } = useAuth();
  const [fontsLoaded] = useFonts({
    PublicSans_400Regular,
    PublicSans_500Medium,
    PublicSans_600SemiBold,
    PublicSans_700Bold,
    PublicSans_800ExtraBold,
  });
  const ready = fontsLoaded && status !== "loading";

  useEffect(() => {
    if (ready) SplashScreen.hide();
  }, [ready]);

  if (!ready) return null;

  return (
    <>
      <StatusBar style="dark" />
      <Stack
        screenOptions={{
          headerShown: false,
          headerTintColor: colors.uleam,
          headerTitleStyle: { fontFamily: fonts.semibold, color: colors.ink },
          headerStyle: { backgroundColor: colors.canvas },
          headerShadowVisible: false,
          contentStyle: { backgroundColor: colors.canvas },
          headerBackButtonDisplayMode: "minimal",
          animation: "slide_from_right",
        }}
      >
        <Stack.Screen name="index" />
        <Stack.Screen name="login" options={{ animation: "fade" }} />
        <Stack.Screen name="(student)" />
        <Stack.Screen name="(staff)" />
        <Stack.Screen name="pat/crear" options={{ headerShown: true, title: "Nuevo registro" }} />
        <Stack.Screen name="pat/propuesta" options={{ headerShown: true, title: "Editar propuesta" }} />
        <Stack.Screen name="pat/datos" options={{ headerShown: true, title: "Mis datos informativos" }} />
        <Stack.Screen name="pat/companero" options={{ headerShown: true, title: "Compañero/a de trabajo" }} />
        <Stack.Screen name="pat/firmar" options={{ headerShown: true, title: "Firmar el formato" }} />
        <Stack.Screen name="cuenta/perfil" options={{ headerShown: true, title: "Mis datos personales" }} />
        <Stack.Screen name="cuenta/contrasena" options={{ headerShown: true, title: "Cambiar contraseña" }} />
        <Stack.Screen name="staff/revision/[id]" options={{ headerShown: true, title: "Revisión" }} />
        <Stack.Screen name="staff/tribunal-nuevo" options={{ headerShown: true, title: "Asignar tribunal" }} />
      </Stack>
    </>
  );
}

export default function RootLayout() {
  return (
    <KeyboardProvider>
      <AuthProvider>
        <RootStack />
      </AuthProvider>
    </KeyboardProvider>
  );
}
