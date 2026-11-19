import { test, before, after, describe } from 'node:test';
import assert from 'node:assert/strict';
import jwt from 'jsonwebtoken';
import { prepararBase, cerrarPool, clienteApi, tokenDe, MOTIVO_SIN_BASE } from './helpers/base-de-pruebas.js';

const disponible = await prepararBase();
const skip = disponible ? false : MOTIVO_SIN_BASE;
const { createApp } = await import('../src/app.js');
const { config } = await import('../src/config/env.js');

let servidor;
let base;
const pedir = clienteApi(() => base);
const t = {};

before(async () => {
  servidor = createApp().listen(0);
  await new Promise((resolve) => servidor.once('listening', resolve));
  base = `http://127.0.0.1:${servidor.address().port}/api`;
  if (disponible) for (const rol of ['admin', 'gerente', 'cajero', 'barista']) t[rol] = await tokenDe(pedir, rol);
});

after(async () => {
  await new Promise((resolve) => servidor.close(resolve));
  await cerrarPool();
});

/** Firma un token como lo haría la API, con la posibilidad de alterar algo. */
const firmar = ({ secreto = config.jwt.secret, audiencia = config.jwt.audience, exp } = {}) =>
  jwt.sign({ rol: 'admin', ...(exp ? { exp } : {}) }, secreto, {
    subject: '1', issuer: config.jwt.issuer, audience: audiencia, algorithm: 'HS256', ...(exp ? {} : { expiresIn: '1h' }),
  });

describe('inicio de sesión', () => {
  test('con credenciales correctas devuelve token, vencimiento y usuario sin el hash', { skip }, async () => {
    const { status, body } = await pedir('/auth/login', { method: 'POST', body: { email: 'cajero@origenes.test', password: process.env.SEED_PASSWORD } });
    assert.equal(status, 200);
    assert.equal(body.token.split('.').length, 3);
    assert.ok(new Date(body.expira) > new Date());
    assert.equal(body.usuario.rol, 'cajero');
    assert.equal(body.usuario.sucursalId, 'suc-central');
    assert.ok(!('passwordHash' in body.usuario) && !('password' in body.usuario));
    const datos = jwt.decode(body.token, { complete: true });
    assert.equal(datos.header.alg, 'HS256');
    assert.equal(datos.payload.iss, 'origenes-sv-api');
    assert.equal(datos.payload.aud, 'origenes-sv-web');
  });

  test('contraseña incorrecta y correo inexistente dan el mismo 401', { skip }, async () => {
    const mala = await pedir('/auth/login', { method: 'POST', body: { email: 'admin@origenes.test', password: 'no-es-la-clave-123' } });
    const nadie = await pedir('/auth/login', { method: 'POST', body: { email: 'nadie@origenes.test', password: 'no-es-la-clave-123' } });
    assert.equal(mala.status, 401);
    assert.equal(nadie.status, 401);
    assert.deepEqual(mala.body, nadie.body);
  });

  test('sin correo o contraseña → 400', { skip }, async () => {
    const { status } = await pedir('/auth/login', { method: 'POST', body: { email: 'admin@origenes.test' } });
    assert.equal(status, 400);
  });

  test('GET /auth/me devuelve el usuario de la sesión', { skip }, async () => {
    const { status, body } = await pedir('/auth/me', { token: t.gerente });
    assert.equal(status, 200);
    assert.equal(body.rol, 'gerente');
    assert.equal(body.sucursalId, 'suc-sanmiguel');
  });
});

describe('tokens', () => {
  test('sin token → 401; las rutas públicas siguen abiertas', { skip }, async () => {
    assert.equal((await pedir('/productos')).status, 401);
    assert.equal((await pedir('/salud')).status, 200);
    assert.equal((await pedir('/configuracion')).status, 200);
  });

  test('token con otra firma, otra audiencia, vencido o sin algoritmo → 401', { skip }, async () => {
    const sinAlgoritmo = `${Buffer.from('{"alg":"none","typ":"JWT"}').toString('base64url')}.${Buffer.from(
      JSON.stringify({ sub: '1', rol: 'admin', iss: config.jwt.issuer, aud: config.jwt.audience }),
    ).toString('base64url')}.`;
    const malos = [
      firmar({ secreto: 'otro-secreto-que-no-es-el-de-la-api-0123456789' }),
      firmar({ audiencia: 'otra-aplicacion' }),
      firmar({ exp: Math.floor(Date.now() / 1000) - 60 }),
      sinAlgoritmo,
      'basura',
    ];
    for (const token of malos) {
      const { status, body } = await pedir('/productos', { token });
      assert.equal(status, 401);
      assert.deepEqual(Object.keys(body), ['error']);
    }
  });

  test('otro esquema de autorización → 401', { skip }, async () => {
    const { status } = await pedir('/productos', { headers: { authorization: `Basic ${t.admin}` } });
    assert.equal(status, 401);
  });
});

describe('permisos por rol', () => {
  const casos = [
    ['cajero', 'GET', '/compras', 403],
    ['barista', 'GET', '/caja/metodos-pago?sucursalId=suc-central', 403],
    ['barista', 'POST', '/productos', 403],
    ['cajero', 'POST', '/insumos', 403],
    ['barista', 'GET', '/empleados', 403],
    ['gerente', 'POST', '/planillas', 403],
    ['gerente', 'GET', '/usuarios', 403],
    ['gerente', 'PUT', '/configuracion', 403],
    ['cajero', 'GET', '/pronostico?sucursalId=suc-central', 403],
    ['barista', 'GET', '/productos', 200],
    ['cajero', 'GET', '/cajas?sucursalId=suc-central', 200],
    ['gerente', 'GET', '/compras', 200],
    ['admin', 'GET', '/usuarios', 200],
  ];
  for (const [rol, metodo, ruta, esperado] of casos) {
    test(`${rol} ${metodo} ${ruta} → ${esperado}`, { skip }, async () => {
      const { status } = await pedir(ruta, { method: metodo, token: t[rol], body: metodo === 'GET' ? undefined : {} });
      assert.equal(status, esperado);
    });
  }
});

