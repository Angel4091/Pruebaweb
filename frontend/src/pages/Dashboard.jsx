import { Link } from 'react-router-dom';
import { ChartColumn, ShoppingBag, Star, Calculator, Utensils, MapPin, ShoppingCart, Package, Truck, Settings, CircleAlert, ArrowRight } from 'lucide-react';
import { useApp } from '../context/AppContext.jsx';
import { useFetch } from '../hooks/useFetch.js';
import { generalService } from '../services/index.js';
import { PageHeader } from '../components/layout/Layout.jsx';
import { StatCard, Variacion, Badge, Cargando, ErrorBox, Vacio } from '../components/ui/index.jsx';
import { LineChart, Barra } from '../components/charts/Charts.jsx';
import { FoodArt } from '../components/decor/FoodArt.jsx';
import { money, saludo } from '../utils/format.js';

const horaCorta = (h) => (h === 12 ? '12pm' : h > 12 ? `${h - 12}pm` : `${h}am`);

const ACCESOS = [
  { ruta: '/pos', nombre: 'Punto de venta', icon: ShoppingCart },
  { ruta: '/inventario', nombre: 'Inventario', icon: Package },
  { ruta: '/compras', nombre: 'Compras', icon: Truck },
  { ruta: '/identidad', nombre: 'Configuración', icon: Settings },
];

