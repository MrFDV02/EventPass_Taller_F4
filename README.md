# EventPass

Plataforma de eventos de tecnología: catálogo público, registro y login de usuarios, inscripciones con lista de espera, notificaciones por correo y Telegram, y un asistente de IA informativo.

- **App en producción:** https://event-pass-taller-f4.vercel.app
- **Estudiante:** Nicolas Fandiño
- **Repositorio:** https://github.com/MrFDV02/EventPass_Taller_F4

## Tecnologías utilizadas

- Vite y JavaScript vanilla (frontend), desplegado en Vercel
- n8n en Docker, expuesto con ngrok
- Google Sheets (persistencia)
- Gmail y Telegram (notificaciones y vinculación)
- Groq como modelo de IA, con `@n8n/chat` en el frontend
- Git y GitHub

## Arquitectura

- **Frontend:** Vite + JavaScript vanilla, desplegado en Vercel. Nunca accede a Google Sheets: solo llama a webhooks de n8n.
- **Backend:** n8n (Docker) expuesto con ngrok. Toda la lógica de negocio vive en 10 workflows (WF01 a WF10).
- **Persistencia:** Google Sheets, un archivo por workflow (EP01 a EP10).
- **Notificaciones:** Gmail y Telegram (bot @MrfN8n_bot).
- **Asistente IA:** Chat Trigger de n8n con AI Agent y Groq como modelo.

## Workflows y triggers

| WF | Función | Trigger |
|----|---------|---------|
| WF01 | CRUD de usuarios (crear, perfil, actualizar, desactivar) | Webhook `POST /webhook/eventpass/usuarios` |
| WF02 | Autenticación (login, logout, validar sesión) | Webhook `POST /webhook/eventpass/auth` |
| WF03 | Vinculación de Telegram (código y comando `/vincular`) | Webhook `POST /webhook/eventpass/telegram/codigo` y Telegram Trigger |
| WF04 | CRUD de eventos (administración exclusiva desde n8n) | Form Trigger |
| WF05 | Catálogo público (listado, detalle, filtro) | Webhook `POST /webhook/eventpass/catalogo` |
| WF06 | CRUD de inscripciones (crear, consultar, actualizar, cancelar) | Webhook `POST /webhook/inscripciones` |
| WF07 | Reasignación de cupos desde la lista de espera | Schedule Trigger |
| WF08 | Recordatorios de eventos próximos | Schedule Trigger |
| WF09 | Notificaciones por Gmail y Telegram | When Executed by Another Workflow |
| WF10 | Asistente IA informativo | Chat Trigger |

Los workflows exportados están en la carpeta `n8n/`.

## Google Sheets

Un archivo por workflow. El frontend nunca los toca; solo n8n lee y escribe.

| Archivo | Workflow | Contenido |
|---------|----------|-----------|
| EP01_Usuarios | WF01 | Usuarios registrados |
| EP02_Sesiones | WF02 | Sesiones con token, estado (ACTIVA/CERRADA) y expiración |
| EP03_Telegram | WF03 | Códigos y vinculaciones de Telegram |
| EP04_Eventos | WF04 | Eventos, capacidad, categoría y estado |
| EP05_Catalogo_Log | WF05 | Registro de consultas al catálogo |
| EP06_Inscripciones | WF06 | Inscripciones y auditoría de inscripciones |
| EP07_Reasignaciones | WF07 | Registro de reasignaciones desde la lista de espera |
| EP08_Recordatorios | WF08 | Recordatorios enviados (evita duplicados) |
| EP09_Notificaciones | WF09 | Notificaciones enviadas por Gmail y Telegram |
| EP10_Soporte | WF10 | Conversaciones y mensajes del asistente |

## Endpoints

Todos son `POST` y se llaman sobre la URL base de n8n (`VITE_N8N_BASE_URL`). Salvo `crear`, `login` y el catálogo, requieren `session_token` en el body (el frontend lo agrega solo desde `localStorage`).

| Endpoint | Campo | Valores |
|----------|-------|---------|
| `/webhook/eventpass/usuarios` | `operacion` | `crear`, `perfil`, `actualizar`, `desactivar` |
| `/webhook/eventpass/auth` | `operacion` | `login`, `logout`, `validar` |
| `/webhook/eventpass/telegram/codigo` | solo `session_token` | genera el código de vinculación |
| `/webhook/eventpass/catalogo` | consulta | listado, detalle (devuelve objeto) y filtro (devuelve lista) |
| `/webhook/inscripciones` | `accion` | `CREAR`, `CONSULTAR`, `ACTUALIZAR`, `CANCELAR` |

