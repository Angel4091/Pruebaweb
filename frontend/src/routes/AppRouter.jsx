import { lazy, Suspense } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { Layout } from '../components/layout/Layout.jsx';
import { Cargando } from '../components/ui/index.jsx';

// Cada módulo se carga bajo demanda para que la primera pantalla abra rápido.
const Dashboard = lazy(() => import('../pages/Dashboard.jsx'));
const PuntoVenta = lazy(() => import('../pages/PuntoVenta.jsx'));
const Inventario = lazy(() => import('../pages/Inventario.jsx'));
const Compras = lazy(() => import('../pages/Compras.jsx'));
const Caja = lazy(() => import('../pages/Caja.jsx'));
const Personal = lazy(() => import('../pages/Personal.jsx'));
const Pronostico = lazy(() => import('../pages/Pronostico.jsx'));
const IdentidadVisual = lazy(() => import('../pages/IdentidadVisual.jsx'));
const NoEncontrado = lazy(() => import('../pages/NoEncontrado.jsx'));

export function AppRouter() {
  return (
    <BrowserRouter>
      <Suspense fallback={<Cargando />}>
        <Routes>
          <Route element={<Layout />}>
            <Route index element={<Dashboard />} />
            <Route path="pos" element={<PuntoVenta />} />
            <Route path="inventario" element={<Inventario />} />
            <Route path="compras" element={<Compras />} />
            <Route path="caja" element={<Caja />} />
            <Route path="personal" element={<Personal />} />
            <Route path="pronostico" element={<Pronostico />} />
            <Route path="identidad" element={<IdentidadVisual />} />
            <Route path="*" element={<NoEncontrado />} />
          </Route>
        </Routes>
      </Suspense>
    </BrowserRouter>
  );
}
