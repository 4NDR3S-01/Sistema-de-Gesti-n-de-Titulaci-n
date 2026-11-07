"use client";

import { useRef, useState, type CSSProperties, type ReactNode } from "react";
import { Download, LoaderCircle } from "lucide-react";
import { ageFrom, disabilityTypes, isComplexivo, type PatExtraData } from "@/lib/pat-options";

export type PatDocumentMember = {
  fullName: string;
  cedula: string;
  sex: string;
  faculty: string;
  career: string;
  institutionalEmail: string;
  personalEmail: string;
  phone: string;
  landline: string;
  signature?: string | null;
} & PatExtraData;

export type PatDocumentData = {
  registrationId: number;
  version: string;
  participationType: "INDIVIDUAL" | "GRUPAL";
  modality: string;
  presentationMechanism: string;
  requestedTutor?: string | null;
  title: string;
  problem: string;
  articulations: string[];
  members: PatDocumentMember[];
};

// Estilos en línea y colores hexadecimales: html2canvas no interpreta
// funciones de color modernas, así que el documento no depende de la hoja global.
const page: CSSProperties = {
  width: "210mm",
  minHeight: "297mm",
  padding: "14mm 15mm 18mm",
  background: "#ffffff",
  color: "#000000",
  fontFamily: "Arial, Helvetica, sans-serif",
  fontSize: "8.5pt",
  lineHeight: 1.3,
  boxSizing: "border-box",
  position: "relative",
};
const table: CSSProperties = { width: "100%", borderCollapse: "collapse", marginBottom: "10px" };
const cell: CSSProperties = { border: "1px solid #000000", padding: "4px 6px", verticalAlign: "top" };
const label: CSSProperties = { ...cell, fontWeight: 700, background: "#f2f2f2", width: "27%" };
const band: CSSProperties = {
  border: "1px solid #000000",
  borderBottom: 0,
  background: "#d9d9d9",
  padding: "4px 6px",
  fontWeight: 700,
};
const box: CSSProperties = { ...cell, display: "block", marginBottom: "10px", minHeight: "24px" };

function DocHeader({ pageNumber, pages }: { pageNumber: number; pages: number }) {
  return (
    <table style={table}>
      <tbody>
        <tr>
          <td style={{ ...cell, width: "24%", textAlign: "center", verticalAlign: "middle" }}>
            {/* eslint-disable-next-line @next/next/no-img-element -- html2canvas necesita una <img> simple */}
            <img src="/brand/uleam-logo.png" alt="Uleam" style={{ width: "100%", height: "auto" }} />
          </td>
          <td style={{ ...cell, width: "50%", verticalAlign: "middle" }}>
            <div style={{ fontSize: "7pt", fontWeight: 700 }}>NOMBRE DEL DOCUMENTO:</div>
            <div style={{ fontWeight: 700 }}>
              REGISTRO DE MODALIDAD Y TEMA O NÚCLEO PROBLÉMICO DE INVESTIGACIÓN
            </div>
            <div style={{ fontSize: "7pt", marginTop: "3px" }}>
              PROCEDIMIENTO: TITULACIÓN DE ESTUDIANTES DE GRADO BAJO LA UNIDAD DE INTEGRACIÓN
              CURRICULAR
            </div>
          </td>
          <td style={{ ...cell, width: "26%", padding: 0 }}>
            <div style={{ borderBottom: "1px solid #000000", padding: "4px 6px", fontWeight: 700 }}>
              CÓDIGO: PAT-04-F-002
            </div>
            <div style={{ borderBottom: "1px solid #000000", padding: "4px 6px" }}>REVISIÓN: 1</div>
            <div style={{ padding: "4px 6px" }}>Página {pageNumber} de {pages}</div>
          </td>
        </tr>
      </tbody>
    </table>
  );
}

function Row({ name, children, span = 5 }: { name: string; children: ReactNode; span?: number }) {
  return (
    <tr>
      <td style={label}>{name}</td>
      <td style={cell} colSpan={span}>
        {children || "—"}
      </td>
    </tr>
  );
}

