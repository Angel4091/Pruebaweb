import { test, before, after, describe } from 'node:test';
import assert from 'node:assert/strict';
import { prepararBase, cerrarPool, clienteApi, tokenDe, MOTIVO_SIN_BASE } from './helpers/base-de-pruebas.js';

/**
 * Reglas de la Fase 5: IVA incluido (D-14), quién registró y versión (D-19), CRUD de catálogos
 * con baja lógica, paginación en el servidor y bitácora de auditoría.
 */
const disponible = await prepararBase();
const skip = disponible ? false : MOTIVO_SIN_BASE;
const { createApp } = await import('../src/app.js');

let servidor;
let base;
const llamar = clienteApi(() => base);
const t = {};
const ids = {};

before(async () => {
  servidor = createApp().listen(0);
  await new Promise((resolve) => servidor.once('listening', resolve));
  base = `http://127.0.0.1:${servidor.address().port}/api`;
  if (!disponible) return;
  for (const rol of ['admin', 'gerente', 'cajero']) {
    t[rol] = await tokenDe(llamar, rol);
    ids[rol] = (await llamar('/auth/me', { token: t[rol] })).body.id;
  }
});

after(async () => {
  await new Promise((resolve) => servidor.close(resolve));
  await cerrarPool();
});

const vender = (body, token = t.cajero) => llamar('/ventas', { method: 'POST', token, body: { cajaId: 'suc-central-caja-01', ...body } });

describe('IVA incluido en el precio (D-14)', () => {
  test('una factura de consumidor final cobra el precio del menú y desglosa el IVA', { skip }, async () => {
    const { status, body } = await vender({ items: [{ productoId: 'prod-latte-grande', cantidad: 1 }] });
    assert.equal(status, 201);
    // Latte grande: $2.75 en el menú → $2.75 a pagar, $2.43 sin IVA y $0.32 de IVA.
    assert.deepEqual([body.total, body.subtotal, body.iva], [2.75, 2.43, 0.32]);
  });

  test('el crédito fiscal tiene el mismo total, con el IVA aparte', { skip }, async () => {
    const { status, body } = await vender({ tipoComprobante: 'CCF', clienteId: 'cli-roble', items: [{ productoId: 'prod-latte-grande', cantidad: 2 }] });
    assert.equal(status, 201);
    assert.equal(body.total, 5.5);
    assert.equal(Math.round((body.subtotal + body.iva) * 100), 550);
  });

  test('el margen del producto se calcula sobre el precio sin IVA', { skip }, async () => {
    const latte = (await llamar('/productos/prod-latte-grande', { token: t.admin })).body;
    assert.equal(latte.precioSinIva, 2.43);
    assert.equal(latte.margen, Math.round(((2.43 - latte.costo) / 2.43) * 10000) / 100);
  });
});

describe('quién registró y versión (D-19)', () => {
  test('el comprobante dice quién atendió', { skip }, async () => {
    const yo = (await llamar('/auth/me', { token: t.cajero })).body;
    const { body } = await vender({ items: [{ productoId: 'prod-horchata', cantidad: 1 }] });
    assert.equal(body.atendio, yo.nombre);
    assert.equal(body.creadoPor, yo.id);
  });

  test('la compra guarda quién la registró', { skip }, async () => {
    const { status, body } = await llamar('/compras', {
      method: 'POST', token: t.admin,
      body: { numeroFactura: 'CCF-PRUEBA-1', sucursalId: 'suc-central', tipo: 'gasto', monto: 20, proveedorNombre: 'ANDA', descripcion: 'Agua' },
    });
    assert.equal(status, 201);
    assert.equal(body.compra.creadoPor, ids.admin);
    assert.ok(body.compra.registradoPor);
  });

  test('editar un insumo con una versión vieja responde 409', { skip }, async () => {
    const insumos = (await llamar('/insumos?sucursalId=suc-central', { token: t.admin })).body;
    const queso = insumos.find((i) => i.id === 'ins-queso');
    const primera = await llamar('/insumos/ins-queso', { method: 'PUT', token: t.admin, body: { stockMinimo: 6, version: queso.version } });
    assert.equal(primera.status, 200);
    assert.equal(primera.body.version, queso.version + 1);
    // Otra persona tenía abierta la versión anterior.
    const segunda = await llamar('/insumos/ins-queso', { method: 'PUT', token: t.admin, body: { stockMinimo: 8, version: queso.version } });
    assert.equal(segunda.status, 409);
    assert.match(segunda.body.error, /Alguien más modificó/);
  });

  test('editar un producto con una versión vieja responde 409', { skip }, async () => {
    const horchata = (await llamar('/productos/prod-horchata', { token: t.admin })).body;
    assert.equal((await llamar('/productos/prod-horchata', { method: 'PUT', token: t.admin, body: { descripcion: 'Fría', version: horchata.version } })).status, 200);
    assert.equal((await llamar('/productos/prod-horchata', { method: 'PUT', token: t.admin, body: { descripcion: 'Tibia', version: horchata.version } })).status, 409);
  });
});

