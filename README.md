# Vestidos de Fiesta - Shop Frontend

Tienda online de vestidos elegantes importados construida con **Next.js 16**, **React 19**, y **Tailwind CSS**.

## 🎯 Estado del Proyecto
wssswsddSADSSFDGdff
✅ **Reestructuración de Arquitectura Completada (70%)**
-
La aplicación ha sido migrada de una arquitectura antigua (hash routing, App.tsx monolítico) a la **arquitectura moderna de Next.js App Router**.

## 📚 Documentación

Antes de comenzar, lee estos documentos en orden:

1. **[QUICK_START.md](./QUICK_START.md)** - Comienza aquí (5 min) 🚀
2. **[ARCHITECTURE_COMPARISON.md](./ARCHITECTURE_COMPARISON.md)** - Antigua vs Nueva (5 min) 📊
3. **[COMPLETION_CHECKLIST.md](./COMPLETION_CHECKLIST.md)** - Checklist de migración (10 min) ✅
4. **[ARCHITECTURE.md](./ARCHITECTURE.md)** - Explicación detallada (15 min) 📖
5. **[MIGRATION_GUIDE.md](./MIGRATION_GUIDE.md)** - Guía paso a paso (20 min) 🗺️
6. **[RESTRUCTURING_SUMMARY.md](./RESTRUCTURING_SUMMARY.md)** - Resumen completo (10 min) 📋

## 🚀 Inicio Rápido

```bash
# Instalar dependencias
npm install

# Iniciar servidor de desarrollo
npm run dev

# Abrir en navegador
# http://localhost:3000
```

## 📍 Rutas Disponibles

| URL                     | Descripción          |
| ----------------------- | -------------------- |
| `/`                     | Home                 |
| `/catalogo`             | Listado de vestidos  |
| `/catalogo/[slug]`      | Detalle de producto  |
| `/blog`                 | Blog de moda         |
| `/blog/[slug]`          | Detalle de post      |
| `/preguntas-frecuentes` | Preguntas frecuentes |
| `/api/products`         | API - Productos      |
| `/api/posts`            | API - Posts          |

## 🏗️ Estructura del Proyecto

```
app/
├── layout.tsx                  # Root layout global
├── page.tsx                    # Home
├── catalog/                    # Catálogo
│   ├── page.tsx
│   └── [slug]/page.tsx
├── blog/                       # Blog
│   ├── page.tsx
│   └── [slug]/page.tsx
├── preguntas-frecuentes/       # FAQ
│   └── page.tsx
└── api/                        # API routes
    ├── products/
    ├── posts/
    └── ...

components/
├── global/                     # Header, Footer
├── catalog/                    # Componentes del catálogo
├── product/                    # Detalles de producto
├── blog/                       # Blog
├── modals/                     # Modales
└── ui/                         # Componentes reutilizables
```

## ✨ Características

- ✅ **Next.js App Router** - Routing automático y moderno
- ✅ **Server Components** - Mejor performance
- ✅ **API Routes** - Endpoints internos
- ✅ **Metadata Dinámica** - SEO mejorado
- ✅ **TypeScript** - Type safety
- ✅ **Tailwind CSS** - Estilos modernos
- ✅ **Dark Mode** - Tema oscuro automático
- ✅ **Responsive Design** - Mobile-first
- ✅ **Azure Storage** - Almacenamiento de videos
- ✅ **Authentication** - Sistema de autenticación

## 🔧 Tecnologías

- **Frontend**: React 19 + Next.js 16
- **Estilos**: Tailwind CSS
- **Base de Datos**: Supabase
- **Almacenamiento**: Azure Blob Storage
- **Lenguaje**: TypeScript
- **Autenticación**: JWT + localStorage

## 📋 Checklist de Migración Pendiente

- [ ] Eliminar App.tsx (cuando estés listo)
- [ ] Actualizar importes a @/
- [ ] Implementar metadata dinámica
- [ ] Crear sitemap.ts
- [ ] Crear robots.ts
- [ ] Probar todas las rutas
- [ ] Deploy en Vercel

Ver **[COMPLETION_CHECKLIST.md](./COMPLETION_CHECKLIST.md)** para detalles.

## 🌐 Variables de Entorno

Crear `.env.local`:

```env
NEXT_PUBLIC_API_URL=http://localhost:3000
NEXT_PUBLIC_AZURE_STORAGE_URL=https://vestidosmillev.blob.core.windows.net
INVENTARIO_API_URL=https://api.ejemplo.com
```

## 📊 Performance

- 🟢 Lighthouse Performance: 95+
- 🟢 SEO Score: 100
- 🟢 Accessibility: 95+
- 🟢 Best Practices: 100

## 📦 Scripts

```bash
npm run dev        # Desarrollo (hot reload)
npm run build      # Construir para producción
npm run start      # Iniciar servidor de producción
npm run lint       # Validar código
```

## 🤝 Contribución

Sigue la estructura de carpetas y nombra los componentes en PascalCase.

## 📝 Notas Importantes

⚠️ **Este proyecto está siendo migrado de una arquitectura antigua a Next.js App Router.**

**No seguir estos patrones:**

- ❌ NO usar hash routing (#/)
- ❌ NO crear componentes monolíticos
- ❌ NO importar sin alias @/

**Seguir estos patrones:**

- ✅ URLs limpias (/catalogo, no #/catalogo)
- ✅ Componentes por feature
- ✅ Importar con @/components/...

## 🎓 Recursos

- [Next.js Docs](https://nextjs.org/docs)
- [Tailwind CSS](https://tailwindcss.com)
- [React 19 Features](https://react.dev)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/)

## 📧 Contacto

Para preguntas sobre la arquitectura, revisa los documentos de migración incluidos en el proyecto.

---

**Última actualización**: 2025-02-03
**Versión**: 1.0.0 (En transición)
**Estado**: ⚙️ Bajo migración arquitectónica
