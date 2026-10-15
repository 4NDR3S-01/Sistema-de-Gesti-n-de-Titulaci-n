"use client";

import Link from "next/link";
import { useState, type FormEvent } from "react";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";

export default function PatRegistrationPage() {
  const [message, setMessage] = useState("");
  const [articulations, setArticulations] = useState<string[]>([]);
  const [participationType, setParticipationType] = useState<string>("Individual");
  const [isGenerated, setIsGenerated] = useState(false);
  const [formData, setFormData] = useState<Record<string, string>>({});
  const [isDownloading, setIsDownloading] = useState(false);

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    const values: Record<string, string> = {};
    data.forEach((value, key) => {
      values[key] = value.toString();
    });
    values.articulations = articulations.join(", ");
    setFormData(values);
    setIsGenerated(true);
    setMessage(
      "¡Formulario validado con éxito según el formato oficial PAT-04-F-002! Ya puedes descargar tu documento PDF oficial."
    );
  }

  async function handleDownloadPDF() {
    const input = document.getElementById("official-pat-document");
    if (!input) return;
    setIsDownloading(true);
    try {
      const canvas = await html2canvas(input, { scale: 2, useCORS: true });
      const imgData = canvas.toDataURL("image/png");
      const pdf = new jsPDF("p", "mm", "a4");
      const imgWidth = 210;
      const pageHeight = 295;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      let heightLeft = imgHeight;
      let position = 0;

      pdf.addImage(imgData, "PNG", 0, position, imgWidth, imgHeight);
      heightLeft -= pageHeight;

      while (heightLeft >= 0) {
        position = heightLeft - imgHeight;
        pdf.addPage();
        pdf.addImage(imgData, "PNG", 0, position, imgWidth, imgHeight);
        heightLeft -= pageHeight;
      }

      pdf.save("Formato_PAT_04_F-002.pdf");
    } catch (error) {
      console.error("Error al generar PDF:", error);
    } finally {
      setIsDownloading(false);
    }
  }

  return (
    <section className="workflow-content">
      <Link className="back-link" href="/panel">← Volver al panel</Link>
      <div className="workflow-title-row">
        <div>
          <span className="workflow-eyebrow">FORMATO OFICIAL PAT-04-F-002</span>
          <h1>Registro de modalidad y tema de titulación</h1>
          <p>
            Complete la información informativa y de propuesta requerida por la
            comisión académica para la aprobación del tema de titulación.
          </p>
        </div>
        <span className="draft-badge">Formulario Oficial PAT</span>
      </div>

      <div className="privacy-notice" role="note">
        <strong>Instrucciones del formato PAT-04-F-002</strong>
        <span>
          Este formulario permite registrar postulaciones individuales o grupales.
          Al validar, el sistema generará automáticamente el documento oficial en PDF con la estructura idéntica a la plantilla institucional ULEAM.
        </span>
      </div>

      {isGenerated && (
        <div
          className="form-section"
          style={{
            borderColor: "#138c88",
            background: "#f4fbfb",
            marginBottom: "24px",
          }}
        >
          <div className="section-heading">
            <span className="section-number" style={{ background: "#138c88", color: "#fff" }}>✓</span>
            <div>
              <h2>Documento oficial PAT-04-F-002 listo</h2>
              <p>Su formulario ha sido procesado con la estructura institucional. Puede descargar el archivo PDF oficial abajo.</p>
            </div>
          </div>
          <div style={{ display: "flex", gap: "12px", flexWrap: "wrap", marginTop: "16px" }}>
            <button
              type="button"
              className="primary-action"
              onClick={handleDownloadPDF}
              disabled={isDownloading}
            >
              {isDownloading ? "Generando PDF..." : "📥 Descargar PDF Oficial (PAT-04-F-002)"}
            </button>
            <button
              type="button"
              className="sign-out-button"
              onClick={() => setIsGenerated(false)}
            >
              Modificar datos
            </button>
          </div>
        </div>
      )}

      <form className="record-form" onSubmit={handleSubmit}>
        {/* Sección 01: Información del estudiante */}
        <section className="form-section" aria-labelledby="student-section">
          <div className="section-heading">
            <span className="section-number">01</span>
            <div>
              <h2 id="student-section">Datos informativos del estudiante (Postulante 1)</h2>
              <p>Facultad, carrera, datos personales y de ubicación con opciones estandarizadas.</p>
            </div>
          </div>
          <div className="field-grid">
            <label className="form-field">
              Facultad / Extensión / Sede
              <select name="faculty" defaultValue={formData.faculty || ""} required>
                <option value="" disabled>Selecciona una facultad</option>
                <option value="Facultad de Ciencias Informáticas (FACCI)">Facultad de Ciencias Informáticas (FACCI)</option>
                <option value="Facultad de Ingeniería">Facultad de Ingeniería</option>
                <option value="Facultad de Ciencias Administrativas, Contables y Comercio">Facultad de Ciencias Administrativas, Contables y Comercio</option>
                <option value="Facultad de Ciencias de la Educación">Facultad de Ciencias de la Educación</option>
                <option value="Facultad de Ciencias Médicas">Facultad de Ciencias Médicas</option>
                <option value="Facultad de Derecho">Facultad de Derecho</option>
                <option value="Otra Facultad / Extensión">Otra Facultad / Extensión</option>
              </select>
            </label>
            <label className="form-field">
              Carrera
              <select name="career" defaultValue={formData.career || ""} required>
                <option value="" disabled>Selecciona una carrera</option>
                <option value="Ingeniería de Software">Ingeniería de Software</option>
                <option value="Tecnologías de la Información">Tecnologías de la Información</option>
                <option value="Ingeniería en Sistemas">Ingeniería en Sistemas</option>
                <option value="Administración de Empresas">Administración de Empresas</option>
                <option value="Contabilidad y Auditoría">Contabilidad y Auditoría</option>
                <option value="Derecho">Derecho</option>
                <option value="Enfermería">Enfermería</option>
                <option value="Otra Carrera">Otra Carrera</option>
              </select>
            </label>
            <label className="form-field">
              Nombres y Apellidos del Postulante Principal
              <input name="firstName" autoComplete="name" required placeholder="Nombres y apellidos completos" defaultValue={formData.firstName || ""} />
            </label>
            <label className="form-field">
              Cédula de Ciudadanía
              <input name="identity" autoComplete="off" required placeholder="Número de cédula (10 dígitos)" defaultValue={formData.identity || ""} />
            </label>
            <label className="form-field">
              Nivel / Curso
              <select name="level" defaultValue={formData.level || ""} required>
                <option value="" disabled>Selecciona el nivel</option>
                <option value="Primer Nivel">Primer Nivel</option>
                <option value="Segundo Nivel">Segundo Nivel</option>
                <option value="Tercer Nivel">Tercer Nivel</option>
                <option value="Cuarto Nivel">Cuarto Nivel</option>
                <option value="Quinto Nivel">Quinto Nivel</option>
                <option value="Sexto Nivel">Sexto Nivel</option>
                <option value="Séptimo Nivel">Séptimo Nivel</option>
                <option value="Octavo Nivel">Octavo Nivel</option>
                <option value="Noveno Nivel">Noveno Nivel</option>
                <option value="Décimo Nivel / Egresado">Décimo Nivel / Egresado</option>
              </select>
            </label>
            <label className="form-field">
              Paralelo
              <select name="parallel" defaultValue={formData.parallel || ""} required>
                <option value="" disabled>Selecciona el paralelo</option>
                <option value="A">Paralelo A</option>
                <option value="B">Paralelo B</option>
                <option value="C">Paralelo C</option>
                <option value="D">Paralelo D</option>
                <option value="U">Paralelo Único</option>
              </select>
            </label>
            <label className="form-field">
              Fecha de Nacimiento
              <input name="birthDate" type="date" required defaultValue={formData.birthDate || ""} />
            </label>
            <label className="form-field">
              Edad
              <input name="age" type="number" placeholder="Ej. 23" required defaultValue={formData.age || ""} />
            </label>
            <label className="form-field">
              Sexo
              <select name="sex" defaultValue={formData.sex || ""} required>
                <option value="" disabled>Selecciona una opción</option>
                <option value="Masculino">Masculino</option>
                <option value="Femenino">Femenino</option>
                <option value="Otro">Otro</option>
              </select>
            </label>
            <label className="form-field">
              Nacionalidad
              <input name="nationality" placeholder="Ej. Ecuatoriana" defaultValue={formData.nationality || "Ecuatoriana"} required />
            </label>
            <label className="form-field">
              Estado Civil
              <select name="maritalStatus" defaultValue={formData.maritalStatus || ""} required>
                <option value="" disabled>Selecciona una opción</option>
                <option value="Soltero/a">Soltero/a</option>
                <option value="Casado/a">Casado/a</option>
                <option value="Unión de hecho">Unión de hecho</option>
                <option value="Divorciado/a">Divorciado/a</option>
                <option value="Viudo/a">Viudo/a</option>
                <option value="Prefiero no indicar">Prefiero no indicar</option>
              </select>
            </label>
            <label className="form-field">
              N° de Certificado de Votación
              <input name="votingCertificate" placeholder="Número de papeleta" defaultValue={formData.votingCertificate || ""} />
            </label>
            <label className="form-field">
              Provincia de residencia
              <select name="province" defaultValue={formData.province || ""} required>
                <option value="" disabled>Selecciona la provincia</option>
                <option value="Manabí">Manabí</option>
                <option value="Pichincha">Pichincha</option>
                <option value="Guayas">Guayas</option>
                <option value="Esmeraldas">Esmeraldas</option>
                <option value="Santo Domingo de los Tsáchilas">Santo Domingo de los Tsáchilas</option>
                <option value="Los Ríos">Los Ríos</option>
                <option value="Otra Provincia">Otra Provincia</option>
              </select>
            </label>
            <label className="form-field">
              Cantón de residencia
              <select name="canton" defaultValue={formData.canton || ""} required>
                <option value="" disabled>Selecciona el cantón</option>
                <option value="Portoviejo">Portoviejo</option>
                <option value="Manta">Manta</option>
                <option value="Chone">Chone</option>
                <option value="Jipijapa">Jipijapa</option>
                <option value="Montecristi">Montecristi</option>
                <option value="El Carmen">El Carmen</option>
                <option value="Sucre">Sucre</option>
                <option value="Pedernales">Pedernales</option>
                <option value="Otro Cantón">Otro Cantón</option>
              </select>
            </label>
            <label className="form-field">
              Parroquia de residencia
              <input name="parish" placeholder="Ej. 12 de Marzo / Tarqui" defaultValue={formData.parish || ""} />
            </label>
            <label className="form-field">
              Correo Electrónico 1 (Institucional)
              <input name="institutionalEmail" type="email" autoComplete="email" required placeholder="correo@uleam.edu.ec" defaultValue={formData.institutionalEmail || ""} />
            </label>
            <label className="form-field">
              Correo Electrónico 2 (Personal / Alternativo)
              <input name="secondaryEmail" type="email" placeholder="correo_personal@gmail.com" defaultValue={formData.secondaryEmail || ""} />
            </label>
            <label className="form-field">
              Teléfono Celular
              <input name="phone" type="tel" autoComplete="tel" placeholder="0999999999" required defaultValue={formData.phone || ""} />
            </label>
            <label className="form-field">
              Teléfono Convencional
              <input name="landline" type="tel" placeholder="052999999" defaultValue={formData.landline || ""} />
            </label>
          </div>

          <details className="optional-details">
            <summary>Información de discapacidad (Opcional)</summary>
            <p>
              Si aplica según el formato oficial PAT-04-F-002, detalle el tipo y grado de discapacidad.
            </p>
            <div className="field-grid">
              <label className="form-field">
                Tipo de discapacidad
                <select name="disabilityType" defaultValue={formData.disabilityType || ""}>
                  <option value="">Ninguna / No deseo indicarlo</option>
                  <option value="Visual">Visual</option>
                  <option value="Física">Física</option>
                  <option value="Auditiva">Auditiva</option>
                  <option value="Intelectual">Intelectual</option>
                  <option value="Psicológica">Psicológica</option>
                  <option value="Lengua">Lengua</option>
                  <option value="Otras">Otras</option>
                </select>
              </label>
              <label className="form-field">
                Grado de Discapacidad (%)
                <input name="disabilityDegree" placeholder="Ej. 45%" defaultValue={formData.disabilityDegree || ""} />
              </label>
            </div>
          </details>
        </section>

        {/* Sección 02: Modalidad y propuesta */}
        <section className="form-section" aria-labelledby="proposal-section">
          <div className="section-heading">
            <span className="section-number">02</span>
            <div>
              <h2 id="proposal-section">Modalidad y propuesta de titulación</h2>
              <p>Selección de modalidad, tipo de desarrollo (individual o grupal), coautores, título y problemática.</p>
            </div>
          </div>
          <div className="field-grid">
            <label className="form-field">
              Modalidad (Opción de aprobación previo a titulación)
              <select name="modality" defaultValue={formData.modality || ""} required>
                <option value="" disabled>Selecciona la modalidad oficial</option>
                <option value="Trabajo de Integración Curricular - Proyecto de Investigación">Trabajo de Integración Curricular - Proyecto de Investigación</option>
                <option value="Trabajo de Integración Curricular - Desarrollo Tecnológico / Software">Trabajo de Integración Curricular - Desarrollo Tecnológico / Software</option>
                <option value="Trabajo de Integración Curricular - Artículo Académico / Científico">Trabajo de Integración Curricular - Artículo Académico / Científico</option>
                <option value="Trabajo de Integración Curricular - Proyecto de Vinculación">Trabajo de Integración Curricular - Proyecto de Vinculación</option>
                <option value="Trabajo de Integración Curricular - Emprendimiento / Plan de Negocios">Trabajo de Integración Curricular - Emprendimiento / Plan de Negocios</option>
                <option value="Examen de Carácter Complexivo (Unidades de Análisis)">Examen de Carácter Complexivo (Unidades de Análisis)</option>
              </select>
            </label>

            <label className="form-field">
              Tipo de Desarrollo (Individual / Grupal)
              <select
                name="participationType"
                value={participationType}
                onChange={(e) => setParticipationType(e.target.value)}
                required
              >
                <option value="Individual">Individual (1 estudiante)</option>
                <option value="Grupal">Grupal (2 estudiantes)</option>
              </select>
            </label>

            {participationType === "Grupal" && (
              <label className="form-field field-full">
                Nombres, Apellidos y Cédula del Segundo Estudiante (Compañero / Coautor/a)
                <input
                  name="teammateInfo"
                  placeholder="Ej. María Pérez López - Cédula: 1300000002"
                  required
                  defaultValue={formData.teammateInfo || ""}
                />
              </label>
            )}

            <label className="form-field">
              Mecanismo de desarrollo y presentación
              <select name="presentationMechanism" defaultValue={formData.presentationMechanism || ""} required>
                <option value="" disabled>Selecciona el mecanismo</option>
                <option value="Proyecto de Investigación">Proyecto de Investigación</option>
                <option value="Proyecto de Vinculación con la Sociedad">Proyecto de Vinculación con la Sociedad</option>
                <option value="Artículo Académico / Científico">Artículo Académico / Científico</option>
                <option value="Desarrollo Tecnológico / Software">Desarrollo Tecnológico / Software</option>
                <option value="Examen Complexivo Teórico-Práctico">Examen Complexivo Teórico-Práctico</option>
              </select>
            </label>

            <label className="form-field">
              Tutor/a solicitado/a
              <input name="requestedTutor" placeholder="Nombre del docente tutor sugerido" defaultValue={formData.requestedTutor || ""} />
            </label>

            <label className="form-field field-full">
              Título provisional del tema propuesto o núcleo problémico
              <input name="provisionalTitle" required placeholder="Título claro y conciso del trabajo de titulación" defaultValue={formData.provisionalTitle || ""} />
            </label>

            <label className="form-field field-full">
              Problemática del trabajo de integración curricular
              <textarea name="problemDescription" rows={5} required placeholder="Describa el problema central que abordará la investigación..." defaultValue={formData.problemDescription || ""} />
            </label>
          </div>

          <fieldset className="check-fieldset">
            <legend>Articulación del trabajo con funciones sustantivas</legend>
            <p>Marque las opciones con las que se articula su propuesta de trabajo de integración curricular.</p>
            <div className="checkbox-list">
              {[
                ["investigacion", "Trabajo de Integración Curricular se articula con proyectos y programas de Investigación"],
                ["vinculacion", "Trabajo de Integración Curricular se articula con proyectos y programas de Vinculación"],
                ["docencia", "Trabajo de Integración Curricular se articula con proyectos de asignaturas (Docencia)"],
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
            Validar y preparar formato PAT-04-F-002 <span aria-hidden="true">→</span>
          </button>
        </div>
      </form>

      {/* PLANTILLA OFICIAL EXACTA PAT-04-F-002 CON LOGO ULEAM Y TABLAS INSTITUCIONALES */}
      <div style={{ position: "absolute", left: "-9999px", top: "-9999px" }}>
        <div
          id="official-pat-document"
          style={{
            width: "210mm",
            padding: "15mm",
            background: "#ffffff",
            color: "#000000",
            fontFamily: "Arial, sans-serif",
            fontSize: "8.5pt",
            lineHeight: "1.25",
          }}
        >
          {/* Header Table with Uleam Logo & Official Document Header */}
          <table style={{ width: "100%", borderCollapse: "collapse", border: "1px solid #000", marginBottom: "12px" }}>
            <tbody>
              <tr>
                <td style={{ border: "1px solid #000", width: "18%", textAlign: "center", padding: "6px", verticalAlign: "middle" }}>
                  <div style={{ fontWeight: "bold", color: "#c00", fontSize: "14pt", letterSpacing: "-1px" }}>Uleam</div>
                  <div style={{ fontSize: "5.5pt", fontWeight: "bold", color: "#444", lineHeight: "1" }}>UNIVERSIDAD LAICA ELOY ALFARO DE MANABÍ</div>
                </td>
                <td style={{ border: "1px solid #000", width: "52%", padding: "6px", verticalAlign: "middle" }}>
                  <div style={{ fontSize: "6.5pt", fontWeight: "bold", color: "#333" }}>NOMBRE DEL DOCUMENTO:</div>
                  <div style={{ fontSize: "7.5pt", fontWeight: "bold", textTransform: "uppercase" }}>REGISTRO DE MODALIDAD Y TEMA O NÚCLEO PROBLÉMICO DE INVESTIGACIÓN.</div>
                  <div style={{ fontSize: "6.5pt", marginTop: "3px", color: "#444" }}>PROCEDIMIENTO: TITULACIÓN DE ESTUDIANTES DE GRADO BAJO LA UNIDAD DE INTEGRACIÓN CURRICULAR</div>
                </td>
                <td style={{ border: "1px solid #000", width: "30%", padding: "0", verticalAlign: "top" }}>
                  <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "7.5pt" }}>
                    <tbody>
                      <tr>
                        <td style={{ borderBottom: "1px solid #000", padding: "4px", fontWeight: "bold" }}>CÓDIGO: PAT-04-F-002</td>
                      </tr>
                      <tr>
                        <td style={{ borderBottom: "1px solid #000", padding: "4px" }}>REVISIÓN: 1</td>
                      </tr>
                      <tr>
                        <td style={{ padding: "4px" }}>Página 1 de 2</td>
                      </tr>
                    </tbody>
                  </table>
                </td>
              </tr>
            </tbody>
          </table>

          {/* Datos Informativos del Estudiante */}
          <div style={{ background: "#d9d9d9", border: "1px solid #000", borderBottom: "0", padding: "4px 6px", fontWeight: "bold", fontSize: "8pt" }}>
            DATOS INFORMATIVOS DEL ESTUDIANTE
          </div>
          <table style={{ width: "100%", borderCollapse: "collapse", border: "1px solid #000", fontSize: "7.5pt", marginBottom: "12px" }}>
            <tbody>
              <tr>
                <td style={{ border: "1px solid #000", padding: "3px 5px", fontWeight: "bold", width: "26%" }}>Facultad/Extensión/Sede:</td>
                <td style={{ border: "1px solid #000", padding: "3px 5px", width: "74%" }} colSpan={5}>{formData.faculty || "---"}</td>
              </tr>
              <tr>
                <td style={{ border: "1px solid #000", padding: "3px 5px", fontWeight: "bold" }}>Carrera:</td>
                <td style={{ border: "1px solid #000", padding: "3px 5px" }} colSpan={5}>{formData.career || "---"}</td>
              </tr>
              <tr>
                <td style={{ border: "1px solid #000", padding: "3px 5px", fontWeight: "bold" }}>Nombres y apellidos del estudiante:</td>
                <td style={{ border: "1px solid #000", padding: "3px 5px" }} colSpan={5}>
                  {formData.firstName || "---"} {formData.participationType === "Grupal" && formData.teammateInfo ? ` / Coautor(a): ${formData.teammateInfo}` : ""}
                </td>
              </tr>
              <tr>
                <td style={{ border: "1px solid #000", padding: "3px 5px", fontWeight: "bold" }}>Nivel:</td>
                <td style={{ border: "1px solid #000", padding: "3px 5px", width: "24%" }}>{formData.level || "---"}</td>
                <td style={{ border: "1px solid #000", padding: "3px 5px", fontWeight: "bold", width: "12%" }}>Curso:</td>
                <td style={{ border: "1px solid #000", padding: "3px 5px", width: "24%" }}>{formData.level || "---"}</td>
                <td style={{ border: "1px solid #000", padding: "3px 5px", fontWeight: "bold", width: "10%" }}>Paralelo:</td>
                <td style={{ border: "1px solid #000", padding: "3px 5px", width: "14%" }}>{formData.parallel || "---"}</td>
              </tr>
              <tr>
                <td style={{ border: "1px solid #000", padding: "3px 5px", fontWeight: "bold" }}>Cédula de Ciudadanía:</td>
                <td style={{ border: "1px solid #000", padding: "3px 5px" }}>{formData.identity || "---"}</td>
                <td style={{ border: "1px solid #000", padding: "3px 5px", fontWeight: "bold" }} colSpan={2}>Fecha de Nacimiento:</td>
                <td style={{ border: "1px solid #000", padding: "3px 5px" }} colSpan={2}>{formData.birthDate || "---"}</td>
              </tr>
              <tr>
                <td style={{ border: "1px solid #000", padding: "3px 5px", fontWeight: "bold" }}>Edad:</td>
                <td style={{ border: "1px solid #000", padding: "3px 5px" }}>{formData.age || "---"}</td>
                <td style={{ border: "1px solid #000", padding: "3px 5px", fontWeight: "bold" }} colSpan={2}>Sexo:</td>
                <td style={{ border: "1px solid #000", padding: "3px 5px" }} colSpan={2}>{formData.sex || "---"}</td>
              </tr>
              <tr>
                <td style={{ border: "1px solid #000", padding: "3px 5px", fontWeight: "bold" }}>Nacionalidad:</td>
                <td style={{ border: "1px solid #000", padding: "3px 5px" }} colSpan={5}>{formData.nationality || "Ecuatoriana"}</td>
              </tr>
              <tr>
                <td style={{ border: "1px solid #000", padding: "3px 5px", fontWeight: "bold" }}>Estado Civil:</td>
                <td style={{ border: "1px solid #000", padding: "3px 5px" }} colSpan={2}>{formData.maritalStatus || "---"}</td>
                <td style={{ border: "1px solid #000", padding: "3px 5px", fontWeight: "bold" }} colSpan={2}>N° de Certificado de Votación:</td>
                <td style={{ border: "1px solid #000", padding: "3px 5px" }}>{formData.votingCertificate || "---"}</td>
              </tr>
              <tr>
                <td style={{ border: "1px solid #000", padding: "3px 5px", fontWeight: "bold" }}>Provincia de residencia:</td>
                <td style={{ border: "1px solid #000", padding: "3px 5px" }} colSpan={5}>{formData.province || "---"}</td>
              </tr>
              <tr>
                <td style={{ border: "1px solid #000", padding: "3px 5px", fontWeight: "bold" }}>Cantón de residencia:</td>
                <td style={{ border: "1px solid #000", padding: "3px 5px" }} colSpan={5}>{formData.canton || "---"}</td>
              </tr>
              <tr>
                <td style={{ border: "1px solid #000", padding: "3px 5px", fontWeight: "bold" }}>Parroquia de residencia:</td>
                <td style={{ border: "1px solid #000", padding: "3px 5px" }} colSpan={5}>{formData.parish || "---"}</td>
              </tr>
              <tr>
                <td style={{ border: "1px solid #000", padding: "3px 5px", fontWeight: "bold" }}>Correo(s) Electrónico(s):</td>
                <td style={{ border: "1px solid #000", padding: "3px 5px" }} colSpan={5}>1) {formData.institutionalEmail || "---"} &nbsp;&nbsp;&nbsp; 2) {formData.secondaryEmail || "---"}</td>
              </tr>
              <tr>
                <td style={{ border: "1px solid #000", padding: "3px 5px", fontWeight: "bold" }}>Teléfono Celular:</td>
                <td style={{ border: "1px solid #000", padding: "3px 5px" }} colSpan={2}>{formData.phone || "---"}</td>
                <td style={{ border: "1px solid #000", padding: "3px 5px", fontWeight: "bold" }} colSpan={2}>Teléfono Convencional:</td>
                <td style={{ border: "1px solid #000", padding: "3px 5px" }}>{formData.landline || "---"}</td>
              </tr>
              <tr>
                <td style={{ border: "1px solid #000", padding: "3px 5px", fontWeight: "bold", verticalAlign: "middle" }}>Discapacidad:</td>
                <td style={{ border: "1px solid #000", padding: "0" }} colSpan={5}>
                  <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "7pt" }}>
                    <tbody>
                      <tr>
                        <td style={{ border: "1px solid #000", padding: "2px 4px", width: "25%" }}>Visual: {formData.disabilityType === "Visual" ? "[X]" : "[ ]"}</td>
                        <td style={{ border: "1px solid #000", padding: "2px 4px", width: "25%" }}>Grado: {formData.disabilityType === "Visual" ? formData.disabilityDegree : ""}</td>
                        <td style={{ border: "1px solid #000", padding: "2px 4px", width: "25%" }}>Física: {formData.disabilityType === "Física" ? "[X]" : "[ ]"}</td>
                        <td style={{ border: "1px solid #000", padding: "2px 4px", width: "25%" }}>Grado: {formData.disabilityType === "Física" ? formData.disabilityDegree : ""}</td>
                      </tr>
                      <tr>
                        <td style={{ border: "1px solid #000", padding: "2px 4px" }}>Auditiva: {formData.disabilityType === "Auditiva" ? "[X]" : "[ ]"}</td>
                        <td style={{ border: "1px solid #000", padding: "2px 4px" }}>Grado: {formData.disabilityType === "Auditiva" ? formData.disabilityDegree : ""}</td>
                        <td style={{ border: "1px solid #000", padding: "2px 4px" }}>Intelectual: {formData.disabilityType === "Intelectual" ? "[X]" : "[ ]"}</td>
                        <td style={{ border: "1px solid #000", padding: "2px 4px" }}>Grado: {formData.disabilityType === "Intelectual" ? formData.disabilityDegree : ""}</td>
                      </tr>
                      <tr>
                        <td style={{ border: "1px solid #000", padding: "2px 4px" }}>Psicológica: {formData.disabilityType === "Psicológica" ? "[X]" : "[ ]"}</td>
                        <td style={{ border: "1px solid #000", padding: "2px 4px" }}>Grado: {formData.disabilityType === "Psicológica" ? formData.disabilityDegree : ""}</td>
                        <td style={{ border: "1px solid #000", padding: "2px 4px" }}>Lengua: {formData.disabilityType === "Lengua" ? "[X]" : "[ ]"}</td>
                        <td style={{ border: "1px solid #000", padding: "2px 4px" }}>Grado: {formData.disabilityType === "Lengua" ? formData.disabilityDegree : ""}</td>
                      </tr>
                      <tr>
                        <td style={{ border: "1px solid #000", padding: "2px 4px" }}>Otras: {formData.disabilityType === "Otras" ? "[X]" : "[ ]"}</td>
                        <td style={{ border: "1px solid #000", padding: "2px 4px" }} colSpan={3}>Grado: {formData.disabilityType === "Otras" ? formData.disabilityDegree : ""}</td>
                      </tr>
                    </tbody>
                  </table>
                </td>
              </tr>
            </tbody>
          </table>

          {/* Page Break / Page 2 Header */}
          <table style={{ width: "100%", borderCollapse: "collapse", border: "1px solid #000", marginBottom: "10px", marginTop: "20px" }}>
            <tbody>
              <tr>
                <td style={{ border: "1px solid #000", width: "18%", textAlign: "center", padding: "6px", verticalAlign: "middle" }}>
                  <div style={{ fontWeight: "bold", color: "#c00", fontSize: "14pt", letterSpacing: "-1px" }}>Uleam</div>
                  <div style={{ fontSize: "5.5pt", fontWeight: "bold", color: "#444", lineHeight: "1" }}>UNIVERSIDAD LAICA ELOY ALFARO DE MANABÍ</div>
                </td>
                <td style={{ border: "1px solid #000", width: "52%", padding: "6px", verticalAlign: "middle" }}>
                  <div style={{ fontSize: "6.5pt", fontWeight: "bold", color: "#333" }}>NOMBRE DEL DOCUMENTO:</div>
                  <div style={{ fontSize: "7.5pt", fontWeight: "bold", textTransform: "uppercase" }}>REGISTRO DE MODALIDAD Y TEMA O NÚCLEO PROBLÉMICO DE INVESTIGACIÓN.</div>
                  <div style={{ fontSize: "6.5pt", marginTop: "3px", color: "#444" }}>PROCEDIMIENTO: TITULACIÓN DE ESTUDIANTES DE GRADO BAJO LA UNIDAD DE INTEGRACIÓN CURRICULAR</div>
                </td>
                <td style={{ border: "1px solid #000", width: "30%", padding: "0", verticalAlign: "top" }}>
                  <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "7.5pt" }}>
                    <tbody>
                      <tr>
                        <td style={{ borderBottom: "1px solid #000", padding: "4px", fontWeight: "bold" }}>CÓDIGO: PAT-04-F-002</td>
                      </tr>
                      <tr>
                        <td style={{ borderBottom: "1px solid #000", padding: "4px" }}>REVISIÓN: 1</td>
                      </tr>
                      <tr>
                        <td style={{ padding: "4px" }}>Página 2 de 2</td>
                      </tr>
                    </tbody>
                  </table>
                </td>
              </tr>
            </tbody>
          </table>

          {/* Modalidad Table */}
          <table style={{ width: "100%", borderCollapse: "collapse", border: "1px solid #000", fontSize: "7.5pt", marginBottom: "10px" }}>
            <thead>
              <tr style={{ background: "#d9d9d9", textAlign: "center", fontWeight: "bold" }}>
                <td style={{ border: "1px solid #000", padding: "4px", width: "7%" }}>No.</td>
                <td style={{ border: "1px solid #000", padding: "4px", width: "31%" }}>OPCIÓN DE APROBACIÓN PREVIO A TITULACIÓN</td>
                <td style={{ border: "1px solid #000", padding: "4px", width: "27%" }}>MODALIDAD</td>
                <td style={{ border: "1px solid #000", padding: "4px", width: "35%" }}>TÍTULO PROVISIONAL DEL TEMA PROPUESTO O NÚCLEO PROBLÉMICO</td>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td style={{ border: "1px solid #000", padding: "5px", textAlign: "center" }}>1</td>
                <td style={{ border: "1px solid #000", padding: "5px" }}>Trabajo de Integración Curricular</td>
                <td style={{ border: "1px solid #000", padding: "5px" }}>{formData.modality?.includes("Trabajo") ? formData.modality : "No Aplica."}</td>
                <td style={{ border: "1px solid #000", padding: "5px", fontWeight: "bold" }}>{formData.modality?.includes("Trabajo") ? formData.provisionalTitle : "No Aplica."}</td>
              </tr>
              <tr>
                <td style={{ border: "1px solid #000", padding: "5px", textAlign: "center" }}>2</td>
                <td style={{ border: "1px solid #000", padding: "5px" }}>Examen de carácter complexivo</td>
                <td style={{ border: "1px solid #000", padding: "5px" }}>{formData.modality?.includes("Complexivo") ? formData.modality : "No Aplica."}</td>
                <td style={{ border: "1px solid #000", padding: "5px" }}>{formData.modality?.includes("Complexivo") ? formData.provisionalTitle : "No Aplica."}</td>
              </tr>
            </tbody>
          </table>

          <div style={{ background: "#d9d9d9", border: "1px solid #000", borderBottom: "0", padding: "3px 6px", fontWeight: "bold", fontSize: "8pt" }}>
            PROBLEMÁTICA DEL TRABAJO DE INTEGRACIÓN CURRICULAR
          </div>
          <div style={{ border: "1px solid #000", padding: "6px", fontSize: "7.5pt", minHeight: "40px", marginBottom: "10px" }}>
            {formData.problemDescription || "---"}
          </div>

          <div style={{ background: "#d9d9d9", border: "1px solid #000", borderBottom: "0", padding: "3px 6px", fontWeight: "bold", fontSize: "8pt" }}>
            ARTICULACIÓN DEL TRABAJO DE INTEGRACIÓN CURRICULAR CON FUNCIONES SUSTANTIVAS
          </div>
          <table style={{ width: "100%", borderCollapse: "collapse", border: "1px solid #000", fontSize: "7.5pt", marginBottom: "10px" }}>
            <tbody>
              <tr>
                <td style={{ border: "1px solid #000", padding: "3px 5px", width: "88%" }}>Trabajo de Integración Curricular se articula con proyectos y programas de Investigación:</td>
                <td style={{ border: "1px solid #000", padding: "3px 5px", textAlign: "center", width: "12%" }}>{formData.articulations?.includes("investigacion") ? "X" : ""}</td>
              </tr>
              <tr>
                <td style={{ border: "1px solid #000", padding: "3px 5px" }}>Trabajo de Integración Curricular se articula con proyectos y programas de Vinculación:</td>
                <td style={{ border: "1px solid #000", padding: "3px 5px", textAlign: "center" }}>{formData.articulations?.includes("vinculacion") ? "X" : ""}</td>
              </tr>
              <tr>
                <td style={{ border: "1px solid #000", padding: "3px 5px" }}>Trabajo de Integración Curricular se articula con proyectos de asignaturas (Docencia):</td>
                <td style={{ border: "1px solid #000", padding: "3px 5px", textAlign: "center" }}>{formData.articulations?.includes("docencia") ? "X" : ""}</td>
              </tr>
              <tr>
                <td style={{ border: "1px solid #000", padding: "3px 5px" }}>Ninguna:</td>
                <td style={{ border: "1px solid #000", padding: "3px 5px", textAlign: "center" }}>{formData.articulations?.includes("ninguna") ? "X" : ""}</td>
              </tr>
            </tbody>
          </table>

          <div style={{ background: "#d9d9d9", border: "1px solid #000", borderBottom: "0", padding: "3px 6px", fontWeight: "bold", fontSize: "8pt" }}>
            MECANISMO DE DESARROLLO Y PRESENTACIÓN
          </div>
          <div style={{ border: "1px solid #000", padding: "5px 6px", fontSize: "7.5pt", marginBottom: "10px" }}>
            Se especifica aquí si la propuesta será desarrollada de forma: <strong>{formData.participationType || "Individual"}</strong> | Mecanismo: <strong>{formData.presentationMechanism || "---"}</strong>
          </div>

          <div style={{ background: "#d9d9d9", border: "1px solid #000", borderBottom: "0", padding: "3px 6px", fontWeight: "bold", fontSize: "8pt" }}>
            TUTOR/A SOLICITADO/A
          </div>
          <div style={{ border: "1px solid #000", padding: "5px 6px", fontSize: "7.5pt", marginBottom: "10px" }}>
            {formData.requestedTutor || "---"}
          </div>

          <div style={{ background: "#d9d9d9", border: "1px solid #000", borderBottom: "0", padding: "3px 6px", fontWeight: "bold", fontSize: "8pt" }}>
            FIRMA DE RESPONSABILIDAD
          </div>
          <table style={{ width: "100%", borderCollapse: "collapse", border: "1px solid #000", fontSize: "7.5pt", marginBottom: "12px" }}>
            <tbody>
              <tr>
                <td style={{ border: "1px solid #000", padding: "6px", width: "55%", verticalAlign: "bottom" }}>
                  Nombres del estudiante que postula y presenta la propuesta:<br/>
                  <strong>{formData.firstName || "---"} {formData.teammateInfo ? `/ Coautor(a): ${formData.teammateInfo}` : ""}</strong>
                </td>
                <td style={{ border: "1px solid #000", padding: "6px", width: "45%", textAlign: "center", verticalAlign: "bottom" }}>
                  Firma:<br/><br/>
                  --------------------------------------------------<br/>
                  C.I: {formData.identity || "---"}
                </td>
              </tr>
            </tbody>
          </table>

          <div style={{ fontSize: "6.5pt", color: "#000", borderTop: "1px solid #000", paddingTop: "4px" }}>
            <p style={{ margin: "0 0 2px 0" }}><strong>Nota 1:</strong> La aprobación preliminar de este formato, la otorgará la Comisión Académica mediante el sistema.</p>
            <p style={{ margin: "0" }}><strong>Nota 2:</strong> El formato será llenado y presentado individualmente (o en pareja), firmado en físico, escaneado y subido en el sistema en archivo pdf y entregando un ejemplar para el archivo físico de la Comisión Académica.</p>
          </div>
        </div>
      </div>
    </section>
  );
}
