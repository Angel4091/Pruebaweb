import { useEffect, useMemo, useState } from 'react';
import { Users, CalendarDays, CircleCheck, Wallet, Plus, Search, Pencil, Trash2, FileText, Coins, Printer, History, Eye, HandCoins } from 'lucide-react';
import { useApp } from '../context/AppContext.jsx';
import { useFetch } from '../hooks/useFetch.js';
import { rrhhService } from '../services/index.js';
import { PageHeader } from '../components/layout/Layout.jsx';
import { StatCard, Panel, Badge, Pagination, Modal, Field, Button, Cargando, ErrorBox, Vacio } from '../components/ui/index.jsx';
import { money, fecha } from '../utils/format.js';

const POR_PAGINA = 5;

export default function Personal() {
  const { notify, sucursales } = useApp();
  const [q, setQ] = useState('');
  const [estado, setEstado] = useState('activo');
  const [pagina, setPagina] = useState(1);
  const [editar, setEditar] = useState(null); // empleado | {} (nuevo) | null
  const [baja, setBaja] = useState(null);
  const [periodo, setPeriodo] = useState('actual');
  const [detalle, setDetalle] = useState(null);
  const [procesando, setProcesando] = useState(false);

  const empleados = useFetch(() => rrhhService.empleados(), []);
  const planillas = useFetch(() => rrhhService.planillas(), []);
  const calculo = useFetch(() => rrhhService.calcular(), [empleados.data]);

  useEffect(() => setPagina(1), [q, estado]);

  const filtrados = useMemo(() => {
    const t = q.toLowerCase();
    return (empleados.data ?? []).filter((e) => (!estado || e.estado === estado) && (e.nombre.toLowerCase().includes(t) || e.cargo.toLowerCase().includes(t)));
  }, [empleados.data, q, estado]);

  // Planilla mostrada: la del periodo actual (cálculo en vivo) o una del historial.
  const planilla = periodo === 'actual' ? calculo.data : planillas.data?.find((p) => p.id === periodo);
  const activos = (empleados.data ?? []).filter((e) => e.estado === 'activo').length;
  const pagadas = planillas.data?.filter((p) => p.estado === 'pagada').length ?? 0;
  const pendientes = planillas.data?.filter((p) => p.estado !== 'pagada').length ?? 0;

  const recargarTodo = () => {
    empleados.reload({ silencioso: true });
    planillas.reload({ silencioso: true });
    calculo.reload({ silencioso: true });
  };

  const generar = async () => {
    setProcesando(true);
    try {
      const p = await rrhhService.generar();
      notify(`Planilla ${p.periodo.etiqueta} generada por ${money(p.totales.liquido)}`);
      recargarTodo();
    } catch (err) {
      notify(err.message, 'error');
    } finally {
      setProcesando(false);
    }
  };

  const pagar = async (id) => {
    setProcesando(true);
    try {
      await rrhhService.pagar(id);
      notify('Planilla marcada como pagada');
      recargarTodo();
    } catch (err) {
      notify(err.message, 'error');
    } finally {
      setProcesando(false);
    }
  };

  const confirmarBaja = async () => {
    try {
      await rrhhService.baja(baja.id);
      notify(`${baja.nombre} fue dado de baja`);
      setBaja(null);
      recargarTodo();
    } catch (err) {
      notify(err.message, 'error');
    }
  };

  const idPlanillaActual = calculo.data?.id;
  const estadoActual = calculo.data?.estado;

  return (
    <>
      <PageHeader titulo="RR. HH. y planilla" subtitulo="Gestiona tu personal y genera la planilla quincenal" />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard acento={false} icon={Users} tono="azul" titulo="Colaboradores" valor={activos} />
        <StatCard acento={false} icon={CalendarDays} tono="dorado" titulo="Planilla actual" valor={calculo.data ? money(calculo.data.totales.liquido) : '—'} detalle={calculo.data?.periodo.etiqueta} />
        <StatCard acento={false} icon={CircleCheck} tono="verde" titulo="Pagos al día" valor={planillas.data ? `${Math.round((pagadas / Math.max(1, pagadas + pendientes)) * 100)}%` : '—'} />
        <StatCard acento={false} icon={Wallet} tono="azul" titulo="Pendientes" valor={pendientes} detalle={pendientes ? 'planillas por pagar' : 'Sin pagos pendientes'} />
      </div>

      <div className="mt-6 grid items-start gap-6 xl:grid-cols-[1.35fr_1fr]">
        <div className="flex flex-col gap-5">
          <Panel
            titulo="Personal"
            icon={Users}
            acciones={
              <button type="button" onClick={() => setEditar({})} className="flex items-center gap-2 rounded-full bg-white px-4 py-1.5 font-display text-sm font-semibold text-primario hover:brightness-95">
                <Plus className="size-4" /> Agregar empleado
              </button>
            }
          >
            <div className="flex flex-wrap gap-3 p-4 pb-3">
              <div className="relative min-w-52 flex-1">
                <Search className="pointer-events-none absolute top-1/2 left-3.5 size-5 -translate-y-1/2" />
                <input className="campo pl-11" placeholder="Buscar empleado…" value={q} onChange={(e) => setQ(e.target.value)} aria-label="Buscar empleado" />
              </div>
              <select className="campo w-auto min-w-36 font-display" value={estado} onChange={(e) => setEstado(e.target.value)} aria-label="Estado">
                <option value="">Todos</option>
                <option value="activo">Activos</option>
                <option value="inactivo">Inactivos</option>
              </select>
            </div>
            {empleados.loading && !empleados.data && <Cargando />}
            <ErrorBox error={empleados.error} onRetry={empleados.reload} />
            <div className="overflow-x-auto px-4">
              <table className="tabla min-w-[600px] overflow-hidden rounded-lg border border-borde">
                <thead>
                  <tr>
                    <th>Nombre</th>
                    <th>Cargo</th>
                    <th className="text-right!">Salario</th>
                    <th className="text-center!">Estado</th>
                    <th className="text-center!">Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {filtrados.slice((pagina - 1) * POR_PAGINA, pagina * POR_PAGINA).map((e) => (
                    <tr key={e.id}>
                      <td className="font-medium">{e.nombre}</td>
                      <td>
                        {e.cargo}
                        <span className="block text-xs text-suave">{sucursales.find((s) => s.id === e.sucursalId)?.nombre}</span>
                      </td>
                      <td className="text-right">{money(e.salarioMensual)}</td>
                      <td className="text-center">
                        <Badge color={e.estado === 'activo' ? 'verde' : 'gris'}>{e.estado === 'activo' ? 'Activo' : 'Inactivo'}</Badge>
                      </td>
                      <td>
                        <div className="flex justify-center gap-1">
                          <button type="button" className="rounded-lg p-1.5 hover:bg-superficie-2" onClick={() => setEditar(e)} aria-label={`Editar ${e.nombre}`}>
                            <Pencil className="size-5" />
                          </button>
                          <button type="button" className="rounded-lg p-1.5 hover:bg-superficie-2 hover:text-error disabled:opacity-30" disabled={e.estado !== 'activo'} onClick={() => setBaja(e)} aria-label={`Dar de baja a ${e.nombre}`}>
                            <Trash2 className="size-5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {empleados.data && filtrados.length === 0 && <Vacio titulo="No hay empleados con ese filtro" />}
            <Pagination pagina={pagina} total={filtrados.length} porPagina={POR_PAGINA} onChange={setPagina} etiqueta="empleados" />
          </Panel>

          <Panel titulo="Historial de pagos" icon={History}>
            <div className="overflow-x-auto">
              <table className="tabla min-w-[520px]">
                <thead>
                  <tr>
                    <th className="text-center!">Fecha</th>
                    <th className="text-center!">Periodo</th>
                    <th className="text-center!">Total pagado</th>
                    <th className="text-center!">Estado</th>
                    <th />
                  </tr>
                </thead>
                <tbody>
                  {planillas.data?.map((p) => (
                    <tr key={p.id}>
                      <td className="text-center">{p.fechaPago ? fecha(p.fechaPago) : '—'}</td>
                      <td className="text-center">{p.periodo.etiqueta}</td>
                      <td className="text-center">{money(p.totales.liquido)}</td>
                      <td className="text-center">
                        <Badge color={p.estado === 'pagada' ? 'verde' : 'amarillo'} punto={false} className="px-4">
                          {p.estado === 'pagada' ? 'Pagado' : 'Por pagar'}
                        </Badge>
                      </td>
                      <td>
                        <button type="button" className="rounded-lg p-1.5 hover:bg-superficie-2" onClick={() => setDetalle(p)} aria-label={`Ver planilla ${p.periodo.etiqueta}`}>
                          <Eye className="size-5" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Panel>
        </div>

        <div className="flex flex-col gap-5">
          <Panel titulo="Planilla Quincenal" icon={FileText}>
            {!planilla ? (
              <Cargando />
            ) : (
              <div className="p-4">
                <div className="flex flex-wrap items-center gap-4 pb-4">
                  <div className="flex flex-1 items-center gap-3">
                    <span className="grid size-12 place-items-center rounded-full bg-acento/15 text-primario">
                      <CalendarDays className="size-6" />
                    </span>
                    <label className="min-w-0">
                      <span className="block text-sm text-texto">Periodo</span>
                      <select className="max-w-full bg-transparent font-display text-lg font-semibold text-texto outline-none" value={periodo} onChange={(e) => setPeriodo(e.target.value)}>
                        <option value="actual">{calculo.data?.periodo.etiqueta}</option>
                        {planillas.data
                          ?.filter((p) => p.id !== idPlanillaActual)
                          .map((p) => (
                            <option key={p.id} value={p.id}>
                              {p.periodo.etiqueta}
                            </option>
                          ))}
                      </select>
                    </label>
                  </div>
                  <span className="hidden h-12 w-px bg-borde sm:block" />
                  <div className="flex items-center gap-3">
                    <span className="grid size-12 place-items-center rounded-full bg-secundario/25 text-[#c98a12]">
                      <Coins className="size-6" />
                    </span>
                    <span>
                      <span className="block text-sm text-texto">Total a pagar</span>
                      <span className="font-display text-2xl font-bold text-texto">{money(planilla.totales.liquido)}</span>
                    </span>
                  </div>
                </div>
                <dl className="overflow-hidden rounded-xl border border-borde text-[0.95rem]">
                  {[
                    ['Salarios del periodo', planilla.totales.salarios],
                    ['ISSS (3 %)', -planilla.totales.isss],
                    ['AFP (7.25 %)', -planilla.totales.afp],
                    ['Renta (retención)', -planilla.totales.renta],
                  ].map(([k, v]) => (
                    <div key={k} className="grid grid-cols-[1fr_auto] border-b border-borde bg-superficie-2/60">
                      <dt className="px-4 py-2.5">{k}</dt>
                      <dd className="border-l border-borde px-4 py-2.5 text-right">{money(v)}</dd>
                    </div>
                  ))}
                  <div className="flex justify-between bg-secundario/30 px-4 py-3 font-display text-lg font-bold">
                    <dt>Total neto</dt>
                    <dd>{money(planilla.totales.liquido)}</dd>
                  </div>
                </dl>
                <p className="mt-2 text-xs text-suave">{planilla.totales.empleados} empleados · ISSS con techo de $15 por quincena · Renta según tabla de retención quincenal.</p>
                <div className="mt-4 grid gap-2 sm:grid-cols-2">
                  {periodo === 'actual' && estadoActual === 'borrador' && (
                    <Button className="py-3 sm:col-span-2" icon={Printer} loading={procesando} onClick={generar}>
                      Generar planilla
                    </Button>
                  )}
                  {planilla.estado === 'generada' && planilla.id && (
                    <Button variante="dorado" className="py-3" icon={HandCoins} loading={procesando} onClick={() => pagar(planilla.id)}>
                      Marcar como pagada
                    </Button>
                  )}
                  <Button variante="contorno" className={`py-3 ${periodo === 'actual' && estadoActual === 'borrador' ? 'sm:col-span-2' : planilla.estado === 'generada' ? '' : 'sm:col-span-2'}`} icon={Eye} onClick={() => setDetalle(planilla)}>
                    Ver detalle por empleado
                  </Button>
                </div>
              </div>
            )}
          </Panel>
        </div>
      </div>

      <EmpleadoModal empleado={editar} onClose={() => setEditar(null)} onGuardado={(msg) => { notify(msg); setEditar(null); recargarTodo(); }} />
      <DetallePlanilla planilla={detalle} onClose={() => setDetalle(null)} />
      <Modal
        abierto={Boolean(baja)}
        onClose={() => setBaja(null)}
        titulo="Dar de baja"
        pie={
          <>
            <Button variante="suave" onClick={() => setBaja(null)}>
              Cancelar
            </Button>
            <Button variante="peligro" icon={Trash2} onClick={confirmarBaja}>
              Dar de baja
            </Button>
          </>
        }
      >
        <p>
          <b>{baja?.nombre}</b> dejará de aparecer en las próximas planillas. Su historial de pagos se conserva.
        </p>
      </Modal>
    </>
  );
}

function EmpleadoModal({ empleado, onClose, onGuardado }) {
  const { notify, sucursales } = useApp();
  const { data: cargos } = useFetch(() => rrhhService.cargos(), []);
  const [form, setForm] = useState({});
  const [guardando, setGuardando] = useState(false);
  const esNuevo = empleado && !empleado.id;
  useEffect(() => {
    if (empleado) {
      setForm({
        nombre: empleado.nombre ?? '',
        cargo: empleado.cargo ?? 'Mesero',
        sucursalId: empleado.sucursalId ?? 'suc-central',
        salarioMensual: empleado.salarioMensual ?? 408.8,
        dui: empleado.dui ?? '',
        afp: empleado.afp ?? 'AFP Confía',
        telefono: empleado.telefono ?? '',
        fechaIngreso: empleado.fechaIngreso ?? new Date().toISOString().slice(0, 10),
        estado: empleado.estado ?? 'activo',
      });
    }
  }, [empleado]);
  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  const submit = async (e) => {
    e.preventDefault();
    setGuardando(true);
    try {
      const data = { ...form, salarioMensual: Number(form.salarioMensual) };
      if (esNuevo) await rrhhService.crear(data);
      else await rrhhService.actualizar(empleado.id, data);
      onGuardado(esNuevo ? `${form.nombre} agregado al personal` : `Datos de ${form.nombre} actualizados`);
    } catch (err) {
      notify(err.message, 'error');
    } finally {
      setGuardando(false);
    }
  };

  return (
    <Modal abierto={Boolean(empleado)} onClose={onClose} titulo={esNuevo ? 'Agregar empleado' : `Editar a ${empleado?.nombre}`} ancho="max-w-xl">
      <form onSubmit={submit} className="grid gap-3 sm:grid-cols-2">
        <Field label="Nombre completo" className="sm:col-span-2">
          <input className="campo" required value={form.nombre ?? ''} onChange={set('nombre')} />
        </Field>
        <Field label="Cargo">
          <select className="campo" value={form.cargo} onChange={set('cargo')}>
            {cargos?.map((c) => (
              <option key={c}>{c}</option>
            ))}
          </select>
        </Field>
        <Field label="Sucursal">
          <select className="campo" value={form.sucursalId} onChange={set('sucursalId')}>
            {sucursales.map((s) => (
              <option key={s.id} value={s.id}>
                {s.nombre}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Salario mensual" ayuda="Salario mínimo comercio y servicios: $408.80">
          <input className="campo" type="number" min="1" step="0.01" required value={form.salarioMensual ?? ''} onChange={set('salarioMensual')} />
        </Field>
        <Field label="DUI" ayuda="Formato 00000000-0">
          <input className="campo" value={form.dui ?? ''} onChange={set('dui')} pattern="\d{8}-\d" />
        </Field>
        <Field label="AFP">
          <select className="campo" value={form.afp} onChange={set('afp')}>
            <option>AFP Confía</option>
            <option>AFP Crecer</option>
          </select>
        </Field>
        <Field label="Teléfono">
          <input className="campo" value={form.telefono ?? ''} onChange={set('telefono')} />
        </Field>
        <Field label="Fecha de ingreso">
          <input className="campo" type="date" value={form.fechaIngreso ?? ''} onChange={set('fechaIngreso')} />
        </Field>
        {!esNuevo && (
          <Field label="Estado">
            <select className="campo" value={form.estado} onChange={set('estado')}>
              <option value="activo">Activo</option>
              <option value="inactivo">Inactivo</option>
            </select>
          </Field>
        )}
        <div className="flex justify-end gap-2 sm:col-span-2">
          <Button variante="suave" onClick={onClose}>
            Cancelar
          </Button>
          <Button type="submit" loading={guardando}>
            {esNuevo ? 'Agregar empleado' : 'Guardar cambios'}
          </Button>
        </div>
      </form>
    </Modal>
  );
}

function DetallePlanilla({ planilla, onClose }) {
  const { config } = useApp();
  if (!planilla) return null;
  const t = planilla.totales;
  return (
    <Modal
      abierto
      onClose={onClose}
      titulo={`Planilla ${planilla.periodo.etiqueta}`}
      ancho="max-w-5xl"
      pie={
        <Button icon={Printer} onClick={() => window.print()}>
          Imprimir planilla
        </Button>
      }
    >
      <div className="zona-impresion bg-superficie">
        <p className="mb-3 font-display font-semibold">
          {config?.nombre} · Planilla quincenal del {fecha(planilla.periodo.inicio)} al {fecha(planilla.periodo.fin)}
        </p>
        <div className="overflow-x-auto">
          <table className="tabla min-w-[760px]">
            <thead>
              <tr>
                <th>Empleado</th>
                <th>Cargo</th>
                <th className="text-right!">Salario</th>
                <th className="text-right!">ISSS</th>
                <th className="text-right!">AFP</th>
                <th className="text-right!">Renta</th>
                <th className="text-right!">Líquido</th>
              </tr>
            </thead>
            <tbody>
              {planilla.detalles.map((d) => (
                <tr key={d.empleadoId}>
                  <td>{d.nombre}</td>
                  <td>{d.cargo}</td>
                  <td className="text-right">{money(d.salarioQuincenal)}</td>
                  <td className="text-right">{money(d.isss)}</td>
                  <td className="text-right">{money(d.afp)}</td>
                  <td className="text-right">
                    {money(d.renta)} <span className="text-xs text-suave">({d.tramoRenta})</span>
                  </td>
                  <td className="text-right font-semibold">{money(d.liquido)}</td>
                </tr>
              ))}
              <tr className="font-display font-bold">
                <td colSpan={2}>Totales</td>
                <td className="text-right">{money(t.salarios)}</td>
                <td className="text-right">{money(t.isss)}</td>
                <td className="text-right">{money(t.afp)}</td>
                <td className="text-right">{money(t.renta)}</td>
                <td className="text-right">{money(t.liquido)}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </Modal>
  );
}
