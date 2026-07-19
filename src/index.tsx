import React from 'react';
import ReactDOM from 'react-dom/client';
import { R3V4Plugin } from './ui/R3V4Plugin';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <div style={{ minHeight: '100vh', background: '#000', padding: 20 }}>
      <R3V4Plugin />
    </div>
  </React.StrictMode>
);
