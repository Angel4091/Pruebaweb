import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Utensils, ShoppingBag, Bike, Search, ShoppingCart, Trash2, Minus, Plus, X, User, Banknote, CreditCard, Bitcoin, Receipt, Printer, Lock, Globe,
} from 'lucide-react';
import { useApp } from '../context/AppContext.jsx';
import { useFetch } from '../hooks/useFetch.js';
import { productosService, clientesService, ventasService, cajaService, pedidosService } from '../services/index.js';
import { PageHeader } from '../components/layout/Layout.jsx';
import { Button, Modal, Field, Cargando, ErrorBox, Vacio, Aviso } from '../components/ui/index.jsx';
import { FotoProducto } from '../components/decor/FoodArt.jsx';
import { Logo } from '../components/decor/Decor.jsx';
import { money, fecha, hora, ETIQUETA_METODO, ETIQUETA_ORDEN, ETIQUETA_COMPROBANTE } from '../utils/format.js';

const IVA = 0.13;
const r2 = (n) => Math.round((n + Number.EPSILON) * 100) / 100;

const ORDENES = [
  { id: 'comer_aqui', label: 'Comer aquí', icon: Utensils },
  { id: 'para_llevar', label: 'Para llevar', icon: ShoppingBag },
  { id: 'delivery', label: 'Delivery', icon: Bike },
];
const METODOS = [
  { id: 'efectivo', label: 'Efectivo', icon: Banknote },
  { id: 'tarjeta', label: 'Tarjeta', icon: CreditCard },
  { id: 'bitcoin', label: 'Chivo', icon: Bitcoin },
];

