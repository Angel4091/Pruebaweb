import { withTransaction } from '../../config/database.js';
import { AppError, notFound, registroDesactualizado } from '../../utils/AppError.js';
import { round2, sinIva } from '../../utils/money.js';
import { newId } from '../../utils/ids.js';
import { costoProducto } from '../inventario/inventario.service.js';
import { validarSucursal } from '../general/general.service.js';
import * as repo from './productos.repository.js';
import * as inventarioRepo from '../inventario/inventario.repository.js';

/** Insumos indexados por id, con su existencia en la sucursal (o 0 si no se indica). */
async function mapaInsumos(sucursalId, db) {
  const insumos = await inventarioRepo.listarInsumosBasicos(sucursalId, db);
  return new Map(insumos.map((i) => [i.id, i]));
}

/** Los productos elaborados no tienen existencias propias: se omiten esos campos. */
function limpiar(producto) {
  if (producto.tipo === 'reventa') return { ...producto, stock: producto.stock ?? {} };
  const { stock, stockMinimo, costo, ...resto } = producto;
  return resto;
}

/** Cuántas unidades se pueden preparar o vender con el stock actual de la sucursal. */
function unidadesDisponibles(producto, insumos, sucursalId) {
  if (producto.tipo === 'reventa') return producto.stock?.[sucursalId] ?? 0;
  if (producto.receta.length === 0) return 0;
  const porInsumo = producto.receta.map((r) => {
    const ins = insumos.get(r.insumoId);
    return ins ? Math.floor(ins.existencia / r.cantidad) : 0;
  });
  return Math.max(0, Math.min(...porInsumo));
}

/**
 * Agrega datos calculados: costo, margen, receta detallada y disponibilidad.
 * El precio incluye IVA (D-14); el margen se calcula sobre el precio sin IVA,
 * porque el 13 % se le entrega a Hacienda y no es ingreso del restaurante.
 */
function enriquecerProducto(fila, insumos, sucursalId) {
  const producto = limpiar(fila);
  const costo = costoProducto(fila, insumos);
  const precioSinIva = sinIva(producto.precio);
  return {
    ...producto,
    precioSinIva,
    costo,
    margen: precioSinIva > 0 ? round2(((precioSinIva - costo) / precioSinIva) * 100) : 0,
    receta: producto.receta.map((r) => {
      const ins = insumos.get(r.insumoId);
      return { ...r, nombre: ins?.nombre ?? r.insumoId, unidad: ins?.unidad, costo: round2((ins?.costoUnitario ?? 0) * r.cantidad) };
    }),
    disponibles: sucursalId ? unidadesDisponibles(fila, insumos, sucursalId) : undefined,
  };
}

export async function listarProductos({ sucursalId, categoriaId, q, activo = true } = {}) {
  if (sucursalId) await validarSucursal(sucursalId);
  const [filas, insumos] = await Promise.all([
    repo.listarProductos({ categoriaId, texto: q?.toLowerCase().trim(), activo }),
    mapaInsumos(sucursalId),
  ]);
  return filas.map((p) => enriquecerProducto(p, insumos, sucursalId));
}

export async function obtenerProducto(id, sucursalId, db) {
  const fila = await repo.obtenerProducto(id, db);
  if (!fila) throw notFound('Producto');
  return enriquecerProducto(fila, await mapaInsumos(sucursalId, db), sucursalId);
}

/** Valida la foto de un producto: ruta pública /img/... o imagen PNG/JPG en base64 (máx. ~1 MB). */
function validarImagen(imagen) {
  if (imagen === undefined || imagen === null || imagen === '') return null;
  if (typeof imagen !== 'string') throw new AppError('La foto del producto no es válida', 422);
  if (imagen.startsWith('/img/')) return imagen;
  if (!/^data:image\/(png|jpeg);base64,/.test(imagen)) throw new AppError('La foto debe ser una imagen PNG o JPG', 422);
  if (imagen.length > 1.4 * 1024 * 1024) throw new AppError('La foto supera el máximo de 1 MB', 413);
  return imagen;
}

async function validarReceta(receta, db) {
  if (!Array.isArray(receta)) throw new AppError('La receta debe ser un arreglo de insumos', 422);
  const insumos = await mapaInsumos(null, db);
  return receta.map((r) => {
    if (!insumos.has(r.insumoId)) throw new AppError(`El insumo ${r.insumoId} no existe`, 422);
    if (!(Number(r.cantidad) > 0)) throw new AppError('Cada insumo de la receta necesita una cantidad mayor que cero', 422);
    return { insumoId: r.insumoId, cantidad: Number(r.cantidad) };
  });
}

