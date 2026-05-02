import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { Toaster } from 'react-hot-toast'
import App from './App'
import { ErrorBoundary } from './components/ErrorBoundary'
import './index.css'
import './i18n'

const qc = new QueryClient({ defaultOptions: { queries: { retry: 1, staleTime: 30000 } } })

ReactDOM.createRoot(document.getElementById('root')!).render(
  <ErrorBoundary>
    <QueryClientProvider client={qc}>
      <BrowserRouter>
        <App/>
        <Toaster
          position="top-center"
          toastOptions={{
            duration: 3000,
            style: {
              background: '#161630',
              color: '#fff',
              border: '1px solid rgba(255,255,255,0.08)',
              borderRadius: '14px',
              fontSize: '14px',
              fontWeight: '600',
              padding: '12px 16px',
              boxShadow: '0 8px 32px rgba(0,0,0,0.5)',
            },
            success: { iconTheme: { primary: '#06d6a0', secondary: '#fff' } },
            error:   { iconTheme: { primary: '#e63946', secondary: '#fff' } },
          }}
        />
      </BrowserRouter>
    </QueryClientProvider>
  </ErrorBoundary>
)