describe('catálogos completos con baja lógica (BE-022)', () => {
  test('clientes: crear, editar, desactivar y no venderle a uno desactivado', { skip }, async () => {
    const creado = await llamar('/clientes', { method: 'POST', token: t.cajero, body: { nombre: 'Café El Portal' } });
    assert.equal(creado.status, 201);
    const id = creado.body.id;
    const editado = await llamar(`/clientes/${id}`, { method: 'PUT', token: t.gerente, body: { telefono: '2222-3333' } });
    assert.equal(editado.body.telefono, '2222-3333');
    assert.equal((await llamar(`/clientes/${id}`, { method: 'PUT', token: t.cajero, body: { telefono: '1' } })).status, 403);
    assert.equal((await llamar(`/clientes/${id}`, { method: 'DELETE', token: t.admin })).body.activo, false);
    const activos = (await llamar('/clientes', { token: t.admin })).body;
    const todos = (await llamar('/clientes?activo=todos', { token: t.admin })).body;
    assert.ok(!activos.some((c) => c.id === id) && todos.some((c) => c.id === id));
    assert.equal((await vender({ clienteId: id, items: [{ productoId: 'prod-horchata', cantidad: 1 }] })).status, 422);
  });

  test('el cliente "Consumidor final" no se puede desactivar', { skip }, async () => {
    assert.equal((await llamar('/clientes/cli-cf', { method: 'DELETE', token: t.admin })).status, 409);
  });

  test('un insumo que usa una receta activa no se desactiva; uno sin uso sí', { skip }, async () => {
    const enUso = await llamar('/insumos/ins-cafe', { method: 'DELETE', token: t.admin });
    assert.equal(enUso.status, 409);
    assert.match(enUso.body.error, /Latte/);
    const nuevo = await llamar('/insumos', { method: 'POST', token: t.admin, body: { nombre: 'Canela', unidad: 'kg', stockMinimo: 1, costoUnitario: 4 } });
    assert.equal((await llamar(`/insumos/${nuevo.body.id}`, { method: 'DELETE', token: t.admin })).body.activo, false);
    const inactivos = (await llamar('/insumos?sucursalId=suc-central&activo=false', { token: t.admin })).body;
    assert.deepEqual(inactivos.map((i) => i.id), [nuevo.body.id]);
  });

  test('proveedores: desactivar lo saca de la lista y ya no recibe compras', { skip }, async () => {
    assert.equal((await llamar('/proveedores/prov-selecto', { method: 'DELETE', token: t.gerente })).body.activo, false);
    assert.ok(!(await llamar('/proveedores', { token: t.admin })).body.some((p) => p.id === 'prov-selecto'));
    const compra = await llamar('/compras', {
      method: 'POST', token: t.admin,
      body: { numeroFactura: 'CCF-PRUEBA-2', sucursalId: 'suc-central', proveedorId: 'prov-selecto', items: [{ insumoId: 'ins-tomate', cantidad: 1, costoUnitario: 1 }] },
    });
    assert.equal(compra.status, 422);
    assert.equal((await llamar('/proveedores/prov-selecto', { method: 'PUT', token: t.admin, body: { activo: true } })).body.activo, true);
  });

  test('?activo con un valor que no existe → 400', { skip }, async () => {
    assert.equal((await llamar('/proveedores?activo=quizas', { token: t.admin })).status, 400);
  });
});

