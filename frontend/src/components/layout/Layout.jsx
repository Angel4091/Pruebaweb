import { useState } from 'react';
import { Outlet, useLocation, Link } from 'react-router-dom';
import { Sidebar } from './Sidebar.jsx';
import { Topbar } from './Topbar.jsx';
import { BandaGreca, EscenaEncabezado } from '../decor/Decor.jsx';
import { Modal, Toasts, ErrorBox, Cargando } from '../ui/index.jsx';
import { useApp } from '../../context/AppContext.jsx';
import { useAuth } from '../../context/AuthContext.jsx';
import { modulosDe, ETIQUETA_ROL } from '../../routes/modulos.js';

const PLACEHOLDERS = {
  '/pos': 'Buscar productos…',
  '/inventario': 'Buscar insumos…',
  '/pronostico': 'Buscar en pronóstico…',
};

/** Pasos del día a día según el rol, para la guía rápida. */
const FLUJO_POR_ROL = {
  administrador: [
    'Revisa en Inicio las ventas, las cajas abiertas y las alertas de inventario.',
    'Registra las compras de insumos y paga a proveedores en Compras.',
    'Genera la planilla quincenal en Personal.',
    'Usa Pronóstico para anticipar faltantes y generar órdenes de compra.',
  ],
  cajero: [
    'Abre la caja con su fondo inicial en el módulo Caja.',
    'Toma los pedidos en el Punto de venta y cobra los pedidos en línea de los clientes.',
    'Entrega los pedidos que la cocina marca como listos.',
    'Al terminar, cuenta el efectivo y cierra el turno para cuadrar la caja.',
  ],
  cocinero: [
    'En Cocina, toma las comandas recibidas y márcalas en preparación.',
    'Cuando un pedido esté listo, márcalo para que caja lo entregue.',
    'Revisa las alertas de inventario y registra las entradas de insumos.',
  ],
  cliente: [
    'Elige tus platillos en el Menú y agrégalos a tu pedido.',
    'Escoge para llevar o a domicilio y confirma el pedido.',
    'Sigue su estado en Mis pedidos: recibido, en preparación, listo y entregado.',
  ],
};

/** Estructura general: menú lateral, barra superior, contenido y banda inferior. */
export function Layout() {
  const [menu, setMenu] = useState(false);
  const [guia, setGuia] = useState(false);
  const { pathname } = useLocation();
  const { toasts, cerrarToast, config, errorInicial } = useApp();
  const { rol } = useAuth();

  return (
    <div className="flex min-h-screen">
      <Sidebar abierto={menu} onClose={() => setMenu(false)} />
      <div className="flex min-w-0 flex-1 flex-col">
        <Topbar onMenu={() => setMenu(true)} onGuia={() => setGuia(true)} placeholder={PLACEHOLDERS[pathname]} />
        <main className="relative flex-1 px-4 pt-2 pb-10 sm:px-6 lg:px-10">
          <EscenaEncabezado className="pointer-events-none absolute top-0 right-4 hidden h-40 w-[440px] xl:block lg:right-10" />
          {/* El contenido va sobre la ilustración del encabezado y con un ancho máximo cómodo de leer. */}
          <div className="relative z-[1] mx-auto w-full max-w-[1520px]">
            {errorInicial ? <ErrorBox error={errorInicial} onRetry={() => window.location.reload()} /> : config ? <Outlet /> : <Cargando texto="Preparando el sistema…" />}
          </div>
        </main>
        <BandaGreca />
      </div>

      <Modal abierto={guia} onClose={() => setGuia(false)} titulo={`Guía rápida · ${ETIQUETA_ROL[rol] ?? ''}`} ancho="max-w-2xl">
        <ul className="grid gap-2 sm:grid-cols-2">
          {modulosDe(rol).map(({ ruta, nombre, icon: Icon, descripcion }) => (
            <li key={ruta}>
              <Link to={ruta} onClick={() => setGuia(false)} className="flex gap-3 rounded-xl border border-borde p-3 hover:bg-superficie-2">
                <Icon className="mt-0.5 size-5 shrink-0 text-primario" />
                <span>
                  <span className="block font-display font-semibold text-texto">{nombre}</span>
                  <span className="block text-sm text-suave">{descripcion}</span>
                </span>
              </Link>
            </li>
          ))}
        </ul>
        <h4 className="mt-5 mb-2 font-display font-semibold text-texto">Tu día a día</h4>
        <ol className="list-decimal space-y-1 pl-5 text-sm text-texto/85">
          {(FLUJO_POR_ROL[rol] ?? []).map((paso) => (
            <li key={paso}>{paso}</li>
          ))}
        </ol>
      </Modal>
      <Toasts toasts={toasts} onClose={cerrarToast} />
    </div>
  );
}

/** Encabezado de página: título grande y subtítulo, con acciones opcionales. */
export function PageHeader({ titulo, subtitulo, children }) {
  return (
    <div className="relative mb-7 flex flex-wrap items-end justify-between gap-4 pt-3">
      <div>
        <h1 className="font-display text-[2.1rem] leading-tight font-bold tracking-tight text-texto sm:text-[2.5rem]">{titulo}</h1>
        {subtitulo && <p className="mt-1 text-lg text-texto/80">{subtitulo}</p>}
      </div>
      {children && <div className="relative z-10 flex flex-wrap items-center gap-3">{children}</div>}
    </div>
  );
}
