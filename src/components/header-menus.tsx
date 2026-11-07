"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useId, useRef, useState, type ReactNode } from "react";
import { signOut } from "next-auth/react";
import {
  Bell,
  BellOff,
  ChevronDown,
  ChevronRight,
  FilePen,
  KeyRound,
  LoaderCircle,
  LogOut,
  UserPen,
} from "lucide-react";
import type { AppRole } from "@/lib/auth-roles";
import type { AppNotification } from "@/lib/data/notifications";

/** Estado abierto/cerrado con cierre por Escape, clic fuera y cambio de ruta. */
function usePopover() {
  const pathname = usePathname();
  const [openAt, setOpenAt] = useState<string | null>(null);
  const open = openAt === pathname;
  const ref = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!open) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setOpenAt(null);
        triggerRef.current?.focus();
      }
    };
    const onClick = (event: MouseEvent) => {
      if (!ref.current?.contains(event.target as Node)) setOpenAt(null);
    };
    document.addEventListener("keydown", onKey);
    document.addEventListener("mousedown", onClick);
    // Lleva el foco al primer elemento del menú para usarlo con teclado.
    ref.current?.querySelector<HTMLElement>("[data-autofocus]")?.focus();
    return () => {
      document.removeEventListener("keydown", onKey);
      document.removeEventListener("mousedown", onClick);
    };
  }, [open]);

  return {
    open,
    ref,
    triggerRef,
    toggle: () => setOpenAt(open ? null : pathname),
    close: () => setOpenAt(null),
  };
}

/* ------------------------------------------------------------- Breadcrumbs */

const segmentLabels: Record<string, string> = {
  panel: "Inicio",
  perfil: "Mis datos",
  cuenta: "Mi cuenta",
  "registro-pat-2": "Registro de tema PAT 2",
  estudiantes: "Estudiantes",
  nuevo: "Nuevo",
  editar: "Editar",
  "aprobacion-pat-2": "Aprobación de PAT 2",
  tribunales: "Tribunales de defensa",
  admin: "Administración",
  usuarios: "Usuarios",
  carreras: "Carreras y facultades",
};

