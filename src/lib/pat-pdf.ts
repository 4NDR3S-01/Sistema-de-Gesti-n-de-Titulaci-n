import "server-only";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { jsPDF } from "jspdf";
import type { PatDocumentData, PatDocumentMember } from "@/lib/pat-document-types";
import { ageFrom, isComplexivo, patArticulations } from "@/lib/pat-options";

/* Geometría del formato oficial PAT-04-F-002.
 * El original está en Letter; el sistema genera A4 y centra el contenido
 * (175 mm de ancho útil) conservando las medidas verticales del formato. */
const PAGE_W = 210;
const MARGIN = 17.5;
const CONTENT_W = 175;
const HEADER_X = 22.5;
const HEADER_Y = 5;
const HEADER_H = 23;
const HEADER_LOGO_W = 24.5;
const HEADER_DOC_W = 100.5;
const HEADER_CODE_W = 40;
const DATA_Y = 34;
const ROW_H = 7.2;
const DIS_ROW_H = 19.9;
const BOTTOM = 286;
const FOOTER_Y = 290;

const DATA_PAD = 1.8;
const DIS_PAD = 3.5;
const BAND_H = 8;
const LINE = 3.2; // separación entre líneas de valores partidos

let logoCache: string | null = null;
function logo(): string {
  logoCache ??= `data:image/png;base64,${readFileSync(
    join(process.cwd(), "public/brand/uleam-logo-vertical.png"),
  ).toString("base64")}`;
  return logoCache;
}

/** Fecha ISO AAAA-MM-DD a DD/MM/AAAA. */
function formatDate(value?: string | null): string {
  if (!value) return "";
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  return match ? `${match[3]}/${match[2]}/${match[1]}` : value;
}

/** Etiqueta y valor que comparten una misma celda (etiqueta en negrita). */
type DataCell = {
  label: string;
  value: string;
  w: number;
  labelSize?: number;
  valueSize?: number;
  valueBold?: boolean;
  padX?: number;
};

type PreparedCell = DataCell & {
  labelWidth: number;
  labelSize: number;
  valueLines: string[];
  valueSize: number;
  rowHeight: number;
};

type ApprovalCell = {
  text: string;
  w: number;
  bold?: boolean;
  size?: number;
  align?: "left" | "center";
  valign?: "top" | "middle";
};

class PatPdf {
  doc = new jsPDF({ unit: "mm", format: "a4" });
  y = DATA_Y;
  private pageLabels: string[] = [];

  constructor(private data: PatDocumentData) {
    this.doc.setFont("helvetica", "normal");
    this.doc.setLineWidth(0.2);
    this.doc.setDrawColor(0, 0, 0);
    this.doc.setTextColor(0, 0, 0);
  }

  private font(style: "normal" | "bold" | "italic" | "bolditalic", size: number) {
    this.doc.setFont("helvetica", style);
    this.doc.setFontSize(size);
  }

  private measure(text: string, style: "normal" | "bold" | "italic" | "bolditalic", size: number) {
    this.font(style, size);
    return this.doc.getTextWidth(text);
  }

  private wrap(text: string, width: number, style: "normal" | "bold" | "italic" | "bolditalic", size: number) {
    if (!text) return [] as string[];
    this.font(style, size);
    return this.doc.splitTextToSize(text, Math.max(1, width)) as string[];
  }

  private dashedLine(x1: number, y: number, x2: number) {
    const { doc } = this;
    for (let x = x1; x < x2; x += 2) {
      doc.line(x, y, Math.min(x + 1.1, x2), y);
    }
  }

  private textLines(lines: string[], x: number, y: number, lineHeight: number) {
    lines.forEach((line, index) => this.doc.text(line, x, y + index * lineHeight));
  }

  /* ------------------------------------------------------------- Cabecera */

