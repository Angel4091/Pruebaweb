import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ClipboardList, Check, X, UtensilsCrossed } from 'lucide-react';
import { useApp } from '../context/AppContext.jsx';
import { useFetch } from '../hooks/useFetch.js';
import { pedidosService } from '../services/index.js';
import { PageHeader } from '../components/layout/Layout.jsx';
import { Button, Cargando, ErrorBox, Vacio, Badge } from '../components/ui/index.jsx';
import { money, fecha, hora, ETIQUETA_METODO } from '../utils/format.js';

const PASOS = [
  { estado: 'recibido', label: 'Recibido' },
  { estado: 'en_preparacion', label: 'En preparación' },
  { estado: 'listo', label: 'Listo' },
  { estado: 'entregado', label: 'Entregado' },
];

/** Línea de avance del pedido: recibido → en preparación → listo → entregado. */
function Seguimiento({ estado }) {
  const actual = PASOS.findIndex((p) => p.estado === estado);
  return (
    <ol className="flex items-center" aria-label="Estado del pedido">
      {PASOS.map((p, i) => {
        const hecho = i <= actual;
        return (
          <li key={p.estado} className="flex flex-1 items-center last:flex-none">
            <div className="flex flex-col items-center gap-1">
              <span className={`grid size-8 place-items-center rounded-full text-sm font-bold ${hecho ? 'bg-exito text-white' : 'bg-superficie-2 text-suave'}`} aria-current={i === actual ? 'step' : undefined}>
                {hecho ? <Check className="size-4" /> : i + 1}
              </span>
              <span className={`text-xs whitespace-nowrap ${i === actual ? 'font-semibold text-texto' : 'text-suave'}`}>{p.label}</span>
            </div>
            {i < PASOS.length - 1 && <span className={`mx-1 mb-5 h-0.5 flex-1 ${i < actual ? 'bg-exito' : 'bg-borde'}`} />}
          </li>
        );
      })}
    </ol>
  );
}

export default function MisPedidos() {
  const { notify, sucursales } = useApp();
  const [cancelando, setCancelando] = useState(null);
  const { data, loading, error, reload } = useFetch(() => pedidosService.mios(), []);

  // El estado cambia en la cocina: se consulta de nuevo cada 10 segundos.
  useEffect(() => {
    const t = setInterval(() => reload({ silencioso: true }), 10_000);
    return () => clearInterval(t);
  }, [reload]);

  const cancelar = async (pedido) => {
    setCancelando(pedido.id);
    try {
      await pedidosService.cambiarEstado(pedido.id, 'cancelado');
      notify(`Pedido ${pedido.numero} cancelado`);
      await reload({ silencioso: true });
    } catch (err) {
      notify(err.message, 'error');
    } finally {
      setCancelando(null);
    }
  };

  if (loading && !data) return <Cargando texto="Cargando tus pedidos…" />;

  return (
    <>
      <PageHeader titulo="Mis pedidos" subtitulo="El estado se actualiza solo mientras la cocina prepara tu orden">
        <Link to="/menu" className="flex items-center gap-2 rounded-xl bg-primario px-4 py-2.5 font-display text-sm font-semibold text-white">
          <UtensilsCrossed className="size-4" /> Pedir algo más
        </Link>
      </PageHeader>
      <ErrorBox error={error} onRetry={reload} />
      {data?.length === 0 && (
        <div className="card">
          <Vacio icon={ClipboardList} titulo="Todavía no has hecho pedidos">
            <Link to="/menu" className="font-semibold text-acento hover:underline">Ve al menú</Link> y elige tus platillos.
          </Vacio>
        </div>
      )}
      <div className="mx-auto flex max-w-4xl flex-col gap-5">
        {data?.map((p) => (
          <article key={p.id} className="card anim-entrada p-5 sm:p-6">
            <header className="mb-4 flex flex-wrap items-start justify-between gap-3">
              <div>
                <p className="font-display text-xl font-bold text-texto">Pedido {p.numero}</p>
                <p className="text-sm text-suave">
                  {fecha(p.fecha)} {hora(p.fecha)} · {sucursales.find((s) => s.id === p.sucursalId)?.nombre} · {p.tipoOrden === 'delivery' ? 'A domicilio' : 'Para recoger'}
                </p>
              </div>
              <div className="text-right">
                <p className="font-display text-xl font-bold text-texto">{money(p.total)}</p>
                <p className="text-sm text-suave">{p.ventaId ? 'Pagado' : `Pagas con ${ETIQUETA_METODO[p.metodoPago]?.toLowerCase()}`}</p>
              </div>
            </header>
            {p.estado === 'cancelado' ? (
              <Badge color="rojo" className="text-sm">Pedido cancelado</Badge>
            ) : (
              <Seguimiento estado={p.estado} />
            )}
            <p className="mt-4 text-sm text-texto/85">{p.items.map((i) => `${i.cantidad} × ${i.nombre}`).join(' · ')}</p>
            {p.notas && <p className="mt-1 text-sm text-suave">Indicaciones: {p.notas}</p>}
            {p.estado === 'recibido' && !p.ventaId && (
              <div className="mt-4 flex justify-end">
                <Button variante="suave" icon={X} loading={cancelando === p.id} onClick={() => cancelar(p)}>
                  Cancelar pedido
                </Button>
              </div>
            )}
          </article>
        ))}
      </div>
    </>
  );
}
