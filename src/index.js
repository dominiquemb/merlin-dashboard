import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';
import reportWebVitals from './reportWebVitals';

console.log('[index.js] Initializing React app, URL:', window.location.href);

const rootElement = document.getElementById('root');
if (!rootElement) {
  console.error('[index.js] Root element not found!');
  throw new Error('Root element not found');
}

console.log('[index.js] Root element found, creating root');
const root = ReactDOM.createRoot(rootElement);

console.log('[index.js] Rendering App');
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
console.log('[index.js] App rendered');

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
reportWebVitals();
