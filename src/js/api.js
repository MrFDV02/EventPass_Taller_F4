const BASE_URL = import.meta.env.VITE_N8N_BASE_URL;

export async function api(path, body = {}) {
  const token = localStorage.getItem('session_token');
  const res = await fetch(`${BASE_URL}/webhook/${path}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'ngrok-skip-browser-warning': 'true',
    },
    body: JSON.stringify({ ...body, session_token: token }),
  });
  const data = await res.json().catch(() => ({ ok: false, error: 'Respuesta inválida' }));
  if (!res.ok || data.ok === false) {
    throw new Error(data.error || `Error ${res.status}`);
  }
  return data;
}

export const getCatalogo = (tipo = 'LISTADO', extra = {}) =>
  api('eventpass/catalogo', { tipo, ...extra });

export const registrar = (nombre, email, password) =>
  api('eventpass/usuarios', { operacion: 'crear', nombre, email, password });

export const login = (email, password) =>
  api('eventpass/auth', { operacion: 'login', email, password });

export const logout = () => api('eventpass/auth', { operacion: 'logout' });

export const validarSesion = () => api('eventpass/auth', { operacion: 'validar' });

export const getPerfil = (usuario_id) =>
  api('eventpass/usuarios', { operacion: 'perfil', usuario_id });

export const actualizarPerfil = (usuario_id, nombre, password) =>
  api('eventpass/usuarios', {
    operacion: 'actualizar',
    usuario_id,
    nombre,
    ...(password ? { password } : {}),
  });

export const getCodigoTelegram = () => api('eventpass/telegram/codigo');

export const crearInscripcion = (usuario_id, evento_id, nombre_acreditacion, observaciones = '') =>
  api('inscripciones', { accion: 'CREAR', usuario_id, evento_id, nombre_acreditacion, observaciones });

export const misInscripciones = (usuario_id) =>
  api('inscripciones', { accion: 'CONSULTAR', usuario_id });

export const cancelarInscripcion = (usuario_id, inscripcion_id) =>
  api('inscripciones', { accion: 'CANCELAR', usuario_id, inscripcion_id });

export async function registrarCheckin(inscripcion_id, evento_id) {
  const res = await fetch(`${BASE_URL}/webhook/eventpass/checkin`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'ngrok-skip-browser-warning': 'true',
    },
    body: JSON.stringify({ inscripcion_id, evento_id }),
  });
  const data = await res.json().catch(() => null);
  if (!data) throw new Error(`Respuesta inválida (${res.status})`);
  return data;
}
