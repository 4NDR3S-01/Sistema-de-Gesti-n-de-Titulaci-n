"use client";

import Link from "next/link";
import { useState, type FormEvent } from "react";
import { WorkflowNavigation } from "@/components/workflow-navigation";

export default function TribunalPage() {
  const [message, setMessage] = useState("");

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const names = [
      formData.get("president")?.toString().trim(),
      formData.get("memberOne")?.toString().trim(),
      formData.get("memberTwo")?.toString().trim(),
    ];
    const normalizedNames = names.map((name) => name?.toLocaleLowerCase());
    const tutor = formData.get("tutor")?.toString().trim().toLocaleLowerCase();

    if (new Set(normalizedNames).size !== normalizedNames.length) {
      setMessage("Los tres integrantes del tribunal deben ser personas distintas.");
      return;
    }

    if (tutor && normalizedNames.includes(tutor)) {
      setMessage(
        "El/la tutor/a participa como observador/a y no puede integrar el tribunal.",
      );
      return;
    }

    const student = formData.get("student")?.toString().trim();
    const date = formData.get("defenseDate")?.toString();
    const time = formData.get("defenseTime")?.toString();
    const place = formData.get("place")?.toString().trim();
    setMessage(
      `Borrador preparado para ${student}, el ${date} a las ${time} en ${place}. No se guarda ni se envía.`,
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
            <span className="workflow-eyebrow">DEFENSA DE TITULACIÓN · BORRADOR</span>
            <h1>Convocatoria y tribunal</h1>
            <p>
              Prepara una vista preliminar con los datos de la convocatoria y
              los integrantes indicados en el memorándum compartido.
            </p>
          </div>
          <span className="draft-badge">Prototipo frontend</span>
        </div>

        <div className="privacy-notice" role="note">
          <strong>Referencia del memorándum</strong>
          <span>
            El tribunal tiene tres integrantes: decano/a o delegado/a que
            preside y dos docentes de la carrera con título de cuarto nivel.
            El/la tutor/a participa como observador/a, sin integrar el tribunal.
          </span>
        </div>

        <form className="record-form" onSubmit={handleSubmit}>
          <section className="form-section" aria-labelledby="defense-section">
            <div className="section-heading">
              <span className="section-number">01</span>
              <div>
                <h2 id="defense-section">Datos de la defensa</h2>
                <p>Información básica para redactar la convocatoria.</p>
              </div>
            </div>
            <div className="field-grid">
              <label className="form-field">
                Estudiante
                <input name="student" required />
              </label>
              <label className="form-field">
                Carrera
                <input name="career" required />
              </label>
              <label className="form-field field-full">
                Tema del trabajo de titulación
                <input name="topic" required />
              </label>
              <label className="form-field">
                Fecha
                <input name="defenseDate" type="date" required />
              </label>
              <label className="form-field">
                Hora
                <input name="defenseTime" type="time" required />
              </label>
              <label className="form-field">
                Lugar
                <input name="place" required />
              </label>
              <label className="form-field">
                Tutor/a (participa como observador/a)
                <input name="tutor" required />
              </label>
            </div>
          </section>

          <section className="form-section" aria-labelledby="jury-section">
            <div className="section-heading">
              <span className="section-number">02</span>
              <div>
                <h2 id="jury-section">Integrantes del tribunal</h2>
                <p>Registrar tres personas distintas según las reglas indicadas.</p>
              </div>
            </div>
            <div className="field-grid">
              <label className="form-field field-full">
                Presidencia · Decano/a de la facultad, sede o extensión, o su delegado/a
                <input name="president" required />
              </label>
              <label className="form-field">
                Docente de la carrera · miembro 1
                <input name="memberOne" required />
              </label>
              <label className="form-field">
                Docente de la carrera · miembro 2
                <input name="memberTwo" required />
              </label>
            </div>
            <fieldset className="check-fieldset">
              <legend>Confirmación de requisitos</legend>
              <div className="checkbox-list">
                <label>
                  <input type="checkbox" name="presidentConfirmed" required />
                  La presidencia corresponde al decano/a o delegado/a.
                </label>
                <label>
                  <input type="checkbox" name="membersConfirmed" required />
                  Los otros dos integrantes son docentes de la carrera con título de cuarto nivel.
                </label>
                <label>
                  <input type="checkbox" name="tutorObserver" required />
                  El/la tutor/a consta solo como observador/a y no como evaluador/a.
                </label>
              </div>
            </fieldset>
            <p className="inline-guidance">
              Según el documento, si un miembro no asiste debe designarse un
              reemplazo de manera inmediata.
            </p>
          </section>

          <div className="form-submit-row">
            <p className="form-message" role="status" aria-live="polite">{message}</p>
            <button className="primary-action" type="submit">
              Preparar borrador <span aria-hidden="true">→</span>
            </button>
          </div>
        </form>
      </section>
    </main>
  );
}
