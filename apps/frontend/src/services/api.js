/**
 * Cliente HTTP de la API REST.
 * Usa fetch con async/await, convierte los errores HTTP en ApiError
 * y expone helpers por verbo (get, post, put, patch, del).
 * Si hay sesión, envía el token en "Authorization: Bearer …".
 */
const BASE_URL = import.meta.env.VITE_API_URL || '/api';

/**
 * Token de la sesión. Se guarda en sessionStorage: dura mientras la pestaña
 * esté abierta y se borra al cerrarla (en una computadora compartida de caja
 * la sesión no queda abierta para el siguiente turno).
 */
const CLAVE_TOKEN = 'origenes.token';
let token = (() => {
  try {
    return sessionStorage.getItem(CLAVE_TOKEN);
  } catch {
    return null;
  }
})();

export const sesion = {
  token: () => token,
  guardar(nuevo) {
    token = nuevo || null;
    try {
      if (token) sessionStorage.setItem(CLAVE_TOKEN, token);
      else sessionStorage.removeItem(CLAVE_TOKEN);
    } catch {
      /* almacenamiento no disponible: la sesión dura hasta recargar */
    }
  },
};

/** Evento que avisa a la app que el token venció o dejó de ser válido. */
export const SESION_VENCIDA = 'origenes:sesion-vencida';

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
    response = await fetch(buildUrl(path, params), {
      method,
      headers,
      body: body ? JSON.stringify(body) : undefined,
    });
  } catch {
    throw new ApiError('No se pudo conectar con el servidor. Verifica que la API esté encendida.', 0);
  }

  const isJson = response.headers.get('content-type')?.includes('application/json');
  const data = isJson ? await response.json() : null;

  // Un 401 con sesión abierta significa que el token venció o el usuario fue desactivado.
  if (response.status === 401 && token) {
    sesion.guardar(null);
    window.dispatchEvent(new Event(SESION_VENCIDA));
  }

  if (!response.ok) {
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