  header() {
    const { doc } = this;
    const x = HEADER_X;
    const y = HEADER_Y;
    const middleX = x + HEADER_LOGO_W;
    const codeX = middleX + HEADER_DOC_W;
    const right = x + HEADER_LOGO_W + HEADER_DOC_W + HEADER_CODE_W;

    doc.rect(x, y, HEADER_LOGO_W + HEADER_DOC_W + HEADER_CODE_W, HEADER_H);
    doc.line(middleX, y, middleX, y + HEADER_H);
    doc.line(codeX, y, codeX, y + HEADER_H);
    doc.line(middleX, y + 12.5, codeX, y + 12.5);
    doc.line(codeX, y + 12.5, right, y + 12.5);
    doc.line(codeX, y + 17.8, right, y + 17.8);

    const logoW = 18.7;
    const logoH = logoW / (441 / 363);
    doc.addImage(logo(), "PNG", x + (HEADER_LOGO_W - logoW) / 2, y + (HEADER_H - logoH) / 2, logoW, logoH);

    this.font("bold", 9);
    doc.text("NOMBRE DEL DOCUMENTO:", middleX + 1.8, y + 3.9);
    const title = [
      "REGISTRO DE MODALIDAD Y TEMA O NÚCLEO PROBLÉMICO",
      "DE INVESTIGACIÓN.",
    ];
    this.font("bold", 9);
    this.textLines(title, middleX + 1.8, y + 7.4, 3.55);

    this.font("bold", 9);
    doc.text("PROCEDIMIENTO: TITULACIÓN DE ESTUDIANTES DE GRADO", middleX + 1.8, y + 15.4);
    doc.text("BAJO LA UNIDAD DE INTEGRACIÓN CURRICULAR", middleX + 1.8, y + 18.9);

    this.font("bold", 9);
    doc.text("CÓDIGO: PAT-04-F-002", codeX + 2.1, y + 7.9);
    doc.text("REVISIÓN:   1", codeX + 2.1, y + 16.1);

    this.y = y + HEADER_H;
  }

  newPage(startY = DATA_Y) {
    this.doc.addPage();
    this.header();
    this.y = startY;
  }

  /* --------------------------------------------------------- Franjas grises */

  band(title: string, height = BAND_H) {
    const { doc } = this;
    doc.setFillColor(217, 217, 217);
    doc.rect(MARGIN, this.y, CONTENT_W, height, "FD");
    this.font("bold", 9.8);
    doc.text(title, MARGIN + 2.2, this.y + height - 2.9);
    this.y += height;
  }

  /* ------------------------------------------------------- Datos personales */

  private prepareDataCell(cell: DataCell): PreparedCell {
    const padX = cell.padX ?? DATA_PAD;
    const labelSize = Math.min(cell.labelSize ?? 10, 10);
    const labelWidth = this.measure(cell.label, "bold", labelSize);
    const available = Math.max(8, cell.w - padX * 2 - labelWidth - 1.4);

    let valueSize = cell.valueSize ?? 10;
    let valueLines: string[] = [];
    if (cell.value) {
      let width = this.measure(cell.value, cell.valueBold ? "bold" : "normal", valueSize);
      while (width > available && valueSize > 7) {
        valueSize = Math.max(7, valueSize - 0.25);
        width = this.measure(cell.value, cell.valueBold ? "bold" : "normal", valueSize);
      }
      if (width <= available) {
        valueLines = [cell.value];
      } else {
        valueSize = 7;
        valueLines = this.wrap(cell.value, available, cell.valueBold ? "bold" : "normal", valueSize);
      }
    }
    const rowHeight = Math.max(ROW_H, 2.5 + valueLines.length * LINE);

    return {
      ...cell,
      labelSize,
      labelWidth,
      valueLines,
      valueSize,
      rowHeight,
    };
  }

  private dataRow(cells: DataCell[]) {
    const { doc } = this;
    const prepared = cells.map((cell) => this.prepareDataCell(cell));
    const height = Math.max(...prepared.map((cell) => cell.rowHeight));
    const y = this.y;

    doc.rect(MARGIN, y, CONTENT_W, height);
    let cellX = MARGIN;
    prepared.forEach((cell, index) => {
      const padX = cell.padX ?? DATA_PAD;
      const baseline = y + 4.8;
      this.font("bold", cell.labelSize);
      doc.text(cell.label, cellX + padX, baseline);
      if (cell.valueLines.length > 0) {
        this.font(cell.valueBold ? "bold" : "normal", cell.valueSize);
        const valueX = cellX + padX + cell.labelWidth + 1.4;
        this.textLines(cell.valueLines, valueX, baseline, LINE);
      }
      cellX += cell.w;
      if (index < prepared.length - 1) doc.line(cellX, y, cellX, y + height);
    });
    this.y += height;
  }