`validar` responde `{ ok: true, usuario_id, nombre, expira_en }`, o `{ ok: false, error }` con código 401 si la sesión no es válida.

El chat del asistente usa el endpoint del Chat Trigger de WF10 (`VITE_N8N_CHAT_URL`).

CORS restringido al dominio de Vercel en todos los webhooks y en el Chat Trigger.

## Estados

- **Inscripciones:** `CONFIRMADA`, `LISTA_ESPERA`, `CANCELADA`.
- **Usuarios:** `ACTIVO`, `INACTIVO` (borrado lógico).
- **Eventos:** `BORRADOR`, `PUBLICADO`, `CERRADO`, `CANCELADO`. Solo los `PUBLICADO` aceptan inscripciones; si no hay cupos, la inscripción entra en `LISTA_ESPERA`.
- **Sesiones:** `ACTIVA`, `CERRADA`, `EXPIRADA`.

## Hashing de contraseñas

Las contraseñas nunca se guardan en texto plano. WF01 las procesa con PBKDF2 (SHA-512) y un salt, y en la hoja solo queda el hash.

## Sesiones

- `login` (WF02) crea una sesión en EP02_Sesiones y devuelve un `session_token`, que el frontend guarda en `localStorage`.
- Al abrir la app, el frontend llama a `validar`: si n8n responde que la sesión no es válida, se limpia y se redirige a `#/login`; si no hay red, se mantiene.
- WF01 exige `session_token` en toda operación excepto `crear`, y comprueba que la sesión esté `ACTIVA`, vigente y sea del mismo `usuario_id`; si no, responde 401.
- `logout` marca la sesión como `CERRADA`.

## Idempotencia

- WF06 bloquea inscripciones duplicadas del mismo usuario al mismo evento.
- WF08 registra cada recordatorio con la clave `usuario_evento_tipo`, así que una segunda ejecución no vuelve a enviarlo.

## Lista de espera

- Cupos disponibles = capacidad menos inscripciones `CONFIRMADA`.
- WF07 corre con un Schedule Trigger: calcula los cupos libres y promueve a `CONFIRMADA` a quienes están en `LISTA_ESPERA`, por orden de `fecha_inscripcion` (el más antiguo primero).
- Cada promoción se registra en EP07_Reasignaciones y se notifica por WF09.

## Notificaciones

WF09 recibe la orden desde otros workflows y envía el mensaje por Gmail y por Telegram. Cada canal tiene On Error Continue, así que si uno falla el otro sigue, y el resultado de cada envío queda en EP09_Notificaciones.

- WF06 notifica al crear y al cancelar una inscripción.
- WF07 notifica cuando alguien pasa de `LISTA_ESPERA` a `CONFIRMADA`.
- WF08 notifica los recordatorios de eventos próximos.

Para recibir Telegram, el usuario vincula su cuenta desde el perfil con un código (WF03) enviado al bot @MrfN8n_bot.

## Asistente IA y restricciones

WF10 es un Chat Trigger con un AI Agent (modelo Groq). Cada conversación y cada mensaje (rol `USER` y `ASSISTANT`) se guardan en EP10_Soporte, así que una conversación completa se reconstruye filtrando por `conversation_id`.

- Es **informativo**: solo tiene herramientas de lectura (Consultar eventos y Consultar inscripciones). No crea, modifica ni cancela nada.
- Responde en español y en texto simple, sin tablas.
- Se muestra en el frontend con `@n8n/chat`, en una ventana flotante.

## Variables de entorno

Copia `.env.example` a `.env` y completa:

```env
VITE_N8N_BASE_URL=https://tu-url-de-n8n
VITE_N8N_CHAT_URL=https://tu-url-de-n8n/webhook/<id>/chat
```

El `.env` y el `docker-compose.yml` (que contiene el token de ngrok) no se suben al repositorio.

## Cómo ejecutar

1. **n8n:** levantar los contenedores de n8n y ngrok, importar los JSON de `n8n/`, configurar tus credenciales (Google Sheets, Gmail, Telegram, Groq) y publicar los workflows.
2. **Frontend en local:**

```bash
npm install
cp .env.example .env
npm run dev
```

   Abre http://localhost:5173. Para que funcione contra n8n, agrega ese origen al CORS de los webhooks.
3. **Producción:** Vercel despliega desde `main` con las dos variables `VITE_` cargadas en Project Settings.
