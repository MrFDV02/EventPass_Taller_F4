import { getPerfil, actualizarPerfil } from '../js/api.js';
import { haySesion, usuarioActual } from '../js/session.js';
import { renderTelegram } from './telegram.js';

const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

const fecha = (iso) => {
  const d = new Date(iso);
  if (isNaN(d)) return esc(iso);
  return d.toLocaleString('es-CO', { dateStyle: 'long', timeStyle: 'short' });
};

export async function renderPerfil(app) {
  if (!haySesion()) {
    location.hash = '#/login';
    return;
  }

  app.innerHTML = `
    <section class="page">
      <p class="eyebrow">// PERFIL</p>
      <h1>Mi perfil</h1>
      <div id="perfil-body"><p class="muted">Cargando perfil...</p></div>
    </section>`;

  const body = app.querySelector('#perfil-body');

  try {
    const res = await getPerfil(usuarioActual().usuario_id);
    const u = res.data;
    const activo = u.estado === 'ACTIVO';
    body.innerHTML = `
      <div class="perfil-card">
        <div class="perfil-head">
          <div class="avatar">${esc((u.nombre || '?').charAt(0).toUpperCase())}</div>
          <div>
            <div class="perfil-nombre">${esc(u.nombre)}</div>
            <div class="perfil-id">${esc(u.usuario_id)}</div>
          </div>
          <span class="badge ${activo ? 'badge-ok' : 'badge-off'}">${esc(u.estado)}</span>
        </div>
        <dl class="perfil">
          <dt>Email</dt><dd>${esc(u.email)}</dd>
          <dt>Registro</dt><dd>${fecha(u.fecha_registro)}</dd>
          <dt>Actualizado</dt><dd>${fecha(u.fecha_actualizacion)}</dd>
        </dl>
      </div>

      <div class="perfil-card perfil-edit">
        <h2>Editar perfil</h2>
        <form id="form-perfil" class="form">
          <label for="p-nombre">Nombre</label>
          <input id="p-nombre" type="text" value="${esc(u.nombre)}" required />
          <label for="p-pass">Nueva contraseña (opcional)</label>
          <input id="p-pass" type="password" minlength="8" placeholder="Déjala vacía para conservar la actual" />
          <button type="submit" class="btn">Guardar cambios</button>
          <p id="p-msg" class="muted"></p>
        </form>
      </div>`;

    renderTelegram(body);
    const form = body.querySelector('#form-perfil');
    const msg = body.querySelector('#p-msg');
    const btn = form.querySelector('button');

    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      const nombre = form.querySelector('#p-nombre').value.trim();
      const password = form.querySelector('#p-pass').value;

      if (!nombre) { msg.className = 'error'; msg.textContent = '✕ El nombre es obligatorio'; return; }
      if (password && password.length < 8) { msg.className = 'error'; msg.textContent = '✕ La contraseña debe tener mínimo 8 caracteres'; return; }

      btn.disabled = true;
      msg.className = 'muted';
      msg.textContent = 'Guardando...';

      try {
        await actualizarPerfil(u.usuario_id, nombre, password);
        const s = usuarioActual();
        localStorage.setItem('usuario', JSON.stringify({ ...s, nombre }));
        const navUser = document.querySelector('#nav .user');
        if (navUser) navUser.textContent = nombre;
        body.querySelector('.perfil-nombre').textContent = nombre;
        body.querySelector('.avatar').textContent = nombre.charAt(0).toUpperCase();
        form.querySelector('#p-pass').value = '';
        msg.className = 'success';
        msg.textContent = '✓ Perfil actualizado';
      } catch (err) {
        msg.className = 'error';
        msg.textContent = `✕ ${err.message}`;
      } finally {
        btn.disabled = false;
      }
    });
  } catch (err) {
    body.innerHTML = `<p class="error">✕ ${esc(err.message)}</p>`;
  }
}