  private dataHeader() {
    const { doc } = this;
    const y = this.y;
    doc.setFillColor(217, 217, 217);
    doc.rect(MARGIN, y, CONTENT_W, ROW_H, "FD");
    this.font("bold", 10);
    doc.text("DATOS INFORMATIVOS DEL ESTUDIANTE", MARGIN + 2.2, y + 4.9);
    this.y += ROW_H;
  }

  private dataTable(member: PatDocumentMember) {
    const age = ageFrom(member.birthDate);
    const course = member.curso || (member.semester ? `${member.semester}.º` : "");
    this.dataHeader();

    this.dataRow([
      { label: "Facultad/Extensión/Sede:", value: member.faculty, w: CONTENT_W },
    ]);
    this.dataRow([{ label: "Carrera:", value: member.career, w: CONTENT_W }]);
    this.dataRow([
      { label: "Nombres y apellidos del estudiante:", value: member.fullName, w: CONTENT_W },
    ]);
    this.dataRow([
      { label: "Nivel:", value: member.level ?? "", w: 60 },
      { label: "Curso:", value: course, w: 60 },
      { label: "Paralelo:", value: member.parallel ?? "", w: 55 },
    ]);
    this.dataRow([
      { label: "Cédula de Ciudadanía:", value: member.cedula, w: 60 },
      { label: "Fecha de Nacimiento:", value: formatDate(member.birthDate), w: 115 },
    ]);
    this.dataRow([
      { label: "Edad:", value: age !== null ? String(age) : "", w: 60 },
      { label: "Sexo:", value: member.sex, w: 60 },
      { label: "Nacionalidad:", value: member.nationality ?? "", w: 55 },
    ]);
    this.dataRow([
      { label: "Estado Civil", value: member.maritalStatus ?? "", w: 60 },
      { label: "N° de Certificado de Votación:", value: member.votingCertificate ?? "", w: 115 },
    ]);
    this.dataRow([
      { label: "Provincia de residencia:", value: member.province ?? "", w: 60 },
      { label: "Cantón de residencia:", value: member.canton ?? "", w: 56.5 },
      { label: "Parroquia de residencia:", value: member.parish ?? "", w: 58.5 },
    ]);
    this.dataRow([
      { label: "Correos Electrónicos:", value: "", w: 42.5 },
      { label: "1)", value: member.institutionalEmail, w: 74 },
      { label: "2)", value: member.personalEmail, w: 58.5 },
    ]);
    this.dataRow([
      { label: "Teléfono Celular:", value: member.phone, w: 60 },
      { label: "Teléfono Convencional:", value: member.landline, w: 115 },
    ]);
  }

  /* ------------------------------------------------------------- Discapacidad */