export default function PuntoVenta() {
  const { sucursalId, sucursal, notify, refrescar } = useApp();
  const [busqueda, setBusqueda] = useState('');
  const [categoria, setCategoria] = useState('');
  const [carrito, setCarrito] = useState([]);
  const [tipoOrden, setTipoOrden] = useState('comer_aqui');
  const [metodo, setMetodo] = useState('efectivo');
  const [comprobante, setComprobante] = useState('FCF');
  const [cliente, setCliente] = useState(null);
  const [cajaId, setCajaId] = useState('');
  const [pedidoActivo, setPedidoActivo] = useState(null);
  const [cobrando, setCobrando] = useState(false);
  const [ticket, setTicket] = useState(null);

  const productos = useFetch(() => productosService.listar({ sucursalId }), [sucursalId]);
  const categorias = useFetch(() => productosService.categorias(), []);
  const cajas = useFetch(() => cajaService.listar(sucursalId), [sucursalId]);
  const enLinea = useFetch(() => pedidosService.listar(sucursalId, { porCobrar: true }), [sucursalId]);

  // Selecciona automáticamente la primera caja abierta de la sucursal.
  useEffect(() => {
    if (!cajas.data) return;
    const actual = cajas.data.find((c) => c.id === cajaId);
    if (!actual) setCajaId((cajas.data.find((c) => c.estado === 'abierta') ?? cajas.data[0])?.id ?? '');
  }, [cajas.data, cajaId]);

  // Revisa cada 15 segundos si llegaron pedidos en línea para cobrar.
  useEffect(() => {
    const t = setInterval(() => enLinea.reload({ silencioso: true }), 15_000);
    return () => clearInterval(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [enLinea.reload]);

  useEffect(() => {
    setCarrito([]);
    setPedidoActivo(null);
  }, [sucursalId]);

  const visibles = useMemo(() => {
    const q = busqueda.toLowerCase().trim();
    return (productos.data ?? []).filter((p) => (!categoria || p.categoriaId === categoria) && (!q || p.nombre.toLowerCase().includes(q)));
  }, [productos.data, busqueda, categoria]);

  const subtotal = r2(carrito.reduce((a, i) => a + i.precio * i.cantidad, 0));
  const iva = r2(subtotal * IVA);
  const total = r2(subtotal + iva);
  const caja = cajas.data?.find((c) => c.id === cajaId);

  const agregar = (p) => {
    setCarrito((c) => {
      const existe = c.find((i) => i.id === p.id);
      const cantidad = (existe?.cantidad ?? 0) + 1;
      if (cantidad > p.disponibles) {
        notify(`Solo alcanza para ${p.disponibles} ${p.nombre.toLowerCase()} con el inventario actual`, 'error');
        return c;
      }
      return existe ? c.map((i) => (i.id === p.id ? { ...i, cantidad } : i)) : [...c, { id: p.id, nombre: p.nombre, precio: p.precio, arte: p.arte, disponibles: p.disponibles, cantidad: 1 }];
    });
  };
  const cambiar = (id, delta) =>
    setCarrito((c) => c.map((i) => (i.id === id ? { ...i, cantidad: Math.min(i.disponibles, i.cantidad + delta) } : i)).filter((i) => i.cantidad > 0));
  const quitar = (id) => setCarrito((c) => c.filter((i) => i.id !== id));
  const limpiar = () => {
    setCarrito([]);
    setPedidoActivo(null);
    setCliente(null);
  };

  /** Carga un pedido en línea en el carrito para cobrarlo. */
  const cargarPedido = (pedido) => {
    const catalogo = productos.data ?? [];
    setCarrito(
      pedido.items.map((it) => {
        const p = catalogo.find((x) => x.id === it.productoId);
        return { id: it.productoId, nombre: it.nombre, precio: it.precioUnitario, arte: p?.arte, disponibles: Math.max(p?.disponibles ?? it.cantidad, it.cantidad), cantidad: it.cantidad };
      }),
    );
    setTipoOrden(pedido.tipoOrden);
    setMetodo(pedido.metodoPago);
    setCliente({ id: pedido.clienteId, nombre: pedido.clienteNombre, tipo: 'consumidor_final' });
    setPedidoActivo(pedido);
  };

  const puedeCobrar = carrito.length > 0 && caja?.estado === 'abierta';

  const iniciarCobro = () => {
    if (comprobante === 'CCF' && cliente?.tipo !== 'contribuyente') {
      notify('Para un Crédito Fiscal selecciona un cliente contribuyente (con NIT y NRC).', 'error');
      return;
    }
    setCobrando(true);
  };

  const confirmarVenta = async (pago) => {
    try {
      const venta = await ventasService.crear({
        cajaId,
        tipoOrden,
        tipoComprobante: comprobante,
        clienteId: cliente?.id ?? 'cli-cf',
        metodoPago: metodo,
        montoRecibido: pago.montoRecibido,
        referenciaPago: pago.referencia,
        pedidoId: pedidoActivo?.id,
        items: carrito.map((i) => ({ productoId: i.id, cantidad: i.cantidad })),
      });
      setCobrando(false);
      setTicket(venta);
      limpiar();
      notify(`Venta registrada: ${venta.numero}. La comanda ya está en cocina.`);
      productos.reload({ silencioso: true });
      cajas.reload({ silencioso: true });
      enLinea.reload({ silencioso: true });
      refrescar();
    } catch (err) {
      notify(err.message, 'error');
      throw err;
    }
  };

  const porCobrar = (enLinea.data ?? []).filter((p) => p.id !== pedidoActivo?.id);

  return (
    <>
      <PageHeader titulo="Punto de venta" subtitulo="Seleccione productos y complete su orden">
        <div className="flex flex-wrap gap-2" role="radiogroup" aria-label="Tipo de orden">
          {ORDENES.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              type="button"
              role="radio"
              aria-checked={tipoOrden === id}
              onClick={() => setTipoOrden(id)}
              className={`flex h-11 min-w-36 items-center justify-center gap-2 rounded-xl px-4 font-display font-medium transition ${
                tipoOrden === id ? 'bg-primario text-white shadow-[inset_0_-4px_0_var(--c-secundario)]' : 'card text-texto hover:bg-superficie-2'
              }`}
            >
              <Icon className="size-5" /> {label}
            </button>
          ))}
        </div>
      </PageHeader>

      {caja && caja.estado !== 'abierta' && (
        <Aviso
          className="mb-6"
          titulo={`${caja.nombre} está cerrada`}
          accion={
            <Link to="/caja" className="rounded-xl bg-primario px-4 py-2 font-display text-sm font-semibold text-white">
              Abrir caja
            </Link>
          }
        >
          Abre la caja en el módulo Caja para poder cobrar en {sucursal?.nombre}.
        </Aviso>
      )}

      {porCobrar.length > 0 && (
        <section className="card anim-entrada mb-6 flex flex-wrap items-center gap-3 border-l-4! border-l-acento! px-5 py-3" aria-label="Pedidos en línea por cobrar">
          <h2 className="flex items-center gap-2 font-display font-semibold text-texto">
            <Globe className="size-5 text-acento" /> Pedidos en línea por cobrar
          </h2>
          <div className="flex flex-1 flex-wrap gap-2">
            {porCobrar.map((p) => (
              <button
                key={p.id}
                type="button"
                onClick={() => cargarPedido(p)}
                className="flex items-center gap-2 rounded-full border border-borde bg-superficie px-3 py-1.5 text-sm hover:border-acento hover:bg-acento/5"
                title={p.items.map((i) => `${i.cantidad} × ${i.nombre}`).join(', ')}
              >
                <b className="font-display">{p.numero}</b> {p.clienteNombre?.split(' ')[0]} · {money(p.total)}
                <span className="font-semibold text-acento">Cobrar</span>
              </button>
            ))}
          </div>
        </section>
      )}

      <div className="grid items-start gap-6 xl:grid-cols-[minmax(0,1fr)_400px]">
        {/* Catálogo */}
        <section className="card anim-entrada p-4 sm:p-5">
          <div className="mb-4 flex flex-wrap gap-3">
            <div className="relative min-w-52 flex-1">
              <Search className="pointer-events-none absolute top-1/2 left-3.5 size-5 -translate-y-1/2 text-texto" />
              <input className="campo h-11 pl-11" placeholder="Buscar platillos…" value={busqueda} onChange={(e) => setBusqueda(e.target.value)} aria-label="Buscar platillos" />
            </div>
            <select className="campo h-11 w-auto min-w-52 font-display" value={categoria} onChange={(e) => setCategoria(e.target.value)} aria-label="Categoría">
              <option value="">Todas las categorías</option>
              {categorias.data?.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.nombre}
                </option>
              ))}
            </select>
          </div>
          {productos.loading && !productos.data && <Cargando />}
          <ErrorBox error={productos.error} onRetry={productos.reload} />
          {productos.data && visibles.length === 0 && <Vacio titulo="No hay platillos con ese filtro">Prueba otra búsqueda o categoría.</Vacio>}
          <div className="-mr-2 grid grid-cols-2 gap-4 pr-2 sm:grid-cols-3 xl:max-h-[calc(100vh-290px)] xl:min-h-[420px] xl:overflow-y-auto 2xl:grid-cols-4">
            {visibles.map((p) => {
              const agotado = p.disponibles <= 0;
              return (
                <button
                  key={p.id}
                  type="button"
                  disabled={agotado}
                  onClick={() => agregar(p)}
                  className="group relative flex flex-col overflow-hidden rounded-xl border border-borde bg-superficie text-left transition hover:-translate-y-0.5 hover:border-secundario hover:shadow-card disabled:cursor-not-allowed disabled:opacity-55"
                >
                  <div className="aspect-[4/3] w-full overflow-hidden bg-superficie-2">
                    <FotoProducto producto={p} className="h-full w-full transition duration-300 group-hover:scale-105" />
                  </div>
                  <span className="flex items-end justify-between gap-2 px-3 py-2.5">
                    <span className="text-sm leading-tight text-texto">{p.nombre}</span>
                    <span className="shrink-0 font-display font-bold text-texto">{money(p.precio)}</span>
                  </span>
                  {agotado ? (
                    <span className="absolute top-2 right-2 rounded-full bg-error px-2 py-0.5 text-[0.7rem] font-semibold text-white">Agotado</span>
                  ) : p.disponibles <= 10 ? (
                    <span className="absolute top-2 right-2 rounded-full bg-secundario px-2 py-0.5 text-[0.7rem] font-semibold text-primario">Quedan {p.disponibles}</span>
                  ) : null}
                  {p.tipo === 'reventa' && <span className="absolute top-2 left-2 rounded-full bg-acento px-2 py-0.5 text-[0.7rem] font-semibold text-white">Empacado</span>}
                </button>
              );
            })}
          </div>
        </section>

        {/* Carrito y cobro en una sola columna */}
        <aside className="card anim-entrada flex flex-col overflow-hidden xl:sticky xl:top-28">
          <header className="flex items-center justify-between bg-primario px-5 py-3.5 text-white">
            <h2 className="flex items-center gap-3 font-display text-lg font-semibold">
              <ShoppingCart className="size-6" /> Carrito de orden
            </h2>
            <button type="button" onClick={limpiar} disabled={carrito.length === 0} className="flex items-center gap-2 rounded-lg px-2 py-1 text-sm hover:bg-white/10 disabled:opacity-50">
              <Trash2 className="size-4" /> Limpiar
            </button>
          </header>
          <div className="flex items-center gap-2 border-b border-borde bg-superficie-2 px-5 py-2 text-sm">
            <span className="text-suave">Caja:</span>
            <select className="rounded-md bg-transparent font-display font-semibold text-texto outline-none" value={cajaId} onChange={(e) => setCajaId(e.target.value)} aria-label="Caja activa">
              {cajas.data?.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.nombre} · {c.estado === 'abierta' ? 'abierta' : 'cerrada'}
                </option>
              ))}
            </select>
            <span className="ml-auto text-suave">{ETIQUETA_ORDEN[tipoOrden]}</span>
          </div>
          {pedidoActivo && (
            <p className="flex items-center gap-2 bg-acento/10 px-5 py-2 text-sm text-texto">
              <Globe className="size-4 text-acento" /> Cobrando el pedido en línea <b>{pedidoActivo.numero}</b>
              <button type="button" onClick={limpiar} className="ml-auto text-suave hover:text-error" aria-label="Dejar de cobrar este pedido">
                <X className="size-4" />
              </button>
            </p>
          )}

          <ul className="max-h-[300px] divide-y divide-borde overflow-y-auto">
            {carrito.map((i) => (
              <li key={i.id} className="flex items-center gap-3 px-4 py-2.5">
                <FotoProducto producto={i} className="size-11 shrink-0 rounded-lg" />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm text-texto">{i.nombre}</p>
                  <p className="text-xs text-suave">{money(i.precio)} c/u</p>
                </div>
                <div className="flex items-center rounded-lg border border-borde">
                  <button type="button" className="px-1.5 py-1 hover:bg-superficie-2" onClick={() => cambiar(i.id, -1)} aria-label={`Quitar uno de ${i.nombre}`}>
                    <Minus className="size-3.5" />
                  </button>
                  <span className="w-6 text-center text-sm font-semibold">{i.cantidad}</span>
                  <button type="button" className="px-1.5 py-1 hover:bg-superficie-2 disabled:opacity-40" onClick={() => cambiar(i.id, 1)} disabled={i.cantidad >= i.disponibles} aria-label={`Agregar uno de ${i.nombre}`}>
                    <Plus className="size-3.5" />
                  </button>
                </div>
                <span className="w-16 text-right text-sm font-semibold">{money(i.precio * i.cantidad)}</span>
                <button type="button" onClick={() => quitar(i.id)} className="text-suave hover:text-error" aria-label={`Quitar ${i.nombre}`}>
                  <X className="size-4" />
                </button>
              </li>
            ))}
          </ul>
          {carrito.length === 0 && <Vacio icon={ShoppingCart} titulo="La orden está vacía">Toca un platillo para agregarlo.</Vacio>}

          <dl className="space-y-1 border-t border-borde px-5 py-3 text-sm">
            <div className="flex justify-between"><dt>Subtotal</dt><dd>{money(subtotal)}</dd></div>
            <div className="flex justify-between"><dt>IVA 13 %</dt><dd>{money(iva)}</dd></div>
          </dl>
          <div className="flex items-center justify-between bg-secundario px-5 py-3 font-display text-2xl font-bold text-primario">
            <span>Total</span>
            <span>{money(total)}</span>
          </div>

          <div className="space-y-4 p-5">
            <ClienteSelector cliente={cliente} onChange={setCliente} className="" />
            <label className="flex items-center justify-between gap-3 text-sm">
              <span className="font-display font-medium text-texto">Comprobante</span>
              <select className="campo w-auto font-display" value={comprobante} onChange={(e) => setComprobante(e.target.value)}>
                <option value="FCF">Factura</option>
                <option value="CCF">Crédito fiscal (CCF)</option>
              </select>
            </label>
            <div className="grid grid-cols-3 gap-2" role="radiogroup" aria-label="Método de pago">
              {METODOS.map(({ id, label, icon: Icon }) => (
                <button
                  key={id}
                  type="button"
                  role="radio"
                  aria-checked={metodo === id}
                  onClick={() => setMetodo(id)}
                  className={`flex flex-col items-center justify-center gap-1 rounded-xl border px-2 py-2 text-sm transition ${
                    metodo === id ? 'border-primario bg-primario text-white' : 'border-borde bg-superficie text-texto hover:bg-superficie-2'
                  }`}
                >
                  <Icon className={`size-6 ${id === 'bitcoin' && metodo !== id ? 'text-[#f7931a]' : ''}`} />
                  {label}
                </button>
              ))}
            </div>
            <button
              type="button"
              onClick={iniciarCobro}
              disabled={!puedeCobrar}
              className="flex h-16 w-full items-center justify-center gap-3 rounded-2xl bg-secundario font-display text-2xl font-bold text-primario shadow-[0_10px_24px_-12px_rgba(196,130,0,0.75)] transition hover:brightness-105 disabled:cursor-not-allowed disabled:opacity-50"
              title={caja?.estado !== 'abierta' ? 'Abre la caja para cobrar' : undefined}
            >
              {caja?.estado === 'abierta' ? <Receipt className="size-7" /> : <Lock className="size-6" />}
              Cobrar {carrito.length > 0 && money(total)}
            </button>
          </div>
        </aside>
      </div>

      <CobroModal abierto={cobrando} onClose={() => setCobrando(false)} total={total} metodo={metodo} comprobante={comprobante} cliente={cliente} onConfirmar={confirmarVenta} />
      <TicketModal venta={ticket} onClose={() => setTicket(null)} />
    </>
  );
}

