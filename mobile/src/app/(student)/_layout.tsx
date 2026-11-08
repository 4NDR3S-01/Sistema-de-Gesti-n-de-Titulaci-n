import { Redirect } from "expo-router";
import { Tabs } from "expo-router/js-tabs";
import { FloatingTabBar } from "@/components/floating-tab-bar";
import { FilePen, House, UserRound } from "lucide-react-native";
import { useAuth } from "@/lib/auth";
import { colors } from "@/lib/theme";

export default function StudentTabs() {
  const { status, me } = useAuth();
  if (status !== "signedIn" || !me) return <Redirect href="/login" />;
  if (me.user.role !== "STUDENT") return <Redirect href="/(staff)" />;
  const pending = me.notifications.filter((n) => n.tone !== "success").length;

  return (
    <Tabs
      tabBar={(props) => <FloatingTabBar {...props} />}
      screenOptions={{ headerShown: false, animation: "shift", sceneStyle: { backgroundColor: colors.canvas } }}
    >
      <Tabs.Screen name="index" options={{ title: "Inicio", tabBarIcon: ({ color, size }) => <House color={color} size={size} /> }} />
      <Tabs.Screen
        name="registro"
        options={{
          title: "Mi registro",
          tabBarIcon: ({ color, size }) => <FilePen color={color} size={size} />,
          tabBarBadge: pending > 0 ? pending : undefined,
        }}
      />
      <Tabs.Screen name="cuenta" options={{ title: "Cuenta", tabBarIcon: ({ color, size }) => <UserRound color={color} size={size} /> }} />
    </Tabs>
  );
}
