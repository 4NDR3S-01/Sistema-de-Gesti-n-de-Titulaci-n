"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { Info, ShieldCheck, X } from "lucide-react";

type Content = "about" | "terms";

const creators = [
  "William Cabrera Palacios",
  "Jennifer Tigua Anchundia",
  "Luis Mendoza Zambrano",
  "Victor Zambrano Martínez",
];

export function LoginFooter() {
  const [opened, setOpened] = useState<Content | null>(null);
  const closeButton = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!opened) return;
    closeButton.current?.focus();
    function onKeyDown(event: globalThis.KeyboardEvent) {
      if (event.key === "Escape") setOpened(null);
    }
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [opened]);

  return (
    <>
      <footer className="login-bottom-bar" aria-label="Información del sistema">
        <div className="login-bottom-inner">
          <div className="login-bottom-brand">
            <Image
              src="/brand/uleam-logo-white.png"
              alt="Universidad Laica Eloy Alfaro de Manabí"
              width={796}
              height={231}
              className="login-bottom-logo"
            />
          </div>

          <div className="login-bottom-separator" aria-hidden="true" />

          <div className="login-bottom-creators">
            <strong>Creadores</strong>
            <div className="login-bottom-names">
              {creators.map((name) => <span key={name}>{name}</span>)}
            </div>
          </div>

          <div className="login-bottom-separator login-bottom-separator-last" aria-hidden="true" />

          <nav className="login-bottom-links" aria-label="Información adicional">
            <button type="button" onClick={() => setOpened("about")}>
              <Info aria-hidden="true" /> Acerca de
            </button>
            <button type="button" onClick={() => setOpened("terms")}>
              <ShieldCheck aria-hidden="true" /> Términos y condiciones
            </button>
          </nav>
        </div>
      </footer>

      {opened && (
        <div className="login-info-overlay" onMouseDown={(event) => {
          if (event.target === event.currentTarget) setOpened(null);
        }}>
          <section
            role="dialog"
            aria-modal="true"
            aria-labelledby="login-info-title"
            aria-describedby="login-info-description"
            className="login-info-dialog"
          >
            <button
              type="button"
              ref={closeButton}
              onClick={() => setOpened(null)}
              className="login-info-close"
              aria-label="Cerrar información"
            ><X aria-hidden="true" /></button>
            <div className="login-info-icon">
              {opened === "about" ? <Info aria-hidden="true" /> : <ShieldCheck aria-hidden="true" />}
            </div>
            <h2 id="login-info-title">{opened === "about" ? "Acerca del sistema" : "Términos y condiciones"}</h2>
            <p id="login-info-description">
              {opened === "about"
                ? "El Sistema de Gestión de Titulación organiza el registro, la revisión y el seguimiento de los procesos académicos de titulación. Estudiantes y personal autorizado acceden según sus funciones."
                : "El acceso está destinado a usuarios autorizados. La información registrada debe ser verídica y utilizarse exclusivamente para fines académicos. Cada usuario es responsable de mantener la confidencialidad de sus credenciales."}
            </p>
            <button type="button" className="login-info-done" onClick={() => setOpened(null)}>Entendido</button>
          </section>
        </div>
      )}
    </>
  );
}
