# Inicio de sesión y perfiles

La aplicación usa Auth.js con sesiones JWT en cookie `HttpOnly` y cookies seguras en producción. La API de autenticación se monta en `/api/auth/*`. Los usuarios, sus roles y su estado (activo/inactivo) viven en PostgreSQL (tablas `users` y `roles`).

## Puesta en marcha local

1. Copia `.env.example` como `.env.local`.
2. Genera una clave para `AUTH_SECRET` (por ejemplo, `node -e "console.log(require('crypto').randomBytes(32).toString('base64url'))"`).
3. Completa las variables `DB_*` con los datos de tu PostgreSQL.
4. Ejecuta `npm run db:setup`: crea la base si no existe, carga `schema.sql` y `seed.sql` cuando está vacía y aplica las migraciones pendientes de `database/migrations`.
5. Asigna una contraseña real a cada usuario de prueba (el seed solo trae hashes de ejemplo que no permiten entrar):

   ```bash
   npm run db:password -- admin@titulacion.edu
   npm run db:password -- secretaria@titulacion.edu
   npm run db:password -- student@titulacion.edu
   ```

   La contraseña se pide por consola y se guarda como hash bcrypt.
6. Cambia `PASSWORD_AUTH_ENABLED` y `NEXT_PUBLIC_PASSWORD_AUTH_ENABLED` a `true` y reinicia Next.js.

El acceso con contraseña solo funciona cuando `PASSWORD_AUTH_ENABLED=true`. Habilitarlo en producción es una decisión explícita; si la universidad usará solo Microsoft, déjalo en `false`.

## Perfiles

- `STUDENT`: ve su perfil en el panel, actualiza su correo y celular en `/perfil` y registra su tema PAT 2.
- `SECRETARY`: gestiona estudiantes (listado, registro y edición), la bandeja de aprobación PAT 2 y los tribunales.
- `ADMIN`: todo lo anterior, más usuarios (`/admin/usuarios`) y carreras/facultades (`/admin/carreras`).

Los roles `COORDINATOR` y `ADVISOR` existen en la base pero todavía no tienen acceso a la aplicación.

Cada página y cada Server Action vuelve a leer el usuario desde la base (`src/lib/current-user.ts`), así que desactivar una cuenta o cambiarle el rol tiene efecto inmediato.

## Microsoft institucional

El proveedor Microsoft Entra ID solo se activa cuando están configurados el identificador, secreto e issuer del tenant institucional. En el portal de Microsoft Entra se debe registrar esta URL de callback:

```text
http://localhost:3000/api/auth/callback/microsoft-entra-id
```

Para producción, registrar también la URL HTTPS del sitio. Configurar `AUTH_MICROSOFT_ENTRA_ID_ISSUER` con el tenant de la universidad, no `common`, para limitar el proveedor a esa organización. Una cuenta Microsoft solo recibe acceso si su correo existe y está activo en la tabla `users`; el rol se toma de la base. Cuando las tres credenciales OAuth estén listas, poner `NEXT_PUBLIC_MICROSOFT_ENABLED=true` para mostrar el botón institucional.

Solicitar a la universidad el tenant ID, client ID y client secret. No colocar el client secret en variables `NEXT_PUBLIC_*`.

## Rutas protegidas

- `/panel`: panel según el perfil autenticado.
- `/perfil`: solo `STUDENT`.
- `/registro-pat-2`: solo `STUDENT` y `ADMIN`.
- `/estudiantes`, `/estudiantes/nuevo`, `/estudiantes/[id]/editar`: `SECRETARY` y `ADMIN`.
- `/aprobacion-pat-2`, `/tribunales`: `SECRETARY` y `ADMIN`.
- `/admin/usuarios`, `/admin/carreras`: solo `ADMIN`.

El registro PAT 2 y el borrador de tribunal aún no persisten en PostgreSQL. La bandeja de aprobación está preparada como pantalla, pero no puede mostrar, aprobar o devolver propuestas hasta implementar el almacenamiento.
