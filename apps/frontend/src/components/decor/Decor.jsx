/**
 * Ilustraciones de la identidad maya de Orígenes SV: templo con crestería,
 * ceiba sagrada, quetzal, greca escalonada (xicalcoliuhqui), sol maya,
 * ornamentos escalonados y el logo del restaurante.
 */
import { useApp } from '../../context/AppContext.jsx';

/* ---------- Logo ---------- */

const LOGOS = {
  figura: { src: '/img/logo/origenes-figura.png', proporcion: 671 / 634 },
  completo: { src: '/img/logo/origenes-logo.png', proporcion: 1433 / 986 },
};

/**
 * Logo del restaurante. Si en Identidad Visual se subió un logo propio, se usa ese;
 * si no, el logo de Orígenes SV teñido con el color del texto (currentColor).
 */
export function Logo({ variante = 'figura', className = '', titulo, personalizado }) {
  const { config } = useApp();
  // `personalizado`: undefined → logo guardado; null → logo de Orígenes; string → esa imagen (vista previa).
  const propio = personalizado !== undefined ? personalizado : config?.logo;
  if (propio) return <img src={propio} alt={titulo ?? config?.nombre ?? 'Logo'} className={`object-contain ${className}`} />;
  const { src, proporcion } = LOGOS[variante];
  return (
    <span
      role="img"
      aria-label={titulo ?? 'Orígenes SV'}
      className={`inline-block shrink-0 bg-current ${className}`}
      style={{ aspectRatio: proporcion, maskImage: `url(${src})`, WebkitMaskImage: `url(${src})`, maskSize: 'contain', WebkitMaskSize: 'contain', maskRepeat: 'no-repeat', WebkitMaskRepeat: 'no-repeat', maskPosition: 'center', WebkitMaskPosition: 'center' }}
    />
  );
}

/** Pirámide escalonada en trazo (se conserva para ilustraciones pequeñas). */
export function PiramideLogo({ className = '', strokeWidth = 2.2 }) {
  return (
    <svg viewBox="0 0 64 48" className={className} fill="none" stroke="currentColor" strokeWidth={strokeWidth} strokeLinejoin="round" strokeLinecap="round" aria-hidden="true">
      <path d="M4 44h56M8 44l4-7h40l4 7M12 37l4-7h32l4 7M16 30l4-7h24l4 7M20 23l4-7h16l4 7M26 16v-6h12v6M29 10V6h6v4M28 44V30h8v14M30 30v-7M34 30v-7" />
    </svg>
  );
}

/* ---------- Ornamentos mayas pequeños ---------- */

/** Ornamento bajo los títulos de página: pirámide escalonada con escalinata y una línea dorada. */
export function OrnamentoTitulo({ className = '' }) {
  return (
    <div className={`flex items-center gap-2 text-secundario ${className}`} aria-hidden="true">
      <svg viewBox="0 0 30 14" className="h-3.5 w-[30px]" fill="currentColor">
        <path d="M0 14V12H3V9H6V6H9V3H12V0H18V3H21V6H24V9H27V12H30V14Z" />
        <rect x="13.5" y="4" width="3" height="10" fill="var(--c-fondo)" />
      </svg>
      <span className="h-[3px] w-20 rounded-full bg-secundario/80" />
      <span className="size-1.5 rotate-45 bg-secundario" />
      <span className="size-1.5 rotate-45 bg-secundario/50" />
    </div>
  );
}

/** Sol maya (inspirado en el glifo K'in, "sol / día"): se usa como indicador de carga. */
export function SolMaya({ className = '' }) {
  return (
    <svg viewBox="0 0 40 40" className={className} aria-hidden="true">
      <g fill="currentColor">
        {[0, 45, 90, 135, 180, 225, 270, 315].map((a) => (
          <rect key={a} x="18" y="1" width="4" height="7" rx="1" transform={`rotate(${a} 20 20)`} />
        ))}
        <circle cx="20" cy="20" r="10" />
      </g>
      <path d="M20 12.5 L23 20 L20 27.5 L17 20 Z M12.5 20 L20 17 L27.5 20 L20 23 Z" fill="var(--c-fondo)" />
    </svg>
  );
}

/** Esquina con greca escalonada para las tarjetas de indicadores. */
export function EsquinaGreca({ className = '' }) {
  return (
    <svg viewBox="0 0 32 32" className={className} fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinejoin="miter" aria-hidden="true">
      <path d="M2 3H29V30" />
      <path d="M2 9H23V16H16V23H23V30" />
    </svg>
  );
}

/** Borde vertical de dientes escalonados (como el remate de un textil maya) para el menú lateral. */
export function BordeEscalonado({ className = '' }) {
  const forma = "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='6' height='16'%3E%3Cpath d='M0 0h2v3h2v3h2v4H4v3H2v3H0z'/%3E%3C/svg%3E\")";
  return (
    <div
      aria-hidden="true"
      className={`w-1.5 bg-secundario ${className}`}
      style={{ maskImage: forma, WebkitMaskImage: forma, maskRepeat: 'repeat-y', WebkitMaskRepeat: 'repeat-y' }}
    />
  );
}

/* ---------- Grecas y ornamentos ---------- */

/** Greca escalonada (xicalcoliuhqui): escalones que terminan en una espiral cuadrada. */
export function Greca({ className = '', id = 'greca', opacity = 1 }) {
  const trazo = 'M0 18 H5 V14 H9 V10 H13 V6 H17 V2 H38 V17 H24 V8 H31 V12';
  return (
    <svg className={className} aria-hidden="true" width="100%" height="100%">
      <defs>
        <pattern id={id} width="40" height="40" patternUnits="userSpaceOnUse">
          <g fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinejoin="miter" opacity={opacity}>
            <path d={trazo} />
            <path d={trazo} transform="rotate(180 20 20)" />
          </g>
        </pattern>
      </defs>
      <rect width="100%" height="100%" fill={`url(#${id})`} />
    </svg>
  );
}

