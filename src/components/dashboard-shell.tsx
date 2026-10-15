"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState, type ReactNode } from "react";
import { signOut } from "next-auth/react";
import type { AppRole } from "@/lib/auth-roles";

type DashboardShellProps = {
  role: AppRole;
  userName: string;
  roleLabel: string;
  children: ReactNode;
};

type NavGroup = {
  title: string;
  icon: string;
  links: { href: string; label: string }[];
};

const icons = {
  home: "M4 11 12 4l8 7v9h-5v-6H9v6H4z",
  students: "M2 9 12 4l10 5-10 5zM6 11v5c3 2.5 9 2.5 12 0v-5",
  secretary: "M6 3h9l4 4v14H6zM14 3v5h5M9 13h7M9 17h7",
  admin:
    "M12 3l7 3v5c0 4.5-3 8-7 10-4-2-7-5.5-7-10V6zM9 12l2 2 4-4",
};

function buildNav(role: AppRole): NavGroup[] {
  const groups: NavGroup[] = [];

  if (role === "STUDENT") {
    groups.push({
      title: "Estudiantes",
      icon: icons.students,
      links: [
        { href: "/perfil", label: "Mis datos" },
        { href: "/registro-pat-2", label: "Registro de tema PAT 2" },
      ],
    });
  } else {
    groups.push({
      title: "Estudiantes",
      icon: icons.students,
      links: [
        { href: "/estudiantes", label: "Listado de estudiantes" },
        { href: "/estudiantes/nuevo", label: "Nuevo estudiante" },
        ...(role === "ADMIN"
          ? [{ href: "/registro-pat-2", label: "Registro de tema PAT 2" }]
          : []),
      ],
    });
    groups.push({
      title: "Secretaría",
      icon: icons.secretary,
      links: [
        { href: "/aprobacion-pat-2", label: "Aprobación de PAT 2" },
        { href: "/tribunales", label: "Asignación de tribunales" },
      ],
    });
  }

  if (role === "ADMIN") {
    groups.push({
      title: "Administración",
      icon: icons.admin,
      links: [
        { href: "/admin/usuarios", label: "Usuarios" },
        { href: "/admin/carreras", label: "Carreras y facultades" },
      ],
    });
  }
  return groups;
}

function isActive(pathname: string, href: string) {
  if (href === "/estudiantes") {
    return pathname === href || /^\/estudiantes\/\d+/.test(pathname);
  }
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function DashboardShell({
  role,
  userName,
  roleLabel,
  children,
}: DashboardShellProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [collapsed, setCollapsed] = useState(false);
  // El menú móvil queda abierto solo en la ruta donde se abrió: al navegar se cierra.
  const [menuOpenedAt, setMenuOpenedAt] = useState<string | null>(null);
  const mobileOpen = menuOpenedAt === pathname;
  const groups = buildNav(role);
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
          <Link
            className={`app-nav-link${pathname === "/panel" ? " active" : ""}`}
            href="/panel"
            title="Inicio"
            aria-current={pathname === "/panel" ? "page" : undefined}
          >
            <svg viewBox="0 0 24 24" aria-hidden="true">
              <path d={icons.home} />
            </svg>
            <span>Inicio</span>
          </Link>

          {groups.map((group) => {
            const groupActive = group.links.some((link) => isActive(pathname, link.href));
            return (
              <details className="app-nav-group" open key={group.title}>
                <summary
                  className={`app-nav-link${groupActive ? " has-active" : ""}`}
                  title={group.title}
                >
                  <svg viewBox="0 0 24 24" aria-hidden="true">
                    <path d={group.icon} />
                  </svg>
                  <span>{group.title}</span>
                  <svg className="app-chevron" viewBox="0 0 24 24" aria-hidden="true">
                    <path d="m9 6 6 6-6 6" />
                  </svg>
                </summary>
                {group.links.map((link) => {
                  const active = isActive(pathname, link.href);
                  return (
                    <Link
                      className={`app-nav-sublink${active ? " active" : ""}`}
                      href={link.href}
                      key={link.href}
                      aria-current={active ? "page" : undefined}
                    >
                      {link.label}
                    </Link>
                  );
                })}
              </details>
            );
          })}
        </nav>

        <div className="app-sidebar-foot">
          <button
            className="app-nav-link app-sign-out"
            type="button"
            title="Cerrar sesión"
            onClick={async () => {
              await signOut({ redirect: false });
              router.replace("/");
              router.refresh();
            }}
          >
            <svg viewBox="0 0 24 24" aria-hidden="true">
              <path d="M10 4H5v16h5M14 8l4 4-4 4M18 12H9" />
            </svg>
            <span>Cerrar sesión</span>
          </button>
        </div>
      </aside>

      <button
        className="app-backdrop"
        type="button"
        aria-label="Cerrar menú"
        tabIndex={-1}
        onClick={() => setMenuOpenedAt(null)}
      />

      <div className="app-main">
        <header className="app-header">
          <button
            className="app-menu-toggle"
            type="button"
            aria-label="Abrir menú"
            onClick={() => setMenuOpenedAt(pathname)}
          >
            <svg viewBox="0 0 24 24" aria-hidden="true">
              <path d="M4 7h16M4 12h16M4 17h16" />
            </svg>
          </button>
          <p className="app-header-title">DGDA - Titulación</p>
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
