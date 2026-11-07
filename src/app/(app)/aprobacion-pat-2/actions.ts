"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { staffRoles } from "@/lib/auth-roles";
import { requireUser } from "@/lib/current-user";
import { reviewRegistration } from "@/lib/data/pat";
import { formResult, type FormState } from "@/lib/form-state";
import { patReviewSchema, validationError } from "@/lib/validation";

export async function reviewPatAction(
  registrationId: number,
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  const reviewer = await requireUser(staffRoles);

  const parsed = patReviewSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    return validationError(formData, parsed.error.flatten().fieldErrors);
  }

  let reviewed: boolean;
  try {
    reviewed = await reviewRegistration(
      registrationId,
      reviewer.id,
      parsed.data.decision,
      parsed.data.observations,
    );
  } catch (error) {
    console.error("Error al revisar registro PAT 2", error);
    return formResult({ status: "error", message: "No se pudo guardar la decisión. Inténtalo de nuevo." });
  }
  if (!reviewed) {
    return formResult({ status: "error", message: "Este registro ya fue revisado por otra persona." });
  }

  revalidatePath("/aprobacion-pat-2");
  revalidatePath("/tribunales");
  revalidatePath("/panel");
  redirect(`/aprobacion-pat-2?ok=${parsed.data.decision === "APPROVED" ? "aprobado" : "devuelto"}`);
}
