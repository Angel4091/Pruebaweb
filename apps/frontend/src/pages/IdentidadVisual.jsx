import { useEffect, useRef, useState } from 'react';
import { Palette, Upload, Droplet, Type, Eye, Settings, Save, RotateCcw, Trash2 } from 'lucide-react';
import { useApp, aplicarTema } from '../context/AppContext.jsx';
import { useFetch } from '../hooks/useFetch.js';
import { generalService } from '../services/index.js';
import { PageHeader } from '../components/layout/Layout.jsx';
import { Panel, Field, Button, Switch, Cargando } from '../components/ui/index.jsx';
import { Logo, DivisorRombos } from '../components/decor/Decor.jsx';

const COLORES = [
  ['primario', 'Primario'],
  ['secundario', 'Secundario'],
  ['fondo', 'Fondo'],
  ['acento', 'Acento'],
  ['exito', 'Éxito'],
  ['error', 'Error'],
];
const COMPONENTES = [
  ['bordes', 'Mostrar bordes'],
  ['animaciones', 'Animaciones'],
  ['sombras', 'Sombras suaves'],
  ['modoOscuro', 'Modo oscuro'],
];
const MAX_LOGO = 2 * 1024 * 1024;

export default function IdentidadVisual() {
  const { config, setConfig, modoOscuro, notify } = useApp();
  const { data: fuentes } = useFetch(() => generalService.fuentes(), []);
  const [borrador, setBorrador] = useState(config);
  const [guardando, setGuardando] = useState(false);
  const inputLogo = useRef(null);
  const configRef = useRef(config);
  configRef.current = config;

  // Vista previa en vivo: el borrador se aplica al documento mientras se edita.
  useEffect(() => {
    if (borrador) aplicarTema(borrador, borrador.componentes.modoOscuro);
  }, [borrador]);
  // Al salir sin guardar, se restaura la configuración vigente.
  useEffect(() => () => aplicarTema(configRef.current, modoOscuro), [modoOscuro]);

  if (!borrador) return <Cargando />;
  const cambios = JSON.stringify(borrador) !== JSON.stringify(config);
  const set = (grupo, key, value) => setBorrador((b) => ({ ...b, [grupo]: { ...b[grupo], [key]: value } }));

  const subirLogo = (e) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    if (!['image/png', 'image/jpeg'].includes(file.type)) {
      notify('El logo debe ser una imagen PNG o JPG', 'error');
      return;
    }
    if (file.size > MAX_LOGO) {
      notify('El logo supera el máximo de 2 MB', 'error');
      return;
    }
    const reader = new FileReader();
    reader.onload = () => setBorrador((b) => ({ ...b, logo: reader.result }));
    reader.onerror = () => notify('No se pudo leer la imagen', 'error');
    reader.readAsDataURL(file);
  };

  const guardar = async () => {
    setGuardando(true);
    try {
      const guardada = await generalService.guardarConfiguracion(borrador);
      setConfig(guardada);
      setBorrador(guardada);
      notify('Cambios guardados');
    } catch (err) {
      notify(err.message, 'error');
    } finally {
      setGuardando(false);
    }
  };

  return (
    <>
      <PageHeader titulo="Identidad Visual" subtitulo="Personaliza la imagen de tu restaurante" />

      <div className="grid gap-5 xl:grid-cols-[1fr_1.4fr]">
        <div className="flex flex-col gap-5">
          <Panel titulo="Configuración de marca" icon={Palette}>
            <div className="p-5">
              <p className="mb-2 font-display font-medium text-texto">Logo del restaurante</p>
              <div className="flex flex-wrap items-center gap-4">
                <div className="grid h-28 w-full max-w-72 place-items-center rounded-xl border-2 border-dashed border-acento/50 bg-superficie-2">
                  <Logo variante="completo" personalizado={borrador.logo} className="h-24 max-w-[90%] text-texto" titulo="Logo actual" />
                </div>
                <div className="flex flex-col items-center gap-1 text-center">
                  <input ref={inputLogo} type="file" accept="image/png,image/jpeg" className="hidden" onChange={subirLogo} />
                  <Button variante="contorno" icon={Upload} className="rounded-full border px-6" onClick={() => inputLogo.current?.click()}>
                    Subir logo
                  </Button>
                  <p className="text-xs text-suave">
                    Formatos: PNG, JPG
                    <br />
                    (máx. 2 MB)
                  </p>
                  {borrador.logo && (
                    <button type="button" onClick={() => setBorrador((b) => ({ ...b, logo: null }))} className="flex items-center gap-1 text-xs text-error hover:underline">
                      <Trash2 className="size-3" /> Usar el logo de Orígenes SV
                    </button>
                  )}
                </div>
              </div>
              <Field label="Nombre del restaurante" className="mt-4">
                <input className="campo h-12 text-base" value={borrador.nombre} onChange={(e) => setBorrador((b) => ({ ...b, nombre: e.target.value }))} maxLength={40} />
              </Field>
              <Field label="Eslogan" className="mt-3">
                <input className="campo" value={borrador.eslogan} onChange={(e) => setBorrador((b) => ({ ...b, eslogan: e.target.value }))} maxLength={60} />
              </Field>
            </div>
          </Panel>

          <Panel titulo="Paleta de colores" icon={Droplet}>
            <div className="grid grid-cols-3 gap-4 p-5 sm:grid-cols-6">
              {COLORES.map(([key, label]) => (
                <label key={key} className="flex cursor-pointer flex-col items-center gap-1 text-center">
                  <span className="relative size-12 overflow-hidden rounded-full border border-borde shadow-card" style={{ background: borrador.colores[key] }}>
                    <input type="color" value={borrador.colores[key]} onChange={(e) => set('colores', key, e.target.value.toUpperCase())} className="absolute inset-0 cursor-pointer opacity-0" aria-label={`Color ${label}`} />
                  </span>
                  <span className="text-sm text-texto">{label}</span>
                  <span className="text-xs text-suave">{borrador.colores[key]}</span>
                </label>
              ))}
            </div>
          </Panel>

          <Panel titulo="Tipografía" icon={Type}>
            <div className="grid gap-4 p-5 sm:grid-cols-2">
              {[
                ['principal', 'Fuente principal'],
                ['secundaria', 'Fuente secundaria'],
              ].map(([key, label]) => (
                <Field key={key} label={label}>
                  <select className="campo h-11" value={borrador.fuentes[key]} onChange={(e) => set('fuentes', key, e.target.value)} style={{ fontFamily: borrador.fuentes[key] }}>
                    {fuentes?.map((f) => (
                      <option key={f} value={f} style={{ fontFamily: f }}>
                        {f}
                      </option>
                    ))}
                  </select>
                </Field>
              ))}
            </div>
          </Panel>
        </div>

        <div className="flex flex-col gap-5">
          <Panel titulo="Vista previa" icon={Eye}>
            <VistaPrevia config={borrador} />
          </Panel>
          <Panel titulo="Componentes" icon={Settings}>
            <div className="grid gap-x-10 gap-y-4 p-5 sm:grid-cols-2">
              {COMPONENTES.map(([key, label]) => (
                <div key={key} className="flex items-center justify-between gap-4">
                  <span className="font-display font-medium text-texto">{label}</span>
                  <Switch checked={borrador.componentes[key]} onChange={(v) => set('componentes', key, v)} label={label} />
                </div>
              ))}
            </div>
          </Panel>
          <div className="flex flex-wrap justify-end gap-3">
            {cambios && (
              <Button variante="suave" icon={RotateCcw} onClick={() => setBorrador(config)}>
                Descartar
              </Button>
            )}
            <Button icon={Save} className="min-w-64 rounded-full py-3.5 text-base" loading={guardando} disabled={!cambios} onClick={guardar}>
              Guardar cambios
            </Button>
          </div>
        </div>
      </div>
    </>
  );
}

