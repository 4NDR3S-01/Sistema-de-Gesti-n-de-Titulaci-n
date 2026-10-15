
"use client";

import { useState, type FormEvent } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import {
  ArrowRight,
  Eye,
  EyeOff,
  GraduationCap,
  LoaderCircle,
  ShieldCheck,
} from "lucide-react";

export default function Home() {
  const router = useRouter();

  const [mostrarClave, setMostrarClave] = useState(false);
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState("");

  // Configuración de autenticación actualizada
  const passwordEnabled =
    process.env.NEXT_PUBLIC_PASSWORD_AUTH_ENABLED === "true";

  const microsoftEnabled =
    process.env.NEXT_PUBLIC_MICROSOFT_ENABLED === "true";

  // Inicio de sesión con correo y contraseña
  async function iniciarSesion(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();

    if (cargando || !passwordEnabled) return;

    setCargando(true);
    setError("");

    const datos = new FormData(e.currentTarget);

    try {
      const respuesta = await signIn("credentials", {
        email: String(datos.get("email") ?? "").trim(),
        password: String(datos.get("password") ?? ""),
        redirect: false,
        redirectTo: "/panel",
      });

      if (respuesta?.error || !respuesta?.url) {
        setError("Correo o contraseña incorrectos.");
        return;
      }

      router.push(respuesta.url);
      router.refresh();
    } catch {
      setError(
        "No se pudo iniciar sesión. Inténtalo nuevamente."
      );
    } finally {
      setCargando(false);
    }
  }

  // Inicio de sesión institucional con Microsoft
  async function iniciarSesionMicrosoft() {
    if (cargando || !microsoftEnabled) return;

    setCargando(true);
    setError("");

    try {
      await signIn("microsoft-entra-id", {
        redirectTo: "/panel",
      });
    } catch {
      setError(
        "No se pudo iniciar sesión con Microsoft."
      );
      setCargando(false);
    }
  }

  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-[#F1F5F9] px-4 py-8 text-[#0F172A] sm:px-6">

      {/* CONTENEDOR PRINCIPAL */}
      <div className="w-full max-w-[1160px] rounded-[26px] bg-[#E2E8F0] p-3 shadow-[0_25px_80px_rgba(15,23,42,0.10)] sm:p-4">

        <div className="overflow-hidden rounded-[20px] bg-white p-5 sm:p-7">

          {/* ENCABEZADO */}
          <header className="flex items-center justify-between gap-4">

            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-[#2563EB] text-white">
                <GraduationCap
                  size={27}
                  strokeWidth={1.8}
                />
              </div>

              <div>
                <h1 className="text-xl font-extrabold leading-6">
                  ULEAM
                </h1>

                <p className="text-[10px] font-medium tracking-wide text-slate-500">
                  ACADEMIC PORTAL
                </p>
              </div>
            </div>

            <div className="hidden rounded-full bg-[#EFF6FF] px-4 py-2 text-[11px] font-medium text-[#1D4ED8] sm:block">
              SISTEMA DE TITULACIÓN
            </div>

          </header>

          {/* CONTENIDO EN DOS COLUMNAS */}
          <div className="mt-6 grid gap-5 lg:grid-cols-2">

            {/* PANEL IZQUIERDO */}
            <section className="flex flex-col rounded-2xl bg-[#EFF6FF] p-5 sm:p-7">

              <p className="text-xs font-semibold uppercase tracking-widest text-[#2563EB]">
                TU CAMINO AL ÉXITO
              </p>

              <h2 className="mt-4 text-2xl font-semibold leading-tight tracking-tight text-[#0F172A] sm:text-3xl">
                Cada logro comienza con un paso.
              </h2>

              <p className="mt-3 text-sm text-slate-500">
                Tu proceso de titulación, simple y organizado.
              </p>

              {/* ILUSTRACIÓN DEL BIRRETE */}
              <div className="my-5 flex min-h-[250px] flex-1 items-center justify-center overflow-hidden rounded-xl bg-[#DBEAFE] p-4">

                <svg
                  viewBox="0 0 420 270"
                  className="w-full max-w-[420px]"
                  xmlns="http://www.w3.org/2000/svg"
                  role="img"
                  aria-label="Birrete de graduación"
                >

                  {/* CÍRCULO DE FONDO */}
                  <circle
                    cx="210"
                    cy="128"
                    r="95"
                    fill="#BFDBFE"
                  />

                  {/* SOMBRA INFERIOR */}
                  <path
                    d="M63 233 H358"
                    stroke="#93C5FD"
                    strokeWidth="4"
                    strokeLinecap="round"
                  />

                  {/* CUERPO DEL BIRRETE */}
                  <path
                    d="M145 108 H275 V151 Q210 205 145 151 Z"
                    fill="#3B82F6"
                  />

                  {/* DETALLE CENTRAL */}
                  <path
                    d="M145 108 H275 V151 Q210 184 145 151 Z"
                    fill="#60A5FA"
                  />

                  {/* PARTE SUPERIOR */}
                  <path
                    d="M210 37 L319 82 L210 127 L101 82 Z"
                    fill="#1D4ED8"
                  />

                  {/* BORDE */}
                  <path
                    d="M101 82 L210 127 L319 82"
                    fill="none"
                    stroke="#1E40AF"
                    strokeWidth="2"
                  />

                  {/* BORLA */}
                  <path
                    d="M319 82 V163"
                    fill="none"
                    stroke="#1E40AF"
                    strokeWidth="5"
                  />

                  <circle
                    cx="319"
                    cy="170"
                    r="10"
                    fill="#2563EB"
                  />

                  {/* BASE DECORATIVA */}
                  <path
                    d="M165 169 H255 Q291 189 327 229 H93 Q129 189 165 169 Z"
                    fill="#2563EB"
                  />

                  {/* DETALLES DECORATIVOS */}
                  <path
                    d="M75 187 L94 205"
                    stroke="#93C5FD"
                    strokeWidth="4"
                  />

                  <path
                    d="M345 187 L326 205"
                    stroke="#93C5FD"
                    strokeWidth="4"
                  />

                </svg>
              </div>

              <p className="text-[11px] font-medium uppercase tracking-wide text-slate-500">
                Universidad Laica Eloy Alfaro de Manabí
              </p>

            </section>

            {/* PANEL DERECHO - LOGIN */}
            <section className="flex items-center justify-center px-1 py-8 sm:px-8 lg:py-10">

              <div className="w-full max-w-[430px]">

                <p className="text-xs font-semibold uppercase tracking-widest text-[#2563EB]">
                  BIENVENIDO DE NUEVO
                </p>

                <h2 className="mt-3 text-3xl font-bold tracking-tight text-[#0F172A]">
                  Iniciar sesión
                </h2>

                <p className="mt-2 text-sm text-slate-500">
                  Ingresa para continuar.
                </p>

                {/* FORMULARIO DE INICIO DE SESIÓN */}
                {passwordEnabled && (
                  <form
                    onSubmit={iniciarSesion}
                    className="mt-8 space-y-5"
                  >

                    {/* CORREO ELECTRÓNICO */}
                    <div>
                      <label
                        htmlFor="email"
                        className="mb-2 block text-sm font-medium text-slate-700"
                      >
                        Correo electrónico
                      </label>

                      <input
                        id="email"
                        name="email"
                        type="email"
                        autoComplete="username"
                        placeholder="correo@institucion.edu.ec"
                        required
                        disabled={cargando}
                        className="w-full rounded-lg border border-slate-300 bg-white px-4 py-3 text-sm outline-none transition focus:border-[#2563EB] focus:ring-2 focus:ring-blue-100 disabled:opacity-60"
                      />
                    </div>

                    {/* CONTRASEÑA */}
                    <div>
                      <label
                        htmlFor="password"
                        className="mb-2 block text-sm font-medium text-slate-700"
                      >
                        Contraseña
                      </label>

                      <div className="relative">

                        <input
                          id="password"
                          name="password"
                          type={
                            mostrarClave
                              ? "text"
                              : "password"
                          }
                          autoComplete="current-password"
                          placeholder="Ingresa tu contraseña"
                          required
                          disabled={cargando}
                          className="w-full rounded-lg border border-slate-300 bg-white px-4 py-3 pr-12 text-sm outline-none transition focus:border-[#2563EB] focus:ring-2 focus:ring-blue-100 disabled:opacity-60"
                        />

                        <button
                          type="button"
                          aria-label={
                            mostrarClave
                              ? "Ocultar contraseña"
                              : "Mostrar contraseña"
                          }
                          onClick={() =>
                            setMostrarClave(!mostrarClave)
                          }
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 transition hover:text-blue-600"
                        >
                          {mostrarClave ? (
                            <EyeOff size={19} />
                          ) : (
                            <Eye size={19} />
                          )}
                        </button>

                      </div>
                    </div>

                    {/* MENSAJE DE ERROR */}
                    {error && (
                      <div
                        role="alert"
                        className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-600"
                      >
                        {error}
                      </div>
                    )}

                    {/* BOTÓN DE INICIAR SESIÓN */}
                    <button
                      type="submit"
                      disabled={cargando}
                      className="flex w-full items-center justify-center gap-3 rounded-lg bg-[#2563EB] px-5 py-3.5 text-sm font-semibold text-white transition hover:bg-[#1D4ED8] disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      {cargando ? (
                        <>
                          <LoaderCircle
                            size={18}
                            className="animate-spin"
                          />
                          Ingresando...
                        </>
                      ) : (
                        <>
                          Acceder a mi cuenta
                          <ArrowRight size={18} />
                        </>
                      )}
                    </button>

                  </form>
                )}

                {/* INICIO DE SESIÓN MICROSOFT */}
                {microsoftEnabled && (
                  <div className="mt-5">

                    {passwordEnabled && (
                      <div className="mb-5 flex items-center gap-3">
                        <div className="h-px flex-1 bg-slate-200" />
                        <span className="text-xs text-slate-400">
                          O continúa con
                        </span>
                        <div className="h-px flex-1 bg-slate-200" />
                      </div>
                    )}

                    <button
                      type="button"
                      onClick={iniciarSesionMicrosoft}
                      disabled={cargando}
                      className="flex w-full items-center justify-center gap-3 rounded-lg border border-slate-300 bg-white px-5 py-3.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:opacity-60"
                    >
                      <span className="grid grid-cols-2 gap-[2px]">
                        <span className="h-2 w-2 bg-[#F25022]" />
                        <span className="h-2 w-2 bg-[#7FBA00]" />
                        <span className="h-2 w-2 bg-[#00A4EF]" />
                        <span className="h-2 w-2 bg-[#FFB900]" />
                      </span>

                      Continuar con Microsoft
                    </button>

                  </div>
                )}

                {/* ERROR GENERAL */}
                {!passwordEnabled && error && (
                  <p
                    role="alert"
                    className="mt-4 rounded-lg bg-red-50 p-3 text-sm text-red-600"
                  >
                    {error}
                  </p>
                )}

                {/* SIN PROVEEDORES HABILITADOS */}
                {!passwordEnabled && !microsoftEnabled && (
                  <div className="mt-8 rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
                    No hay métodos de inicio de sesión
                    habilitados. Revisa la configuración
                    del sistema.
                  </div>
                )}

                {/* ACCESO SEGURO */}
                <div className="mt-7 flex items-center justify-center gap-2 text-xs text-slate-500">
                  <ShieldCheck
                    size={17}
                    className="text-[#2563EB]"
                  />
                  Acceso protegido
                </div>

              </div>
            </section>

          </div>
        </div>
      </div>
    </main>
  );
}
