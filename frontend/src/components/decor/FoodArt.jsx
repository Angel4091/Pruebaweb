/**
 * Ilustraciones vectoriales de platillos e insumos.
 * Cada platillo se dibuja sobre un plato visto desde arriba, con paleta cálida,
 * para que el menú funcione sin depender de fotografías externas.
 */

const Plato = ({ children, fondo = '#fdf8ee' }) => (
  <>
    <circle cx="60" cy="60" r="54" fill="#d9d1c0" />
    <circle cx="60" cy="58" r="54" fill="#f4efe4" />
    <circle cx="60" cy="58" r="42" fill={fondo} stroke="#e6dcc8" strokeWidth="2" />
    {children}
  </>
);

const Pupusa = ({ x, y, r = 22, relleno = '#f2c97a', manchas = '#a86a2c', extra }) => (
  <g>
    <circle cx={x} cy={y + 2} r={r} fill="#c98f45" opacity="0.5" />
    <circle cx={x} cy={y} r={r} fill={relleno} />
    <circle cx={x} cy={y} r={r - 3} fill="none" stroke="#e3ad5c" strokeWidth="2" />
    {[[-8, -6, 3], [6, -9, 2.4], [9, 5, 3.2], [-5, 8, 2.2], [0, 0, 1.8], [-12, 3, 1.6]].map(([dx, dy, rr], i) => (
      <ellipse key={i} cx={x + dx * (r / 22)} cy={y + dy * (r / 22)} rx={rr} ry={rr * 0.8} fill={manchas} opacity="0.75" />
    ))}
    {extra}
  </g>
);

const Curtido = ({ x, y }) => (
  <g>
    <circle cx={x} cy={y} r="13" fill="#eef3d6" />
    {[[-5, -3, '#b7cf6b'], [4, -5, '#e2ecb3'], [3, 4, '#f08b5b'], [-4, 5, '#cfe08c'], [6, 1, '#b7cf6b']].map(([dx, dy, c], i) => (
      <rect key={i} x={x + dx - 4} y={y + dy - 1} width="8" height="2.4" rx="1.2" fill={c} transform={`rotate(${i * 37} ${x + dx} ${y + dy})`} />
    ))}
  </g>
);

