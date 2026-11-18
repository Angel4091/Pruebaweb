import { useEffect, useRef } from 'react';
import { Cresteria, EsquinaGreca, SolMaya, PiramideLogo } from '../decor/Decor.jsx';
import { ChevronLeft, ChevronRight, X, Loader, TriangleAlert, CircleAlert, CircleCheck } from 'lucide-react';

/* ---------- Botón ---------- */
const VARIANTES = {
  primario: 'bg-primario text-white hover:brightness-110',
  dorado: 'bg-secundario text-primario hover:brightness-105',
  contorno: 'border-2 border-primario text-primario bg-superficie hover:bg-primario/5',
  suave: 'bg-superficie-2 text-texto hover:brightness-95',
  peligro: 'bg-error text-white hover:brightness-110',
  fantasma: 'text-texto hover:bg-superficie-2',
};

export function Button({ variante = 'primario', className = '', icon: Icon, loading = false, children, ...props }) {
  return (
    <button
      type="button"
      className={`inline-flex items-center justify-center gap-2 rounded-xl px-4 py-2.5 font-display text-sm font-semibold transition disabled:cursor-not-allowed disabled:opacity-50 ${VARIANTES[variante]} ${className}`}
      disabled={loading || props.disabled}
      {...props}
    >
      {loading ? <Loader className="size-4 animate-spin" /> : Icon && <Icon className="size-[1.1em]" />}
      {children}
    </button>
  );
}

/* ---------- Tarjeta de indicador (KPI) ---------- */
const TONOS = {
  azul: 'bg-acento/15 text-[var(--c-tinta)]',
  dorado: 'bg-secundario/25 text-[#c98a12]',
  naranja: 'bg-naranja/20 text-naranja',
  verde: 'bg-exito/15 text-exito',
  rojo: 'bg-error/15 text-error',
};

export function StatCard({ icon: Icon, titulo, valor, detalle, tono = 'azul', acento = true, valorClass = '' }) {
  return (
    <div className={`card anim-entrada relative flex items-center gap-4 overflow-hidden p-4 sm:p-5 ${acento ? 'border-l-4! border-l-secundario!' : ''}`}>
      {/* Esquina con greca escalonada: detalle maya de las tarjetas de indicadores */}
      <EsquinaGreca className="pointer-events-none absolute top-2 right-2 size-7 text-secundario/35" />
      <div className={`escalonado grid size-14 shrink-0 place-items-center ${TONOS[tono]}`}>
        <Icon className="size-7" strokeWidth={2.2} />
      </div>
      <div className="min-w-0">
        <p className="text-[0.95rem] font-medium text-texto">{titulo}</p>
        <p className={`font-display text-2xl font-bold leading-tight tracking-tight text-texto sm:text-[1.75rem] ${valorClass}`}>{valor}</p>
        {detalle && <div className="mt-0.5 text-sm text-suave">{detalle}</div>}
      </div>
    </div>
  );
}

/** Variación porcentual con flecha (verde si sube, rojo si baja). */
export function Variacion({ valor, sufijo = 'vs ayer' }) {
  const sube = valor >= 0;
  return (
    <span className="inline-flex items-center gap-1">
      <span className={sube ? 'text-exito' : 'text-error'}>{sube ? '▲' : '▼'}</span>
      <span className={`font-semibold ${sube ? 'text-exito' : 'text-error'}`}>
        {sube ? '+' : ''}
        {Math.round(valor)}%
      </span>
      <span>{sufijo}</span>
    </span>
  );
}

/* ---------- Panel con encabezado azul ---------- */
export function Panel({ titulo, icon: Icon, acciones, children, className = '', claro = false, cuerpo = '' }) {
  return (
    <section className={`card anim-entrada flex flex-col overflow-hidden ${className}`}>
      <header
        className={`flex min-h-14 items-center justify-between gap-3 px-5 py-3 ${claro ? 'text-texto' : 'bg-primario text-white'}`}
      >
        <h2 className="flex items-center gap-3 font-display text-lg font-semibold">
          {Icon && <Icon className={`size-6 ${claro ? 'text-primario' : ''}`} strokeWidth={2.2} />}
          {titulo}
        </h2>
        {acciones && <div className="flex items-center gap-2">{acciones}</div>}
      </header>
      {!claro && <Cresteria />}
      <div className={`flex-1 ${cuerpo}`}>{children}</div>
    </section>
  );
}

