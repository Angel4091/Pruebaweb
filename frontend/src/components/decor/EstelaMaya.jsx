import { useMemo } from 'react';
import { fechaMaya, UNIDADES_CUENTA_LARGA } from '../../utils/calendarioMaya.js';
import { NumeroMaya } from './Decor.jsx';

/**
 * "Estela" con la fecha de hoy en el calendario maya:
 * Cuenta Larga (numerales de puntos y barras), Tzolk'in y Haab'.
 */
export function EstelaMaya({ fecha = new Date(), className = '' }) {
  const { cuentaLarga, tzolkin, haab } = useMemo(() => fechaMaya(fecha), [fecha]);
  const titulo = `Cuenta larga ${cuentaLarga.join('.')} · ${tzolkin.numero} ${tzolkin.dia} · ${haab.numero} ${haab.mes}`;

  return (
    <section
      className={`card anim-entrada relative overflow-hidden border-secundario/60! bg-[color-mix(in_srgb,var(--c-secundario)_10%,var(--c-superficie))]! px-4 pt-3 pb-3 ${className}`}
      aria-label={`Fecha maya de hoy: ${titulo}`}
      title={titulo}
    >
      <p className="mb-2 text-center font-display text-xs font-semibold tracking-wide text-suave">Hoy en el calendario maya</p>
      <div className="flex items-end justify-center gap-2.5">
        {cuentaLarga.map((v, i) => (
          <div key={UNIDADES_CUENTA_LARGA[i]} className="flex w-9 flex-col items-center gap-1">
            <div className="flex h-10 items-end">
              <NumeroMaya valor={v} className="w-8 text-[var(--c-tinta)]" titulo={`${v} ${UNIDADES_CUENTA_LARGA[i]}`} />
            </div>
            <span className="font-display text-sm font-bold text-texto">{v}</span>
            <span className="text-[0.62rem] leading-none text-suave">{UNIDADES_CUENTA_LARGA[i]}</span>
          </div>
        ))}
      </div>
      <div className="mt-2.5 flex justify-center gap-4 border-t border-secundario/40 pt-2 text-sm">
        <span className="flex items-center gap-1.5 text-texto">
          <NumeroMaya valor={tzolkin.numero} className="w-5 text-naranja" />
          <b className="font-display">{tzolkin.numero} {tzolkin.dia}</b>
        </span>
        <span className="flex items-center gap-1.5 text-texto">
          <NumeroMaya valor={haab.numero} className="w-5 text-naranja" />
          <b className="font-display">{haab.numero} {haab.mes}</b>
        </span>
      </div>
    </section>
  );
}
