import { db } from '../config/db.js';
import { AppError, notFound } from '../utils/AppError.js';
import { round2 } from '../utils/money.js';
import { newId } from '../utils/ids.js';
import { costoProducto } from './inventario.service.js';

/** Cuántas unidades se pueden preparar o vender con el stock actual de la sucursal. */
function unidadesDisponibles(producto, sucursalId) {
  if (producto.tipo === 'reventa') return producto.stock?.[sucursalId] ?? 0;
  if (producto.receta.length === 0) return 0;
  const insumos = db.collection('insumos');
  const porInsumo = producto.receta.map((r) => {
    const ins = insumos.find((i) => i.id === r.insumoId);
    return ins ? Math.floor((ins.stock[sucursalId] ?? 0) / r.cantidad) : 0;
  });
  return Math.max(0, Math.min(...porInsumo));
}

/** Agrega datos calculados: costo, margen, receta detallada y disponibilidad. */
export function enriquecerProducto(producto, sucursalId) {
  const insumos = db.collection('insumos');
  const costo = costoProducto(producto);
  return {
    ...producto,
    costo,
    margen: producto.precio > 0 ? round2(((producto.precio - costo) / producto.precio) * 100) : 0,
    receta: producto.receta.map((r) => {
      const ins = insumos.find((i) => i.id === r.insumoId);
      return { ...r, nombre: ins?.nombre ?? r.insumoId, unidad: ins?.unidad, costo: round2((ins?.costoUnitario ?? 0) * r.cantidad) };
    }),
    disponibles: sucursalId ? unidadesDisponibles(producto, sucursalId) : undefined,
  };
}

export function listarProductos({ sucursalId, categoriaId, q, incluirInactivos = false } = {}) {
  const texto = q?.toLowerCase().trim();
  return db
    .collection('productos')
    .filter((p) => incluirInactivos || p.activo)
    .filter((p) => !categoriaId || p.categoriaId === categoriaId)
    .filter((p) => !texto || p.nombre.toLowerCase().includes(texto))
    .map((p) => enriquecerProducto(p, sucursalId));
}

export function obtenerProducto(id, sucursalId) {
  const prod = db.collection('productos').find((p) => p.id === id);
  if (!prod) throw notFound('Producto');
  return enriquecerProducto(prod, sucursalId);
}

function validarReceta(receta) {
  if (!Array.isArray(receta)) throw new AppError('La receta debe ser un arreglo de insumos', 422);
  const insumos = db.collection('insumos');
  return receta.map((r) => {
    if (!insumos.some((i) => i.id === r.insumoId)) throw new AppError(`El insumo ${r.insumoId} no existe`, 422);
    if (!(Number(r.cantidad) > 0)) throw new AppError('Cada insumo de la receta necesita una cantidad mayor que cero', 422);
    return { insumoId: r.insumoId, cantidad: Number(r.cantidad) };
  });
}

export function crearProducto(data) {
  const {
    nombre, precio, categoriaId, tipo = 'elaborado', descripcion = '', receta = [], costo = 0, stockMinimo = 0, arte = 'pupusa',
  } = data;
  if (!['elaborado', 'reventa'].includes(tipo)) throw new AppError('El tipo debe ser elaborado o reventa', 422);
  if (!(Number(precio) > 0)) throw new AppError('El precio debe ser mayor que cero', 422);
  if (!db.collection('categorias').some((c) => c.id === categoriaId)) throw new AppError('La categoría no existe', 422);
  const producto = {
    id: newId('prod'),
    nombre: String(nombre).trim(),
    precio: round2(precio),
    categoriaId,
    tipo,
    descripcion,
    arte,
    activo: true,
    receta: tipo === 'elaborado' ? validarReceta(receta) : [],
  };
  if (tipo === 'elaborado' && producto.receta.length === 0) {
    throw new AppError('Un producto elaborado necesita al menos un insumo en su receta', 422);
  }
  if (tipo === 'reventa') {
    producto.costo = round2(costo);
    producto.stockMinimo = Number(stockMinimo);
    producto.stock = Object.fromEntries(db.collection('sucursales').map((s) => [s.id, 0]));
  }
  db.collection('productos').push(producto);
  db.save();
  return enriquecerProducto(producto);
}

export function actualizarProducto(id, data) {
  const prod = db.collection('productos').find((p) => p.id === id);
  if (!prod) throw notFound('Producto');
  if (data.nombre !== undefined) prod.nombre = String(data.nombre).trim();
  if (data.precio !== undefined) {
    if (!(Number(data.precio) > 0)) throw new AppError('El precio debe ser mayor que cero', 422);
    prod.precio = round2(data.precio);
  }
  if (data.descripcion !== undefined) prod.descripcion = data.descripcion;
  if (data.categoriaId !== undefined) prod.categoriaId = data.categoriaId;
  if (data.activo !== undefined) prod.activo = Boolean(data.activo);
  if (data.receta !== undefined && prod.tipo === 'elaborado') prod.receta = validarReceta(data.receta);
  if (data.costo !== undefined && prod.tipo === 'reventa') prod.costo = round2(data.costo);
  if (data.stockMinimo !== undefined && prod.tipo === 'reventa') prod.stockMinimo = Number(data.stockMinimo);
  db.save();
  return enriquecerProducto(prod);
}

/** Baja lógica: el producto deja de mostrarse en el POS pero conserva su historial. */
export const desactivarProducto = (id) => actualizarProducto(id, { activo: false });

/** Entrada de stock para productos de reventa (empacados). */
export function entradaReventa({ productoId, sucursalId, cantidad }) {
  const prod = db.collection('productos').find((p) => p.id === productoId);
  if (!prod || prod.tipo !== 'reventa') throw new AppError('Solo los productos de reventa reciben entradas directas', 422);
  if (!(Number(cantidad) > 0)) throw new AppError('La cantidad debe ser mayor que cero', 422);
  prod.stock[sucursalId] = (prod.stock[sucursalId] ?? 0) + Number(cantidad);
  db.save();
  return enriquecerProducto(prod, sucursalId);
}

export const listarCategorias = () => db.collection('categorias');