describe('cada quien en su sucursal', () => {
  test('el cajero no consulta otra sucursal', { skip }, async () => {
    const { status } = await pedir('/insumos?sucursalId=suc-sanmiguel', { token: t.cajero });
    assert.equal(status, 403);
  });

  test('el cajero no vende en la caja de otra sucursal', { skip }, async () => {
    const cajas = (await pedir('/cajas?sucursalId=suc-sanmiguel', { token: t.admin })).body;
    const { status } = await pedir('/ventas', {
      method: 'POST', token: t.cajero, body: { cajaId: cajas[0].id, items: [{ productoId: 'prod-horchata', cantidad: 1 }] },
    });
    assert.equal(status, 403);
  });

  test('el gerente solo ve compras y empleados de su sucursal', { skip }, async () => {
    const compras = (await pedir('/compras', { token: t.gerente })).body;
    const empleados = (await pedir('/empleados', { token: t.gerente })).body;
    assert.ok(empleados.length > 0);
    assert.ok([...compras, ...empleados].every((x) => x.sucursalId === 'suc-sanmiguel'));
  });

  test('el gerente no edita empleados de otra sucursal', { skip }, async () => {
    const [empleado] = (await pedir('/empleados?sucursalId=suc-central', { token: t.admin })).body;
    const { status } = await pedir(`/empleados/${empleado.id}`, { method: 'PUT', token: t.gerente, body: { telefono: '2222-0000' } });
    assert.equal(status, 403);
  });

  test('la planilla del gerente solo trae a su personal', { skip }, async () => {
    const ids = new Set((await pedir('/empleados', { token: t.gerente })).body.map((e) => e.id));
    const { body } = await pedir('/planillas/calculo', { token: t.gerente });
    assert.ok(body.detalles.length > 0);
    assert.ok(body.detalles.every((d) => ids.has(d.empleadoId)));
  });
});

describe('administración de accesos', () => {
  const nuevo = { nombre: 'Cajera de prueba', email: 'nueva.cajera@origenes.test', password: 'clave-de-prueba-123', rol: 'cajero', sucursalId: 'suc-central' };
  let creado;

  test('el admin crea un usuario; la respuesta no trae la contraseña', { skip }, async () => {
    const { status, body } = await pedir('/usuarios', { method: 'POST', token: t.admin, body: nuevo });
    assert.equal(status, 201);
    assert.equal(body.email, nuevo.email);
    assert.ok(!('passwordHash' in body) && !('password' in body));
    creado = body;
  });

  test('correo repetido → 409 y contraseña corta → 422', { skip }, async () => {
    assert.equal((await pedir('/usuarios', { method: 'POST', token: t.admin, body: nuevo })).status, 409);
    const corta = { ...nuevo, email: 'otra@origenes.test', password: 'corta' };
    assert.equal((await pedir('/usuarios', { method: 'POST', token: t.admin, body: corta })).status, 422);
  });

  test('el admin no puede desactivarse a sí mismo', { skip }, async () => {
    const yo = (await pedir('/auth/me', { token: t.admin })).body;
    const { status } = await pedir(`/usuarios/${yo.id}`, { method: 'DELETE', token: t.admin });
    assert.equal(status, 409);
  });

  test('al desactivar un usuario su sesión deja de servir de inmediato', { skip }, async () => {
    const tokenNuevo = (await pedir('/auth/login', { method: 'POST', body: { email: nuevo.email, password: nuevo.password } })).body.token;
    assert.equal((await pedir('/auth/me', { token: tokenNuevo })).status, 200);
    assert.equal((await pedir(`/usuarios/${creado.id}`, { method: 'DELETE', token: t.admin })).status, 200);
    assert.equal((await pedir('/auth/me', { token: tokenNuevo })).status, 401);
    const login = await pedir('/auth/login', { method: 'POST', body: { email: nuevo.email, password: nuevo.password } });
    assert.equal(login.status, 401);
  });
});

describe('protección de la API', () => {
  test('helmet agrega encabezados de seguridad y oculta X-Powered-By', { skip }, async () => {
    const { headers } = await pedir('/salud');
    assert.equal(headers.get('x-content-type-options'), 'nosniff');
    assert.ok(headers.get('content-security-policy'));
    assert.equal(headers.get('x-powered-by'), null);
  });

  test('el límite de peticiones se anuncia en los encabezados', { skip }, async () => {
    const { headers } = await pedir('/salud');
    assert.ok(headers.get('ratelimit-policy'));
  });

  test('un cuerpo de más de 100 kb → 413; las rutas con imágenes aceptan más', { skip }, async () => {
    const grande = 'x'.repeat(200 * 1024);
    const general = await pedir('/clientes', { method: 'POST', token: t.admin, body: { nombre: grande } });
    assert.equal(general.status, 413);
    assert.deepEqual(Object.keys(general.body), ['error']);
    const producto = await pedir('/productos/no-existe', { method: 'PUT', token: t.admin, body: { imagen: grande } });
    assert.equal(producto.status, 404);
  });
});
