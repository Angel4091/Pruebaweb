/**
 * Ilustraciones de la identidad de Orígenes SV: pirámide escalonada,
 * aves, cerros y la greca de rombos inspirada en textiles mesoamericanos.
 */

/** Pirámide escalonada en trazo (logo). */
export function PiramideLogo({ className = '', strokeWidth = 2.2 }) {
  return (
    <svg viewBox="0 0 64 48" className={className} fill="none" stroke="currentColor" strokeWidth={strokeWidth} strokeLinejoin="round" strokeLinecap="round" aria-hidden="true">
      <path d="M4 44h56" />
      <path d="M8 44l4-7h40l4 7" />
      <path d="M12 37l4-7h32l4 7" />
      <path d="M16 30l4-7h24l4 7" />
      <path d="M20 23l4-7h16l4 7" />
      <path d="M26 16v-6h12v6" />
      <path d="M29 10V6h6v4" />
      <path d="M28 44V30h8v14" />
      <path d="M30 30v-7M34 30v-7" />
    </svg>
  );
}

/** Escena del encabezado: cerros, pirámide y aves en tinta suave. */
export function EscenaEncabezado({ className = '' }) {
  return (
    <svg viewBox="0 0 520 150" className={`decor-tinta ${className}`} aria-hidden="true" preserveAspectRatio="xMaxYMax meet">
      <g fill="currentColor" opacity="0.35">
        <path d="M0 150 C60 110 110 95 170 112 C220 80 260 70 320 96 C360 78 420 70 520 104 L520 150 Z" />
      </g>
      <g fill="currentColor" opacity="0.55">
        <path d="M300 150 L318 124 H462 L480 150 Z" />
        <path d="M318 124 L334 100 H446 L462 124 Z" />
        <path d="M334 100 L350 78 H430 L446 100 Z" />
        <path d="M350 78 L364 58 H416 L430 78 Z" />
        <rect x="372" y="36" width="36" height="22" />
        <rect x="378" y="30" width="24" height="6" />
      </g>
      <g stroke="var(--c-fondo)" strokeWidth="2" opacity="0.9">
        <path d="M384 150 V64 M396 150 V64" />
        <path d="M384 140 H396 M384 130 H396 M384 120 H396 M384 110 H396 M384 100 H396 M384 90 H396 M384 80 H396 M384 70 H396" />
      </g>
      <g fill="currentColor" opacity="0.5">
        <circle cx="490" cy="118" r="10" />
        <rect x="488" y="124" width="4" height="26" />
        <circle cx="282" cy="124" r="8" />
        <rect x="280" y="128" width="3" height="22" />
      </g>
      <g className="anim-vuelo" fill="none" stroke="var(--c-secundario)" strokeWidth="3" strokeLinecap="round">
        <path d="M232 40 q8 -8 14 0 q6 -8 14 0" />
        <path d="M268 22 q6 -6 11 0 q5 -6 11 0" />
        <path d="M262 62 q5 -5 9 0 q4 -5 9 0" />
      </g>
    </svg>
  );
}

/** Divisor ornamental bajo la barra superior (línea con rombos al centro). */
export function DivisorRombos({ className = '' }) {
  return (
    <div className={`relative flex items-center ${className}`} aria-hidden="true">
      <div className="h-px flex-1 bg-secundario/70" />
      <svg viewBox="0 0 64 20" className="mx-2 h-4 w-14 text-secundario" fill="none" stroke="currentColor" strokeWidth="1.8">
        <path d="M14 10l6-6 6 6-6 6z" />
        <path d="M26 10l6-7 6 7-6 7z" />
        <path d="M38 10l6-6 6 6-6 6z" />
        <circle cx="32" cy="10" r="1.6" fill="currentColor" />
      </svg>
      <div className="h-px flex-1 bg-secundario/70" />
    </div>
  );
}

/** Greca de rombos (patrón textil) usada al pie del sidebar y del contenido. */
export function Greca({ className = '', id = 'greca', opacity = 1 }) {
  return (
    <svg className={className} aria-hidden="true" width="100%" height="100%">
      <defs>
        <pattern id={id} width="36" height="36" patternUnits="userSpaceOnUse">
          <g fill="none" stroke="currentColor" strokeWidth="2" opacity={opacity}>
            <path d="M18 2 L34 18 L18 34 L2 18 Z" />
            <path d="M18 9 L27 18 L18 27 L9 18 Z" />
            <path d="M18 15 L21 18 L18 21 L15 18 Z" fill="currentColor" />
          </g>
        </pattern>
      </defs>
      <rect width="100%" height="100%" fill={`url(#${id})`} />
    </svg>
  );
}

/** Banda inferior con greca sobre fondo azul. */
export function BandaGreca() {
  return (
    <div className="h-9 w-full overflow-hidden bg-primario text-white/80" aria-hidden="true">
      <Greca id="banda-greca" opacity={0.75} />
    </div>
  );
}
