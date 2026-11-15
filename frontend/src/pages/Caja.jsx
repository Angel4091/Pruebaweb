import { useEffect, useState } from 'react';
import { Calculator, ChartColumn, Wallet, History, Check, CircleCheck, Lock, Minus, RotateCcw, TriangleAlert } from 'lucide-react';
import { useApp } from '../context/AppContext.jsx';
import { useFetch } from '../hooks/useFetch.js';
import { cajaService } from '../services/index.js';
import { PageHeader } from '../components/layout/Layout.jsx';
import { Panel, Badge, Button, Modal, Aviso, Cargando, ErrorBox, Vacio } from '../components/ui/index.jsx';
import { DonutChart } from '../components/charts/Charts.jsx';
import { money, fecha, hora, ETIQUETA_METODO } from '../utils/format.js';

const DENOMINACIONES = [1, 5, 10, 20];
const COLORES = { efectivo: 'var(--c-exito)', tarjeta: '#2f7be6', bitcoin: '#f39a1e' };

export default function Caja() {
  const { sucursalId, notify, refrescar, version } = useApp();
  const [cajaId, setCajaId] = useState('');
  const [dias, setDias] = useState(7);
  const [conteo, setConteo] = useState({ 1: 0, 5: 0, 10: 0, 20: 0 });
  const [contado, setContado] = useState('');
  const [confirmarCierre, setConfirmarCierre] = useState(false);
  const [procesando, setProcesando] = useState(false);

  const cajas = useFetch(() => cajaService.listar(sucursalId), [sucursalId, version]);
  const metodos = useFetch(() => cajaService.porMetodo(sucursalId), [sucursalId, version]);
  const historial = useFetch(() => cajaService.historial(sucursalId, dias), [sucursalId, dias, version]);

  useEffect(() => {
    if (cajas.data && !cajas.data.some((c) => c.id === cajaId)) setCajaId(cajas.data[0]?.id ?? '');
  }, [cajas.data, cajaId]);
  useEffect(() => setContado(''), [cajaId]);

  const caja = cajas.data?.find((c) => c.id === cajaId);
  const turno = caja?.turno;
  const montoInicial = DENOMINACIONES.reduce((a, d) => a + d * conteo[d], 0);
  const esperado = turno?.totales.efectivoEsperado ?? 0;
  const efectivoContado = contado === '' ? esperado : Number(contado);
  const diferencia = Math.round((efectivoContado - esperado) * 100) / 100;

  const abrir = async () => {
    setProcesando(true);
    try {
      await cajaService.abrir(cajaId, { montoInicial, denominaciones: conteo, responsable: 'Andrea Morales' });
      notify(`${caja.nombre} abierta con ${money(montoInicial)}`);
      setConteo({ 1: 0, 5: 0, 10: 0, 20: 0 });
      refrescar();
    } catch (err) {
      notify(err.message, 'error');
    } finally {
      setProcesando(false);
    }
  };

  const cerrar = async () => {
    setProcesando(true);
    try {
      const r = await cajaService.cerrar(cajaId, { efectivoContado });
      notify(`Turno cerrado. Diferencia: ${money(r.totales.diferencia)}`, r.totales.diferencia === 0 ? 'exito' : 'error');
      setConfirmarCierre(false);
      refrescar();
    } catch (err) {
      notify(err.message, 'error');
    } finally {
      setProcesando(false);
    }
  };

  if (cajas.loading && !cajas.data) return <Cargando />;

  const datosDona = (metodos.data?.metodos ?? []).map((m) => ({ nombre: ETIQUETA_METODO[m.metodo], valor: m.monto, color: COLORES[m.metodo] }));

  return (
    <>
      <PageHeader titulo="Caja y turnos" subtitulo="Controla la apertura, ventas y cierre de tu caja">
        <div className="flex rounded-xl border border-borde bg-superficie p-1" role="tablist" aria-label="Caja">
          {cajas.data?.map((c) => (
            <button
              key={c.id}
              type="button"
              role="tab"
              aria-selected={c.id === cajaId}
              onClick={() => setCajaId(c.id)}
              className={`flex items-center gap-2 rounded-lg px-4 py-2 font-display text-sm font-semibold ${c.id === cajaId ? 'bg-primario text-white' : 'text-texto'}`}
            >
              {c.nombre}
              <span className={`size-2 rounded-full ${c.estado === 'abierta' ? 'bg-exito' : 'bg-suave'}`} />
            </button>
          ))}
        </div>
      </PageHeader>
      <ErrorBox error={cajas.error} onRetry={cajas.reload} />

      <div className="grid gap-5 xl:grid-cols-[1fr_1.2fr]">
        <Panel titulo="Apertura de caja" icon={Calculator}>
          {turno ? (
            <div className="flex flex-wrap items-center gap-5 p-5">
              <span className="grid size-14 place-items-center rounded-full bg-exito/15 text-exito">
                <CircleCheck className="size-8" />
              </span>
              <div className="flex-1">
                <p className="font-display text-lg font-semibold text-texto">{caja.nombre} abierta · Turno {turno.turno.toLowerCase()}</p>
                <p className="text-sm text-suave">
                  Desde las {hora(turno.apertura)} · Responsable: {turno.responsable}
                </p>
              </div>
              <div className="text-right">
                <p className="text-sm text-suave">Monto inicial</p>
                <p className="font-display text-3xl font-bold text-texto">{money(turno.montoInicial)}</p>
              </div>
            </div>
          ) : (
            <div className="p-5">
              <div className="flex flex-wrap items-center gap-6">
                <div className="min-w-36">
                  <p className="font-display font-medium text-texto">Monto inicial:</p>
                  <p className="font-display text-4xl font-bold text-texto">{money(montoInicial)}</p>
                </div>
                <span className="hidden h-16 w-px bg-borde sm:block" />
                <div className="flex-1">
                  <p className="mb-2 font-display font-medium text-texto">Denominación:</p>
                  <div className="flex flex-wrap gap-2">
                    {DENOMINACIONES.map((d) => (
                      <div key={d} className="flex flex-col items-center gap-1">
                        <button
                          type="button"
                          onClick={() => setConteo((c) => ({ ...c, [d]: c[d] + 1 }))}
                          className="min-w-14 rounded-xl border border-borde bg-superficie-2 px-3 py-2.5 font-display font-semibold text-texto hover:border-secundario"
                          aria-label={`Agregar billete de ${d} dólares`}
                        >
                          ${d}
                        </button>
                        <span className="flex items-center gap-1 text-xs text-suave">
                          × {conteo[d]}
                          {conteo[d] > 0 && (
                            <button type="button" onClick={() => setConteo((c) => ({ ...c, [d]: c[d] - 1 }))} aria-label={`Quitar billete de ${d}`}>
                              <Minus className="size-3" />
                            </button>
                          )}
                        </span>
                      </div>
                    ))}
                    <button type="button" onClick={() => setConteo({ 1: 0, 5: 0, 10: 0, 20: 0 })} className="self-start rounded-xl p-2.5 text-suave hover:bg-superficie-2" aria-label="Reiniciar conteo">
                      <RotateCcw className="size-5" />
                    </button>
                  </div>
                </div>
              </div>
              <Button className="mt-5 w-full py-3.5 text-base" icon={Check} loading={procesando} onClick={abrir} disabled={!cajaId}>
                Confirmar apertura
              </Button>
            </div>
          )}
        </Panel>

        <Panel titulo="Ventas por método de pago" icon={ChartColumn} acciones={<span className="text-sm text-white/80">Hoy · todas las cajas</span>}>
          {metodos.loading && !metodos.data ? (
            <Cargando />
          ) : (
            <div className="flex flex-wrap items-center justify-center gap-8 p-5">
              <DonutChart datos={datosDona} total={money(metodos.data?.total ?? 0)} />
              <ul className="min-w-64 flex-1 space-y-4">
                {metodos.data?.metodos.map((m) => (
                  <li key={m.metodo} className="grid grid-cols-[1fr_auto_3.5rem] items-center gap-4 text-lg">
                    <span className="flex items-center gap-3 text-texto">
                      <span className="size-4 rounded-full" style={{ background: COLORES[m.metodo] }} />
                      {ETIQUETA_METODO[m.metodo]}
                    </span>
                    <span className="font-display font-semibold text-texto">{money(m.monto)}</span>
                    <span className="text-right font-display font-semibold text-texto">{m.porcentaje}%</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </Panel>

        <Panel titulo="Resumen de caja" icon={Wallet}>
          {!turno ? (
            <Vacio icon={Lock} titulo={`${caja?.nombre ?? 'La caja'} está cerrada`}>Abre la caja para ver el resumen del turno.</Vacio>
          ) : (
            <div>
              <dl className="divide-y divide-borde text-[1.05rem]">
                <div className="flex justify-between px-5 py-3">
                  <dt>Ventas del turno ({turno.totales.ordenes} órdenes):</dt>
                  <dd className="font-display font-semibold">{money(turno.totales.ventas)}</dd>
                </div>
                <div className="flex justify-between px-5 py-2 text-sm text-suave">
                  <dt>Tarjeta {money(turno.totales.tarjeta)} · Chivo {money(turno.totales.bitcoin)}</dt>
                  <dd>Efectivo {money(turno.totales.efectivo)}</dd>
                </div>
                <div className="flex justify-between px-5 py-3">
                  <dt>Efectivo esperado en caja:</dt>
                  <dd className="font-display font-semibold">{money(esperado)}</dd>
                </div>
                <div className="flex items-center justify-between gap-3 px-5 py-2.5">
                  <dt>
                    <label htmlFor="contado">Efectivo contado:</label>
                  </dt>
                  <dd>
                    <input id="contado" className="campo w-36 text-right font-display font-semibold" type="number" min="0" step="0.01" placeholder={esperado.toFixed(2)} value={contado} onChange={(e) => setContado(e.target.value)} />
                  </dd>
                </div>
                <div className="flex justify-between bg-acento/10 px-5 py-3 font-display text-lg font-bold">
                  <dt>Diferencia:</dt>
                  <dd className={diferencia === 0 ? 'text-primario' : 'text-error'}>{money(diferencia)}</dd>
                </div>
              </dl>
              <div className={`m-4 flex items-center justify-center gap-3 rounded-xl py-3 font-display text-lg font-semibold ${diferencia === 0 ? 'bg-secundario/30 text-texto' : 'bg-error/15 text-error'}`}>
                {diferencia === 0 ? <CircleCheck className="size-7 fill-primario text-white" /> : <TriangleAlert className="size-6" />}
                {diferencia === 0 ? 'Caja en orden' : diferencia < 0 ? `Faltante de ${money(-diferencia)}` : `Sobrante de ${money(diferencia)}`}
              </div>
            </div>
          )}
        </Panel>

        <Panel
          titulo="Historial de turnos"
          icon={History}
          acciones={
            <select className="rounded-lg bg-white px-3 py-1.5 font-display text-sm text-texto outline-none" value={dias} onChange={(e) => setDias(Number(e.target.value))} aria-label="Periodo">
              <option value={7}>Últimos 7 días</option>
              <option value={15}>Últimos 15 días</option>
              <option value={30}>Últimos 30 días</option>
            </select>
          }
        >
          <ErrorBox error={historial.error} onRetry={historial.reload} />
          <div className="max-h-[310px] overflow-auto">
            <table className="tabla min-w-[560px]">
              <thead className="sticky top-0">
                <tr>
                  <th className="text-center!">Fecha</th>
                  <th className="text-center!">Caja / Turno</th>
                  <th className="text-center!">Ventas</th>
                  <th className="text-center!">Efectivo</th>
                  <th className="text-center!">Estado</th>
                </tr>
              </thead>
              <tbody>
                {historial.data?.map((t) => (
                  <tr key={t.id}>
                    <td className="text-center">{fecha(t.fecha)}</td>
                    <td className="text-center">
                      {t.cajaNombre} · {t.turno}
                    </td>
                    <td className="text-center">{money(t.totales?.ventas)}</td>
                    <td className="text-center">
                      {money(t.totales?.efectivo)}
                      {t.estado === 'cerrada' && t.totales.diferencia !== 0 && <span className="block text-xs text-error">Dif. {money(t.totales.diferencia)}</span>}
                    </td>
                    <td className="text-center">
                      <Badge color={t.estado === 'abierta' ? 'azul' : 'verde'} punto={false} className="px-4 text-sm">
                        {t.estado === 'abierta' ? 'Abierto' : 'Cerrado'}
                      </Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Panel>
      </div>

      <Aviso
        className="mt-5"
        accion={
          <Button icon={Lock} className="px-8 py-3 text-base" disabled={!turno} onClick={() => setConfirmarCierre(true)}>
            Cerrar turno
          </Button>
        }
      >
        <span className="font-display text-lg font-semibold text-texto">Recuerda cerrar el turno al finalizar el día</span>
      </Aviso>

      <Modal
        abierto={confirmarCierre}
        onClose={() => setConfirmarCierre(false)}
        titulo={`Cerrar turno de ${caja?.nombre}`}
        pie={
          <>
            <Button variante="suave" onClick={() => setConfirmarCierre(false)}>
              Cancelar
            </Button>
            <Button icon={Lock} loading={procesando} onClick={cerrar}>
              Cerrar turno
            </Button>
          </>
        }
      >
        <p className="text-texto">Se cerrará el turno con los siguientes valores. Después no se podrán registrar más ventas en esta caja hasta una nueva apertura.</p>
        <dl className="mt-4 grid grid-cols-2 gap-3 text-sm">
          {[
            ['Efectivo esperado', money(esperado)],
            ['Efectivo contado', money(efectivoContado)],
            ['Tarjeta', money(turno?.totales.tarjeta)],
            ['Bitcoin (Chivo)', money(turno?.totales.bitcoin)],
          ].map(([k, v]) => (
            <div key={k} className="rounded-xl bg-superficie-2 p-3">
              <dt className="text-suave">{k}</dt>
              <dd className="font-display text-lg font-semibold text-texto">{v}</dd>
            </div>
          ))}
        </dl>
        <p className={`mt-4 font-display text-lg font-bold ${diferencia === 0 ? 'text-exito' : 'text-error'}`}>Diferencia: {money(diferencia)}</p>
      </Modal>
    </>
  );
}
