# Módulo de Base de Datos - Sistema de Titulación (PostgreSQL)

Este directorio contiene la estructura relacional, datos iniciales, vistas de consulta, triggers automatizados y la lógica de conexión para el sistema de gestión de trámites de titulación utilizando **PostgreSQL**.

---

## 📂 Estructura de Archivos

- **`schema.sql`**: Script DDL base: roles, usuarios, facultades, carreras, estudiantes, periodos académicos, trámites y documentos, con índices, triggers de `updated_at` y vistas de resumen.
- **`seed.sql`**: Datos iniciales de prueba (roles por defecto, usuarios administradores, coordinadores, asesores, estudiantes, proyectos y trámites de ejemplo).
- **`queries.sql`**: Archivo con consultas SQL útiles, reportes y seguimiento de trámites para operaciones comunes.
- **`connection.js`**: Módulo de conexión reutilizable en Node.js utilizando el paquete `pg` (Pool de conexiones).
- **`migrations/`**: Cambios incrementales sobre una base ya creada, aplicados en orden por `setup.mjs`:
  - `001`: rol `SECRETARY`, facultades, carreras y cédula/semestre/celular del estudiante.
  - `002`/`003`: código de estudiante opcional y datos personales.
  - `004`: registro PAT 2 (`pat_registrations`) y tribunales (`tribunals`).
  - `005`: correos institucionales.
  - `006`: PAT 2 en pareja (`pat_members`), firmas digitales, escaneado (`pat_scans`) e historial (`pat_events`).
  - `007`: `users.token_version`, para revocar los tokens de la app al cambiar la contraseña.
- **`setup.mjs`** (`npm run db:setup`): crea la base si no existe, carga `schema.sql` y `seed.sql` cuando está vacía y aplica las migraciones pendientes (registradas en `schema_migrations`).
- **`set-password.mjs`** (`npm run db:password -- correo`): asigna una contraseña bcrypt a un usuario.

> La aplicación Next.js usa su propia conexión en `src/lib/db.ts`, que lee las mismas variables `DB_*` desde `.env.local`.
- **`.env.example`**: Variables de entorno de ejemplo para la configuración de la conexión a la base de datos.

---

## 🚀 Instrucciones de Configuración

### Opción rápida: script de Node.js
Con las variables `DB_*` en `.env.local`, ejecuta en la raíz del proyecto:

```bash
npm run db:setup
```

Si tu base ya existía con el esquema anterior, este comando solo aplica las migraciones nuevas sin borrar datos.

---

### Opción A: PostgreSQL con Docker Compose (recomendado)
`docker-compose.yml` solo levanta el servidor PostgreSQL (puerto `5432`, base `sistema_titulacion`).
El esquema, los datos iniciales y **todas** las migraciones los carga `npm run db:setup`,
que además registra cada migración en `schema_migrations` para no repetirla:

```bash
docker compose up -d
npm run db:setup
```

Para detener el contenedor:
```bash
docker compose down
```

---

### Opción B: PostgreSQL instalado localmente
Con el servidor en marcha y las variables `DB_*` en `.env.local`, basta con `npm run db:setup`
(crea la base si no existe). Si prefieres hacerlo a mano, ejecuta en orden `schema.sql`,
`seed.sql` y cada archivo de `migrations/` por número, y registra cada uno en `schema_migrations`;
si no, `db:setup` intentará aplicarlos de nuevo más adelante.

---

### 3. Configurar las Variables de Entorno
Copia el archivo `.env.example` a `.env` en tu proyecto y ajusta tus credenciales locales:
```env
DB_HOST=localhost
DB_PORT=5432
DB_NAME=sistema_titulacion
DB_USER=postgres
DB_PASSWORD=postgres
DB_SSL=false
```

### 4. Uso en Node.js
Para utilizar la conexión en tu aplicación:
```javascript
const db = require('./connection');

async function getRoles() {
  try {
    const result = await db.query('SELECT * FROM roles');
    console.log(result.rows);
  } catch (error) {
    console.error('Error al consultar roles:', error);
  }
}

getRoles();
```
