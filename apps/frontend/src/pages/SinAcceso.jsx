import { Link } from 'react-router-dom';
import { Logo } from '../components/decor/Decor.jsx';
import { useAuth } from '../context/AuthContext.jsx';
import { NOMBRE_ROL } from '../utils/permisos.js';

/** Se muestra cuando alguien abre la dirección de un módulo que su rol no incluye. */
export default function SinAcceso() {
  const { usuario } = useAuth();
  return (
    <div className="flex flex-col items-center gap-4 py-20 text-center">
      <Logo variante="figura" className="w-32 text-secundario" />
      <h1 className="font-display text-3xl font-bold text-texto">Este módulo no está en tu menú</h1>
      <p className="max-w-md text-suave">
        Tu rol ({NOMBRE_ROL[usuario?.rol] ?? 'sin rol'}) no incluye esta pantalla. Si la necesitas, pídele acceso al administrador.
      </p>
      <Link to="/" className="rounded-xl bg-primario px-5 py-2.5 font-display font-semibold text-white">
        Ir al inicio
      </Link>
    </div>
  );
}
