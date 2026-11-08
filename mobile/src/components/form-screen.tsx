import type { ReactNode } from "react";
import { StyleSheet, View } from "react-native";
import { KeyboardAwareScrollView, KeyboardStickyView } from "react-native-keyboard-controller";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { colors } from "@/lib/theme";

/**
 * Formulario largo con la acción principal fija abajo. Al abrir el teclado, el campo
 * enfocado se desplaza a la vista y el botón sube junto con el teclado.
 */
export function FormScreen({ children, footer }: { children: ReactNode; footer: ReactNode }) {
  const insets = useSafeAreaInsets();
  return (
    <View style={{ flex: 1, backgroundColor: colors.canvas }}>
      <KeyboardAwareScrollView
        contentContainerStyle={s.content}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
        bottomOffset={FOOTER_HEIGHT + 16}
      >
        {children}
      </KeyboardAwareScrollView>
      <KeyboardStickyView offset={{ opened: insets.bottom }}>
        <View style={[s.footer, { paddingBottom: insets.bottom + 12 }]}>{footer}</View>
      </KeyboardStickyView>
    </View>
  );
}

/** Altura aproximada del pie con el botón principal. */
const FOOTER_HEIGHT = 76;

const s = StyleSheet.create({
  content: { padding: 20, gap: 18, paddingBottom: 32 },
  footer: { paddingHorizontal: 16, paddingTop: 12, backgroundColor: colors.surface, borderTopWidth: 1, borderTopColor: colors.line },
});
