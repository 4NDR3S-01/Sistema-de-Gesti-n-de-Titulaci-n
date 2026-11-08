import { useEffect, useState } from "react";
import { Pressable, StyleSheet, Text, View, type LayoutChangeEvent } from "react-native";
import Animated, { useAnimatedStyle, useSharedValue, withSpring, withTiming } from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import * as Haptics from "expo-haptics";
import type { BottomTabBarProps } from "expo-router/js-tabs";
import { colors, elevation, fonts } from "@/lib/theme";

/** Alto de la barra y separación sobre la barra de navegación del sistema. */
const BAR_HEIGHT = 66;
const BAR_GAP = 10;
const BAR_PADDING = 6;

/** Espacio que el contenido debe dejar libre abajo para no quedar bajo la barra flotante. */
export function useTabBarSpace() {
  const insets = useSafeAreaInsets();
  return insets.bottom + BAR_GAP + BAR_HEIGHT + 20;
}

const spring = { damping: 18, stiffness: 220, mass: 0.7 };

/**
 * Barra de pestañas flotante: cápsula azul puerto separada de los bordes y de la
 * barra de navegación nativa, con un indicador blanco que se desliza a la pestaña activa.
 */
export function FloatingTabBar({ state, descriptors, emitter, navigateToTab, insets }: BottomTabBarProps) {
  const [width, setWidth] = useState(0);
  const count = state.routes.length;
  const slot = width > 0 ? (width - BAR_PADDING * 2) / count : 0;
  const x = useSharedValue(0);

  useEffect(() => {
    if (slot > 0) x.set(withSpring(state.index * slot, spring));
  }, [state.index, slot, x]);

  const indicator = useAnimatedStyle(() => ({ transform: [{ translateX: x.value }] }));

  return (
    <View pointerEvents="box-none" style={[s.wrap, { bottom: insets.bottom + BAR_GAP }]}>
      <View
        style={s.bar}
        onLayout={(event: LayoutChangeEvent) => setWidth(event.nativeEvent.layout.width)}
        accessibilityRole="tablist"
      >
        {slot > 0 ? <Animated.View style={[s.indicator, { width: slot }, indicator]} /> : null}
        {state.routes.map((route, index) => {
          const { options } = descriptors[route.key];
          const focused = index === state.index;
          const label = typeof options.title === "string" ? options.title : route.name;
          const badge = options.tabBarBadge;
          return (
            <TabButton
              key={route.key}
              label={label}
              focused={focused}
              badge={badge === undefined ? undefined : String(badge)}
              icon={options.tabBarIcon?.({ focused, color: focused ? colors.uleam : "rgba(255,255,255,0.72)", size: 22 })}
              onPress={() => {
                const event = emitter.emit({ type: "tabPress", target: route.key, canPreventDefault: true });
                if (!focused && !event.defaultPrevented) {
                  void Haptics.selectionAsync();
                  navigateToTab(route.key);
                }
              }}
              onLongPress={() => emitter.emit({ type: "tabLongPress", target: route.key })}
            />
          );
        })}
      </View>
    </View>
  );
}

function TabButton({
  label,
  focused,
  badge,
  icon,
  onPress,
  onLongPress,
}: {
  label: string;
  focused: boolean;
  badge?: string;
  icon: React.ReactNode;
  onPress: () => void;
  onLongPress: () => void;
}) {
  const scale = useSharedValue(1);
  const pressStyle = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));

  return (
    <Pressable
      style={s.tab}
      onPress={onPress}
      onLongPress={onLongPress}
      onPressIn={() => scale.set(withTiming(0.88, { duration: 90 }))}
      onPressOut={() => scale.set(withSpring(1, spring))}
      accessibilityRole="tab"
      accessibilityState={{ selected: focused }}
      accessibilityLabel={badge ? `${label}, ${badge} pendientes` : label}
    >
      <Animated.View style={[s.tabInner, pressStyle]}>
        <View>
          {icon}
          {badge ? (
            <View style={[s.badge, focused && { borderColor: colors.surface }]}>
              <Text style={s.badgeText}>{badge}</Text>
            </View>
          ) : null}
        </View>
        <Text style={[s.label, focused ? s.labelActive : null]} numberOfLines={1}>
          {label}
        </Text>
      </Animated.View>
    </Pressable>
  );
}

const s = StyleSheet.create({
  wrap: { position: "absolute", left: 16, right: 16 },
  bar: {
    height: BAR_HEIGHT,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: BAR_PADDING,
    borderRadius: BAR_HEIGHT / 2,
    backgroundColor: colors.harbor,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
    ...elevation.high,
  },
  indicator: {
    position: "absolute",
    left: BAR_PADDING,
    top: BAR_PADDING,
    bottom: BAR_PADDING,
    borderRadius: (BAR_HEIGHT - BAR_PADDING * 2) / 2,
    backgroundColor: colors.surface,
  },
  tab: { flex: 1, height: "100%", alignItems: "center", justifyContent: "center" },
  tabInner: { alignItems: "center", justifyContent: "center", gap: 3 },
  label: { fontFamily: fonts.semibold, fontSize: 11, color: "rgba(255,255,255,0.72)" },
  labelActive: { fontFamily: fonts.bold, color: colors.uleam },
  badge: {
    position: "absolute",
    top: -5,
    right: -10,
    minWidth: 18,
    height: 18,
    borderRadius: 9,
    paddingHorizontal: 4,
    backgroundColor: colors.ochre,
    borderWidth: 2,
    borderColor: colors.harbor,
    alignItems: "center",
    justifyContent: "center",
  },
  badgeText: { fontFamily: fonts.bold, fontSize: 10, color: colors.harbor900 },
});
