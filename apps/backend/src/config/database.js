import fs from 'node:fs';
import pg from 'pg';
import { config } from './env.js';

const { Pool, types } = pg;

// Por defecto pg entrega numeric y bigint como texto y date como Date.
// La API trabaja con números y con fechas "YYYY-MM-DD", así que se convierten aquí.
types.setTypeParser(types.builtins.NUMERIC, (valor) => Number.parseFloat(valor));
types.setTypeParser(types.builtins.INT8, (valor) => Number.parseInt(valor, 10));
types.setTypeParser(types.builtins.DATE, (valor) => valor);

/** SSL solo cuando la base lo exige (por ejemplo, un PostgreSQL en la nube). */
function opcionesSsl() {
  if (!config.db.ssl) return false;
  if (config.db.sslCa) return { rejectUnauthorized: true, ca: fs.readFileSync(config.db.sslCa, 'utf8') };
  return { rejectUnauthorized: true };
}

/**
 * Pool de conexiones: cada consulta toma una conexión libre y la devuelve al
 * terminar. Si todas están ocupadas, la consulta espera su turno.
 */
export const pool = new Pool({
  host: config.db.host,
  port: config.db.port,
  database: config.db.database,
  user: config.db.user,
  password: config.db.password,
  ssl: opcionesSsl(),
  max: 10,
  connectionTimeoutMillis: 10_000,
  idleTimeoutMillis: 30_000,
});

pool.on('error', (err) => {
  console.error('⚠️  Error en una conexión inactiva de PostgreSQL:', err.message);
});

/** Ejecuta una consulta parametrizada ($1, $2…) con una conexión del pool. */
export const query = (sql, params = []) => pool.query(sql, params);

/**
 * Ejecuta varias consultas como una sola operación: si algo falla, no queda
 * nada a medias (rollback). La función recibe el cliente de la transacción.
 */
export async function withTransaction(trabajo) {
  const client = await pool.connect();
  try {
    await client.query('begin');
    const resultado = await trabajo(client);
    await client.query('commit');
    return resultado;
  } catch (err) {
    await client.query('rollback').catch(() => {});
    throw err;
  } finally {
    client.release();
  }
}

/**
 * Usa la transacción que ya existe (si una operación es parte de otra más grande,
 * como la entrada de inventario dentro de una compra) o abre una nueva.
 */
export const usarTransaccion = (client, trabajo) => (client ? trabajo(client) : withTransaction(trabajo));

/**
 * Inserta muchas filas en lotes con una sola consulta parametrizada por lote.
 * El nombre de la tabla y las columnas son constantes del código, nunca datos del usuario.
 */
export async function insertarFilas(client, tabla, columnas, filas) {
  const LOTE = 500;
  for (let inicio = 0; inicio < filas.length; inicio += LOTE) {
    const lote = filas.slice(inicio, inicio + LOTE);
    const valores = [];
    const marcadores = lote.map((fila) => {
      const posiciones = fila.map((valor) => {
        valores.push(valor);
        return `$${valores.length}`;
      });
      return `(${posiciones.join(', ')})`;
    });
    await client.query(`insert into ${tabla} (${columnas.join(', ')}) values ${marcadores.join(', ')}`, valores);
  }
}

/** Consulta mínima para comprobar que la base responde. */
export async function probarConexion() {
  const { rows } = await pool.query('select current_database() as base, current_user as usuario, now() as hora');
  return rows[0];
}

/** Crea las tablas e índices que falten (database/schema.sql). */
export async function aplicarEsquema(cliente = pool) {
  const sql = fs.readFileSync(config.schemaFile, 'utf8');
  await cliente.query(sql);
}

export const cerrarPool = () => pool.end();
