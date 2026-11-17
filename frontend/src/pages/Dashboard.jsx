import { Link } from 'react-router-dom';
import { ChartColumn, ShoppingBag, Star, Calculator, Utensils, MapPin, CircleAlert, ArrowRight, Package } from 'lucide-react';
import { useApp } from '../context/AppContext.jsx';
import { useFetch } from '../hooks/useFetch.js';
import { generalService } from '../services/index.js';
import { PageHeader } from '../components/layout/Layout.jsx';
import { StatCard, Variacion, Badge, Cargando, ErrorBox, Vacio } from '../components/ui/index.jsx';
import { LineChart, Barra } from '../components/charts/Charts.jsx';
import { FotoProducto } from '../components/decor/FoodArt.jsx';
import { EstelaMaya } from '../components/decor/EstelaMaya.jsx';
import { money, saludo, qty } from '../utils/format.js';

const horaCorta = (h) => (h === 12 ? '12pm' : h > 12 ? `${h - 12}pm` : `${h}am`);

/** Título de tarjeta del tablero (ícono + texto, sin barra azul para que respire). */
const Titulo = ({ icon: Icon, children, extra }) => (
  <div className="mb-4 flex items-center justify-between gap-3">
    <h2 className="flex items-center gap-2 font-display text-lg font-semibold text-texto">
      <Icon className="size-5 text-primario" /> {children}
    </h2>
    {extra}
  </div>
);

export default function Dashboard() {
  const { sucursalId, version } = useApp();
  const { data, loading, error, reload } = useFetch(() => generalService.dashboard(sucursalId), [sucursalId, version]);

  if (loading && !data) return <Cargando />;
  if (error) return <ErrorBox error={error} onRetry={reload} />;
  const { kpis, ventasPorHora, masVendidos, ventasPorSucursal, cajas, alertas } = data;
  const colorBarra = ['var(--c-tinta)', 'var(--c-secundario)'];
  const puntos = ventasPorHora.filter((_, i) => i % 2 === 0);

  return (
    <>
      <PageHeader titulo={saludo()} subtitulo="Resumen de operación de hoy">
        <EstelaMaya className="xl:mr-[440px]" />
      </PageHeader>

      <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard icon={ChartColumn} tono="azul" titulo="Ventas del día" valor={money(kpis.ventas.valor)} detalle={<Variacion valor={kpis.ventas.variacion} />} />
        <StatCard icon={ShoppingBag} tono="dorado" titulo="Órdenes" valor={kpis.ordenes.valor} detalle={<Variacion valor={kpis.ordenes.variacion} />} />
        <StatCard icon={Star} tono="naranja" titulo="Ticket promedio" valor={money(kpis.ticketPromedio.valor)} detalle={<Variacion valor={kpis.ticketPromedio.variacion} />} />
        <StatCard icon={Calculator} tono="azul" titulo="Cajas abiertas" valor={kpis.cajasAbiertas.valor} detalle={`de ${kpis.cajasAbiertas.total} disponibles`} />
      </div>

      <div className="mt-6 grid gap-6 xl:grid-cols-[1.7fr_1fr]">
        <section className="card anim-entrada p-6">
          <Titulo icon={ChartColumn} extra={<span className="rounded-lg border border-borde px-3 py-1 text-sm text-texto">Hoy</span>}>
            Ventas por hora
          </Titulo>
          <LineChart
            etiquetas={puntos.map((v) => horaCorta(v.hora))}
            series={[
              {
                nombre: 'Ventas',
                color: 'var(--c-tinta)',
                area: true,
                valores: puntos.map((v, i) => (v.total === null ? null : round(v.total + (ventasPorHora[i * 2 + 1]?.total ?? 0)))),
              },
            ]}
            formato={money}
          />
          <p className="mt-1 text-xs text-suave">Cada punto suma las ventas de dos horas.</p>
        </section>

        <section className="card anim-entrada p-6">
          <Titulo icon={Utensils}>Productos más vendidos</Titulo>
          {masVendidos.length === 0 ? (
            <Vacio titulo="Aún no hay ventas hoy">Las ventas del POS aparecerán aquí.</Vacio>
          ) : (
            <ol className="space-y-4">
              {masVendidos.map((p, i) => (
                <li key={p.id} className="flex items-center gap-4">
                  <span className="w-4 font-display font-bold text-suave">{i + 1}</span>
                  <FotoProducto producto={p} className="size-14 shrink-0 rounded-full ring-2 ring-secundario/50" />
                  <span className="flex-1 text-texto">{p.nombre}</span>
                  <span className="font-display font-semibold text-texto">{p.cantidad} und.</span>
                </li>
              ))}
            </ol>
          )}
        </section>
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-3">
        <section className="card anim-entrada p-6">
          <Titulo icon={Calculator}>Estado de cajas</Titulo>
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

        <section className="card anim-entrada p-6">
          <Titulo icon={MapPin}>Ventas por sucursal</Titulo>
          <ul className="space-y-5">
            {ventasPorSucursal.map((s, i) => (
              <li key={s.id}>
                <div className="mb-1.5 flex justify-between text-sm">
                  <span className="text-texto">{s.nombre}</span>
                  <span className="font-display font-semibold text-texto">
                    {money(s.total)} <span className="font-normal text-suave">· {s.porcentaje}%</span>
                  </span>
                </div>
                <Barra porcentaje={s.porcentaje} color={colorBarra[i % 2]} />
              </li>
            ))}
          </ul>
        </section>

        <section className="card anim-entrada p-6">
          <Titulo icon={Package} extra={<Link to="/inventario" className="flex items-center gap-1 text-sm text-acento hover:underline">Ver todo <ArrowRight className="size-4" /></Link>}>
            Alertas de inventario
          </Titulo>
          {alertas.length === 0 ? (
            <Vacio titulo="Todo el inventario está sobre su mínimo" />
          ) : (
            <ul className="space-y-3">
              {alertas.slice(0, 4).map((a) => (
                <li key={a.id} className="flex items-center gap-3 text-sm">
                  <CircleAlert className={`size-5 shrink-0 text-white ${a.estado === 'agotado' ? 'fill-error' : 'fill-naranja'}`} />
                  <span className="flex-1 text-texto">{a.nombre}</span>
                  <span className="text-suave">
                    {qty(a.existencia, a.unidad)} / mín. {qty(a.minimo, a.unidad)}
                  </span>
                </li>
              ))}
              {alertas.length > 4 && <li className="text-sm text-suave">y {alertas.length - 4} más…</li>}
            </ul>
          )}
        </section>
      </div>
    </>
  );
}

const round = (n) => Math.round(n * 100) / 100;