/** Búsqueda y alta rápida de clientes (necesario para CCF). */
function ClienteSelector({ cliente, onChange, className = 'card anim-entrada p-4' }) {
  const { notify } = useApp();
  const [q, setQ] = useState('');
  const [abierto, setAbierto] = useState(false);
  const [nuevo, setNuevo] = useState(false);
  const { data } = useFetch(() => clientesService.listar(), [nuevo]);
  const opciones = (data ?? []).filter((c) => c.id !== 'cli-cf' && c.nombre.toLowerCase().includes(q.toLowerCase()));

  const crear = async (form) => {
    try {
      const c = await clientesService.crear(form);
      onChange(c);
      setNuevo(false);
      notify(`Cliente ${c.nombre} agregado`);
    } catch (err) {
      notify(err.message, 'error');
    }
  };

  return (
    <section className={`relative ${className}`}>
      <h3 className="mb-3 flex items-center gap-2 font-display font-semibold text-texto">
        <User className="size-5 fill-primario text-primario" /> Cliente (Opcional)
      </h3>
      {cliente ? (
        <div className="flex h-12 items-center justify-between gap-2 rounded-xl border border-borde bg-superficie-2 px-3">
          <span className="truncate text-sm">
            <b className="text-texto">{cliente.nombre}</b>
            {cliente.nrc && <span className="block text-xs text-suave">NRC {cliente.nrc}</span>}
          </span>
          <button type="button" onClick={() => onChange(null)} aria-label="Quitar cliente">
            <X className="size-4" />
          </button>
        </div>
      ) : (
        <div className="flex gap-2">
          <input
            className="campo h-12"
            placeholder="Buscar cliente…"
            value={q}
            onChange={(e) => {
              setQ(e.target.value);
              setAbierto(true);
            }}
            onFocus={() => setAbierto(true)}
            onBlur={() => setTimeout(() => setAbierto(false), 150)}
            aria-label="Buscar cliente"
          />
          <button type="button" onClick={() => setNuevo(true)} className="grid size-12 shrink-0 place-items-center rounded-xl border border-borde hover:bg-superficie-2" aria-label="Agregar cliente">
            <Plus className="size-5" />
          </button>
        </div>
      )}
      {abierto && !cliente && (
        <ul className="card absolute right-4 left-4 z-20 mt-1 max-h-56 overflow-y-auto p-1">
          {opciones.length === 0 && <li className="px-3 py-2 text-sm text-suave">Sin coincidencias</li>}
          {opciones.map((c) => (
            <li key={c.id}>
              <button type="button" onMouseDown={() => onChange(c)} className="w-full rounded-lg px-3 py-2 text-left text-sm hover:bg-superficie-2">
                {c.nombre}
                <span className="block text-xs text-suave">{c.tipo === 'contribuyente' ? `NRC ${c.nrc}` : 'Consumidor final'}</span>
              </button>
            </li>
          ))}
        </ul>
      )}
      <NuevoClienteModal abierto={nuevo} onClose={() => setNuevo(false)} onGuardar={crear} />
    </section>
  );
}

