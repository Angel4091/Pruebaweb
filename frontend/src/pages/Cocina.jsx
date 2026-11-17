import { useEffect, useState } from 'react';
import { ChefHat, Flame, BellRing, Clock, Store, Globe, Bike, ShoppingBag, Utensils, RefreshCw } from 'lucide-react';
import { useApp } from '../context/AppContext.jsx';
import { useAuth } from '../context/AuthContext.jsx';
import { useFetch } from '../hooks/useFetch.js';
import { pedidosService } from '../services/index.js';
import { PageHeader } from '../components/layout/Layout.jsx';
import { Button, Badge, Cargando, ErrorBox, Vacio } from '../components/ui/index.jsx';
import { hora } from '../utils/format.js';

const REFRESCO_MS = 10_000;

const COLUMNAS = [
  { estado: 'recibido', titulo: 'Recibidos', icon: BellRing, accion: 'Empezar a preparar', siguiente: 'en_preparacion', color: 'border-t-acento' },
  { estado: 'en_preparacion', titulo: 'En preparación', icon: Flame, accion: 'Marcar como listo', siguiente: 'listo', color: 'border-t-naranja' },
  { estado: 'listo', titulo: 'Listos para entregar', icon: ChefHat, accion: 'Entregar', siguiente: 'entregado', color: 'border-t-exito' },
];

const TIPO = {
  comer_aqui: { label: 'Comer aquí', icon: Utensils },
  para_llevar: { label: 'Para llevar', icon: ShoppingBag },
  delivery: { label: 'A domicilio', icon: Bike },
};

const minutosDesde = (iso, ahora) => Math.max(0, Math.floor((ahora - new Date(iso)) / 60000));

export default function Cocina() {
  const { sucursalId, notify, refrescar } = useApp();
  const { rol } = useAuth();
  const [ahora, setAhora] = useState(() => Date.now());
  const [procesando, setProcesando] = useState(null);
  const { data, loading, error, reload } = useFetch(() => pedidosService.listar(sucursalId, { activos: true }), [sucursalId]);

  // Actualización automática: nuevas comandas y tiempo transcurrido.
  useEffect(() => {
    const t = setInterval(() => {
      setAhora(Date.now());
      reload({ silencioso: true });
    }, REFRESCO_MS);
    return () => clearInterval(t);
  }, [reload]);

  const avanzar = async (pedido, estado) => {
    setProcesando(pedido.id);
    try {
      await pedidosService.cambiarEstado(pedido.id, estado);
      notify(estado === 'cancelado' ? `Pedido ${pedido.numero} cancelado` : `Pedido ${pedido.numero}: ${estado === 'entregado' ? 'entregado' : estado === 'listo' ? 'listo para entregar' : 'en preparación'}`);
      await reload({ silencioso: true });
      refrescar();
    } catch (err) {
      notify(err.message, 'error');
    } finally {
      setProcesando(null);
    }
  };

  if (loading && !data) return <Cargando texto="Cargando comandas…" />;
  const pedidos = data ?? [];

  return (
    <>
      <PageHeader titulo="Cocina" subtitulo="Comandas del punto de venta y pedidos en línea">
        <span className="flex items-center gap-2 text-sm text-suave">
          <RefreshCw className="size-4" /> Se actualiza cada 10 segundos
        </span>
      </PageHeader>
      <ErrorBox error={error} onRetry={reload} />

      <div className="grid gap-6 lg:grid-cols-3">
        {COLUMNAS.map(({ estado, titulo, icon: Icon, accion, siguiente, color }) => {
          const lista = pedidos.filter((p) => p.estado === estado);
          return (
            <section key={estado} className={`card anim-entrada flex min-h-[420px] flex-col border-t-4! ${color}`}>
              <header className="flex items-center justify-between px-5 pt-4 pb-3">
                <h2 className="flex items-center gap-2 font-display text-lg font-semibold text-texto">
                  <Icon className="size-5 text-primario" /> {titulo}
                </h2>
                <span className="grid size-8 place-items-center rounded-full bg-superficie-2 font-display font-bold text-texto">{lista.length}</span>
              </header>
              <div className="flex flex-1 flex-col gap-3 px-4 pb-4">
                {lista.length === 0 && <Vacio titulo="Sin pedidos aquí" />}
                {lista.map((p) => {
                  const min = minutosDesde(p.fecha, ahora);
                  const porCobrar = p.origen === 'en_linea' && !p.ventaId;
                  const tipo = TIPO[p.tipoOrden] ?? TIPO.para_llevar;
                  const bloqueado = siguiente === 'entregado' && porCobrar;
                  return (
                    <article key={p.id} className="rounded-xl border border-borde bg-superficie p-4">
                      <div className="mb-2 flex items-start justify-between gap-2">
                        <div>
                          <p className="font-display text-lg font-bold text-texto">{p.numero}</p>
                          <p className="flex items-center gap-1.5 text-sm text-suave">
                            <tipo.icon className="size-4" /> {tipo.label}
                          </p>
                        </div>
                        <div className="flex flex-col items-end gap-1">
                          <Badge color={p.origen === 'en_linea' ? 'azul' : 'gris'} punto={false}>
                            {p.origen === 'en_linea' ? <Globe className="size-3" /> : <Store className="size-3" />}
                            {p.origen === 'en_linea' ? 'En línea' : 'Caja'}
                          </Badge>
                          <span className={`flex items-center gap-1 text-xs font-semibold ${min >= 15 ? 'text-error' : 'text-suave'}`} title={`Recibido a las ${hora(p.fecha)}`}>
                            <Clock className="size-3.5" /> {min} min
                          </span>
                        </div>
                      </div>
                      {p.clienteNombre && <p className="mb-1 text-sm text-texto">Cliente: {p.clienteNombre}</p>}
                      <ul className="space-y-0.5 border-t border-borde pt-2 text-[0.95rem]">
                        {p.items.map((it) => (
                          <li key={it.productoId} className="flex gap-2">
                            <b className="w-7 shrink-0 text-right font-display">{it.cantidad}×</b>
                            <span className="text-texto">{it.nombre}</span>
                          </li>
                        ))}
                      </ul>
                      {p.notas && <p className="mt-2 rounded-lg bg-secundario/20 px-3 py-1.5 text-sm text-texto">📝 {p.notas}</p>}
                      {p.direccion && <p className="mt-1 text-sm text-suave">Entregar en: {p.direccion}</p>}
                      {porCobrar && (
                        <p className="mt-2 text-sm font-semibold text-naranja">Pendiente de cobro en caja</p>
                      )}
                      <div className="mt-3 flex gap-2">
                          <Button
                            className="flex-1 py-2"
                            variante={siguiente === 'entregado' ? 'dorado' : 'primario'}
                            loading={procesando === p.id}
                            disabled={bloqueado}
                            title={bloqueado ? 'Cobra el pedido en caja antes de entregarlo' : undefined}
                            onClick={() => avanzar(p, siguiente)}
                          >
                            {accion}
                          </Button>
                          {estado === 'recibido' && porCobrar && rol !== 'cocinero' && (
                            <Button variante="suave" className="py-2" onClick={() => avanzar(p, 'cancelado')}>
                              Cancelar
                            </Button>
                          )}
                      </div>
                    </article>
                  );
                })}
              </div>
            </section>
          );
        })}
      </div>
    </>
  );
}
