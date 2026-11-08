"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { ArrowUpRight, Info, ShieldCheck, X } from "lucide-react";

type Content = "about" | "terms";

/** Equipo de desarrollo: cada tarjeta lleva a su perfil de GitHub (avatares guardados en public/team). */
const creators = [
  { name: "William Cabrera Palacios", github: "4NDR3S-01" },
  { name: "Jennifer Tigua Anchundia", github: "JSTA640" },
  { name: "Luis Mendoza Zambrano", github: "Luis-M25" },
  { name: "Victor Zambrano Martínez", github: "VictorZ1111" },
];

const REPOSITORY_URL = "https://github.com/4NDR3S-01/Sistema-de-Gesti-n-de-Titulaci-n";

/** Marca oficial de GitHub (lucide ya no incluye logotipos de marcas). */
function GitHubMark() {
  return (
    <svg viewBox="0 0 16 16" aria-hidden="true" fill="currentColor">
      <path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.013 8.013 0 0016 8c0-4.42-3.58-8-8-8z" />
    </svg>
  );
}

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
          <div className="login-bottom-top">
            <div className="login-bottom-identity">
              <span className="login-bottom-mark" aria-hidden="true">
                <Image src="/brand/uleam-seal-white.png" alt="" width={231} height={231} />
              </span>
              <div>
                <strong>Sistema de Gestión de Titulación</strong>
                <span>Universidad Laica Eloy Alfaro de Manabí · Manta, Ecuador</span>
              </div>
            </div>
            <nav className="login-bottom-links" aria-label="Información adicional">
              <button type="button" onClick={() => setOpened("about")}>
                <Info aria-hidden="true" /> Acerca de
              </button>
              <button type="button" onClick={() => setOpened("terms")}>
                <ShieldCheck aria-hidden="true" /> Términos y condiciones
              </button>
            </nav>
          </div>

          <section className="login-bottom-team" aria-labelledby="login-team-title">
            <h2 id="login-team-title">Desarrollado por</h2>
            <ul>
              {creators.map((person) => (
                <li key={person.github}>
                  <a
                    className="login-dev"
                    href={`https://github.com/${person.github}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label={`${person.name}, perfil de GitHub @${person.github} (se abre en una pestaña nueva)`}
                  >
                    <Image
                      className="login-dev-avatar"
                      src={`/team/${person.github.toLowerCase()}.jpg`}
                      alt=""
                      width={44}
                      height={44}
                    />
                    <span className="login-dev-text">
                      <strong>{person.name}</strong>
                      <span>
                        <GitHubMark />@{person.github}
                      </span>
                    </span>
                    <ArrowUpRight className="login-dev-go" aria-hidden="true" />
                  </a>
                </li>
              ))}
            </ul>
          </section>
        </div>

        <div className="login-bottom-legal">
          <div>
            <span>© {new Date().getFullYear()} ULEAM. Uso exclusivo para la comunidad universitaria.</span>
            <a href={REPOSITORY_URL} target="_blank" rel="noopener noreferrer">
              <GitHubMark /> Código fuente del proyecto
            </a>
          </div>
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
