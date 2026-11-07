# Inicio de sesión y perfiles

La aplicación usa Auth.js con sesiones JWT en cookie `HttpOnly` y cookies seguras en producción. La API de autenticación se monta en `/api/auth/*`. Los usuarios, sus roles y su estado (activo/inactivo) viven en PostgreSQL (tablas `users` y `roles`).

## Puesta en marcha local

1. Copia `.env.example` como `.env.local`.
2. Genera una clave para `AUTH_SECRET` (por ejemplo, `node -e "console.log(require('crypto').randomBytes(32).toString('base64url'))"`).
3. Completa las variables `DB_*` con los datos de tu PostgreSQL.
4. Ejecuta `npm run db:setup`: crea la base si no existe, carga `schema.sql` y `seed.sql` cuando está vacía y aplica las migraciones pendientes de `database/migrations`.
5. Asigna una contraseña real a cada usuario de prueba (el seed solo trae hashes de ejemplo que no permiten entrar):

   ```bash
   npm run db:password -- admin@uleam.edu.ec
   npm run db:password -- secretaria@uleam.edu.ec
   npm run db:password -- juan.perez@live.uleam.edu.ec
   ```

   La contraseña se pide por consola y se guarda como hash bcrypt.
6. Cambia `PASSWORD_AUTH_ENABLED` y `NEXT_PUBLIC_PASSWORD_AUTH_ENABLED` a `true` y reinicia Next.js.

El acceso con contraseña solo funciona cuando `PASSWORD_AUTH_ENABLED=true`. Habilitarlo en producción es una decisión explícita; si la universidad usará solo Microsoft, déjalo en `false`.

## Perfiles

- `STUDENT`: ve el avance de su titulación en el panel, actualiza sus datos en `/perfil`, envía su registro PAT 2 y consulta su convocatoria a la defensa.
- `SECRETARY`: gestiona estudiantes (listado, registro y edición), aprueba o devuelve registros PAT 2 y asigna tribunales.
- `ADMIN`: todo lo anterior, más usuarios (`/admin/usuarios`) y carreras/facultades (`/admin/carreras`).

Los roles `COORDINATOR` y `ADVISOR` existen en la base pero todavía no tienen acceso a la aplicación.

Cada página y cada Server Action vuelve a leer el usuario desde la base (`src/lib/current-user.ts`), así que desactivar una cuenta o cambiarle el rol tiene efecto inmediato.

## Correos institucionales y cédula

El formulario acepta **correo institucional o cédula**:

- Estudiantes: correo `@live.uleam.edu.ec`, solo el usuario (se completa el dominio) o su cédula de 10 dígitos.
- Personal (secretaría y administración): correo `@uleam.edu.ec`.

Cualquier otro dominio se rechaza, también al registrar estudiantes o usuarios. El estudiante no puede cambiar su correo institucional desde `/perfil`; solo secretaría.

## Microsoft 365 de la ULEAM

Ambos dominios pertenecen al tenant `31a17900-7589-4cfc-b11a-f4e83c27b8ed`, que ya está configurado como issuer por defecto. Para activar el botón **Entrar con mi cuenta Microsoft ULEAM**:

1. En el portal de Microsoft Entra (idealmente lo hace TI de la ULEAM dentro de su tenant), registrar una aplicación web con la URL de redirección `http://localhost:3000/api/auth/callback/microsoft-entra-id` (y la URL HTTPS de producción).
2. Permiso delegado de Microsoft Graph: `User.Read` (viene por defecto).
3. Crear un secreto de cliente y copiar el *Application (client) ID* y el secreto en `AUTH_MICROSOFT_ENTRA_ID_ID` y `AUTH_MICROSOFT_ENTRA_ID_SECRET`.
4. Reiniciar Next.js: el botón aparece solo.

Una cuenta Microsoft solo entra si su correo es institucional y existe y está activo en la tabla `users`; el rol se toma de la base. No colocar el secreto en variables `NEXT_PUBLIC_*`.

### Datos que se extraen del directorio

En cada inicio de sesión con Microsoft:

- Se actualizan nombres y apellidos con los del directorio de la universidad.
- Para estudiantes, se consulta Microsoft Graph (`/me`) y se completan los campos **vacíos** de su ficha: celular (`mobilePhone`) y cédula (`employeeId`, si TI la registra ahí y es válida). Nunca se sobrescribe lo que ya registró el estudiante o secretaría.

Carrera, semestre, malla y demás datos académicos no están en Microsoft 365: viven en el sistema académico de la universidad. Para traerlos automáticamente hace falta que TI exponga una API o una vista de base de datos de ese sistema; mientras tanto los registra secretaría.

## Rutas protegidas

- `/panel`: panel según el perfil autenticado.
- `/perfil`: solo `STUDENT`.
- `/registro-pat-2`: solo `STUDENT`.
- `/estudiantes`, `/estudiantes/nuevo`, `/estudiantes/[id]/editar`: `SECRETARY` y `ADMIN`.
- `/aprobacion-pat-2`, `/aprobacion-pat-2/[id]`, `/tribunales`: `SECRETARY` y `ADMIN`.
- `/admin/usuarios`, `/admin/carreras`: solo `ADMIN`.

El registro PAT 2 (`pat_registrations`) y los tribunales (`tribunals`) se guardan en PostgreSQL desde la migración `004_pat2_tribunales.sql`; ejecuta `npm run db:setup` para aplicarla en una base existente.
