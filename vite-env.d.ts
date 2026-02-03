/// <reference types="next" />
/// <reference types="next/image-types/global" />

// NOTE: This file should be alwaysincluded in the include array in tsconfig.json
declare namespace NodeJS {
  interface ProcessEnv {
    readonly NEXT_PUBLIC_API_BLOG_BASE_URL?: string;
    readonly NEXT_PUBLIC_API_INVENTARIO_BASE_URL?: string;
    readonly NEXT_PUBLIC_AUTH_SERVICE_URL?: string;
    readonly NEXT_PUBLIC_API_BASE_URL?: string;
    readonly NEXT_PUBLIC_FAQ_LIMIT?: string;
    readonly NEXT_PUBLIC_API_PREGUNTAS_BASE_URL?: string;
    readonly NEXT_PUBLIC_IA_URL?: string;
  }
}

interface ImportMetaEnv {
  readonly NEXT_PUBLIC_AUTH_SERVICE_URL?: string;
  readonly GEMINI_API_KEY?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
