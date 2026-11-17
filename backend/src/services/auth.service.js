import { db } from '../config/db.js';
import { config } from '../config/env.js';
import { AppError } from '../utils/AppError.js';
import { newId } from '../utils/ids.js';
import { hashPassword, verificarPassword, firmarToken } from '../utils/seguridad.js';

export const ROLES = ['administrador', 'cajero', 'cocinero', 'cliente'];
const CORREO = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/** Datos públicos del usuario (nunca se devuelve el hash de la contraseña). */
export function perfil(usuario) {
  const { passwordHash, ...publico } = usuario;
  return publico;
}

function emitirSesion(usuario) {
  const token = firmarToken({ sub: usuario.id, rol: usuario.rol }, config.jwtSecret);
  return { token, usuario: perfil(usuario) };
}

export function login({ correo, password }) {
  const usuario = db.collection('usuarios').find((u) => u.correo === String(correo ?? '').trim().toLowerCase());
  // Mismo mensaje si el correo no existe o la contraseña falla, para no revelar qué cuentas existen.
  if (!usuario || !verificarPassword(password, usuario.passwordHash)) {
    throw new AppError('Correo o contraseña incorrectos', 401);
  }
  if (!usuario.activo) throw new AppError('Esta cuenta está desactivada. Consulta con el administrador.', 403);
  return emitirSesion(usuario);
}

/** Registro público: crea una cuenta de cliente y su ficha de cliente para facturación. */
export function registrarCliente({ nombre, correo, password, telefono = '' }) {
  const email = String(correo ?? '').trim().toLowerCase();
  if (!String(nombre ?? '').trim()) throw new AppError('Escribe tu nombre', 422);
  if (!CORREO.test(email)) throw new AppError('Escribe un correo válido', 422);
  if (String(password ?? '').length < 8) throw new AppError('La contraseña debe tener al menos 8 caracteres', 422);
  if (db.collection('usuarios').some((u) => u.correo === email)) throw new AppError('Ya existe una cuenta con ese correo', 409);

  const cliente = {
    id: newId('cli'),
    nombre: String(nombre).trim(),
    tipo: 'consumidor_final',
    nit: '',
    nrc: '',
    giro: '',
    direccion: '',
    telefono,
  };
  const usuario = {
    id: newId('usr'),
    nombre: cliente.nombre,
    correo: email,
    rol: 'cliente',
    clienteId: cliente.id,
    sucursalId: null,
    activo: true,
    passwordHash: hashPassword(password),
  };
  db.collection('clientes').push(cliente);
  db.collection('usuarios').push(usuario);
  db.save();
  return emitirSesion(usuario);
}

export function obtenerUsuario(id) {
  return db.collection('usuarios').find((u) => u.id === id && u.activo);
}
