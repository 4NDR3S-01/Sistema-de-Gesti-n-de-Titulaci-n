/**
 * Quita el velo gris que Android pone detrás de la barra de navegación del sistema
 * (android:enforceNavigationBarContrast). La app dibuja su propio fondo hasta el borde.
 */
const { withAndroidStyles } = require("expo/config-plugins");

module.exports = function withTransparentNavigationBar(config) {
  return withAndroidStyles(config, (mod) => {
    const theme = mod.modResults.resources.style?.find((style) => style.$.name === "AppTheme");
    if (theme) {
      theme.item = (theme.item ?? []).filter((item) => item.$.name !== "android:enforceNavigationBarContrast");
      theme.item.push({ $: { name: "android:enforceNavigationBarContrast", "tools:targetApi": "29" }, _: "false" });
    }
    return mod;
  });
};
