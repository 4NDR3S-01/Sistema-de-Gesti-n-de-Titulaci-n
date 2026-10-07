"use client";

import Link from "next/link";
import { useState, type FormEvent } from "react";
import { WorkflowNavigation } from "@/components/workflow-navigation";

export default function PapRegistrationPage() {
  const [message, setMessage] = useState("");
  const [articulations, setArticulations] = useState<string[]>([]);

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage(
      "Formulario revisado en esta pantalla. Aún no se guarda: falta conectar el servicio de registro.",
    );
  }

  return (
    <main className="workflow-page">
      <header className="workflow-topbar">
        <Link className="workflow-brand" href="/panel" aria-label="Volver al panel">
          <span className="workflow-brand-icon" aria-hidden="true">GT</span>
          <span><strong>GESTIÓN</strong><small>DE TITULACIÓN</small></span>
        </Link>
        <WorkflowNavigation />
      </header>

      <section className="workflow-content">
        <Link className="back-link" href="/panel">← Volver al panel</Link>
        <div className="workflow-title-row">
          <div>
            <span className="workflow-eyebrow">REGISTRO ACADÉMICO · BORRADOR</span>
            <h1>Modalidad y tema de titulación</h1>
            <p>
              Completa la información de referencia del formulario compartido
              por secretaría. Los campos pueden ajustarse cuando confirmen los
              requisitos oficiales.
            </p>
          </div>
          <span className="draft-badge">Prototipo frontend</span>
        </div>

        <div className="privacy-notice" role="note">
          <strong>Datos de ejemplo y privacidad</strong>
          <span>
            Esta pantalla no envía ni guarda la información. Evita ingresar
            datos personales reales mientras no esté conectada al sistema.
          </span>
        </div>

        <form className="record-form" onSubmit={handleSubmit}>
          <section className="form-section" aria-labelledby="student-section">
            <div className="section-heading">
              <span className="section-number">01</span>
              <div>
                <h2 id="student-section">Información del estudiante</h2>
                <p>Datos académicos y de contacto indicados en el formato.</p>
              </div>
            </div>
            <div className="field-grid">
              <label className="form-field">
                Nombres
                <input name="firstName" autoComplete="given-name" required />
              </label>
              <label className="form-field">
                Apellidos
                <input name="lastName" autoComplete="family-name" required />
              </label>
              <label className="form-field">
                Cédula o documento de identidad
                <input name="identity" autoComplete="off" />
              </label>
              <label className="form-field">
                Fecha de nacimiento
                <input name="birthDate" type="date" />
              </label>
              <label className="form-field">
                Correo institucional
                <input
                  name="institutionalEmail"
                  type="email"
                  autoComplete="email"
                  required
                />
              </label>
              <label className="form-field">
                Teléfono celular
                <input name="phone" type="tel" autoComplete="tel" />
              </label>
              <label className="form-field">
                Facultad / sede
                <input name="faculty" required />
              </label>
              <label className="form-field">
                Carrera
                <input name="career" required />
              </label>
              <label className="form-field">
                Nivel o curso
                <input name="level" />
              </label>
              <label className="form-field">
                Paralelo
                <input name="parallel" />
              </label>
              <label className="form-field">
                Provincia de residencia
                <input name="province" />
              </label>
              <label className="form-field">
                Cantón de residencia
                <input name="canton" />
              </label>
              <label className="form-field">
                Estado civil
                <select name="maritalStatus" defaultValue="">
                  <option value="">Selecciona una opción</option>
                  <option>Soltero/a</option>
                  <option>Casado/a</option>
                  <option>Unión de hecho</option>
                  <option>Divorciado/a</option>
                  <option>Viudo/a</option>
                  <option>Prefiero no indicar</option>
                </select>
              </label>
              <label className="form-field">
                Nacionalidad
                <input name="nationality" />
              </label>
            </div>
            <details className="optional-details">
              <summary>Información opcional de discapacidad</summary>
              <p>
                El formato de referencia incluye esta sección. Es opcional en
                este prototipo; confirma con secretaría si debe recopilarse y
                quién puede acceder a estos datos.
              </p>
              <div className="field-grid">
                <label className="form-field">
                  Tipo de discapacidad
                  <select name="disabilityType" defaultValue="">
                    <option value="">No deseo indicarlo</option>
                    <option>Visual</option>
                    <option>Física</option>
                    <option>Auditiva</option>
                    <option>Intelectual</option>
                    <option>Psicológica</option>
                    <option>Lenguaje</option>
                    <option>Otra</option>
                  </select>
                </label>
                <label className="form-field">
                  Grado (si corresponde)
                  <input name="disabilityDegree" />
                </label>
              </div>
            </details>
          </section>

          <section className="form-section" aria-labelledby="proposal-section">
            <div className="section-heading">
              <span className="section-number">02</span>
              <div>
                <h2 id="proposal-section">Modalidad y propuesta</h2>
                <p>Modalidad, título provisional y descripción del problema.</p>
              </div>
            </div>
            <div className="field-grid">
              <label className="form-field">
                Opción de aprobación previa a titulación
                <select name="modality" defaultValue="" required>
                  <option value="" disabled>Selecciona una modalidad</option>
                  <option value="integracion">
                    Trabajo de Integración Curricular
                  </option>
                  <option value="complexivo">Examen de carácter complexivo</option>
                </select>
              </label>
              <label className="form-field">
                Mecanismo de desarrollo y presentación
                <input name="presentationMechanism" />
              </label>
              <label className="form-field field-full">
                Título provisional del tema o núcleo problémico
                <input name="provisionalTitle" required />
              </label>
              <label className="form-field field-full">
                Problemática del trabajo de integración curricular
                <textarea name="problemDescription" rows={5} required />
              </label>
              <label className="form-field">
                Tutor/a solicitado/a
                <input name="requestedTutor" />
              </label>
            </div>

            <fieldset className="check-fieldset">
              <legend>Articulación con funciones sustantivas</legend>
              <p>Marca las opciones relacionadas con la propuesta.</p>
              <div className="checkbox-list">
                {[
                  ["investigacion", "Investigación"],
                  ["vinculacion", "Vinculación"],
                  ["docencia", "Asignaturas (docencia)"],
                  ["ninguna", "Ninguna"],
                ].map(([value, label]) => (
                  <label key={value}>
                    <input
                      type="checkbox"
                      name="articulation"
                      value={value}
                      checked={articulations.includes(value)}
                      onChange={(event) => {
                        const checked = event.target.checked;
                        setArticulations((current) => {
                          if (value === "ninguna") {
                            return checked ? ["ninguna"] : [];
                          }

                          const selections = current.filter(
                            (selection) => selection !== "ninguna",
                          );
                          return checked
                            ? [...selections, value]
                            : selections.filter((selection) => selection !== value);
                        });
                      }}
                    />
                    {label}
                  </label>
                ))}
              </div>
            </fieldset>
          </section>

          <div className="form-submit-row">
            <p className="form-message" role="status" aria-live="polite">{message}</p>
            <button className="primary-action" type="submit">
              Revisar formulario <span aria-hidden="true">→</span>
            </button>
          </div>
        </form>
      </section>
    </main>
  );
}
