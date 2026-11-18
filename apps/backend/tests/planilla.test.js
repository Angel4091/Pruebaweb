import { test } from 'node:test';
import assert from 'node:assert/strict';
import { calcularRenta, calcularDetalleEmpleado } from '../src/utils/planilla.js';

test('salario bajo el tramo I no retiene renta', () => {
  assert.deepEqual(calcularRenta(250), { renta: 0, tramo: 'I' });
});

test('tramo II: 10 % sobre el exceso de $275 + $8.83', () => {
  assert.equal(calcularRenta(375).renta, 18.83);
});

test('tramo III: 20 % sobre el exceso de $447.62 + $30', () => {
  assert.equal(calcularRenta(634.25).renta, 67.33);
});

test('ISSS respeta el techo quincenal de $15', () => {
  const detalle = calcularDetalleEmpleado({ id: 'e1', nombre: 'Prueba', cargo: 'Gerente', salarioMensual: 1400 });
  assert.equal(detalle.isss, 15);
  assert.equal(detalle.afp, 50.75);
  assert.equal(detalle.liquido, +(700 - 15 - 50.75 - detalle.renta).toFixed(2));
});

test('salario mínimo: ISSS 3 %, AFP 7.25 % y sin renta', () => {
  const d = calcularDetalleEmpleado({ id: 'e2', nombre: 'Prueba', cargo: 'Mesero', salarioMensual: 408.8 });
  assert.equal(d.salarioQuincenal, 204.4);
  assert.equal(d.isss, 6.13);
  assert.equal(d.afp, 14.82);
  assert.equal(d.renta, 0);
});
