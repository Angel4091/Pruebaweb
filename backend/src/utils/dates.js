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