  private disabilityTable(member: PatDocumentMember) {
    const { doc } = this;
    const x0 = MARGIN;
    const y0 = this.y;
    const leftW = 60;
    const cellW = 60;
    const totalH = DIS_ROW_H * 4;
    const rows: (readonly [string, string] | null)[] = [
      ["Visual", "Física"],
      ["Auditiva", "Intelectual"],
      ["Psicológica", "Lengua"],
      null,
    ];

    doc.rect(x0, y0, CONTENT_W, totalH);
    doc.line(x0 + leftW, y0, x0 + leftW, y0 + totalH);
    doc.line(x0 + leftW + cellW, y0, x0 + leftW + cellW, y0 + DIS_ROW_H * 3);
    for (let index = 1; index < 4; index++) {
      doc.line(x0 + leftW, y0 + index * DIS_ROW_H, x0 + CONTENT_W, y0 + index * DIS_ROW_H);
    }

    this.font("bold", 10);
    doc.text("Discapacidad", x0 + DATA_PAD, y0 + totalH / 2 + 1.1);

    const drawType = (type: string, cellX: number, rowY: number, wide = false) => {
      const selected = member.disabilityType === type;
      const boxX = cellX + 41.8;
      const boxY = rowY + 1.6;
      const boxW = 10;
      const boxH = 13.6;

      this.font("bold", 8);
      doc.text(`${type}:`, cellX + DIS_PAD, rowY + 6.15);
      doc.text("Grado de Discapacidad:", cellX + DIS_PAD, rowY + 12.85);

      doc.rect(boxX, boxY, boxW, boxH);
      doc.line(boxX, boxY + boxH / 2, boxX + boxW, boxY + boxH / 2);

      if (selected) {
        const cx = boxX + boxW / 2;
        const cy = boxY + boxH / 4;
        const radius = 1.9;
        doc.setLineWidth(0.35);
        doc.line(cx - radius, cy - radius, cx + radius, cy + radius);
        doc.line(cx + radius, cy - radius, cx - radius, cy + radius);
        doc.setLineWidth(0.2);
        if (member.disabilityDegree) {
          const grade = `${member.disabilityDegree} %`;
          let size = 7.2;
          while (this.measure(grade, "normal", size) > boxW - 1.2 && size > 5.4) size -= 0.2;
          this.font("normal", size);
          doc.text(grade, boxX + boxW / 2, boxY + boxH - 3.1, { align: "center" });
        }
      }
      if (wide) {
        // La fila "Otras" ocupa las dos columnas derechas.
        doc.line(cellX, rowY + DIS_ROW_H, x0 + CONTENT_W, rowY + DIS_ROW_H);
      }
    };

    rows.forEach((row, index) => {
      const rowY = y0 + index * DIS_ROW_H;
      if (row) {
        drawType(row[0], x0 + leftW, rowY);
        drawType(row[1], x0 + leftW + cellW, rowY);
      } else {
        drawType("Otras", x0 + leftW, rowY, true);
      }
    });

    this.y = y0 + totalH;
  }

  /* --------------------------------------------------------------- Aprobación */

  private approvalCell(
    x: number,
    y: number,
    cell: ApprovalCell,
    height: number,
    fill = false,
  ) {
    const { doc } = this;
    const size = cell.size ?? 9;
    const pad = 1.8;
    const width = cell.w - pad * 2;
    if (fill) {
      doc.setFillColor(217, 217, 217);
      doc.rect(x, y, cell.w, height, "FD");
    } else {
      doc.rect(x, y, cell.w, height);
    }
    const lines = cell.text
      .split("\n")
      .flatMap((part) => this.wrap(part, width, cell.bold === false ? "normal" : "bold", size));
    if (lines.length === 0) return;
    const totalTextH = (lines.length - 1) * LINE;
    const firstBaseline =
      cell.valign === "top"
        ? y + 0.55 + size * 0.264
        : y + (height - totalTextH) / 2 + size * 0.134;
    const textX = cell.align === "center" ? x + cell.w / 2 : x + pad;
    this.font(cell.bold === false ? "normal" : "bold", size);
    lines.forEach((line, index) => {
      doc.text(line, textX, firstBaseline + index * LINE, {
        align: cell.align === "center" ? "center" : "left",
      });
    });
  }

