import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';

// Safety check for fetch in environments where window.fetch is a getter only
// Must be global and before any Firebase imports
if (typeof window !== 'undefined') {
  try {
    const originalFetch = window.fetch;
    const proto = Object.getPrototypeOf(window);
    const desc = Object.getOwnPropertyDescriptor(proto, 'fetch') || Object.getOwnPropertyDescriptor(window, 'fetch');
    
    if (desc && (!desc.writable || !desc.set)) {
      // If it's a getter on the prototype or window, try to create a local writable property
      Object.defineProperty(window, 'fetch', {
        value: originalFetch,
        writable: true,
        configurable: true,
        enumerable: true
      });
    }
  } catch (e) {
    console.warn("Could not patch fetch decisively:", e);
    // Fallback: simple assignment in case it is actually writable but descriptor lied
    try { (window as any).fetch = window.fetch; } catch(err) {}
  }
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
