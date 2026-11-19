import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { prepararBase, cerrarPool, clienteApi, tokenDe, MOTIVO_SIN_BASE } from './helpers/base-de-pruebas.js';

const disponible = await prepararBase();
const skip = disponible ? false : MOTIVO_SIN_BASE;
const { createApp } = await import('../src/app.js');

let servidor;
let base;
let token;
const llamar = clienteApi(() => base);
// Estas pruebas recorren la API como admin; los permisos por rol están en seguridad.test.js.
const pedir = (ruta, opciones = {}) => llamar(ruta, { token, ...opciones });

before(async () => {
  servidor = createApp().listen(0);
  await new Promise((resolve) => servidor.once('listening', resolve));
  base = `http://127.0.0.1:${servidor.address().port}/api`;
  if (disponible) token = await tokenDe(llamar, 'admin');
});

after(async () => {
  await new Promise((resolve) => servidor.close(resolve));
  await cerrarPool();
});

test('GET /salud confirma la conexión con PostgreSQL', { skip }, async () => {
  const { status, body } = await llamar('/salud');
  assert.equal(status, 200);
  assert.equal(body.baseDeDatos, 'ok');
});

test('GET /productos devuelve el menú con costo, margen y receta', { skip }, async () => {
  const { status, body } = await pedir('/productos?sucursalId=suc-central');
  assert.equal(status, 200);
  assert.ok(body.length >= 12);
  const latte = body.find((p) => p.id === 'prod-latte-grande');
  assert.deepEqual(latte.receta.map((r) => r.insumoId), ['ins-cafe', 'ins-leche', 'ins-vaso16', 'ins-tapadera', 'ins-vineta']);
  assert.ok(latte.margen > 0 && latte.disponibles > 0);
});

test('POST /ventas responde 201 con el comprobante', { skip }, async () => {
  const { status, body } = await pedir('/ventas', {
    method: 'POST',
    body: { cajaId: 'suc-central-caja-01', items: [{ productoId: 'prod-horchata', cantidad: 2 }], montoRecibido: 5 },
  });
  assert.equal(status, 201);
  assert.match(body.numero, /^FCF-01-\d{6}$/);
  assert.equal(body.cambio, +(5 - body.total).toFixed(2));
  assert.equal(body.cliente.id, 'cli-cf');
});

test('una sucursal que no existe responde 404', { skip }, async () => {
  const { status, body } = await pedir('/insumos?sucursalId=no-existe');
  assert.equal(status, 404);
  assert.match(body.error, /Sucursal/);
});

test('falta el parámetro sucursalId → 400', { skip }, async () => {
  const { status } = await pedir('/dashboard');
  assert.equal(status, 400);
});

test('un JSON mal formado → 400 sin detalles internos', { skip }, async () => {
  const { status, body } = await pedir('/ventas', { method: 'POST', body: '{ esto no es json' });
  assert.equal(status, 400);
  assert.deepEqual(Object.keys(body), ['error']);
});

test('una ruta que no existe → 404', { skip }, async () => {
  const { status } = await pedir('/no-existe');
  assert.equal(status, 404);
});
