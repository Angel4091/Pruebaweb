import { NavLink } from 'react-router-dom';
import { House, ShoppingCart, Package, Truck, Calculator, Users, TrendingUp, Palette, X } from 'lucide-react';
import { PiramideLogo, Greca } from '../decor/Decor.jsx';
import { useApp } from '../../context/AppContext.jsx';

/** Módulos del sistema; se reutiliza en la guía y en los accesos rápidos. */
// eslint-disable-next-line react-refresh/only-export-components
export const MODULOS = [
  { ruta: '/', nombre: 'Inicio', icon: House, descripcion: 'Resumen de ventas, cajas y alertas del día.' },
  { ruta: '/pos', nombre: 'Punto de venta', icon: ShoppingCart, descripcion: 'Toma de pedidos y facturación FCF / CCF con IVA.' },
  { ruta: '/inventario', nombre: 'Inventario', icon: Package, descripcion: 'Insumos, recetas, entradas y alertas de stock mínimo.' },
  { ruta: '/compras', nombre: 'Compras', icon: Truck, descripcion: 'Facturas de proveedores, gastos y cuentas por pagar.' },
  { ruta: '/caja', nombre: 'Caja', icon: Calculator, descripcion: 'Apertura, cierre y cuadre de caja por turno.' },
  { ruta: '/personal', nombre: 'Personal', icon: Users, descripcion: 'Empleados y planilla quincenal con ISSS, AFP y renta.' },
  { ruta: '/pronostico', nombre: 'Pronóstico', icon: TrendingUp, descripcion: 'Proyección de consumo y pedidos sugeridos.' },
  { ruta: '/identidad', nombre: 'Identidad Visual', icon: Palette, descripcion: 'Logo, nombre, colores y tipografía del restaurante.' },
];

export function Sidebar({ abierto, onClose }) {
  const { config } = useApp();
  return (
    <>
      {abierto && <div className="fixed inset-0 z-30 bg-black/40 lg:hidden" onClick={onClose} aria-hidden="true" />}
      <aside
        className={`fixed inset-y-0 left-0 z-40 flex w-[132px] flex-col bg-sidebar text-white transition-transform lg:sticky lg:top-0 lg:h-screen lg:translate-x-0 ${abierto ? 'translate-x-0' : '-translate-x-full'}`}
      >
        <div className="flex h-[92px] items-center justify-center">
          {config?.logo ? (
            <img src={config.logo} alt={config.nombre} className="max-h-16 max-w-[96px] rounded-lg object-contain" />
          ) : (
            <PiramideLogo className="w-[78px] text-secundario" />
          )}
          <button type="button" onClick={onClose} className="absolute top-3 right-2 rounded p-1 hover:bg-white/10 lg:hidden" aria-label="Cerrar menú">
            <X className="size-5" />
          </button>
        </div>
        <nav className="flex flex-1 flex-col gap-1.5 overflow-y-auto px-2 pb-4" aria-label="Módulos">
          {MODULOS.map(({ ruta, nombre, icon: Icon }) => (
            <NavLink
              key={ruta}
              to={ruta}
              end={ruta === '/'}
              onClick={onClose}
              className={({ isActive }) =>
                `flex flex-col items-center gap-1 rounded-xl px-2 py-3 text-center text-[0.82rem] leading-tight font-medium transition ${
                  isActive ? 'bg-secundario text-white shadow-[0_6px_14px_-6px_rgba(0,0,0,0.5)] [text-shadow:0_1px_1px_rgba(0,0,0,0.25)]' : 'text-white/90 hover:bg-white/10'
                }`
              }
            >
              <Icon className="size-7" strokeWidth={1.9} />
              <span>{nombre}</span>
            </NavLink>
          ))}
        </nav>
        <div className="h-28 shrink-0 text-white/25">
          <Greca id="sidebar-greca" />
        </div>
      </aside>
    </>
  );
}
