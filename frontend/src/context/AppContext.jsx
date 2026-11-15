import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { generalService } from '../services/index.js';

/**
 * Estado global de la aplicación:
 * - sucursal activa (persistida en localStorage)
 * - configuración de marca (colores, fuentes, componentes) aplicada como variables CSS
 * - modo claro / oscuro
 * - notificaciones tipo "toast"
 * - versión de datos (para refrescar la campana después de vender o comprar)
 */
const AppContext = createContext(null);

const leer = (key, fallback) => {
  try {
    return localStorage.getItem(key) ?? fallback;
  } catch {
    return fallback;
  }
};
const guardar = (key, value) => {
  try {
    localStorage.setItem(key, value);
  } catch {
    /* almacenamiento no disponible: se ignora */
  }
};

/** Aplica la configuración de marca al documento (variables CSS y atributos). */
export function aplicarTema(config, modoOscuro) {
  if (!config) return;
  const root = document.documentElement;
  Object.entries(config.colores).forEach(([key, value]) => root.style.setProperty(`--c-${key}`, value));
  root.style.setProperty('--f-principal', `'${config.fuentes.principal}', system-ui, sans-serif`);
  root.style.setProperty('--f-secundaria', `'${config.fuentes.secundaria}', system-ui, sans-serif`);
  root.dataset.theme = modoOscuro ? 'dark' : 'light';
  root.dataset.sombras = config.componentes.sombras ? 'on' : 'off';
  root.dataset.bordes = config.componentes.bordes ? 'on' : 'off';
  root.dataset.animaciones = config.componentes.animaciones ? 'on' : 'off';
  if (modoOscuro) root.style.setProperty('--c-fondo', '#0d1424');
}

export function AppProvider({ children }) {
  const [sucursales, setSucursales] = useState([]);
  const [sucursalId, setSucursalIdState] = useState(() => leer('origenes.sucursal', 'suc-central'));
  const [config, setConfig] = useState(null);
  const [modoOscuro, setModoOscuro] = useState(() => leer('origenes.modo', '') === 'oscuro');
  const [toasts, setToasts] = useState([]);
  const [version, setVersion] = useState(0);
  const [errorInicial, setErrorInicial] = useState(null);

  useEffect(() => {
    let activo = true;
    Promise.all([generalService.sucursales(), generalService.configuracion()])
      .then(([sucs, conf]) => {
        if (!activo) return;
        setSucursales(sucs);
        setConfig(conf);
        if (leer('origenes.modo', '') === '') setModoOscuro(conf.componentes.modoOscuro);
      })
      .catch((err) => activo && setErrorInicial(err));
    return () => {
      activo = false;
    };
  }, []);

  useEffect(() => {
    aplicarTema(config, modoOscuro);
  }, [config, modoOscuro]);

  const setSucursalId = useCallback((id) => {
    setSucursalIdState(id);
    guardar('origenes.sucursal', id);
  }, []);

  const toggleModo = useCallback(() => {
    setModoOscuro((m) => {
      guardar('origenes.modo', m ? 'claro' : 'oscuro');
      return !m;
    });
  }, []);

  const notify = useCallback((mensaje, tipo = 'exito') => {
    const id = Date.now() + Math.random();
    setToasts((t) => [...t, { id, mensaje, tipo }]);
    setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 4200);
  }, []);

  const cerrarToast = useCallback((id) => setToasts((t) => t.filter((x) => x.id !== id)), []);
  const refrescar = useCallback(() => setVersion((v) => v + 1), []);

  const sucursal = sucursales.find((s) => s.id === sucursalId) ?? sucursales[0];

  const value = useMemo(
    () => ({
      sucursales, sucursal, sucursalId: sucursal?.id ?? sucursalId, setSucursalId,
      config, setConfig, modoOscuro, toggleModo,
      toasts, notify, cerrarToast, version, refrescar, errorInicial,
    }),
    [sucursales, sucursal, sucursalId, setSucursalId, config, modoOscuro, toggleModo, toasts, notify, cerrarToast, version, refrescar, errorInicial],
  );

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

// eslint-disable-next-line react-refresh/only-export-components
export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp debe usarse dentro de <AppProvider>');
  return ctx;
}