const mark = (on: boolean) => (on ? "X" : "");

function Footer({ data }: { data: PatDocumentData }) {
  return (
    <div style={{ position: "absolute", left: "15mm", right: "15mm", bottom: "8mm", fontSize: "6.5pt", color: "#555555", display: "flex", justifyContent: "space-between" }}>
      <span>Sistema de Gestión de Titulación ULEAM</span>
      <span>
        Registro N.º {data.registrationId} · versión {data.version}
      </span>
    </div>
  );
}

function MemberPage({
  member,
  pageNumber,
  pages,
  data,
}: {
  member: PatDocumentMember;
  pageNumber: number;
  pages: number;
  data: PatDocumentData;
}) {
  const age = ageFrom(member.birthDate);
  return (
    <div style={page} data-pdf-page>
      <DocHeader pageNumber={pageNumber} pages={pages} />
      <div style={band}>
        DATOS INFORMATIVOS DEL ESTUDIANTE
        {data.members.length > 1 ? ` (POSTULANTE ${pageNumber})` : ""}
      </div>
      <table style={table}>
        <tbody>
          <Row name="Facultad/Extensión/Sede:">{member.faculty}</Row>
          <Row name="Carrera:">{member.career}</Row>
          <Row name="Nombres y apellidos:">{member.fullName}</Row>
          <tr>
            <td style={label}>Nivel:</td>
            <td style={cell}>{member.level || "—"}</td>
            <td style={{ ...label, width: "12%" }}>Paralelo:</td>
            <td style={cell} colSpan={3}>
              {member.parallel || "—"}
            </td>
          </tr>
          <tr>
            <td style={label}>Cédula de ciudadanía:</td>
            <td style={cell}>{member.cedula || "—"}</td>
            <td style={{ ...label, width: "12%" }}>Nacimiento:</td>
            <td style={cell} colSpan={3}>
              {member.birthDate || "—"}
            </td>
          </tr>
          <tr>
            <td style={label}>Edad:</td>
            <td style={cell}>{age ?? "—"}</td>
            <td style={{ ...label, width: "12%" }}>Sexo:</td>
            <td style={cell} colSpan={3}>
              {member.sex || "—"}
            </td>
          </tr>
          <Row name="Nacionalidad:">{member.nationality}</Row>
          <tr>
            <td style={label}>Estado civil:</td>
            <td style={cell}>{member.maritalStatus || "—"}</td>
            <td style={{ ...label, width: "12%" }}>Cert. votación:</td>
            <td style={cell} colSpan={3}>
              {member.votingCertificate || "—"}
            </td>
          </tr>
          <Row name="Provincia de residencia:">{member.province}</Row>
          <Row name="Cantón de residencia:">{member.canton}</Row>
          <Row name="Parroquia de residencia:">{member.parish}</Row>
          <Row name="Correo(s) electrónico(s):">
            1) {member.institutionalEmail || "—"} &nbsp;&nbsp; 2) {member.personalEmail || "—"}
          </Row>
          <tr>
            <td style={label}>Teléfono celular:</td>
            <td style={cell}>{member.phone || "—"}</td>
            <td style={{ ...label, width: "12%" }}>Convencional:</td>
            <td style={cell} colSpan={3}>
              {member.landline || "—"}
            </td>
          </tr>
        </tbody>
      </table>

      <div style={band}>DISCAPACIDAD</div>
      <table style={table}>
        <tbody>
          {[0, 2, 4, 6].map((start) => (
            <tr key={start}>
              {disabilityTypes.slice(start, start + 2).map((type) => (
                <td key={type} style={{ ...cell, width: "50%" }}>
                  {type}: [{mark(member.disabilityType === type)}] &nbsp; Grado:{" "}
                  {member.disabilityType === type && member.disabilityDegree ? `${member.disabilityDegree} %` : ""}
                </td>
              ))}
              {start === 6 && <td style={cell} />}
            </tr>
          ))}
        </tbody>
      </table>
      <Footer data={data} />
    </div>
  );
}