function NuevoClienteModal({ abierto, onClose, onGuardar }) {
  const [form, setForm] = useState({ nombre: '', tipo: 'contribuyente', nit: '', nrc: '', giro: '', telefono: '' });
  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));
  const [guardando, setGuardando] = useState(false);
  const submit = async (e) => {
    e.preventDefault();
    setGuardando(true);
    await onGuardar(form);
    setGuardando(false);
  };
  return (
    <Modal abierto={abierto} onClose={onClose} titulo="Nuevo cliente">
      <form id="form-cliente" onSubmit={submit} className="grid gap-3 sm:grid-cols-2">
        <Field label="Nombre o razón social" className="sm:col-span-2">
          <input className="campo" required value={form.nombre} onChange={set('nombre')} />
        </Field>
        <Field label="Tipo">
          <select className="campo" value={form.tipo} onChange={set('tipo')}>
            <option value="contribuyente">Contribuyente (CCF)</option>
            <option value="consumidor_final">Consumidor final</option>
          </select>
        </Field>
        <Field label="Teléfono">
          <input className="campo" value={form.telefono} onChange={set('telefono')} />
        </Field>
        {form.tipo === 'contribuyente' && (
          <>
            <Field label="NIT" ayuda="Formato 0000-000000-000-0">
              <input className="campo" required value={form.nit} onChange={set('nit')} placeholder="0614-010190-101-1" />
            </Field>
            <Field label="NRC">
              <input className="campo" required value={form.nrc} onChange={set('nrc')} placeholder="123456-7" />
            </Field>
            <Field label="Giro" className="sm:col-span-2">
              <input className="campo" required value={form.giro} onChange={set('giro')} />
            </Field>
          </>
        )}
      </form>
      <div className="mt-5 flex justify-end gap-2">
        <Button variante="suave" onClick={onClose}>
          Cancelar
        </Button>
        <Button type="submit" form="form-cliente" loading={guardando}>
          Guardar cliente
        </Button>
      </div>
    </Modal>
  );
}

