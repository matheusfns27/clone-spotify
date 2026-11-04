import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';
import { AppProvider } from './state/AppProvider';
import { PlayerProvider } from './state/PlayerProvider';
import './styles/base.css';
import './styles/layout.css';
import './styles/components.css';
import './styles/pages.css';

const root = document.getElementById('root');
if (!root) throw new Error('Elemento #root não encontrado.');

createRoot(root).render(
  <StrictMode>
    <AppProvider>
      <PlayerProvider>
        <App />
      </PlayerProvider>
    </AppProvider>
  </StrictMode>,
);
