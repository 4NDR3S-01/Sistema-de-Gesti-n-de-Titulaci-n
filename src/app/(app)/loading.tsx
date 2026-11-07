import { LoaderCircle } from "lucide-react";

export default function Loading() {
  return (
    <div className="empty-state" role="status">
      <LoaderCircle className="spin" aria-hidden="true" style={{ width: 28, height: 28, color: "var(--uleam)" }} />
      <p>Cargando…</p>
    </div>
  );
}
