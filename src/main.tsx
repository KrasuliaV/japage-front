import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App'

window.addEventListener('unhandledrejection', (event) => {
  console.error('[Global Promise Rejection]:', event.reason);
  // If you have a toast library like sonner or react-hot-toast:
  // toast.error("A background task failed. Please check your connection.");
});

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
