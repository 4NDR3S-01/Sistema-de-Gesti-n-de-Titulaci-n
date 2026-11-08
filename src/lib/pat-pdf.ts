import "server-only";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { jsPDF } from "jspdf";
import type { PatDocumentData, PatDocumentMember } from "@/lib/pat-document-types";
import { ageFrom, disabilityTypes, isComplexivo, patArticulations } from "@/lib/pat-options";

const PAGE_W = 210;
const MARGIN = 15;
const CONTENT_W = PAGE_W - MARGIN * 2;
const BOTTOM = 280;
const PAD = 1.6;
const LINE = 3.4; // alto de línea en mm para 8 pt

let logoCache: string | null = null;
function logo(): string {
  logoCache ??= `data:image/png;base64,${readFileSync(join(process.cwd(), "public/brand/uleam-logo.png")).toString("base64")}`;
  return logoCache;
}

type Cell = { text: string; w: number; bold?: boolean; fill?: boolean; align?: "left" | "center"; size?: number };

class PatPdf {
  doc = new jsPDF({ unit: "mm", format: "a4" });
  y = MARGIN;
  page = 1;

  constructor(private data: PatDocumentData) {
    this.doc.setFont("helvetica", "normal");
    this.doc.setLineWidth(0.25);
    this.doc.setDrawColor(0, 0, 0);
    this.doc.setTextColor(0, 0, 0);
  }

  private lines(text: string, width: number, size: number) {
    this.doc.setFontSize(size);
    return this.doc.splitTextToSize(text, width - PAD * 2) as string[];
  }

  header(pageLabel: string) {
    const { doc } = this;
    const h = 22;
    const x0 = MARGIN;
    doc.rect(x0, this.y, 46, h);
    doc.addImage(logo(), "PNG", x0 + 3, this.y + (h - 11.7) / 2, 40, 11.7);

    doc.rect(x0 + 46, this.y, 94, h);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(6.5);
    doc.text("NOMBRE DEL DOCUMENTO:", x0 + 48, this.y + 5);
    doc.setFontSize(8);
    doc.text(
      doc.splitTextToSize("REGISTRO DE MODALIDAD Y TEMA O NÚCLEO PROBLÉMICO DE INVESTIGACIÓN", 90),
      x0 + 48,
      this.y + 9,
    );
    doc.setFont("helvetica", "normal");
    doc.setFontSize(6.5);
    doc.text(
      doc.splitTextToSize("PROCEDIMIENTO: TITULACIÓN DE ESTUDIANTES DE GRADO BAJO LA UNIDAD DE INTEGRACIÓN CURRICULAR", 90),
      x0 + 48,
      this.y + 16.5,
    );

    const cx = x0 + 140;
    doc.rect(cx, this.y, 40, h);
    doc.line(cx, this.y + h / 3, cx + 40, this.y + h / 3);
    doc.line(cx, this.y + (2 * h) / 3, cx + 40, this.y + (2 * h) / 3);
    doc.setFontSize(7.5);
    doc.setFont("helvetica", "bold");
    doc.text("CÓDIGO: PAT-04-F-002", cx + 2, this.y + 4.8);
    doc.setFont("helvetica", "normal");
    doc.text("REVISIÓN: 1", cx + 2, this.y + 4.8 + h / 3);
    doc.text(pageLabel, cx + 2, this.y + 4.8 + (2 * h) / 3);
    this.y += h + 5;
  }

  footer() {
    const { doc } = this;
    doc.setFont("helvetica", "normal");
    doc.setFontSize(6.5);
    doc.setTextColor(90, 90, 90);
    doc.text("Sistema de Gestión de Titulación ULEAM", MARGIN, 290);
    doc.text(`Registro N.º ${this.data.registrationId} · versión ${this.data.version}`, PAGE_W - MARGIN, 290, {
      align: "right",
    });
    doc.setTextColor(0, 0, 0);
  }

  newPage(label: string) {
    this.footer();
    this.doc.addPage();
    this.page++;
    this.y = MARGIN;
    this.header(label);
  }

  ensure(height: number, label: string) {
    if (this.y + height > BOTTOM) this.newPage(label);
  }

  band(title: string) {
    const { doc } = this;
    doc.setFillColor(217, 217, 217);
    doc.rect(MARGIN, this.y, CONTENT_W, 6, "FD");
    doc.setFont("helvetica", "bold");
    doc.setFontSize(8);
    doc.text(title, MARGIN + PAD, this.y + 4.1);
    this.y += 6;
  }