describe('paginación en el servidor', () => {
  test('ventas: página, total y número de páginas', { skip }, async () => {
    const { status, body } = await llamar('/ventas?sucursalId=suc-central&porPagina=5&pagina=2', { token: t.admin });
    assert.equal(status, 200);
    assert.equal(body.datos.length, 5);
    assert.equal(body.pagina, 2);
    assert.equal(body.paginas, Math.ceil(body.total / 5));
    assert.ok(body.total > 10);
  });

  test('ventas: filtros por comprobante y por fechas', { skip }, async () => {
    const ccf = (await llamar('/ventas?tipoComprobante=CCF&porPagina=100', { token: t.admin })).body;
    assert.ok(ccf.datos.length > 0 && ccf.datos.every((v) => v.tipoComprobante === 'CCF'));
    const hoy = new Date().toLocaleDateString('en-CA');
    const deHoy = (await llamar(`/ventas?desde=${hoy}&hasta=${hoy}&porPagina=100`, { token: t.admin })).body;
    assert.ok(deHoy.datos.every((v) => new Date(v.fecha).toLocaleDateString('en-CA') === hoy));
  });

  test('parámetros inválidos → 400 y nunca más de 100 por página', { skip }, async () => {
    assert.equal((await llamar('/ventas?pagina=0', { token: t.admin })).status, 400);
    assert.equal((await llamar('/ventas?desde=2026-11-10&hasta=2026-11-01', { token: t.admin })).status, 400);
    assert.equal((await llamar('/ventas?desde=ayer', { token: t.admin })).status, 400);
    assert.equal((await llamar('/ventas?porPagina=500', { token: t.admin })).body.porPagina, 100);
  });

  test('compras: historial paginado y filtrado por tipo', { skip }, async () => {
    const { body } = await llamar('/compras?tipo=gasto&porPagina=3', { token: t.admin });
    assert.ok(Array.isArray(body.datos) && body.datos.length <= 3);
    assert.ok(body.datos.every((c) => c.tipo === 'gasto'));
    assert.equal(typeof body.total, 'number');
  });
});

describe('bitácora de auditoría (BE-032 y BE-033)', () => {
  test('una venta queda registrada con quién, qué y sobre qué registro', { skip }, async () => {
    const venta = (await vender({ items: [{ productoId: 'prod-horchata', cantidad: 1 }] })).body;
    const { body } = await llamar(`/bitacora?entidad=ventas&usuarioId=${ids.cajero}`, { token: t.admin });
    const registro = body.datos.find((r) => r.entidadId === venta.id);
    assert.ok(registro, 'la venta debe estar en la bitácora');
    assert.equal(registro.accion, 'crear');
    assert.equal(registro.detalle.referencia, venta.numero);
    assert.equal(registro.usuarioRol, 'cajero');
  });

  test('las acciones sobre un registro usan el último tramo de la ruta (anular, apertura, cierre…)', { skip }, async () => {
    const venta = (await vender({ items: [{ productoId: 'prod-horchata', cantidad: 1 }] }, t.admin)).body;
    assert.equal((await llamar(`/ventas/${venta.id}/anular`, { method: 'PATCH', token: t.admin, body: { motivo: 'Prueba' } })).status, 200);
    const { body } = await llamar('/bitacora?entidad=ventas&accion=anular', { token: t.admin });
    assert.ok(body.datos.some((r) => r.entidadId === venta.id));
  });

  test('el inicio de sesión queda registrado', { skip }, async () => {
    const { body } = await llamar(`/bitacora?entidad=sesion&usuarioId=${ids.gerente}`, { token: t.admin });
    assert.ok(body.total >= 1);
    assert.equal(body.datos[0].accion, 'inicio_sesion');
  });

  test('nunca guarda contraseñas', { skip }, async () => {
    const nuevo = await llamar('/usuarios', {
      method: 'POST', token: t.admin,
      body: { nombre: 'Auditoría', email: 'auditoria@origenes.test', password: 'clave-de-prueba-123', rol: 'cajero', sucursalId: 'suc-central' },
    });
    assert.equal(nuevo.status, 201);
    const { body } = await llamar('/bitacora?entidad=usuarios&accion=crear', { token: t.admin });
    const registro = body.datos.find((r) => r.entidadId === String(nuevo.body.id));
    assert.ok(registro);
    assert.equal(registro.detalle.datos.email, 'auditoria@origenes.test');
    assert.ok(!JSON.stringify(registro).includes('clave-de-prueba-123'));
  });

  test('lo que falla no se registra', { skip }, async () => {
    const antes = (await llamar('/bitacora?entidad=clientes', { token: t.admin })).body.total;
    assert.equal((await llamar('/clientes/cli-cf', { method: 'DELETE', token: t.admin })).status, 409);
    assert.equal((await llamar('/bitacora?entidad=clientes', { token: t.admin })).body.total, antes);
  });

  test('solo el admin consulta la bitácora', { skip }, async () => {
    assert.equal((await llamar('/bitacora', { token: t.gerente })).status, 403);
    assert.equal((await llamar('/bitacora?usuarioId=abc', { token: t.admin })).status, 400);
  });
});
