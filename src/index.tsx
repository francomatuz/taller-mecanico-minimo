import React from 'react';
import ReactDOM from 'react-dom/client';
import CssBaseline from '@mui/material/CssBaseline';
import App from './App';
import { AppThemeProvider } from './contexts/ThemeContext';
import './index.css';

const root = ReactDOM.createRoot(
  document.getElementById('root') as HTMLElement
);

root.render(
  <React.StrictMode>
    <AppThemeProvider>
      <CssBaseline />
      <App />
    </AppThemeProvider>
  </React.StrictMode>
);
