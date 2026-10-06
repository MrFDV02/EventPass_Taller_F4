import './css/style.css';
import { renderCatalogo } from './pages/catalogo.js';
import { renderAuth } from './pages/auth.js';
import { renderPerfil } from './pages/perfil.js';
import { renderEvento } from './pages/evento.js';
import { renderInscripciones } from './pages/inscripciones.js';
import { initChat } from './js/chat.js';
import { haySesion, usuarioActual, limpiarSesion } from './js/session.js';
import { logout, validarSesion } from './js/api.js';

const app = document.querySelector('#app');
const nav = document.querySelector('#nav');
const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

function renderNav(ruta) {
  if (haySesion()) {
    nav.innerHTML = `
      <a href="#/" class="${ruta === '#/' ? 'active' : ''}">Eventos</a>
      <a href="#/inscripciones">Mis inscripciones</a>
      <a href="#/perfil" class="user">${esc(usuarioActual().nombre)}</a>
      <button id="salir" class="link">Salir</button>`;
    nav.querySelector('#salir').addEventListener('click', async () => {
      try { await logout(); } catch { /* si falla igual cerramos local */ }
      limpiarSesion();
      location.hash = '#/';
      route();
    });
  } else {
    nav.innerHTML = `
      <a href="#/" class="${ruta === '#/' ? 'active' : ''}">Eventos</a>
      <a href="#/login" class="${ruta === '#/login' ? 'active' : ''}">Iniciar sesión</a>
      <a href="#/registro" class="btn-sm">Crear cuenta</a>`;
  }
}

function route() {
  const ruta = location.hash || '#/';
  renderNav(ruta);
  if (ruta === '#/login') renderAuth(app, 'login');
  else if (ruta === '#/registro') renderAuth(app, 'registro');
  else if (ruta === '#/perfil') renderPerfil(app);
  else if (ruta === '#/inscripciones') renderInscripciones(app);
  else if (ruta.startsWith('#/evento/')) renderEvento(app, decodeURIComponent(ruta.split('/')[2]));
  else renderCatalogo(app);
}

window.addEventListener('hashchange', route);
initChat();
async function iniciar() {
  if (haySesion()) {
    try {
      await validarSesion();
    } catch (e) {
      if (!(e instanceof TypeError)) {
        limpiarSesion();
        location.hash = '#/login';
      }
    }
  }
  route();
}

iniciar();
