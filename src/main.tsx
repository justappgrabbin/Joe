import React from 'react';
import { createRoot } from 'react-dom/client';
import MorphSubstrate from './MorphSubstrate';
import './styles.css';

const root = document.getElementById('root');

if (!root) {
  throw new Error('Root element not found');
}

createRoot(root).render(
  <React.StrictMode>
    <MorphSubstrate />
  </React.StrictMode>
);
