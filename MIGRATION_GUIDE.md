# Guía de Migración de Arquitectura Next.js

## ✅ Cambios Completados

### 1. Nueva estructura de carpetas

- `app/` - Rutas automáticas (App Router)
  - `page.tsx` - Home
  - `catalog/` - Catálogo de productos
    - `page.tsx` - Listado
    - `[slug]/page.tsx` - Detalle del producto
  - `blog/` - Blog
    - `page.tsx` - Listado de posts
    - `[slug]/page.tsx` - Detalle del post
  - `preguntas-frecuentes/` - FAQ
  - `api/` - API routes (endpoints del servidor)

### 2. Componentes reorganizados

- `components/global/` - Header, Footer (reutilizables)
- `components/catalog/` - Componentes del catálogo
- `components/product/` - Componentes de detalle de producto
- `components/blog/` - Componentes del blog
- `components/modals/` - Componentes de modales
- `components/ui/` - Componentes base reutilizables

### 3. API Routes creados

```
/api/products          → GET todos los productos
/api/products/[id]     → GET producto específico
/api/posts             → GET todos los posts
/api/faqs              → GET todas las preguntas frecuentes
```

## 🔄 Pasos de Migración Pendientes

### 1. Eliminar App.tsx (NO NECESARIO EN NEXT.js)

```bash
rm App.tsx
```

### 2. Actualizar importes en pages

Cambiar:

```tsx
import App from "./App";
```

Por:

```tsx
import Header from "@/components/global/Header";
import Footer from "@/components/global/Footer";
```

### 3. Migrar estado global (si es necesario)

Si tienes estado complejo en App.tsx, considera:

- Context API (ya está en place con AuthContext)
- Zustand o Redux (si lo necesitas)

### 4. Actualizar links en componentes

De:

```tsx
<a href="#/catalogo">Catálogo</a>
```

A:

```tsx
import Link from "next/link";
<Link href="/catalogo">Catálogo</Link>;
```

### 5. Nextificar componentes

Cambiar componentes anidados para usar 'use client' donde necesiten interactividad:

```tsx
"use client";

import { useState, useEffect } from "react";
```

## 📊 Beneficios de la nueva arquitectura

1. **SEO mejorado**: URLs limpias, metadata dinámica por página
2. **Performance**: Server Components, optimización automática
3. **Escalabilidad**: Estructura clara y modular
4. **Mantenibilidad**: Fácil encontrar y actualizar código
5. **DX mejorado**: Hot reload automático, errores más claros
6. **API centralizada**: Endpoints reutilizables

## 🗺️ Mapeo de rutas antiguas a nuevas

| Ruta antigua           | Ruta nueva              |
| ---------------------- | ----------------------- |
| #/                     | /                       |
| #/catalogo             | /catalogo               |
| #/catalogo/producto-id | /catalogo/producto-slug |
| #/blog                 | /blog                   |
| #/blog/post-id         | /blog/post-slug         |
| #/preguntas-frecuentes | /preguntas-frecuentes   |

## 🚀 Próximos pasos

1. Eliminar App.tsx después de migrar toda la lógica
2. Implementar metadata dinámica en pages
3. Crear API routes faltantes
4. Actualizar hooks para usar App Router
5. Implementar ISR (Incremental Static Regeneration) si es necesario
6. Configurar Vercel para deploy automático

## 📝 Notas importantes

- **'use client'**: Usar en componentes que necesiten hooks (useState, useEffect, etc.)
- **Metadata dinámica**: En cada `page.tsx` usar `generateMetadata()`
- **Rutas anidadas**: Usar carpetas con `page.tsx`
- **Rutas dinámicas**: Usar `[slug]` como nombre de carpeta
- **Imports**: Usar alias `@/` para imports relativos
