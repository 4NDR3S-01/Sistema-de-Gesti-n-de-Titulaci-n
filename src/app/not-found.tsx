import Image from "next/image";
import Link from "next/link";

export default function NotFound() {
  return (
    <main className="not-found duotone">
      <Image className="duotone-bg" src="/campus/relieve.jpg" alt="" fill sizes="100vw" />
      <div className="not-found-inner">
        <Image src="/brand/uleam-logo-white.png" alt="Uleam" width={796} height={231} />
        <h1>Esta página no existe</h1>
        <p>Es posible que el enlace esté incompleto o que el registro haya sido eliminado.</p>
        <Link className="btn btn-primary btn-lg" href="/panel" style={{ background: "#fff", color: "var(--harbor)" }}>
          Ir al inicio
        </Link>
      </div>
    </main>
  );
}
