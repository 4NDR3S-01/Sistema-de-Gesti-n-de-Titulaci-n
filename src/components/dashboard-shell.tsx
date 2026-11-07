"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState, type ReactNode } from "react";
import { signOut } from "next-auth/react";
import {
  Building2,
  ClipboardCheck,
  FilePen,
  Gavel,
  House,
  LogOut,
  Menu,
  PanelLeftClose,
  PanelLeftOpen,
  UserPen,
  UserPlus,
  Users,
  UsersRound,
  X,
  type LucideIcon,
} from "lucide-react";
import { Breadcrumbs, NotificationsMenu, UserMenu } from "@/components/header-menus";
import type { AppRole } from "@/lib/auth-roles";
import type { AppNotification } from "@/lib/data/notifications";

type NavLink = { href: string; label: string; icon: LucideIcon; count?: number };
type NavSection = { title: string; links: NavLink[] };

function buildNav(role: AppRole, pendingReviews: number): NavSection[] {
  const sections: NavSection[] = [
    { title: "General", links: [{ href: "/panel", label: "Inicio", icon: House }] },
  ];

  if (role === "STUDENT") {
    sections.push({
      title: "Mi titulación",
      links: [
        { href: "/perfil", label: "Mis datos", icon: UserPen },
        { href: "/registro-pat-2", label: "Registro de tema PAT 2", icon: FilePen },
      ],
    });
    return sections;
  }

  sections.push(
    {
      title: "Estudiantes",
      links: [
        { href: "/estudiantes", label: "Listado de estudiantes", icon: UsersRound },
        { href: "/estudiantes/nuevo", label: "Nuevo estudiante", icon: UserPlus },
      ],
    },
    {
      title: "Secretaría",
      links: [
        {
          href: "/aprobacion-pat-2",
          label: "Aprobación de PAT 2",
          icon: ClipboardCheck,
          count: pendingReviews,
        },
        { href: "/tribunales", label: "Tribunales de defensa", icon: Gavel },
      ],
    },
  );

  if (role === "ADMIN") {
    sections.push({
      title: "Administración",
      links: [
        { href: "/admin/usuarios", label: "Usuarios", icon: Users },
        { href: "/admin/carreras", label: "Carreras y facultades", icon: Building2 },
      ],
    });
  }
  return sections;
}

function isActive(pathname: string, href: string) {
  if (href === "/estudiantes") {
    return pathname === href || /^\/estudiantes\/\d+/.test(pathname);
  }
  return pathname === href || pathname.startsWith(`${href}/`);
}

const COLLAPSE_KEY = "uleam:sidebar-collapsed";

export function DashboardShell({
  role,
  userName,
  roleLabel,
  userEmail,
  pendingReviews = 0,
  notifications,
  children,
}: {
  role: AppRole;
  userName: string;
  userEmail: string;
  roleLabel: string;
  pendingReviews?: number;
  notifications: AppNotification[];
  children: ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const [collapsed, setCollapsed] = useState(false);
  // El menú móvil queda abierto solo en la ruta donde se abrió: al navegar se cierra.
  const [menuOpenedAt, setMenuOpenedAt] = useState<string | null>(null);
  const [signingOut, setSigningOut] = useState(false);
  const mobileOpen = menuOpenedAt === pathname;
  const sections = buildNav(role, pendingReviews);

  useEffect(() => {
    try {
      // Preferencia local del usuario: se aplica después de hidratar.
      // eslint-disable-next-line react-hooks/set-state-in-effect
      if (localStorage.getItem(COLLAPSE_KEY) === "1") setCollapsed(true);
    } catch {
      /* almacenamiento no disponible */
    }
  }, []);

  useEffect(() => {
    if (!mobileOpen) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setMenuOpenedAt(null);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [mobileOpen]);

  function toggleCollapsed() {
    setCollapsed((value) => {
      try {
        localStorage.setItem(COLLAPSE_KEY, value ? "0" : "1");
      } catch {
        /* almacenamiento no disponible */
      }
      return !value;
    });
  }

  async function handleSignOut() {
    setSigningOut(true);
    await signOut({ redirect: false });
    router.replace("/");
    router.refresh();
  }

  return (
    <div
      className={`app-shell${collapsed ? " is-collapsed" : ""}${mobileOpen ? " is-mobile-open" : ""}`}
    >
      <aside className="app-sidebar" aria-label="Menú principal">
        <div className="app-sidebar-head">
          <Link className="app-logo" href="/panel" aria-label="Titulación ULEAM, ir al inicio">
            <Image
              className="app-logo-full"
              src="/brand/uleam-logo-white.png"
              alt=""
              width={796}
              height={231}
              preload
            />
            <Image
              className="app-logo-seal"
              src="/brand/uleam-seal.png"
              alt=""
              width={231}
              height={231}
              style={{ filter: "brightness(0) invert(1)" }}
            />
          </Link>
          <button
            className="icon-btn app-collapse"
            type="button"
            aria-label={collapsed ? "Expandir menú" : "Contraer menú"}
            aria-pressed={collapsed}
            onClick={toggleCollapsed}
          >
            {collapsed ? <PanelLeftOpen aria-hidden="true" /> : <PanelLeftClose aria-hidden="true" />}
          </button>
          <button
            className="icon-btn app-menu-toggle"
            type="button"
            aria-label="Cerrar menú"
            onClick={() => setMenuOpenedAt(null)}
            style={{ color: "inherit" }}
          >
            <X aria-hidden="true" />
          </button>
        </div>

        <nav className="app-nav">
          {sections.map((section) => (
            <div className="app-nav-section" key={section.title}>
              <p className="app-nav-heading">{section.title}</p>
              {section.links.map((link) => {
                const active = isActive(pathname, link.href);
                const Icon = link.icon;
                return (
                  <Link
                    className={`app-nav-link${active ? " active" : ""}`}
                    href={link.href}
                    key={link.href}
                    title={collapsed ? link.label : undefined}
                    aria-current={active ? "page" : undefined}
                  >
                    <Icon aria-hidden="true" />
                    <span>{link.label}</span>
                    {link.count ? (
                      <span className="app-nav-count" aria-label={`${link.count} pendientes`}>
                        {link.count}
                      </span>
                    ) : null}
                  </Link>
                );
              })}
            </div>
          ))}
        </nav>

        <div className="app-sidebar-foot">
          <button
            className="app-nav-link"
            type="button"
            title={collapsed ? "Cerrar sesión" : undefined}
            onClick={handleSignOut}
            disabled={signingOut}
          >
            <LogOut aria-hidden="true" />
            <span>{signingOut ? "Cerrando sesión…" : "Cerrar sesión"}</span>
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
            className="icon-btn app-menu-toggle"
            type="button"
            aria-label="Abrir menú"
            aria-expanded={mobileOpen}
            onClick={() => setMenuOpenedAt(pathname)}
          >
            <Menu aria-hidden="true" />
          </button>
          <Breadcrumbs />
          <div className="app-header-actions">
            <NotificationsMenu items={notifications} />
            <span className="header-divider" aria-hidden="true" />
            <UserMenu name={userName} email={userEmail} roleLabel={roleLabel} role={role} />
          </div>
        </header>
        <main className="app-content" id="contenido">
          {children}
        </main>
      </div>
    </div>
  );
}