const platillos = {
  pupusa: () => (
    <Plato>
      <Pupusa x={46} y={52} />
      <Pupusa x={70} y={66} r={21} />
      <Curtido x={80} y={38} />
    </Plato>
  ),
  'pupusa-frijol': () => (
    <Plato>
      <Pupusa x={46} y={52} manchas="#5a2d1a" />
      <Pupusa x={70} y={66} r={21} manchas="#5a2d1a" />
      <circle cx="80" cy="38" r="12" fill="#c8402a" />
      <circle cx="80" cy="38" r="9" fill="#e0573c" />
    </Plato>
  ),
  'pupusa-loroco': () => (
    <Plato>
      <Pupusa x={46} y={52} manchas="#4f7a2b" />
      <Pupusa x={70} y={66} r={21} manchas="#4f7a2b" />
      <Curtido x={80} y={38} />
    </Plato>
  ),
  yuca: () => (
    <Plato>
      {[[34, 46, -20], [50, 40, 15], [62, 56, -35], [44, 64, 40], [70, 42, 70], [56, 72, -10], [76, 64, 25]].map(([x, y, rot], i) => (
        <g key={i} transform={`rotate(${rot} ${x} ${y})`}>
          <rect x={x - 15} y={y - 5} width="30" height="11" rx="5" fill="#d8a443" />
          <rect x={x - 14} y={y - 5} width="28" height="9" rx="4.5" fill="#f3d27a" />
        </g>
      ))}
      <circle cx="80" cy="80" r="7" fill="#b7cf6b" />
    </Plato>
  ),
  platano: () => (
    <Plato>
      {[[42, 48, -25], [62, 44, 20], [52, 66, 5], [74, 62, -40]].map(([x, y, rot], i) => (
        <g key={i} transform={`rotate(${rot} ${x} ${y})`}>
          <ellipse cx={x} cy={y} rx="17" ry="9" fill="#7a3510" />
          <ellipse cx={x} cy={y - 1} rx="15" ry="7" fill="#b5541b" />
          <ellipse cx={x - 4} cy={y - 3} rx="6" ry="2" fill="#f0a86a" opacity="0.8" />
        </g>
      ))}
      <path d="M30 76 q30 10 60 -6" stroke="#8a3c12" strokeWidth="4" fill="none" opacity="0.5" />
    </Plato>
  ),
  tamal: () => (
    <Plato>
      <path d="M26 66 L54 28 L96 50 L68 90 Z" fill="#7aa33f" />
      <path d="M34 64 L56 36 L88 52 L66 82 Z" fill="#9cc25a" />
      <rect x="46" y="46" width="30" height="22" rx="8" fill="#f2d16b" transform="rotate(25 61 57)" />
      <rect x="50" y="50" width="22" height="14" rx="6" fill="#f7e29a" transform="rotate(25 61 57)" />
    </Plato>
  ),
  enchilada: () => (
    <Plato>
      {[[44, 50], [72, 52], [58, 72]].map(([x, y], i) => (
        <g key={i}>
          <circle cx={x} cy={y} r="17" fill="#d99a3d" />
          <circle cx={x} cy={y} r="13" fill="#9a4a2a" />
          <circle cx={x - 3} cy={y - 3} r="5" fill="#cfe08c" />
          <circle cx={x + 4} cy={y + 3} r="3.5" fill="#fff4cf" />
          <circle cx={x + 5} cy={y - 5} r="2.5" fill="#e0573c" />
        </g>
      ))}
    </Plato>
  ),
  pastelito: () => (
    <Plato>
      {[[44, 50, -10], [70, 48, 30], [56, 70, 0], [80, 70, -30]].map(([x, y, rot], i) => (
        <g key={i} transform={`rotate(${rot} ${x} ${y})`}>
          <path d={`M${x - 15} ${y + 4} a15 13 0 0 1 30 0 Z`} fill="#c7832f" />
          <path d={`M${x - 13} ${y + 3} a13 11 0 0 1 26 0 Z`} fill="#eab35a" />
          {[-8, -3, 2, 7].map((dx) => (
            <circle key={dx} cx={x + dx} cy={y + 2} r="1.2" fill="#a86a2c" />
          ))}
        </g>
      ))}
    </Plato>
  ),
  mole: () => (
    <Plato>
      <ellipse cx="72" cy="66" rx="20" ry="16" fill="#fbf7ee" />
      {[[66, 62], [74, 70], [78, 60], [68, 72]].map(([x, y], i) => (
        <ellipse key={i} cx={x} cy={y} rx="3" ry="1.4" fill="#e8e1d0" />
      ))}
      <path d="M28 54 q8 -22 34 -16 q16 6 10 22 q-6 18 -28 14 q-18 -4 -16 -20 Z" fill="#3b1a0e" />
      <path d="M36 52 q8 -14 26 -10 q10 4 6 14" fill="#5a2a14" />
      {[[44, 48], [52, 44], [58, 52], [46, 58], [38, 54]].map(([x, y], i) => (
        <ellipse key={i} cx={x} cy={y} rx="1.6" ry="1" fill="#f3e3c0" />
      ))}
    </Plato>
  ),
  sopa: () => (
    <>
      <circle cx="60" cy="60" r="54" fill="#d9d1c0" />
      <circle cx="60" cy="58" r="52" fill="#f6f1e6" />
      <circle cx="60" cy="58" r="40" fill="#e3a530" />
      <circle cx="60" cy="58" r="36" fill="#f1c04f" />
      {[[48, 48, '#f7e6b0', 7], [70, 52, '#e9dcc3', 9], [56, 70, '#f08b5b', 5], [74, 70, '#7aa33f', 4], [44, 64, '#f7e6b0', 6], [62, 42, '#7aa33f', 3]].map(([x, y, c, r], i) => (
        <circle key={i} cx={x} cy={y} r={r} fill={c} />
      ))}
    </>
  ),
  latte: () => (
    <>
      <circle cx="60" cy="60" r="54" fill="#efe6d4" />
      <circle cx="60" cy="58" r="40" fill="#ffffff" stroke="#e2d8c4" strokeWidth="2" />
      <path d="M98 58 q14 0 14 10 q0 10 -14 8" fill="none" stroke="#ffffff" strokeWidth="7" />
      <circle cx="60" cy="58" r="33" fill="#8a5a33" />
      <circle cx="60" cy="58" r="30" fill="#a8743f" />
      <path d="M60 74 C44 62 46 46 56 48 C59 49 60 52 60 54 C60 52 61 49 64 48 C74 46 76 62 60 74 Z" fill="#f6ead6" />
    </>
  ),
  horchata: () => (
    <>
      <circle cx="60" cy="60" r="54" fill="#efe6d4" />
      <circle cx="60" cy="58" r="38" fill="#ffffff" opacity="0.9" stroke="#e2d8c4" strokeWidth="2" />
      <circle cx="60" cy="58" r="32" fill="#d9b48a" />
      {[[50, 50], [68, 54], [58, 68]].map(([x, y], i) => (
        <rect key={i} x={x - 6} y={y - 6} width="12" height="12" rx="3" fill="#f5ecdf" opacity="0.85" transform={`rotate(${i * 25} ${x} ${y})`} />
      ))}
      <rect x="70" y="22" width="5" height="40" rx="2" fill="#e0573c" transform="rotate(20 72 42)" />
    </>
  ),
  atol: () => (
    <>
      <circle cx="60" cy="60" r="54" fill="#efe6d4" />
      <circle cx="60" cy="58" r="38" fill="#c9622f" />
      <circle cx="60" cy="58" r="32" fill="#f3d27a" />
      <circle cx="54" cy="52" r="6" fill="#f8e3a0" />
      <circle cx="56" cy="54" r="2" fill="#c98f45" />
    </>
  ),
  agua: () => (
    <>
      <circle cx="60" cy="60" r="54" fill="#e7eef5" />
      <rect x="45" y="30" width="30" height="66" rx="12" fill="#bfe0f3" stroke="#7fb5d8" strokeWidth="2" />
      <rect x="52" y="18" width="16" height="14" rx="3" fill="#3a6ea5" />
      <rect x="45" y="54" width="30" height="16" fill="#3a6ea5" opacity="0.85" />
    </>
  ),
  lata: () => (
    <>
      <circle cx="60" cy="60" r="54" fill="#f6e3e0" />
      <rect x="40" y="26" width="40" height="70" rx="8" fill="#c8302a" />
      <ellipse cx="60" cy="28" rx="20" ry="5" fill="#d9d9d9" />
      <path d="M44 58 q16 -12 32 0" stroke="#fff" strokeWidth="4" fill="none" />
    </>
  ),
  jugo: () => (
    <>
      <circle cx="60" cy="60" r="54" fill="#fdf0dc" />
      <rect x="44" y="34" width="32" height="62" rx="10" fill="#f39a1e" />
      <rect x="52" y="22" width="16" height="14" rx="3" fill="#4f7a2b" />
      <circle cx="60" cy="66" r="10" fill="#ffd08a" />
    </>
  ),
  galleta: () => (
    <Plato>
      {[[46, 50], [72, 52], [58, 72]].map(([x, y], i) => (
        <g key={i}>
          <circle cx={x} cy={y} r="15" fill="#d9a35a" />
          <circle cx={x} cy={y} r="12" fill="#ecc27d" />
          <circle cx={x - 4} cy={y - 3} r="1.6" fill="#b07a3c" />
          <circle cx={x + 4} cy={y + 2} r="1.6" fill="#b07a3c" />
        </g>
      ))}
    </Plato>
  ),
};