function SignatureCell({ member }: { member: PatDocumentMember }) {
  return (
    <td style={{ ...cell, textAlign: "center", verticalAlign: "bottom", height: "34mm" }}>
      <div style={{ height: "20mm", display: "flex", alignItems: "flex-end", justifyContent: "center" }}>
        {member.signature ? (
          // eslint-disable-next-line @next/next/no-img-element -- html2canvas necesita una <img> simple
          <img src={member.signature} alt="" style={{ maxHeight: "20mm", maxWidth: "70mm" }} />
        ) : null}
      </div>
      <div style={{ borderTop: "1px solid #000000", margin: "0 6mm", paddingTop: "3px" }}>
        <strong>{member.fullName}</strong>
        <br />
        C.I. {member.cedula || "—"}
      </div>
    </td>
  );
}

export function PatDocument({ data, id }: { data: PatDocumentData; id: string }) {
  const complexivo = isComplexivo(data.modality);
  const pages = data.members.length + 1;
  const names = data.members.map((member) => member.fullName).join(" y ");

  return (
    <div id={id}>
      {data.members.map((member, index) => (
        <MemberPage member={member} pageNumber={index + 1} pages={pages} data={data} key={member.fullName} />
      ))}

      <div style={page} data-pdf-page>
        <DocHeader pageNumber={pages} pages={pages} />
        <table style={table}>
          <thead>
            <tr style={{ background: "#d9d9d9", fontWeight: 700, textAlign: "center" }}>
              <td style={{ ...cell, width: "6%" }}>No.</td>
              <td style={{ ...cell, width: "26%" }}>OPCIÓN DE APROBACIÓN PREVIO A TITULACIÓN</td>
              <td style={{ ...cell, width: "28%" }}>MODALIDAD</td>
              <td style={{ ...cell, width: "40%" }}>TÍTULO PROVISIONAL DEL TEMA O NÚCLEO PROBLÉMICO</td>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td style={{ ...cell, textAlign: "center" }}>1</td>
              <td style={cell}>Trabajo de Integración Curricular</td>
              <td style={cell}>{complexivo ? "No aplica" : data.modality}</td>
              <td style={{ ...cell, fontWeight: complexivo ? 400 : 700 }}>{complexivo ? "No aplica" : data.title}</td>
            </tr>
            <tr>
              <td style={{ ...cell, textAlign: "center" }}>2</td>
              <td style={cell}>Examen de carácter complexivo</td>
              <td style={cell}>{complexivo ? data.modality : "No aplica"}</td>
              <td style={{ ...cell, fontWeight: complexivo ? 700 : 400 }}>{complexivo ? data.title : "No aplica"}</td>
            </tr>
          </tbody>
        </table>

        <div style={band}>PROBLEMÁTICA DEL TRABAJO DE INTEGRACIÓN CURRICULAR</div>
        <div style={{ ...box, minHeight: "50px", whiteSpace: "pre-wrap" }}>{data.problem}</div>

        <div style={band}>ARTICULACIÓN CON FUNCIONES SUSTANTIVAS</div>
        <table style={table}>
          <tbody>
            {[
              ["investigacion", "Se articula con proyectos y programas de investigación"],
              ["vinculacion", "Se articula con proyectos y programas de vinculación"],
              ["docencia", "Se articula con proyectos de asignaturas (docencia)"],
              ["ninguna", "Ninguna"],
            ].map(([value, text]) => (
              <tr key={value}>
                <td style={{ ...cell, width: "88%" }}>{text}</td>
                <td style={{ ...cell, textAlign: "center", fontWeight: 700 }}>{mark(data.articulations.includes(value))}</td>
              </tr>
            ))}
          </tbody>
        </table>

        <div style={band}>MECANISMO DE DESARROLLO Y PRESENTACIÓN</div>
        <div style={box}>
          Desarrollo {data.participationType === "GRUPAL" ? `en pareja (${names})` : "individual"}. Mecanismo:{" "}
          <strong>{data.presentationMechanism}</strong>
        </div>

        <div style={band}>TUTOR/A SOLICITADO/A</div>
        <div style={box}>{data.requestedTutor || "—"}</div>

        <div style={band}>FIRMA DE RESPONSABILIDAD</div>
        <table style={table}>
          <tbody>
            <tr>
              {data.members.map((member) => (
                <SignatureCell member={member} key={member.fullName} />
              ))}
            </tr>
          </tbody>
        </table>

        <div style={{ fontSize: "7pt", borderTop: "1px solid #000000", paddingTop: "4px" }}>
          <p style={{ margin: "0 0 2px" }}>
            <strong>Nota 1:</strong> La aprobación preliminar de este formato la otorga la Comisión Académica mediante el sistema.
          </p>
          <p style={{ margin: 0 }}>
            <strong>Nota 2:</strong> El formato se presenta individualmente o en pareja, firmado, y se sube al sistema en PDF;
            se entrega un ejemplar para el archivo físico de la Comisión Académica.
          </p>
        </div>
        <Footer data={data} />
      </div>
    </div>
  );
}

