/** Fecha local en formato YYYY-MM-DD. */
export const toDateKey = (date = new Date()) => {
  const d = new Date(date);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
};

/** Turno según la hora: antes de las 14:00 es "Mañana", después "Tarde". */
export const turnoActual = (date = new Date()) => (new Date(date).getHours() < 14 ? 'Mañana' : 'Tarde');

export const addDays = (date, days) => {
  const d = new Date(date);
  d.setDate(d.getDate() + days);
  return d;
};

/** Medianoche local de una fecha "YYYY-MM-DD". */
export const inicioDelDia = (fecha) => new Date(`${fecha}T00:00:00`);

/** Rango [desde, hasta) de un día local, para filtrar columnas timestamptz. */
export const rangoDelDia = (fecha = toDateKey()) => {
  const desde = inicioDelDia(fecha);
  return { desde, hasta: addDays(desde, 1) };
};

/** Rango [desde, hasta) del mes local que contiene la fecha. */
export const rangoDelMes = (fecha = new Date()) => {
  const d = new Date(fecha);
  return { desde: new Date(d.getFullYear(), d.getMonth(), 1), hasta: new Date(d.getFullYear(), d.getMonth() + 1, 1) };
};
