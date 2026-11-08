import { handler, ok, requireApiUser } from "@/lib/api/http";
import {
  disabilityTypes,
  ecuadorProvinces,
  maritalStatuses,
  patArticulations,
  patLevels,
  patMechanisms,
  patModalities,
  patParallels,
} from "@/lib/pat-options";

/** Opciones de los formularios: la app no las duplica, las pide al servidor. */
export const GET = handler(async (request: Request) => {
  const user = await requireApiUser(request);
  if (user instanceof Response) return user;
  return ok({
    modalities: patModalities,
    mechanisms: patMechanisms,
    articulations: patArticulations,
    levels: patLevels,
    parallels: patParallels,
    maritalStatuses,
    disabilityTypes,
    provinces: ecuadorProvinces,
  });
});
