import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Plus, Minus, ShoppingBag, Bike, Banknote, CreditCard, Bitcoin, Send, X } from 'lucide-react';
import { useApp } from '../context/AppContext.jsx';
import { useAuth } from '../context/AuthContext.jsx';
import { useFetch } from '../hooks/useFetch.js';
import { productosService, pedidosService } from '../services/index.js';
import { PageHeader } from '../components/layout/Layout.jsx';
import { Button, Field, Cargando, ErrorBox, Vacio } from '../components/ui/index.jsx';
import { FotoProducto } from '../components/decor/FoodArt.jsx';
import { money } from '../utils/format.js';

const IVA = 0.13;
const r2 = (n) => Math.round((n + Number.EPSILON) * 100) / 100;

const ENTREGAS = [
  { id: 'para_llevar', label: 'Paso a recoger', icon: ShoppingBag },
  { id: 'delivery', label: 'A domicilio', icon: Bike },
];
const PAGOS = [
  { id: 'efectivo', label: 'Efectivo', icon: Banknote },
  { id: 'tarjeta', label: 'Tarjeta', icon: CreditCard },
  { id: 'bitcoin', label: 'Chivo', icon: Bitcoin },
];

/** Menú en línea para clientes: elegir platillos y enviar el pedido a la cocina. */
export default function Menu() {
  const { sucursalId, sucursal, notify } = useApp();
  const { usuario } = useAuth();
  const navigate = useNavigate();
  const [categoria, setCategoria] = useState('');
  const [busqueda, setBusqueda] = useState('');
  const [carrito, setCarrito] = useState([]);
  const [entrega, setEntrega] = useState('para_llevar');
  const [direccion, setDireccion] = useState('');
  const [pago, setPago] = useState('efectivo');
  const [notas, setNotas] = useState('');
  const [enviando, setEnviando] = useState(false);

  const productos = useFetch(() => productosService.listar({ sucursalId }), [sucursalId]);
  const categorias = useFetch(() => productosService.categorias(), []);

  const visibles = useMemo(() => {
    const q = busqueda.toLowerCase().trim();
    return (productos.data ?? []).filter((p) => (!categoria || p.categoriaId === categoria) && (!q || p.nombre.toLowerCase().includes(q)));
  }, [productos.data, categoria, busqueda]);

  const subtotal = r2(carrito.reduce((a, i) => a + i.precio * i.cantidad, 0));
  const iva = r2(subtotal * IVA);
  const total = r2(subtotal + iva);
  const cantidadDe = (id) => carrito.find((i) => i.id === id)?.cantidad ?? 0;

  const cambiar = (p, delta) =>
    setCarrito((c) => {
      const actual = c.find((i) => i.id === p.id);
      const cantidad = Math.min(p.disponibles, (actual?.cantidad ?? 0) + delta);
      if (cantidad <= 0) return c.filter((i) => i.id !== p.id);
      if (actual) return c.map((i) => (i.id === p.id ? { ...i, cantidad } : i));
      return [...c, { id: p.id, nombre: p.nombre, precio: p.precio, disponibles: p.disponibles, cantidad }];
    });

  const enviar = async () => {
    setEnviando(true);
    try {
      const pedido = await pedidosService.crear({
        sucursalId,
        tipoOrden: entrega,
        direccion,
        metodoPago: pago,
        notas,
        items: carrito.map((i) => ({ productoId: i.id, cantidad: i.cantidad })),
      });
      notify(`¡Listo! Tu pedido ${pedido.numero} llegó a la cocina.`);
      navigate('/mis-pedidos');
    } catch (err) {
      notify(err.message, 'error');
      setEnviando(false);
    }
  };

  return (
    <>
      <PageHeader titulo={`¡Hola, ${usuario?.nombre?.split(' ')[0] ?? ''}!`} subtitulo={`¿Qué se te antoja hoy? Estás ordenando en ${sucursal?.nombre ?? 'tu sucursal'}.`} />

      <div className="grid items-start gap-6 xl:grid-cols-[1fr_380px]">
        <section>
          <div className="mb-5 flex flex-wrap items-center gap-3">
            <div className="relative min-w-60 flex-1">
              <Search className="pointer-events-none absolute top-1/2 left-3.5 size-5 -translate-y-1/2 text-suave" />
              <input className="campo h-12 pl-11" placeholder="Buscar platillos…" value={busqueda} onChange={(e) => setBusqueda(e.target.value)} aria-label="Buscar platillos" />
            </div>
            <div className="flex flex-wrap gap-2" role="tablist" aria-label="Categorías">
              {[{ id: '', nombre: 'Todo' }, ...(categorias.data ?? [])].map((c) => (
                <button
                  key={c.id || 'todo'}
                  type="button"
                  role="tab"
                  aria-selected={categoria === c.id}
                  onClick={() => setCategoria(c.id)}
                  className={`rounded-full px-4 py-2 font-display text-sm font-medium transition ${categoria === c.id ? 'bg-primario text-white' : 'border border-borde bg-superficie text-texto hover:bg-superficie-2'}`}
                >
                  {c.nombre}
                </button>
              ))}
            </div>
          </div>

          {productos.loading && !productos.data && <Cargando texto="Cargando el menú…" />}
          <ErrorBox error={productos.error} onRetry={productos.reload} />
          {productos.data && visibles.length === 0 && <Vacio titulo="No encontramos platillos con ese filtro" />}

          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {visibles.map((p) => {
              const cantidad = cantidadDe(p.id);
              const agotado = p.disponibles <= 0;
              return (
                <article key={p.id} className="card anim-entrada flex flex-col overflow-hidden">
                  <div className="relative aspect-[16/10] shrink-0 overflow-hidden bg-superficie-2">
                    <FotoProducto producto={p} className="h-full w-full" />
                    {agotado && <span className="absolute top-3 left-3 rounded-full bg-error px-3 py-1 text-xs font-semibold text-white">Agotado hoy</span>}
                  </div>
                  <div className="flex flex-1 flex-col p-4">
                    <h3 className="font-display text-lg font-semibold text-texto">{p.nombre}</h3>
                    <p className="mt-1 flex-1 text-sm text-suave">{p.descripcion}</p>
                    <div className="mt-4 flex items-center justify-between">
                      <span className="font-display text-xl font-bold text-texto">{money(p.precio)}</span>
                      {cantidad === 0 ? (
                        <Button icon={Plus} className="rounded-full px-4 py-2" disabled={agotado} onClick={() => cambiar(p, 1)}>
                          Agregar
                        </Button>
                      ) : (
                        <div className="flex items-center gap-1 rounded-full border border-borde bg-superficie-2 p-1">
                          <button type="button" className="grid size-8 place-items-center rounded-full hover:bg-superficie" onClick={() => cambiar(p, -1)} aria-label={`Quitar uno de ${p.nombre}`}>
                            <Minus className="size-4" />
                          </button>
                          <span className="w-6 text-center font-display font-bold">{cantidad}</span>
                          <button type="button" className="grid size-8 place-items-center rounded-full hover:bg-superficie disabled:opacity-40" disabled={cantidad >= p.disponibles} onClick={() => cambiar(p, 1)} aria-label={`Agregar uno de ${p.nombre}`}>
                            <Plus className="size-4" />
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        </section>

        {/* Resumen del pedido */}
        <aside className="card anim-entrada sticky top-28 flex flex-col overflow-hidden">
          <header className="bg-primario px-5 py-4 text-white">
            <h2 className="flex items-center gap-2 font-display text-lg font-semibold">
              <ShoppingBag className="size-5" /> Tu pedido
            </h2>
          </header>
          {carrito.length === 0 ? (
            <Vacio icon={ShoppingBag} titulo="Aún no has elegido nada">Toca «Agregar» en los platillos que quieras.</Vacio>
          ) : (
            <div className="space-y-5 p-5">
              <ul className="space-y-2">
                {carrito.map((i) => (
                  <li key={i.id} className="flex items-center gap-2 text-sm">
                    <span className="w-6 font-display font-bold">{i.cantidad}×</span>
                    <span className="flex-1 text-texto">{i.nombre}</span>
                    <span className="font-semibold">{money(i.precio * i.cantidad)}</span>
                    <button type="button" onClick={() => setCarrito((c) => c.filter((x) => x.id !== i.id))} className="text-suave hover:text-error" aria-label={`Quitar ${i.nombre}`}>
                      <X className="size-4" />
                    </button>
                  </li>
                ))}
              </ul>

              <div>
                <p className="mb-2 font-display text-sm font-medium">¿Cómo lo quieres?</p>
                <div className="grid grid-cols-2 gap-2">
                  {ENTREGAS.map(({ id, label, icon: Icon }) => (
                    <button key={id} type="button" onClick={() => setEntrega(id)} className={`flex items-center justify-center gap-2 rounded-xl border px-3 py-2.5 text-sm ${entrega === id ? 'border-primario bg-primario text-white' : 'border-borde text-texto hover:bg-superficie-2'}`}>
                      <Icon className="size-4" /> {label}
                    </button>
                  ))}
                </div>
                {entrega === 'delivery' && (
                  <input className="campo mt-2" placeholder="Dirección de entrega" value={direccion} onChange={(e) => setDireccion(e.target.value)} aria-label="Dirección de entrega" />
                )}
              </div>

              <div>
                <p className="mb-2 font-display text-sm font-medium">Pagarás al {entrega === 'delivery' ? 'recibir' : 'recoger'} con</p>
                <div className="grid grid-cols-3 gap-2">
                  {PAGOS.map(({ id, label, icon: Icon }) => (
                    <button key={id} type="button" onClick={() => setPago(id)} className={`flex flex-col items-center gap-1 rounded-xl border px-2 py-2 text-xs ${pago === id ? 'border-primario bg-primario text-white' : 'border-borde text-texto hover:bg-superficie-2'}`}>
                      <Icon className="size-5" /> {label}
                    </button>
                  ))}
                </div>
              </div>

              <Field label="Indicaciones (opcional)">
                <input className="campo" maxLength={200} placeholder="Ej.: curtido aparte" value={notas} onChange={(e) => setNotas(e.target.value)} />
              </Field>

              <dl className="space-y-1 border-t border-borde pt-3 text-sm">
                <div className="flex justify-between"><dt>Subtotal</dt><dd>{money(subtotal)}</dd></div>
                <div className="flex justify-between"><dt>IVA 13 %</dt><dd>{money(iva)}</dd></div>
                <div className="flex justify-between font-display text-xl font-bold text-texto"><dt>Total</dt><dd>{money(total)}</dd></div>
              </dl>

              <Button variante="dorado" icon={Send} className="h-12 w-full text-base" loading={enviando} disabled={entrega === 'delivery' && !direccion.trim()} onClick={enviar}>
                Hacer pedido
              </Button>
            </div>
          )}
        </aside>
      </div>
    </>
  );
}