  private approvalTable() {
    const { doc } = this;
    const widths = [10, 62.6, 57.5, 44.9];
    const complexivo = isComplexivo(this.data.modality);
    const modality = this.data.modality.replace(/^Trabajo de Integración Curricular\s*-\s*/i, "");
    const x0 = MARGIN;
    const headerH = 16.4;

    const header: ApprovalCell[] = [
      { text: "No.", w: widths[0], size: 10, align: "center" },
      {
        text: "OPCIÓN DE APROBACIÓN\nPREVIO A TITULACIÓN",
        w: widths[1],
        size: 10,
        align: "center",
      },
      { text: "MODALIDAD", w: widths[2], size: 10, align: "center" },
      {
        text: "TÍTULO PROVISIONAL\nDEL TEMA PROPUESTO\nO NÚCLEO\nPROBLÉMICO",
        w: widths[3],
        size: 10,
        align: "center",
      },
    ];

    doc.rect(x0, this.y, CONTENT_W, headerH);
    let x = x0;
    header.forEach((cell, index) => {
      if (index > 0) doc.line(x, this.y, x, this.y + headerH);
      this.approvalCell(x, this.y, cell, headerH, true);
      x += cell.w;
    });
    this.y += headerH;

    const row1: ApprovalCell[] = [
      { text: "1", w: widths[0], size: 10, align: "center" },
      { text: "Trabajo de Integración Curricular", w: widths[1], bold: false, size: 10 },
      {
        text: complexivo ? "" : modality,
        w: widths[2],
        bold: false,
        size: 10,
      },
      {
        text: complexivo ? "" : this.data.title,
        w: widths[3],
        size: 10,
      },
    ];
    const row1Lines = row1.map((cell) =>
      this.wrap(cell.text, cell.w - 3.6, cell.bold === false ? "normal" : "bold", cell.size ?? 9),
    );
    const row1H = Math.max(6.2, 2.4 + Math.max(...row1Lines.map((lines) => lines.length)) * LINE);
    doc.rect(x0, this.y, CONTENT_W, row1H);
    x = x0;
    row1.forEach((cell, index) => {
      if (index > 0) doc.line(x, this.y, x, this.y + row1H);
      this.approvalCell(x, this.y, cell, row1H);
      x += cell.w;
    });
    this.y += row1H;

    const row2: ApprovalCell[] = [
      { text: "2", w: widths[0], size: 10, align: "center" },
      { text: "Examen de carácter complexivo", w: widths[1], bold: false, size: 10 },
      { text: "No Aplica.", w: widths[2], bold: false, size: 10, valign: "top" },
      {
        text: complexivo ? this.data.title : "",
        w: widths[3],
        size: 10,
        valign: "top",
      },
    ];
    const row2Lines = row2.map((cell) =>
      this.wrap(cell.text, cell.w - 3.6, cell.bold === false ? "normal" : "bold", cell.size ?? 9),
    );
    const row2H = Math.max(20.3, 2.4 + Math.max(...row2Lines.map((lines) => lines.length)) * LINE);
    doc.rect(x0, this.y, CONTENT_W, row2H);
    x = x0;
    row2.forEach((cell, index) => {
      if (index > 0) doc.line(x, this.y, x, this.y + row2H);
      this.approvalCell(x, this.y, cell, row2H);
      x += cell.w;
    });
    this.y += row2H;
  }

  /* -------------------------------------------------------------- Problemática */

  private problemSection(text: string): boolean {
    const { doc } = this;
    const title = "PROBLEMÁTICA DEL TRABAJO DE INTEGRACIÓN CURRICULAR";
    const reserve = 8.8; // franja de articulación
    const maxBottom = BOTTOM - reserve;
    let moved = false;

    // Si el título de la propuesta creció demasiado, no deja una caja
    // testimonial de una línea: continúa el contenido en una página nueva.
    if (maxBottom - this.y < 14) {
      this.newPage(DATA_Y);
      moved = true;
    }

    this.y += 2.5;
    this.band(title);

    let size = 7.4;
    let lines = this.wrap(text, CONTENT_W - 7, "normal", size);
    while (2.2 + lines.length * 3.05 > maxBottom - this.y && size > 6.1) {
      size -= 0.2;
      lines = this.wrap(text, CONTENT_W - 7, "normal", size);
    }

    const lineHeight = 3.05;
    let index = 0;
    let overflowed = moved;
    while (index < lines.length) {
      const available = maxBottom - this.y;
      const maxLines = Math.max(1, Math.floor((available - 2.2) / lineHeight));
      const chunk = lines.slice(index, index + maxLines);
      const height = Math.max(10, 2.2 + chunk.length * lineHeight);
      doc.rect(MARGIN, this.y, CONTENT_W, height);
      this.font("normal", size);
      this.textLines(chunk, MARGIN + 2, this.y + 3.5, lineHeight);
      this.y += height;
      index += chunk.length;
      if (index < lines.length) {
        this.newPage(DATA_Y);
        this.band(`${title} (CONTINUACIÓN)`);
        overflowed = true;
      }
    }

    if (lines.length === 0) {
      doc.rect(MARGIN, this.y, CONTENT_W, 10);
      this.y += 10;
    }

    return overflowed;
  }

  /* -------------------------------------------------------------- Página 2 */

