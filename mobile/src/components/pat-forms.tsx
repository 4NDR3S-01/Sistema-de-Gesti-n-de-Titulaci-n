import { useState } from "react";
import { View } from "react-native";
import * as ImagePicker from "expo-image-picker";
import { extractTextFromImage, isSupported as ocrSupported } from "expo-text-extractor";
import { IdCard, ImageUp, User, Users } from "lucide-react-native";
import { Banner, Button, Choice, DateField, Field, Input, Select, T } from "@/components/ui";
import type { FieldErrors } from "@/lib/api";
import { parseCedula, type CedulaData } from "@/lib/cedula";
import { ageFrom } from "@/lib/format";
import { colors } from "@/lib/theme";
import type { Catalog } from "@/lib/types";

export type Values = Record<string, string>;
type Setter = (name: string, value: string) => void;

const err = (errors: FieldErrors, name: string) => errors[name]?.[0];

export function ProposalFields({
  catalog,
  values,
  set,
  errors,
  warnGroupChange,
}: {
  catalog: Catalog;
  values: Values;
  set: Setter;
  errors: FieldErrors;
  warnGroupChange?: boolean;
}) {
  const articulations = (values.articulations ?? "").split(",").filter(Boolean);
  const toggle = (option: string) => {
    let next: string[];
    if (option === "ninguna") next = articulations.includes("ninguna") ? [] : ["ninguna"];
    else {
      const rest = articulations.filter((item) => item !== "ninguna" && item !== option);
      next = articulations.includes(option) ? rest : [...rest, option];
    }
    set("articulations", next.join(","));
  };
  const problemLength = (values.problem ?? "").length;

  return (
    <View style={{ gap: 16 }}>
      <Field label="Opción de aprobación previo a titulación" required error={err(errors, "approvalOption")}>
        <Select
          title="Opción de aprobación previo a titulación"
          value={values.approvalOption ?? ""}
          options={catalog.approvalOptions}
          onChange={(v) => set("approvalOption", v)}
          invalid={Boolean(err(errors, "approvalOption"))}
        />
      </Field>

      <Field label="Modalidad" required error={err(errors, "modality")}>
        <Select title="Modalidad" value={values.modality ?? ""} options={catalog.modalities} onChange={(v) => set("modality", v)} invalid={Boolean(err(errors, "modality"))} />
      </Field>

      <View style={{ gap: 8 }}>
        <T variant="label">
          Mecanismo de desarrollo y presentación <T variant="label" color={colors.danger}>*</T>
        </T>
        <View style={{ flexDirection: "row", gap: 8 }}>
          {[
            { value: "INDIVIDUAL", label: "Individual", detail: "Trabajas solo/a", icon: User },
            { value: "GRUPAL", label: "Grupal", detail: "Con un compañero/a", icon: Users },
          ].map((option) => (
            <View key={option.value} style={{ flex: 1 }}>
              <Choice type="radio" selected={(values.participationType || "INDIVIDUAL") === option.value} onPress={() => set("participationType", option.value)} title={option.label} subtitle={option.detail} />
            </View>
          ))}
        </View>
        {values.participationType === "GRUPAL" ? <T variant="small">Después de guardar podrás buscar e invitar a tu compañero/a.</T> : null}
        {warnGroupChange && values.participationType === "INDIVIDUAL" ? (
          <T variant="small" color={colors.danger}>
            Al guardar como individual se quitará a tu compañero/a del registro.
          </T>
        ) : null}
      </View>

      <Field label="Tutor/a sugerido/a" hint="Opcional." error={err(errors, "requestedTutor")}>
        <Input value={values.requestedTutor ?? ""} onChangeText={(v) => set("requestedTutor", v)} placeholder="Nombre del docente" maxLength={150} />
      </Field>
      <Field label="Título provisional del tema" required error={err(errors, "title")}>
        <Input value={values.title ?? ""} onChangeText={(v) => set("title", v)} maxLength={255} multiline style={{ minHeight: 80 }} invalid={Boolean(err(errors, "title"))} />
      </Field>
      <Field label="Problemática" required error={err(errors, "problem")} hint={`El problema central, a quién afecta y por qué importa. Mínimo 80 caracteres (${problemLength}/4000).`}>
        <Input value={values.problem ?? ""} onChangeText={(v) => set("problem", v)} maxLength={4000} multiline invalid={Boolean(err(errors, "problem"))} />
      </Field>

      <View style={{ gap: 8 }}>
        <T variant="label">
          Articulación del Trabajo de Integración Curricular con funciones sustantivas{" "}
          <T variant="label" color={colors.danger}>*</T>
        </T>
        {catalog.articulations.map((option) => (
          <Choice key={option.value} selected={articulations.includes(option.value)} onPress={() => toggle(option.value)} title={option.label} />
        ))}
        {err(errors, "articulations") ? (
          <T variant="small" color={colors.danger}>
            {err(errors, "articulations")}
          </T>
        ) : null}
      </View>
    </View>
  );
}

