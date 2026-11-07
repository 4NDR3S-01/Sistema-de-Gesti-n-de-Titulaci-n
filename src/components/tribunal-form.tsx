"use client";

import { useActionState, useState } from "react";
import { Gavel } from "lucide-react";
import { Field, FormMessage, SubmitButton } from "@/components/form-controls";
import { initialFormState, type FormState } from "@/lib/form-state";

type Candidate = {
  registration_id: number;
  student_name: string;
  cedula: string | null;
  career: string;
  title: string;
  requested_tutor: string | null;
};

export function TribunalForm({
  action,
  candidates,
  preselected,
  minDate,
}: {
  action: (state: FormState, formData: FormData) => Promise<FormState>;
  candidates: Candidate[];
  preselected?: number;
  minDate: string;
}) {
  const [state, formAction] = useActionState(action, initialFormState);
  const errors = state.errors ?? {};
  const value = (name: string) => state.values?.[name] ?? "";
  const [selected, setSelected] = useState(value("registrationId") || (preselected ? String(preselected) : ""));
  const candidate = candidates.find((item) => String(item.registration_id) === selected);
  const [tutor, setTutor] = useState(value("tutor") || candidate?.requested_tutor || "");

  return (
    <form className="form-card" action={formAction} key={state.submittedAt} noValidate>
      <FormMessage state={state} />

      <fieldset className="form-group">
        <div className="form-group-intro">
          <h2>Defensa</h2>
          <p>Estudiante con tema aprobado, y fecha, hora y lugar de la sustentación.</p>
        </div>
        <div className="form-grid">
          <Field label="Estudiante" name="registrationId" error={errors.registrationId} className="field-full" required>
            <select
              id="registrationId"
              name="registrationId"
              value={selected}
              onChange={(event) => {
                setSelected(event.target.value);
                const next = candidates.find((item) => String(item.registration_id) === event.target.value);
                if (next?.requested_tutor && !tutor) setTutor(next.requested_tutor);
              }}
              required
            >
              <option value="">Selecciona un estudiante</option>
              {candidates.map((item) => (
                <option value={item.registration_id} key={item.registration_id}>
                  {item.student_name} ({item.career})
                </option>
              ))}
            </select>
          </Field>
          {candidate && (
            <dl className="readonly-grid field-full">
              <div className="is-wide">
                <dt>Tema aprobado</dt>
                <dd>{candidate.title}</dd>
              </div>
            </dl>
          )}
          <Field label="Fecha" name="defenseDate" error={errors.defenseDate} required>
            <input id="defenseDate" name="defenseDate" type="date" min={minDate} defaultValue={value("defenseDate")} required />
          </Field>
          <Field label="Hora" name="defenseTime" error={errors.defenseTime} required>
            <input id="defenseTime" name="defenseTime" type="time" defaultValue={value("defenseTime")} required />
          </Field>
          <Field label="Lugar" name="place" error={errors.place} className="field-full" required>
            <input id="place" name="place" defaultValue={value("place")} maxLength={200} placeholder="Ej. Auditorio FACCI, edificio B01" required />
          </Field>
        </div>
      </fieldset>

      <fieldset className="form-group">
        <div className="form-group-intro">
          <h2>Integrantes</h2>
          <p>
            Tres personas distintas: quien preside y dos docentes de la carrera con título de cuarto
            nivel. El tutor/a asiste como observador/a.
          </p>
        </div>
        <div className="form-grid">
          <Field
            label="Presidencia"
            name="president"
            error={errors.president}
            hint="Decano/a de la facultad, sede o extensión, o su delegado/a."
            className="field-full"
            required
          >
            <input id="president" name="president" defaultValue={value("president")} maxLength={150} required />
          </Field>
          <Field label="Docente evaluador 1" name="memberOne" error={errors.memberOne} required>
            <input id="memberOne" name="memberOne" defaultValue={value("memberOne")} maxLength={150} required />
          </Field>
          <Field label="Docente evaluador 2" name="memberTwo" error={errors.memberTwo} required>
            <input id="memberTwo" name="memberTwo" defaultValue={value("memberTwo")} maxLength={150} required />
          </Field>
          <Field
            label="Tutor/a (observador/a)"
            name="tutor"
            error={errors.tutor}
            hint={candidate?.requested_tutor ? `Sugerido por el estudiante: ${candidate.requested_tutor}.` : undefined}
            className="field-full"
            required
          >
            <input id="tutor" name="tutor" value={tutor} onChange={(event) => setTutor(event.target.value)} maxLength={150} required />
          </Field>

          <div className="field field-full">
            <span className="field-label">Confirmación de requisitos</span>
            <div className="choice-list">
              {[
                ["confirmPresident", "La presidencia corresponde al decano/a o a su delegado/a."],
                ["confirmMembers", "Los dos docentes son de la carrera y tienen título de cuarto nivel."],
                ["confirmTutor", "El tutor/a consta solo como observador/a, no como evaluador/a."],
              ].map(([name, text]) => (
                <label className="choice" key={name}>
                  <input type="checkbox" name={name} defaultChecked={value(name) === "on"} />
                  <span>
                    {text}
                    {errors[name]?.length ? (
                      <small className="field-error" style={{ display: "block" }}>
                        {errors[name]?.[0]}
                      </small>
                    ) : null}
                  </span>
                </label>
              ))}
            </div>
          </div>
        </div>
      </fieldset>

      <div className="form-actions">
        <SubmitButton pendingLabel="Guardando…">
          <Gavel aria-hidden="true" /> Asignar tribunal
        </SubmitButton>
      </div>
    </form>
  );
}
