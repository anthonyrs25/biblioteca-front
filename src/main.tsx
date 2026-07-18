import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import dayjs from 'dayjs'
import 'dayjs/locale/es'
import 'antd/dist/reset.css'
import './index.css'
import App from './App.tsx'

// Sin esto, dayjs muestra los meses en inglés ("July" en vez de "julio")
// en cualquier .format() que use "MMMM" — afecta el selector de mes de
// Reportes y la fecha de devolución en Préstamo.
dayjs.locale('es')

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)