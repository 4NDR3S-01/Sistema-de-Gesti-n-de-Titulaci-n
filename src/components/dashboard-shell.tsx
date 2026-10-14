"use client";

import Link from "next/link";
import { useState, type ReactNode } from "react";
import { signOut } from "next-auth/react";
import type { AppRole } from "@/lib/auth-roles";

type DashboardShellProps = {
  role: AppRole;
  userName: string;
  roleLabel: string;
  version: string;
  children: ReactNode;
};

export function DashboardShell({
  role,
  userName,
  roleLabel,
  version,
  children,
}: DashboardShellProps) {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const canStudent = role !== "SECRETARY";
  const canSecretary = role === "SECRETARY" || role === "ADMIN";
  const initials = userName
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((word) => word[0]?.toUpperCase())
    .join("");

  return (
    <div
      className={`app-shell${collapsed ? " is-collapsed" : ""}${mobileOpen ? " is-mobile-open" : ""}`}
    >
      <aside className="app-sidebar" aria-label="Menú principal">
        <div className="app-sidebar-head">
          <Link className="app-logo" href="/panel" aria-label="Panel principal">
            <span className="app-logo-mark" aria-hidden="true">GT</span>
            <span className="app-logo-text">
              <strong>Titulación</strong>
              <small>GESTIÓN ACADÉMICA</small>
            </span>
          </Link>
          <button
            className="app-collapse"
            type="button"
            aria-label={collapsed ? "Expandir menú" : "Contraer menú"}
            aria-pressed={collapsed}
            onClick={() => setCollapsed((value) => !value)}
          >
            <svg viewBox="0 0 24 24" aria-hidden="true">
              <path d="M9 4v5H4M15 4v5h5M9 20v-5H4M15 20v-5h5" />
            </svg>
          </button>
        </div>

        <nav className="app-nav">
          <Link className="app-nav-link active" href="/panel" title="Inicio">
            <svg viewBox="0 0 24 24" aria-hidden="true">
              <path d="M4 11 12 4l8 7v9h-5v-6H9v6H4z" />
            </svg>
            <span>Inicio</span>
          </Link>

          {canStudent && (
            <details className="app-nav-group" open>
              <summary className="app-nav-link" title="Estudiantes">
                <svg viewBox="0 0 24 24" aria-hidden="true">
                  <path d="M2 9 12 4l10 5-10 5zM6 11v5c3 2.5 9 2.5 12 0v-5" />
                </svg>
                <span>Estudiantes</span>
                <svg className="app-chevron" viewBox="0 0 24 24" aria-hidden="true">
                  <path d="m9 6 6 6-6 6" />
                </svg>
              </summary>
              <Link className="app-nav-sublink" href="/registro-pat-2">
                Registro de tema PAT 2
              </Link>
            </details>
          )}

          {canSecretary && (
            <details className="app-nav-group" open>
              <summary className="app-nav-link" title="Secretaría">
                <svg viewBox="0 0 24 24" aria-hidden="true">
                  <path d="M6 3h9l4 4v14H6zM14 3v5h5M9 13h7M9 17h7" />
                </svg>
                <span>Secretaría</span>
                <svg className="app-chevron" viewBox="0 0 24 24" aria-hidden="true">
                  <path d="m9 6 6 6-6 6" />
                </svg>
              </summary>
              <Link className="app-nav-sublink" href="/aprobacion-pat-2">
                Aprobación de PAT 2
              </Link>
              <Link className="app-nav-sublink" href="/tribunales">
                Asignación de tribunales
              </Link>
            </details>
          )}

          <button
            className="app-nav-link"
            type="button"
            title="Salir"
            onClick={() => signOut({ redirectTo: "/" })}
          >
            <svg viewBox="0 0 24 24" aria-hidden="true">
              <path d="M10 4H5v16h5M14 8l4 4-4 4M18 12H9" />
            </svg>
            <span>Salir</span>
          </button>
        </nav>

        <p className="app-sidebar-foot">Versión {version}</p>
      </aside>

      <button
        className="app-backdrop"
        type="button"
        aria-label="Cerrar menú"
        tabIndex={-1}
        onClick={() => setMobileOpen(false)}
      />

      <div className="app-main">
        <header className="app-header">
          <button
            className="app-menu-toggle"
            type="button"
            aria-label="Abrir menú"
            onClick={() => setMobileOpen(true)}
          >
            <svg viewBox="0 0 24 24" aria-hidden="true">
              <path d="M4 7h16M4 12h16M4 17h16" />
            </svg>
          </button>
          <h1 className="app-header-title">
            DGDA - Titulación <span>· Versión {version}</span>
          </h1>
          <label className="app-search">
            <svg viewBox="0 0 24 24" aria-hidden="true">
              <circle cx="11" cy="11" r="6" />
              <path d="m20 20-4.5-4.5" />
            </svg>
            <input type="search" placeholder="Buscar…" aria-label="Buscar" />
          </label>
          <div className="app-user">
            <span className="app-user-text">
              <strong>{userName}</strong>
              <small>{roleLabel}</small>
            </span>
            <span className="app-avatar" aria-hidden="true">{initials || "U"}</span>
          </div>
        </header>
        <main className="app-content">{children}</main>
      </div>
    </div>
  );
}
