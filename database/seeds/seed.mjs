/**
 * Datos iniciales de Restaurante Orígenes SV.
 *
 * `buildSeed()` arma todas las colecciones (sucursales, menú, insumos, recetas,
 * empleados, compras, historial de ventas y turnos de caja). El historial se genera
 * de forma determinística respecto a la fecha actual, para que el tablero y el
 * pronóstico siempre tengan datos recientes.
 *
 * Uso por consola:  node database/seeds/seed.mjs --force
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import {
  calcularDetalleEmpleado,
  totalizarPlanilla,
} from '../../backend/src/utils/planilla.js';

const round2 = (v) => Math.round((Number(v) + Number.EPSILON) * 100) / 100;
const pad = (n, size = 2) => String(n).padStart(size, '0');
const dateKey = (d) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;

/** Generador pseudoaleatorio con semilla (mulberry32) para datos reproducibles. */
function rng(seed) {
  let a = seed;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const sucursales = [
  { id: 'suc-central', codigo: '01', nombre: 'Sucursal Central', direccion: 'Col. Escalón, San Salvador', telefono: '2200-1100' },
  { id: 'suc-sanmiguel', codigo: '02', nombre: 'Sucursal San Miguel', direccion: 'Av. Roosevelt, San Miguel', telefono: '2660-3300' },
];

const cajas = sucursales.flatMap((s) => [
  { id: `${s.id}-caja-01`, nombre: 'Caja 01', sucursalId: s.id },
  { id: `${s.id}-caja-02`, nombre: 'Caja 02', sucursalId: s.id },
]);

const proveedores = [
  { id: 'prov-favorita', nombre: 'Distribuidora La Favorita', nit: '0614-120398-101-3', nrc: '102938-4', telefono: '2250-4400', correo: 'ventas@lafavorita.sv', contacto: 'Mario Quintanilla', diasCredito: 15 },
  { id: 'prov-selecto', nombre: 'Supermercado Selecto', nit: '0614-050589-102-1', nrc: '210045-6', telefono: '2260-8000', correo: 'mayoreo@selecto.sv', contacto: 'Patricia Rivas', diasCredito: 0 },
  { id: 'prov-lacteos', nombre: 'Lácteos San Julián', nit: '0315-221101-103-9', nrc: '330021-1', telefono: '2453-1200', correo: 'pedidos@lacteossj.sv', contacto: 'Ernesto Calderón', diasCredito: 8 },
  { id: 'prov-granjero', nombre: 'Avícola El Granjero', nit: '0502-110712-104-2', nrc: '441200-8', telefono: '2338-7700', correo: 'ventas@elgranjero.sv', contacto: 'Silvia Menjívar', diasCredito: 15 },
  { id: 'prov-cafe', nombre: 'Finca Cumbres del Bálsamo', nit: '0511-300615-105-5', nrc: '552310-3', telefono: '2228-9090', correo: 'cafe@cumbres.sv', contacto: 'Julio Escobar', diasCredito: 30 },
  { id: 'prov-empaques', nombre: 'Empaques Cuscatlán', nit: '0614-180920-106-7', nrc: '663001-9', telefono: '2270-5050', correo: 'pedidos@empaquescus.sv', contacto: 'Karen Palacios', diasCredito: 30 },
];

/** [id, nombre, unidad, stockMinimo, costoUnitario, proveedorId, stockCentral, stockSanMiguel, arte] */
const insumosBase = [
  ['ins-maiz', 'Masa de maíz', 'kg', 5, 0.95, 'prov-favorita', 15, 12, 'maiz'],
  ['ins-frijol', 'Frijol', 'kg', 5, 1.8, 'prov-favorita', 8, 9, 'frijol'],
  ['ins-queso', 'Queso', 'kg', 5, 6.5, 'prov-lacteos', 12, 7, 'queso'],
  ['ins-loroco', 'Loroco', 'kg', 1, 8.0, 'prov-selecto', 2.5, 2, 'hoja'],
  ['ins-chicharron', 'Chicharrón', 'kg', 2, 5.5, 'prov-granjero', 4, 3, 'carne'],
  ['ins-tomate', 'Tomate', 'kg', 3, 1.1, 'prov-selecto', 2, 6, 'tomate'],
  ['ins-chile', 'Chile dulce', 'kg', 5, 1.6, 'prov-selecto', 4, 6, 'chile'],
  ['ins-cebolla', 'Cebolla', 'kg', 5, 1.2, 'prov-selecto', 10, 8, 'cebolla'],
  ['ins-repollo', 'Repollo', 'kg', 3, 0.7, 'prov-selecto', 9, 7, 'hoja'],
  ['ins-crema', 'Crema', 'lt', 5, 3.2, 'prov-lacteos', 6, 5, 'crema'],
  ['ins-aceite', 'Aceite vegetal', 'lt', 4, 2.4, 'prov-favorita', 10, 8, 'aceite'],
  ['ins-yuca', 'Yuca', 'kg', 5, 0.9, 'prov-selecto', 14, 10, 'yuca'],
  ['ins-platano', 'Plátano maduro', 'und', 20, 0.25, 'prov-selecto', 60, 40, 'platano'],
  ['ins-miel', 'Miel de panela', 'lt', 2, 3.0, 'prov-favorita', 5, 4, 'crema'],
  ['ins-pollo', 'Pollo', 'kg', 5, 3.4, 'prov-granjero', 12, 9, 'carne'],
  ['ins-gallina', 'Gallina india', 'kg', 4, 4.5, 'prov-granjero', 9, 6, 'carne'],
  ['ins-arroz', 'Arroz', 'kg', 4, 1.1, 'prov-favorita', 10, 9, 'grano'],
  ['ins-elote', 'Elote tierno', 'und', 20, 0.35, 'prov-selecto', 50, 40, 'elote'],
  ['ins-papa', 'Papa', 'kg', 3, 1.0, 'prov-selecto', 8, 7, 'papa'],
  ['ins-tortilla', 'Tortilla tostada', 'und', 30, 0.05, 'prov-favorita', 120, 100, 'maiz'],
  ['ins-mole', 'Pasta de mole', 'kg', 1, 7.0, 'prov-favorita', 3, 2, 'frijol'],
  ['ins-salsa', 'Salsa de tomate', 'lt', 3, 1.5, 'prov-favorita', 6, 5, 'tomate'],
  ['ins-huevo', 'Huevo', 'und', 30, 0.15, 'prov-granjero', 90, 60, 'huevo'],
  ['ins-azucar', 'Azúcar', 'kg', 5, 0.95, 'prov-favorita', 20, 15, 'grano'],
  ['ins-morro', 'Semilla de morro', 'kg', 1, 4.0, 'prov-favorita', 3, 2, 'grano'],
  ['ins-cafe', 'Café de especialidad', 'kg', 1, 14.0, 'prov-cafe', 3, 2, 'cafe'],
  ['ins-leche', 'Leche entera', 'lt', 10, 1.15, 'prov-lacteos', 30, 20, 'crema'],
  ['ins-vaso16', 'Vaso de 16 oz', 'und', 50, 0.08, 'prov-empaques', 300, 200, 'empaque'],
  ['ins-tapadera', 'Tapadera', 'und', 50, 0.03, 'prov-empaques', 300, 200, 'empaque'],
  ['ins-vineta', 'Viñeta', 'und', 50, 0.01, 'prov-empaques', 500, 300, 'empaque'],
];

const insumos = insumosBase.map(([id, nombre, unidad, stockMinimo, costoUnitario, proveedorId, sc, ssm, arte]) => ({
  id,
  nombre,
  unidad,
  stockMinimo,
  costoUnitario,
  proveedorId,
  arte,
  stock: { 'suc-central': sc, 'suc-sanmiguel': ssm },
}));

const categorias = [
  { id: 'cat-pupusas', nombre: 'Pupusas' },
  { id: 'cat-antojitos', nombre: 'Antojitos' },
  { id: 'cat-platos', nombre: 'Platos fuertes' },
  { id: 'cat-bebidas', nombre: 'Bebidas' },
  { id: 'cat-reventa', nombre: 'Empacados' },
];

/** Productos elaborados: se fabrican con una receta que descuenta insumos. */
const elaborados = [
  { id: 'prod-pupusa-queso', nombre: 'Pupusa de queso', precio: 1.5, categoriaId: 'cat-pupusas', arte: 'pupusa', descripcion: 'Tortilla de maíz rellena de queso con curtido.', receta: [['ins-maiz', 0.12], ['ins-queso', 0.06], ['ins-aceite', 0.005]] },
  { id: 'prod-pupusa-frijol', nombre: 'Pupusa de frijol', precio: 1.5, categoriaId: 'cat-pupusas', arte: 'pupusa-frijol', descripcion: 'Pupusa de maíz rellena de frijol molido.', receta: [['ins-maiz', 0.12], ['ins-frijol', 0.06], ['ins-aceite', 0.005]] },
  { id: 'prod-pupusa-revuelta', nombre: 'Pupusa revuelta', precio: 1.75, categoriaId: 'cat-pupusas', arte: 'pupusa-frijol', descripcion: 'Queso, frijol y chicharrón en masa de maíz.', receta: [['ins-maiz', 0.12], ['ins-queso', 0.03], ['ins-frijol', 0.03], ['ins-chicharron', 0.03], ['ins-aceite', 0.005]] },
  { id: 'prod-pupusa-loroco', nombre: 'Pupusa de loroco', precio: 1.75, categoriaId: 'cat-pupusas', arte: 'pupusa-loroco', descripcion: 'Queso con flor de loroco.', receta: [['ins-maiz', 0.12], ['ins-queso', 0.05], ['ins-loroco', 0.015], ['ins-aceite', 0.005]] },
  { id: 'prod-yuca-frita', nombre: 'Yuca frita', precio: 2.0, categoriaId: 'cat-antojitos', arte: 'yuca', descripcion: 'Yuca frita con curtido y chicharrón.', receta: [['ins-yuca', 0.25], ['ins-aceite', 0.03], ['ins-repollo', 0.05], ['ins-chicharron', 0.03]] },
  { id: 'prod-platano-miel', nombre: 'Plátano en miel', precio: 2.0, categoriaId: 'cat-antojitos', arte: 'platano', descripcion: 'Plátano maduro cocido en miel de panela.', receta: [['ins-platano', 1], ['ins-miel', 0.04]] },
  { id: 'prod-tamal-elote', nombre: 'Tamales de elote', precio: 1.75, categoriaId: 'cat-antojitos', arte: 'tamal', descripcion: 'Tamal dulce de elote tierno con crema.', receta: [['ins-elote', 2], ['ins-crema', 0.02], ['ins-azucar', 0.02]] },
  { id: 'prod-enchiladas', nombre: 'Enchiladas', precio: 2.5, categoriaId: 'cat-antojitos', arte: 'enchilada', descripcion: 'Tortilla tostada con pollo, curtido, huevo y salsa.', receta: [['ins-tortilla', 3], ['ins-pollo', 0.06], ['ins-repollo', 0.05], ['ins-huevo', 1], ['ins-salsa', 0.03], ['ins-queso', 0.02]] },
  { id: 'prod-pastelitos', nombre: 'Pastelitos', precio: 1.5, categoriaId: 'cat-antojitos', arte: 'pastelito', descripcion: 'Pastelitos de masa rellenos de papa y pollo.', receta: [['ins-maiz', 0.1], ['ins-papa', 0.05], ['ins-pollo', 0.03], ['ins-aceite', 0.02], ['ins-tomate', 0.02]] },
  { id: 'prod-pollo-mole', nombre: 'Pollo en mole', precio: 5.5, categoriaId: 'cat-platos', arte: 'mole', descripcion: 'Pieza de pollo en mole con arroz.', receta: [['ins-pollo', 0.3], ['ins-mole', 0.05], ['ins-arroz', 0.1], ['ins-cebolla', 0.02]] },
  { id: 'prod-sopa-gallina', nombre: 'Sopa de gallina', precio: 6.0, categoriaId: 'cat-platos', arte: 'sopa', descripcion: 'Sopa de gallina india con verduras y arroz.', receta: [['ins-gallina', 0.35], ['ins-papa', 0.1], ['ins-arroz', 0.08], ['ins-cebolla', 0.03], ['ins-chile', 0.02], ['ins-tomate', 0.03]] },
  { id: 'prod-latte-grande', nombre: 'Latte grande', precio: 2.75, categoriaId: 'cat-bebidas', arte: 'latte', descripcion: 'Espresso de café de altura con leche vaporizada, 16 oz.', receta: [['ins-cafe', 0.018], ['ins-leche', 0.25], ['ins-vaso16', 1], ['ins-tapadera', 1], ['ins-vineta', 1]] },
  { id: 'prod-horchata', nombre: 'Horchata de morro', precio: 1.25, categoriaId: 'cat-bebidas', arte: 'horchata', descripcion: 'Horchata salvadoreña de semilla de morro, 16 oz.', receta: [['ins-morro', 0.02], ['ins-azucar', 0.03], ['ins-vaso16', 1], ['ins-tapadera', 1]] },
  { id: 'prod-atol-elote', nombre: 'Atol de elote', precio: 1.25, categoriaId: 'cat-bebidas', arte: 'atol', descripcion: 'Atol caliente de elote tierno.', receta: [['ins-elote', 1], ['ins-leche', 0.15], ['ins-azucar', 0.03], ['ins-vaso16', 1]] },
];

/** Productos de reventa (empacados): se compran y se venden tal cual. */
const reventa = [
  { id: 'prod-agua', nombre: 'Agua embotellada 600 ml', precio: 0.75, costo: 0.35, arte: 'agua', stockMinimo: 12, stock: [48, 36] },
  { id: 'prod-gaseosa', nombre: 'Gaseosa en lata 355 ml', precio: 1.0, costo: 0.45, arte: 'lata', stockMinimo: 12, stock: [60, 40] },
  { id: 'prod-jugo', nombre: 'Jugo de naranja 355 ml', precio: 1.25, costo: 0.6, arte: 'jugo', stockMinimo: 10, stock: [24, 18] },
  { id: 'prod-galletas', nombre: 'Galletas de vainilla', precio: 0.5, costo: 0.22, arte: 'galleta', stockMinimo: 10, stock: [30, 8] },
];

const productos = [
  ...elaborados.map(({ receta, ...p }) => ({
    ...p,
    tipo: 'elaborado',
    activo: true,
    receta: receta.map(([insumoId, cantidad]) => ({ insumoId, cantidad })),
  })),
  ...reventa.map(({ stock, ...p }) => ({
    ...p,
    tipo: 'reventa',
    categoriaId: 'cat-reventa',
    descripcion: 'Producto empacado de reventa.',
    activo: true,
    receta: [],
    stock: { 'suc-central': stock[0], 'suc-sanmiguel': stock[1] },
  })),
];

const clientes = [
  { id: 'cli-cf', nombre: 'Consumidor final', tipo: 'consumidor_final', nit: '', nrc: '', giro: '', direccion: '', telefono: '' },
  { id: 'cli-roble', nombre: 'Comercial El Roble, S.A. de C.V.', tipo: 'contribuyente', nit: '0614-210507-101-5', nrc: '178233-2', giro: 'Venta de artículos de oficina', direccion: 'San Salvador', telefono: '2245-1010' },
  { id: 'cli-izalco', nombre: 'Consultores Izalco, S.A. de C.V.', tipo: 'contribuyente', nit: '0315-140812-102-7', nrc: '201145-9', giro: 'Servicios de consultoría', direccion: 'Santa Tecla', telefono: '2288-4545' },
  { id: 'cli-maria', nombre: 'María José Alvarado', tipo: 'consumidor_final', nit: '', nrc: '', giro: '', direccion: 'San Miguel', telefono: '7788-1234' },
];

const empleados = [
  ['Andrea Morales', 'Gerente general', 'suc-central', 1400],
  ['Ana Rodríguez', 'Cocinera', 'suc-central', 450],
  ['Carlos Méndez', 'Mesero', 'suc-central', 408.8],
  ['María López', 'Cajera', 'suc-central', 420],
  ['José Pérez', 'Ayudante de cocina', 'suc-central', 408.8],
  ['Sandra García', 'Mesera', 'suc-central', 408.8],
  ['Luis Hernández', 'Barista', 'suc-central', 430],
  ['Gabriela Martínez', 'Gerente de sucursal', 'suc-sanmiguel', 950],
  ['Roberto Flores', 'Cocinero', 'suc-sanmiguel', 460],
  ['Karla Ramírez', 'Cajera', 'suc-sanmiguel', 420],
  ['Miguel Torres', 'Barista', 'suc-sanmiguel', 430],
  ['Daniela Castillo', 'Mesera', 'suc-sanmiguel', 408.8],
].map(([nombre, cargo, sucursalId, salarioMensual], i) => ({
  id: `emp-${pad(i + 1, 3)}`,
  nombre,
  cargo,
  sucursalId,
  salarioMensual,
  dui: `0${4512000 + i * 731}-${i % 9}`,
  afp: i % 2 === 0 ? 'AFP Confía' : 'AFP Crecer',
  fechaIngreso: `202${i % 5}-0${(i % 9) + 1}-15`,
  telefono: `7${pad(100 + i * 37, 3)}-${pad(1000 + i * 211, 4)}`,
  estado: 'activo',
}));

const configuracion = {
  nombre: 'Orígenes SV',
  eslogan: 'Dos culturas, un mismo sabor',
  logo: null,
  colores: {
    primario: '#0B2D6B',
    secundario: '#F4B942',
    fondo: '#F9F5E7',
    acento: '#3A6EA5',
    exito: '#28A745',
    error: '#E74C3C',
  },
  fuentes: { principal: 'Poppins', secundaria: 'Roboto' },
  componentes: { bordes: true, sombras: true, animaciones: true, modoOscuro: false },
};

/** Pesos de demanda por hora (9am – 9pm): picos al almuerzo y la cena. */
const HORAS = [9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21];
const PESO_HORA = [2, 3, 5, 8, 7, 4, 3, 3, 5, 8, 7, 5, 3];
/** Popularidad relativa de cada producto. */
const POPULARIDAD = {
  'prod-pupusa-queso': 14, 'prod-pupusa-frijol': 10, 'prod-pupusa-revuelta': 12, 'prod-pupusa-loroco': 7,
  'prod-yuca-frita': 9, 'prod-platano-miel': 8, 'prod-tamal-elote': 5, 'prod-enchiladas': 5,
  'prod-pastelitos': 5, 'prod-pollo-mole': 3, 'prod-sopa-gallina': 3, 'prod-latte-grande': 5,
  'prod-horchata': 6, 'prod-atol-elote': 3, 'prod-agua': 3, 'prod-gaseosa': 4, 'prod-jugo': 2, 'prod-galletas': 1,
};

function pickWeighted(random, entries) {
  const total = entries.reduce((a, [, w]) => a + w, 0);
  let r = random() * total;
  for (const [value, w] of entries) {
    r -= w;
    if (r <= 0) return value;
  }
  return entries[entries.length - 1][0];
}

/** Genera el historial de ventas y turnos de caja de los últimos 14 días. */
function generarHistorial(now) {
  const random = rng(20261114);
  const productosPorId = Object.fromEntries(productos.map((p) => [p.id, p]));
  const popularidad = Object.entries(POPULARIDAD);
  const correlativos = Object.fromEntries(sucursales.map((s) => [s.id, { FCF: 0, CCF: 0 }]));
  const ventas = [];
  const turnos = [];
  const horaActual = now.getHours();

  for (let offset = 13; offset >= 0; offset -= 1) {
    const dia = new Date(now);
    dia.setDate(dia.getDate() - offset);
    const fecha = dateKey(dia);
    const esHoy = offset === 0;
    const factorDia = [1.25, 0.8, 0.85, 0.9, 1, 1.15, 1.35][dia.getDay()];

    for (const suc of sucursales) {
      const factorSuc = suc.id === 'suc-central' ? 1 : 0.5;
      const sesiones = {};
      for (const turno of ['Mañana', 'Tarde']) {
        for (const caja of cajas.filter((c) => c.sucursalId === suc.id)) {
          const inicioTurno = turno === 'Mañana' ? 7 : 14;
          if (esHoy && horaActual < inicioTurno) continue;
          const abierta = esHoy && (turno === 'Mañana' ? horaActual < 14 : true);
          const apertura = new Date(dia);
          apertura.setHours(inicioTurno, 0, 0, 0);
          const sesion = {
            id: `tur-${fecha.replaceAll('-', '')}-${suc.codigo}-${caja.nombre.slice(-2)}-${turno === 'Mañana' ? 'M' : 'T'}`,
            cajaId: caja.id,
            sucursalId: suc.id,
            fecha,
            turno,
            responsable: turno === 'Mañana' ? 'María López' : 'Karla Ramírez',
            montoInicial: 50,
            denominaciones: { 1: 10, 5: 4, 10: 1, 20: 0 },
            apertura: apertura.toISOString(),
            cierre: null,
            estado: abierta ? 'abierta' : 'cerrada',
            efectivoContado: null,
            totales: null,
          };
          sesiones[`${turno}-${caja.id}`] = sesion;
          turnos.push(sesion);
        }
      }

      HORAS.forEach((hora, idx) => {
        if (esHoy && hora > horaActual) return;
        const turno = hora < 14 ? 'Mañana' : 'Tarde';
        const ordenes = Math.round(PESO_HORA[idx] * factorDia * factorSuc * (0.7 + random() * 0.6));
        for (let o = 0; o < ordenes; o += 1) {
          const minuto = Math.floor(random() * 60);
          if (esHoy && hora === horaActual && minuto > now.getMinutes()) continue;
          const fechaVenta = new Date(dia);
          fechaVenta.setHours(hora, minuto, Math.floor(random() * 60), 0);
          const cajaId = random() < 0.55 ? `${suc.id}-caja-01` : `${suc.id}-caja-02`;
          const sesion = sesiones[`${turno}-${cajaId}`];
          if (!sesion) continue;
          const nItems = 1 + Math.floor(random() * 3);
          const items = [];
          for (let i = 0; i < nItems; i += 1) {
            const prodId = pickWeighted(random, popularidad);
            const prod = productosPorId[prodId];
            const cantidad = prod.categoriaId === 'cat-pupusas' ? 1 + Math.floor(random() * 4) : 1 + Math.floor(random() * 2);
            const existente = items.find((it) => it.productoId === prodId);
            if (existente) {
              existente.cantidad += cantidad;
              existente.total = round2(existente.cantidad * existente.precioUnitario);
            } else {
              items.push({ productoId: prodId, nombre: prod.nombre, cantidad, precioUnitario: prod.precio, total: round2(cantidad * prod.precio) });
            }
          }
          const esCCF = random() < 0.12;
          const tipoComprobante = esCCF ? 'CCF' : 'FCF';
          correlativos[suc.id][tipoComprobante] += 1;
          const subtotal = round2(items.reduce((a, it) => a + it.total, 0));
          const iva = round2(subtotal * 0.13);
          const total = round2(subtotal + iva);
          const metodoPago = pickWeighted(random, [['efectivo', 48], ['tarjeta', 37], ['bitcoin', 15]]);
          const recibido = metodoPago === 'efectivo' ? Math.ceil(total) + (random() < 0.4 ? 5 : 0) : total;
          ventas.push({
            id: `ven-${fecha.replaceAll('-', '')}-${suc.codigo}-${pad(ventas.length + 1, 5)}`,
            numero: `${tipoComprobante}-${suc.codigo}-${pad(correlativos[suc.id][tipoComprobante], 6)}`,
            tipoComprobante,
            sucursalId: suc.id,
            cajaId,
            turnoId: sesion.id,
            fecha: fechaVenta.toISOString(),
            tipoOrden: pickWeighted(random, [['comer_aqui', 60], ['para_llevar', 30], ['delivery', 10]]),
            clienteId: esCCF ? (random() < 0.5 ? 'cli-roble' : 'cli-izalco') : 'cli-cf',
            metodoPago,
            items,
            subtotal,
            iva,
            total,
            montoRecibido: round2(recibido),
            cambio: round2(recibido - total),
            estado: 'emitida',
          });
        }
      });
    }
  }

  // Cerrar turnos históricos con sus totales.
  for (const sesion of turnos) {
    const vs = ventas.filter((v) => v.turnoId === sesion.id);
    const porMetodo = (m) => round2(vs.filter((v) => v.metodoPago === m).reduce((a, v) => a + v.total, 0));
    const totales = {
      ventas: round2(vs.reduce((a, v) => a + v.total, 0)),
      efectivo: porMetodo('efectivo'),
      tarjeta: porMetodo('tarjeta'),
      bitcoin: porMetodo('bitcoin'),
      ordenes: vs.length,
    };
    if (sesion.estado === 'cerrada') {
      const esperado = round2(sesion.montoInicial + totales.efectivo);
      const descuadre = random() < 0.15 ? -round2(random() * 2) : 0;
      sesion.efectivoContado = round2(esperado + descuadre);
      sesion.totales = { ...totales, efectivoEsperado: esperado, diferencia: descuadre };
      const cierre = new Date(sesion.apertura);
      cierre.setHours(sesion.turno === 'Mañana' ? 14 : 22, 0, 0, 0);
      sesion.cierre = cierre.toISOString();
    }
  }

  return { ventas, turnos, correlativos };
}

function generarCompras(now) {
  const dias = (n) => {
    const d = new Date(now);
    d.setDate(d.getDate() + n);
    return d;
  };
  const insumoPorId = Object.fromEntries(insumos.map((i) => [i.id, i]));
  const compra = (id, numeroFactura, proveedorId, offset, lineas, condicion) => {
    const items = lineas.map(([insumoId, cantidad]) => {
      const ins = insumoPorId[insumoId];
      return { insumoId, nombre: ins.nombre, cantidad, costoUnitario: ins.costoUnitario, total: round2(cantidad * ins.costoUnitario) };
    });
    const subtotal = round2(items.reduce((a, i) => a + i.total, 0));
    const iva = round2(subtotal * 0.13);
    return {
      id, numeroFactura, proveedorId, sucursalId: 'suc-central', tipo: 'costo', descripcion: 'Compra de insumos',
      fecha: dias(offset).toISOString(), items, subtotal, iva, total: round2(subtotal + iva), condicion,
    };
  };
  const compras = [
    compra('com-0001', 'CCF-004512', 'prov-favorita', -9, [['ins-maiz', 25], ['ins-frijol', 15], ['ins-aceite', 10]], 'credito'),
    compra('com-0002', 'CCF-118870', 'prov-lacteos', -6, [['ins-queso', 15], ['ins-crema', 8], ['ins-leche', 30]], 'credito'),
    compra('com-0003', 'FAC-552001', 'prov-selecto', -4, [['ins-tomate', 8], ['ins-cebolla', 10], ['ins-repollo', 10], ['ins-yuca', 15]], 'contado'),
    compra('com-0004', 'CCF-009321', 'prov-granjero', -2, [['ins-pollo', 15], ['ins-gallina', 10], ['ins-huevo', 90]], 'credito'),
    {
      id: 'com-0005', numeroFactura: 'FAC-CAESS-7781', proveedorId: null, proveedorNombre: 'CAESS (energía eléctrica)', sucursalId: 'suc-central', tipo: 'gasto',
      descripcion: 'Servicio de energía eléctrica', fecha: dias(-5).toISOString(), items: [], subtotal: 162.5, iva: 21.13, total: 183.63, condicion: 'credito',
    },
  ];
  const vence = (c, d) => dias(Math.round((new Date(c.fecha) - now) / 86400000) + d).toISOString();
  const cuentasPorPagar = compras
    .filter((c) => c.condicion === 'credito')
    .map((c, i) => ({
      id: `cxp-${pad(i + 1, 4)}`,
      compraId: c.id,
      proveedorId: c.proveedorId,
      proveedorNombre: c.proveedorNombre ?? proveedores.find((p) => p.id === c.proveedorId)?.nombre,
      numeroFactura: c.numeroFactura,
      monto: c.total,
      saldo: i === 0 ? 0 : c.total,
      fechaVencimiento: vence(c, i === 1 ? 4 : 15),
      estado: i === 0 ? 'pagada' : 'pendiente',
      pagos: i === 0 ? [{ fecha: dias(-1).toISOString(), monto: c.total }] : [],
    }));
  return { compras, cuentasPorPagar };
}

function generarPlanillas(now) {
  const planillas = [];
  const activos = empleados.filter((e) => e.estado === 'activo');
  // Las dos quincenas anteriores a la actual, de la más antigua a la más reciente.
  let inicioActual = new Date(now.getFullYear(), now.getMonth(), now.getDate() <= 15 ? 1 : 16);
  const referencias = [];
  for (let i = 0; i < 2; i += 1) {
    const ref = new Date(inicioActual);
    ref.setDate(ref.getDate() - 1);
    referencias.unshift(ref);
    inicioActual = new Date(ref.getFullYear(), ref.getMonth(), ref.getDate() <= 15 ? 1 : 16);
  }
  for (const ref of referencias) {
    const y = ref.getFullYear();
    const m = ref.getMonth();
    const primera = ref.getDate() <= 15;
    const ultimo = new Date(y, m + 1, 0).getDate();
    const mes = ref.toLocaleDateString('es-SV', { month: 'short' }).replace('.', '');
    const detalles = activos.map(calcularDetalleEmpleado);
    const fin = new Date(y, m, primera ? 15 : ultimo);
    planillas.push({
      id: `pla-${y}${pad(m + 1)}${primera ? 'A' : 'B'}`,
      periodo: {
        inicio: `${y}-${pad(m + 1)}-${primera ? '01' : '16'}`,
        fin: dateKey(fin),
        etiqueta: primera ? `1 – 15 ${mes}. ${y}` : `16 – ${ultimo} ${mes}. ${y}`,
      },
      fechaGeneracion: fin.toISOString(),
      fechaPago: fin.toISOString(),
      estado: 'pagada',
      detalles,
      totales: totalizarPlanilla(detalles),
    });
  }
  return planillas;
}

export function buildSeed(now = new Date()) {
  const { ventas, turnos, correlativos } = generarHistorial(now);
  const { compras, cuentasPorPagar } = generarCompras(now);
  return {
    meta: { creado: now.toISOString(), version: 1 },
    configuracion,
    sucursales,
    cajas,
    categorias,
    productos,
    insumos,
    proveedores,
    clientes,
    empleados,
    ventas,
    turnos,
    correlativos,
    compras,
    cuentasPorPagar,
    ordenesCompra: [],
    movimientosInventario: [],
    planillas: generarPlanillas(now),
    correlativoCompras: compras.length,
  };
}

// Ejecución directa: node database/seeds/seed.mjs [--force]
const isMain = process.argv[1] && import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href;
if (isMain) {
  const dir = path.dirname(fileURLToPath(import.meta.url));
  const target = path.resolve(dir, '..', 'data.json');
  if (fs.existsSync(target) && !process.argv.includes('--force')) {
    console.log('La base de datos ya existe. Usa --force para reiniciarla.');
  } else {
    const data = buildSeed();
    fs.writeFileSync(target, JSON.stringify(data, null, 2));
    console.log(`🌱 Seeds cargados: ${data.productos.length} productos, ${data.insumos.length} insumos, ${data.ventas.length} ventas históricas.`);
  }
}
