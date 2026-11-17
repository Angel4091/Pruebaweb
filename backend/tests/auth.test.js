import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import os from 'node:os';
import path from 'node:path';

// Archivo de datos temporal para no tocar la base de desarrollo.
process.env.DATA_FILE = path.join(os.tmpdir(), `origenes-auth-${Date.now()}.json`);

const { hashPassword, verificarPassword, firmarToken, verificarToken } = await import('../src/utils/seguridad.js');
const { createApp } = await import('../src/app.js');
const { db } = await import('../src/config/db.js');

let servidor;
let base;

before(async () => {
  db.reset();
  servidor = createApp().listen(0);
  await new Promise((r) => servidor.once('listening', r));
  base = `http://127.0.0.1:${servidor.address().port}/api`;
});
after(() => servidor.close());

const pedir = async (ruta, { token, metodo = 'GET', cuerpo } = {}) => {
  const r = await fetch(`${base}${ruta}`, {
    method: metodo,
    headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
    body: cuerpo ? JSON.stringify(cuerpo) : undefined,
  });
  return { status: r.status, datos: await r.json() };
};
const entrar = async (correo, password) => (await pedir('/auth/login', { metodo: 'POST', cuerpo: { correo, password } })).datos.token;

test('las contraseñas se guardan cifradas y se verifican', () => {
  const hash = hashPassword('secreta123');
  assert.match(hash, /^scrypt\$/);
  assert.equal(verificarPassword('secreta123', hash), true);
  assert.equal(verificarPassword('otra', hash), false);
});

test('un token alterado o vencido no es válido', () => {
  const token = firmarToken({ sub: 'u1', rol: 'cliente' }, 'clave');
  assert.equal(verificarToken(token, 'clave').sub, 'u1');
  const [c, , f] = token.split('.');
  const falso = Buffer.from(JSON.stringify({ sub: 'u1', rol: 'administrador', exp: 9e9 })).toString('base64url');
  assert.equal(verificarToken(`${c}.${falso}.${f}`, 'clave'), null);
  assert.equal(verificarToken(firmarToken({ sub: 'u1' }, 'clave', -10), 'clave'), null);
});

test('login rechaza credenciales incorrectas', async () => {
  const r = await pedir('/auth/login', { metodo: 'POST', cuerpo: { correo: 'admin@origenes.sv', password: 'mala' } });
  assert.equal(r.status, 401);
});

test('sin sesión la API responde 401', async () => {
  assert.equal((await pedir('/dashboard?sucursalId=suc-central')).status, 401);
});

test('el cliente no ve estadísticas pero sí el menú', async () => {
  const token = await entrar('cliente@origenes.sv', 'Cliente2026!');
  assert.equal((await pedir('/dashboard?sucursalId=suc-central', { token })).status, 403);
  assert.equal((await pedir('/empleados', { token })).status, 403);
  assert.equal((await pedir('/productos', { token })).status, 200);
});

test('el administrador ve el tablero; el cocinero no puede vender', async () => {
  const admin = await entrar('admin@origenes.sv', 'Admin2026!');
  const cocina = await entrar('cocina@origenes.sv', 'Cocina2026!');
  assert.equal((await pedir('/dashboard?sucursalId=suc-central', { token: admin })).status, 200);
  assert.equal((await pedir('/insumos?sucursalId=suc-central', { token: cocina })).status, 200);
  const venta = await pedir('/ventas', { token: cocina, metodo: 'POST', cuerpo: { cajaId: 'suc-central-caja-01', items: [] } });
  assert.equal(venta.status, 403);
});

test('flujo de pedido en línea: cliente ordena, caja cobra y cocina entrega', async () => {
  const cliente = await entrar('cliente@origenes.sv', 'Cliente2026!');
  const cajero = await entrar('cajero@origenes.sv', 'Cajero2026!');
  const cocina = await entrar('cocina@origenes.sv', 'Cocina2026!');
  const items = [{ productoId: 'prod-pupusa-queso', cantidad: 3 }];

  const { status, datos: pedido } = await pedir('/pedidos', { token: cliente, metodo: 'POST', cuerpo: { sucursalId: 'suc-central', items } });
  assert.equal(status, 201);
  assert.equal(pedido.estado, 'recibido');

  for (const estado of ['en_preparacion', 'listo']) {
    assert.equal((await pedir(`/pedidos/${pedido.id}/estado`, { token: cocina, metodo: 'PATCH', cuerpo: { estado } })).status, 200);
  }
  // No se entrega sin cobrar.
  assert.equal((await pedir(`/pedidos/${pedido.id}/estado`, { token: cocina, metodo: 'PATCH', cuerpo: { estado: 'entregado' } })).status, 409);

  const cajas = (await pedir('/cajas?sucursalId=suc-central', { token: cajero })).datos;
  const caja = cajas.find((c) => c.estado === 'abierta') ?? cajas[0];
  if (caja.estado !== 'abierta') await pedir(`/cajas/${caja.id}/apertura`, { token: cajero, metodo: 'POST', cuerpo: { montoInicial: 20 } });
  const venta = await pedir('/ventas', { token: cajero, metodo: 'POST', cuerpo: { cajaId: caja.id, items, pedidoId: pedido.id } });
  assert.equal(venta.status, 201);

  const entrega = await pedir(`/pedidos/${pedido.id}/estado`, { token: cocina, metodo: 'PATCH', cuerpo: { estado: 'entregado' } });
  assert.equal(entrega.status, 200);
  const mios = (await pedir('/pedidos/mios', { token: cliente })).datos;
  assert.equal(mios.find((p) => p.id === pedido.id).estado, 'entregado');
});
