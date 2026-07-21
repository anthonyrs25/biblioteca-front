import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Button, Statistic, Switch, Tag } from 'antd'
import {
  WifiOutlined, BookOutlined, SwapOutlined, TeamOutlined,
  LogoutOutlined, BarChartOutlined, SettingOutlined, CrownOutlined,
} from '@ant-design/icons'
import Logo from '../../components/Logo'
import { getUsuarios, getLibros, esKioscoActivo, setKioscoActivo } from '../../api/biblioteca'
import { useModo } from '../../context/ModoContext'
import { escucharDatosActualizados } from '../../utils/refresco'

interface Props {
  onAbrirRegistroManual: () => void
}

function SistemaHome({ onAbrirRegistroManual }: Props) {
  const navigate = useNavigate()
  const { esAdmin, modoAdminActivo, activarModoAdmin, volverAModoBibliotecario } = useModo()
  const [pulso, setPulso] = useState(false)
  const [totalLibros, setTotalLibros] = useState(0)
  const [prestamosActivos, setPrestamosActivos] = useState(0)
  const [totalUsuarios, setTotalUsuarios] = useState(0)
  const [kiosco, setKiosco] = useState(esKioscoActivo())

  const cambiarKiosco = (activo: boolean) => {
    setKioscoActivo(activo)
    setKiosco(activo)
  }

  useEffect(() => {
    const t = setInterval(() => setPulso(p => !p), 1500)
    return () => clearInterval(t)
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

  const handleLogout = () => {
    localStorage.removeItem('biblioteca_token')
    localStorage.removeItem('biblioteca_usuario')
    navigate('/')
  }

  return (
    <div className="home-page">
      <div className="home-header">
        <div className="home-header-left"><Logo /></div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16, flex: 1 }}>
          {esAdmin && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, background: modoAdminActivo ? '#FEF3C7' : '#F5F7FA', padding: '6px 12px', borderRadius: 10 }}>
              <Tag color={modoAdminActivo ? 'gold' : 'default'} style={{ margin: 0 }}>
                {modoAdminActivo ? <><CrownOutlined /> Administrador</> : 'Bibliotecario'}
              </Tag>
              <Switch
                checked={modoAdminActivo}
                onChange={checked => checked ? activarModoAdmin() : volverAModoBibliotecario()}
                size="small"
              />
            </div>
          )}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, background: kiosco ? '#E0F2F1' : '#F5F7FA', padding: '6px 12px', borderRadius: 10 }}>
            <Tag color={kiosco ? 'cyan' : 'default'} style={{ margin: 0 }}>
              <WifiOutlined style={{ marginRight: 4 }} />
              Lector RFID
            </Tag>
            <Switch checked={kiosco} onChange={cambiarKiosco} size="small" />
          </div>
          <Button onClick={() => navigate('/sistema/reportes')} icon={<BarChartOutlined />} className="btn-reportes">
            Reportes
          </Button>
          <Button onClick={onAbrirRegistroManual} icon={<TeamOutlined />} className="btn-reportes">
            Registro manual
          </Button>
          <Button onClick={() => navigate('/sistema/gestion')} icon={<SettingOutlined />} className="btn-reportes">
            Gestión
          </Button>
          <Button onClick={handleLogout} icon={<LogoutOutlined />} className="btn-salir" style={{ marginLeft: 'auto' }}>
            Salir
          </Button>
        </div>
      </div>

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
              : 'Active el interruptor "Lector RFID" para que este dispositivo reciba los escaneos del lector.'}
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