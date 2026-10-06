export function guardarSesion(res) {
  localStorage.setItem('session_token', res.session_token);
  localStorage.setItem('usuario', JSON.stringify({
    usuario_id: res.usuario_id,
    nombre: res.nombre,
    expira_en: res.expira_en,
  }));
}

export function usuarioActual() {
  try { return JSON.parse(localStorage.getItem('usuario')); }
  catch { return null; }
}

export function limpiarSesion() {
  localStorage.removeItem('session_token');
  localStorage.removeItem('usuario');
}

export const haySesion = () => !!localStorage.getItem('session_token') && !!usuarioActual();