  row(cells: Cell[], minHeight = 6) {
    const { doc } = this;
    const prepared = cells.map((cell) => ({ ...cell, lines: this.lines(cell.text, cell.w, cell.size ?? 8) }));
    const height = Math.max(minHeight, ...prepared.map((cell) => cell.lines.length * LINE + PAD * 2));
    let x = MARGIN;
    for (const cell of prepared) {
      if (cell.fill) {
        doc.setFillColor(242, 242, 242);
        doc.rect(x, this.y, cell.w, height, "FD");
      } else {
        doc.rect(x, this.y, cell.w, height);
      }
      doc.setFont("helvetica", cell.bold ? "bold" : "normal");
      doc.setFontSize(cell.size ?? 8);
      const tx = cell.align === "center" ? x + cell.w / 2 : x + PAD;
      doc.text(cell.lines, tx, this.y + PAD + 2.6, { align: cell.align === "center" ? "center" : "left" });
      x += cell.w;
    }
    this.y += height;
  }

  /** Recuadro de texto largo que puede continuar en la página siguiente. */
  textBox(text: string, label: string) {
    const lines = this.lines(text, CONTENT_W, 8);
    let index = 0;
    while (index < lines.length) {
      const available = Math.max(1, Math.floor((BOTTOM - this.y - PAD * 2) / LINE));
      const chunk = lines.slice(index, index + available);
      const h = chunk.length * LINE + PAD * 2;
      this.doc.rect(MARGIN, this.y, CONTENT_W, h);
      this.doc.setFont("helvetica", "normal");
      this.doc.text(chunk, MARGIN + PAD, this.y + PAD + 2.6);
      this.y += h;
      index += chunk.length;
      if (index < lines.length) this.newPage(label);
    }
    this.y += 4;
  }

  memberPage(member: PatDocumentMember, number: number, pages: number) {
    const L = 50;
    const label = `Página ${number} de ${pages}`;
    this.header(label);
    this.band(`DATOS INFORMATIVOS DEL ESTUDIANTE${this.data.members.length > 1 ? ` (POSTULANTE ${number})` : ""}`);
    const age = ageFrom(member.birthDate);
    const pair = (a: string, va: string, b: string, vb: string) =>
      this.row([
        { text: a, w: L, bold: true, fill: true },
        { text: va || "—", w: 45 },
        { text: b, w: 28, bold: true, fill: true },
        { text: vb || "—", w: CONTENT_W - L - 45 - 28 },
      ]);
    const single = (a: string, va: string) =>
      this.row([
        { text: a, w: L, bold: true, fill: true },
        { text: va || "—", w: CONTENT_W - L },
      ]);

    single("Facultad/Extensión/Sede:", member.faculty);
    single("Carrera:", member.career);
    single("Nombres y apellidos:", member.fullName);
    pair("Nivel:", member.level ?? "", "Paralelo:", member.parallel ?? "");
    pair("Cédula de ciudadanía:", member.cedula, "Nacimiento:", member.birthDate ?? "");
    pair("Edad:", age !== null ? String(age) : "", "Sexo:", member.sex);
    single("Nacionalidad:", member.nationality ?? "");
    pair("Estado civil:", member.maritalStatus ?? "", "Cert. votación:", member.votingCertificate ?? "");
    single("Provincia de residencia:", member.province ?? "");
    single("Cantón de residencia:", member.canton ?? "");
    single("Parroquia de residencia:", member.parish ?? "");
    single("Correo(s) electrónico(s):", `1) ${member.institutionalEmail || "—"}    2) ${member.personalEmail || "—"}`);
    pair("Teléfono celular:", member.phone, "Convencional:", member.landline);

    this.y += 5;
    this.band("DISCAPACIDAD");
    for (let i = 0; i < disabilityTypes.length; i += 2) {
      const cell = (type?: string): Cell => ({
        text: type
          ? `${type}: [${member.disabilityType === type ? "X" : " "}]   Grado: ${
              member.disabilityType === type && member.disabilityDegree ? `${member.disabilityDegree} %` : ""
            }`
          : "",
        w: CONTENT_W / 2,
      });
      this.row([cell(disabilityTypes[i]), cell(disabilityTypes[i + 1])]);
    }
    this.footer();
  }

