import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from '@/App';
import { ToastProvider } from '@/components/ui/ToastProvider';
import './index.css';

// Captura o evento de instalação PWA o mais cedo possível,
// antes do React montar — assim não perdemos o evento.
window.addEventListener('beforeinstallprompt', (e) => {
  e.preventDefault();
  (window as any).__pwaInstallPrompt = e;
  window.dispatchEvent(new Event('pwaInstallReady'));
});

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ToastProvider>
      <App />
    </ToastProvider>
  </StrictMode>,
);