/** Genera el PDF oficial (una página A4 por cada bloque del documento). */
export function PatPdfButton({
  data,
  fileName,
  className = "btn btn-secondary",
  label = "Descargar formato PDF",
}: {
  data: PatDocumentData;
  fileName: string;
  className?: string;
  label?: string;
}) {
  const container = useRef<HTMLDivElement>(null);
  const [state, setState] = useState<"idle" | "busy" | "error">("idle");

  async function download() {
    if (!container.current) return;
    setState("busy");
    try {
      const [{ default: html2canvas }, { jsPDF }] = await Promise.all([
        import("html2canvas"),
        import("jspdf"),
      ]);
      const pdf = new jsPDF("p", "mm", "a4");
      const pages = container.current.querySelectorAll<HTMLElement>("[data-pdf-page]");
      let first = true;
      for (const element of pages) {
        const canvas = await html2canvas(element, { scale: 2, backgroundColor: "#ffffff" });
        // Si el contenido supera una hoja A4 (problemática extensa), se reparte en varias.
        const sliceHeight = Math.floor((canvas.width * 297) / 210);
        for (let offset = 0; offset < canvas.height - 4; offset += sliceHeight) {
          const slice = document.createElement("canvas");
          slice.width = canvas.width;
          slice.height = Math.min(sliceHeight, canvas.height - offset);
          const ctx = slice.getContext("2d");
          if (!ctx) continue;
          ctx.fillStyle = "#ffffff";
          ctx.fillRect(0, 0, slice.width, slice.height);
          ctx.drawImage(canvas, 0, offset, canvas.width, slice.height, 0, 0, canvas.width, slice.height);
          if (!first) pdf.addPage();
          first = false;
          pdf.addImage(slice.toDataURL("image/jpeg", 0.92), "JPEG", 0, 0, 210, (slice.height * 210) / canvas.width);
        }
      }
      pdf.save(fileName);
      setState("idle");
    } catch (error) {
      console.error("No se pudo generar el PDF", error);
      setState("error");
    }
  }

  return (
    <>
      <button className={className} type="button" onClick={download} disabled={state === "busy"}>
        {state === "busy" ? (
          <LoaderCircle className="spin" aria-hidden="true" />
        ) : (
          <Download aria-hidden="true" />
        )}
        {state === "busy" ? "Generando PDF…" : label}
      </button>
      {state === "error" && (
        <span role="alert" className="field-error">
          No se pudo generar el PDF. Inténtalo de nuevo.
        </span>
      )}
      <div ref={container} aria-hidden="true" style={{ position: "fixed", left: "-10000px", top: 0 }}>
        <PatDocument data={data} id={`pat-doc-${data.registrationId}`} />
      </div>
    </>
  );
}
