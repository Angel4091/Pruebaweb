import bcrypt from 'bcryptjs';
import { AppError, notFound } from '../../utils/AppError.js';
import { ROLES } from '../../middlewares/roles.js';
import { validarSucursal } from '../general/general.service.js';
import * as repo from './usuarios.repository.js';
import * as rrhhRepo from '../rrhh/rrhh.repository.js';

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/** Contraseña de 12 a 72 caracteres (bcrypt solo usa los primeros 72 bytes). */
function validarPassword(password) {
  if (typeof password !== 'string' || password.length < 12) throw new AppError('La contraseña debe tener al menos 12 caracteres', 422);
  if (Buffer.byteLength(password, 'utf8') > 72) throw new AppError('La contraseña no puede pasar de 72 caracteres', 422);
}

async function validarDatos(u) {
  if (!String(u.nombre ?? '').trim()) throw new AppError('El nombre es obligatorio', 422);
  if (!EMAIL.test(String(u.email ?? ''))) throw new AppError('El correo no es válido', 422);
  if (!ROLES.includes(u.rol)) throw new AppError(`El rol debe ser uno de: ${ROLES.join(', ')}`, 422);
  if (u.rol !== 'admin' && !u.sucursalId) throw new AppError('Los usuarios que no son admin necesitan una sucursal', 422);
  if (u.sucursalId) await validarSucursal(u.sucursalId);
  if (u.empleadoId && !(await rrhhRepo.obtenerEmpleado(u.empleadoId))) throw notFound('Empleado');
}

export const listarUsuarios = () => repo.listarUsuarios();

export async function crearUsuario(data) {
  const usuario = {
    nombre: String(data.nombre ?? '').trim(),
    email: String(data.email ?? '').trim().toLowerCase(),
    rol: data.rol,
    sucursalId: data.rol === 'admin' ? null : data.sucursalId || null,
    empleadoId: data.empleadoId || null,
  };
  await validarDatos(usuario);
  validarPassword(data.password);
  if (await repo.existeEmail(usuario.email)) throw new AppError('Ya existe un usuario con ese correo', 409);
  return repo.crearUsuario({ ...usuario, passwordHash: await bcrypt.hash(data.password, 12) });
}

/**
 * Edita nombre, correo, rol, sucursal o estado, y opcionalmente cambia la contraseña.
 * Reglas de seguridad: nadie se quita a sí mismo el acceso o el rol de admin,
 * y siempre debe quedar al menos un admin activo.
 */
export async function actualizarUsuario(id, data, actual) {
  const antes = await repo.obtenerUsuario(id);
  if (!antes) throw notFound('Usuario');
  const usuario = { ...antes };
  for (const key of ['nombre', 'email', 'rol', 'sucursalId', 'empleadoId', 'activo']) {
    if (data[key] !== undefined) usuario[key] = key === 'activo' ? Boolean(data[key]) : data[key];
  }
  usuario.nombre = String(usuario.nombre).trim();
  usuario.email = String(usuario.email).trim().toLowerCase();
  if (usuario.rol === 'admin') usuario.sucursalId = null;
  await validarDatos(usuario);
  if (await repo.existeEmail(usuario.email, id)) throw new AppError('Ya existe un usuario con ese correo', 409);

  const esElMismo = Number(id) === Number(actual?.id);
  if (esElMismo && (!usuario.activo || usuario.rol !== 'admin')) {
    throw new AppError('No puedes desactivarte ni quitarte el rol de admin a ti mismo', 409);
  }
  const eraAdminActivo = antes.rol === 'admin' && antes.activo;
  if (eraAdminActivo && (!usuario.activo || usuario.rol !== 'admin') && (await repo.contarAdminsActivos()) <= 1) {
    throw new AppError('Debe quedar al menos un admin activo', 409);
  }

  if (data.password !== undefined && data.password !== '') {
    validarPassword(data.password);
    await repo.cambiarPassword(id, await bcrypt.hash(data.password, 12));
  }
  return repo.guardarUsuario(usuario);
}

/** Baja lógica: el usuario ya no puede entrar, pero su historial queda. */
export const desactivarUsuario = (id, actual) => actualizarUsuario(id, { activo: false }, actual);
