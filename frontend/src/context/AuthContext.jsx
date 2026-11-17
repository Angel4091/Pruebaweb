import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { authService } from '../services/index.js';
import { setToken, onSesionVencida } from '../services/api.js';

/**
 * Sesión del usuario: token + datos (nombre, rol). Se guarda en localStorage para
 * no perderla al recargar, y se valida contra la API (/auth/yo) al iniciar.
 */
const AuthContext = createContext(null);
const CLAVE = 'origenes.sesion';

function leerSesion() {
  try {
    const guardada = JSON.parse(localStorage.getItem(CLAVE));
    return guardada?.token ? guardada : null;
  } catch {
    return null;
  }
}

function guardarSesion(sesion) {
  try {
    if (sesion) localStorage.setItem(CLAVE, JSON.stringify(sesion));
    else localStorage.removeItem(CLAVE);
  } catch {
    /* almacenamiento no disponible: la sesión dura mientras la pestaña esté abierta */
  }
}

export function AuthProvider({ children }) {
  const [sesion, setSesion] = useState(() => {
    const inicial = leerSesion();
    setToken(inicial?.token ?? null);
    return inicial;
  });
  const [verificando, setVerificando] = useState(Boolean(sesion));
  const [aviso, setAviso] = useState('');

  const aplicar = useCallback((nueva) => {
    setToken(nueva?.token ?? null);
    guardarSesion(nueva);
    setSesion(nueva);
  }, []);

  const logout = useCallback((mensaje = '') => {
    aplicar(null);
    setAviso(mensaje);
  }, [aplicar]);

  // Si la API responde 401 (token vencido o inválido), se cierra la sesión.
  useEffect(() => {
    onSesionVencida(() => logout('Tu sesión venció. Inicia sesión de nuevo.'));
  }, [logout]);

  // Al cargar la app se confirma que el token guardado sigue siendo válido.
  useEffect(() => {
    if (!sesion?.token) return;
    let activo = true;
    authService
      .yo()
      .then((usuario) => activo && aplicar({ token: sesion.token, usuario }))
      .catch(() => activo && logout())
      .finally(() => activo && setVerificando(false));
    return () => {
      activo = false;
    };
    // Solo al montar.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const login = useCallback(async (correo, password) => {
    const nueva = await authService.login(correo, password);
    setAviso('');
    aplicar(nueva);
    return nueva.usuario;
  }, [aplicar]);

  const registro = useCallback(async (datos) => {
    const nueva = await authService.registro(datos);
    setAviso('');
    aplicar(nueva);
    return nueva.usuario;
  }, [aplicar]);

  const value = useMemo(
    () => ({ usuario: sesion?.usuario ?? null, rol: sesion?.usuario?.rol ?? null, verificando, aviso, login, registro, logout }),
    [sesion, verificando, aviso, login, registro, logout],
  );
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

// eslint-disable-next-line react-refresh/only-export-components
export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth debe usarse dentro de <AuthProvider>');
  return ctx;
}
