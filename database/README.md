# Módulo de Base de Datos - Sistema de Titulación (PostgreSQL)

Este directorio contiene la estructura relacional, datos iniciales y la lógica de conexión para el sistema de gestión de trámites de titulación utilizando **PostgreSQL**.

---

## 📂 Estructura de Archivos

- **`schema.sql`**: Script DDL que define las tablas relacionales (`roles`, `users`, `students`, `advisors`, `projects_theses`, `procedures`, `procedure_stages`, `documents`) y sus respectivos índices.
- **`seed.sql`**: Datos iniciales (roles por defecto y usuario administrador).
- **`connection.js`**: Módulo de conexión reutilizable en Node.js utilizando el paquete `pg` (Pool de conexiones).
- **`.env.example`**: Variables de entorno de ejemplo para la conexión.

---

## 🚀 Instrucciones de Configuración

### 1. Crear la Base de Datos en PostgreSQL
Abre tu cliente de PostgreSQL (psql, pgAdmin o DBeaver) y ejecuta:
```sql
CREATE DATABASE sistema_titulacion;
```

### 2. Ejecutar el Esquema y Semilla
Conéctate a la base de datos `sistema_titulacion` y ejecuta los scripts:
```bash
psql -U postgres -d sistema_titulacion -f schema.sql
psql -U postgres -d sistema_titulacion -f seed.sql
```

### 3. Configurar las Variables de Entorno
Copia el archivo `.env.example` a `.env` en tu proyecto de backend y ajusta tus credenciales locales:
```env
DB_HOST=localhost
DB_PORT=5432
DB_NAME=sistema_titulacion
DB_USER=postgres
DB_PASSWORD=tu_contraseña
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
