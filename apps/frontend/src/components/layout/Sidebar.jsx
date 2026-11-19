import { NavLink } from 'react-router-dom';
import { House, ShoppingCart, Package, Truck, Calculator, Users, TrendingUp, Palette, ShieldCheck, X } from 'lucide-react';
import { Logo, BordeEscalonado } from '../decor/Decor.jsx';
import { useAuth } from '../../context/AuthContext.jsx';

/**
 * Módulos del sistema; se reutiliza en la guía. Cada rol ve solo los suyos (utils/permisos.js).
 * `etiqueta` es el texto del menú cuando el nombre no cabe en una línea.
 */
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
  { ruta: '/administracion', nombre: 'Administración', etiqueta: 'Adminis\u00adtración', icon: ShieldCheck, descripcion: 'Usuarios, roles, sucursales y datos de demostración.' },
];

/**
 * Menú lateral: logo arriba y los módulos debajo. En pantallas de poca altura
 * se compacta (logo, íconos y espacios menores) para que todo quepa sin scroll.
 */
export function Sidebar({ abierto, onClose }) {
  const { puedeVer } = useAuth();
  return (
    <>
      {abierto && <div className="fixed inset-0 z-30 bg-black/40 lg:hidden" onClick={onClose} aria-hidden="true" />}
      <aside
        className={`fixed inset-y-0 left-0 z-40 flex w-[124px] flex-col bg-sidebar text-white transition-transform lg:sticky lg:top-0 lg:h-screen lg:translate-x-0 ${abierto ? 'translate-x-0' : '-translate-x-full'}`}
      >
        <BordeEscalonado className="pointer-events-none absolute inset-y-0 right-0 opacity-70" />
        <div className="flex h-[96px] shrink-0 items-center justify-center [@media(max-height:780px)]:h-16">
          <Logo variante="figura" className="max-h-[72px] w-[78px] text-secundario [@media(max-height:780px)]:max-h-12 [@media(max-height:780px)]:w-[52px]" />
          <button type="button" onClick={onClose} className="absolute top-3 right-2 rounded p-1 hover:bg-white/10 lg:hidden" aria-label="Cerrar menú">
            <X className="size-5" />
          </button>
        </div>
        <nav className="flex flex-1 flex-col gap-1 overflow-y-auto px-2 pb-4 [@media(max-height:780px)]:gap-0.5 [@media(max-height:780px)]:pb-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden" aria-label="Módulos">
          {MODULOS.filter((m) => puedeVer(m.ruta)).map(({ ruta, nombre, etiqueta, icon: Icon }) => (
            <NavLink
              key={ruta}
              to={ruta}
              end={ruta === '/'}
              onClick={onClose}
              className={({ isActive }) =>
                `flex flex-col items-center gap-1 rounded-xl px-2 py-2.5 text-center text-[0.8rem] leading-tight font-medium transition [@media(max-height:780px)]:gap-0.5 [@media(max-height:780px)]:py-1.5 [@media(max-height:780px)]:text-[0.72rem] ${
                  isActive ? 'bg-secundario text-white shadow-[0_6px_14px_-6px_rgba(0,0,0,0.5)] [text-shadow:0_1px_1px_rgba(0,0,0,0.25)]' : 'text-white/90 hover:bg-white/10'
                }`
              }
            >
              <Icon className="size-6 [@media(max-height:780px)]:size-5" strokeWidth={1.9} />
              <span>{etiqueta ?? nombre}</span>
            </NavLink>
          ))}
        </nav>
      </aside>
    </>
  );
}