export async function crearProducto(data) {
  const {
    nombre, precio, categoriaId, tipo = 'elaborado', descripcion = '', receta = [], costo = 0, stockMinimo = 0, arte = 'pupusa', imagen,
  } = data;
  if (!['elaborado', 'reventa'].includes(tipo)) throw new AppError('El tipo debe ser elaborado o reventa', 422);
  if (!(Number(precio) > 0)) throw new AppError('El precio debe ser mayor que cero', 422);
  if (!(await repo.existeCategoria(categoriaId))) throw new AppError('La categoría no existe', 422);

  return withTransaction(async (client) => {
    const producto = {
      id: newId('prod'),
      nombre: String(nombre).trim(),
      precio: round2(precio),
      categoriaId,
      tipo,
      descripcion,
      arte,
      imagen: validarImagen(imagen),
      costo: tipo === 'reventa' ? round2(costo) : 0,
      stockMinimo: tipo === 'reventa' ? Number(stockMinimo) : 0,
    };
    const lineas = tipo === 'elaborado' ? await validarReceta(receta, client) : [];
    if (tipo === 'elaborado' && lineas.length === 0) {
      throw new AppError('Un producto elaborado necesita al menos un insumo en su receta', 422);
    }
    await repo.crearProducto(producto, client);
    if (tipo === 'elaborado') await repo.reemplazarReceta(producto.id, lineas, client);
    else await repo.crearExistenciasReventa(producto.id, client);
    return obtenerProducto(producto.id, undefined, client);
  });
}

export async function actualizarProducto(id, data) {
  return withTransaction(async (client) => {
    const prod = await repo.obtenerProducto(id, client);
    if (!prod) throw notFound('Producto');
    if (data.nombre !== undefined) prod.nombre = String(data.nombre).trim();
    if (data.precio !== undefined) {
      if (!(Number(data.precio) > 0)) throw new AppError('El precio debe ser mayor que cero', 422);
      prod.precio = round2(data.precio);
    }
    if (data.descripcion !== undefined) prod.descripcion = data.descripcion;
    if (data.imagen !== undefined) prod.imagen = validarImagen(data.imagen);
    if (data.categoriaId !== undefined) {
      if (!(await repo.existeCategoria(data.categoriaId, client))) throw new AppError('La categoría no existe', 422);
      prod.categoriaId = data.categoriaId;
    }
    if (data.activo !== undefined) prod.activo = Boolean(data.activo);
    if (data.costo !== undefined && prod.tipo === 'reventa') prod.costo = round2(data.costo);
    if (data.stockMinimo !== undefined && prod.tipo === 'reventa') prod.stockMinimo = Number(data.stockMinimo);
    // Si el cliente manda la versión que tenía en pantalla, se compara contra esa (D-19).
    const versionLeida = data.version !== undefined ? Number(data.version) : prod.version;
    if (!(await repo.guardarProducto(prod, versionLeida, client))) throw registroDesactualizado('producto');
    if (data.receta !== undefined && prod.tipo === 'elaborado') {
      await repo.reemplazarReceta(id, await validarReceta(data.receta, client), client);
    }
    return obtenerProducto(id, undefined, client);
  });
}

/** Baja lógica: el producto deja de mostrarse en el POS pero conserva su historial. */
export const desactivarProducto = (id) => actualizarProducto(id, { activo: false });

/** Entrada de stock para productos de reventa (empacados). */
export async function entradaReventa({ productoId, sucursalId, cantidad }) {
  return withTransaction(async (client) => {
    await validarSucursal(sucursalId, client);
    const prod = await repo.obtenerProducto(productoId, client);
    if (!prod || prod.tipo !== 'reventa') throw new AppError('Solo los productos de reventa reciben entradas directas', 422);
    const qty = Number(cantidad);
    if (!(qty > 0) || !Number.isInteger(qty)) throw new AppError('La cantidad debe ser un número entero mayor que cero', 422);
    await repo.sumarExistenciaReventa(productoId, sucursalId, qty, client);
    await inventarioRepo.registrarMovimiento({ tipo: 'entrada', productoId, sucursalId, cantidad: qty, referencia: 'Entrada manual', motivo: 'entrada' }, client);
    return obtenerProducto(productoId, sucursalId, client);
  });
}

export const listarCategorias = () => repo.listarCategorias();
