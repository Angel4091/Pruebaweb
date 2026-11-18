import { Link } from 'react-router-dom';
import { Logo } from '../components/decor/Decor.jsx';

export default function NoEncontrado() {
  return (
    <div className="flex flex-col items-center gap-4 py-20 text-center">
      <Logo variante="figura" className="w-32 text-secundario" />
      <h1 className="font-display text-3xl font-bold text-texto">Esta página no existe</h1>
      <p className="text-suave">Revisa la dirección o vuelve al inicio para seguir trabajando.</p>
      <Link to="/" className="rounded-xl bg-primario px-5 py-2.5 font-display font-semibold text-white">
        Ir al inicio
      </Link>
    </div>
  );
}
