/** Resultado de un caso de uso: lo traducen la web (formularios) y la API (JSON). */
export type ServiceError = {
  status: number;
  code: string;
  message: string;
  fields?: Record<string, string[] | undefined>;
};

export type ServiceResult<T = undefined> = { ok: true; data: T } | ({ ok: false } & ServiceError);

export const success = <T = undefined>(data?: T): ServiceResult<T> => ({ ok: true, data: data as T });

export const failure = (
  status: number,
  code: string,
  message: string,
  fields?: Record<string, string[] | undefined>,
): { ok: false } & ServiceError => ({ ok: false, status, code, message, fields });

export const invalid = (fields: Record<string, string[] | undefined>) =>
  failure(422, "validation", "Revisa los campos marcados.", fields);
