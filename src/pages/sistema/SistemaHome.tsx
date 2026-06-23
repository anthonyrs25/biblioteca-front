import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Button, Statistic, App } from 'antd'
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
import { getDocentes, getLibros } from '../../api/biblioteca'

interface Props {
  onDocenteDetectado: (docente: any) => void
}

function SistemaHome({ onDocenteDetectado }: Props) {
  const navigate = useNavigate()
  const { message } = App.useApp()
  const [hora, setHora] = useState(new Date())
  const [pulso, setPulso] = useState(false)
  const [totalLibros, setTotalLibros] = useState(0)
  const [docentesCount, setDocentesCount] = useState(0)
  const [prestamosActivos, setPrestamosActivos] = useState(0)

  useEffect(() => {
    const t = setInterval(() => setHora(new Date()), 1000)
    return () => clearInterval(t)
  }, [])

  useEffect(() => {
    const t = setInterval(() => setPulso(p => !p), 1500)
    return () => clearInterval(t)
  }, [])

  // Cargar estadísticas reales del backend al entrar
  useEffect(() => {
    getLibros().then(libros => {
      setTotalLibros(libros.reduce((a: number, b: any) => a + b.totalEjemplares, 0))
    })
    getDocentes().then(docentes => {
      setDocentesCount(docentes.length)
      const totalPrestamos = docentes.reduce((a: number, d: any) => a + d.prestamosActivos, 0)
      setPrestamosActivos(totalPrestamos)
    })
  }, [])

  const simularRFID = async () => {
    try {
      const docentes = await getDocentes()
      if (docentes.length === 0) {
        message.error('No hay docentes registrados todavía')
        return
      }
      const aleatorio = docentes[Math.floor(Math.random() * docentes.length)]
      onDocenteDetectado(aleatorio)
      message.success(`Tarjeta detectada: ${aleatorio.nombre}`)
      setTimeout(() => navigate('/sistema/docente'), 800)
    } catch (err) {
      message.error('Error al conectar con el backend')
    }
  }

  const handleLogout = () => {
    localStorage.removeItem('biblioteca_auth')
    navigate('/')
  }

  return (
    <div className="home-page">
      <div className="home-header">
        <div className="home-header-left">
          <Logo />
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <div className="home-clock">
            <ClockCircleOutlined style={{ marginRight: 6 }} />
            {hora.toLocaleTimeString('es-EC')}
          </div>
          <Button onClick={() => navigate('/sistema/reportes')} icon={<BarChartOutlined />} className="btn-reportes">
            Reportes
          </Button>
          <Button onClick={handleLogout} icon={<LogoutOutlined />} className="btn-salir">
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
          <BookOutlined style={{ fontSize: 20, color: '#0d9488', marginBottom: 8 }} />
          <Statistic title="Libros registrados" value={totalLibros}
            valueStyle={{ color: '#0f172a', fontSize: 32, fontWeight: 800 }} />
        </div>
        <div className="stat-glass">
          <SwapOutlined style={{ fontSize: 20, color: '#0ea5e9', marginBottom: 8 }} />
          <Statistic title="Préstamos activos" value={prestamosActivos}
            valueStyle={{ color: '#0f172a', fontSize: 32, fontWeight: 800 }} />
        </div>
        <div className="stat-glass">
          <TeamOutlined style={{ fontSize: 20, color: '#8b5cf6', marginBottom: 8 }} />
          <Statistic title="Docentes registrados" value={docentesCount}
            valueStyle={{ color: '#0f172a', fontSize: 32, fontWeight: 800 }} />
        </div>
      </div>
    </div>
  )
}

export default SistemaHome