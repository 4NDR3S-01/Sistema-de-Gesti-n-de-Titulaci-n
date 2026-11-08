import { useRef, useState, type ComponentRef } from "react";
import { Image, PanResponder, StyleSheet, View } from "react-native";
import { router } from "expo-router";
import * as Haptics from "expo-haptics";
import * as ImagePicker from "expo-image-picker";
import { ImageManipulator, SaveFormat } from "expo-image-manipulator";
import { captureRef } from "react-native-view-shot";
import Svg, { Path } from "react-native-svg";
import { Camera, Check, Eraser, ImageUp, PenLine, RotateCcw, Sun } from "lucide-react-native";
import { Banner, Button, Card, Screen, Segmented, T } from "@/components/ui";
import { api, ApiError } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { colors, radius } from "@/lib/theme";

type Mode = "draw" | "photo";

/**
 * Firma del formato: dibujada con el dedo o con una foto de la firma en papel.
 * En ambos casos el servidor la "escanea" (quita fondo y sombras, recorta y la
 * deja en tinta azul) y la app muestra la vista previa antes de guardarla.
 */
export default function Sign() {
  const { me } = useAuth();
  const [mode, setMode] = useState<Mode>("draw");
  const [paths, setPaths] = useState<string[]>([]);
  const [current, setCurrent] = useState("");
  const canvasRef = useRef<ComponentRef<typeof View>>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [busy, setBusy] = useState<"process" | "save" | null>(null);
  const [error, setError] = useState("");

  const [responder] = useState(() => {
    // El trazo en curso vive en el cierre de los handlers y se refleja en estado para pintarlo.
    let stroke = "";
    const finish = () => {
      const finished = stroke;
      if (finished) setPaths((list) => [...list, finished]);
      stroke = "";
      setCurrent("");
    };
    return PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      // Evita que el ScrollView de la pantalla robe el gesto a mitad de la firma.
      onPanResponderTerminationRequest: () => false,
      onPanResponderGrant: (event) => {
        const { locationX, locationY } = event.nativeEvent;
        stroke = `M${locationX.toFixed(1)} ${locationY.toFixed(1)}`;
        setCurrent(stroke);
      },
      onPanResponderMove: (event) => {
        const { locationX, locationY } = event.nativeEvent;
        stroke += ` L${locationX.toFixed(1)} ${locationY.toFixed(1)}`;
        setCurrent(stroke);
      },
      onPanResponderRelease: finish,
      onPanResponderTerminate: finish,
    });
  });

  function reset() {
    setPaths([]);
    setCurrent("");
    setPreview(null);
    setError("");
  }

  /** Envía la imagen al servidor para "escanearla" y muestra el resultado. */
  async function processImage(uri: string, mimeType: string, name: string) {
    setBusy("process");
    setError("");
    try {
      const result = await api.upload<{ image: string }>("/api/v1/pat/signature/process", "image", { uri, type: mimeType, name });
      setPreview(result.image);
    } catch (caught) {
      setError(caught instanceof ApiError ? caught.message : "No se pudo procesar la firma.");
    } finally {
      setBusy(null);
    }
  }

  async function continueDrawing() {
    if (paths.length === 0) {
      setError("Dibuja tu firma en el recuadro.");
      return;
    }
    const uri = await captureRef(canvasRef, { format: "png", quality: 1, result: "tmpfile" });
    await processImage(uri, "image/png", "firma-dibujada.png");
  }

  async function pickPhoto(source: "camera" | "library") {
    setError("");
    if (source === "camera") {
      const permission = await ImagePicker.requestCameraPermissionsAsync();
      if (!permission.granted) {
        setError("Activa el permiso de cámara en los ajustes del teléfono para fotografiar tu firma.");
        return;
      }
    }
    const options: ImagePicker.ImagePickerOptions = { mediaTypes: ["images"], quality: 0.9, allowsEditing: true };
    const result = source === "camera" ? await ImagePicker.launchCameraAsync(options) : await ImagePicker.launchImageLibraryAsync(options);
    if (result.canceled) return;

    // Reduce la foto antes de enviarla: menos datos móviles y procesamiento más rápido.
    const context = ImageManipulator.manipulate(result.assets[0].uri);
    context.resize({ width: 1600, height: null });
    const image = await context.renderAsync();
    const saved = await image.saveAsync({ format: SaveFormat.JPEG, compress: 0.85 });
    await processImage(saved.uri, "image/jpeg", "firma-foto.jpg");
  }

  async function save() {
    if (!preview) return;
    setBusy("save");
    setError("");
    try {
      await api.put("/api/v1/pat/signature", { image: preview, method: mode === "draw" ? "DRAW" : "PHOTO" });
      void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      router.back();
    } catch (caught) {
      setError(caught instanceof ApiError ? caught.message : "No se pudo guardar la firma.");
      setBusy(null);
    }
  }

  const name = me ? `${me.user.name} ${me.user.lastname}` : "";

  return (
    <Screen edges={[]}>
      <Segmented
        value={mode}
        onChange={(value) => {
          setMode(value);
          reset();
        }}
        options={[
          { value: "draw", label: "Dibujar", icon: PenLine },
          { value: "photo", label: "Foto de mi firma", icon: Camera },
        ]}
      />

      {preview ? (
        <Card style={{ gap: 14 }}>
          <T variant="heading">Así quedará en el formato</T>
          <View style={s.preview}>
            <Image source={{ uri: preview }} style={{ width: "100%", height: 150 }} resizeMode="contain" accessibilityLabel="Vista previa de tu firma" />
            <View style={s.previewLine} />
            <T variant="caption" center>
              {name}
            </T>
          </View>
          <T variant="small">Quitamos el fondo y la recortamos. Si no se ve bien, repítela.</T>
          {error ? <Banner tone="danger">{error}</Banner> : null}
          <Button title="Usar esta firma" icon={Check} size="lg" loading={busy === "save"} onPress={save} />
          <Button title="Repetir" icon={RotateCcw} variant="secondary" onPress={reset} />
        </Card>
      ) : mode === "draw" ? (
        <Card style={{ gap: 12 }}>
          <T variant="small">Firma con el dedo dentro del recuadro, como lo harías en papel.</T>
          <View ref={canvasRef} collapsable={false} style={s.canvas} {...responder.panHandlers}>
            <Svg style={StyleSheet.absoluteFill}>
              {[...paths, current].filter(Boolean).map((d, index) => (
                <Path key={index} d={d} stroke={colors.harbor} strokeWidth={3} fill="none" strokeLinecap="round" strokeLinejoin="round" />
              ))}
            </Svg>
            {paths.length === 0 && !current ? (
              <View style={s.placeholder} pointerEvents="none">
                <PenLine color={colors.lineStrong} size={28} />
                <T variant="small" color={colors.faint}>
                  Firma aquí
                </T>
              </View>
            ) : null}
            <View style={s.baseline} pointerEvents="none" />
          </View>
          {error ? <Banner tone="danger">{error}</Banner> : null}
          <View style={{ flexDirection: "row", gap: 8 }}>
            <Button title="Limpiar" icon={Eraser} variant="secondary" style={{ flex: 1 }} onPress={reset} disabled={busy !== null} />
            <Button title="Continuar" icon={Check} style={{ flex: 1.4 }} loading={busy === "process"} onPress={continueDrawing} disabled={paths.length === 0} />
          </View>
        </Card>
      ) : (
        <Card style={{ gap: 14 }}>
          <T variant="heading">Fotografía tu firma</T>
          <View style={{ gap: 10 }}>
            {[
              [PenLine, "Firma con bolígrafo oscuro en una hoja blanca."],
              [Sun, "Busca buena luz y evita tu propia sombra sobre la hoja."],
              [Camera, "Toma la foto de frente; puedes recortarla antes de enviarla."],
            ].map(([Icon, text]) => {
              const IconComponent = Icon as typeof Sun;
              return (
                <View key={text as string} style={{ flexDirection: "row", gap: 10, alignItems: "center" }}>
                  <View style={s.tipIcon}>
                    <IconComponent color={colors.uleam} size={18} />
                  </View>
                  <T variant="body" style={{ flex: 1, fontSize: 14 }}>
                    {text as string}
                  </T>
                </View>
              );
            })}
          </View>
          {error ? <Banner tone="danger">{error}</Banner> : null}
          <Button title="Tomar foto" icon={Camera} size="lg" loading={busy === "process"} onPress={() => pickPhoto("camera")} />
          <Button title="Elegir de la galería" icon={ImageUp} variant="secondary" disabled={busy !== null} onPress={() => pickPhoto("library")} />
        </Card>
      )}
    </Screen>
  );
}

const s = StyleSheet.create({
  canvas: { height: 220, borderRadius: radius.md, borderWidth: 1, borderColor: colors.lineStrong, backgroundColor: "#FFFFFF", overflow: "hidden" },
  placeholder: { position: "absolute", top: 0, right: 0, bottom: 0, left: 0, alignItems: "center", justifyContent: "center", gap: 6 },
  baseline: { position: "absolute", left: 24, right: 24, bottom: 40, height: 1, backgroundColor: colors.line },
  preview: { padding: 16, borderRadius: radius.md, borderWidth: 1, borderColor: colors.line, backgroundColor: "#FFFFFF", gap: 4 },
  previewLine: { height: 1, backgroundColor: colors.ink, marginHorizontal: 20 },
  tipIcon: { width: 34, height: 34, borderRadius: 17, backgroundColor: colors.uleam50, alignItems: "center", justifyContent: "center" },
});
