import { useState } from 'react';
import { Outlet, useLocation, Link } from 'react-router-dom';
import { Sidebar, MODULOS } from './Sidebar.jsx';
import { Topbar } from './Topbar.jsx';
import { BandaGreca, EscenaEncabezado, OrnamentoTitulo } from '../decor/Decor.jsx';
import { Modal, Toasts, ErrorBox, Cargando } from '../ui/index.jsx';
import { useApp } from '../../context/AppContext.jsx';

const PLACEHOLDERS = {
  '/pos': 'Buscar productos…',
  '/inventario': 'Buscar insumos…',
  '/pronostico': 'Buscar en pronóstico…',
};

/** Estructura general: menú lateral, barra superior, contenido y banda inferior. */
export function Layout() {
  const [menu, setMenu] = useState(false);
  const [guia, setGuia] = useState(false);
  const { pathname } = useLocation();
  const { toasts, cerrarToast, config, errorInicial } = useApp();

  return (
    <div className="flex min-h-screen">
      <Sidebar abierto={menu} onClose={() => setMenu(false)} />
      <div className="flex min-w-0 flex-1 flex-col">
        <Topbar onMenu={() => setMenu(true)} onGuia={() => setGuia(true)} placeholder={PLACEHOLDERS[pathname]} />
        <main className="relative flex-1 px-4 pt-2 pb-10 sm:px-6 lg:px-10">
          <EscenaEncabezado className="pointer-events-none absolute top-0 right-4 hidden h-28 w-[300px] md:block lg:right-10 lg:h-36 lg:w-[400px] xl:h-40 xl:w-[440px]" />
          {/* El contenido va sobre la ilustración del encabezado y con un ancho máximo cómodo de leer. */}
          <div className="relative z-[1] mx-auto w-full max-w-[1520px]">
            {errorInicial ? <ErrorBox error={errorInicial} onRetry={() => window.location.reload()} /> : config ? <Outlet /> : <Cargando texto="Preparando el sistema…" />}
          </div>
        </main>
        <BandaGreca />
      </div>

      <Modal abierto={guia} onClose={() => setGuia(false)} titulo="Guía rápida del sistema" ancho="max-w-2xl">
        <p className="mb-4 text-sm text-suave">
          Orígenes SV centraliza la operación de todas las sucursales. Elige la sucursal en la barra superior; todos los módulos muestran los datos de esa sucursal.
        </p>
        <ul className="grid gap-2 sm:grid-cols-2">
          {MODULOS.map(({ ruta, nombre, icon: Icon, descripcion }) => (
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
        <h4 className="mt-5 mb-2 font-display font-semibold text-texto">Flujo de un turno</h4>
        <ol className="list-decimal space-y-1 pl-5 text-sm text-texto/85">
          <li>Abre la caja con su fondo inicial en el módulo Caja.</li>
          <li>Toma los pedidos en el Punto de venta; cada venta descuenta los insumos de su receta.</li>
          <li>Revisa las alertas de stock y registra las compras de insumos.</li>
          <li>Al terminar, cuenta el efectivo y cierra el turno para cuadrar la caja.</li>
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
        <OrnamentoTitulo className="mt-2 mb-1" />
        {subtitulo && <p className="mt-1 text-lg text-texto/80">{subtitulo}</p>}
      </div>
      {children && <div className="relative z-10 flex flex-wrap items-center gap-3">{children}</div>}
    </div>
  );
}
