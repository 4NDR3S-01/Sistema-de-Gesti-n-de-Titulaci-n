"use client";

import Link from "next/link";
import { useActionState, useState } from "react";
import { ChevronRight, Save, Users, User } from "lucide-react";
import { Field, FormMessage, SubmitButton } from "@/components/form-controls";
import { initialFormState, type FormState } from "@/lib/form-state";
import {
  ageFrom,
  disabilityTypes,
  ecuadorProvinces,
  maritalStatuses,
  patArticulations,
  patLevels,
  patMechanisms,
  patModalities,
  patParallels,
} from "@/lib/pat-options";

type Action = (state: FormState, formData: FormData) => Promise<FormState>;
type Values = Record<string, string>;
type Errors = Record<string, string[] | undefined>;

function Options({ values, placeholder }: { values: readonly string[]; placeholder: string }) {
  return (
    <>
      <option value="">{placeholder}</option>
      {values.map((value) => (
        <option value={value} key={value}>
          {value}
        </option>
      ))}
    </>
  );
}

function useFormValues(action: Action, initial: Values) {
  const [state, formAction] = useActionState(action, initialFormState);
  const value = (name: string) => state.values?.[name] ?? initial[name] ?? "";
  return { state, formAction, value, errors: (state.errors ?? {}) as Errors };
}

function GroupIntro({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="form-group-intro">
      <h2>{title}</h2>
      <p>{children}</p>
    </div>
  );
}

/* --------------------------------------------------------------- Datos */

function PersonalFields({ value, errors }: { value: (name: string) => string; errors: Errors }) {
  const [birthDate, setBirthDate] = useState(value("birthDate"));
  const age = ageFrom(birthDate);

  return (
    <div className="form-grid">
      <Field label="Nivel" name="level" error={errors.level} required>
        <select id="level" name="level" defaultValue={value("level")} required>
          <Options values={patLevels} placeholder="Selecciona tu nivel" />
        </select>
      </Field>
      <Field label="Paralelo" name="parallel" error={errors.parallel} required>
        <select id="parallel" name="parallel" defaultValue={value("parallel")} required>
          <Options values={patParallels} placeholder="Selecciona tu paralelo" />
        </select>
      </Field>
      <Field
        label="Fecha de nacimiento"
        name="birthDate"
        error={errors.birthDate}
        hint={age !== null ? `Edad: ${age} años.` : undefined}
        required
      >
        <input
          id="birthDate"
          name="birthDate"
          type="date"
          value={birthDate}
          onChange={(event) => setBirthDate(event.target.value)}
          required
        />
      </Field>
      <Field label="Nacionalidad" name="nationality" error={errors.nationality} required>
        <input id="nationality" name="nationality" defaultValue={value("nationality") || "Ecuatoriana"} maxLength={60} required />
      </Field>
      <Field label="Estado civil" name="maritalStatus" error={errors.maritalStatus} required>
        <select id="maritalStatus" name="maritalStatus" defaultValue={value("maritalStatus")} required>
          <Options values={maritalStatuses} placeholder="Selecciona una opción" />
        </select>
      </Field>
      <Field label="Certificado de votación" name="votingCertificate" error={errors.votingCertificate} hint="Opcional.">
        <input id="votingCertificate" name="votingCertificate" defaultValue={value("votingCertificate")} maxLength={30} />
      </Field>
      <Field label="Provincia de residencia" name="province" error={errors.province} required>
        <select id="province" name="province" defaultValue={value("province") || "Manabí"} required>
          <Options values={ecuadorProvinces} placeholder="Selecciona la provincia" />
        </select>
      </Field>
      <Field label="Cantón de residencia" name="canton" error={errors.canton} required>
        <input id="canton" name="canton" defaultValue={value("canton")} maxLength={80} placeholder="Ej. Manta" required />
      </Field>
      <Field label="Parroquia de residencia" name="parish" error={errors.parish} hint="Opcional.">
        <input id="parish" name="parish" defaultValue={value("parish")} maxLength={80} placeholder="Ej. Tarqui" />
      </Field>
      <details className="disclosure field-full" open={Boolean(value("disabilityType"))}>
        <summary>
          <ChevronRight aria-hidden="true" /> Discapacidad (solo si aplica)
        </summary>
        <div className="disclosure-body form-grid">
          <Field label="Tipo de discapacidad" name="disabilityType" error={errors.disabilityType}>
            <select id="disabilityType" name="disabilityType" defaultValue={value("disabilityType")}>
              <Options values={disabilityTypes} placeholder="Ninguna" />
            </select>
          </Field>
          <Field label="Grado (%)" name="disabilityDegree" error={errors.disabilityDegree}>
            <input id="disabilityDegree" name="disabilityDegree" type="number" min={1} max={100} defaultValue={value("disabilityDegree")} />
          </Field>
        </div>
      </details>
    </div>
  );
}

