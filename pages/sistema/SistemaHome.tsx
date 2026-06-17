import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Button, Statistic, Badge, App } from 'antd'
import {
  WifiOutlined,
  BookOutlined,
  TeamOutlined,
  SwapOutlined,
  ClockCircleOutlined,
  LogoutOutlined,
  BarChartOutlined,
} from '@ant-design/icons'
import Logo from '../../components/Logo'
import { docentes } from '../../data/docentes'
import { libros } from '../../data/libros'
import type { Docente } from '../../data/docentes'

interface Props {
  onDocenteDetectado: (docente: Docente) => void
}

const actividadReciente = [
  { id: 1, tipo: 'prestamo', docente: 'Ing. Paul Tigre', libro: 'Clean Code', hora: '09:14', color: '#0094A2' },
  { id: 2, tipo: 'uso', docente: 'Ing. Paul Tigre', hora: '08:30', color: '#5B5FE3' },
]

function SistemaHome({ onDocenteDetectado }: Props) {
  const navigate = useNavigate()
  const { message } = App.useApp()
  const [hora, setHora] = useState(new Date())
  const [pulso, setPulso] = useState(false)

  useEffect(() => {
    const t = setInterval(() => setHora(new Date()), 1000)
    return () => clearInterval(t)
  }, [])

  useEffect(() => {
    const t = setInterval(() => setPulso(p => !p), 1500)
    return () => clearInterval(t)
  }, [])

  const simularRFID = () => {
    const docente = docentes[Math.floor(Math.random() * docentes.length)]
    onDocenteDetectado(docente)
    message.success(`Tarjeta detectada: ${docente.nombre}`)
    setTimeout(() => navigate('/sistema/docente'), 800)
  }

  const handleLogout = () => {
    localStorage.removeItem('biblioteca_auth')
    navigate('/')
  }

  const totalLibros = libros.reduce((a, b) => a + b.totalEjemplares, 0)
  const prestamosActivos = docentes.reduce((a, b) => a + b.prestamosActivos, 0)

  return (
    <div className="home-page">
      <div className="home-header">
        <div className="home-header-left">
          <Logo />
          <Badge status="processing" color="#0094A2"
            text={<span style={{ color: '#6b7280', fontSize: 13 }}>Sistema activo</span>}
          />
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div className="home-clock">
            <ClockCircleOutlined style={{ marginRight: 6 }} />
            {hora.toLocaleTimeString('es-EC')}
          </div>
          <Button
            onClick={() => navigate('/sistema/reportes')}
            icon={<BarChartOutlined />}
            className="btn-reportes"
          >
            Reportes
          </Button>
          <Button
            onClick={handleLogout}
            icon={<LogoutOutlined />}
            className="btn-salir"
          >
            Salir
          </Button>
        </div>
      </div>

      <div className="home-hero">
        <div className="hero-left">
          <div className="hero-badge">
            <WifiOutlined /> Esperando tarjeta RFID
          </div>
          <h1 className="hero-title">
            Sistema de<br />
            <span>Gestión</span><br />
            Bibliotecaria
          </h1>
          <p className="hero-subtitle">
            Acerque su tarjeta RFID al lector para registrar
            préstamos, devoluciones y uso de sala.
          </p>
          <Button className="btn-rfid" onClick={simularRFID} size="large">
            <WifiOutlined /> Simular lectura RFID
          </Button>
        </div>
        <div className="hero-right">
          <div className="blob-container">
            <div className="blob blob-1" />
            <div className="blob blob-2" />
            <div className="blob blob-3" />
            <div className="blob-shine" />
            <div className="radar-container">
              <div className={`radar-ring ring-1 ${pulso ? 'pulso' : ''}`} />
              <div className={`radar-ring ring-2 ${pulso ? 'pulso' : ''}`} />
              <div className={`radar-ring ring-3 ${pulso ? 'pulso' : ''}`} />
              <div className="radar-center">
                <WifiOutlined style={{ fontSize: 24, color: '#fff' }} />
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="stats-row">
        <div className="stat-glass">
          <BookOutlined style={{ fontSize: 20, color: '#0094A2', marginBottom: 8 }} />
          <Statistic title="Libros registrados" value={totalLibros}
            valueStyle={{ color: '#1E2A38', fontSize: 32, fontWeight: 800 }} />
        </div>
        <div className="stat-glass">
          <SwapOutlined style={{ fontSize: 20, color: '#5B5FE3', marginBottom: 8 }} />
          <Statistic title="Préstamos activos" value={prestamosActivos}
            valueStyle={{ color: '#1E2A38', fontSize: 32, fontWeight: 800 }} />
        </div>
        <div className="stat-glass">
          <TeamOutlined style={{ fontSize: 20, color: '#FF6B35', marginBottom: 8 }} />
          <Statistic title="Docentes registrados" value={docentes.length}
            valueStyle={{ color: '#1E2A38', fontSize: 32, fontWeight: 800 }} />
        </div>
      </div>

      <div className="actividad-card">
        <div className="actividad-header">
          <span className="actividad-titulo">Actividad reciente</span>
          <Badge count="Hoy" style={{ background: 'rgba(0,148,162,0.12)', color: '#0094A2', boxShadow: 'none' }} />
        </div>
        <div className="actividad-lista">
          {actividadReciente.map(item => (
            <div key={item.id} className="actividad-item">
              <div className="actividad-dot" style={{ background: item.color }} />
              <div className="actividad-info">
                <span className="actividad-nombre">{item.docente}</span>
                {item.libro && <span className="actividad-libro"> — {item.libro}</span>}
              </div>
              <div className="actividad-right">
                <span className="actividad-tipo" style={{ color: item.color }}>
                  {item.tipo === 'prestamo' ? 'Préstamo' : 'Uso de sala'}
                </span>
                <span className="actividad-hora">{item.hora}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

export default SistemaHome
