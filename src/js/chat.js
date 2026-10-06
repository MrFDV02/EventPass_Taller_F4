import '@n8n/chat/style.css';
import { createChat } from '@n8n/chat';

let iniciado = false;

export function initChat() {
  if (iniciado) return;
  iniciado = true;

  createChat({
    webhookUrl: import.meta.env.VITE_N8N_CHAT_URL,
    mode: 'window',
    showWelcomeScreen: false,
    initialMessages: ['Hola, soy el asistente de EventPass. Te ayudo con eventos, fechas, lugares, lista de espera y el estado de tus inscripciones. ¿Qué necesitas?'],
    defaultLanguage: 'es',
    webhookConfig: {
      headers: { 'ngrok-skip-browser-warning': 'true' },
    },
    i18n: {
      es: {
        title: 'Asistente EventPass',
        subtitle: 'Eventos, fechas, lugares e inscripciones',
        footer: '',
        getStarted: 'Nueva conversación',
        inputPlaceholder: 'Escribe tu pregunta...',
        closeButtonTooltip: 'Cerrar',
      },
    },
  });
}