export default function Dashboard() {
  const { sucursalId, version } = useApp();
  const { data, loading, error, reload } = useFetch(() => generalService.dashboard(sucursalId), [sucursalId, version]);

  if (loading && !data) return <Cargando />;
  if (error) return <ErrorBox error={error} onRetry={reload} />;
  const { kpis, ventasPorHora, masVendidos, ventasPorSucursal, cajas, alertas } = data;
  const colorBarra = ['var(--c-primario)', 'var(--c-secundario)'];

  return (
    <>
      <PageHeader titulo={saludo()} subtitulo="Resumen de operación" />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard icon={ChartColumn} tono="azul" titulo="Ventas del día" valor={money(kpis.ventas.valor)} detalle={<Variacion valor={kpis.ventas.variacion} />} />
        <StatCard icon={ShoppingBag} tono="dorado" titulo="Órdenes" valor={kpis.ordenes.valor} detalle={<Variacion valor={kpis.ordenes.variacion} />} />
        <StatCard icon={Star} tono="naranja" titulo="Ticket promedio" valor={money(kpis.ticketPromedio.valor)} detalle={<Variacion valor={kpis.ticketPromedio.variacion} />} />
        <StatCard icon={Calculator} tono="azul" titulo="Cajas abiertas" valor={kpis.cajasAbiertas.valor} detalle={`de ${kpis.cajasAbiertas.total} disponibles`} />
      </div>

      <div className="mt-5 grid gap-5 xl:grid-cols-[1.45fr_1fr_1fr]">
        <section className="card anim-entrada p-5">
          <div className="mb-2 flex items-center justify-between">
            <h2 className="flex items-center gap-2 font-display text-lg font-semibold text-texto">
              <ChartColumn className="size-5 text-primario" /> Ventas por hora
            </h2>
            <span className="rounded-lg border border-borde px-3 py-1 text-sm text-texto">Hoy</span>
          </div>
          <LineChart
            etiquetas={ventasPorHora.filter((_, i) => i % 2 === 0).map((v) => horaCorta(v.hora))}
            series={[{ nombre: 'Ventas', color: 'var(--c-primario)', area: true, valores: ventasPorHora.filter((_, i) => i % 2 === 0).map((v, i) => round(v.total + (ventasPorHora[i * 2 + 1]?.total ?? 0))) }]}
            formato={money}
          />
          <p className="mt-1 text-xs text-suave">Cada punto suma las ventas de dos horas.</p>
        </section>

        <div className="flex flex-col gap-5">
          <section className="card anim-entrada p-5">
            <h2 className="mb-2 flex items-center gap-2 font-display text-lg font-semibold text-texto">
              <Calculator className="size-5 text-primario" /> Estado de cajas
            </h2>
            <ul className="divide-y divide-borde">
              {cajas.map((c) => (
                <li key={c.id} className="flex items-center justify-between py-3">
                  <span className="text-texto">{c.nombre}</span>
                  <Badge color={c.estado === 'abierta' ? 'verde' : 'gris'} className="px-4 py-1.5 text-sm">
                    {c.estado === 'abierta' ? 'Abierta' : 'Cerrada'}
                  </Badge>
                </li>
              ))}
            </ul>
          </section>
          <Link
            to="/inventario"
            className="card anim-entrada flex items-center gap-4 border-l-4! border-l-naranja! bg-[color-mix(in_srgb,var(--c-naranja)_8%,var(--c-superficie))]! p-5 hover:brightness-[0.98]"
          >
            <CircleAlert className="size-9 shrink-0 fill-naranja text-white" />
            <div className="flex-1">
              <p className="font-display text-lg font-semibold text-texto">
                {alertas.length} {alertas.length === 1 ? 'insumo por agotarse' : 'insumos por agotarse'}
              </p>
              <p className="flex items-center justify-end gap-1 text-sm text-acento">
                Ver detalles <ArrowRight className="size-4" />
              </p>
            </div>
          </Link>
        </div>

        <section className="card anim-entrada p-5">
          <h2 className="mb-2 flex items-center gap-2 font-display text-lg font-semibold text-texto">
            <Utensils className="size-5 text-primario" /> Productos más vendidos
          </h2>
          {masVendidos.length === 0 ? (
            <Vacio titulo="Aún no hay ventas hoy">Las ventas del POS aparecerán aquí.</Vacio>
          ) : (
            <ul className="divide-y divide-borde">
              {masVendidos.map((p) => (
                <li key={p.id} className="flex items-center gap-4 py-3">
                  <FoodArt arte={p.arte} className="size-14 shrink-0" />
                  <span className="flex-1 text-texto">{p.nombre}</span>
                  <span className="font-display font-semibold text-texto">{p.cantidad} und.</span>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>

      <div className="mt-5 grid gap-5 xl:grid-cols-[1fr_1.4fr]">
        <section className="card anim-entrada p-5">
          <h2 className="mb-4 flex items-center gap-2 font-display text-lg font-semibold text-texto">
            <MapPin className="size-5 text-primario" /> Ventas por sucursal
          </h2>
          <ul className="space-y-4">
            {ventasPorSucursal.map((s, i) => (
              <li key={s.id} className="grid grid-cols-[minmax(0,10rem)_1fr_auto] items-center gap-4">
                <span className="truncate text-texto">{s.nombre}</span>
                <Barra porcentaje={s.porcentaje} color={colorBarra[i % 2]} />
                <span className="w-24 text-right font-display font-semibold text-texto">
                  {s.porcentaje}% <span className="block text-xs font-normal text-suave">{money(s.total)}</span>
                </span>
              </li>
            ))}
          </ul>
        </section>

        <section className="anim-entrada flex flex-col justify-center px-2 py-4">
          <div className="mb-5 flex items-center gap-3">
            <span className="h-px flex-1 bg-secundario/70" />
            <span className="text-secundario">◇</span>
            <h2 className="font-display font-semibold text-texto">Accesos rápidos</h2>
            <span className="text-secundario">◇</span>
            <span className="h-px flex-1 bg-secundario/70" />
          </div>
          <div className="relative grid grid-cols-2 gap-6 sm:grid-cols-4">
            <span className="absolute top-8 right-[12%] left-[12%] hidden h-px bg-borde sm:block" aria-hidden="true" />
            {ACCESOS.map(({ ruta, nombre, icon: Icon }) => (
              <Link key={ruta} to={ruta} className="group relative flex flex-col items-center gap-3 text-center">
                <span className="grid size-16 place-items-center rounded-full bg-primario text-white ring-4 ring-fondo transition group-hover:scale-105 group-hover:bg-acento">
                  <Icon className="size-7" />
                </span>
                <span className="text-texto">{nombre}</span>
              </Link>
            ))}
          </div>
        </section>
      </div>
    </>
  );
}

const round = (n) => Math.round(n * 100) / 100;
