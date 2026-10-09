import { getCatalogo, registrarCheckin } from '../js/api.js';

const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

export async function renderCheckin(app) {
  app.innerHTML = `
    <section class="page">
      <p class="eyebrow">// CHECK-IN</p>
      <h1>Check-in de asistentes</h1>
      <form id="ck-form" class="perfil-card checkin-form" novalidate>
        <label for="ck-evento">Evento</label>
        <select id="ck-evento"><option value="">Cargando eventos...</option></select>
        <label for="ck-insc">ID de inscripción</label>
        <input id="ck-insc" type="text" placeholder="INS-..." autocomplete="off" />
        <button type="submit" id="ck-btn">Registrar ingreso</button>
      </form>
      <div id="ck-result" class="checkin-result" aria-live="polite"></div>
    </section>`;

  const sel = app.querySelector('#ck-evento');
  const inp = app.querySelector('#ck-insc');
  const btn = app.querySelector('#ck-btn');
  const out = app.querySelector('#ck-result');

  const mostrar = (clase, html) => {
    out.className = `checkin-result ${clase}`;
    out.innerHTML = html;
  };

  try {
    const cat = await getCatalogo('LISTADO');
    const eventos = cat.data || [];
    sel.innerHTML =
      '<option value="">Selecciona un evento</option>' +
      eventos.map((e) => `<option value="${esc(e.evento_id)}">${esc(e.nombre)} (${esc(e.evento_id)})</option>`).join('');
  } catch {
    sel.innerHTML = '<option value="">No se pudieron cargar los eventos</option>';
  }

  app.querySelector('#ck-form').addEventListener('submit', async (ev) => {
    ev.preventDefault();
    const evento_id = sel.value;
    const inscripcion_id = inp.value.trim();

    if (!evento_id || !inscripcion_id) {
      mostrar('checkin-error', '✕ Selecciona un evento e ingresa el ID de la inscripción.');
      return;
    }

    btn.disabled = true;
    mostrar('checkin-loading', '$ registrando ingreso...');

    try {
      const r = await registrarCheckin(inscripcion_id, evento_id);

      if (r.resultado === 'EXITOSO') {
        mostrar('checkin-ok', `
          <strong>✓ Check-in realizado correctamente.</strong>
          <span>Inscripción: ${esc(r.inscripcion_id)}</span>
          <span>Evento: ${esc(r.evento_id)}</span>
          <span>Registro: ${esc(r.checkin_id)}</span>`);
        inp.value = '';
        inp.focus();
      } else if (r.resultado === 'DUPLICADO') {
        mostrar('checkin-warn', `
          <strong>⚠ El ingreso ya había sido registrado.</strong>
          <span>Inscripción: ${esc(r.inscripcion_id)}</span>`);
      } else if (r.resultado === 'RECHAZADO') {
        mostrar('checkin-error', `<strong>✕ Ingreso rechazado.</strong><span>${esc(r.mensaje)}</span>`);
      } else {
        mostrar('checkin-error', `<strong>✕ Error inesperado.</strong><span>${esc(r.message || r.error || 'Sin detalle')}</span>`);
      }
    } catch (err) {
      mostrar('checkin-error', `<strong>✕ No se pudo conectar con el servidor.</strong><span>${esc(err.message)}</span>`);
    } finally {
      btn.disabled = false;
    }
  });
}