export function Breadcrumbs() {
  const pathname = usePathname();
  const segments = pathname.split("/").filter(Boolean);
  const crumbs: { label: string; href: string }[] = [];
  let href = "";
  for (const [index, segment] of segments.entries()) {
    href += `/${segment}`;
    if (segment === "admin") continue; // no tiene página propia
    if (/^\d+$/.test(segment)) {
      // Un id: en la bandeja es una revisión; en otros casos se omite.
      if (segments[index - 1] === "aprobacion-pat-2") crumbs.push({ label: "Revisión", href });
      continue;
    }
    crumbs.push({ label: segmentLabels[segment] ?? segment, href });
  }
  if (crumbs.length === 0 || crumbs[0].href !== "/panel") crumbs.unshift({ label: "Inicio", href: "/panel" });
  if (pathname === "/panel") crumbs.splice(1);

  return (
    <nav className="breadcrumbs" aria-label="Ubicación">
      <ol>
        {crumbs.map((crumb, index) => {
          const last = index === crumbs.length - 1;
          return (
            <li key={crumb.href}>
              {index > 0 && <ChevronRight aria-hidden="true" />}
              {last ? (
                <span aria-current="page">{crumb.label}</span>
              ) : (
                <Link href={crumb.href}>{crumb.label}</Link>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}

/* ------------------------------------------------------------- Notificaciones */

export function NotificationsMenu({ items }: { items: AppNotification[] }) {
  const { open, ref, triggerRef, toggle, close } = usePopover();
  const panelId = useId();
  // Las buenas noticias se muestran, pero no cuentan como pendientes.
  const actionable = items.filter((item) => item.tone !== "success").length;

  return (
    <div className="popover" ref={ref}>
      <button
        ref={triggerRef}
        className="icon-btn header-icon-btn"
        type="button"
        aria-label={actionable ? `Notificaciones: ${actionable} pendientes` : "Notificaciones"}
        aria-expanded={open}
        aria-controls={panelId}
        onClick={toggle}
      >
        <Bell aria-hidden="true" />
        {actionable > 0 && <span className="notif-dot">{actionable > 9 ? "9+" : actionable}</span>}
      </button>
      {open && (
        <div className="popover-panel notif-panel" id={panelId} role="dialog" aria-label="Notificaciones">
          <p className="popover-title">Notificaciones</p>
          {items.length === 0 ? (
            <div className="notif-empty">
              <BellOff aria-hidden="true" />
              <span>No tienes pendientes.</span>
            </div>
          ) : (
            <ul className="notif-list">
              {items.map((item, index) => (
                <li key={item.id}>
                  <Link
                    href={item.href}
                    className={`notif-item is-${item.tone}`}
                    onClick={close}
                    data-autofocus={index === 0 ? "" : undefined}
                  >
                    <span className="notif-marker" aria-hidden="true" />
                    <span>
                      <strong>{item.title}</strong>
                      <small>{item.detail}</small>
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}

/* ------------------------------------------------------------- Usuario */

function MenuLink({ href, icon, children, onClick, autoFocus }: {
  href: string;
  icon: ReactNode;
  children: ReactNode;
  onClick: () => void;
  autoFocus?: boolean;
}) {
  return (
    <Link href={href} className="menu-item" role="menuitem" onClick={onClick} data-autofocus={autoFocus ? "" : undefined}>
      {icon}
      {children}
    </Link>
  );
}

export function UserMenu({
  name,
  email,
  roleLabel,
  role,
}: {
  name: string;
  email: string;
  roleLabel: string;
  role: AppRole;
}) {
  const router = useRouter();
  const { open, ref, triggerRef, toggle, close } = usePopover();
  const [signingOut, setSigningOut] = useState(false);
  const menuId = useId();
  const initials = name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((word) => word[0]?.toUpperCase())
    .join("");

  async function handleSignOut() {
    setSigningOut(true);
    await signOut({ redirect: false });
    router.replace("/");
    router.refresh();
  }

  return (
    <div className="popover" ref={ref}>
      <button
        ref={triggerRef}
        className={`user-trigger${open ? " is-open" : ""}`}
        type="button"
        aria-haspopup="menu"
        aria-expanded={open}
        aria-controls={menuId}
        onClick={toggle}
      >
        <span className="app-user-text">
          <strong>{name}</strong>
          <small>{roleLabel}</small>
        </span>
        <span className="app-avatar" aria-hidden="true">
          {initials || "U"}
        </span>
        <ChevronDown className="user-trigger-chevron" aria-hidden="true" />
      </button>

      {open && (
        <div className="popover-panel user-panel" id={menuId} role="menu" aria-label="Menú de la cuenta">
          <div className="user-panel-head">
            <span className="app-avatar is-large" aria-hidden="true">
              {initials || "U"}
            </span>
            <span>
              <strong>{name}</strong>
              <small>{email}</small>
              <span className="role-chip">{roleLabel}</span>
            </span>
          </div>
          <div className="menu-group">
            <MenuLink href="/cuenta" icon={<KeyRound aria-hidden="true" />} onClick={close} autoFocus>
              Mi cuenta y contraseña
            </MenuLink>
            {role === "STUDENT" && (
              <>
                <MenuLink href="/perfil" icon={<UserPen aria-hidden="true" />} onClick={close}>
                  Mis datos personales
                </MenuLink>
                <MenuLink href="/registro-pat-2" icon={<FilePen aria-hidden="true" />} onClick={close}>
                  Mi registro PAT 2
                </MenuLink>
              </>
            )}
          </div>
          <div className="menu-group">
            <button className="menu-item is-danger" type="button" role="menuitem" onClick={handleSignOut} disabled={signingOut}>
              {signingOut ? <LoaderCircle className="spin" aria-hidden="true" /> : <LogOut aria-hidden="true" />}
              {signingOut ? "Cerrando sesión…" : "Cerrar sesión"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
