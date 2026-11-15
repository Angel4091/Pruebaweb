import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChartColumn, ShoppingBasket, PackageCheck, CalendarDays, Utensils, TriangleAlert, Lightbulb, ShoppingCart, CircleAlert } from 'lucide-react';
import { useApp } from '../context/AppContext.jsx';
import { useFetch } from '../hooks/useFetch.js';
import { pronosticoService, comprasService } from '../services/index.js';
import { PageHeader } from '../components/layout/Layout.jsx';
import { StatCard, Variacion, Button, Cargando, ErrorBox, Vacio } from '../components/ui/index.jsx';
import { LineChart, Barra } from '../components/charts/Charts.jsx';
import { InsumoArt } from '../components/decor/FoodArt.jsx';
import { money, qty, fecha } from '../utils/format.js';

const DIA = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];

export default function Pronostico() {
  const { sucursalId, notify, refrescar, version } = useApp();
  const navigate = useNavigate();
  const [dias, setDias] = useState(7);
  const [enviando, setEnviando] = useState(null);
  const { data, loading, error, reload } = useFetch(() => pronosticoService.obtener(sucursalId, dias), [sucursalId, dias, version]);

  const generarPedido = async (pedidos, clave) => {
    setEnviando(clave);
    try {
      const ordenes = await comprasService.crearOrdenes({ sucursalId, pedidos });
      notify(`${ordenes.length === 1 ? 'Orden de compra creada' : `${ordenes.length} órdenes de compra creadas`}. Recíbelas en Compras cuando llegue la factura.`);
      refrescar();
      navigate('/compras');
    } catch (err) {
      notify(err.message, 'error');
    } finally {
      setEnviando(null);
    }
  };

  if (loading && !data) return <Cargando texto="Calculando el pronóstico…" />;
  if (error) return <ErrorBox error={error} onRetry={reload} />;
  const { resumen, serie, consumoPorInsumo, alertas, pedidos } = data;
  const maxConsumo = Math.max(...consumoPorInsumo.map((c) => c.consumo7 * c.costoUnitario), 1);
  const serieVisible = serie.slice(-(dias + 7));

  return (
    <>
      <PageHeader titulo="Pronóstico de insumos" subtitulo="Anticipa el consumo y evita faltantes" />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard acento={false} icon={ChartColumn} tono="azul" titulo="Días de cobertura" valor={`${resumen.diasCobertura} días`} detalle="del inventario actual" />
        <StatCard
          acento={false}
          icon={ShoppingBasket}
          tono="dorado"
          titulo="Insumos en riesgo"
          valor={resumen.insumosEnRiesgo}
          detalle={
            <span className="flex items-center gap-1 text-error">
              <TriangleAlert className="size-4" /> {resumen.insumosEnRiesgo ? 'Requieren pedido' : 'Sin riesgo'}
            </span>
          }
        />
        <StatCard acento={false} icon={PackageCheck} tono="verde" titulo="Consumo proyectado" valor={money(resumen.consumoProyectado)} detalle={<Variacion valor={resumen.variacion} sufijo="vs últimos 7 días" />} />
        <StatCard acento={false} icon={CalendarDays} tono="azul" titulo="Próximo pedido sugerido" valor={fecha(resumen.proximoPedido, { day: 'numeric', month: 'short', year: 'numeric' }).replace('.', '')} detalle={`Para ${dias} días`} />
      </div>

      <div className="mt-5 grid gap-5 xl:grid-cols-[1.4fr_1fr]">
        <section className="card anim-entrada p-5">
          <div className="mb-1 flex flex-wrap items-center justify-between gap-2">
            <h2 className="flex items-center gap-2 font-display text-lg font-semibold text-texto">
              <ChartColumn className="size-5 text-primario" /> Predicción de consumo
            </h2>
            <select className="campo w-auto font-display" value={dias} onChange={(e) => setDias(Number(e.target.value))} aria-label="Horizonte">
              <option value={7}>Próximos 7 días</option>
              <option value={14}>Próximos 14 días</option>
            </select>
          </div>
          <div className="mb-1 flex justify-center gap-6 text-sm">
            <span className="flex items-center gap-2"><span className="size-3 rounded-full bg-primario" /> Consumo real</span>
            <span className="flex items-center gap-2"><span className="size-3 rounded-full bg-secundario" /> Pronóstico</span>
          </div>
          <LineChart
            suave
            etiquetas={serieVisible.map((s) => s.fecha.slice(8) + '/' + s.fecha.slice(5, 7))}
            subetiquetas={serieVisible.map((s) => DIA[new Date(`${s.fecha}T12:00:00`).getDay()])}
            series={[
              { nombre: 'Consumo real', color: 'var(--c-primario)', valores: serieVisible.map((s) => s.real) },
              { nombre: 'Pronóstico', color: 'var(--c-secundario)', valores: serieVisible.map((s) => s.pronostico) },
            ]}
            formato={money}
          />
          <p className="mt-1 text-xs text-suave">Costo de insumos consumidos por día (USD). Promedio móvil de 7 días ajustado por día de la semana.</p>
        </section>

        <section className="card anim-entrada p-5">
          <h2 className="mb-3 flex items-center gap-2 font-display text-lg font-semibold text-texto">
            <Utensils className="size-5 text-primario" /> Consumo por ingrediente
            <span className="ml-auto text-xs font-normal text-suave">últimos 7 días</span>
          </h2>
          <ul className="space-y-3">
            {consumoPorInsumo.map((c, i) => (
              <li key={c.id} className="grid grid-cols-[3rem_6.5rem_1fr_4.5rem] items-center gap-3">
                <InsumoArt arte={c.arte} className="h-9 w-12" />
                <span className="truncate text-texto">{c.nombre}</span>
                <Barra porcentaje={((c.consumo7 * c.costoUnitario) / maxConsumo) * 100} color={i % 2 ? 'var(--c-secundario)' : 'var(--c-primario)'} />
                <span className="text-right font-display font-semibold text-texto">{qty(c.consumo7, c.unidad)}</span>
              </li>
            ))}
          </ul>
        </section>
      </div>

      <div className="mt-5 grid gap-5 xl:grid-cols-[1fr_1.2fr]">
        <section className="card anim-entrada p-5">
          <h2 className="mb-3 flex items-center gap-2 font-display text-lg font-semibold text-texto">
            <TriangleAlert className="size-5" /> Alertas de posibles faltantes
          </h2>
          {alertas.length === 0 ? (
            <Vacio titulo="Sin faltantes previstos">El inventario cubre el consumo proyectado.</Vacio>
          ) : (
            <ul className="divide-y divide-borde">
              {alertas.map((a) => (
                <li key={a.id} className="flex flex-wrap items-center gap-3 py-2.5">
                  <CircleAlert className={`size-6 shrink-0 text-white ${a.urgencia === 'alta' ? 'fill-error' : 'fill-naranja'}`} />
                  <span className="w-32 font-medium text-texto">{a.nombre}</span>
                  <span className="flex-1 text-sm text-texto/80">
                    Stock actual: {qty(a.existencia, a.unidad)} · Recomendado: {qty(a.sugerido, a.unidad)}
                    <span className="block text-xs text-suave">{a.cobertura === null ? 'Sin consumo reciente' : `Alcanza para ${a.cobertura} días`}</span>
                  </span>
                  <button
                    type="button"
                    disabled={enviando !== null}
                    onClick={() => generarPedido([{ proveedorId: a.proveedorId, items: [{ insumoId: a.id, cantidad: a.sugerido }] }], a.id)}
                    className="rounded-full bg-error/15 px-4 py-1.5 font-display text-sm font-semibold text-error hover:bg-error/25 disabled:opacity-50"
                  >
                    {enviando === a.id ? 'Creando…' : 'Comprar'}
                  </button>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="card anim-entrada flex flex-col p-5">
          <h2 className="mb-3 flex items-center gap-2 font-display text-lg font-semibold text-texto">
            <Lightbulb className="size-5 text-primario" /> Pedidos sugeridos por proveedor
          </h2>
          {pedidos.length === 0 ? (
            <Vacio titulo="No hay pedidos sugeridos" />
          ) : (
            <div className="overflow-x-auto">
              <table className="tabla min-w-[540px]">
                <thead>
                  <tr>
                    <th>Proveedor</th>
                    <th>Productos</th>
                    <th>Cantidad sugerida</th>
                    <th className="text-right!">Costo estimado</th>
                  </tr>
                </thead>
                <tbody>
                  {pedidos.map((p) => (
                    <tr key={p.proveedorId}>
                      <td>{p.proveedorNombre}</td>
                      <td>{p.items.map((i) => i.nombre).join(', ')}</td>
                      <td>{p.items.map((i) => qty(i.cantidad, i.unidad)).join(', ')}</td>
                      <td className="text-right">{money(p.costoEstimado)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
          <div className="mt-auto flex justify-end pt-4">
            <Button icon={ShoppingCart} className="rounded-full px-6" disabled={pedidos.length === 0} loading={enviando === 'todos'} onClick={() => generarPedido(pedidos.map((p) => ({ proveedorId: p.proveedorId, items: p.items })), 'todos')}>
              Generar pedido
            </Button>
          </div>
        </section>
      </div>
    </>
  );
}
