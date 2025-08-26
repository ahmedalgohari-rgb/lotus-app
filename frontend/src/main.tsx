import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import App from './App.tsx'
import './index.css'

// Create React Query client with optimized settings for Egyptian mobile networks
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutes - optimize for slower connections
      cacheTime: 1000 * 60 * 30, // 30 minutes cache
      retry: 2, // Retry failed requests twice
      refetchOnWindowFocus: false, // Don't refetch on focus for mobile
      refetchOnReconnect: true, // Refetch when connection restored
    },
    mutations: {
      retry: 1, // Retry mutations once on failure
    },
  },
})

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <App />
      </BrowserRouter>
    </QueryClientProvider>
  </React.StrictMode>,
)