// Declarações globais TypeScript para o frontend (ToNoPiramba)
// Adiciona suporte a imports de arquivos .css, imagens, fontes e outros assets
// que o Next.js resolve em build/runtime mas o TS strict não conhece.

/* ============================================================
   Arquivos CSS globais / side-effect imports
   Ex.: import './admin.css';  — sem default export, só side effect
   ============================================================ */
declare module '*.css' {
  // Para CSS modules padrão Next.js ainda temos classe names:
  const classes: { readonly [key: string]: string };
  export default classes;
}

/* ============================================================
   Imagens
   ============================================================ */
declare module '*.png' {
  const src: string;
  export default src;
}
declare module '*.jpg' {
  const src: string;
  export default src;
}
declare module '*.jpeg' {
  const src: string;
  export default src;
}
declare module '*.gif' {
  const src: string;
  export default src;
}
declare module '*.webp' {
  const src: string;
  export default src;
}
declare module '*.svg' {
  // Import default como URL (Next.js)
  // Named import ReactComponent como componente
  import type { FC, SVGProps } from 'react';
  export const ReactComponent: FC<SVGProps<SVGSVGElement>>;
  const src: string;
  export default src;
}
declare module '*.ico' {
  const src: string;
  export default src;
}

/* ============================================================
   Fontes
   ============================================================ */
declare module '*.woff' {
  const src: string;
  export default src;
}
declare module '*.woff2' {
  const src: string;
  export default src;
}
declare module '*.ttf' {
  const src: string;
  export default src;
}
declare module '*.otf' {
  const src: string;
  export default src;
}
declare module '*.eot' {
  const src: string;
  export default src;
}

/* ============================================================
   Áudios
   ============================================================ */
declare module '*.mp3' {
  const src: string;
  export default src;
}
declare module '*.wav' {
  const src: string;
  export default src;
}