export function PersonalFields({ catalog, values, set, errors }: { catalog: Catalog; values: Values; set: Setter; errors: FieldErrors }) {
  const [showDisability, setShowDisability] = useState(Boolean(values.disabilityType));
  const age = ageFrom(values.birthDate);
  const maxBirth = new Date();
  maxBirth.setFullYear(maxBirth.getFullYear() - 16);

  return (
    <View style={{ gap: 16 }}>
      <View style={{ flexDirection: "row", gap: 10 }}>
        <View style={{ flex: 1 }}>
          <Field label="Nivel" required error={err(errors, "level")}>
            <Select title="Nivel" value={values.level ?? ""} options={catalog.levels} onChange={(v) => set("level", v)} placeholder="Elegir" invalid={Boolean(err(errors, "level"))} />
          </Field>
        </View>
        <View style={{ flex: 1 }}>
          <Field label="Paralelo" required error={err(errors, "parallel")}>
            <Select title="Paralelo" value={values.parallel ?? ""} options={catalog.parallels} onChange={(v) => set("parallel", v)} placeholder="Elegir" invalid={Boolean(err(errors, "parallel"))} />
          </Field>
        </View>
      </View>
      <Field label="Curso" hint="Si lo dejas vacío, se usa tu semestre." error={err(errors, "curso")}>
        <Input value={values.curso ?? ""} onChangeText={(v) => set("curso", v)} placeholder="Ej. 9.º" maxLength={20} />
      </Field>
      <Field label="Fecha de nacimiento" required error={err(errors, "birthDate")} hint={age !== null ? `Edad: ${age} años.` : undefined}>
        <DateField value={values.birthDate ?? ""} onChange={(v) => set("birthDate", v)} maximumDate={maxBirth} invalid={Boolean(err(errors, "birthDate"))} />
      </Field>
      <Field label="Nacionalidad" required error={err(errors, "nationality")}>
        <Input value={values.nationality ?? ""} onChangeText={(v) => set("nationality", v)} maxLength={60} />
      </Field>
      <Field label="Estado civil" required error={err(errors, "maritalStatus")}>
        <Select title="Estado civil" value={values.maritalStatus ?? ""} options={catalog.maritalStatuses} onChange={(v) => set("maritalStatus", v)} invalid={Boolean(err(errors, "maritalStatus"))} />
      </Field>
      <Field label="Nº de Certificado de Votación" hint="Opcional." error={err(errors, "votingCertificate")}>
        <Input value={values.votingCertificate ?? ""} onChangeText={(v) => set("votingCertificate", v)} maxLength={30} />
      </Field>
      <Field label="Provincia de residencia" required error={err(errors, "province")}>
        <Select title="Provincia" value={values.province ?? ""} options={catalog.provinces} onChange={(v) => set("province", v)} invalid={Boolean(err(errors, "province"))} />
      </Field>
      <View style={{ flexDirection: "row", gap: 10 }}>
        <View style={{ flex: 1 }}>
          <Field label="Cantón" required error={err(errors, "canton")}>
            <Input value={values.canton ?? ""} onChangeText={(v) => set("canton", v)} placeholder="Ej. Manta" maxLength={80} invalid={Boolean(err(errors, "canton"))} />
          </Field>
        </View>
        <View style={{ flex: 1 }}>
          <Field label="Parroquia" hint="Opcional." error={err(errors, "parish")}>
            <Input value={values.parish ?? ""} onChangeText={(v) => set("parish", v)} placeholder="Ej. Tarqui" maxLength={80} />
          </Field>
        </View>
      </View>
      <Choice
        selected={showDisability}
        onPress={() => {
          if (showDisability) {
            set("disabilityType", "");
            set("disabilityDegree", "");
          }
          setShowDisability(!showDisability);
        }}
        title="Tengo una discapacidad registrada"
        subtitle="Solo si aplica; se indica en el formato oficial."
      />
      {showDisability ? (
        <View style={{ flexDirection: "row", gap: 10 }}>
          <View style={{ flex: 1.4 }}>
            <Field label="Tipo" error={err(errors, "disabilityType")}>
              <Select title="Tipo de discapacidad" value={values.disabilityType ?? ""} options={catalog.disabilityTypes} onChange={(v) => set("disabilityType", v)} placeholder="Elegir" />
            </Field>
          </View>
          <View style={{ flex: 1 }}>
            <Field label="Grado (%)" error={err(errors, "disabilityDegree")}>
              <Input value={values.disabilityDegree ?? ""} onChangeText={(v) => set("disabilityDegree", v.replace(/\D/g, ""))} keyboardType="number-pad" maxLength={3} />
            </Field>
          </View>
        </View>
      ) : null}
    </View>
  );
}

