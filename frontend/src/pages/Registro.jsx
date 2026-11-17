import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { UserPlus, CircleAlert } from 'lucide-react';
import { useAuth } from '../context/AuthContext.jsx';
import { Button, Field } from '../components/ui/index.jsx';
import { MarcoAcceso } from './Login.jsx';

/** Registro público: solo crea cuentas de cliente para ordenar en línea. */
export default function Registro() {
  const { registro } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ nombre: '', correo: '', telefono: '', password: '', confirmar: '' });
  const [error, setError] = useState('');
  const [enviando, setEnviando] = useState(false);
  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  const crear = async (e) => {
    e.preventDefault();
    setError('');
    if (form.password.length < 8) return setError('La contraseña debe tener al menos 8 caracteres');
    if (form.password !== form.confirmar) return setError('Las contraseñas no coinciden');
    setEnviando(true);
    try {
      const { confirmar, ...datos } = form;
      await registro(datos);
      navigate('/menu', { replace: true });
    } catch (err) {
      setError(err.message);
      setEnviando(false);
    }
    return undefined;
  };

  return (
    <MarcoAcceso>
      <h1 className="font-display text-3xl font-bold text-texto">Crea tu cuenta</h1>
      <p className="mt-1 mb-6 text-suave">Ordena tus platillos favoritos y sigue tu pedido en línea.</p>

      {error && (
        <p role="alert" className="mb-4 flex items-start gap-2 rounded-xl border border-error/30 bg-error/10 px-4 py-3 text-sm text-error">
          <CircleAlert className="mt-0.5 size-4 shrink-0" /> {error}
        </p>
      )}

      <form onSubmit={crear} className="card grid gap-4 p-6 sm:grid-cols-2">
        <Field label="Nombre completo" className="sm:col-span-2">
          <input className="campo h-11" required autoComplete="name" value={form.nombre} onChange={set('nombre')} />
        </Field>
        <Field label="Correo" className="sm:col-span-2">
          <input className="campo h-11" type="email" required autoComplete="email" value={form.correo} onChange={set('correo')} />
        </Field>
        <Field label="Teléfono (opcional)" className="sm:col-span-2">
          <input className="campo h-11" type="tel" autoComplete="tel" value={form.telefono} onChange={set('telefono')} placeholder="7000-0000" />
        </Field>
        <Field label="Contraseña" ayuda="Mínimo 8 caracteres">
          <input className="campo h-11" type="password" required minLength={8} autoComplete="new-password" value={form.password} onChange={set('password')} />
        </Field>
        <Field label="Repite la contraseña">
          <input className="campo h-11" type="password" required autoComplete="new-password" value={form.confirmar} onChange={set('confirmar')} />
        </Field>
        <Button type="submit" icon={UserPlus} loading={enviando} className="h-12 text-base sm:col-span-2">
          Crear cuenta
        </Button>
      </form>

      <p className="mt-5 text-center text-sm text-suave">
        ¿Ya tienes cuenta?{' '}
        <Link to="/login" className="font-semibold text-acento hover:underline">
          Inicia sesión
        </Link>
      </p>
    </MarcoAcceso>
  );
}
