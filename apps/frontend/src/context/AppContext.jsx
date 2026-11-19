import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { generalService } from '../services/index.js';
import { useAuth } from './AuthContext.jsx';

/**
 * Estado global de la aplicación:
 * - sucursal activa (el admin la elige y queda en localStorage; los demás roles usan la suya)
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
  const { usuario } = useAuth();
  const [sucursales, setSucursales] = useState([]);
  const [sucursalesListas, setSucursalesListas] = useState(false);
  const [sucursalElegida, setSucursalElegida] = useState(() => leer('origenes.sucursal', 'suc-central'));
  const [config, setConfig] = useState(null);
  const [modoOscuro, setModoOscuro] = useState(() => leer('origenes.modo', '') === 'oscuro');
  const [toasts, setToasts] = useState([]);
  const [version, setVersion] = useState(0);
  const [errorInicial, setErrorInicial] = useState(null);

  // La identidad visual es pública: la pantalla de inicio de sesión ya muestra el logo y los colores.
  useEffect(() => {
    let activo = true;
    generalService
      .configuracion()
      .then((conf) => {
        if (!activo) return;
        setConfig(conf);
        if (leer('origenes.modo', '') === '') setModoOscuro(conf.componentes.modoOscuro);
      })
      .catch((err) => activo && setErrorInicial(err));
    return () => {
      activo = false;
    };
  }, []);

  // Las sucursales se piden con la sesión abierta. Quien no es admin solo trabaja con la suya.
  useEffect(() => {
    setSucursalesListas(false);
    if (!usuario) {
      setSucursales([]);
      return undefined;
    }
    let activo = true;
    generalService
      .sucursales()
      .then((sucs) => {
        if (!activo) return;
        setSucursales(usuario.rol === 'admin' ? sucs : sucs.filter((s) => s.id === usuario.sucursalId));
        setSucursalesListas(true);
      })
      // Un 401 ya lleva al login (AuthContext); cualquier otro error se muestra en el contenido.
      .catch((err) => activo && err.status !== 401 && setErrorInicial(err));
    return () => {
      activo = false;
    };
  }, [usuario]);

  useEffect(() => {
    aplicarTema(config, modoOscuro);
  }, [config, modoOscuro]);

  const esAdmin = usuario?.rol === 'admin';
  const sucursalId = esAdmin || !usuario?.sucursalId ? sucursalElegida : usuario.sucursalId;

  const setSucursalId = useCallback(
    (id) => {
      if (!esAdmin) return;
      setSucursalElegida(id);
      guardar('origenes.sucursal', id);
    },
    [esAdmin],
  );

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
  // Listo para mostrar los módulos: hay identidad visual y sucursales de la sesión.
  const listo = Boolean(config) && sucursalesListas;

  const value = useMemo(
    () => ({
      sucursales, sucursal, sucursalId: sucursal?.id ?? sucursalId, setSucursalId,
      config, setConfig, modoOscuro, toggleModo, listo,
      toasts, notify, cerrarToast, version, refrescar, errorInicial,
    }),
    [sucursales, sucursal, sucursalId, setSucursalId, config, modoOscuro, toggleModo, listo, toasts, notify, cerrarToast, version, refrescar, errorInicial],
  );

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

// eslint-disable-next-line react-refresh/only-export-components
export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp debe usarse dentro de <AppProvider>');
  return ctx;
}
