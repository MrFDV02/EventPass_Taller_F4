import { getCatalogo, crearInscripcion } from '../js/api.js';
import { haySesion, usuarioActual } from '../js/session.js';

const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

export async function renderEvento(app, evento_id) {
  app.innerHTML = `
    <section class="page">
      <a href="#/" class="back">← Volver al catálogo</a>
      <div id="ev-body"><p class="msg">$ cargando evento...</p></div>
    </section>`;

  const body = app.querySelector('#ev-body');

  try {
    const res = await getCatalogo('DETALLE', { evento_id });
    const e = Array.isArray(res.data) ? res.data[0] : res.data;
    if (!e) {
      body.innerHTML = '<p class="msg error">✗ Evento no encontrado</p>';
      return;
    }

    const lleno = e.disponibilidad === 'LLENO';
    const logueado = haySesion();

    body.innerHTML = `
      <p class="eyebrow">// ${esc(e.categoria)}</p>
      <h1>${esc(e.nombre)}</h1>
      <p class="ev-desc">${esc(e.descripcion)}</p>

      <div class="perfil-card">
        <dl class="perfil">
          <dt>Fecha</dt><dd>${esc(e.fecha)} · ${esc(e.hora)}</dd>
          <dt>Lugar</dt><dd>${esc(e.lugar)}</dd>
          <dt>Organizador</dt><dd>${esc(e.organizador)}</dd>
          <dt>Cupos</dt><dd class="${lleno ? 'full' : 'ok'}">${lleno ? '○ LLENO · lista de espera' : `● ${esc(e.cupos_disponibles)} / ${esc(e.capacidad)}`}</dd>
        </dl>
      </div>

      <div class="perfil-card perfil-edit" id="ev-inscribir"></div>`;

    const box = body.querySelector('#ev-inscribir');

    if (!logueado) {
      box.innerHTML = `
        <h2>Inscripción</h2>
        <p class="muted">Inicia sesión para inscribirte a este evento.</p>
        <a href="#/login" class="btn-sm">Iniciar sesión</a>`;
      return;
    }

    box.innerHTML = `
      <h2>${lleno ? 'Unirme a la lista de espera' : 'Inscribirme'}</h2>
      <form id="form-insc" class="form">
        <label for="i-nombre">Nombre de acreditación</label>
        <input id="i-nombre" type="text" value="${esc(usuarioActual().nombre)}" required />
        <label for="i-obs">Observaciones (opcional)</label>
        <input id="i-obs" type="text" />
        <button type="submit" class="btn">${lleno ? 'Unirme a la lista' : 'Confirmar inscripción'}</button>
        <p id="i-msg" class="muted"></p>
      </form>`;

    const form = box.querySelector('#form-insc');
    const msg = box.querySelector('#i-msg');
    const btn = form.querySelector('button');

    form.addEventListener('submit', async (ev) => {
      ev.preventDefault();
      const nombre = form.querySelector('#i-nombre').value.trim();
      const obs = form.querySelector('#i-obs').value.trim();
      if (!nombre) { msg.className = 'error'; msg.textContent = '✕ El nombre de acreditación es obligatorio'; return; }

      btn.disabled = true;
      msg.className = 'muted';
      msg.textContent = 'Procesando inscripción...';

      try {
        const r = await crearInscripcion(usuarioActual().usuario_id, e.evento_id, nombre, obs);
        msg.className = 'success';
        msg.textContent = r.estado === 'LISTA_ESPERA'
          ? '✓ Quedaste en lista de espera. Te avisaremos por correo y Telegram.'
          : '✓ Inscripción confirmada. Te enviamos la confirmación por correo y Telegram.';
        btn.disabled = true;
      } catch (err) {
        msg.className = 'error';
        msg.textContent = `✕ ${err.message}`;
        btn.disabled = false;
      }
    });
  } catch (err) {
    body.innerHTML = `<p class="msg error">✗ Error: ${esc(err.message)}</p>`;
  }
}