/** Confirmación del pago: monto recibido y cambio (efectivo) o referencia (tarjeta / Chivo). */
function CobroModal({ abierto, onClose, total, metodo, comprobante, cliente, onConfirmar }) {
  const [recibido, setRecibido] = useState('');
  const [referencia, setReferencia] = useState('');
  const [enviando, setEnviando] = useState(false);
  useEffect(() => {
    if (abierto) {
      setRecibido('');
      setReferencia('');
    }
  }, [abierto]);

  const montoRecibido = recibido === '' ? total : Number(recibido);
  const cambio = r2(montoRecibido - total);
  const sugeridos = [...new Set([Math.ceil(total), Math.ceil(total / 5) * 5, Math.ceil(total / 10) * 10, 20])].filter((v) => v >= total).slice(0, 4);

  const confirmar = async () => {
    setEnviando(true);
    try {
      await onConfirmar({ montoRecibido: metodo === 'efectivo' ? montoRecibido : undefined, referencia });
    } catch {
      /* el error ya se notificó */
    } finally {
      setEnviando(false);
    }
  };

  return (
    <Modal
      abierto={abierto}
      onClose={onClose}
      titulo={`Cobrar · ${ETIQUETA_METODO[metodo]}`}
      pie={
        <>
          <Button variante="suave" onClick={onClose}>
            Volver
          </Button>
          <Button variante="dorado" icon={Receipt} loading={enviando} disabled={metodo === 'efectivo' && cambio < 0} onClick={confirmar}>
            Confirmar venta
          </Button>
        </>
      }
    >
      <div className="mb-4 rounded-xl bg-superficie-2 p-4 text-center">
        <p className="text-sm text-suave">{ETIQUETA_COMPROBANTE[comprobante]}{cliente ? ` · ${cliente.nombre}` : ''}</p>
        <p className="font-display text-4xl font-bold text-texto">{money(total)}</p>
      </div>
      {metodo === 'efectivo' && (
        <>
          <Field label="Monto recibido">
            <input className="campo h-12 text-lg" type="number" min={total} step="0.01" placeholder={total.toFixed(2)} value={recibido} onChange={(e) => setRecibido(e.target.value)} />
          </Field>
          <div className="mt-2 flex flex-wrap gap-2">
            {sugeridos.map((v) => (
              <button key={v} type="button" onClick={() => setRecibido(String(v))} className="rounded-lg border border-borde px-3 py-1.5 text-sm font-semibold hover:bg-superficie-2">
                {money(v)}
              </button>
            ))}
          </div>
          <p className={`mt-4 flex justify-between font-display text-xl font-semibold ${cambio < 0 ? 'text-error' : 'text-exito'}`}>
            <span>{cambio < 0 ? 'Falta' : 'Cambio'}</span>
            <span>{money(Math.abs(cambio))}</span>
          </p>
        </>
      )}
      {metodo !== 'efectivo' && (
        <Field label={metodo === 'tarjeta' ? 'Número de autorización (POS)' : 'ID de transacción en Chivo Wallet'} ayuda="Opcional, se imprime en el comprobante.">
          <input className="campo h-12" value={referencia} onChange={(e) => setReferencia(e.target.value)} />
        </Field>
      )}
    </Modal>
  );
}

