import { getCatalogo } from '../js/api.js';

const CATEGORIAS = ['Todas', 'Tecnología', 'Educación', 'Networking', 'Cultura'];
let activa = 'Todas';

const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

function shell(app) {
  app.innerHTML = `
    <p class="eyebrow">// CATÁLOGO</p>
    <h1>Eventos tech</h1>
    <div class="chips">
      ${CATEGORIAS.map((c) => `<button class="chip ${c === activa ? 'on' : ''}" data-cat="${c}">${c}</button>`).join('')}
    </div>
    <div id="lista"></div>
  `;
  app.querySelectorAll('.chip').forEach((b) =>
    b.addEventListener('click', () => { activa = b.dataset.cat; shell(app); cargar(); })
  );
}

function tarjeta(e) {
  const lleno = e.disponibilidad === 'LLENO';
  return `
    <article class="card" data-id="${esc(e.evento_id)}">
      <span class="cat">${esc(e.categoria)}</span>
      <h3>${esc(e.nombre)}</h3>
      <p>${esc(e.descripcion)}</p>
      <div class="meta">
        <span>📅 ${esc(e.fecha)} · ${esc(e.hora)}</span>
        <span>📍 ${esc(e.lugar)}</span>
      </div>
      <div class="status ${lleno ? 'full' : 'ok'}">
        ${lleno ? '○ LLENO · lista de espera' : `● CUPOS: ${e.cupos_disponibles} / ${e.capacidad}`}
      </div>
    </article>`;
}

async function cargar() {
  const lista = document.querySelector('#lista');
  lista.innerHTML = '<p class="msg">$ cargando eventos...</p>';
  try {
    const res = activa === 'Todas'
      ? await getCatalogo('LISTADO')
      : await getCatalogo('FILTRO', { categoria: activa });
    lista.innerHTML = res.data.length
      ? `<div class="grid">${res.data.map(tarjeta).join('')}</div>`
      : '<p class="msg">// sin eventos en esta categoría</p>';
    lista.querySelectorAll(".card").forEach((c) => c.addEventListener("click", () => { location.hash = "#/evento/" + c.dataset.id; }));
  } catch (err) {
    lista.innerHTML = `<p class="msg error">✗ Error: ${esc(err.message)}</p>`;
  }
}

export function renderCatalogo(app) {
  shell(app);
  cargar();
}
