import { useState } from 'react'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { App as AntApp } from 'antd'
import Landing from './pages/Landing'
import Login from './pages/Login'
import SistemaHome from './pages/sistema/SistemaHome'
import Docente from './pages/sistema/Docente'
import UsoBiblioteca from './pages/sistema/UsoBiblioteca'
import Prestamo from './pages/sistema/Prestamo'
import Devolucion from './pages/sistema/Devolucion'
import ProtectedRoute from './components/ProtectedRoute'
import type { Docente as DocenteType } from './data/docentes'

function App() {
  const [docenteActivo, setDocenteActivo] = useState<DocenteType | null>(null)

  return (
    <AntApp>
      <BrowserRouter>
        <Routes>
          {/* PÚBLICA */}
          <Route path="/" element={<Landing />} />
          <Route path="/login" element={<Login />} />

          {/* PROTEGIDAS */}
          <Route path="/sistema" element={
            <ProtectedRoute>
              <SistemaHome onDocenteDetectado={setDocenteActivo} />
            </ProtectedRoute>
          } />
          <Route path="/sistema/docente" element={
            <ProtectedRoute>
              <Docente docente={docenteActivo} />
            </ProtectedRoute>
          } />
          <Route path="/sistema/uso-biblioteca" element={
            <ProtectedRoute>
              <UsoBiblioteca docente={docenteActivo} />
            </ProtectedRoute>
          } />
          <Route path="/sistema/prestamo" element={
            <ProtectedRoute>
              <Prestamo docente={docenteActivo} />
            </ProtectedRoute>
          } />
          <Route path="/sistema/devolucion" element={
            <ProtectedRoute>
              <Devolucion docente={docenteActivo} />
            </ProtectedRoute>
          } />
        </Routes>
      </BrowserRouter>
    </AntApp>
  )
}

export default App