import { useState } from 'react';

/** Escala "bonita" para el eje Y (0, 50, 100… / 0, 100, 200…). */
function escalaY(max, pasos = 4) {
  const bruto = Math.max(max, 1) / pasos;
  const magnitud = 10 ** Math.floor(Math.log10(bruto));
  const paso = [1, 2, 2.5, 5, 10].map((m) => m * magnitud).find((p) => p >= bruto);
  return Array.from({ length: pasos + 1 }, (_, i) => i * paso);
}

/** Curva suave (Catmull-Rom → Bézier) o polilínea. */
function trazo(puntos, suave) {
  if (puntos.length === 0) return '';
  if (!suave || puntos.length < 3) return puntos.map((p, i) => `${i ? 'L' : 'M'}${p[0]},${p[1]}`).join(' ');
  let d = `M${puntos[0][0]},${puntos[0][1]}`;
  for (let i = 0; i < puntos.length - 1; i += 1) {
    const p0 = puntos[i - 1] ?? puntos[i];
    const p1 = puntos[i];
    const p2 = puntos[i + 1];
    const p3 = puntos[i + 2] ?? p2;
    const c1 = [p1[0] + (p2[0] - p0[0]) / 6, p1[1] + (p2[1] - p0[1]) / 6];
    const c2 = [p2[0] - (p3[0] - p1[0]) / 6, p2[1] - (p3[1] - p1[1]) / 6];
    d += ` C${c1[0]},${c1[1]} ${c2[0]},${c2[1]} ${p2[0]},${p2[1]}`;
  }
  return d;
}

/**
 * Gráfica de líneas con tooltip.
 * @param {{ etiquetas: string[], series: {nombre, color, valores: (number|null)[], area?: boolean}[] }} props
 */
