import { useEffect, useState } from 'react';
import { Truck, Receipt, HandCoins, Building2, Plus, Trash2, ClipboardList, History, PackageCheck, Save } from 'lucide-react';
import { useApp } from '../context/AppContext.jsx';
import { useFetch } from '../hooks/useFetch.js';
import { comprasService, inventarioService } from '../services/index.js';
import { PageHeader } from '../components/layout/Layout.jsx';
import { StatCard, Panel, Badge, Modal, Field, Button, Cargando, ErrorBox, Vacio, Pagination } from '../components/ui/index.jsx';
import { money, fecha, qty } from '../utils/format.js';

const r2 = (n) => Math.round((n + Number.EPSILON) * 100) / 100;
const POR_PAGINA_HISTORIAL = 10;
const FORM_VACIO = { tipo: 'costo', proveedorId: '', proveedorNombre: '', numeroFactura: '', condicion: 'contado', descripcion: '', monto: '', items: [{ insumoId: '', cantidad: '', costoUnitario: '' }], ordenCompraId: null };
const ESTADO_CXP = { pendiente: ['amarillo', 'Pendiente'], vencida: ['rojo', 'Vencida'], pagada: ['verde', 'Pagada'] };

export default function Compras() {
  const { sucursalId, notify, refrescar, version } = useApp();
  const [form, setForm] = useState(FORM_VACIO);
  const [guardando, setGuardando] = useState(false);
  const [pago, setPago] = useState(null);
  const [nuevoProveedor, setNuevoProveedor] = useState(false);
  const [pestana, setPestana] = useState('registrar');
  const [paginaHistorial, setPaginaHistorial] = useState(1);
  useEffect(() => setPaginaHistorial(1), [sucursalId]);

  const resumen = useFetch(() => comprasService.resumen(), [version]);
  const proveedores = useFetch(() => comprasService.proveedores(), [version]);
  const insumos = useFetch(() => inventarioService.insumos(sucursalId), [sucursalId]);
  const cuentas = useFetch(() => comprasService.cuentas(), [version]);
  const compras = useFetch(
    () => comprasService.listar({ sucursalId, pagina: paginaHistorial, porPagina: POR_PAGINA_HISTORIAL }),
    [sucursalId, paginaHistorial, version],
  );
  const ordenes = useFetch(() => comprasService.ordenes('pendiente'), [version]);

  // Al elegir un insumo, se propone su costo promedio actual.
  const setLinea = (i, k, v) =>
    setForm((f) => ({
      ...f,
      items: f.items.map((l, j) => {
        if (j !== i) return l;
        const nueva = { ...l, [k]: v };
        if (k === 'insumoId' && !l.costoUnitario) nueva.costoUnitario = insumos.data?.find((x) => x.id === v)?.costoUnitario ?? '';
        return nueva;
      }),
    }));

  const subtotal = form.tipo === 'costo' ? r2(form.items.reduce((a, l) => a + Number(l.cantidad || 0) * Number(l.costoUnitario || 0), 0)) : r2(Number(form.monto || 0));
  const iva = r2(subtotal * 0.13);

  const cargarOrden = (o) => {
    setForm({
      ...FORM_VACIO,
      proveedorId: o.proveedorId,
      condicion: 'credito',
      ordenCompraId: o.id,
      items: o.items.map((i) => ({ insumoId: i.insumoId, cantidad: i.cantidad, costoUnitario: r2(i.costoEstimado / i.cantidad) })),
    });
    setPestana('registrar');
    window.scrollTo({ top: 0, behavior: 'smooth' });
    notify('Orden cargada. Completa el número de factura y registra la compra.');
  };

  const registrar = async (e) => {
    e.preventDefault();
    setGuardando(true);
    try {
      const payload = {
        ...form,
        sucursalId,
        proveedorId: form.proveedorId || null,
        monto: Number(form.monto),
        items: form.items.filter((l) => l.insumoId).map((l) => ({ insumoId: l.insumoId, cantidad: Number(l.cantidad), costoUnitario: Number(l.costoUnitario) })),
      };
      const { compra, cuentaPorPagar } = await comprasService.crear(payload);
      notify(`Factura ${compra.numeroFactura} registrada${cuentaPorPagar ? ' y enviada a cuentas por pagar' : ''}`);
      setForm(FORM_VACIO);
      insumos.reload({ silencioso: true });
      refrescar();
    } catch (err) {
      notify(err.message, 'error');
    } finally {
      setGuardando(false);
    }
  };

  const r = resumen.data;
  return (
    <>
      <PageHeader titulo="Compras y proveedores" subtitulo="Registra facturas de insumos, gastos y cuentas por pagar" />

      <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard acento={false} icon={Truck} tono="azul" titulo="Compras del mes" valor={r ? money(r.comprasMes) : '—'} detalle="Costo de insumos" />
        <StatCard acento={false} icon={Receipt} tono="dorado" titulo="Gastos del mes" valor={r ? money(r.gastosMes) : '—'} detalle="Servicios y otros" />
        <StatCard acento={false} icon={HandCoins} tono="naranja" titulo="Cuentas por pagar" valor={r ? money(r.porPagar) : '—'} detalle={r?.vencidas ? <span className="text-error">{r.vencidas} vencidas</span> : 'Al día'} />
        <StatCard acento={false} icon={Building2} tono="verde" titulo="Proveedores" valor={r?.proveedores ?? '—'} />
      </div>

      {/* Pestañas: un solo bloque a la vez para que la pantalla no se sature */}
      <div className="mt-6 mb-5 flex flex-wrap gap-2 border-b border-borde" role="tablist" aria-label="Secciones de compras">
        {[
          ['registrar', 'Registrar compra'],
          ['cuentas', `Cuentas por pagar${cuentas.data ? ` (${cuentas.data.filter((c) => c.saldo > 0).length})` : ''}`],
          ['ordenes', `Órdenes de compra${ordenes.data?.length ? ` (${ordenes.data.length})` : ''}`],
          ['historial', 'Historial'],
        ].map(([id, label]) => (
          <button
            key={id}
            type="button"
            role="tab"
            aria-selected={pestana === id}
            onClick={() => setPestana(id)}
            className={`-mb-px border-b-[3px] px-4 py-2.5 font-display text-sm font-semibold transition ${pestana === id ? 'border-secundario text-texto' : 'border-transparent text-suave hover:text-texto'}`}
          >
            {label}
          </button>
        ))}
      </div>

      <div className="max-w-5xl">
        {pestana === 'registrar' && <Panel titulo={form.ordenCompraId ? 'Recibir orden de compra' : 'Registrar factura de compra'} icon={Receipt}>
          <form onSubmit={registrar} className="grid gap-3 p-5 sm:grid-cols-2">
            <div className="flex rounded-xl bg-superficie-2 p-1 sm:col-span-2" role="radiogroup" aria-label="Tipo de compra">
              {[
                ['costo', 'Compra de insumos (costo)'],
                ['gasto', 'Gasto operativo'],
              ].map(([id, label]) => (
                <button key={id} type="button" role="radio" aria-checked={form.tipo === id} onClick={() => setForm((f) => ({ ...f, tipo: id }))} className={`flex-1 rounded-lg px-3 py-2 font-display text-sm ${form.tipo === id ? 'bg-primario font-semibold text-white' : 'text-texto'}`}>
                  {label}
                </button>
              ))}
            </div>
            <Field label="Proveedor">
              <div className="flex gap-2">
                <select className="campo" value={form.proveedorId} onChange={(e) => setForm((f) => ({ ...f, proveedorId: e.target.value }))} required={form.tipo === 'costo'}>
                  <option value="">{form.tipo === 'costo' ? 'Selecciona…' : 'Otro (escribir abajo)'}</option>
                  {proveedores.data?.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.nombre}
                    </option>
                  ))}
                </select>
                <button type="button" onClick={() => setNuevoProveedor(true)} className="grid size-10 shrink-0 place-items-center rounded-xl border border-borde hover:bg-superficie-2" aria-label="Agregar proveedor">
                  <Plus className="size-5" />
                </button>
              </div>
            </Field>
            <Field label="N.º de factura / CCF">
              <input className="campo" required value={form.numeroFactura} onChange={(e) => setForm((f) => ({ ...f, numeroFactura: e.target.value }))} placeholder="CCF-000123" />
            </Field>
            <Field label="Condición de pago">
              <select className="campo" value={form.condicion} onChange={(e) => setForm((f) => ({ ...f, condicion: e.target.value }))}>
                <option value="contado">Contado</option>
                <option value="credito">Crédito (cuenta por pagar)</option>
              </select>
            </Field>
            {form.tipo === 'gasto' ? (
              <>
                <Field label="Monto sin IVA">
                  <input className="campo" type="number" min="0.01" step="0.01" required value={form.monto} onChange={(e) => setForm((f) => ({ ...f, monto: e.target.value }))} />
                </Field>
                {!form.proveedorId && (
                  <Field label="Nombre del proveedor del servicio">
                    <input className="campo" required value={form.proveedorNombre} onChange={(e) => setForm((f) => ({ ...f, proveedorNombre: e.target.value }))} placeholder="ANDA, CAESS, alquiler…" />
                  </Field>
                )}
                <Field label="Descripción del gasto" className="sm:col-span-2">
                  <input className="campo" required value={form.descripcion} onChange={(e) => setForm((f) => ({ ...f, descripcion: e.target.value }))} />
                </Field>
              </>
            ) : (
              <div className="sm:col-span-2">
                <p className="mb-2 font-display text-sm font-medium">Detalle de insumos</p>
                <div className="space-y-2">
                  {form.items.map((l, i) => {
                    const ins = insumos.data?.find((x) => x.id === l.insumoId);
                    return (
                      <div key={i} className="grid grid-cols-[1fr_6rem_6rem_2rem] gap-2">
                        <select className="campo" value={l.insumoId} onChange={(e) => setLinea(i, 'insumoId', e.target.value)} aria-label="Insumo">
                          <option value="">Insumo…</option>
                          {insumos.data?.map((x) => (
                            <option key={x.id} value={x.id}>
                              {x.nombre} ({x.unidad})
                            </option>
                          ))}
                        </select>
                        <input className="campo" type="number" min="0.001" step="0.001" placeholder={ins?.unidad ?? 'cant.'} value={l.cantidad} onChange={(e) => setLinea(i, 'cantidad', e.target.value)} required={Boolean(l.insumoId)} aria-label="Cantidad" />
                        <input className="campo" type="number" min="0" step="0.0001" placeholder="$ c/u" value={l.costoUnitario} onChange={(e) => setLinea(i, 'costoUnitario', e.target.value)} required={Boolean(l.insumoId)} aria-label="Costo unitario" />
                        <button type="button" className="rounded-lg hover:bg-superficie-2" onClick={() => setForm((f) => ({ ...f, items: f.items.filter((_, j) => j !== i) }))} aria-label="Quitar línea">
                          <Trash2 className="mx-auto size-4" />
                        </button>
                      </div>
                    );
                  })}
                </div>
                <Button variante="fantasma" icon={Plus} className="mt-1" onClick={() => setForm((f) => ({ ...f, items: [...f.items, { insumoId: '', cantidad: '', costoUnitario: '' }] }))}>
                  Agregar línea
                </Button>
              </div>
            )}
            <dl className="rounded-xl bg-superficie-2 p-3 text-sm sm:col-span-2">
              <div className="flex justify-between"><dt>Subtotal</dt><dd>{money(subtotal)}</dd></div>
              <div className="flex justify-between"><dt>IVA crédito fiscal 13 %</dt><dd>{money(iva)}</dd></div>
              <div className="flex justify-between font-display text-lg font-bold"><dt>Total</dt><dd>{money(subtotal + iva)}</dd></div>
            </dl>
            <div className="flex justify-end gap-2 sm:col-span-2">
              {form !== FORM_VACIO && (
                <Button variante="suave" onClick={() => setForm(FORM_VACIO)}>
                  Limpiar
                </Button>
              )}
              <Button type="submit" icon={Save} loading={guardando}>
                Registrar factura
              </Button>
            </div>
          </form>
        </Panel>}

        {pestana === 'cuentas' && (
          <Panel titulo="Cuentas por pagar" icon={HandCoins}>
            {cuentas.loading && !cuentas.data && <Cargando />}
            <ErrorBox error={cuentas.error} onRetry={cuentas.reload} />
            <div className="max-h-[560px] overflow-auto">
              <table className="tabla min-w-[480px]">
                <thead>
                  <tr>
                    <th>Proveedor</th>
                    <th>Vence</th>
                    <th className="text-right!">Saldo</th>
                    <th className="text-center!">Estado</th>
                    <th />
                  </tr>
                </thead>
                <tbody>
                  {cuentas.data?.map((c) => {
                    const [color, label] = ESTADO_CXP[c.estado];
                    return (
                      <tr key={c.id}>
                        <td>
                          {c.proveedorNombre}
                          <span className="block text-xs text-suave">{c.numeroFactura}</span>
                        </td>
                        <td>{fecha(c.fechaVencimiento)}</td>
                        <td className="text-right font-semibold">{money(c.saldo)}</td>
                        <td className="text-center">
                          <Badge color={color}>{label}</Badge>
                        </td>
                        <td>
                          {c.saldo > 0 && (
                            <button type="button" className="rounded-lg px-2 py-1 text-sm font-semibold text-acento hover:bg-superficie-2" onClick={() => setPago(c)}>
                              Pagar
                            </button>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </Panel>
        )}

        {pestana === 'ordenes' && (
          <Panel titulo="Órdenes de compra pendientes" icon={ClipboardList}>
            {ordenes.data?.length === 0 ? (
              <Vacio icon={PackageCheck} titulo="No hay órdenes pendientes">Genera pedidos desde el módulo Pronóstico.</Vacio>
            ) : (
              <ul className="divide-y divide-borde">
                {ordenes.data?.map((o) => (
                  <li key={o.id} className="flex flex-wrap items-center gap-3 px-5 py-3">
                    <div className="min-w-0 flex-1">
                      <p className="font-medium text-texto">{o.proveedorNombre}</p>
                      <p className="truncate text-sm text-suave">{o.items.map((i) => `${i.nombre} ${qty(i.cantidad, i.unidad)}`).join(', ')}</p>
                    </div>
                    <span className="font-display font-semibold">{money(o.total)}</span>
                    <Button variante="contorno" className="py-1.5" onClick={() => cargarOrden(o)}>
                      Recibir
                    </Button>
                  </li>
                ))}
              </ul>
            )}
          </Panel>
        )}
      </div>

      {pestana === 'historial' && <Panel titulo="Historial de compras y gastos" icon={History}>
        <div className="max-h-[560px] overflow-auto">
          <table className="tabla min-w-[760px]">
            <thead>
              <tr>
                <th>Fecha</th>
                <th>Factura</th>
                <th>Proveedor</th>
                <th>Tipo</th>
                <th>Detalle</th>
                <th>Condición</th>
                {/* Quién registró la factura (D-19): solo en pantallas anchas, para no apretar la tabla. */}
                <th className="hidden xl:table-cell">Registró</th>
                <th className="text-right!">Total</th>
              </tr>
            </thead>
            <tbody>
              {compras.data?.datos.map((c) => (
                <tr key={c.id}>
                  <td>{fecha(c.fecha)}</td>
                  <td>{c.numeroFactura}</td>
                  <td>{c.proveedorNombre}</td>
                  <td>
                    <Badge color={c.tipo === 'costo' ? 'azul' : 'amarillo'} punto={false}>
                      {c.tipo === 'costo' ? 'Costo' : 'Gasto'}
                    </Badge>
                  </td>
                  <td className="max-w-64 truncate text-suave">{c.tipo === 'costo' ? c.items.map((i) => i.nombre).join(', ') : c.descripcion}</td>
                  <td className="capitalize">{c.condicion === 'credito' ? 'Crédito' : 'Contado'}</td>
                  <td className="hidden text-suave xl:table-cell">{c.registradoPor ?? '—'}</td>
                  <td className="text-right font-semibold">{money(c.total)}</td>
                </tr>
              ))}
            </tbody>
          </table>
          {compras.loading && !compras.data && <Cargando />}
          <ErrorBox error={compras.error} onRetry={compras.reload} />
          {compras.data?.total === 0 && <Vacio titulo="Aún no hay compras en esta sucursal" />}
        </div>
        {/* La API devuelve una página a la vez (paginación en el servidor). */}
        <Pagination pagina={paginaHistorial} total={compras.data?.total ?? 0} porPagina={POR_PAGINA_HISTORIAL} onChange={setPaginaHistorial} etiqueta="compras" />
      </Panel>}

      <PagoModal cuenta={pago} onClose={() => setPago(null)} onPagado={() => { setPago(null); refrescar(); }} />
      <ProveedorModal abierto={nuevoProveedor} onClose={() => setNuevoProveedor(false)} onGuardado={(p) => { setNuevoProveedor(false); setForm((f) => ({ ...f, proveedorId: p.id })); refrescar(); }} />
    </>
  );
}

function PagoModal({ cuenta, onClose, onPagado }) {
  const { notify } = useApp();
  const [monto, setMonto] = useState('');
  const [enviando, setEnviando] = useState(false);
  useEffect(() => setMonto(cuenta ? String(cuenta.saldo) : ''), [cuenta]);
  if (!cuenta) return null;
  const pagar = async () => {
    setEnviando(true);
    try {
      const r = await comprasService.pagar(cuenta.id, Number(monto));
      notify(r.saldo === 0 ? `Cuenta con ${cuenta.proveedorNombre} pagada` : `Abono registrado. Saldo: ${money(r.saldo)}`);
      onPagado();
    } catch (err) {
      notify(err.message, 'error');
    } finally {
      setEnviando(false);
    }
  };
  return (
    <Modal
      abierto
      onClose={onClose}
      titulo={`Pagar a ${cuenta.proveedorNombre}`}
      pie={
        <>
          <Button variante="suave" onClick={onClose}>Cancelar</Button>
          <Button icon={HandCoins} loading={enviando} onClick={pagar}>Registrar pago</Button>
        </>
      }
    >
      <p className="mb-3 text-sm text-suave">
        Factura {cuenta.numeroFactura} · Monto original {money(cuenta.monto)} · Saldo {money(cuenta.saldo)}
      </p>
      <Field label="Monto a pagar" ayuda="Puedes registrar un abono parcial.">
        <input className="campo h-12 text-lg" type="number" min="0.01" max={cuenta.saldo} step="0.01" value={monto} onChange={(e) => setMonto(e.target.value)} />
      </Field>
    </Modal>
  );
}

function ProveedorModal({ abierto, onClose, onGuardado }) {
  const { notify } = useApp();
  const [form, setForm] = useState({ nombre: '', nit: '', nrc: '', contacto: '', telefono: '', correo: '', diasCredito: 15 });
  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));
  const guardar = async (e) => {
    e.preventDefault();
    try {
      const p = await comprasService.crearProveedor(form);
      notify(`Proveedor ${p.nombre} agregado`);
      onGuardado(p);
    } catch (err) {
      notify(err.message, 'error');
    }
  };
  return (
    <Modal abierto={abierto} onClose={onClose} titulo="Nuevo proveedor">
      <form onSubmit={guardar} className="grid gap-3 sm:grid-cols-2">
        <Field label="Nombre" className="sm:col-span-2"><input className="campo" required value={form.nombre} onChange={set('nombre')} /></Field>
        <Field label="NIT"><input className="campo" value={form.nit} onChange={set('nit')} /></Field>
        <Field label="NRC"><input className="campo" value={form.nrc} onChange={set('nrc')} /></Field>
        <Field label="Contacto"><input className="campo" value={form.contacto} onChange={set('contacto')} /></Field>
        <Field label="Teléfono"><input className="campo" value={form.telefono} onChange={set('telefono')} /></Field>
        <Field label="Correo"><input className="campo" type="email" value={form.correo} onChange={set('correo')} /></Field>
        <Field label="Días de crédito"><input className="campo" type="number" min="0" value={form.diasCredito} onChange={set('diasCredito')} /></Field>
        <div className="flex justify-end gap-2 sm:col-span-2">
          <Button variante="suave" onClick={onClose}>Cancelar</Button>
          <Button type="submit">Guardar proveedor</Button>
        </div>
      </form>
    </Modal>
  );
}
