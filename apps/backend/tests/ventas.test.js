import { test, before } from 'node:test';
import assert from 'node:assert/strict';
import os from 'node:os';
import path from 'node:path';

// Usa un archivo de datos temporal para no tocar la base de desarrollo.
process.env.DATA_FILE = path.join(os.tmpdir(), `origenes-test-${Date.now()}.json`);

const { db } = await import('../src/config/db.js');
const ventas = await import('../src/services/ventas.service.js');
const caja = await import('../src/services/caja.service.js');

const CAJA = 'suc-central-caja-02';

before(() => {
  db.reset();
  if (!caja.turnoAbierto(CAJA)) caja.abrirCaja(CAJA, { montoInicial: 50 });
});

const stockDe = (id) => db.collection('insumos').find((i) => i.id === id).stock['suc-central'];

test('calcula IVA del 13 % sobre el subtotal', () => {
  const t = ventas.calcularTotales([{ cantidad: 3, precioUnitario: 1.5 }, { cantidad: 1, precioUnitario: 2 }]);
  assert.deepEqual(t, { subtotal: 6.5, iva: 0.85, total: 7.35 });
});

test('vender un Latte grande descuenta su receta del inventario', () => {
  const cafe = stockDe('ins-cafe');
  const leche = stockDe('ins-leche');
  const vasos = stockDe('ins-vaso16');
  ventas.crearVenta({ cajaId: CAJA, items: [{ productoId: 'prod-latte-grande', cantidad: 2 }] });
  assert.equal(+(cafe - stockDe('ins-cafe')).toFixed(3), 0.036);
  assert.equal(+(leche - stockDe('ins-leche')).toFixed(2), 0.5);
  assert.equal(vasos - stockDe('ins-vaso16'), 2);
});

test('los correlativos avanzan por tipo de comprobante', () => {
  const a = ventas.crearVenta({ cajaId: CAJA, items: [{ productoId: 'prod-agua', cantidad: 1 }] });
  const b = ventas.crearVenta({ cajaId: CAJA, items: [{ productoId: 'prod-agua', cantidad: 1 }] });
  const n = (v) => Number(v.numero.split('-')[2]);
  assert.equal(n(b), n(a) + 1);
  assert.match(a.numero, /^FCF-01-\d{6}$/);
});

test('el CCF exige un cliente contribuyente', () => {
  assert.throws(
    () => ventas.crearVenta({ cajaId: CAJA, tipoComprobante: 'CCF', items: [{ productoId: 'prod-agua', cantidad: 1 }] }),
    /NIT y NRC/,
  );
});

test('rechaza la venta si no hay existencias suficientes', () => {
  assert.throws(
    () => ventas.crearVenta({ cajaId: CAJA, items: [{ productoId: 'prod-sopa-gallina', cantidad: 5000 }] }),
    (err) => err.status === 409,
  );
});

test('anular una venta devuelve los insumos', () => {
  const antes = stockDe('ins-maiz');
  const v = ventas.crearVenta({ cajaId: CAJA, items: [{ productoId: 'prod-pupusa-queso', cantidad: 4 }] });
  ventas.anularVenta(v.id);
  assert.equal(+stockDe('ins-maiz').toFixed(4), +antes.toFixed(4));
});

test('el cierre de caja cuadra el efectivo esperado', () => {
  const resumen = caja.resumenCaja(CAJA);
  const cierre = caja.cerrarCaja(CAJA, { efectivoContado: resumen.totales.efectivoEsperado });
  assert.equal(cierre.totales.diferencia, 0);
  assert.equal(cierre.estado, 'cerrada');
});
