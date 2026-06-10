# Picadeli

PWA para gestión de pedidos de gomitas y dulces. Sistema de ventas con roles (Admin y Vendedor) para control de inventario y pedidos.

## 🚀 Stack Tecnológico

- **Frontend**: React 19 + TypeScript + Vite
- **Estilos**: Tailwind CSS v4
- **Estado**: Zustand
- **Base de datos**: Supabase (PostgreSQL)
- **PWA**: Vite PWA Plugin
- **Gráficos**: Recharts
- **Animaciones**: Framer Motion
- **Enrutamiento**: React Router v7

## ✨ Características

- 🍬 Menú de gomitas para armar combos
- 📝 Registro de pedidos por vendedores
- 🔄 Gestión de estados (pendiente, armado, entregado)
- 📊 Dashboard administrativo con informes
- 👥 Roles: Admin y Vendedor
- 🔐 Autenticación con Supabase
- 📱 Progressive Web App (instalable)
- 🌓 Modo oscuro

## 📦 Instalación

```bash
npm install
```

## 🔑 Variables de Entorno

Copia `.env.example` a `.env` y configura:

```env
VITE_SUPABASE_URL=https://tu-proyecto.supabase.co
VITE_SUPABASE_ANON_KEY=tu-anon-key
```

Obtén las credenciales en [Supabase Dashboard](https://supabase.com/dashboard).

## 🗄️ Base de Datos

Ejecuta las migraciones en Supabase SQL Editor:

1. `migrations/20260610000001_initial_schema.sql`
2. `migrations/20260610000002_rls_policies.sql`
3. `migrations/20260610000003_seed_data.sql`

## 🏃 Scripts

```bash
npm run dev          # Servidor de desarrollo (http://localhost:5173)
npm run build        # Build para producción
npm run lint         # ESLint
npm run preview      # Previsualizar build de producción
```

## 🚀 Despliegue

### Vercel

1. Conecta este repo a Vercel
2. Configura las variables de entorno
3. Deploy automático en cada push a main

### Netlify

1. Conecta repo a Netlify
2. Build command: `npm run build`
3. Publish directory: `dist`
4. Configura variables de entorno

## 📝 Licencia

MIT
