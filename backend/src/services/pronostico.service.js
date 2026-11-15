import { db } from '../config/db.js';
import { round2, round4 } from '../utils/money.js';
import { toDateKey, addDays } from '../utils/dates.js';
import { validarSucursal, listarInsumos } from './inventario.service.js';

/**
 * Pronóstico de consumo de insumos.
 *
 * 1. Explota las ventas de los últimos 14 días en consumo diario por insumo (vía recetas).
 * 2. Promedio móvil de 7 días ajustado por un factor de día de la semana.
 * 3. Días de cobertura = existencia / consumo diario promedio.
 * 4. Cantidad sugerida = consumo de 7 días + stock mínimo − existencia.
 */
const DIAS_HISTORIA = 14;
const HORIZONTE = 7;

function consumoDiario(sucursalId, desde) {
  const productos = new Map(db.collection('productos').map((p) => [p.id, p]));
  const insumos = new Map(db.collection('insumos').map((i) => [i.id, i]));
  const porDia = new Map(); // fecha → Map(insumoId → cantidad)
  for (const venta of db.collection('ventas')) {
    if (venta.sucursalId !== sucursalId || venta.estado !== 'emitida') continue;
    const fecha = toDateKey(venta.fecha);
    if (fecha < desde) continue;
    if (!porDia.has(fecha)) porDia.set(fecha, new Map());
    const dia = porDia.get(fecha);
    for (const item of venta.items) {
      const prod = productos.get(item.productoId);
      if (!prod) continue;
      for (const r of prod.receta) {
        dia.set(r.insumoId, (dia.get(r.insumoId) ?? 0) + r.cantidad * item.cantidad);
      }
    }
  }
  const costoDia = (fecha) => {
    const dia = porDia.get(fecha);
    if (!dia) return 0;
    let total = 0;
    for (const [insumoId, cantidad] of dia) total += cantidad * (insumos.get(insumoId)?.costoUnitario ?? 0);
    return round2(total);
  };
  return { porDia, costoDia };
}

export function calcularPronostico(sucursalId, horizonte = HORIZONTE) {
  validarSucursal(sucursalId);
  const hoy = new Date();
  const fechas = Array.from({ length: DIAS_HISTORIA }, (_, i) => toDateKey(addDays(hoy, i - DIAS_HISTORIA)));
  const { porDia, costoDia } = consumoDiario(sucursalId, fechas[0]);

  // Factor por día de la semana: consumo del día / promedio del periodo.
  const costos = fechas.map(costoDia);
  const promedioGeneral = costos.reduce((a, b) => a + b, 0) / costos.length || 1;
  const factorSemana = Array.from({ length: 7 }, (_, dow) => {
    const valores = fechas.map((f, i) => [new Date(`${f}T12:00:00`).getDay(), costos[i]]).filter(([d]) => d === dow).map(([, v]) => v);
    return valores.length ? valores.reduce((a, b) => a + b, 0) / valores.length / promedioGeneral : 1;
  });

  const ultimos7 = fechas.slice(-7);
  const promedioCosto7 = ultimos7.map(costoDia).reduce((a, b) => a + b, 0) / 7;

  // Serie para la gráfica: 7 días reales (con su pronóstico retrospectivo) + días futuros.
  const serie = [];
  for (let i = 7; i < DIAS_HISTORIA; i += 1) {
    const ventana = fechas.slice(i - 7, i).map(costoDia);
    const promedio = ventana.reduce((a, b) => a + b, 0) / 7;
    const dow = new Date(`${fechas[i]}T12:00:00`).getDay();
    serie.push({ fecha: fechas[i], real: costoDia(fechas[i]), pronostico: round2(promedio * factorSemana[dow]) });
  }
  for (let i = 0; i < horizonte; i += 1) {
    const fecha = toDateKey(addDays(hoy, i));
    const dow = new Date(`${fecha}T12:00:00`).getDay();
    serie.push({ fecha, real: null, pronostico: round2(promedioCosto7 * factorSemana[dow]) });
  }

  // Proyección por insumo.
  const insumos = listarInsumos(sucursalId).map((ins) => {
    const consumo7 = ultimos7.reduce((a, f) => a + (porDia.get(f)?.get(ins.id) ?? 0), 0);
    const promedioDiario = round4(consumo7 / 7);
    const proyectado = round4(promedioDiario * horizonte);
    const cobertura = promedioDiario > 0 ? round2(ins.existencia / promedioDiario) : null;
    const sugerido = Math.max(0, Math.ceil(proyectado + ins.stockMinimo - ins.existencia));
    const enRiesgo = ins.existencia < ins.stockMinimo || (cobertura !== null && cobertura < horizonte);
    return {
      id: ins.id,
      nombre: ins.nombre,
      unidad: ins.unidad,
      arte: ins.arte,
      proveedorId: ins.proveedorId,
      proveedorNombre: ins.proveedorNombre,
      existencia: ins.existencia,
      stockMinimo: ins.stockMinimo,
      costoUnitario: ins.costoUnitario,
      consumo7: round4(consumo7),
      promedioDiario,
      proyectado,
      cobertura,
      sugerido,
      enRiesgo,
      urgencia: ins.existencia < ins.stockMinimo || (cobertura !== null && cobertura < 3) ? 'alta' : 'media',
    };
  });

  const enRiesgo = insumos.filter((i) => i.enRiesgo && i.sugerido > 0).sort((a, b) => (a.cobertura ?? 0) - (b.cobertura ?? 0));

  const pedidos = Object.values(
    enRiesgo.reduce((acc, ins) => {
      const key = ins.proveedorId ?? 'sin-proveedor';
      acc[key] ??= { proveedorId: ins.proveedorId, proveedorNombre: ins.proveedorNombre, items: [], costoEstimado: 0 };
      acc[key].items.push({ insumoId: ins.id, nombre: ins.nombre, unidad: ins.unidad, cantidad: ins.sugerido });
      acc[key].costoEstimado = round2(acc[key].costoEstimado + ins.sugerido * ins.costoUnitario);
      return acc;
    }, {}),
  );

  const conConsumo = insumos.filter((i) => i.promedioDiario > 0);
  const valorStock = conConsumo.reduce((a, i) => a + i.existencia * i.costoUnitario, 0);
  const consumoDiarioValor = conConsumo.reduce((a, i) => a + i.promedioDiario * i.costoUnitario, 0);
  const coberturaGeneral = consumoDiarioValor > 0 ? Math.floor(valorStock / consumoDiarioValor) : 0;
  const coberturaMinima = enRiesgo.length ? Math.max(0, Math.floor(Math.min(...enRiesgo.map((i) => i.cobertura ?? 0)))) : coberturaGeneral;

  const consumoProyectado = round2(serie.filter((s) => s.real === null).reduce((a, s) => a + s.pronostico, 0));
  const consumoActual = round2(ultimos7.map(costoDia).reduce((a, b) => a + b, 0));

  return {
    resumen: {
      diasCobertura: coberturaGeneral,
      insumosEnRiesgo: enRiesgo.length,
      consumoProyectado,
      variacion: consumoActual > 0 ? round2(((consumoProyectado - consumoActual) / consumoActual) * 100) : 0,
      proximoPedido: toDateKey(addDays(hoy, Math.max(1, Math.min(coberturaMinima, horizonte)))),
    },
    serie,
    consumoPorInsumo: insumos
      .filter((i) => i.consumo7 > 0)
      .sort((a, b) => b.consumo7 * b.costoUnitario - a.consumo7 * a.costoUnitario)
      .slice(0, 6),
    alertas: enRiesgo,
    pedidos,
  };
}
