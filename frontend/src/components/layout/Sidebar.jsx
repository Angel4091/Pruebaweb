import { NavLink } from 'react-router-dom';
import { X } from 'lucide-react';
import { Logo } from '../decor/Decor.jsx';
import { useAuth } from '../../context/AuthContext.jsx';
import { modulosDe } from '../../routes/modulos.js';

/** Menú lateral: muestra solo los módulos que el rol del usuario puede usar. */
export function Sidebar({ abierto, onClose }) {
  const { rol } = useAuth();
  return (
    <>
      {abierto && <div className="fixed inset-0 z-30 bg-black/40 lg:hidden" onClick={onClose} aria-hidden="true" />}
      <aside
        className={`fixed inset-y-0 left-0 z-40 flex w-[124px] flex-col bg-sidebar text-white transition-transform lg:sticky lg:top-0 lg:h-screen lg:translate-x-0 ${abierto ? 'translate-x-0' : '-translate-x-full'}`}
      >
        <div className="flex h-[96px] shrink-0 items-center justify-center">
          <Logo variante="figura" className="max-h-[72px] w-[78px] text-secundario" />
          <button type="button" onClick={onClose} className="absolute top-3 right-2 rounded p-1 hover:bg-white/10 lg:hidden" aria-label="Cerrar menú">
            <X className="size-5" />
          </button>
        </div>
        <nav className="flex flex-1 flex-col gap-1 overflow-y-auto px-2 pb-4 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden" aria-label="Módulos">
          {modulosDe(rol).map(({ ruta, nombre, icon: Icon }) => (
            <NavLink
              key={ruta}
              to={ruta}
              end={ruta === '/'}
              onClick={onClose}
              className={({ isActive }) =>
                `flex flex-col items-center gap-1 rounded-xl px-2 py-2.5 text-center text-[0.8rem] leading-tight font-medium transition ${
                  isActive ? 'bg-secundario text-white shadow-[0_6px_14px_-6px_rgba(0,0,0,0.5)] [text-shadow:0_1px_1px_rgba(0,0,0,0.25)]' : 'text-white/90 hover:bg-white/10'
                }`
              }
            >
              <Icon className="size-6" strokeWidth={1.9} />
              <span>{nombre}</span>
            </NavLink>
          ))}
        </nav>
      </aside>
    </>
  );
}
