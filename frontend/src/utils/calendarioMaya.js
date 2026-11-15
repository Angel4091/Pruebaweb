/**
 * Calendario maya a partir de una fecha gregoriana.
 *
 * Usa la correlación GMT (584283): el día 0 de la Cuenta Larga (0.0.0.0.0,
 * 4 Ajaw 8 Kumk'u) corresponde al día juliano 584283 (11 de agosto de 3114 a. C.).
 * Ejemplo de control: 21/12/2012 → 13.0.0.0.0, 4 Ajaw 3 K'ank'in.
 */
const CORRELACION_GMT = 584283;

export const DIAS_TZOLKIN = [
  'Imix', "Ik'", "Ak'b'al", "K'an", 'Chikchan', 'Kimi', "Manik'", 'Lamat', 'Muluk', 'Ok',
  'Chuwen', "Eb'", "B'en", 'Ix', 'Men', "Kib'", "Kab'an", "Etz'nab'", 'Kawak', 'Ajaw',
];

export const MESES_HAAB = [
  'Pop', "Wo'", 'Sip', "Sotz'", 'Sek', 'Xul', "Yaxk'in", 'Mol', "Ch'en", 'Yax',
  "Sak'", 'Keh', 'Mak', "K'ank'in", 'Muwan', 'Pax', "K'ayab'", "Kumk'u", "Wayeb'",
];

/** Número de día juliano (a mediodía) de una fecha gregoriana. */
export function diaJuliano(fecha) {
  const y = fecha.getFullYear();
  const m = fecha.getMonth() + 1;
  const d = fecha.getDate();
  const a = Math.floor((14 - m) / 12);
  const yy = y + 4800 - a;
  const mm = m + 12 * a - 3;
  return d + Math.floor((153 * mm + 2) / 5) + 365 * yy + Math.floor(yy / 4) - Math.floor(yy / 100) + Math.floor(yy / 400) - 32045;
}

const modulo = (n, m) => ((n % m) + m) % m;

/** Devuelve la Cuenta Larga, la fecha Tzolk'in y la fecha Haab' de un día. */
export function fechaMaya(fecha = new Date()) {
  const dias = diaJuliano(fecha) - CORRELACION_GMT;

  const unidades = [144000, 7200, 360, 20, 1];
  let resto = dias;
  const cuentaLarga = unidades.map((u) => {
    const v = Math.floor(resto / u);
    resto -= v * u;
    return v;
  });

  const tzolkin = { numero: modulo(dias + 3, 13) + 1, dia: DIAS_TZOLKIN[modulo(dias + 19, 20)] };
  const posicionHaab = modulo(dias + 348, 365);
  const haab = { numero: posicionHaab % 20, mes: MESES_HAAB[Math.floor(posicionHaab / 20)] };

  return { dias, cuentaLarga, tzolkin, haab };
}

export const UNIDADES_CUENTA_LARGA = ["B'ak'tun", "K'atun", 'Tun', 'Winal', "K'in"];
