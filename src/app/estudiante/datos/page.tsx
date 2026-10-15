
"use client";

import { useState } from "react";

export default function DatosEstudiante() {
  const [menuAbierto, setMenuAbierto] = useState(true);

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 md:flex">

      {/* MENÚ LATERAL */}
      <aside
        className={`bg-slate-900 text-white p-5 ${
          menuAbierto ? "md:w-64" : "md:w-20"
        }`}
      >
        <div className="flex justify-between items-center mb-10">
          {menuAbierto && (
            <div>
              <h1 className="text-2xl font-bold">ULEAM</h1>
              <p className="text-xs text-slate-400">
                Gestión de Titulación
              </p>
            </div>
          )}

          <button
            type="button"
            onClick={() => setMenuAbierto(!menuAbierto)}
            className="rounded-lg p-2 hover:bg-slate-700"
            aria-label="Expandir o contraer menú"
          >
            ☰
          </button>
        </div>

        {menuAbierto && (
          <nav className="space-y-3">
            <p className="text-xs text-slate-400 mb-4">
              MENÚ DEL ESTUDIANTE
            </p>

            <div className="bg-blue-600 rounded-lg p-3 font-medium">
              Actualizar información
            </div>

            <p className="text-xs text-slate-400 pt-6">
              Próximamente más opciones
            </p>
          </nav>
        )}
      </aside>

      {/* CONTENIDO PRINCIPAL */}
      <main className="flex-1 min-w-0">
        <header className="bg-white border-b border-slate-200 px-8 py-5">
          <h2 className="font-semibold text-lg">
            Sistema de Gestión de Titulación
          </h2>
          <p className="text-sm text-slate-500">
            Universidad Laica Eloy Alfaro de Manabí
          </p>
        </header>

        <div className="max-w-5xl mx-auto p-5 md:p-8">
          <p className="text-sm text-blue-600 mb-3">
            Estudiantes / Actualizar información
          </p>

          <h1 className="text-3xl font-bold mb-2">
            Información del estudiante
          </h1>

          <p className="text-slate-500 mb-8">
            Verifica y actualiza tus datos personales
            para continuar con tu proceso de titulación.
          </p>

          <form
            onSubmit={(e) => {
              e.preventDefault();
              alert(
                "Formulario de prueba. Los datos todavía no se guardan."
              );
            }}
            className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 md:p-8 space-y-8"
          >
            {/* DATOS PERSONALES */}
            <section>
              <h3 className="font-bold text-xl mb-2">
                Datos personales
              </h3>
              <p className="text-sm text-slate-500 mb-5">
                Información de identificación del estudiante.
              </p>

              <div className="grid md:grid-cols-2 gap-5">
                <Campo titulo="Cédula" nombre="cedula" />
                <Campo titulo="Nombres" nombre="nombres" />
                <Campo titulo="Apellidos" nombre="apellidos" />

                <label className="flex flex-col gap-2 text-sm font-medium">
                  Sexo *
                  <select
                    required
                    defaultValue=""
                    className="border border-slate-300 rounded-lg p-3 bg-white focus:outline-none focus:ring-2 focus:ring-blue-200"
                  >
                    <option value="" disabled>
                      Seleccionar
                    </option>
                    <option value="masculino">Masculino</option>
                    <option value="femenino">Femenino</option>
                    <option value="otro">Otro</option>
                  </select>
                </label>
              </div>
            </section>

            <hr className="border-slate-200" />

            {/* INFORMACIÓN DE CONTACTO */}
            <section>
              <h3 className="font-bold text-xl mb-5">
                Información de contacto
              </h3>

              <div className="grid md:grid-cols-2 gap-5">
                <Campo
                  titulo="Correo institucional"
                  nombre="correoInstitucional"
                  tipo="email"
                />
                <Campo
                  titulo="Correo personal"
                  nombre="correoPersonal"
                  tipo="email"
                />
                <Campo titulo="Teléfono" nombre="telefono" />
                <Campo titulo="Celular" nombre="celular" />
              </div>
            </section>

            <hr className="border-slate-200" />

            {/* INFORMACIÓN COMPLEMENTARIA */}
            <section>
              <h3 className="font-bold text-xl mb-5">
                Información complementaria
              </h3>

              <div className="grid md:grid-cols-2 gap-5">
                <Campo titulo="Domicilio" nombre="domicilio" />
                <Campo
                  titulo="Número de cambio de malla"
                  nombre="cambioMalla"
                  tipo="number"
                />
              </div>
            </section>

            {/* BOTÓN GUARDAR */}
            <div className="flex justify-end pt-5 border-t border-slate-200">
              <button
                type="submit"
                className="bg-blue-600 text-white rounded-lg px-8 py-3 font-semibold hover:bg-blue-700 transition"
              >
                Guardar cambios
              </button>
            </div>
          </form>
        </div>
      </main>
    </div>
  );
}

function Campo({
  titulo,
  nombre,
  tipo = "text",
}: {
  titulo: string;
  nombre: string;
  tipo?: string;
}) {
  return (
    <label className="flex flex-col gap-2 text-sm font-medium">
      {titulo} *
      <input
        name={nombre}
        type={tipo}
        required
        placeholder={`Ingresa ${titulo.toLowerCase()}`}
        className="w-full border border-slate-300 rounded-lg p-3 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
      />
    </label>
  );
}
