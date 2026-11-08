import { Download } from "lucide-react";

/**
 * Descarga del formato PAT-04-F-002. El PDF lo genera el servidor
 * (/api/pat/[id]/pdf), el mismo que usa la app móvil: ambos obtienen
 * exactamente el mismo documento.
 */
export function PatPdfButton({
  registrationId,
  unsigned = false,
  className = "btn btn-secondary",
  label = "Descargar formato PDF",
}: {
  registrationId: number;
  /** Sin firmas: para imprimir y firmar a mano. */
  unsigned?: boolean;
  className?: string;
  label?: string;
}) {
  return (
    <a className={className} href={`/api/pat/${registrationId}/pdf${unsigned ? "?firmas=0" : ""}`} download>
      <Download aria-hidden="true" />
      {label}
    </a>
  );
}
