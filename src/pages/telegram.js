import { getCodigoTelegram } from '../js/api.js';

const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

export function renderTelegram(container) {
  const card = document.createElement('div');
  card.className = 'perfil-card perfil-edit tg-card';
  card.innerHTML = `
    <h2>Vincular Telegram</h2>
    <p class="muted">Genera un código y envíalo al bot para recibir notificaciones por Telegram.</p>
    <button id="tg-btn" class="btn">Generar código</button>
    <div id="tg-out"></div>`;
  container.appendChild(card);

  const btn = card.querySelector('#tg-btn');
  const out = card.querySelector('#tg-out');
  let timer = null;

  btn.addEventListener('click', async () => {
    clearInterval(timer);
    btn.disabled = true;
    out.innerHTML = '<p class="muted">Generando código...</p>';

    try {
      const res = await getCodigoTelegram();
      const expira = new Date(res.expira_en).getTime();

      out.innerHTML = `
        <p class="muted">Abre el bot <strong>@MrfN8n_bot</strong> en Telegram y envía:</p>
        <div class="tg-cmd">/vincular ${esc(res.codigo)}</div>
        <p id="tg-timer" class="muted"></p>`;

      const timerEl = out.querySelector('#tg-timer');
      const tick = () => {
        const s = Math.max(0, Math.floor((expira - Date.now()) / 1000));
        if (s === 0) {
          clearInterval(timer);
          timerEl.className = 'error';
          timerEl.textContent = '✕ El código expiró. Genera uno nuevo.';
          return;
        }
        timerEl.textContent = `Expira en ${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
      };
      tick();
      timer = setInterval(tick, 1000);
    } catch (err) {
      out.innerHTML = `<p class="error">✕ ${esc(err.message)}</p>`;
    } finally {
      btn.disabled = false;
    }
  });
}
