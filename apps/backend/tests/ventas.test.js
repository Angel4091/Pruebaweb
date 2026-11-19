import { test, after } from 'node:test';
import assert from 'node:assert/strict';
import { prepararBase, pool, cerrarPool, MOTIVO_SIN_BASE } from './helpers/base-de-pruebas.js';

const disponible = await prepararBase();
const skip = disponible ? false : MOTIVO_SIN_BASE;

const ventas = await import('../src/modules/ventas/ventas.service.js');
const caja = await import('../src/modules/caja/caja.service.js');

const CAJA = 'suc-central-caja-02'; // los datos de demo la dejan con un turno abierto

after(() => cerrarPool());

async function stockDe(insumoId) {
  const { rows } = await pool.query("select cantidad from existencias where insumo_id = $1 and sucursal_id = 'suc-central'", [insumoId]);
  return rows[0].cantidad;
}

async function ultimoCorrelativo(tipo = 'FCF') {
  const { rows } = await pool.query("select ultimo from correlativos where sucursal_id = 'suc-central' and tipo = $1", [tipo]);
  return rows[0].ultimo;
}

test('calcula IVA del 13 % sobre el subtotal', () => {
  const t = ventas.calcularTotales([{ cantidad: 3, precioUnitario: 1.5 }, { cantidad: 1, precioUnitario: 2 }]);
  assert.deepEqual(t, { subtotal: 6.5, iva: 0.85, total: 7.35 });
});

test('vender un Latte grande descuenta su receta del inventario', { skip }, async () => {
  const cafe = await stockDe('ins-cafe');
  const leche = await stockDe('ins-leche');
  const vasos = await stockDe('ins-vaso16');
  await ventas.crearVenta({ cajaId: CAJA, items: [{ productoId: 'prod-latte-grande', cantidad: 2 }] });
  assert.equal(+(cafe - (await stockDe('ins-cafe'))).toFixed(3), 0.036);
  assert.equal(+(leche - (await stockDe('ins-leche'))).toFixed(2), 0.5);
  assert.equal(vasos - (await stockDe('ins-vaso16')), 2);
});

test('los correlativos avanzan por tipo de comprobante', { skip }, async () => {
  const a = await ventas.crearVenta({ cajaId: CAJA, items: [{ productoId: 'prod-agua', cantidad: 1 }] });
  const b = await ventas.crearVenta({ cajaId: CAJA, items: [{ productoId: 'prod-agua', cantidad: 1 }] });
  const n = (v) => Number(v.numero.split('-')[2]);
  assert.equal(n(b), n(a) + 1);
  assert.match(a.numero, /^FCF-01-\d{6}$/);
});

test('el CCF exige un cliente contribuyente', { skip }, async () => {
  await assert.rejects(
    ventas.crearVenta({ cajaId: CAJA, tipoComprobante: 'CCF', items: [{ productoId: 'prod-agua', cantidad: 1 }] }),
    /NIT y NRC/,
  );
});

test('rechaza la venta si no hay existencias suficientes', { skip }, async () => {
  await assert.rejects(
    ventas.crearVenta({ cajaId: CAJA, items: [{ productoId: 'prod-sopa-gallina', cantidad: 5000 }] }),
    (err) => err.status === 409,
  );
});

test('una venta rechazada no consume correlativo ni inventario (transacción)', { skip }, async () => {
  const correlativo = await ultimoCorrelativo();
  const maiz = await stockDe('ins-maiz');
  // La primera línea sí tiene existencias; la segunda no. No debe quedar nada a medias.
  await assert.rejects(
    ventas.crearVenta({ cajaId: CAJA, items: [{ productoId: 'prod-pupusa-queso', cantidad: 1 }, { productoId: 'prod-sopa-gallina', cantidad: 5000 }] }),
    (err) => err.status === 409,
  );
  assert.equal(await ultimoCorrelativo(), correlativo);
  assert.equal(await stockDe('ins-maiz'), maiz);
});

test('anular una venta devuelve los insumos', { skip }, async () => {
  const antes = await stockDe('ins-maiz');
  const v = await ventas.crearVenta({ cajaId: CAJA, items: [{ productoId: 'prod-pupusa-queso', cantidad: 4 }] });
  await ventas.anularVenta(v.id);
  assert.equal(+(await stockDe('ins-maiz')).toFixed(4), +antes.toFixed(4));
});

test('no se puede abrir una caja que ya tiene turno abierto', { skip }, async () => {
  await assert.rejects(caja.abrirCaja(CAJA, { montoInicial: 50 }), (err) => err.status === 409);
});

test('el cierre de caja cuadra el efectivo esperado', { skip }, async () => {
  const resumen = await caja.resumenCaja(CAJA);
  const cierre = await caja.cerrarCaja(CAJA, { efectivoContado: resumen.totales.efectivoEsperado });
  assert.equal(cierre.totales.diferencia, 0);
  assert.equal(cierre.estado, 'cerrada');
  await assert.rejects(
    ventas.crearVenta({ cajaId: CAJA, items: [{ productoId: 'prod-agua', cantidad: 1 }] }),
    (err) => err.status === 409,
  );
});
