import { useEffect, useMemo, useState } from 'react';
import { Box, TriangleAlert, CircleCheck, ChartColumn, Package, Filter, Eye, Pencil, ChefHat, Utensils, Calculator, TrendingUp, Plus, FileText, Search, Trash2 } from 'lucide-react';
import { useApp } from '../context/AppContext.jsx';
import { useFetch } from '../hooks/useFetch.js';
import { inventarioService, productosService, comprasService } from '../services/index.js';
import { PageHeader } from '../components/layout/Layout.jsx';
import { StatCard, Panel, Badge, Pagination, Modal, Field, Button, Aviso, Cargando, ErrorBox, Vacio } from '../components/ui/index.jsx';
import { FotoProducto, FotoInsumo } from '../components/decor/FoodArt.jsx';
import { money, qty, fecha, hora } from '../utils/format.js';

const ESTADOS = {
  disponible: ['verde', 'Disponible'],
  por_agotarse: ['amarillo', 'Por agotarse'],
  agotado: ['rojo', 'Agotado'],
};
const POR_PAGINA = 7;

export default function Inventario() {
  const { sucursalId, notify, refrescar, version } = useApp();
  const [vista, setVista] = useState('insumos');
  const [filtro, setFiltro] = useState('');
  const [busqueda, setBusqueda] = useState('');
  const [pagina, setPagina] = useState(1);
  const [productoReceta, setProductoReceta] = useState('prod-pupusa-queso');
  const [modal, setModal] = useState(null); // { tipo: 'entrada' | 'editar' | 'ver' | 'nuevo' | 'recetas', item }

  const resumen = useFetch(() => inventarioService.resumen(sucursalId), [sucursalId, version]);
  const insumos = useFetch(() => inventarioService.insumos(sucursalId), [sucursalId, version]);
  const productos = useFetch(() => productosService.listar({ sucursalId }), [sucursalId, version]);
  const proveedores = useFetch(() => comprasService.proveedores(), []);
  const alertas = useFetch(() => inventarioService.alertas(sucursalId), [sucursalId, version]);

  useEffect(() => setPagina(1), [filtro, busqueda, vista, sucursalId]);

  const filas = useMemo(() => {
    const q = busqueda.toLowerCase();
    if (vista === 'insumos') {
      return (insumos.data ?? []).filter((i) => (!filtro || i.estado === filtro) && i.nombre.toLowerCase().includes(q));
    }
    return (productos.data ?? [])
      .filter((p) => p.tipo === 'reventa')
      .map((p) => {
        const existencia = p.disponibles;
        const estado = existencia <= 0 ? 'agotado' : existencia < p.stockMinimo ? 'por_agotarse' : 'disponible';
        return { ...p, existencia, unidad: 'und', estado, esReventa: true };
      })
      .filter((p) => (!filtro || p.estado === filtro) && p.nombre.toLowerCase().includes(q));
  }, [vista, insumos.data, productos.data, filtro, busqueda]);

  const pagina_ = filas.slice((pagina - 1) * POR_PAGINA, pagina * POR_PAGINA);
  const receta = productos.data?.find((p) => p.id === productoReceta) ?? productos.data?.find((p) => p.tipo === 'elaborado');

  const alGuardar = (mensaje) => {
    notify(mensaje);
    setModal(null);
    refrescar();
  };

  const r = resumen.data;
  return (
    <>
      <PageHeader titulo="Inventario y recetas" subtitulo="Controla tus existencias y consulta las recetas" />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard acento={false} icon={Box} tono="azul" titulo="Total de insumos" valor={r?.totalInsumos ?? '—'} />
        <StatCard acento={false} icon={TriangleAlert} tono="naranja" titulo="Productos por agotarse" valor={r?.porAgotarse ?? '—'} valorClass="text-naranja!" />
        <StatCard acento={false} icon={CircleCheck} tono="verde" titulo="Productos en stock" valor={r?.enStock ?? '—'} valorClass="text-exito!" />
        <StatCard acento={false} icon={ChartColumn} tono="azul" titulo="Valor en inventario" valor={r ? money(r.valorInventario) : '—'} />
      </div>

      <div className="mt-5 grid gap-5 xl:grid-cols-[1.25fr_1fr]">
        <Panel
          titulo={vista === 'insumos' ? 'Listado de insumos' : 'Productos empacados'}
          icon={Package}
          acciones={
            <label className="flex items-center gap-2 rounded-lg px-2 py-1 text-sm hover:bg-white/10">
              <Filter className="size-5" />
              <select value={filtro} onChange={(e) => setFiltro(e.target.value)} className="bg-transparent font-display outline-none [&>option]:text-texto" aria-label="Filtrar por estado">
                <option value="">Filtros</option>
                <option value="disponible">Disponibles</option>
                <option value="por_agotarse">Por agotarse</option>
                <option value="agotado">Agotados</option>
              </select>
            </label>
          }
        >
          <div className="flex flex-wrap items-center gap-2 border-b border-borde px-4 py-2.5">
            <div className="flex rounded-lg bg-superficie-2 p-1 text-sm">
              {[
                ['insumos', 'Insumos'],
                ['reventa', 'Empacados'],
              ].map(([id, label]) => (
                <button key={id} type="button" onClick={() => setVista(id)} className={`rounded-md px-3 py-1 font-display ${vista === id ? 'bg-superficie font-semibold text-primario shadow-card' : 'text-suave'}`}>
                  {label}
                </button>
              ))}
            </div>
            <div className="relative ml-auto min-w-40 flex-1 sm:max-w-56">
              <Search className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-suave" />
              <input className="campo py-1.5 pl-8" placeholder="Buscar…" value={busqueda} onChange={(e) => setBusqueda(e.target.value)} aria-label="Buscar en el listado" />
            </div>
            {vista === 'insumos' && (
              <Button variante="suave" icon={Plus} className="py-1.5" onClick={() => setModal({ tipo: 'nuevo' })}>
                Nuevo insumo
              </Button>
            )}
          </div>
          {insumos.loading && !insumos.data && <Cargando />}
          <ErrorBox error={insumos.error} onRetry={insumos.reload} />
          <div className="overflow-x-auto">
            <table className="tabla min-w-[620px]">
              <thead>
                <tr>
                  <th>{vista === 'insumos' ? 'Ingrediente' : 'Producto'}</th>
                  <th className="text-center!">Existencia</th>
                  <th className="text-center!">Stock mínimo</th>
                  <th className="text-center!">Estado</th>
                  <th className="text-center!">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {pagina_.map((i) => {
                  const [color, label] = ESTADOS[i.estado];
                  return (
                    <tr key={i.id}>
                      <td>
                        <div className="flex items-center gap-3">
                          {i.esReventa ? <FotoProducto producto={i} className="h-10 w-14 shrink-0 rounded-lg" /> : <FotoInsumo insumo={i} className="h-10 w-14 shrink-0 rounded-lg" />}
                          <span className="text-texto">{i.nombre}</span>
                        </div>
                      </td>
                      <td className="text-center">{qty(i.existencia, i.unidad)}</td>
                      <td className="text-center">{qty(i.stockMinimo, i.unidad)}</td>
                      <td className="text-center">
                        <Badge color={color}>{label}</Badge>
                      </td>
                      <td>
                        <div className="flex justify-center gap-1">
                          {!i.esReventa && (
                            <button type="button" className="rounded-lg p-1.5 hover:bg-superficie-2" onClick={() => setModal({ tipo: 'ver', item: i })} aria-label={`Ver movimientos de ${i.nombre}`}>
                              <Eye className="size-5" />
                            </button>
                          )}
                          <button
                            type="button"
                            className="rounded-lg p-1.5 hover:bg-superficie-2"
                            onClick={() => setModal({ tipo: i.esReventa ? 'entrada' : 'editar', item: i })}
                            aria-label={i.esReventa ? `Registrar entrada de ${i.nombre}` : `Editar ${i.nombre}`}
                          >
                            {i.esReventa ? <Plus className="size-5" /> : <Pencil className="size-5" />}
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          {filas.length === 0 && !insumos.loading && <Vacio titulo="No hay registros con ese filtro" />}
          <Pagination pagina={pagina} total={filas.length} porPagina={POR_PAGINA} onChange={setPagina} etiqueta={vista === 'insumos' ? 'insumos' : 'productos'} />
        </Panel>

        <Panel
          titulo="Receta del platillo"
          icon={ChefHat}
          acciones={
            <select className="max-w-44 rounded-lg bg-white/10 px-2 py-1 text-sm outline-none [&>option]:text-texto" value={receta?.id ?? ''} onChange={(e) => setProductoReceta(e.target.value)} aria-label="Platillo">
              {productos.data
                ?.filter((p) => p.tipo === 'elaborado')
                .map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.nombre}
                  </option>
                ))}
            </select>
          }
        >
          {!receta ? (
            <Cargando />
          ) : (
            <div className="p-4">
              <div className="flex flex-col gap-4 sm:flex-row">
                <div className="h-40 shrink-0 overflow-hidden rounded-xl bg-superficie-2 sm:w-56">
                  <FotoProducto producto={receta} className="h-full w-full" />
                </div>
                <div className="flex-1 border-b border-secundario/60 pb-3">
                  <h3 className="font-display text-2xl font-bold text-texto">{receta.nombre}</h3>
                  <p className="mt-1 text-texto/85">{receta.descripcion}</p>
                  <p className="mt-2 text-sm text-suave">
                    Se pueden preparar <b className="text-texto">{receta.disponibles}</b> con el stock actual · Precio {money(receta.precio)}
                  </p>
                </div>
              </div>
              <h4 className="mt-4 mb-2 flex items-center gap-2 font-display font-semibold text-texto">
                <Utensils className="size-5" /> Ingredientes
              </h4>
              <table className="tabla overflow-hidden rounded-lg border border-borde">
                <thead>
                  <tr>
                    <th>Ingrediente</th>
                    <th className="text-center!">Cantidad</th>
                    <th className="text-right!">Costo aprox.</th>
                  </tr>
                </thead>
                <tbody>
                  {receta.receta.map((ing) => (
                    <tr key={ing.insumoId}>
                      <td>{ing.nombre}</td>
                      <td className="text-center">{qty(ing.cantidad, ing.unidad)}</td>
                      <td className="text-right">{money(ing.costo)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <div className="mt-3 flex flex-wrap items-center justify-around gap-3 rounded-xl bg-secundario/20 px-4 py-3">
                <span className="flex items-center gap-2">
                  <Calculator className="size-6 text-primario" /> Costo por platillo: <b className="font-display text-xl text-texto">{money(receta.costo)}</b>
                </span>
                <span className="hidden h-8 w-px bg-primario/30 sm:block" />
                <span className="flex items-center gap-2">
                  <TrendingUp className="size-6 text-primario" /> Margen: <b className="font-display text-xl text-texto">{Math.round(receta.margen)}%</b>
                </span>
              </div>
            </div>
          )}
        </Panel>
      </div>

      <div className="mt-5 grid gap-4 xl:grid-cols-[1.25fr_1fr]">
        <Aviso
          titulo="Alertas del sistema"
          accion={
            <button type="button" onClick={() => setFiltro('por_agotarse')} className="text-sm font-medium text-acento hover:underline">
              Ver detalles →
            </button>
          }
        >
          {alertas.data?.length
            ? `${alertas.data.length} ${alertas.data.length === 1 ? 'producto requiere' : 'productos requieren'} reabastecimiento: ${alertas.data.slice(0, 4).map((a) => a.nombre).join(', ')}${alertas.data.length > 4 ? '…' : ''}`
            : 'Todos los insumos están sobre su stock mínimo.'}
        </Aviso>
        <div className="grid grid-cols-2 gap-4">
          <Button className="h-full min-h-16 text-lg" icon={Plus} onClick={() => setModal({ tipo: 'entrada' })}>
            Registrar entrada
          </Button>
          <Button variante="contorno" className="h-full min-h-16 text-lg" icon={FileText} onClick={() => setModal({ tipo: 'recetas' })}>
            Ver recetas
          </Button>
        </div>
      </div>

      <EntradaModal abierto={modal?.tipo === 'entrada'} item={modal?.item} insumos={insumos.data ?? []} productos={productos.data ?? []} sucursalId={sucursalId} onClose={() => setModal(null)} onGuardado={alGuardar} />
      <InsumoModal abierto={modal?.tipo === 'editar' || modal?.tipo === 'nuevo'} insumo={modal?.item} proveedores={proveedores.data ?? []} onClose={() => setModal(null)} onGuardado={alGuardar} />
      <MovimientosModal abierto={modal?.tipo === 'ver'} insumo={modal?.item} sucursalId={sucursalId} onClose={() => setModal(null)} />
      <RecetasModal abierto={modal?.tipo === 'recetas'} productos={productos.data ?? []} insumos={insumos.data ?? []} onClose={() => setModal(null)} onGuardado={alGuardar} onVer={(id) => { setProductoReceta(id); setModal(null); }} />
    </>
  );
}

/* ---------- Modales ---------- */

function EntradaModal({ abierto, item, insumos, productos, sucursalId, onClose, onGuardado }) {
  const { notify } = useApp();
  const [form, setForm] = useState({ id: '', cantidad: '', costoUnitario: '' });
  const [guardando, setGuardando] = useState(false);
  useEffect(() => {
    if (abierto) setForm({ id: item?.id ?? '', cantidad: '', costoUnitario: '' });
  }, [abierto, item]);
  const reventa = productos.filter((p) => p.tipo === 'reventa');
  const esReventa = reventa.some((p) => p.id === form.id);
  const insumo = insumos.find((i) => i.id === form.id);

  const submit = async (e) => {
    e.preventDefault();
    setGuardando(true);
    try {
      const payload = esReventa
        ? { productoId: form.id, sucursalId, cantidad: Number(form.cantidad) }
        : { insumoId: form.id, sucursalId, cantidad: Number(form.cantidad), costoUnitario: form.costoUnitario };
      await inventarioService.registrarEntrada(payload);
      onGuardado('Entrada registrada en el inventario');
    } catch (err) {
      notify(err.message, 'error');
    } finally {
      setGuardando(false);
    }
  };

  return (
    <Modal abierto={abierto} onClose={onClose} titulo="Registrar entrada de inventario">
      <form onSubmit={submit} className="grid gap-3">
        <Field label="Insumo o producto">
          <select className="campo" required value={form.id} onChange={(e) => setForm((f) => ({ ...f, id: e.target.value }))}>
            <option value="">Selecciona…</option>
            <optgroup label="Insumos">
              {insumos.map((i) => (
                <option key={i.id} value={i.id}>
                  {i.nombre} ({i.unidad})
                </option>
              ))}
            </optgroup>
            <optgroup label="Empacados (reventa)">
              {reventa.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.nombre}
                </option>
              ))}
            </optgroup>
          </select>
        </Field>
        <div className="grid gap-3 sm:grid-cols-2">
          <Field label={`Cantidad ${insumo ? `(${insumo.unidad})` : '(und)'}`}>
            <input className="campo" type="number" min="0.001" step="0.001" required value={form.cantidad} onChange={(e) => setForm((f) => ({ ...f, cantidad: e.target.value }))} />
          </Field>
          {!esReventa && (
            <Field label="Costo unitario" ayuda={insumo ? `Costo promedio actual: ${money(insumo.costoUnitario)}` : undefined}>
              <input className="campo" type="number" min="0" step="0.01" value={form.costoUnitario} onChange={(e) => setForm((f) => ({ ...f, costoUnitario: e.target.value }))} placeholder="Opcional" />
            </Field>
          )}
        </div>
        <p className="text-xs text-suave">Para registrar la factura del proveedor y la cuenta por pagar, usa el módulo Compras.</p>
        <div className="flex justify-end gap-2">
          <Button variante="suave" onClick={onClose}>
            Cancelar
          </Button>
          <Button type="submit" loading={guardando}>
            Registrar entrada
          </Button>
        </div>
      </form>
    </Modal>
  );
}

function InsumoModal({ abierto, insumo, proveedores, onClose, onGuardado }) {
  const { notify } = useApp();
  const vacio = { nombre: '', unidad: 'kg', stockMinimo: '', costoUnitario: '', proveedorId: '' };
  const [form, setForm] = useState(vacio);
  const [guardando, setGuardando] = useState(false);
  useEffect(() => {
    if (abierto) setForm(insumo ? { nombre: insumo.nombre, unidad: insumo.unidad, stockMinimo: insumo.stockMinimo, costoUnitario: insumo.costoUnitario, proveedorId: insumo.proveedorId ?? '' } : vacio);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [abierto, insumo]);
  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  const submit = async (e) => {
    e.preventDefault();
    setGuardando(true);
    try {
      const data = { ...form, proveedorId: form.proveedorId || null };
      if (insumo) await inventarioService.actualizarInsumo(insumo.id, data);
      else await inventarioService.crearInsumo(data);
      onGuardado(insumo ? `${form.nombre} actualizado` : `${form.nombre} agregado al inventario`);
    } catch (err) {
      notify(err.message, 'error');
    } finally {
      setGuardando(false);
    }
  };

  return (
    <Modal abierto={abierto} onClose={onClose} titulo={insumo ? `Editar ${insumo.nombre}` : 'Nuevo insumo'}>
      <form onSubmit={submit} className="grid gap-3 sm:grid-cols-2">
        <Field label="Nombre" className="sm:col-span-2">
          <input className="campo" required value={form.nombre} onChange={set('nombre')} />
        </Field>
        <Field label="Unidad">
          <select className="campo" value={form.unidad} onChange={set('unidad')}>
            <option value="kg">Kilogramos (kg)</option>
            <option value="lt">Litros (lt)</option>
            <option value="und">Unidades (und)</option>
          </select>
        </Field>
        <Field label="Stock mínimo">
          <input className="campo" type="number" min="0" step="0.01" required value={form.stockMinimo} onChange={set('stockMinimo')} />
        </Field>
        <Field label="Costo unitario">
          <input className="campo" type="number" min="0" step="0.0001" required value={form.costoUnitario} onChange={set('costoUnitario')} />
        </Field>
        <Field label="Proveedor">
          <select className="campo" value={form.proveedorId} onChange={set('proveedorId')}>
            <option value="">Sin proveedor</option>
            {proveedores.map((p) => (
              <option key={p.id} value={p.id}>
                {p.nombre}
              </option>
            ))}
          </select>
        </Field>
        <div className="flex justify-end gap-2 sm:col-span-2">
          <Button variante="suave" onClick={onClose}>
            Cancelar
          </Button>
          <Button type="submit" loading={guardando}>
            Guardar
          </Button>
        </div>
      </form>
    </Modal>
  );
}

function MovimientosModal({ abierto, insumo, sucursalId, onClose }) {
  const { data, loading } = useFetch(() => (abierto ? inventarioService.movimientos(sucursalId) : Promise.resolve([])), [abierto, sucursalId]);
  if (!insumo) return null;
  const movs = (data ?? []).filter((m) => m.insumoId === insumo.id);
  return (
    <Modal abierto={abierto} onClose={onClose} titulo={insumo.nombre} ancho="max-w-xl">
      <dl className="mb-4 grid grid-cols-2 gap-3 text-sm sm:grid-cols-4">
        {[
          ['Existencia', qty(insumo.existencia, insumo.unidad)],
          ['Mínimo', qty(insumo.stockMinimo, insumo.unidad)],
          ['Costo prom.', money(insumo.costoUnitario)],
          ['Valor', money(insumo.valor)],
        ].map(([k, v]) => (
          <div key={k} className="rounded-xl bg-superficie-2 p-3">
            <dt className="text-suave">{k}</dt>
            <dd className="font-display font-semibold text-texto">{v}</dd>
          </div>
        ))}
      </dl>
      <p className="mb-2 text-sm text-suave">Proveedor: {insumo.proveedorNombre}</p>
      <h4 className="mb-2 font-display font-semibold">Movimientos recientes</h4>
      {loading ? (
        <Cargando />
      ) : movs.length === 0 ? (
        <Vacio titulo="Sin movimientos recientes">Las ventas, compras y entradas de este insumo aparecerán aquí.</Vacio>
      ) : (
        <table className="tabla">
          <tbody>
            {movs.map((m) => (
              <tr key={m.id}>
                <td>{fecha(m.fecha)} {hora(m.fecha)}</td>
                <td className="capitalize">{m.tipo}</td>
                <td>{m.referencia}</td>
                <td className={`text-right font-semibold ${m.cantidad < 0 ? 'text-error' : 'text-exito'}`}>{qty(m.cantidad, insumo.unidad)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </Modal>
  );
}

/** Lista de recetas y alta de un nuevo platillo con su receta. */
function RecetasModal({ abierto, productos, insumos, onClose, onGuardado, onVer }) {
  const { notify } = useApp();
  const { data: categorias } = useFetch(() => productosService.categorias(), []);
  const [creando, setCreando] = useState(false);
  const [form, setForm] = useState({ nombre: '', precio: '', categoriaId: 'cat-antojitos', descripcion: '', imagen: null, receta: [{ insumoId: '', cantidad: '' }] });
  const [guardando, setGuardando] = useState(false);

  const elaborados = productos.filter((p) => p.tipo === 'elaborado');
  const setLinea = (i, k, v) => setForm((f) => ({ ...f, receta: f.receta.map((l, j) => (j === i ? { ...l, [k]: v } : l)) }));

  const guardar = async (e) => {
    e.preventDefault();
    setGuardando(true);
    try {
      const receta = form.receta.filter((l) => l.insumoId).map((l) => ({ insumoId: l.insumoId, cantidad: Number(l.cantidad) }));
      await productosService.crear({ ...form, precio: Number(form.precio), tipo: 'elaborado', receta, arte: 'pupusa' });
      setCreando(false);
      onGuardado(`${form.nombre} agregado al menú`);
    } catch (err) {
      notify(err.message, 'error');
    } finally {
      setGuardando(false);
    }
  };

  return (
    <Modal abierto={abierto} onClose={onClose} titulo={creando ? 'Nuevo platillo' : `Recetas del menú (${elaborados.length} platillos)`} ancho="max-w-3xl">
      {!creando ? (
        <>
          <div className="mb-3 flex justify-end">
            <Button icon={Plus} onClick={() => setCreando(true)}>
              Nuevo platillo
            </Button>
          </div>
          <div className="overflow-x-auto">
            <table className="tabla min-w-[560px]">
              <thead>
                <tr>
                  <th>Platillo</th>
                  <th className="text-right!">Precio</th>
                  <th className="text-right!">Costo</th>
                  <th className="text-right!">Margen</th>
                  <th className="text-center!">Insumos</th>
                  <th />
                </tr>
              </thead>
              <tbody>
                {elaborados.map((p) => (
                  <tr key={p.id}>
                    <td>
                      <div className="flex items-center gap-2">
                        <FotoProducto producto={p} className="size-9 rounded-md" /> {p.nombre}
                      </div>
                    </td>
                    <td className="text-right">{money(p.precio)}</td>
                    <td className="text-right">{money(p.costo)}</td>
                    <td className="text-right font-semibold">{Math.round(p.margen)}%</td>
                    <td className="text-center">{p.receta.length}</td>
                    <td>
                      <button type="button" className="text-sm text-acento hover:underline" onClick={() => onVer(p.id)}>
                        Ver receta
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      ) : (
        <form onSubmit={guardar} className="grid gap-3 sm:grid-cols-3">
          <Field label="Nombre" className="sm:col-span-2">
            <input className="campo" required value={form.nombre} onChange={(e) => setForm((f) => ({ ...f, nombre: e.target.value }))} />
          </Field>
          <Field label="Precio de venta (sin IVA)">
            <input className="campo" type="number" min="0.01" step="0.01" required value={form.precio} onChange={(e) => setForm((f) => ({ ...f, precio: e.target.value }))} />
          </Field>
          <Field label="Categoría">
            <select className="campo" value={form.categoriaId} onChange={(e) => setForm((f) => ({ ...f, categoriaId: e.target.value }))}>
              {categorias?.filter((c) => c.id !== 'cat-reventa').map((c) => (
                <option key={c.id} value={c.id}>
                  {c.nombre}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Descripción" className="sm:col-span-2">
            <input className="campo" value={form.descripcion} onChange={(e) => setForm((f) => ({ ...f, descripcion: e.target.value }))} />
          </Field>
          <Field label="Foto del platillo (opcional)" ayuda="PNG o JPG, máximo 1 MB. Si no subes una, se usa una ilustración." className="sm:col-span-3">
            <div className="flex items-center gap-3">
              {form.imagen && <img src={form.imagen} alt="" className="size-14 rounded-lg object-cover" />}
              <input
                type="file"
                accept="image/png,image/jpeg"
                className="text-sm"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (!file) return;
                  if (file.size > 1024 * 1024) {
                    notify('La foto supera el máximo de 1 MB', 'error');
                    return;
                  }
                  const reader = new FileReader();
                  reader.onload = () => setForm((f) => ({ ...f, imagen: reader.result }));
                  reader.readAsDataURL(file);
                }}
              />
            </div>
          </Field>
          <div className="sm:col-span-3">
            <p className="mb-2 font-display text-sm font-medium">Receta (cantidad por platillo en la unidad del insumo)</p>
            <div className="space-y-2">
              {form.receta.map((l, i) => {
                const ins = insumos.find((x) => x.id === l.insumoId);
                return (
                  <div key={i} className="flex gap-2">
                    <select className="campo flex-1" value={l.insumoId} onChange={(e) => setLinea(i, 'insumoId', e.target.value)} aria-label="Insumo">
                      <option value="">Insumo…</option>
                      {insumos.map((x) => (
                        <option key={x.id} value={x.id}>
                          {x.nombre}
                        </option>
                      ))}
                    </select>
                    <input className="campo w-32" type="number" min="0.001" step="0.001" placeholder={ins?.unidad ?? 'cant.'} value={l.cantidad} onChange={(e) => setLinea(i, 'cantidad', e.target.value)} aria-label="Cantidad" required={Boolean(l.insumoId)} />
                    <button type="button" className="rounded-lg px-2 hover:bg-superficie-2" onClick={() => setForm((f) => ({ ...f, receta: f.receta.filter((_, j) => j !== i) }))} aria-label="Quitar insumo">
                      <Trash2 className="size-4" />
                    </button>
                  </div>
                );
              })}
            </div>
            <Button variante="fantasma" icon={Plus} className="mt-2" onClick={() => setForm((f) => ({ ...f, receta: [...f.receta, { insumoId: '', cantidad: '' }] }))}>
              Agregar insumo
            </Button>
          </div>
          <div className="flex justify-end gap-2 sm:col-span-3">
            <Button variante="suave" onClick={() => setCreando(false)}>
              Volver
            </Button>
            <Button type="submit" loading={guardando}>
              Guardar platillo
            </Button>
          </div>
        </form>
      )}
    </Modal>
  );
}
