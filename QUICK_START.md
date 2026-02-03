# 🚀 Quick Start - Nueva Arquitectura

## 1️⃣ Eliminar App.tsx (IMPORTANTE)

Cuando estés listo (después de probar que todo funciona):

```powershell
# Windows PowerShell
Remove-Item App.tsx

# O bash/git bash
rm App.tsx
```

## 2️⃣ Iniciar servidor de desarrollo

```powershell
npm run dev
```

Luego abre http://localhost:3000 en tu navegador.

## 3️⃣ Rutas disponibles

| URL                                        | Componente          |
| ------------------------------------------ | ------------------- |
| http://localhost:3000/                     | Home                |
| http://localhost:3000/catalogo             | Catálogo            |
| http://localhost:3000/catalogo/algo        | Detalle de producto |
| http://localhost:3000/blog                 | Blog                |
| http://localhost:3000/blog/algo            | Post                |
| http://localhost:3000/preguntas-frecuentes | FAQ                 |

## 4️⃣ Crear una nueva página

### Ejemplo: Página "Acerca de"

Crear carpeta y archivo:

```
app/
└── about/
    └── page.tsx
```

Contenido:

```tsx
export default function AboutPage() {
  return (
    <main>
      <h1>Acerca de nosotros</h1>
      <p>Somos una tienda de vestidos...</p>
    </main>
  );
}
```

Acceso: http://localhost:3000/about

## 5️⃣ Crear una ruta dinámica

### Ejemplo: Página de categorías

Crear:

```
app/
└── categorias/
    ├── page.tsx          (listado)
    └── [id]/
        └── page.tsx      (detalle)
```

Archivo: `app/categorias/[id]/page.tsx`

```tsx
export default function CategoryPage({ params }) {
  return <h1>Categoría: {params.id}</h1>;
}
```

Acceso:

- http://localhost:3000/categorias (listado)
- http://localhost:3000/categorias/casual (detalle)
- http://localhost:3000/categorias/formal (detalle)

## 6️⃣ Crear un API endpoint

### Ejemplo: Obtener categorías

Crear:

```
app/
└── api/
    └── categories/
        └── route.ts
```

Contenido:

```tsx
import { NextResponse } from "next/server";

export async function GET() {
  const categories = [
    { id: 1, name: "Casual" },
    { id: 2, name: "Formal" },
  ];

  return NextResponse.json(categories);
}
```

Acceso: http://localhost:3000/api/categories

## 7️⃣ Agregar metadata dinámica

En cualquier `page.tsx`, agregar:

```tsx
import type { Metadata } from "next";

export async function generateMetadata({ params }): Promise<Metadata> {
  return {
    title: "Mi Página",
    description: "Descripción de mi página",
    openGraph: {
      title: "Mi Página",
      description: "Descripción de mi página",
    },
  };
}

export default function MyPage() {
  return <h1>Mi Página</h1>;
}
```

## 8️⃣ Usar componentes compartidos

### Importar Header y Footer

```tsx
"use client";

import Header from "@/components/global/Header";
import Footer from "@/components/global/Footer";

export default function MyPage() {
  return (
    <>
      <Header />
      <main>Contenido</main>
      <Footer />
    </>
  );
}
```

### Crear nuevo componente compartido

1. Crear archivo:

```
components/ui/MyComponent.tsx
```

2. Contenido:

```tsx
"use client";

export default function MyComponent() {
  return <div>Mi componente</div>;
}
```

3. Usar en cualquier página:

```tsx
import MyComponent from "@/components/ui/MyComponent";

export default function Page() {
  return <MyComponent />;
}
```

## 9️⃣ Variables de entorno

Crear archivo `.env.local`:

```env
NEXT_PUBLIC_API_URL=http://localhost:3000
NEXT_PUBLIC_AZURE_URL=https://vestidosmillev.blob.core.windows.net
```

Usar en código:

```tsx
const apiUrl = process.env.NEXT_PUBLIC_API_URL;
```

## 🔟 Construir y desplegar

### Construcción local

```powershell
npm run build
npm run start
```

### Deploy en Vercel

```powershell
# Instalar Vercel CLI
npm install -g vercel

# Deploy
vercel
```

---

## 📝 Comandos útiles

```powershell
# Desarrollo
npm run dev              # Inicia servidor con hot reload

# Construcción
npm run build            # Construye para producción
npm run start            # Inicia servidor de producción

# Linting
npm run lint             # Verifica código

# TypeScript
npx tsc --noEmit         # Verifica tipos sin emitir archivos
```

## ✅ Checklist rápido

- [ ] Ejecutar `npm run dev`
- [ ] Visitar http://localhost:3000
- [ ] Probar navegación entre páginas
- [ ] Verificar que Header y Footer cargan
- [ ] Probar en móvil (DevTools F12 → Toggle device toolbar)
- [ ] Abrir Console (F12) y verificar sin errores rojos

## ❌ Problemas comunes

### "Cannot find module '@/...'"

```
Solución: Verificar que tsconfig.json tiene:
{
  "compilerOptions": {
    "paths": {
      "@/*": ["./*"]
    }
  }
}
```

### "Module not found: Can't resolve './App'"

```
Solución: App.tsx ya no es necesario, elimínalo
```

### "Hydration mismatch"

```
Solución: Asegúrate de usar 'use client' en componentes con hooks
```

### "Layout shift"

```
Solución: Usar dimensiones fijas en imágenes:
<Image width={100} height={100} ... />
```

---

## 🎓 Siguiente paso

Lee **COMPLETION_CHECKLIST.md** para completar la migración al 100%.

¡Felicidades por migrar a la arquitectura moderna de Next.js! 🎉
