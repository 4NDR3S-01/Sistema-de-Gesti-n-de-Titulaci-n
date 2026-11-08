import { useState } from "react";
import { View } from "react-native";
import { User, Users } from "lucide-react-native";
import { Banner, Choice, DateField, Field, Input, Select, T } from "@/components/ui";
import type { FieldErrors } from "@/lib/api";
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
      <Field label="Modalidad" required error={err(errors, "modality")}>
        <Select title="Modalidad" value={values.modality ?? ""} options={catalog.modalities} onChange={(v) => set("modality", v)} invalid={Boolean(err(errors, "modality"))} />
      </Field>

      <View style={{ gap: 8 }}>
        <T variant="label">
          Tipo de desarrollo <T variant="label" color={colors.danger}>*</T>
        </T>
        <View style={{ flexDirection: "row", gap: 8 }}>
          {[
            { value: "INDIVIDUAL", label: "Individual", detail: "Trabajas solo/a", icon: User },
            { value: "GRUPAL", label: "En pareja", detail: "Con un compañero/a", icon: Users },
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

      <Field label="Mecanismo de desarrollo" required error={err(errors, "presentationMechanism")}>
        <Select title="Mecanismo de desarrollo" value={values.presentationMechanism ?? ""} options={catalog.mechanisms} onChange={(v) => set("presentationMechanism", v)} invalid={Boolean(err(errors, "presentationMechanism"))} />
      </Field>
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
          Articulación con funciones sustantivas <T variant="label" color={colors.danger}>*</T>
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
      <Field label="Fecha de nacimiento" required error={err(errors, "birthDate")} hint={age !== null ? `Edad: ${age} años.` : undefined}>
        <DateField value={values.birthDate ?? ""} onChange={(v) => set("birthDate", v)} maximumDate={maxBirth} invalid={Boolean(err(errors, "birthDate"))} />
      </Field>
      <Field label="Nacionalidad" required error={err(errors, "nationality")}>
        <Input value={values.nationality ?? ""} onChangeText={(v) => set("nationality", v)} maxLength={60} />
      </Field>
      <Field label="Estado civil" required error={err(errors, "maritalStatus")}>
        <Select title="Estado civil" value={values.maritalStatus ?? ""} options={catalog.maritalStatuses} onChange={(v) => set("maritalStatus", v)} invalid={Boolean(err(errors, "maritalStatus"))} />
      </Field>
      <Field label="Certificado de votación" hint="Opcional." error={err(errors, "votingCertificate")}>
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

export function FormError({ message }: { message?: string }) {
  return message ? <Banner tone="danger">{message}</Banner> : null;
}
