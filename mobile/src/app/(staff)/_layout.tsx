import { Redirect } from "expo-router";
import { Tabs } from "expo-router/js-tabs";
import { FloatingTabBar } from "@/components/floating-tab-bar";
import { ClipboardCheck, Gavel, House, UserRound } from "lucide-react-native";
import { useAuth } from "@/lib/auth";
import { colors } from "@/lib/theme";

export default function StaffTabs() {
  const { status, me } = useAuth();
  if (status !== "signedIn" || !me) return <Redirect href="/login" />;
  if (me.user.role === "STUDENT") return <Redirect href="/(student)" />;
  const pending = me.notifications.find((n) => n.id === "pending");
  const count = pending ? Number(pending.title.split(" ")[0]) || undefined : undefined;

  return (
    <Tabs
      tabBar={(props) => <FloatingTabBar {...props} />}
      screenOptions={{ headerShown: false, animation: "shift", sceneStyle: { backgroundColor: colors.canvas } }}
    >
      <Tabs.Screen name="index" options={{ title: "Inicio", tabBarIcon: ({ color, size }) => <House color={color} size={size} /> }} />
      <Tabs.Screen
        name="bandeja"
        options={{
          title: "Bandeja",
          tabBarIcon: ({ color, size }) => <ClipboardCheck color={color} size={size} />,
          tabBarBadge: count,
        }}
      />
      <Tabs.Screen name="tribunales" options={{ title: "Tribunales", tabBarIcon: ({ color, size }) => <Gavel color={color} size={size} /> }} />
      <Tabs.Screen name="cuenta" options={{ title: "Cuenta", tabBarIcon: ({ color, size }) => <UserRound color={color} size={size} /> }} />
    </Tabs>
  );
}
