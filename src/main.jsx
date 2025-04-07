import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import './index.css' // Ensure Tailwind styles are imported
import { Toaster } from "@/components/ui/toaster" // Import Toaster

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
    <Toaster /> {/* Add Toaster here */}
  </React.StrictMode>,
)