/* ---------- Insignia de estado ---------- */
const BADGES = {
  verde: 'bg-exito/15 text-exito',
  amarillo: 'bg-secundario/25 text-[#b36b00]',
  rojo: 'bg-error/15 text-error',
  azul: 'bg-acento/15 text-acento',
  gris: 'bg-superficie-2 text-suave',
};

export function Badge({ color = 'verde', punto = true, children, className = '' }) {
  return (
    <span className={`inline-flex items-center gap-1.5 whitespace-nowrap rounded-full px-3 py-1 text-xs font-semibold ${BADGES[color]} ${className}`}>
      {punto && <span className="size-1.5 rounded-full bg-current" />}
      {children}
    </span>
  );
}

/* ---------- Modal accesible ---------- */
export function Modal({ abierto, onClose, titulo, children, ancho = 'max-w-lg', pie }) {
  const ref = useRef(null);
  useEffect(() => {
    if (!abierto) return undefined;
    const onKey = (e) => e.key === 'Escape' && onClose();
    document.addEventListener('keydown', onKey);
    ref.current?.querySelector('input, select, textarea, button')?.focus();
    return () => document.removeEventListener('keydown', onKey);
  }, [abierto, onClose]);

  if (!abierto) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-[#0b1530]/55 p-0 backdrop-blur-[2px] sm:items-center sm:p-4" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <div ref={ref} role="dialog" aria-modal="true" aria-label={titulo} className={`card anim-entrada flex max-h-[92vh] w-full flex-col overflow-hidden ${ancho}`}>
        <header className="no-imprimir flex items-center justify-between bg-primario px-5 py-3.5 text-white">
          <h3 className="font-display text-lg font-semibold">{titulo}</h3>
          <button type="button" onClick={onClose} className="rounded-lg p-1 hover:bg-white/10" aria-label="Cerrar">
            <X className="size-5" />
          </button>
        </header>
        <Cresteria className="no-imprimir" />
        <div className="flex-1 overflow-y-auto p-5">{children}</div>
        {pie && <footer className="no-imprimir flex flex-wrap justify-end gap-2 border-t border-borde px-5 py-3">{pie}</footer>}
      </div>
    </div>
  );
}

/* ---------- Paginación ---------- */
export function Pagination({ pagina, total, porPagina, onChange, etiqueta = 'registros' }) {
  const paginas = Math.max(1, Math.ceil(total / porPagina));
  const desde = total === 0 ? 0 : (pagina - 1) * porPagina + 1;
  const hasta = Math.min(total, pagina * porPagina);
  const btn = 'grid size-9 place-items-center rounded-lg border border-borde text-sm font-semibold transition disabled:opacity-40';
  return (
    <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-3 text-sm text-suave">
      <span>
        Mostrando {desde} - {hasta} de {total} {etiqueta}
      </span>
      <div className="flex gap-1.5">
        <button type="button" className={btn} onClick={() => onChange(pagina - 1)} disabled={pagina <= 1} aria-label="Página anterior">
          <ChevronLeft className="size-4" />
        </button>
        {Array.from({ length: paginas }, (_, i) => i + 1).slice(Math.max(0, pagina - 3), Math.max(0, pagina - 3) + 4).map((n) => (
          <button key={n} type="button" onClick={() => onChange(n)} className={`${btn} ${n === pagina ? 'border-primario bg-primario text-white' : 'bg-superficie text-texto'}`}>
            {n}
          </button>
        ))}
        <button type="button" className={btn} onClick={() => onChange(pagina + 1)} disabled={pagina >= paginas} aria-label="Página siguiente">
          <ChevronRight className="size-4" />
        </button>
      </div>
    </div>
  );
}

