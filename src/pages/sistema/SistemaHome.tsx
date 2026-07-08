import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Button, Statistic, Modal, Input, Empty } from 'antd'
import {
  WifiOutlined, BookOutlined, SwapOutlined, TeamOutlined,
  ClockCircleOutlined, LogoutOutlined, BarChartOutlined, SettingOutlined, SearchOutlined,
} from '@ant-design/icons'
import Logo from '../../components/Logo'
import { getDocentes, getLibros } from '../../api/biblioteca'

function SistemaHome({ onDetectado }: { onDetectado: (docente: any) => void }) {
  const navigate = useNavigate()
  const [hora, setHora] = useState(new Date())
  const [pulso, setPulso] = useState(false)
  const [totalLibros, setTotalLibros] = useState(0)
  const [prestamosActivos, setPrestamosActivos] = useState(0)
  const [totalDocentes, setTotalDocentes] = useState(0)
  const [docentes, setDocentes] = useState<any[]>([])
  const [modalManual, setModalManual] = useState(false)
  const [busquedaManual, setBusquedaManual] = useState('')

  useEffect(() => {
    const t = setInterval(() => setHora(new Date()), 1000)
    return () => clearInterval(t)
  }, [])

  useEffect(() => {
    const t = setInterval(() => setPulso(p => !p), 1500)
    return () => clearInterval(t)
  }, [])

  useEffect(() => {
    getLibros().then(libros => {
      setTotalLibros(libros.reduce((a: number, b: any) => a + b.totalEjemplares, 0))
    })
    getDocentes().then(data => {
      const soloDocentes = data.filter((d: any) => d.rol === 'usuario')
      setDocentes(soloDocentes)
      setTotalDocentes(soloDocentes.length)
      const total = soloDocentes.reduce((a: number, d: any) => a + d.prestamosActivos, 0)
      setPrestamosActivos(total)
    })
  }, [])

  const docentesFiltrados = docentes.filter((d: any) =>
    d.nombre?.toLowerCase().includes(busquedaManual.toLowerCase()),
  )

  const seleccionarManual = (docente: any) => {
    setModalManual(false)
    setBusquedaManual('')
    onDetectado(docente)
  }

  const handleLogout = () => {
    localStorage.removeItem('biblioteca_token')
    localStorage.removeItem('biblioteca_usuario')
    navigate('/')
  }

  return (
    <div className="home-page">
      <div className="home-header">
        <div className="home-header-left"><Logo /></div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <div className="home-clock">
            <ClockCircleOutlined style={{ marginRight: 6 }} />
            {hora.toLocaleTimeString('es-EC')}
          </div>
          <Button onClick={() => navigate('/sistema/reportes')} icon={<BarChartOutlined />} className="btn-reportes">
            Reportes
          </Button>
          <Button onClick={() => setModalManual(true)} icon={<TeamOutlined />} className="btn-reportes">
            Registrar
          </Button>
          <Button onClick={handleLogout} icon={<LogoutOutlined />} className="btn-salir">
            Salir
          </Button>
          <Button onClick={() => navigate('/sistema/gestion')} icon={<SettingOutlined />} className="btn-reportes">
            Gestión
          </Button>
        </div>
      </div>

      <div className="home-hero">
        <div className="hero-left">
          <div className="hero-badge"><WifiOutlined /> Esperando tarjeta RFID</div>
          <h1 className="hero-title">
            Sistema de<br /><span>Gestión</span><br />Bibliotecaria
          </h1>
          <p className="hero-subtitle">
            Acerque su tarjeta RFID al lector para registrar préstamos, devoluciones y uso de sala.
          </p>
        </div>
        <div className="hero-right">
          <div className="blob-container">
            <div className="blob blob-1" /><div className="blob blob-2" /><div className="blob blob-3" />
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
        <div className="stat-glass" style={{ cursor: 'pointer' }} onClick={() => navigate('/sistema/gestion/docentes')}>
          <SwapOutlined style={{ fontSize: 20, color: '#00796B', marginBottom: 8 }} />
          <Statistic title="Docentes registrados" value={totalDocentes}
            valueStyle={{ color: '#1A2332', fontSize: 32, fontWeight: 800 }} />
        </div>
      </div>

      <Modal
        title="Registrar manualmente"
        open={modalManual}
        onCancel={() => { setModalManual(false); setBusquedaManual('') }}
        footer={null}
        destroyOnClose
      >
        <Input
          placeholder="Buscar docente por nombre..."
          prefix={<SearchOutlined style={{ color: '#9CA3AF' }} />}
          value={busquedaManual}
          onChange={e => setBusquedaManual(e.target.value)}
          size="large"
          autoFocus
          allowClear
          style={{ marginBottom: 16 }}
        />
        {docentesFiltrados.length === 0 ? (
          <Empty description="No se encontraron docentes" />
        ) : (
          <div style={{ maxHeight: 360, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 8 }}>
            {docentesFiltrados.map((docente: any) => (
              <button
                key={docente.id}
                className="opcion-btn"
                onClick={() => seleccionarManual(docente)}
                style={{ textAlign: 'left' }}
              >
                <span style={{
                  width: 40, height: 40, borderRadius: '50%',
                  background: 'linear-gradient(135deg, #00695C, #00897B)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  color: '#fff', fontSize: 14, fontWeight: 700, flexShrink: 0,
                }}>
                  {docente.iniciales}
                </span>
                <span>
                  <span className="opcion-titulo">{docente.nombre}</span>
                  <span className="opcion-desc">
                    {docente.carreras?.map((dc: any) => dc.carrera?.nombre).filter(Boolean).join(' · ') || 'Sin carrera asignada'}
                  </span>
                </span>
              </button>
            ))}
          </div>
        )}
      </Modal>
    </div>
  )
}

export default SistemaHome