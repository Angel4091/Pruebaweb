import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { authService } from '../services/index.js';
import { sesion, SESION_VENCIDA } from '../services/api.js';
import { puede, puedeVer } from '../utils/permisos.js';

/**
 * Sesión del usuario:
 * - al abrir la app con un token guardado, confirma con /auth/me que sigue vigente
 * - iniciarSesion guarda el token; cerrarSesion lo borra
 * - si la API responde 401 (token vencido o usuario desactivado), vuelve al login con un aviso
 */
const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [usuario, setUsuario] = useState(null);
  const [verificando, setVerificando] = useState(() => Boolean(sesion.token()));
  const [aviso, setAviso] = useState(null);

  useEffect(() => {
    if (!sesion.token()) return undefined;
    let activo = true;
    authService
      .yo()
      .then((u) => activo && setUsuario(u))
      // Si fue un 401, api.js ya borró el token; si la API no responde, se avisa en el login.
      .catch((err) => activo && err.status !== 401 && setAviso(err.message))
      .finally(() => activo && setVerificando(false));
    return () => {
      activo = false;
    };
  }, []);

  useEffect(() => {
    const alVencer = () => {
      setUsuario(null);
      setAviso('Tu sesión terminó. Vuelve a iniciar sesión para continuar.');
    };
    window.addEventListener(SESION_VENCIDA, alVencer);
    return () => window.removeEventListener(SESION_VENCIDA, alVencer);
  }, []);

  const iniciarSesion = useCallback(async (email, password) => {
    const { token, usuario: u } = await authService.login(email, password);
    sesion.guardar(token);
    setAviso(null);
    setUsuario(u);
    return u;
  }, []);

  const cerrarSesion = useCallback(() => {
    sesion.guardar(null);
    setAviso(null);
    setUsuario(null);
  }, []);

  const value = useMemo(
    () => ({
      usuario,
      verificando,
      aviso,
      iniciarSesion,
      cerrarSesion,
      puedeVer: (ruta) => puedeVer(usuario, ruta),
      puede: (accion) => puede(usuario, accion),
    }),
    [usuario, verificando, aviso, iniciarSesion, cerrarSesion],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

// eslint-disable-next-line react-refresh/only-export-components
export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth debe usarse dentro de <AuthProvider>');
  return ctx;
}
