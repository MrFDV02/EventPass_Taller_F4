# Arquitectura de EventPass

    Aplicación pública en Vercel
            ↓ HTTP / Chat
           n8n
            ↓
    Reglas del negocio
            ↓
    Google Sheets
            ↓
    Gmail / Telegram / IA

## Comunicación frontend → n8n

- El frontend (`src/js/api.js`) hace `POST` a los webhooks de n8n y agrega el `session_token` guardado en `localStorage`.
- El asistente usa el Chat Trigger de WF10 mediante `@n8n/chat`.
- El frontend nunca lee ni escribe en Google Sheets.
- Los webhooks y el Chat Trigger solo aceptan el origen de Vercel (CORS).

## Flujo de una inscripción

1. WF06 valida sesión, usuario `ACTIVO`, Telegram vinculado, evento `PUBLICADO` y que no exista otra inscripción activa del mismo usuario.
2. Calcula cupos (capacidad menos inscripciones `CONFIRMADA`) y guarda la inscripción como `CONFIRMADA` o `LISTA_ESPERA`.
3. Registra en EP06_Inscripciones, incluida la auditoría.
4. Llama a WF09, que notifica por Gmail y Telegram y registra cada canal por separado en EP09_Notificaciones.
5. Si se libera un cupo, WF07 promueve a quienes esperan por `fecha_inscripcion` ascendente, registra en EP07_Reasignaciones y notifica con WF09.
6. WF08 envía recordatorios a inscripciones `CONFIRMADA`, con la clave `usuario_evento_tipo` para no repetirlos.

## Hojas de Google Sheets

El detalle de cada archivo (EP01 a EP10) está en el README.
