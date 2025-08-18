# Torneo de Baloncesto entre Iglesias

Aplicación web para gestionar estadísticas de un torneo de baloncesto entre iglesias, utilizando React para el frontend y Supabase para el backend y base de datos.

## Tecnologías utilizadas

- **Frontend**: React con Vite + TailwindCSS
- **Backend/DB**: Supabase (Postgres + Auth + Storage)
- **Deploy**: Netlify para el frontend, Supabase para la base de datos

## Características principales

- Calendario de partidos
- Perfiles de equipos y jugadores
- Estadísticas detalladas de partidos y jugadores
- Panel de administración para gestionar datos
- Autenticación para administradores

## Estructura del proyecto

```
├── src/
│   ├── assets/         # Imágenes, iconos, etc.
│   ├── components/     # Componentes reutilizables
│   ├── context/        # Contextos de React (AuthContext)
│   ├── hooks/          # Custom hooks
│   ├── lib/            # Utilidades y configuración
│   │   └── supabase/   # Cliente y funciones de Supabase
│   ├── pages/          # Páginas principales
│   ├── App.jsx         # Componente principal y rutas
│   ├── index.css       # Estilos globales con TailwindCSS
│   └── main.jsx        # Punto de entrada
├── supabase/
│   ├── schema.sql      # Esquema de la base de datos
│   └── seed.sql        # Datos de ejemplo
├── .env                # Variables de entorno (no incluir en git)
├── .env.example        # Ejemplo de variables de entorno
└── ... (archivos de configuración)
```

## Configuración del proyecto

### Requisitos previos

- Node.js (v18 o superior)
- Cuenta en Supabase
- Cuenta en Netlify (para despliegue)

### Configuración de Supabase

1. Crear un nuevo proyecto en Supabase
2. Ejecutar los scripts SQL en el siguiente orden:
   - `supabase/schema.sql` (para crear las tablas)
   - `supabase/seed.sql` (para cargar datos de ejemplo)
3. Configurar autenticación en Supabase:
   - Habilitar Email/Password sign-in
   - Crear un usuario administrador y asignarle el rol 'admin' en la tabla auth.users

### Configuración del frontend

1. Clonar el repositorio
2. Instalar dependencias:
   ```bash
   npm install
   ```
3. Copiar `.env.example` a `.env` y configurar las variables de Supabase:
   ```
   VITE_SUPABASE_URL=tu_url_de_supabase
   VITE_SUPABASE_ANON_KEY=tu_clave_anon_de_supabase
   ```
4. Iniciar el servidor de desarrollo:
   ```bash
   npm run dev
   ```

## Despliegue

### Netlify

1. Conectar el repositorio a Netlify
2. Configurar las variables de entorno en Netlify:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`
3. Configurar el comando de build: `npm run build`
4. Configurar el directorio de publicación: `dist`

## Acceso de administrador

Para acceder al panel de administración:

1. Navegar a `/login`
2. Iniciar sesión con las credenciales de administrador
3. Serás redirigido al panel de administración en `/admin`

## Licencia

Este proyecto está bajo la Licencia MIT.
