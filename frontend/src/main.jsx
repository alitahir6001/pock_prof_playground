import React from 'react';
import { createRoot } from 'react-dom/client';
import { App } from './App';
import './styles.css';

// Dev-only request tracing for the local code-visualizer; a no-op when it isn't running.
if (import.meta.env.DEV) {
  import(/* @vite-ignore */ 'http://localhost:4318/attach.js?service=pocket-professor-web&propagate=http://localhost:3040').catch(() => {});
}

createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