/** Franja de pequeñas pirámides escalonadas (bajo los encabezados de panel). */
export function Cresteria({ className = '' }) {
  return (
    <div
      aria-hidden="true"
      className={`h-[7px] bg-secundario ${className}`}
      style={{
        maskImage: "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='16' height='7'%3E%3Cpath d='M0 7V5h2V3h2V1h8v2h2v2h2v2z'/%3E%3C/svg%3E\")",
        WebkitMaskImage: "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='16' height='7'%3E%3Cpath d='M0 7V5h2V3h2V1h8v2h2v2h2v2z'/%3E%3C/svg%3E\")",
        maskRepeat: 'repeat-x',
        WebkitMaskRepeat: 'repeat-x',
      }}
    />
  );
}

/** Divisor ornamental: línea dorada con una pequeña pirámide y dos rombos. */
export function DivisorRombos({ className = '' }) {
  return (
    <div className={`relative flex items-center ${className}`} aria-hidden="true">
      <div className="h-px flex-1 bg-secundario/70" />
      <svg viewBox="0 0 72 20" className="mx-2 h-5 w-16 text-secundario" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round">
        <path d="M6 10l5-5 5 5-5 5z" />
        <path d="M56 10l5-5 5 5-5 5z" />
        <path d="M22 17h28M25 17v-3h22v3M28 14v-3h16v3M31 11v-3h10v3M34 8V5h4v3" />
      </svg>
      <div className="h-px flex-1 bg-secundario/70" />
    </div>
  );
}

/** Banda inferior con greca escalonada sobre fondo azul. */
export function BandaGreca() {
  return (
    <div className="h-10 w-full overflow-hidden bg-primario text-secundario/70" aria-hidden="true">
      <Greca id="banda-greca" />
    </div>
  );
}

/* ---------- Escena del encabezado ---------- */

/** Escena maya: cerros, volcán, templo con crestería, ceiba y quetzal en tinta suave. */
export function EscenaEncabezado({ className = '' }) {
  return (
    <svg viewBox="0 0 560 160" className={`decor-tinta ${className}`} aria-hidden="true" preserveAspectRatio="xMaxYMax meet">
      {/* Volcán y cerros */}
      <g fill="currentColor" opacity="0.28">
        <path d="M150 160 L232 78 Q240 70 250 78 L332 160 Z" />
        <path d="M0 160 C60 120 110 108 170 122 C220 98 270 92 330 112 C380 96 440 92 560 116 L560 160 Z" />
      </g>
      {/* Templo maya: basamento escalonado, escalinata central, templo y crestería */}
      <g fill="currentColor" opacity="0.55">
        <path d="M330 160 L342 140 H478 L490 160 Z" />
        <path d="M342 140 L352 122 H468 L478 140 Z" />
        <path d="M352 122 L362 104 H458 L468 122 Z" />
        <path d="M362 104 L371 88 H449 L458 104 Z" />
        <path d="M371 88 L379 74 H441 L449 88 Z" />
        <rect x="386" y="52" width="48" height="22" />
        <rect x="380" y="48" width="60" height="5" />
        <path d="M392 48 V22 H428 V48 Z" />
        <path d="M388 22 H432 V18 H388 Z" />
      </g>
      <g fill="var(--c-fondo)" opacity="0.9">
        <rect x="404" y="58" width="12" height="16" />
        <rect x="398" y="28" width="6" height="6" />
        <rect x="416" y="28" width="6" height="6" />
        <rect x="407" y="36" width="6" height="8" />
      </g>
      <g stroke="var(--c-fondo)" strokeWidth="2" opacity="0.85">
        <path d="M402 160 V78 M418 160 V78" />
        <path d="M402 150 H418 M402 140 H418 M402 130 H418 M402 120 H418 M402 110 H418 M402 100 H418 M402 90 H418 M402 82 H418" />
      </g>
      {/* Ceiba sagrada */}
      <g fill="currentColor" opacity="0.5">
        <path d="M515 160 C517 140 518 122 516 104 L524 104 C522 122 523 140 527 160 Z" />
        <path d="M520 106 C500 106 486 98 490 90 C478 86 486 74 500 78 C502 66 520 66 524 76 C534 66 552 70 550 82 C562 86 556 100 542 100 C538 106 528 108 520 106 Z" />
        <path d="M512 160 C506 154 500 154 494 156 M530 160 C536 154 542 154 548 156" stroke="currentColor" strokeWidth="3" fill="none" />
      </g>
      {/* Quetzal en vuelo y aves */}
      <g className="anim-vuelo">
        <g fill="var(--c-secundario)">
          <path d="M262 42 C270 34 282 34 288 40 L300 34 L294 44 C290 50 278 52 270 48 Z" />
          <path d="M268 46 C254 56 236 62 214 64 C232 58 246 52 258 44 Z" />
          <path d="M266 48 C254 60 240 70 222 76 C238 66 250 58 260 48 Z" opacity="0.8" />
          <circle cx="284" cy="40" r="1.5" fill="var(--c-fondo)" />
        </g>
        <g fill="none" stroke="var(--c-secundario)" strokeWidth="3" strokeLinecap="round">
          <path d="M318 26 q6 -6 11 0 q5 -6 11 0" />
          <path d="M304 66 q5 -5 9 0 q4 -5 9 0" />
        </g>
      </g>
    </svg>
  );
}
