import { getCatalogo, misInscripciones, cancelarInscripcion } from '../js/api.js';
import { haySesion, usuarioActual } from '../js/session.js';

const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

const fecha = (iso) => {
  const d = new Date(iso);
  return isNaN(d) ? esc(iso) : d.toLocaleString('es-CO', { dateStyle: 'medium', timeStyle: 'short' });
};

const BADGE = { CONFIRMADA: 'badge-ok', LISTA_ESPERA: 'badge-wait', CANCELADA: 'badge-off' };

export async function renderInscripciones(app) {
  if (!haySesion()) {
    location.hash = '#/login';
    return;
  }

  app.innerHTML = `
    <section class="page">
      <p class="eyebrow">// MIS INSCRIPCIONES</p>
      <h1>Mis inscripciones</h1>
      <div id="insc-body"><p class="msg">$ cargando inscripciones...</p></div>
    </section>`;

  const body = app.querySelector('#insc-body');
  const uid = usuarioActual().usuario_id;

  async function cargar() {
    try {
      const [ins, cat] = await Promise.all([misInscripciones(uid), getCatalogo('LISTADO')]);
      const eventos = {};
      (cat.data || []).forEach((e) => { eventos[e.evento_id] = e; });

      const lista = (ins.inscripciones || []).slice().reverse();
      if (!lista.length) {
        body.innerHTML = '<p class="msg">// aún no tienes inscripciones</p>';
        return;
      }

      body.innerHTML = `<div class="insc-list">${lista.map((i) => {
        const ev = eventos[i.evento_id];
        const activa = i.estado !== 'CANCELADA';
        return `
          <article class="perfil-card insc-card">
            <div class="insc-top">
              <div>
                <div class="perfil-nombre">${esc(ev ? ev.nombre : i.evento_id)}</div>
                <div class="perfil-id">${esc(i.inscripcion_id)}</div>
              </div>
              <span class="badge ${BADGE[i.estado] || 'badge-off'}">${esc(i.estado)}</span>
            </div>
            <div class="insc-meta">
              ${ev ? `<span>📅 ${esc(ev.fecha)} · ${esc(ev.hora)}</span><span>📍 ${esc(String(ev.lugar).trim())}</span>` : ''}
              <span>🎫 ${esc(i.nombre_acreditacion)}</span>
              <span>🕒 ${fecha(i.fecha_inscripcion)}</span>
              ${i.estado === 'LISTA_ESPERA' && i.orden_espera ? `<span>⏳ Posición ${esc(i.orden_espera)}</span>` : ''}
            </div>
            ${activa ? `<button class="btn-cancel" data-id="${esc(i.inscripcion_id)}">Cancelar inscripción</button>` : ''}
            <p class="insc-msg" data-msg="${esc(i.inscripcion_id)}"></p>
          </article>`;
      }).join('')}</div>`;

      body.querySelectorAll('.btn-cancel').forEach((b) =>
        b.addEventListener('click', async () => {
          if (!confirm('¿Cancelar esta inscripción?')) return;
          const id = b.dataset.id;
          const msg = body.querySelector(`[data-msg="${id}"]`);
          b.disabled = true;
          msg.className = 'insc-msg muted';
          msg.textContent = 'Cancelando...';
          try {
            await cancelarInscripcion(uid, id);
            await cargar();
          } catch (err) {
            msg.className = 'insc-msg error';
            msg.textContent = `✕ ${err.message}`;
            b.disabled = false;
          }
        })
      );
    } catch (err) {
      body.innerHTML = `<p class="msg error">✗ Error: ${esc(err.message)}</p>`;
    }
  }

  cargar();
}
