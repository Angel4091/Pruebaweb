import { db } from '../config/db.js';
import { AppError } from '../utils/AppError.js';
import { newId } from '../utils/ids.js';

/* ---------- Sucursales ---------- */
export const listarSucursales = () => db.collection('sucursales');

/* ---------- Clientes ---------- */
export function listarClientes(q) {
  const texto = q?.toLowerCase().trim();
  return db
    .collection('clientes')
    .filter((c) => !texto || c.nombre.toLowerCase().includes(texto) || c.nit.includes(texto) || c.nrc.includes(texto));
}

export function crearCliente(data) {
  const tipo = data.tipo === 'contribuyente' ? 'contribuyente' : 'consumidor_final';
  if (tipo === 'contribuyente' && (!data.nit || !data.nrc || !data.giro)) {
    throw new AppError('Un contribuyente necesita NIT, NRC y giro para emitir CCF', 422);
  }
  if (data.nit && !/^\d{4}-\d{6}-\d{3}-\d$/.test(data.nit)) throw new AppError('El NIT debe tener el formato 0000-000000-000-0', 422);
  const cliente = {
    id: newId('cli'),
    nombre: String(data.nombre).trim(),
    tipo,
    nit: data.nit ?? '',
    nrc: data.nrc ?? '',
    giro: data.giro ?? '',
    direccion: data.direccion ?? '',
    telefono: data.telefono ?? '',
  };
  db.collection('clientes').push(cliente);
  db.save();
  return cliente;
}

/* ---------- Configuración de identidad visual ---------- */
const HEX = /^#[0-9a-fA-F]{6}$/;
export const FUENTES = ['Poppins', 'Roboto', 'Montserrat', 'Nunito', 'Lora', 'Playfair Display', 'Outfit'];

export const obtenerConfiguracion = () => db.data.configuracion;

export function actualizarConfiguracion(data) {
  const actual = db.data.configuracion;
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
  db.save();
  return actual;
}
