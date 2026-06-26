import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { HelmetProvider } from 'react-helmet-async'
import App from './App.jsx'
import { AuthProvider } from './hooks/useAuth.jsx'
import { SSRDataContext } from './hooks/ssr-context'
import './index.css'

document.documentElement.classList.add('high-contrast')

// Pick up SSR data injected by the Pages Function
const ssrData = typeof window !== 'undefined' ? window.__SSR_DATA__ || null : null
// Clear it so client-side navigations don't reuse stale SSR data
if (ssrData) delete window.__SSR_DATA__

ReactDOM.hydrateRoot(
  document.getElementById('root'),
  React.createElement(
    HelmetProvider,
    null,
    React.createElement(
      SSRDataContext.Provider,
      { value: ssrData },
      React.createElement(
        BrowserRouter,
        null,
        React.createElement(
          AuthProvider,
          null,
          React.createElement(App),
        ),
      ),
    ),
  ),
)
