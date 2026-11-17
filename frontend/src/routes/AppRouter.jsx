import { lazy, Suspense } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { Layout } from '../components/layout/Layout.jsx';
import { Cargando } from '../components/ui/index.jsx';
import { useAuth } from '../context/AuthContext.jsx';
import { INICIO_POR_ROL, puedeVer } from './modulos.js';

// Cada módulo se carga bajo demanda para que la primera pantalla abra rápido.
const Login = lazy(() => import('../pages/Login.jsx'));
const Registro = lazy(() => import('../pages/Registro.jsx'));
const Dashboard = lazy(() => import('../pages/Dashboard.jsx'));
const PuntoVenta = lazy(() => import('../pages/PuntoVenta.jsx'));
const Cocina = lazy(() => import('../pages/Cocina.jsx'));
const Inventario = lazy(() => import('../pages/Inventario.jsx'));
const Compras = lazy(() => import('../pages/Compras.jsx'));
const Caja = lazy(() => import('../pages/Caja.jsx'));
const Personal = lazy(() => import('../pages/Personal.jsx'));
const Pronostico = lazy(() => import('../pages/Pronostico.jsx'));
const IdentidadVisual = lazy(() => import('../pages/IdentidadVisual.jsx'));
const Menu = lazy(() => import('../pages/Menu.jsx'));
const MisPedidos = lazy(() => import('../pages/MisPedidos.jsx'));
const NoEncontrado = lazy(() => import('../pages/NoEncontrado.jsx'));

/** Exige sesión iniciada; si no hay, envía al inicio de sesión. */
function RequiereSesion() {
  const { usuario, verificando } = useAuth();
  const location = useLocation();
  if (verificando) return <Cargando texto="Verificando tu sesión…" />;
  if (!usuario) return <Navigate to="/login" replace state={{ desde: location.pathname }} />;
  return <Layout />;
}

/** Muestra la pantalla solo si el rol tiene acceso; si no, lo lleva a su inicio. */
function Protegida({ ruta, children }) {
  const { rol } = useAuth();
  if (!puedeVer(rol, ruta)) return <Navigate to={INICIO_POR_ROL[rol] ?? '/login'} replace />;
  return children;
}

/** Login y registro: si ya hay sesión, se va directo al inicio del rol. */
function SoloInvitados({ children }) {
  const { usuario, rol } = useAuth();
  if (usuario) return <Navigate to={INICIO_POR_ROL[rol] ?? '/'} replace />;
  return children;
}

const PAGINAS = [
  ['/', Dashboard],
  ['/pos', PuntoVenta],
  ['/cocina', Cocina],
  ['/inventario', Inventario],
  ['/compras', Compras],
  ['/caja', Caja],
  ['/personal', Personal],
  ['/pronostico', Pronostico],
  ['/identidad', IdentidadVisual],
  ['/menu', Menu],
  ['/mis-pedidos', MisPedidos],
];

export function AppRouter() {
  return (
    <BrowserRouter>
      <Suspense fallback={<Cargando />}>
        <Routes>
          <Route path="login" element={<SoloInvitados><Login /></SoloInvitados>} />
          <Route path="registro" element={<SoloInvitados><Registro /></SoloInvitados>} />
          <Route element={<RequiereSesion />}>
            {PAGINAS.map(([ruta, Pagina]) => (
              <Route
                key={ruta}
                index={ruta === '/'}
                path={ruta === '/' ? undefined : ruta.slice(1)}
                element={
                  <Protegida ruta={ruta}>
                    <Pagina />
                  </Protegida>
                }
              />
            ))}
            <Route path="*" element={<NoEncontrado />} />
          </Route>
        </Routes>
      </Suspense>
    </BrowserRouter>
  );
}
