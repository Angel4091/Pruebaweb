import { AppError, notFound } from '../../utils/AppError.js';
import { newId } from '../../utils/ids.js';
import { withTransaction, probarConexion } from '../../config/database.js';
import { cargarDatosDemo } from '../../config/datos-demo.js';
import * as repo from './general.repository.js';

/* ---------- Sucursales ---------- */

export const listarSucursales = () => repo.listarSucursales();

/** Devuelve la sucursal o lanza 404. La usan los demás módulos para validar el parámetro sucursalId. */
export async function validarSucursal(sucursalId, db) {
  const sucursal = await repo.obtenerSucursal(sucursalId, db);
  if (!sucursal) throw notFound('Sucursal');
  return sucursal;
}

/* ---------- Clientes ---------- */

export const listarClientes = (q) => repo.listarClientes(q?.toLowerCase().trim());

export async function obtenerCliente(id, db) {
  const cliente = await repo.obtenerCliente(id, db);
  if (!cliente) throw notFound('Cliente');
  return cliente;
}

export async function crearCliente(data) {
  const tipo = data.tipo === 'contribuyente' ? 'contribuyente' : 'consumidor_final';
  if (tipo === 'contribuyente' && (!data.nit || !data.nrc || !data.giro)) {
    throw new AppError('Un contribuyente necesita NIT, NRC y giro para emitir CCF', 422);
  }
  if (data.nit && !/^\d{4}-\d{6}-\d{3}-\d$/.test(data.nit)) throw new AppError('El NIT debe tener el formato 0000-000000-000-0', 422);
  return repo.crearCliente({
    id: newId('cli'),
    nombre: String(data.nombre).trim(),
    tipo,
    nit: data.nit ?? '',
    nrc: data.nrc ?? '',
    giro: data.giro ?? '',
    direccion: data.direccion ?? '',
    telefono: data.telefono ?? '',
  });
}

/* ---------- Identidad visual ---------- */

const HEX = /^#[0-9a-fA-F]{6}$/;
export const FUENTES = ['Poppins', 'Roboto', 'Montserrat', 'Nunito', 'Lora', 'Playfair Display', 'Outfit'];

export async function obtenerConfiguracion() {
  const configuracion = await repo.obtenerConfiguracion();
  if (!configuracion) throw notFound('Configuración');
  return configuracion;
}

export async function actualizarConfiguracion(data) {
  const actual = await obtenerConfiguracion();
  if (data.nombre !== undefined) {
    if (!String(data.nombre).trim()) throw new AppError('El nombre del restaurante no puede quedar vacío', 422);
    actual.nombre = String(data.nombre).trim();
  }
  if (data.eslogan !== undefined) actual.eslogan = String(data.eslogan);
  if (data.logo !== undefined) {
    if (data.logo !== null && !/^data:image\/(png|jpeg);base64,/.test(data.logo)) throw new AppError('El logo debe ser una imagen PNG o JPG', 422);
    if (data.logo && data.logo.length > 2.8 * 1024 * 1024) throw new AppError('El logo supera el máximo de 2 MB', 413);
    actual.logo = data.logo;
  }
  if (data.colores) {
    for (const [key, value] of Object.entries(data.colores)) {
      if (!(key in actual.colores)) continue;
      if (!HEX.test(value)) throw new AppError(`El color ${key} no es un hexadecimal válido`, 422);
      actual.colores[key] = value.toUpperCase();
    }
  }
  if (data.fuentes) {
    for (const key of ['principal', 'secundaria']) {
      if (data.fuentes[key] === undefined) continue;
      if (!FUENTES.includes(data.fuentes[key])) throw new AppError(`Fuente no disponible: ${data.fuentes[key]}`, 422);
      actual.fuentes[key] = data.fuentes[key];
    }
  }
  if (data.componentes) {
    for (const key of Object.keys(actual.componentes)) {
      if (data.componentes[key] !== undefined) actual.componentes[key] = Boolean(data.componentes[key]);
    }
  }
  return repo.guardarConfiguracion(actual);
}

/* ---------- Sistema ---------- */

/** Vuelve a cargar los datos de demostración en una sola transacción. */
export async function reiniciarDatos() {
  await withTransaction((client) => cargarDatosDemo(client));
}

/** Estado de la API y de la base de datos. */
export async function salud() {
  try {
    await probarConexion();
    return { estado: 'ok', baseDeDatos: 'ok', fecha: new Date().toISOString() };
  } catch {
    return { estado: 'degradado', baseDeDatos: 'sin conexión', fecha: new Date().toISOString() };
  }
}