/** Banner de muestra que usa la marca en edición. */
function VistaPrevia({ config }) {
  const { colores, fuentes } = config;
  return (
    <div className="relative min-h-80 overflow-hidden" style={{ background: `linear-gradient(110deg, ${colores.fondo} 0%, ${colores.fondo} 45%, color-mix(in srgb, ${colores.secundario} 35%, ${colores.fondo}) 100%)` }}>
      <svg viewBox="0 0 800 340" className="absolute inset-0 h-full w-full" preserveAspectRatio="xMaxYMax slice" aria-hidden="true">
        <circle cx="610" cy="150" r="120" fill={colores.secundario} opacity="0.85" />
        <path d="M430 340 L560 170 Q600 140 640 170 L800 330 L800 340 Z" fill={colores.acento} opacity="0.55" />
        <path d="M540 196 Q600 150 660 196 L640 190 Q600 170 560 192 Z" fill="#ffffff" opacity="0.7" />
        <g fill={colores.primario} opacity="0.9">
          <path d="M470 340 L486 312 H614 L630 340 Z" />
          <path d="M486 312 L500 290 H600 L614 312 Z" />
          <path d="M500 290 L514 270 H586 L600 290 Z" />
          <path d="M514 270 L526 252 H574 L586 270 Z" />
          <rect x="534" y="232" width="32" height="20" />
        </g>
        <g fill="none" stroke={colores.primario} strokeWidth="3" strokeLinecap="round">
          <path d="M360 90 q10 -10 18 0 q8 -10 18 0" />
          <path d="M410 60 q7 -7 13 0 q6 -7 13 0" />
          <path d="M398 120 q6 -6 11 0 q5 -6 11 0" />
        </g>
        <g transform="translate(730 250)">
          {[0, 72, 144, 216, 288].map((a) => (
            <ellipse key={a} cx="0" cy="-30" rx="20" ry="34" fill={colores.error} transform={`rotate(${a})`} />
          ))}
          <circle r="10" fill={colores.secundario} />
          <path d="M0 0 L-6 -42" stroke={colores.secundario} strokeWidth="3" />
        </g>
        <g fill={colores.exito} opacity="0.8">
          <path d="M650 340 C660 290 700 280 720 300 C700 310 680 320 670 340 Z" />
          <path d="M760 340 C770 300 800 290 800 290 L800 340 Z" />
        </g>
      </svg>
      <div className="relative flex max-w-[55%] flex-col items-center px-6 py-8 text-center sm:px-10">
        <Logo variante="figura" personalizado={config.logo} className="mb-2 max-h-24 w-24 text-primario" titulo="" />
        <p className="font-display text-2xl leading-tight font-bold tracking-wide uppercase" style={{ color: colores.primario, fontFamily: fuentes.principal }}>
          {config.nombre || 'Tu restaurante'}
        </p>
        <DivisorRombos className="my-2 w-40" />
        <p className="text-3xl leading-tight font-bold sm:text-4xl" style={{ color: colores.primario, fontFamily: "'Playfair Display', serif" }}>
          {config.eslogan}
        </p>
        <span className="mt-4 rounded-full px-5 py-2 text-sm font-semibold" style={{ background: colores.primario, color: '#fff', fontFamily: fuentes.secundaria }}>
          Ver menú
        </span>
      </div>
    </div>
  );
}
