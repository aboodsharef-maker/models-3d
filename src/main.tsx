import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import '@fontsource/tajawal/400.css';import '@fontsource/tajawal/500.css';import '@fontsource/tajawal/700.css';import '@fontsource/tajawal/800.css';
import '@fontsource/cairo/400.css';import '@fontsource/cairo/700.css';import '@fontsource/amiri/400.css';
import App from './App';import './style.css';import './pages.css';import './editor.css';import './responsive.css';import './faith.css';
createRoot(document.getElementById('root')!).render(<StrictMode><App/></StrictMode>);