/* --------------------------------------------------------------- Propuesta */

function ProposalFields({
  value,
  errors,
  warnGroupChange,
}: {
  value: (name: string) => string;
  errors: Errors;
  warnGroupChange?: boolean;
}) {
  const [participation, setParticipation] = useState(value("participationType") || "INDIVIDUAL");
  const [articulations, setArticulations] = useState<string[]>(value("articulations").split(",").filter(Boolean));
  const [problemLength, setProblemLength] = useState(value("problem").length);

  function toggleArticulation(option: string, checked: boolean) {
    setArticulations((current) => {
      if (option === "ninguna") return checked ? ["ninguna"] : [];
      const rest = current.filter((item) => item !== "ninguna" && item !== option);
      return checked ? [...rest, option] : rest;
    });
  }

  return (
    <div className="form-grid">
      <Field label="Modalidad" name="modality" error={errors.modality} className="field-full" required>
        <select id="modality" name="modality" defaultValue={value("modality")} required>
          <Options values={patModalities} placeholder="Selecciona la modalidad" />
        </select>
      </Field>

      <div className="field field-full" role="radiogroup" aria-labelledby="participation-label">
        <span className="field-label" id="participation-label">
          Tipo de desarrollo <span className="field-required" aria-hidden="true">*</span>
        </span>
        <div className="choice-segmented">
          {[
            ["INDIVIDUAL", "Individual", "Trabajas solo/a", User],
            ["GRUPAL", "En pareja", "Con un compañero/a de tu carrera", Users],
          ].map(([option, title, detail, Icon]) => {
            const IconComponent = Icon as typeof User;
            return (
              <label className="choice" key={option as string}>
                <input
                  type="radio"
                  name="participationType"
                  value={option as string}
                  checked={participation === option}
                  onChange={() => setParticipation(option as string)}
                />
                <IconComponent aria-hidden="true" className="choice-icon" />
                <span>
                  <strong>{title as string}</strong>
                  <small>{detail as string}</small>
                </span>
              </label>
            );
          })}
        </div>
        {participation === "GRUPAL" && (
          <span className="field-hint">
            Después de guardar podrás buscar e invitar a tu compañero/a. Él o ella verá el mismo registro.
          </span>
        )}
        {warnGroupChange && participation === "INDIVIDUAL" && (
          <span className="field-error">Al guardar como individual se quitará a tu compañero/a del registro.</span>
        )}
      </div>

      <Field label="Mecanismo de desarrollo" name="presentationMechanism" error={errors.presentationMechanism} required>
        <select id="presentationMechanism" name="presentationMechanism" defaultValue={value("presentationMechanism")} required>
          <Options values={patMechanisms} placeholder="Selecciona el mecanismo" />
        </select>
      </Field>
      <Field label="Tutor/a sugerido/a" name="requestedTutor" error={errors.requestedTutor} hint="Opcional.">
        <input id="requestedTutor" name="requestedTutor" defaultValue={value("requestedTutor")} maxLength={150} placeholder="Nombre del docente" />
      </Field>
      <Field label="Título provisional del tema" name="title" error={errors.title} className="field-full" required>
        <input id="title" name="title" defaultValue={value("title")} maxLength={255} required />
      </Field>
      <Field
        label="Problemática"
        name="problem"
        error={errors.problem}
        hint="El problema central, a quién afecta y por qué es relevante. Mínimo 80 caracteres."
        className="field-full"
        required
      >
        <textarea
          id="problem"
          name="problem"
          rows={7}
          defaultValue={value("problem")}
          maxLength={4000}
          onChange={(event) => setProblemLength(event.target.value.length)}
          required
        />
      </Field>
      <span className={`counter field-full tabular${problemLength > 0 && problemLength < 80 ? " is-short" : ""}`} aria-live="polite">
        {problemLength} / 4000
      </span>

      <div className={`field field-full${errors.articulations?.length ? " has-error" : ""}`}>
        <span className="field-label" id="articulations-label">
          Articulación con funciones sustantivas <span className="field-required" aria-hidden="true">*</span>
        </span>
        <div className="choice-list" role="group" aria-labelledby="articulations-label">
          {patArticulations.map((option) => (
            <label className="choice" key={option.value}>
              <input
                type="checkbox"
                name="articulations"
                value={option.value}
                checked={articulations.includes(option.value)}
                onChange={(event) => toggleArticulation(option.value, event.target.checked)}
              />
              <span>{option.label}</span>
            </label>
          ))}
        </div>
        {errors.articulations?.length ? <span className="field-error">{errors.articulations[0]}</span> : null}
      </div>
    </div>
  );
}