  private articulationBlock() {
    const { doc } = this;
    const x0 = MARGIN;
    const y0 = this.y;
    const textW = 156.1;
    const boxW = 16.6;
    const sliverW = 2.3;
    const height = 19.8;

    doc.rect(x0, y0, CONTENT_W, height);
    doc.line(x0 + textW, y0, x0 + textW, y0 + height);
    doc.line(x0 + textW + boxW, y0, x0 + textW + boxW, y0 + height);

    const options = patArticulations;
    const rowH = height / 4;
    options.forEach((option, index) => {
      const rowY = y0 + index * rowH;
      if (index > 0) doc.line(x0 + textW, rowY, x0 + textW + boxW, rowY);
      doc.rect(x0 + textW, rowY, boxW, rowH);

      this.font("bold", 8);
      doc.text(option.pdfLabel, x0 + DIS_PAD, rowY + 3.55);

      if (this.data.articulations.includes(option.value)) {
        const cx = x0 + textW + boxW / 2;
        const cy = rowY + rowH / 2;
        const radius = 1.55;
        doc.setLineWidth(0.35);
        doc.line(cx - radius, cy - radius, cx + radius, cy + radius);
        doc.line(cx + radius, cy - radius, cx - radius, cy + radius);
        doc.setLineWidth(0.2);
      }
    });

    doc.rect(x0 + textW + boxW, y0, sliverW, height);
    this.y = y0 + height;
  }

  private mechanismBlock() {
    const { doc } = this;
    this.band("MECANISMO DE DESARROLLO Y PRESENTACIÓN");
    const inquiryH = 9;
    doc.rect(MARGIN, this.y, CONTENT_W, inquiryH);
    this.font("normal", 9);
    doc.text(
      "Se específica aquí si la propuesta será desarrollada de forma:",
      MARGIN + DATA_PAD,
      this.y + 5.4,
    );
    this.y += inquiryH;

    const answerH = 8.1;
    const participation = this.data.participationType === "GRUPAL" ? "En pareja" : "Individual";
    const answer = `${participation} — Mecanismo: ${this.data.presentationMechanism}`;
    doc.rect(MARGIN, this.y, CONTENT_W, answerH);
    this.font("normal", 9);
    doc.text(answer, MARGIN + DATA_PAD, this.y + 5.3);
    this.y += answerH;
  }

  private tutorBlock() {
    const { doc } = this;
    this.band("TUTOR/A SOLICITADO/A");
    const height = 19.8;
    doc.rect(MARGIN, this.y, CONTENT_W, height);
    const name = this.data.requestedTutor || "";
    if (name) {
      let size = 9;
      let lines = this.wrap(name, CONTENT_W - 4, "normal", size);
      while (lines.length > 4 && size > 7) {
        size -= 0.3;
        lines = this.wrap(name, CONTENT_W - 4, "normal", size);
      }
      this.font("normal", size);
      this.textLines(lines.slice(0, 4), MARGIN + 2.2, this.y + 5.6, 3.4);
    }
    this.y += height;
  }

  private signatureBlock(member: PatDocumentMember) {
    const { doc } = this;
    const x0 = 22;
    const width = 166;
    const leftW = 78.9;
    const bandH = 7.8;
    const rowH = 25.4;

    doc.setFillColor(217, 217, 217);
    doc.rect(x0, this.y, width, bandH, "FD");
    this.font("bold", 9.5);
    doc.text("FIRMA DE RESPONSABILIDAD", x0 + 3.2, this.y + bandH - 2.7);
    this.y += bandH;

    const rowY = this.y;
    doc.rect(x0, rowY, width, rowH);
    doc.line(x0 + leftW, rowY, x0 + leftW, rowY + rowH);

    this.font("bolditalic", 7.8);
    const label = this.wrap(
      "Nombres del estudiante que postula y presenta la propuesta:",
      leftW - 6,
      "bolditalic",
      7.8,
    );
    this.textLines(label, x0 + 3.2, rowY + 4.4, 4);

    if (member.fullName) {
      const nameLines = this.wrap(member.fullName, leftW - 6, "bold", 8.8);
      this.font("bold", 8.8);
      this.textLines(nameLines.slice(0, 3), x0 + 3.2, rowY + 16.1, 3.3);
    }

    this.font("bolditalic", 7.8);
    doc.text("Firma:", x0 + leftW + 3.2, rowY + 4.4);

    const lineY = rowY + 17.5;
    this.dashedLine(x0 + leftW + 4, lineY, x0 + width - 20.5);

    if (member.signature) {
      try {
        const props = doc.getImageProperties(member.signature);
        const maxW = 65;
        const maxH = 12;
        const ratio = Math.min(maxW / props.width, maxH / props.height);
        const imageW = props.width * ratio;
        const imageH = props.height * ratio;
        doc.addImage(
          member.signature,
          "PNG",
          x0 + leftW + (width - leftW - imageW) / 2,
          lineY - imageH - 1.2,
          imageW,
          imageH,
        );
      } catch {
        // Una firma inválida no debe impedir la descarga del formato.
      }
    }

    this.y = rowY + rowH;
  }

