import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { LogIn, Eye, EyeOff, CircleAlert } from 'lucide-react';
import { useAuth } from '../context/AuthContext.jsx';
import { useApp } from '../context/AppContext.jsx';
import { Button, Field } from '../components/ui/index.jsx';
import { Logo, Greca, DivisorRombos } from '../components/decor/Decor.jsx';
import { INICIO_POR_ROL, puedeVer, ETIQUETA_ROL } from '../routes/modulos.js';

/** Cuentas de demostración (solo visibles en desarrollo; están en los datos semilla y el README). */
const DEMO = [
  { rol: 'administrador', correo: 'admin@origenes.sv', password: 'Admin2026!' },
  { rol: 'cajero', correo: 'cajero@origenes.sv', password: 'Cajero2026!' },
  { rol: 'cocinero', correo: 'cocina@origenes.sv', password: 'Cocina2026!' },
  { rol: 'cliente', correo: 'cliente@origenes.sv', password: 'Cliente2026!' },
];

/** Marco compartido por el inicio de sesión y el registro: panel de marca + formulario. */
export function MarcoAcceso({ children }) {
  const { config } = useApp();
  return (
    <div className="grid min-h-screen bg-fondo lg:grid-cols-[1.05fr_1fr]">
      <aside className="relative hidden flex-col items-center justify-center overflow-hidden bg-primario px-10 text-center text-white lg:flex">
        <div className="absolute inset-x-0 bottom-0 h-24 text-secundario/25">
          <Greca id="acceso-greca" />
        </div>
        <Logo variante="figura" className="w-56 text-secundario" />
        <p className="mt-6 font-display text-4xl font-bold tracking-wide uppercase">{config?.nombre ?? 'Orígenes SV'}</p>
        <DivisorRombos className="my-4 w-64" />
        <p className="font-['Playfair_Display'] text-3xl italic text-secundario">{config?.eslogan}</p>
        <p className="mt-6 max-w-md text-white/75">Sistema de ventas, cocina, inventario y caja de nuestras sucursales en El Salvador.</p>
      </aside>
      <main className="flex items-center justify-center px-5 py-10">
        <div className="w-full max-w-md">
          <div className="mb-6 flex items-center gap-3 lg:hidden">
            <Logo variante="figura" className="w-14 text-primario" />
            <span className="font-display text-xl font-bold uppercase">{config?.nombre ?? 'Orígenes SV'}</span>
          </div>
          {children}
        </div>
      </main>
    </div>
  );
}

export default function Login() {
  const { login, aviso } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [correo, setCorreo] = useState('');
  const [password, setPassword] = useState('');
  const [verPassword, setVerPassword] = useState(false);
  const [error, setError] = useState('');
  const [enviando, setEnviando] = useState(false);

  const entrar = async (e) => {
    e.preventDefault();
    setError('');
    setEnviando(true);
    try {
      const usuario = await login(correo, password);
      const desde = location.state?.desde;
      navigate(desde && puedeVer(usuario.rol, desde) ? desde : INICIO_POR_ROL[usuario.rol], { replace: true });
    } catch (err) {
      setError(err.message);
      setEnviando(false);
    }
  };

  return (
    <MarcoAcceso>
      <h1 className="font-display text-3xl font-bold text-texto">Iniciar sesión</h1>
      <p className="mt-1 mb-6 text-suave">Entra con tu correo y contraseña.</p>

      {(error || aviso) && (
        <p role="alert" className="mb-4 flex items-start gap-2 rounded-xl border border-error/30 bg-error/10 px-4 py-3 text-sm text-error">
          <CircleAlert className="mt-0.5 size-4 shrink-0" /> {error || aviso}
        </p>
      )}

      <form onSubmit={entrar} className="card space-y-4 p-6">
        <Field label="Correo">
          <input className="campo h-12" type="email" autoComplete="username" required value={correo} onChange={(e) => setCorreo(e.target.value)} />
        </Field>
        <Field label="Contraseña">
          <div className="relative">
            <input className="campo h-12 pr-12" type={verPassword ? 'text' : 'password'} autoComplete="current-password" required value={password} onChange={(e) => setPassword(e.target.value)} />
            <button type="button" onClick={() => setVerPassword((v) => !v)} className="absolute top-1/2 right-3 -translate-y-1/2 text-suave hover:text-texto" aria-label={verPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}>
              {verPassword ? <EyeOff className="size-5" /> : <Eye className="size-5" />}
            </button>
          </div>
        </Field>
        <Button type="submit" icon={LogIn} loading={enviando} className="h-12 w-full text-base">
          Iniciar sesión
        </Button>
      </form>

      <p className="mt-5 text-center text-sm text-suave">
        ¿Quieres ordenar en línea?{' '}
        <Link to="/registro" className="font-semibold text-acento hover:underline">
          Crea tu cuenta de cliente
        </Link>
      </p>

      {import.meta.env.DEV && (
        <div className="mt-8 rounded-xl border border-dashed border-borde p-4">
          <p className="mb-2 text-xs font-semibold text-suave">Cuentas de demostración (solo en desarrollo)</p>
          <div className="grid grid-cols-2 gap-2">
            {DEMO.map((d) => (
              <button
                key={d.rol}
                type="button"
                onClick={() => {
                  setCorreo(d.correo);
                  setPassword(d.password);
                }}
                className="rounded-lg border border-borde bg-superficie px-3 py-2 text-left text-sm hover:bg-superficie-2"
              >
                <span className="block font-display font-semibold text-texto">{ETIQUETA_ROL[d.rol]}</span>
                <span className="block truncate text-xs text-suave">{d.correo}</span>
              </button>
            ))}
          </div>
        </div>
      )}
    </MarcoAcceso>
  );
}
