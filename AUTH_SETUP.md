# Inicio de sesión y perfiles

La aplicación usa Auth.js con sesiones JWT en cookie `HttpOnly`, cookies seguras en producción y contraseña de prueba validada con bcrypt. La API de autenticación se monta en `/api/auth/*`.

## Cuentas locales de desarrollo

El proveedor de contraseña solo acepta usuarios cuando `NODE_ENV=development` y `DEMO_AUTH_ENABLED=true`. Las cuentas y sus hashes se configuran en `.env.local`; no se deben guardar contraseñas sin hash en el repositorio ni habilitar el proveedor de prueba en producción.

1. Copia `.env.example` como `.env.local`.
2. Genera una clave para `AUTH_SECRET` (por ejemplo, `node -e "console.log(require('crypto').randomBytes(32).toString('base64url'))"`).
3. Genera cada hash con `node -e "require('bcryptjs').hash('CAMBIA_ESTA_CLAVE', 12).then(value => console.log(Buffer.from(value).toString('base64')))"` y colócalo en su variable `*_PASSWORD_HASH_B64`. El base64 evita que el parser de `.env` interprete los signos `$` de bcrypt.
4. En local, cambia `DEMO_AUTH_ENABLED` y `NEXT_PUBLIC_DEMO_AUTH_ENABLED` a `true`, mantén los correos de prueba con dominio `.test` y reinicia Next.js.

Las cuentas de prueba tienen estos perfiles:

- `STUDENT`: puede acceder al registro de modalidad y tema.
- `SECRETARY`: puede acceder a la bandeja de aprobación PAT 2 y preparar convocatorias/tribunales; no puede crear registros PAT 2 de estudiante.
- `ADMIN`: puede acceder a las tres secciones: registro, aprobación y tribunales.

## Microsoft institucional

El proveedor Microsoft Entra ID solo se activa cuando están configurados el identificador, secreto e issuer del tenant institucional. En el portal de Microsoft Entra se debe registrar esta URL de callback:

```text
http://localhost:3000/api/auth/callback/microsoft-entra-id
```

Para producción, registrar también la URL HTTPS del sitio. Configurar `AUTH_MICROSOFT_ENTRA_ID_ISSUER` con el tenant de la universidad, no `common`, para limitar el proveedor a esa organización. `MICROSOFT_ROLE_MAP` es un objeto JSON que asigna únicamente correos previamente autorizados a `STUDENT`, `SECRETARY` o `ADMIN`; cuentas Microsoft no incluidas no reciben acceso. Cuando las tres credenciales OAuth y el mapa estén listos, poner `NEXT_PUBLIC_MICROSOFT_ENABLED=true` para mostrar el botón institucional.

Solicitar a la universidad el tenant ID, client ID, client secret y confirmación de los correos/roles autorizados. No colocar el client secret en variables `NEXT_PUBLIC_*`.

## Rutas protegidas

- `/panel`: panel según el perfil autenticado.
- `/registro-pat-2`: solo `STUDENT` y `ADMIN`.
- `/aprobacion-pat-2`: solo `SECRETARY` y `ADMIN`.
- `/tribunales`: requiere perfil `SECRETARY` o `ADMIN`.

El registro PAT 2 y el borrador de tribunal aún no persisten en PostgreSQL. La bandeja de aprobación está preparada como pantalla, pero no puede mostrar, aprobar o devolver propuestas hasta implementar el almacenamiento y los endpoints que repitan estas comprobaciones de rol en el servidor.