/** Comprobante imprimible (FCF o CCF). */
function TicketModal({ venta, onClose }) {
  const { config } = useApp();
  if (!venta) return null;
  return (
    <Modal
      abierto={Boolean(venta)}
      onClose={onClose}
      titulo="Venta registrada"
      ancho="max-w-md"
      pie={
        <>
          <Button variante="suave" onClick={onClose}>
            Nueva orden
          </Button>
          <Button icon={Printer} onClick={() => window.print()}>
            Imprimir
          </Button>
        </>
      }
    >
      <div className="zona-impresion rounded-xl border border-dashed border-borde bg-white p-5 font-body text-sm text-[#14213d]">
        <div className="text-center">
          <Logo variante="completo" className="mx-auto mb-1 w-40 text-[#14213d]" />
          {config?.logo && <p className="font-display text-lg font-bold">{config.nombre}</p>}
          <p>{venta.sucursal?.nombre} · {venta.sucursal?.direccion}</p>
          <p className="mt-2 font-display font-semibold">{ETIQUETA_COMPROBANTE[venta.tipoComprobante]}</p>
          <p className="font-display text-base font-bold">{venta.numero}</p>
          <p>
            {fecha(venta.fecha)} {hora(venta.fecha)} · {venta.caja?.nombre} · {ETIQUETA_ORDEN[venta.tipoOrden]}
          </p>
        </div>
        {venta.tipoComprobante === 'CCF' && (
          <div className="mt-3 border-t border-dashed border-[#ccc] pt-2">
            <p><b>Cliente:</b> {venta.cliente?.nombre}</p>
            <p><b>NIT:</b> {venta.cliente?.nit} · <b>NRC:</b> {venta.cliente?.nrc}</p>
            <p><b>Giro:</b> {venta.cliente?.giro}</p>
          </div>
        )}
        <table className="mt-3 w-full border-t border-dashed border-[#ccc]">
          <tbody>
            {venta.items.map((i) => (
              <tr key={i.productoId}>
                <td className="py-1">{i.cantidad} × {i.nombre}</td>
                <td className="py-1 text-right">{money(i.total)}</td>
              </tr>
            ))}
          </tbody>
        </table>
        <dl className="mt-2 space-y-0.5 border-t border-dashed border-[#ccc] pt-2">
          <div className="flex justify-between"><dt>Sumas</dt><dd>{money(venta.subtotal)}</dd></div>
          <div className="flex justify-between"><dt>IVA 13 %</dt><dd>{money(venta.iva)}</dd></div>
          <div className="flex justify-between font-display text-base font-bold"><dt>Total</dt><dd>{money(venta.total)}</dd></div>
          <div className="flex justify-between"><dt>{ETIQUETA_METODO[venta.metodoPago]}</dt><dd>{money(venta.montoRecibido)}</dd></div>
          {venta.metodoPago === 'efectivo' && <div className="flex justify-between"><dt>Cambio</dt><dd>{money(venta.cambio)}</dd></div>}
          {venta.referenciaPago && <div className="flex justify-between"><dt>Referencia</dt><dd>{venta.referenciaPago}</dd></div>}
        </dl>
        <p className="mt-3 text-center">¡Gracias por su visita!</p>
      </div>
    </Modal>
  );
}