/* --------------------------------------------------------------- Formularios */

/** Primer paso: crea el borrador con la propuesta y los datos de quien lo inicia. */
export function PatCreateForm({ action }: { action: Action }) {
  const { state, formAction, value, errors } = useFormValues(action, {});
  return (
    <form className="form-card" action={formAction} key={state.submittedAt} noValidate>
      <FormMessage state={state} />
      <fieldset className="form-group">
        <GroupIntro title="Propuesta">
          Modalidad, tema y problemática. Si trabajas en pareja, tu compañero/a verá esta misma propuesta.
        </GroupIntro>
        <ProposalFields value={value} errors={errors} />
      </fieldset>
      <fieldset className="form-group">
        <GroupIntro title="Tus datos informativos">
          Datos del formato oficial que no están en tu ficha. Cada integrante completa los suyos.
        </GroupIntro>
        <PersonalFields value={value} errors={errors} />
      </fieldset>
      <p className="form-note">
        Se guarda como borrador: aún no llega a secretaría. Después agregarás integrantes (si aplica) y firmarás.
      </p>
      <div className="form-actions">
        <Link className="btn btn-ghost" href="/panel">
          Cancelar
        </Link>
        <SubmitButton pendingLabel="Guardando…">
          <Save aria-hidden="true" /> Guardar borrador
        </SubmitButton>
      </div>
    </form>
  );
}

export function PatProposalForm({
  action,
  initial,
  hasTeammate,
  signed,
}: {
  action: Action;
  initial: Values;
  hasTeammate: boolean;
  signed: boolean;
}) {
  const { state, formAction, value, errors } = useFormValues(action, initial);
  return (
    <form className="form-card" action={formAction} key={state.submittedAt} noValidate>
      <FormMessage state={state} />
      {signed && (
        <p className="form-warning">
          Al guardar cambios se anularán las firmas y el escaneado: todos deberán firmar de nuevo.
        </p>
      )}
      <fieldset className="form-group">
        <GroupIntro title="Propuesta">Lo que cambies aquí lo verán todos los integrantes.</GroupIntro>
        <ProposalFields value={value} errors={errors} warnGroupChange={hasTeammate} />
      </fieldset>
      <div className="form-actions">
        <Link className="btn btn-ghost" href="/registro-pat-2">
          Cancelar
        </Link>
        <SubmitButton pendingLabel="Guardando…">
          <Save aria-hidden="true" /> Guardar propuesta
        </SubmitButton>
      </div>
    </form>
  );
}

export function PatPersonalForm({
  action,
  initial,
  signed,
}: {
  action: Action;
  initial: Values;
  signed: boolean;
}) {
  const { state, formAction, value, errors } = useFormValues(action, initial);
  return (
    <form className="form-card" action={formAction} key={state.submittedAt} noValidate>
      <FormMessage state={state} />
      {signed && <p className="form-warning">Al guardar cambios tu firma se borrará y deberás firmar de nuevo.</p>}
      <fieldset className="form-group">
        <GroupIntro title="Tus datos informativos">
          Aparecen en tu página del formato PAT-04-F-002. Tus datos de contacto se toman de{" "}
          <Link href="/perfil">Mis datos</Link>.
        </GroupIntro>
        <PersonalFields value={value} errors={errors} />
      </fieldset>
      <div className="form-actions">
        <Link className="btn btn-ghost" href="/registro-pat-2">
          Cancelar
        </Link>
        <SubmitButton pendingLabel="Guardando…">
          <Save aria-hidden="true" /> Guardar mis datos
        </SubmitButton>
      </div>
    </form>
  );
}
