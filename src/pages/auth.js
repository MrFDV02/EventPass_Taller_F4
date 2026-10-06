import { login, registrar } from '../js/api.js';
import { guardarSesion } from '../js/session.js';

export function renderAuth(app, modo) {
  const reg = modo === 'registro';
  app.innerHTML = `
    <div class="auth">
      <p class="eyebrow">// ${reg ? 'REGISTRO' : 'LOGIN'}</p>
      <h1>${reg ? 'Crear cuenta' : 'Iniciar sesión'}</h1>
      <form id="f" class="form">
        ${reg ? '<label>Nombre<input name="nombre" required /></label>' : ''}
        <label>Email<input name="email" type="email" required /></label>
        <label>Password<input name="password" type="password" minlength="8" required /></label>
        <button class="btn" type="submit">${reg ? 'Crear cuenta' : 'Entrar'}</button>
        <p id="estado" class="msg"></p>
      </form>
      <p class="alt">
        ${reg ? '¿Ya tienes cuenta? <a href="#/login">Inicia sesión</a>'
              : '¿No tienes cuenta? <a href="#/registro">Regístrate</a>'}
      </p>
    </div>`;

  const f = app.querySelector('#f');
  const estado = app.querySelector('#estado');
  const btn = f.querySelector('button');

  f.addEventListener('submit', async (ev) => {
    ev.preventDefault();
    const d = Object.fromEntries(new FormData(f));
    btn.disabled = true;
    estado.className = 'msg';
    estado.textContent = '$ procesando...';
    try {
      if (reg) {
        await registrar(d.nombre, d.email, d.password);
        estado.textContent = '✓ Cuenta creada, iniciando sesión...';
      }
      const res = await login(d.email, d.password);
      guardarSesion(res);
      estado.className = 'msg ok';
      estado.textContent = `✓ Bienvenido, ${res.nombre}`;
      setTimeout(() => { location.hash = '#/'; }, 600);
    } catch (err) {
      estado.className = 'msg error';
      estado.textContent = `✗ ${err.message}`;
      btn.disabled = false;
    }
  });
}
