import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Statistic } from 'antd'
import { WifiOutlined, BookOutlined, SwapOutlined, TeamOutlined } from '@ant-design/icons'
import { getUsuarios, getLibros, esKioscoActivo } from '../../api/biblioteca'
import { escucharDatosActualizados } from '../../utils/refresco'

// El header con los accesos del sistema (Reportes, Registro manual, Gestión,
// interruptor del lector y Salir) vive ahora en App como componente global,
// fijo en todas las pantallas internas. Aquí solo queda el contenido propio
// de la pantalla de inicio.
function SistemaHome() {
  const navigate = useNavigate()
  const [pulso, setPulso] = useState(false)
  const [totalLibros, setTotalLibros] = useState(0)
  const [prestamosActivos, setPrestamosActivos] = useState(0)
  const [totalUsuarios, setTotalUsuarios] = useState(0)
  const [kiosco, setKiosco] = useState(esKioscoActivo())

  useEffect(() => {
    const t = setInterval(() => setPulso(p => !p), 1500)
    return () => clearInterval(t)
  }, [])

  // El interruptor del lector vive en el header, pero el mensaje del hero
  // debe reflejar su estado: se escucha el aviso que emite al cambiar.
  useEffect(() => {
    const actualizar = () => setKiosco(esKioscoActivo())
    window.addEventListener('kiosco-cambiado', actualizar)
    window.addEventListener('storage', actualizar)
    return () => {
      window.removeEventListener('kiosco-cambiado', actualizar)
      window.removeEventListener('storage', actualizar)
    }
  }, [])

  const cargarContadores = () => {
    getLibros().then(libros => {
      setTotalLibros(libros.reduce((a: number, b: any) => a + b.totalEjemplares, 0))
    })
    getUsuarios().then(data => {
      const todos = data.filter((d: any) => d.rol === 'usuario')
      setTotalUsuarios(todos.length)
      const total = todos.reduce((a: number, d: any) => a + d.prestamosActivos, 0)
      setPrestamosActivos(total)
    })
  }

  useEffect(() => { cargarContadores() }, [])

  // Se recarga cuando se completa un registro en cualquier parte del sistema
  useEffect(() => escucharDatosActualizados(cargarContadores), [])

  return (
    <div className="home-page">
      <div className="home-hero">
        <div className="hero-left">
          <div className="hero-badge">
            <WifiOutlined /> {kiosco ? 'Esperando tarjeta RFID' : 'Lector RFID desactivado en este dispositivo'}
          </div>
          <h1 className="hero-title">
            Sistema de<br /><span>Gestión</span><br />Bibliotecaria
          </h1>
          <p className="hero-subtitle">
            {kiosco
              ? 'Acerque su tarjeta RFID al lector para registrar préstamos, devoluciones y uso de sala.'
              : 'Active el interruptor "Lector RFID" del encabezado para que este dispositivo reciba los escaneos.'}
          </p>
        </div>
        <div className="hero-right">
          <div className="blob-container">
            <div className="blob blob-1" /><div className="blob blob-2" /><div className="blob blob-3" />
            <div className="blob-shine" />
            <div className="radar-container">
              <div className={`radar-ring ring-1 ${pulso && kiosco ? 'pulso' : ''}`} />
              <div className={`radar-ring ring-2 ${pulso && kiosco ? 'pulso' : ''}`} />
              <div className={`radar-ring ring-3 ${pulso && kiosco ? 'pulso' : ''}`} />
              <div className="radar-center">
                <WifiOutlined style={{ fontSize: 24, color: '#fff' }} />
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="stats-row">
        <div className="stat-glass" style={{ cursor: 'pointer' }} onClick={() => navigate('/sistema/gestion/libros')}>
          <BookOutlined style={{ fontSize: 20, color: '#00796B', marginBottom: 8 }} />
          <Statistic title="Libros registrados" value={totalLibros}
            valueStyle={{ color: '#1A2332', fontSize: 32, fontWeight: 800 }} />
        </div>
        <div className="stat-glass" style={{ cursor: 'pointer' }} onClick={() => navigate('/sistema/reportes?tab=prestamos')}>
          <SwapOutlined style={{ fontSize: 20, color: '#00796B', marginBottom: 8 }} />
          <Statistic title="Préstamos activos" value={prestamosActivos}
            valueStyle={{ color: '#1A2332', fontSize: 32, fontWeight: 800 }} />
        </div>
        <div className="stat-glass" style={{ cursor: 'pointer' }} onClick={() => navigate('/sistema/gestion/usuarios')}>
          <TeamOutlined style={{ fontSize: 20, color: '#00796B', marginBottom: 8 }} />
          <Statistic title="Usuarios registrados" value={totalUsuarios}
            valueStyle={{ color: '#1A2332', fontSize: 32, fontWeight: 800 }} />
        </div>
      </div>
    </div>
  )
}

export default SistemaHome