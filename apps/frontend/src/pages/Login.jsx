import { useState } from 'react';
import { Navigate, useLocation, useNavigate } from 'react-router-dom';
import { Mail, LockKeyhole, Eye, EyeOff, LogIn, CircleAlert } from 'lucide-react';
import { useAuth } from '../context/AuthContext.jsx';
import { useApp } from '../context/AppContext.jsx';
import { Button, Field, Aviso } from '../components/ui/index.jsx';
import { puedeVer } from '../utils/permisos.js';
import { Logo, BordeEscalonado, DivisorRombos, OrnamentoTitulo, EscenaEncabezado, BandaGreca } from '../components/decor/Decor.jsx';

/** Usuarios de demostración (uno por rol). Solo se listan en desarrollo, y sin la contraseña. */
const USUARIOS_DEMO = ['admin', 'gerente', 'cajero', 'barista'].map((rol) => `${rol}@origenes.test`);

/** Pantalla de inicio de sesión con la identidad visual del restaurante (D-13). */
export default function Login() {
  const { usuario, iniciarSesion, aviso } = useAuth();
  const { config } = useApp();
  const navigate = useNavigate();
  const { state } = useLocation();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [verPassword, setVerPassword] = useState(false);
  const [enviando, setEnviando] = useState(false);
  const [error, setError] = useState(null);

  // Al terminar, vuelve a la pantalla que se quería abrir si el rol la incluye; si no, al inicio.
  const desde = state?.desde && state.desde !== '/login' ? state.desde : '/';
  const destinoPara = (u) => (puedeVer(u, desde.split('?')[0]) ? desde : '/');
  if (usuario) return <Navigate to={destinoPara(usuario)} replace />;

  const entrar = async (e) => {
    e.preventDefault();
    setError(null);
    setEnviando(true);
    try {
      const u = await iniciarSesion(email.trim(), password);
      navigate(destinoPara(u), { replace: true });
    } catch (err) {
      setError(err.message);
      setPassword('');
    } finally {
      setEnviando(false);
    }
  };

  return (
    <div className="flex min-h-screen flex-col bg-fondo">
      <main className="relative flex flex-1 items-center justify-center overflow-hidden px-4 py-10 sm:px-6">
        <EscenaEncabezado className="pointer-events-none absolute right-0 bottom-0 hidden h-40 w-[480px] md:block lg:h-48 lg:w-[580px]" />

        <div className="card anim-entrada relative z-[1] grid w-full max-w-[880px] overflow-hidden md:grid-cols-[1fr_1.15fr]">
          {/* Panel de marca, con los colores del menú lateral */}
          <section className="relative hidden flex-col items-center justify-center gap-6 bg-sidebar px-8 py-12 text-center text-white md:flex">
            <BordeEscalonado className="pointer-events-none absolute inset-y-0 right-0 opacity-70" />
            <Logo variante="completo" className="w-56 text-secundario" />
            <DivisorRombos className="w-full max-w-60" />
            <p className="max-w-60 font-display text-base font-medium text-white/85">Gestión, inventario y punto de venta de todas las sucursales</p>
          </section>

          {/* Formulario */}
          <section className="px-6 py-8 sm:px-10 sm:py-11">
            <div className="mb-6 flex items-center gap-3 md:hidden">
              <Logo variante="figura" className="w-12 text-[var(--c-tinta)]" />
              <span className="h-9 w-px bg-borde" />
              <span className="font-display text-xl font-bold tracking-wide text-texto uppercase">{config?.nombre ?? 'Orígenes SV'}</span>
            </div>

            <h1 className="font-display text-[2rem] leading-tight font-bold tracking-tight text-texto">Iniciar sesión</h1>
            <OrnamentoTitulo className="mt-2 mb-1" />
            <p className="mt-1 text-texto/80">Entra con tu correo y tu contraseña para empezar el turno.</p>

            {aviso && !error && (
              <Aviso className="mt-5" titulo="Sesión cerrada">
                {aviso}
              </Aviso>
            )}
            {error && (
              <div className="mt-5 flex items-center gap-3 rounded-xl border border-error/30 bg-error/10 px-4 py-3 text-sm text-error" role="alert">
                <CircleAlert className="size-5 shrink-0" />
                {error}
              </div>
            )}

            <form onSubmit={entrar} className="mt-6 flex flex-col gap-4">
              <Field label="Correo">
                <span className="relative">
                  <Mail className="pointer-events-none absolute top-1/2 left-3 size-[1.1rem] -translate-y-1/2 text-suave" />
                  <input
                    type="email"
                    className="campo py-2.5 pl-10"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    autoComplete="username"
                    placeholder="tucorreo@origenes.test"
                    required
                    autoFocus
                  />
                </span>
              </Field>
              <Field label="Contraseña">
                <span className="relative">
                  <LockKeyhole className="pointer-events-none absolute top-1/2 left-3 size-[1.1rem] -translate-y-1/2 text-suave" />
                  <input
                    type={verPassword ? 'text' : 'password'}
                    className="campo py-2.5 pr-11 pl-10"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    autoComplete="current-password"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setVerPassword((v) => !v)}
                    className="absolute top-1/2 right-2 -translate-y-1/2 rounded-lg p-1.5 text-suave hover:bg-superficie-2 hover:text-texto"
                    aria-label={verPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                  >
                    {verPassword ? <EyeOff className="size-[1.1rem]" /> : <Eye className="size-[1.1rem]" />}
                  </button>
                </span>
              </Field>
              <Button type="submit" icon={LogIn} loading={enviando} className="mt-2 py-3 text-base">
                Entrar
              </Button>
            </form>

            {import.meta.env.DEV && (
              <div className="mt-6 border-t border-borde pt-4 text-xs text-suave">
                <p className="mb-2">Usuarios de prueba (la contraseña es SEED_PASSWORD del archivo .env):</p>
                <div className="flex flex-wrap gap-1.5">
                  {USUARIOS_DEMO.map((correo) => (
                    <button key={correo} type="button" onClick={() => setEmail(correo)} className="rounded-full border border-borde px-2.5 py-1 hover:border-acento hover:text-texto">
                      {correo}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </section>
        </div>
      </main>
      <BandaGreca />
    </div>
  );
}