/** Ilustración de un platillo según su clave `arte`. */
export function FoodArt({ arte = 'pupusa', className = '' }) {
  const Dibujo = platillos[arte] ?? platillos.pupusa;
  return (
    <svg viewBox="0 0 120 120" className={className} role="img" aria-hidden="true">
      <Dibujo />
    </svg>
  );
}

/* ---------- Insumos ---------- */

const insumos = {
  maiz: ['#f3c94f', 'granos'],
  frijol: ['#5a2414', 'granos'],
  queso: ['#f7e7b0', 'cuña'],
  hoja: ['#7aa33f', 'hoja'],
  carne: ['#c9644a', 'trozo'],
  tomate: ['#e0412f', 'redondo'],
  chile: ['#d9362b', 'chile'],
  cebolla: ['#e7c3a0', 'redondo'],
  crema: ['#f6f1e4', 'botella'],
  aceite: ['#f0c23b', 'botella'],
  yuca: ['#e9d3a6', 'trozo'],
  platano: ['#f0c23b', 'chile'],
  grano: ['#e6d3a8', 'saco'],
  elote: ['#f3c94f', 'mazorca'],
  papa: ['#c99a5b', 'redondo'],
  huevo: ['#f4e2c8', 'huevo'],
  cafe: ['#5a2d1a', 'granos'],
  empaque: ['#ffffff', 'vaso'],
};

