import { Alert, StyleSheet, View } from "react-native";
import { router } from "expo-router";
import Constants from "expo-constants";
import { Bell, KeyRound, LogOut, ShieldCheck, UserPen } from "lucide-react-native";
import { Avatar, Badge, Button, Card, ListRow, PageHeader, Screen, SectionTitle, T } from "@/components/ui";
import { useAuth } from "@/lib/auth";
import { colors } from "@/lib/theme";

const toneMap = { info: "info", warning: "warning", danger: "danger", success: "success" } as const;

export function AccountScreen() {
  const { me, signOut, refresh } = useAuth();
  if (!me) return null;
  const { user, student, notifications } = me;
  const fullName = `${user.name} ${user.lastname}`;
  const isStudent = user.role === "STUDENT";

  return (
    <Screen tabbed onRefresh={refresh}>
      <PageHeader title="Mi cuenta" />
      <Card style={{ flexDirection: "row", alignItems: "center", gap: 16, padding: 18 }}>
        <Avatar name={fullName} size={60} />
        <View style={{ flex: 1, gap: 2 }}>
          <T variant="heading">{fullName}</T>
          <T variant="small" numberOfLines={1}>
            {user.email}
          </T>
          <View style={{ marginTop: 4 }}>
            <Badge tone="info">{user.roleLabel}</Badge>
          </View>
        </View>
      </Card>

      {isStudent && student ? (
        <T variant="small">
          {student.career}, {student.faculty}
        </T>
      ) : null}

      <SectionTitle right={<Bell color={colors.muted} size={18} />}>Notificaciones</SectionTitle>
      <Card padded={false}>
        {notifications.length === 0 ? (
          <View style={{ padding: 16 }}>
            <T variant="small">No tienes pendientes.</T>
          </View>
        ) : (
          notifications.map((item, index) => (
            <View key={item.id} style={{ padding: 16, gap: 6, borderTopWidth: index ? StyleSheet.hairlineWidth : 0, borderTopColor: colors.lineStrong }}>
              <Badge tone={toneMap[item.tone]}>{item.title}</Badge>
              <T variant="small">{item.detail}</T>
            </View>
          ))
        )}
      </Card>

      <SectionTitle>Seguridad y datos</SectionTitle>
      <Card padded={false}>
        {isStudent ? <ListRow icon={UserPen} title="Mis datos personales" subtitle="Cédula, contacto y domicilio" onPress={() => router.push("/cuenta/perfil")} /> : null}
        {user.hasPassword !== false ? (
          <ListRow icon={KeyRound} title="Cambiar contraseña" subtitle="Requiere tu contraseña actual" onPress={() => router.push("/cuenta/contrasena")} last />
        ) : (
          <ListRow icon={ShieldCheck} title="Contraseña de Microsoft 365" subtitle="Se cambia en tu cuenta institucional" last />
        )}
      </Card>

      {!isStudent ? (
        <Card style={{ gap: 4 }}>
          <T variant="label" color={colors.ink}>
            Administración en la web
          </T>
          <T variant="small">La gestión de usuarios, facultades y carreras se hace desde el sistema web, más cómodo para esas tareas.</T>
        </Card>
      ) : null}

      <Button
        title="Cerrar sesión"
        icon={LogOut}
        variant="secondary"
        onPress={() =>
          Alert.alert("Cerrar sesión", "¿Quieres salir de tu cuenta en este teléfono?", [
            { text: "Cancelar", style: "cancel" },
            { text: "Cerrar sesión", style: "destructive", onPress: () => void signOut().then(() => router.replace("/login")) },
          ])
        }
      />
      <T variant="caption" center>
        Titulación ULEAM · versión {Constants.expoConfig?.version ?? "1.0.0"}
      </T>
    </Screen>
  );
}
