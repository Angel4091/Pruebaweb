import { lazy, Suspense } from 'react';
import { BrowserRouter, Routes, Route, Navigate, Outlet, useLocation } from 'react-router-dom';
import { Layout } from '../components/layout/Layout.jsx';
import { Cargando } from '../components/ui/index.jsx';
import { useAuth } from '../context/AuthContext.jsx';

// Cada módulo se carga bajo demanda para que la primera pantalla abra rápido.
const Login = lazy(() => import('../pages/Login.jsx'));
const Dashboard = lazy(() => import('../pages/Dashboard.jsx'));
const PuntoVenta = lazy(() => import('../pages/PuntoVenta.jsx'));
const Inventario = lazy(() => import('../pages/Inventario.jsx'));
const Compras = lazy(() => import('../pages/Compras.jsx'));
const Caja = lazy(() => import('../pages/Caja.jsx'));
const Personal = lazy(() => import('../pages/Personal.jsx'));
const Pronostico = lazy(() => import('../pages/Pronostico.jsx'));
const IdentidadVisual = lazy(() => import('../pages/IdentidadVisual.jsx'));
const SinAcceso = lazy(() => import('../pages/SinAcceso.jsx'));
const NoEncontrado = lazy(() => import('../pages/NoEncontrado.jsx'));

/** Módulos protegidos: la ruta decide qué roles los ven (utils/permisos.js). */
const PAGINAS = [
  ['pos', PuntoVenta],
  ['inventario', Inventario],
  ['compras', Compras],
  ['caja', Caja],
  ['personal', Personal],
  ['pronostico', Pronostico],
  ['identidad', IdentidadVisual],
];

const PantallaCompleta = ({ texto }) => (
  <div className="grid min-h-screen place-items-center bg-fondo">
    <Cargando texto={texto} />
  </div>
);

/** Sin sesión, lleva al login y recuerda a qué pantalla se quería entrar. */
function RequiereSesion() {
  const { usuario, verificando } = useAuth();
  const { pathname, search } = useLocation();
  if (verificando) return <PantallaCompleta texto="Verificando la sesión…" />;
  if (!usuario) return <Navigate to="/login" replace state={{ desde: pathname + search }} />;
  return <Outlet />;
}

/** Si el rol no incluye el módulo, muestra un aviso en lugar de la pantalla. */
function SoloRol({ ruta, children }) {
  const { puedeVer } = useAuth();
  return puedeVer(ruta) ? children : <SinAcceso />;
}

export function AppRouter() {
  return (
    <BrowserRouter>
      <Suspense fallback={<PantallaCompleta />}>
        <Routes>
          <Route path="login" element={<Login />} />
          <Route element={<RequiereSesion />}>
            <Route element={<Layout />}>
              <Route index element={<Dashboard />} />
              {PAGINAS.map(([ruta, Pagina]) => (
                <Route
                  key={ruta}
                  path={ruta}
                  element={
                    <SoloRol ruta={`/${ruta}`}>
                      <Pagina />
                    </SoloRol>
                  }
                />
              ))}
              <Route path="*" element={<NoEncontrado />} />
            </Route>
          </Route>
        </Routes>
      </Suspense>
    </BrowserRouter>
  );
}