const scanLabels: { key: keyof CedulaData; label: string }[] = [
  { key: "birthDate", label: "Fecha de nacimiento" },
  { key: "nationality", label: "Nacionalidad" },
  { key: "maritalStatus", label: "Estado civil" },
];

/**
 * Lee la cédula con el OCR del teléfono (la foto no se envía a ningún servidor) y
 * completa los datos informativos que aparecen en ella. El estudiante los revisa antes de guardar.
 */
export function CedulaScanner({ expectedCedula, onData }: { expectedCedula?: string | null; onData: (data: CedulaData) => void }) {
  const [found, setFound] = useState<CedulaData>({});
  const [busy, setBusy] = useState(false);
  const [problem, setProblem] = useState<string | null>(null);

  if (!ocrSupported) return null;

  const scan = async (source: "camera" | "library") => {
    setProblem(null);
    if (source === "camera") {
      const permission = await ImagePicker.requestCameraPermissionsAsync();
      if (!permission.granted) {
        setProblem("Activa el permiso de cámara en los ajustes del teléfono para escanear tu cédula.");
        return;
      }
    }
    const options: ImagePicker.ImagePickerOptions = { mediaTypes: ["images"], quality: 1 };
    const result = source === "camera" ? await ImagePicker.launchCameraAsync(options) : await ImagePicker.launchImageLibraryAsync(options);
    if (result.canceled) return;

    setBusy(true);
    try {
      const data = parseCedula(await extractTextFromImage(result.assets[0].uri));
      if (data.cedula && expectedCedula && data.cedula !== expectedCedula) {
        setProblem(`La cédula de la foto (${data.cedula}) no es la de tu ficha. Escanea tu propia cédula.`);
        return;
      }
      const useful = Object.fromEntries(scanLabels.filter(({ key }) => data[key]).map(({ key }) => [key, data[key]])) as CedulaData;
      if (Object.keys(useful).length === 0) {
        setProblem("No pudimos leer los datos. Toma la foto de cerca, con buena luz, sin reflejos y con la cédula completa en el cuadro.");
        return;
      }
      setFound((prev) => ({ ...prev, ...useful }));
      onData(useful);
    } catch {
      setProblem("No se pudo leer la imagen. Inténtalo de nuevo.");
    } finally {
      setBusy(false);
    }
  };

  const filled = scanLabels.filter(({ key }) => found[key]);
  const missing = scanLabels.filter(({ key }) => !found[key]);

  return (
    <View style={{ gap: 10 }}>
      <View style={{ flexDirection: "row", gap: 10, alignItems: "center" }}>
        <IdCard color={colors.uleam} size={22} />
        <View style={{ flex: 1 }}>
          <T variant="label">Llénalo con tu cédula</T>
          <T variant="small">Fotografía tu cédula y completamos fecha de nacimiento, nacionalidad y estado civil. La foto no sale de tu teléfono.</T>
        </View>
      </View>
      <View style={{ flexDirection: "row", gap: 8 }}>
        <Button
          title={filled.length ? "Escanear el otro lado" : "Escanear cédula"}
          icon={IdCard}
          variant="secondary"
          loading={busy}
          onPress={() => void scan("camera")}
          style={{ flex: 1 }}
        />
        <Button title="" accessibilityLabel="Elegir una foto de la galería" icon={ImageUp} variant="secondary" disabled={busy} onPress={() => void scan("library")} />
      </View>
      {problem ? <Banner tone="warning">{problem}</Banner> : null}
      {filled.length ? (
        <Banner tone="success" title="Datos tomados de tu cédula">
          {`${filled.map(({ label }) => label).join(", ")}. Revísalos abajo.${
            missing.length ? ` Para ${missing.map(({ label }) => label.toLowerCase()).join(" y ")}, escanea el otro lado o complétalo a mano.` : ""
          }`}
        </Banner>
      ) : null}
    </View>
  );
}

export function FormError({ message }: { message?: string }) {
  return message ? <Banner tone="danger">{message}</Banner> : null;
}
