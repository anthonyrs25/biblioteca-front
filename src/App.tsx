import { useState, useEffect } from 'react'
import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom'
import { App as AntApp, Modal } from 'antd'
import Landing from './pages/Landing'
import Login from './pages/Login'
import SistemaHome from './pages/sistema/SistemaHome'
import UsoBiblioteca from './pages/sistema/UsoBiblioteca'
import Prestamo from './pages/sistema/Prestamo'
import Devolucion from './pages/sistema/Devolucion'
import Reportes from './pages/sistema/Reportes'
import Gestion from './pages/sistema/Gestion'
import GestionLibros from './pages/sistema/GestionLibros'
import GestionDocentes from './pages/sistema/GestionDocentes'
import ProtectedRoute from './components/ProtectedRoute'
import api from './api/biblioteca'

function RfidPoller({ onDetectado }: { onDetectado: (docente: any) => void }) {
  const location = useLocation()

  useEffect(() => {
    if (!location.pathname.startsWith('/sistema')) return
    const token = localStorage.getItem('biblioteca_token')
    if (!token) return

    const poll = setInterval(async () => {
      try {
        const res = await api.get('/rfid/pendiente')
        const data = res.data
        if (data && data.usuario && data.usuario.id) {
          onDetectado(data.usuario)
        }
      } catch {
        // sin tarjeta pendiente, ignorar
      }
    }, 2000)

    return () => clearInterval(poll)
  }, [location.pathname])

  return null
}

function DocentePanel({ docente, onCerrar, onIr }: {
  docente: any
  onCerrar: () => void
  onIr: (vista: 'uso' | 'prestamo' | 'devolucion') => void
}) {
  const nombresCarreras = docente.carreras
    ?.map((dc: any) => dc.carrera?.nombre)
    .filter(Boolean)
    .join(' · ') || 'Sin carrera asignada'
  const prestamosActivos = docente.prestamosActivos ?? 0

  return (
    <div style={{ padding: 32 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 24 }}>
        <div style={{
          width: 64, height: 64, borderRadius: '50%',
          background: 'linear-gradient(135deg, #00695C, #00897B)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          color: '#fff', fontSize: 20, fontWeight: 700, flexShrink: 0,
        }}>
          {docente.iniciales}
        </div>
        <div>
          <div style={{ fontSize: 18, fontWeight: 700, color: '#1A2332' }}>{docente.nombre}</div>
          <div style={{ fontSize: 13, color: '#4A5568', marginTop: 2 }}>{nombresCarreras}</div>
        </div>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        <button className="opcion-btn" onClick={() => onIr('uso')}>
          <span style={{ fontSize: 24 }}>📖</span>
          <span>
            <span className="opcion-titulo">Uso de biblioteca</span>
            <span className="opcion-desc">Registrar permanencia en sala</span>
          </span>
        </button>
        <button className="opcion-btn" onClick={() => onIr('prestamo')}>
          <span style={{ fontSize: 24 }}>📚</span>
          <span>
            <span className="opcion-titulo">Préstamo de libro</span>
            <span className="opcion-desc">Buscar y solicitar un libro</span>
          </span>
        </button>
        {prestamosActivos > 0 && (
          <button className="opcion-btn" onClick={() => onIr('devolucion')}>
            <span style={{ fontSize: 24 }}>↩️</span>
            <span>
              <span className="opcion-titulo">Devolución de libro</span>
              <span className="opcion-desc">
                {prestamosActivos} préstamo{prestamosActivos > 1 ? 's' : ''} activo{prestamosActivos > 1 ? 's' : ''}
              </span>
            </span>
          </button>
        )}
        <button
          className="opcion-btn"
          onClick={onCerrar}
          style={{ borderColor: '#FECACA', background: '#FEF2F2' }}
        >
          <span style={{ fontSize: 24 }}>✕</span>
          <span>
            <span className="opcion-titulo" style={{ color: '#DC2626' }}>Cerrar</span>
            <span className="opcion-desc">Volver a lo que estaba haciendo</span>
          </span>
        </button>
      </div>
    </div>
  )
}

function App() {
  const [docenteActivo, setDocenteActivo] = useState<any | null>(null)
  const [modalAbierto, setModalAbierto] = useState(false)
  const [vista, setVista] = useState<'docente' | 'uso' | 'prestamo' | 'devolucion'>('docente')

  const handleDetectado = (docente: any) => {
    setDocenteActivo(docente)
    setVista('docente')
    setModalAbierto(true)
  }

  const cerrarModal = () => {
    setModalAbierto(false)
    setDocenteActivo(null)
    setVista('docente')
  }

  return (
    <AntApp>
      <div className="aurora-bg" />
      <BrowserRouter>
        <RfidPoller onDetectado={handleDetectado} />

        <Modal
          open={modalAbierto}
          onCancel={cerrarModal}
          footer={null}
          width={620}
          destroyOnClose
          centered
          styles={{ body: { padding: 0 } }}
        >
          {modalAbierto && docenteActivo && (
            <>
              {vista === 'docente' && (
                <DocentePanel
                  docente={docenteActivo}
                  onCerrar={cerrarModal}
                  onIr={setVista}
                />
              )}
              {vista === 'uso' && (
                <UsoBiblioteca
                  docente={docenteActivo}
                  onTerminar={cerrarModal}
                  enModal
                />
              )}
              {vista === 'prestamo' && (
                <Prestamo
                  docente={docenteActivo}
                  onTerminar={cerrarModal}
                  enModal
                />
              )}
              {vista === 'devolucion' && (
                <Devolucion
                  docente={docenteActivo}
                  onTerminar={cerrarModal}
                  enModal
                />
              )}
            </>
          )}
        </Modal>

        <Routes>
          <Route path="/" element={<Landing />} />
          <Route path="/login" element={<Login />} />
          <Route path="/sistema" element={
            <ProtectedRoute>
              <SistemaHome />
            </ProtectedRoute>
          } />
          <Route path="/sistema/reportes" element={
            <ProtectedRoute><Reportes /></ProtectedRoute>
          } />
          <Route path="/sistema/gestion" element={
            <ProtectedRoute><Gestion /></ProtectedRoute>
          } />
          <Route path="/sistema/gestion/libros" element={
            <ProtectedRoute><GestionLibros /></ProtectedRoute>
          } />
          <Route path="/sistema/gestion/docentes" element={
            <ProtectedRoute><GestionDocentes /></ProtectedRoute>
          } />
        </Routes>
      </BrowserRouter>
    </AntApp>
  )
}

export default App