/* ---------- Estados de carga, error y vacío ---------- */
export function Cargando({ texto = 'Cargando…' }) {
  return (
    <div className="flex items-center justify-center gap-3 p-8 text-suave" role="status">
      <SolMaya className="size-7 animate-[spin_3s_linear_infinite] text-secundario" /> {texto}
    </div>
  );
}

export function ErrorBox({ error, onRetry }) {
  if (!error) return null;
  return (
    <div className="m-4 flex flex-wrap items-center gap-3 rounded-xl border border-error/30 bg-error/10 p-4 text-sm text-error">
      <CircleAlert className="size-5 shrink-0" />
      <span className="flex-1">{error.message}</span>
      {onRetry && (
        <Button variante="peligro" className="py-1.5" onClick={onRetry}>
          Reintentar
        </Button>
      )}
    </div>
  );
}

export function Vacio({ icon: Icon = PiramideLogo, titulo, children }) {
  return (
    <div className="flex flex-col items-center gap-2 px-6 py-10 text-center text-suave">
      <Icon className="size-8 text-secundario" />
      <p className="font-display font-semibold text-texto">{titulo}</p>
      {children && <div className="text-sm">{children}</div>}
    </div>
  );
}

/** Franja de aviso (naranja) como las alertas del sistema. */
export function Aviso({ titulo, children, accion, tono = 'naranja', className = '' }) {
  const colores = tono === 'rojo' ? 'bg-error' : 'bg-naranja';
  return (
    <div className={`card anim-entrada flex flex-wrap items-center gap-4 border-l-4! border-l-naranja! bg-[color-mix(in_srgb,var(--c-naranja)_9%,var(--c-superficie))]! px-5 py-3.5 ${className}`}>
      <span className={`grid size-10 shrink-0 place-items-center rounded-full text-white ${colores}`}>
        <TriangleAlert className="size-5" />
      </span>
      <div className="min-w-0 flex-1">
        {titulo && <p className="font-display font-semibold text-texto">{titulo}</p>}
        <div className="text-sm text-texto/80">{children}</div>
      </div>
      {accion}
    </div>
  );
}

/* ---------- Campo de formulario ---------- */
export function Field({ label, children, ayuda, className = '' }) {
  return (
    <label className={`flex flex-col gap-1.5 text-sm ${className}`}>
      <span className="font-display font-medium text-texto">{label}</span>
      {children}
      {ayuda && <span className="text-xs text-suave">{ayuda}</span>}
    </label>
  );
}

/* ---------- Notificaciones (toasts) ---------- */
export function Toasts({ toasts, onClose }) {
  return (
    <div className="pointer-events-none fixed right-4 bottom-4 z-[60] flex w-[min(380px,calc(100vw-2rem))] flex-col gap-2" aria-live="polite">
      {toasts.map((t) => {
        const Icono = t.tipo === 'error' ? CircleAlert : CircleCheck;
        return (
          <div key={t.id} className={`card anim-entrada pointer-events-auto flex items-start gap-3 border-l-4! p-3.5 text-sm ${t.tipo === 'error' ? 'border-l-error!' : 'border-l-exito!'}`}>
            <Icono className={`mt-0.5 size-5 shrink-0 ${t.tipo === 'error' ? 'text-error' : 'text-exito'}`} />
            <p className="flex-1 text-texto">{t.mensaje}</p>
            <button type="button" onClick={() => onClose(t.id)} className="text-suave hover:text-texto" aria-label="Cerrar notificación">
              <X className="size-4" />
            </button>
          </div>
        );
      })}
    </div>
  );
}

/** Interruptor tipo switch. */
export function Switch({ checked, onChange, label }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      onClick={() => onChange(!checked)}
      className={`relative h-7 w-13 shrink-0 rounded-full transition ${checked ? 'bg-primario' : 'bg-borde'}`}
    >
      <span className={`absolute top-1 size-5 rounded-full bg-white shadow transition-all ${checked ? 'left-7' : 'left-1'}`} />
    </button>
  );
}
