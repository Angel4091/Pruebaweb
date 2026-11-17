/**
 * Cliente HTTP de la API REST.
 * Usa fetch con async/await, envía el token de sesión, convierte los errores HTTP
 * en ApiError y avisa cuando la sesión venció (401) para volver al inicio de sesión.
 */
const BASE_URL = import.meta.env.VITE_API_URL || '/api';

let token = null;
let alVencerSesion = null;

/** Guarda el token que se enviará en cada petición (lo llama el contexto de sesión). */
export const setToken = (nuevo) => {
  token = nuevo;
};

/** Registra qué hacer cuando la API responde 401 (sesión inválida o vencida). */
export const onSesionVencida = (fn) => {
  alVencerSesion = fn;
};

export class ApiError extends Error {
  constructor(message, status, details) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.details = details;
  }
}

function buildUrl(path, params) {
  const url = new URL(`${BASE_URL}${path}`, window.location.origin);
  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') url.searchParams.set(key, value);
    });
  }
  return url;
}

async function request(method, path, { body, params } = {}) {
  const headers = {};
  if (body) headers['Content-Type'] = 'application/json';
  if (token) headers.Authorization = `Bearer ${token}`;

  let response;
  try {
    response = await fetch(buildUrl(path, params), { method, headers, body: body ? JSON.stringify(body) : undefined });
  } catch {
    throw new ApiError('No se pudo conectar con el servidor. Verifica que la API esté encendida.', 0);
  }

  const isJson = response.headers.get('content-type')?.includes('application/json');
  const data = isJson ? await response.json() : null;

  if (!response.ok) {
    if (response.status === 401 && token && !path.startsWith('/auth/')) alVencerSesion?.();
    throw new ApiError(data?.error || `Error ${response.status}`, response.status, data?.details);
  }
  return data;
}

export const api = {
  get: (path, params) => request('GET', path, { params }),
  post: (path, body) => request('POST', path, { body }),
  put: (path, body) => request('PUT', path, { body }),
  patch: (path, body) => request('PATCH', path, { body }),
  del: (path) => request('DELETE', path),
};
