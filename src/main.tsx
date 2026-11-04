import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';
import ThemeGallery from './ThemeGallery';
import FontGallery from './FontGallery';

const view = new URLSearchParams(location.search).get('view');
createRoot(document.getElementById('root')!).render(<StrictMode>{view === 'themes' ? <ThemeGallery /> : view === 'fonts' ? <FontGallery /> : <App />}</StrictMode>);
