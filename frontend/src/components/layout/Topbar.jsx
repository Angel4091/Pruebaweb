import { useEffect, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Store, Search, CalendarDays, Bell, Sun, Moon, BookOpen, Pencil, ChevronDown, Menu, Package, HandCoins } from 'lucide-react';
import { useApp } from '../../context/AppContext.jsx';
import { generalService } from '../../services/index.js';
import { useDebounce } from '../../hooks/useDebounce.js';
import { PiramideLogo, DivisorRombos } from '../decor/Decor.jsx';
import { fechaLarga, turnoDe, iniciales } from '../../utils/format.js';

/** Cierra un menú desplegable al hacer clic fuera. */
function useClickFuera(onFuera) {
  const ref = useRef(null);
  useEffect(() => {
    const fn = (e) => ref.current && !ref.current.contains(e.target) && onFuera();
    document.addEventListener('mousedown', fn);
    return () => document.removeEventListener('mousedown', fn);
  }, [onFuera]);
  return ref;
}

const pill = 'flex h-11 items-center gap-2 rounded-full border border-borde bg-superficie px-4 text-sm font-medium text-texto';

export function Topbar({ onMenu, onGuia, placeholder = 'Buscar en el sistema…' }) {
  const { sucursales, sucursal, setSucursalId, config, modoOscuro, toggleModo, version } = useApp();
  const navigate = useNavigate();
  const [menu, setMenu] = useState(null); // 'sucursal' | 'notif' | 'buscar' | null
  const [q, setQ] = useState('');
  const [resultados, setResultados] = useState([]);
  const [notificaciones, setNotificaciones] = useState([]);
  const [ahora, setAhora] = useState(() => new Date());
  const qDebounced = useDebounce(q);
  const cerrar = () => setMenu(null);
  const refSuc = useClickFuera(() => menu === 'sucursal' && cerrar());
  const refNotif = useClickFuera(() => menu === 'notif' && cerrar());
  const refBuscar = useClickFuera(() => menu === 'buscar' && cerrar());

  useEffect(() => {
    const t = setInterval(() => setAhora(new Date()), 60_000);
    return () => clearInterval(t);
  }, []);

  useEffect(() => {
    if (!sucursal) return;
    generalService.notificaciones(sucursal.id).then(setNotificaciones).catch(() => setNotificaciones([]));
  }, [sucursal, version]);

  useEffect(() => {
    if (qDebounced.trim().length < 2) {
      setResultados([]);
      return;
    }
    let activo = true;
    generalService
      .buscar(qDebounced)
      .then((r) => activo && setResultados(r))
      .catch(() => activo && setResultados([]));
    return () => {
      activo = false;
    };
  }, [qDebounced]);

  const ir = (ruta) => {
    navigate(ruta);
    setQ('');
    cerrar();
  };

  return (
    <header className="no-imprimir sticky top-0 z-20 bg-fondo/95 backdrop-blur">
      <div className="flex items-center gap-3 px-4 pt-4 pb-3 sm:px-6 lg:px-8">
        <button type="button" onClick={onMenu} className="rounded-lg p-2 text-primario hover:bg-superficie-2 lg:hidden" aria-label="Abrir menú">
          <Menu className="size-6" />
        </button>
        <Link to="/identidad" className="group flex items-center gap-3 pr-2" title="Editar identidad visual">
          <PiramideLogo className="hidden w-12 text-secundario sm:block" />
          <span className="hidden h-9 w-px bg-borde sm:block" />
          <span className="font-display text-lg font-bold tracking-wide text-texto uppercase sm:text-xl">{config?.nombre ?? 'Orígenes SV'}</span>
          <Pencil className="size-4 text-suave group-hover:text-primario" />
        </Link>

        <div ref={refSuc} className="relative ml-auto hidden md:block xl:ml-4">
          <button type="button" className={pill} onClick={() => setMenu(menu === 'sucursal' ? null : 'sucursal')} aria-haspopup="listbox" aria-expanded={menu === 'sucursal'}>
            <Store className="size-5 text-primario" />
            {sucursal?.nombre ?? 'Sucursal'}
            <ChevronDown className="size-4" />
          </button>
          {menu === 'sucursal' && (
            <ul className="card absolute top-12 left-0 z-30 w-64 p-1.5" role="listbox">
              {sucursales.map((s) => (
                <li key={s.id}>
                  <button
                    type="button"
                    onClick={() => {
                      setSucursalId(s.id);
                      cerrar();
                    }}
                    className={`w-full rounded-lg px-3 py-2 text-left text-sm hover:bg-superficie-2 ${s.id === sucursal?.id ? 'font-semibold text-primario' : 'text-texto'}`}
                  >
                    {s.nombre}
                    <span className="block text-xs text-suave">{s.direccion}</span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div ref={refBuscar} className="relative hidden flex-1 lg:block lg:max-w-[260px] 2xl:max-w-sm">
          <Search className="pointer-events-none absolute top-1/2 left-4 size-5 -translate-y-1/2 text-texto" />
          <input
            value={q}
            onChange={(e) => {
              setQ(e.target.value);
              setMenu('buscar');
            }}
            onFocus={() => setMenu('buscar')}
            placeholder={placeholder}
            className={`${pill} w-full pl-11 outline-none placeholder:text-suave focus:border-acento`}
            aria-label="Buscar en el sistema"
          />
          {menu === 'buscar' && q.trim().length >= 2 && (
            <ul className="card absolute top-12 right-0 left-0 z-30 max-h-80 overflow-y-auto p-1.5">
              {resultados.length === 0 && <li className="px-3 py-2 text-sm text-suave">Sin resultados para “{q}”</li>}
              {resultados.map((r) => (
                <li key={`${r.tipo}-${r.id}`}>
                  <button type="button" onClick={() => ir(r.ruta)} className="flex w-full items-center justify-between gap-3 rounded-lg px-3 py-2 text-left text-sm hover:bg-superficie-2">
                    <span className="truncate text-texto">{r.nombre}</span>
                    <span className="shrink-0 text-xs text-suave">{r.tipo}</span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className={`${pill} hidden xl:flex`} title="Fecha y turno actual">
          <CalendarDays className="size-5 text-primario" />
          {fechaLarga(ahora)} · {turnoDe(ahora)}
        </div>

        <div ref={refNotif} className="relative ml-auto md:ml-0">
          <button
            type="button"
            className="relative grid size-11 place-items-center rounded-full text-texto hover:bg-superficie-2"
            onClick={() => setMenu(menu === 'notif' ? null : 'notif')}
            aria-label={`Notificaciones (${notificaciones.length})`}
          >
            <Bell className="size-6" />
            {notificaciones.length > 0 && (
              <span className="absolute top-1 right-1 grid size-5 place-items-center rounded-full bg-error text-[0.7rem] font-bold text-white ring-2 ring-fondo">
                {notificaciones.length > 9 ? '9+' : notificaciones.length}
              </span>
            )}
          </button>
          {menu === 'notif' && (
            <div className="card absolute top-12 right-0 z-30 w-[min(340px,90vw)] overflow-hidden">
              <p className="border-b border-borde px-4 py-3 font-display font-semibold text-texto">Notificaciones</p>
              <ul className="max-h-80 overflow-y-auto">
                {notificaciones.length === 0 && <li className="px-4 py-6 text-center text-sm text-suave">Todo en orden por ahora.</li>}
                {notificaciones.map((n) => (
                  <li key={n.id}>
                    <button type="button" onClick={() => ir(n.ruta)} className="flex w-full gap-3 px-4 py-3 text-left hover:bg-superficie-2">
                      {n.tipo === 'stock' ? <Package className="mt-0.5 size-5 shrink-0 text-naranja" /> : <HandCoins className="mt-0.5 size-5 shrink-0 text-acento" />}
                      <span>
                        <span className="block text-sm font-medium text-texto">{n.titulo}</span>
                        <span className="block text-xs text-suave">{n.detalle}</span>
                      </span>
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>

        <button
          type="button"
          onClick={toggleModo}
          className="hidden h-11 items-center gap-1 rounded-full border border-borde bg-superficie p-1 sm:flex"
          aria-label={modoOscuro ? 'Cambiar a modo claro' : 'Cambiar a modo oscuro'}
        >
          <span className={`grid size-9 place-items-center rounded-full ${!modoOscuro ? 'bg-secundario/30 text-[#d18a00]' : 'text-suave'}`}>
            <Sun className="size-5" />
          </span>
          <span className={`grid size-9 place-items-center rounded-full ${modoOscuro ? 'bg-acento/30 text-white' : 'text-texto'}`}>
            <Moon className="size-5" />
          </span>
        </button>

        <button type="button" onClick={onGuia} className="flex h-11 items-center gap-2 rounded-full bg-primario px-4 font-display text-sm font-semibold text-white hover:brightness-110">
          <BookOpen className="size-5" />
          <span className="hidden sm:inline">Guía</span>
        </button>

        <div className="relative grid size-11 shrink-0 place-items-center rounded-full bg-primario font-display font-bold text-white" title="Andrea Morales · Gerente general">
          {iniciales('Andrea Morales')}
          <span className="absolute right-0 bottom-0 size-3 rounded-full bg-exito ring-2 ring-fondo" />
        </div>
      </div>
      <DivisorRombos className="px-4 sm:px-6 lg:px-8" />
    </header>
  );
}
