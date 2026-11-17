import fs from 'node:fs';
import { config } from './env.js';
import { buildSeed } from '../../../database/seeds/seed.mjs';

/**
 * Capa de persistencia basada en un archivo JSON.
 * Mantiene los datos en memoria y los escribe en disco después de cada cambio,
 * así la solución funciona en cualquier equipo con solo `npm install`.
 */
let cache = null;

function load() {
  if (!fs.existsSync(config.dataFile)) {
    const seed = buildSeed();
    fs.writeFileSync(config.dataFile, JSON.stringify(seed, null, 2));
    console.log(`🌱 Base de datos creada desde los seeds en ${config.dataFile}`);
  }
  const raw = fs.readFileSync(config.dataFile, 'utf-8');
  return migrar(JSON.parse(raw));
}

/**
 * Migración ligera: agrega a una base existente las colecciones nuevas
 * (usuarios y pedidos) sin borrar sus ventas ni su inventario.
 */
function migrar(data) {
  if (Array.isArray(data.usuarios) && data.usuarios.length > 0) return data;
  const seed = buildSeed();
  data.usuarios = seed.usuarios;
  data.pedidos ??= [];
  data.correlativoPedidos ??= data.pedidos.length;
  data.meta = { ...data.meta, version: 2 };
  fs.writeFileSync(config.dataFile, JSON.stringify(data, null, 2));
  console.log('🔐 Base de datos actualizada con los usuarios de demostración');
  return data;
}

export const db = {
  /** Devuelve el objeto completo de datos (colecciones). */
  get data() {
    if (!cache) cache = load();
    return cache;
  },
  /** Devuelve una colección (arreglo) por nombre. */
  collection(name) {
    const data = this.data;
    if (!Array.isArray(data[name])) data[name] = [];
    return data[name];
  },
  /** Persiste los cambios en disco. */
  save() {
    const tmp = `${config.dataFile}.tmp`;
    fs.writeFileSync(tmp, JSON.stringify(cache, null, 2));
    fs.renameSync(tmp, config.dataFile);
  },
  /** Reinicia los datos a su estado inicial (útil para pruebas y demos). */
  reset() {
    cache = buildSeed();
    this.save();
  },
};
