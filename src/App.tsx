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
import Reportes from './pages/sistema/Reportes'
import Gestion from './pages/sistema/Gestion'
import GestionLibros from './pages/sistema/GestionLibros'
import GestionDocentes from './pages/sistema/GestionDocentes'
import ProtectedRoute from './components/ProtectedRoute'

function App() {
  const [docenteActivo, setDocenteActivo] = useState<any | null>(null)

  return (
    <AntApp>
      <div className="aurora-bg" />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Landing />} />
          <Route path="/login" element={<Login />} />
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
          <Route path="/sistema/reportes" element={
            <ProtectedRoute>
              <Reportes />
            </ProtectedRoute>
          } />
          <Route path="/sistema/gestion" element={
            <ProtectedRoute>
              <Gestion />
            </ProtectedRoute>
          } />
          <Route path="/sistema/gestion/libros" element={
            <ProtectedRoute>
              <GestionLibros />
            </ProtectedRoute>
          } />
          <Route path="/sistema/gestion/docentes" element={
            <ProtectedRoute>
              <GestionDocentes />
            </ProtectedRoute>
          } />
        </Routes>
      </BrowserRouter>
    </AntApp>
  )
}

export default App