export function LineChart({ etiquetas, subetiquetas, series, alto = 220, suave = false, formato = (v) => v }) {
  const [hover, setHover] = useState(null);
  const ancho = 640;
  const margen = { top: 12, right: 18, bottom: subetiquetas ? 44 : 30, left: 44 };
  const max = Math.max(...series.flatMap((s) => s.valores.filter((v) => v !== null)));
  const ticks = escalaY(max);
  const tope = ticks[ticks.length - 1];
  const w = ancho - margen.left - margen.right;
  const h = alto - margen.top - margen.bottom;
  const x = (i) => margen.left + (etiquetas.length === 1 ? w / 2 : (i / (etiquetas.length - 1)) * w);
  const y = (v) => margen.top + h - (v / tope) * h;

  return (
    <div className="relative">
      <svg viewBox={`0 0 ${ancho} ${alto}`} className="h-auto w-full" role="img" aria-label={`Gráfica: ${series.map((s) => s.nombre).join(', ')}`}>
        <defs>
          {series.map((s, i) => (
            <linearGradient key={i} id={`area-${i}-${s.nombre.replace(/\s/g, '')}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={s.color} stopOpacity="0.22" />
              <stop offset="100%" stopColor={s.color} stopOpacity="0.02" />
            </linearGradient>
          ))}
        </defs>
        {ticks.map((t) => (
          <g key={t}>
            <line x1={margen.left} x2={ancho - margen.right} y1={y(t)} y2={y(t)} stroke="var(--c-borde)" strokeDasharray={t === 0 ? '' : '3 4'} />
            <text x={margen.left - 10} y={y(t) + 4} textAnchor="end" fontSize="12" fill="var(--c-texto)">
              {t}
            </text>
          </g>
        ))}
        {etiquetas.map((e, i) => (
          <g key={e + i}>
            <line x1={x(i)} x2={x(i)} y1={margen.top} y2={margen.top + h} stroke="var(--c-borde)" opacity={subetiquetas ? 0.8 : 0} />
            <text x={x(i)} y={alto - (subetiquetas ? 24 : 8)} textAnchor="middle" fontSize="12" fill="var(--c-texto)">
              {e}
            </text>
            {subetiquetas && (
              <text x={x(i)} y={alto - 8} textAnchor="middle" fontSize="11" fill="var(--c-texto-suave)">
                {subetiquetas[i]}
              </text>
            )}
          </g>
        ))}
        {series.map((s, si) => {
          const puntos = s.valores.map((v, i) => (v === null ? null : [x(i), y(v)])).filter(Boolean);
          if (puntos.length === 0) return null;
          const d = trazo(puntos, suave);
          return (
            <g key={s.nombre}>
              {s.area && <path d={`${d} L${puntos.at(-1)[0]},${y(0)} L${puntos[0][0]},${y(0)} Z`} fill={`url(#area-${si}-${s.nombre.replace(/\s/g, '')})`} />}
              <path d={d} fill="none" stroke={s.color} strokeWidth="3" strokeLinejoin="round" strokeLinecap="round" />
              {puntos.map(([px, py], i) => (
                <circle key={i} cx={px} cy={py} r="5" fill={s.color} stroke="var(--c-superficie)" strokeWidth="2" />
              ))}
            </g>
          );
        })}
        {etiquetas.map((e, i) => (
          <rect
            key={`hit-${e}-${i}`}
            x={x(i) - w / etiquetas.length / 2}
            y={margen.top}
            width={w / etiquetas.length}
            height={h}
            fill="transparent"
            onMouseEnter={() => setHover(i)}
            onMouseLeave={() => setHover(null)}
          />
        ))}
        {hover !== null && <line x1={x(hover)} x2={x(hover)} y1={margen.top} y2={margen.top + h} stroke="var(--c-acento)" strokeDasharray="4 4" pointerEvents="none" />}
      </svg>
      {hover !== null && (
        <div
          className="card pointer-events-none absolute top-2 z-10 px-3 py-2 text-xs"
          style={{ left: `${Math.min(80, Math.max(5, (x(hover) / ancho) * 100))}%`, transform: 'translateX(-50%)' }}
        >
          <p className="mb-1 font-semibold text-texto">{etiquetas[hover]} {subetiquetas?.[hover]}</p>
          {series.map((s) =>
            s.valores[hover] === null ? null : (
              <p key={s.nombre} className="flex items-center gap-2 text-suave">
                <span className="size-2 rounded-full" style={{ background: s.color }} />
                {s.nombre}: <b className="text-texto">{formato(s.valores[hover])}</b>
              </p>
            ),
          )}
        </div>
      )}
    </div>
  );
}

/** Gráfica de dona con total al centro. */
export function DonutChart({ datos, total, etiqueta = 'Total', tamano = 190 }) {
  const r = 70;
  const grosor = 26;
  const circ = 2 * Math.PI * r;
  const suma = datos.reduce((a, d) => a + d.valor, 0) || 1;
  let acumulado = 0;
  return (
    <svg viewBox="0 0 200 200" width={tamano} height={tamano} role="img" aria-label="Distribución por método de pago">
      <circle cx="100" cy="100" r={r} fill="none" stroke="var(--c-superficie-2)" strokeWidth={grosor} />
      {datos.map((d) => {
        const largo = (d.valor / suma) * circ;
        const offset = -acumulado;
        acumulado += largo;
        return (
          <circle
            key={d.nombre}
            cx="100"
            cy="100"
            r={r}
            fill="none"
            stroke={d.color}
            strokeWidth={grosor}
            strokeDasharray={`${largo} ${circ - largo}`}
            strokeDashoffset={offset}
            transform="rotate(-90 100 100)"
          >
            <title>{`${d.nombre}: ${d.valor}`}</title>
          </circle>
        );
      })}
      <text x="100" y="98" textAnchor="middle" fontSize="22" fontWeight="700" fill="var(--c-texto)" fontFamily="var(--f-principal)">
        {total}
      </text>
      <text x="100" y="120" textAnchor="middle" fontSize="14" fill="var(--c-texto)">
        {etiqueta}
      </text>
    </svg>
  );
}

/** Barra horizontal simple (progreso). */
export function Barra({ porcentaje, color = 'var(--c-primario)' }) {
  return (
    <div className="h-3 w-full overflow-hidden rounded-full bg-superficie-2">
      <div className="h-full rounded-full transition-[width] duration-700" style={{ width: `${Math.min(100, Math.max(0, porcentaje))}%`, background: color }} />
    </div>
  );
}
