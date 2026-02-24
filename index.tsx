
import * as React from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';

/**
 * Entry point for Gwapashop Admin Pro.
 * We mount into the #root element provided in index.html.
 * This ensures the Layout component handles all sidebar and header logic without duplication.
 */
const rootElement = document.getElementById('root');

if (!rootElement) {
  throw new Error("Failed to find the root element. Ensure index.html contains <div id='root'></div>");
}

const root = createRoot(rootElement);
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
