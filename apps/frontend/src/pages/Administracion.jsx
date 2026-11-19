import { useEffect, useMemo, useState } from 'react';
import { Users, ShieldCheck, UserCheck, UserX, Store, Plus, Search, Pencil, RotateCcw, DatabaseZap } from 'lucide-react';
import { useApp } from '../context/AppContext.jsx';
import { useAuth } from '../context/AuthContext.jsx';
import { useFetch } from '../hooks/useFetch.js';
import { usuariosService, generalService, rrhhService } from '../services/index.js';
import { PageHeader } from '../components/layout/Layout.jsx';
import { StatCard, Panel, Badge, Pagination, Modal, Field, Button, Cargando, ErrorBox, Vacio, Aviso, Switch } from '../components/ui/index.jsx';
import { NOMBRE_ROL } from '../utils/permisos.js';
import { fecha } from '../utils/format.js';

const ROLES = ['admin', 'gerente', 'cajero', 'barista'];
const COLOR_ROL = { admin: 'azul', gerente: 'amarillo', cajero: 'verde', barista: 'gris' };
const POR_PAGINA = 6;

/** Herramientas del administrador (D-18): accesos de los usuarios y datos de demostración. */
export default function Administracion() {
  const { notify, sucursales, setConfig, refrescar } = useApp();
  const { usuario: yo } = useAuth();
  const [pestana, setPestana] = useState('accesos');
  const [q, setQ] = useState('');
  const [pagina, setPagina] = useState(1);
  const [editar, setEditar] = useState(null); // usuario | {} (nuevo) | null
  const [desactivar, setDesactivar] = useState(null);
  const [reiniciar, setReiniciar] = useState(false);
  const [procesando, setProcesando] = useState(false);

  const usuarios = useFetch(() => usuariosService.listar(), []);
  const lista = useMemo(() => usuarios.data ?? [], [usuarios.data]);

  useEffect(() => setPagina(1), [q]);

  const filtrados = useMemo(() => {
    const t = q.toLowerCase().trim();
    return lista.filter((u) => !t || u.nombre.toLowerCase().includes(t) || u.email.includes(t) || NOMBRE_ROL[u.rol].toLowerCase().includes(t));
  }, [lista, q]);

  const activos = lista.filter((u) => u.activo).length;
  const admins = lista.filter((u) => u.activo && u.rol === 'admin').length;

  const cambiarEstado = async (u, activo) => {
    setProcesando(true);
    try {
      if (activo) await usuariosService.actualizar(u.id, { activo: true });
      else await usuariosService.desactivar(u.id);
      notify(activo ? `${u.nombre} puede volver a entrar` : `${u.nombre} ya no puede entrar al sistema`);
      setDesactivar(null);
      usuarios.reload({ silencioso: true });
    } catch (err) {
      notify(err.message, 'error');
    } finally {
      setProcesando(false);
    }
  };

  const restablecerDatos = async () => {
    setProcesando(true);
    try {
      await generalService.reiniciar();
      setConfig(await generalService.configuracion());
      notify('Datos de demostración restablecidos');
      setReiniciar(false);
      refrescar();
      usuarios.reload({ silencioso: true });
    } catch (err) {
      notify(err.message, 'error');
    } finally {
      setProcesando(false);
    }
  };

  return (
    <>
      <PageHeader titulo="Administración" subtitulo="Controla quién entra al sistema y con qué permisos" />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard acento={false} icon={UserCheck} tono="verde" titulo="Usuarios activos" valor={usuarios.data ? activos : '—'} />
        <StatCard acento={false} icon={ShieldCheck} tono="azul" titulo="Administradores" valor={usuarios.data ? admins : '—'} detalle="Siempre queda al menos uno" />
        <StatCard acento={false} icon={UserX} tono="naranja" titulo="Sin acceso" valor={usuarios.data ? lista.length - activos : '—'} detalle="Usuarios desactivados" />
        <StatCard acento={false} icon={Store} tono="dorado" titulo="Sucursales" valor={sucursales.length} />
      </div>

      {/* Pestañas, con el mismo estilo de Compras */}
      <div className="mt-6 mb-5 flex flex-wrap gap-2 border-b border-borde" role="tablist" aria-label="Secciones de administración">
        {[
          ['accesos', `Accesos${usuarios.data ? ` (${lista.length})` : ''}`],
          ['demo', 'Datos de demostración'],
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

      {pestana === 'accesos' && (
        <Panel
          titulo="Usuarios y accesos"
          icon={Users}
          className="max-w-5xl"
          acciones={
            <button type="button" onClick={() => setEditar({})} className="flex items-center gap-2 rounded-full bg-white px-4 py-1.5 font-display text-sm font-semibold text-primario hover:brightness-95">
              <Plus className="size-4" /> Nuevo usuario
            </button>
          }
        >
          <div className="p-4 pb-3">
            <div className="relative max-w-md">
              <Search className="pointer-events-none absolute top-1/2 left-3.5 size-5 -translate-y-1/2" />
              <input className="campo pl-11" placeholder="Buscar por nombre, correo o rol…" value={q} onChange={(e) => setQ(e.target.value)} aria-label="Buscar usuario" />
            </div>
          </div>
          {usuarios.loading && !usuarios.data && <Cargando />}
          <ErrorBox error={usuarios.error} onRetry={usuarios.reload} />
          <div className="overflow-x-auto px-4">
            <table className="tabla min-w-[680px] overflow-hidden rounded-lg border border-borde">
              <thead>
                <tr>
                  <th>Usuario</th>
                  <th>Rol</th>
                  <th>Sucursal</th>
                  <th className="text-center!">Estado</th>
                  <th className="text-center!">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {filtrados.slice((pagina - 1) * POR_PAGINA, pagina * POR_PAGINA).map((u) => {
                  const soyYo = u.id === yo?.id;
                  return (
                    <tr key={u.id}>
                      <td>
                        <span className="block font-medium">
                          {u.nombre}
                          {soyYo && <span className="ml-1.5 text-xs font-normal text-suave">(tú)</span>}
                        </span>
                        <span className="block text-xs text-suave">{u.email}</span>
                      </td>
                      <td>
                        <Badge color={COLOR_ROL[u.rol]} punto={false}>
                          {NOMBRE_ROL[u.rol]}
                        </Badge>
                      </td>
                      <td>
                        {u.sucursalNombre ?? 'Todas'}
                        <span className="block text-xs text-suave">Desde {fecha(u.creadoEn)}</span>
                      </td>
                      <td className="text-center">
                        <Badge color={u.activo ? 'verde' : 'gris'}>{u.activo ? 'Activo' : 'Inactivo'}</Badge>
                      </td>
                      <td>
                        <div className="flex justify-center gap-1">
                          <button type="button" className="rounded-lg p-1.5 hover:bg-superficie-2" onClick={() => setEditar(u)} aria-label={`Editar ${u.nombre}`}>
                            <Pencil className="size-5" />
                          </button>
                          {u.activo ? (
                            <button
                              type="button"
                              className="rounded-lg p-1.5 hover:bg-superficie-2 hover:text-error disabled:opacity-30"
                              disabled={soyYo}
                              title={soyYo ? 'No puedes quitarte el acceso a ti mismo' : undefined}
                              onClick={() => setDesactivar(u)}
                              aria-label={`Quitar el acceso a ${u.nombre}`}
                            >
                              <UserX className="size-5" />
                            </button>
                          ) : (
                            <button type="button" className="rounded-lg p-1.5 hover:bg-superficie-2 hover:text-exito" disabled={procesando} onClick={() => cambiarEstado(u, true)} aria-label={`Devolver el acceso a ${u.nombre}`}>
                              <UserCheck className="size-5" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          {usuarios.data && filtrados.length === 0 && <Vacio titulo="No hay usuarios con esa búsqueda" />}
          <Pagination pagina={pagina} total={filtrados.length} porPagina={POR_PAGINA} onChange={setPagina} etiqueta="usuarios" />
        </Panel>
      )}

      {pestana === 'demo' && (
        <Panel titulo="Datos de demostración" icon={DatabaseZap} className="max-w-3xl" cuerpo="p-5">
          <p className="text-texto/85">
            Vuelve a cargar el menú, las recetas, el inventario y 14 días de ventas de ejemplo. Sirve para preparar una presentación o empezar de cero después de hacer pruebas.
          </p>
          <Aviso className="mt-4" titulo="Se borra todo lo registrado">
            Ventas, compras, turnos de caja, planillas y los usuarios que hayas creado se reemplazan por los datos de demostración. Los usuarios de prueba vuelven a usar la contraseña del archivo .env.
          </Aviso>
          <div className="mt-5 flex justify-end">
            <Button variante="peligro" icon={RotateCcw} onClick={() => setReiniciar(true)}>
              Restablecer datos de demostración
            </Button>
          </div>
        </Panel>
      )}

      <UsuarioModal
        usuario={editar}
        yo={yo}
        onClose={() => setEditar(null)}
        onGuardado={(msg) => {
          notify(msg);
          setEditar(null);
          usuarios.reload({ silencioso: true });
        }}
      />

      <Modal
        abierto={Boolean(desactivar)}
        onClose={() => setDesactivar(null)}
        titulo="Quitar el acceso"
        pie={
          <>
            <Button variante="suave" onClick={() => setDesactivar(null)}>
              Cancelar
            </Button>
            <Button variante="peligro" icon={UserX} loading={procesando} onClick={() => cambiarEstado(desactivar, false)}>
              Quitar acceso
            </Button>
          </>
        }
      >
        <p>
          <b>{desactivar?.nombre}</b> no podrá volver a entrar y, si tiene una sesión abierta, se cerrará en su siguiente acción. Su historial se conserva y puedes devolverle el acceso cuando quieras.
        </p>
      </Modal>

      <Modal
        abierto={reiniciar}
        onClose={() => setReiniciar(false)}
        titulo="Restablecer datos de demostración"
        pie={
          <>
            <Button variante="suave" onClick={() => setReiniciar(false)}>
              Cancelar
            </Button>
            <Button variante="peligro" icon={RotateCcw} loading={procesando} onClick={restablecerDatos}>
              Sí, restablecer
            </Button>
          </>
        }
      >
        <p>Todo lo registrado se reemplazará por los datos de demostración. Esta acción no se puede deshacer.</p>
      </Modal>
    </>
  );
}

/** Alta y edición de un usuario: datos, rol, sucursal, empleado vinculado y contraseña. */
function UsuarioModal({ usuario, yo, onClose, onGuardado }) {
  const { notify, sucursales } = useApp();
  const [form, setForm] = useState({});
  const [guardando, setGuardando] = useState(false);
  const esNuevo = usuario && !usuario.id;
  const soyYo = usuario?.id === yo?.id;
  const { data: empleados } = useFetch(() => (usuario ? rrhhService.empleados({ estado: 'activo' }) : Promise.resolve([])), [usuario]);

  useEffect(() => {
    if (usuario) {
      setForm({
        nombre: usuario.nombre ?? '',
        email: usuario.email ?? '',
        rol: usuario.rol ?? 'cajero',
        sucursalId: usuario.sucursalId ?? sucursales[0]?.id ?? '',
        empleadoId: usuario.empleadoId ?? '',
        activo: usuario.activo ?? true,
        password: '',
      });
    }
  }, [usuario, sucursales]);

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));
  const esAdmin = form.rol === 'admin';
  const empleadosDeSucursal = (empleados ?? []).filter((e) => esAdmin || e.sucursalId === form.sucursalId);

  const guardar = async (e) => {
    e.preventDefault();
    setGuardando(true);
    try {
      const data = {
        nombre: form.nombre,
        email: form.email,
        rol: form.rol,
        sucursalId: esAdmin ? null : form.sucursalId,
        empleadoId: form.empleadoId || null,
      };
      if (esNuevo) {
        await usuariosService.crear({ ...data, password: form.password });
      } else {
        await usuariosService.actualizar(usuario.id, { ...data, activo: form.activo, ...(form.password ? { password: form.password } : {}) });
      }
      onGuardado(esNuevo ? `${form.nombre} ya puede entrar al sistema` : `Datos de ${form.nombre} actualizados`);
    } catch (err) {
      notify(err.message, 'error');
    } finally {
      setGuardando(false);
    }
  };

  return (
    <Modal abierto={Boolean(usuario)} onClose={onClose} titulo={esNuevo ? 'Nuevo usuario' : `Editar a ${usuario?.nombre ?? ''}`} ancho="max-w-xl">
      <form onSubmit={guardar} className="grid gap-3 sm:grid-cols-2">
        <Field label="Nombre" className="sm:col-span-2">
          <input className="campo" required value={form.nombre ?? ''} onChange={set('nombre')} />
        </Field>
        <Field label="Correo" className="sm:col-span-2">
          <input className="campo" type="email" required value={form.email ?? ''} onChange={set('email')} autoComplete="off" />
        </Field>
        <Field label="Rol" ayuda={soyYo ? 'No puedes quitarte el rol de administrador.' : undefined}>
          <select className="campo" value={form.rol ?? 'cajero'} onChange={set('rol')} disabled={soyYo}>
            {ROLES.map((r) => (
              <option key={r} value={r}>
                {NOMBRE_ROL[r]}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Sucursal" ayuda={esAdmin ? 'El administrador trabaja con todas.' : undefined}>
          <select className="campo" value={esAdmin ? '' : form.sucursalId ?? ''} onChange={set('sucursalId')} disabled={esAdmin} required={!esAdmin}>
            {esAdmin && <option value="">Todas las sucursales</option>}
            {!esAdmin &&
              sucursales.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.nombre}
                </option>
              ))}
          </select>
        </Field>
        <Field label="Empleado vinculado (opcional)" className="sm:col-span-2">
          <select className="campo" value={form.empleadoId ?? ''} onChange={set('empleadoId')}>
            <option value="">Sin vincular</option>
            {empleadosDeSucursal.map((emp) => (
              <option key={emp.id} value={emp.id}>
                {emp.nombre} · {emp.cargo}
              </option>
            ))}
          </select>
        </Field>
        <Field
          label={esNuevo ? 'Contraseña' : 'Nueva contraseña'}
          className="sm:col-span-2"
          ayuda={esNuevo ? 'Entre 12 y 72 caracteres. Compártela con la persona por un medio seguro.' : 'Déjala en blanco para no cambiarla. Entre 12 y 72 caracteres.'}
        >
          <input className="campo" type="password" required={esNuevo} minLength={12} maxLength={72} value={form.password ?? ''} onChange={set('password')} autoComplete="new-password" />
        </Field>
        {!esNuevo && !soyYo && (
          <div className="flex items-center justify-between rounded-xl border border-borde px-4 py-3 sm:col-span-2">
            <span>
              <span className="block font-display text-sm font-medium text-texto">Acceso al sistema</span>
              <span className="block text-xs text-suave">{form.activo ? 'Puede iniciar sesión' : 'No puede iniciar sesión'}</span>
            </span>
            <Switch checked={Boolean(form.activo)} onChange={(v) => setForm((f) => ({ ...f, activo: v }))} label="Acceso al sistema" />
          </div>
        )}
        <div className="flex justify-end gap-2 sm:col-span-2">
          <Button variante="suave" onClick={onClose}>
            Cancelar
          </Button>
          <Button type="submit" loading={guardando}>
            {esNuevo ? 'Crear usuario' : 'Guardar cambios'}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