const formas = {
  granos: (c) => [[22, 26], [32, 22], [40, 30], [26, 36], [36, 38], [46, 22]].map(([x, y], i) => <ellipse key={i} cx={x} cy={y} rx="5" ry="3.6" fill={c} stroke="#00000022" />),
  cuña: (c) => <path d="M12 40 L48 40 L48 26 Z" fill={c} stroke="#d9b65a" strokeWidth="2" />,
  hoja: (c) => <path d="M14 38 C14 16 40 12 50 16 C46 34 30 44 14 38 Z" fill={c} />,
  trozo: (c) => <rect x="14" y="20" width="34" height="20" rx="8" fill={c} />,
  redondo: (c) => <circle cx="32" cy="30" r="15" fill={c} />,
  chile: (c) => <path d="M14 26 C26 14 44 18 50 30 C40 38 22 38 14 26 Z" fill={c} />,
  botella: (c) => <><rect x="24" y="18" width="18" height="26" rx="5" fill={c} stroke="#d8cdb2" strokeWidth="2" /><rect x="29" y="12" width="8" height="8" rx="2" fill="#3a6ea5" /></>,
  saco: (c) => <path d="M18 44 C14 30 20 22 26 18 H40 C46 22 50 30 46 44 Z" fill={c} stroke="#c4ab78" strokeWidth="2" />,
  mazorca: (c) => <><ellipse cx="32" cy="30" rx="10" ry="16" fill={c} /><path d="M22 30 C16 20 18 14 24 12 M42 30 C48 20 46 14 40 12" stroke="#7aa33f" strokeWidth="4" fill="none" /></>,
  huevo: (c) => <ellipse cx="32" cy="31" rx="11" ry="14" fill={c} stroke="#e1c9a4" strokeWidth="2" />,
  vaso: (c) => <path d="M20 16 H44 L40 46 H24 Z" fill={c} stroke="#c9b78f" strokeWidth="2" />,
};

/** Miniatura circular de un insumo. */
export function InsumoArt({ arte = 'grano', className = '' }) {
  const [color, forma] = insumos[arte] ?? insumos.grano;
  return (
    <svg viewBox="0 0 64 56" className={className} aria-hidden="true">
      <rect x="2" y="4" width="60" height="48" rx="24" fill="#f3ead6" />
      {formas[forma](color)}
    </svg>
  );
}