  proposalPage(pages: number) {
    const label = `Página ${pages} de ${pages}`;
    const d = this.data;
    const complexivo = isComplexivo(d.modality);
    this.header(label);

    const widths = [10, 46, 52, CONTENT_W - 108];
    this.row(
      ["No.", "OPCIÓN DE APROBACIÓN PREVIO A TITULACIÓN", "MODALIDAD", "TÍTULO PROVISIONAL DEL TEMA O NÚCLEO PROBLÉMICO"].map(
        (text, i) => ({ text, w: widths[i], bold: true, fill: true, align: "center" as const, size: 7 }),
      ),
    );
    this.row([
      { text: "1", w: widths[0], align: "center" },
      { text: "Trabajo de Integración Curricular", w: widths[1] },
      { text: complexivo ? "No aplica" : d.modality, w: widths[2] },
      { text: complexivo ? "No aplica" : d.title, w: widths[3], bold: !complexivo },
    ]);
    this.row([
      { text: "2", w: widths[0], align: "center" },
      { text: "Examen de carácter complexivo", w: widths[1] },
      { text: complexivo ? d.modality : "No aplica", w: widths[2] },
      { text: complexivo ? d.title : "No aplica", w: widths[3], bold: complexivo },
    ]);
    this.y += 5;

    this.ensure(20, label);
    this.band("PROBLEMÁTICA DEL TRABAJO DE INTEGRACIÓN CURRICULAR");
    this.textBox(d.problem || "—", label);

    this.ensure(32, label);
    this.band("ARTICULACIÓN CON FUNCIONES SUSTANTIVAS");
    for (const option of patArticulations) {
      this.row([
        { text: option.label, w: CONTENT_W - 20 },
        { text: d.articulations.includes(option.value) ? "X" : "", w: 20, bold: true, align: "center" },
      ]);
    }
    this.y += 5;

    const names = d.members.map((member) => member.fullName).join(" y ");
    this.ensure(16, label);
    this.band("MECANISMO DE DESARROLLO Y PRESENTACIÓN");
    this.row([
      {
        text: `Desarrollo ${d.participationType === "GRUPAL" ? `en pareja (${names})` : "individual"}. Mecanismo: ${d.presentationMechanism}`,
        w: CONTENT_W,
      },
    ]);
    this.y += 5;

    this.ensure(16, label);
    this.band("TUTOR/A SOLICITADO/A");
    this.row([{ text: d.requestedTutor || "—", w: CONTENT_W }]);
    this.y += 5;

    const boxH = 38;
    this.ensure(boxH + 30, label);
    this.band("FIRMA DE RESPONSABILIDAD");
    const cellW = CONTENT_W / Math.max(1, d.members.length);
    d.members.forEach((member, index) => {
      const x = MARGIN + index * cellW;
      this.doc.rect(x, this.y, cellW, boxH);
      if (member.signature) {
        const props = this.doc.getImageProperties(member.signature);
        const maxW = Math.min(cellW - 16, 70);
        const maxH = 18;
        const ratio = Math.min(maxW / props.width, maxH / props.height);
        const w = props.width * ratio;
        const h = props.height * ratio;
        this.doc.addImage(member.signature, "PNG", x + (cellW - w) / 2, this.y + 4 + (maxH - h), w, h);
      }
      const lineY = this.y + 24;
      this.doc.line(x + 8, lineY, x + cellW - 8, lineY);
      this.doc.setFont("helvetica", "bold");
      this.doc.setFontSize(8);
      this.doc.text(member.fullName, x + cellW / 2, lineY + 4.5, { align: "center", maxWidth: cellW - 6 });
      this.doc.setFont("helvetica", "normal");
      this.doc.text(`C.I. ${member.cedula || "—"}`, x + cellW / 2, lineY + 8.5, { align: "center" });
    });
    this.y += boxH + 4;

    this.doc.setFontSize(7);
    const notes = [
      "Nota 1: La aprobación preliminar de este formato la otorga la Comisión Académica mediante el sistema.",
      "Nota 2: El formato se presenta individualmente o en pareja, firmado, y se sube al sistema en PDF; se entrega un ejemplar para el archivo físico de la Comisión Académica.",
    ];
    this.doc.line(MARGIN, this.y, MARGIN + CONTENT_W, this.y);
    this.y += 3.5;
    for (const note of notes) {
      const lines = this.doc.splitTextToSize(note, CONTENT_W) as string[];
      this.doc.text(lines, MARGIN, this.y);
      this.y += lines.length * 3 + 1;
    }
    this.footer();
  }

  build(): ArrayBuffer {
    const pages = this.data.members.length + 1;
    this.data.members.forEach((member, index) => {
      if (index > 0) {
        this.doc.addPage();
        this.y = MARGIN;
      }
      this.memberPage(member, index + 1, pages);
    });
    this.doc.addPage();
    this.y = MARGIN;
    this.proposalPage(pages);
    this.doc.setProperties({
      title: `PAT-04-F-002 · Registro ${this.data.registrationId}`,
      subject: this.data.title,
      creator: "Sistema de Gestión de Titulación ULEAM",
    });
    return this.doc.output("arraybuffer");
  }
}

/** PDF oficial PAT-04-F-002 generado en el servidor (texto real, no imagen). */
export function buildPatPdf(data: PatDocumentData): ArrayBuffer {
  return new PatPdf(data).build();
}