  private notes() {
    const start = this.y + 12.7 + 2.9;
    this.font("italic", 8);
    const note1 = this.wrap(
      "Nota 1: La aprobación preliminar de este formato, la otorgará la Comisión Académica mediante el sistema.",
      178,
      "italic",
      8,
    );
    const note2 = this.wrap(
      "Nota 2: El formato será llenado y presentado individualmente (por estudiante), firmado en físico, escaneado y subido en el sistema que corresponda en archivo pdf y entregando un ejemplar para el archivo físico de la Comisión Académica.",
      178,
      "italic",
      8,
    );
    this.textLines(note1, 24, start, 3.5);
    this.textLines(note2, 24, start + 3.5, 3.5);
  }

  /* ---------------------------------------------------------------- Montaje */

  private memberDataPage(member: PatDocumentMember): boolean {
    this.y = DATA_Y;
    this.dataTable(member);
    this.disabilityTable(member);
    this.y += 3;
    this.approvalTable();
    const overflowed = this.problemSection(this.data.problem);

    if (!overflowed && this.y + 9 <= BOTTOM) {
      this.band("ARTICULACIÓN DEL TRABAJO DE INTEGRACIÓN CURRICULAR CON FUNCIONES SUSTANTIVAS");
      const remaining = BOTTOM - this.y;
      if (remaining > 1) {
        this.doc.rect(MARGIN, this.y, CONTENT_W, remaining);
        this.y += remaining;
      }
    }
    return overflowed;
  }

  private articulationPage(member: PatDocumentMember, startY = 32.9) {
    this.y = startY;
    this.articulationBlock();
    this.mechanismBlock();
    this.tutorBlock();
    this.signatureBlock(member);
    this.notes();
  }

  private finalize() {
    const { doc } = this;
    const total = doc.getNumberOfPages();
    for (let page = 1; page <= total; page++) {
      doc.setPage(page);
      doc.setTextColor(0, 0, 0);
      this.font("normal", 9);
      const label = this.pageLabels[page - 1] ?? `Página ${page} de ${total}`;
      doc.text(label, HEADER_X + 145, HEADER_Y + 21.4, {
        align: "center",
      });
      doc.setTextColor(90, 90, 90);
      this.font("normal", 6.5);
      doc.text("Sistema de Gestión de Titulación ULEAM", MARGIN, FOOTER_Y);
      doc.text(
        `Registro N.º ${this.data.registrationId} · versión ${this.data.version}`,
        PAGE_W - MARGIN,
        FOOTER_Y,
        { align: "right" },
      );
    }
    doc.setTextColor(0, 0, 0);
  }

  build(): ArrayBuffer {
    this.data.members.forEach((member, index) => {
      if (index === 0) {
        this.header();
        this.y = DATA_Y;
      } else {
        this.newPage(DATA_Y);
      }
      const firstPage = this.doc.getNumberOfPages();
      const overflowed = this.memberDataPage(member);
      if (overflowed && this.y + 132 <= BOTTOM) {
        this.y += 4;
        this.articulationPage(member, this.y);
      } else {
        this.newPage(32.9);
        this.articulationPage(member);
      }
      const lastPage = this.doc.getNumberOfPages();
      const memberPages = lastPage - firstPage + 1;
      for (let page = firstPage; page <= lastPage; page++) {
        this.pageLabels[page - 1] = `Página ${page - firstPage + 1} de ${memberPages}`;
      }
    });
    this.finalize();
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
