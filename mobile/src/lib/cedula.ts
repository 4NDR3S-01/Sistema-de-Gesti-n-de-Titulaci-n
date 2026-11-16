/**
 * Lectura de la cédula ecuatoriana a partir del texto que reconoce el OCR del teléfono.
 * Sirve para la cédula nueva (policarbonato, con zona MRZ en el reverso) y la antigua.
 * Solo se toman los datos que también pide el formato PAT; el estudiante siempre los revisa.
 */

export type CedulaData = {
  cedula?: string;
  birthDate?: string;
  nationality?: string;
  maritalStatus?: string;
};

const MONTHS: Record<string, number> = {
  ENE: 1, ENERO: 1, JAN: 1,
  FEB: 2, FEBRERO: 2,
  MAR: 3, MARZO: 3,
  ABR: 4, ABRIL: 4, APR: 4,
  MAY: 5, MAYO: 5,
  JUN: 6, JUNIO: 6,
  JUL: 7, JULIO: 7,
  AGO: 8, AGOSTO: 8, AUG: 8,
  SEP: 9, SEPT: 9, SEPTIEMBRE: 9, SET: 9, SETIEMBRE: 9,
  OCT: 10, OCTUBRE: 10,
  NOV: 11, NOVIEMBRE: 11,
  DIC: 12, DICIEMBRE: 12, DEC: 12,
};

const MARITAL: [RegExp, string][] = [
  [/UNION\s+DE\s+HECHO/, "Unión de hecho"],
  [/SOLTER[OA]/, "Soltero/a"],
  [/CASAD[OA]/, "Casado/a"],
  [/DIVORCIAD[OA]/, "Divorciado/a"],
  [/VIUD[OA]/, "Viudo/a"],
];

/** Mayúsculas y sin tildes, para comparar sin importar cómo lo leyó el OCR. */
const normalize = (text: string) =>
  text
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toUpperCase();

const pad = (n: number) => String(n).padStart(2, "0");

/** AAAA-MM-DD si la fecha existe y corresponde a alguien de 16 a 90 años. */
function birthDateFrom(year: number, month: number, day: number, today: Date): string | undefined {
  const date = new Date(year, month - 1, day);
  if (date.getFullYear() !== year || date.getMonth() !== month - 1 || date.getDate() !== day) return undefined;
  let age = today.getFullYear() - year;
  if (today.getMonth() + 1 < month || (today.getMonth() + 1 === month && today.getDate() < day)) age -= 1;
  return age >= 16 && age <= 90 ? `${year}-${pad(month)}-${pad(day)}` : undefined;
}

/** Todas las fechas plausibles de nacimiento que aparecen en el texto, en orden de aparición. */
function datesIn(text: string, today: Date): { index: number; value: string }[] {
  const found: { index: number; value: string }[] = [];
  const add = (index: number, value?: string) => value && found.push({ index, value });

  // 12 MAR 1999 · 12 DE MARZO DE 1999 · 12-MAR-1999
  for (const m of text.matchAll(/\b(\d{1,2})[\s./-]*(?:DE\s+)?([A-Z]{3,10})\.?[\s./-]*(?:DE(?:L)?\s+)?(\d{4})\b/g)) {
    const month = MONTHS[m[2]];
    if (month) add(m.index, birthDateFrom(Number(m[3]), month, Number(m[1]), today));
  }
  // 1999-03-12 · 1999/03/12
  for (const m of text.matchAll(/\b(\d{4})[-/.](\d{1,2})[-/.](\d{1,2})\b/g)) {
    add(m.index, birthDateFrom(Number(m[1]), Number(m[2]), Number(m[3]), today));
  }
  // 12/03/1999 · 12-03-1999
  for (const m of text.matchAll(/\b(\d{1,2})[-/.](\d{1,2})[-/.](\d{4})\b/g)) {
    add(m.index, birthDateFrom(Number(m[3]), Number(m[2]), Number(m[1]), today));
  }
  return found.sort((a, b) => a.index - b.index);
}

/** Cédula ecuatoriana válida (provincia, tercer dígito y dígito verificador). */
export function isValidCedula(value: string): boolean {
  if (!/^\d{10}$/.test(value)) return false;
  const province = Number(value.slice(0, 2));
  if (!((province >= 1 && province <= 24) || province === 30) || Number(value[2]) >= 6) return false;
  const sum = value
    .slice(0, 9)
    .split("")
    .reduce((acc, digit, i) => {
      const n = Number(digit) * (i % 2 === 0 ? 2 : 1);
      return acc + (n > 9 ? n - 9 : n);
    }, 0);
  return (10 - (sum % 10)) % 10 === Number(value[9]);
}

/** Zona MRZ (TD1) del reverso: AAMMDD de nacimiento, sexo, vencimiento y nacionalidad. */
function fromMrz(text: string, today: Date): Pick<CedulaData, "birthDate" | "nationality"> {
  const compact = text.replace(/[\s«]/g, "").replace(/[Kk](?=<)/g, "<");
  const m = compact.match(/(\d{2})(\d{2})(\d{2})\d[MF<X](\d{6})\d([A-Z]{3})/);
  if (!m) return {};
  const yy = Number(m[1]);
  const year = yy + (yy > today.getFullYear() % 100 ? 1900 : 2000);
  return {
    birthDate: birthDateFrom(year, Number(m[2]), Number(m[3]), today),
    nationality: m[5] === "ECU" ? "Ecuatoriana" : undefined,
  };
}

/** Lee la cédula, la fecha de nacimiento, la nacionalidad y el estado civil del texto reconocido. */
export function parseCedula(lines: string[], today = new Date()): CedulaData {
  const text = normalize(lines.join("\n"));
  const result: CedulaData = {};

  const cedula = text.match(/\b\d{9}-?\d\b/g)?.map((v) => v.replace("-", "")).find(isValidCedula);
  if (cedula) result.cedula = cedula;

  // Se prefiere la fecha que sigue a «NACIMIENTO»; la de emisión o vencimiento no pasa el filtro de edad.
  const dates = datesIn(text, today);
  const label = text.search(/NACIMIENTO/);
  const afterLabel = label >= 0 ? dates.find((d) => d.index > label) : undefined;
  const mrz = fromMrz(text, today);
  const birthDate = afterLabel?.value ?? mrz.birthDate ?? dates[0]?.value;
  if (birthDate) result.birthDate = birthDate;

  if (/NACIONALIDAD[\s:]*ECUATORIAN/.test(text) || /\bECUATORIANA?\b/.test(text) || mrz.nationality) {
    result.nationality = "Ecuatoriana";
  } else {
    const other = text.match(/NACIONALIDAD[\s:]*([A-Z]{4,30})/)?.[1];
    if (other) result.nationality = other.charAt(0) + other.slice(1).toLowerCase();
  }

  const civil = text.match(/ESTADO\s*CIVIL[\s:]*([A-Z ]{4,20})/)?.[1] ?? text;
  const marital = MARITAL.find(([pattern]) => pattern.test(civil));
  if (marital) result.maritalStatus = marital[1];

  return result;
}
