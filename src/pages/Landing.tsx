import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Button, Tag, Statistic } from 'antd'
import {
  BookOutlined,
  DesktopOutlined,
  TeamOutlined,
  ArrowRightOutlined,
  ClockCircleOutlined,
  CalendarOutlined,
  ArrowUpOutlined,
  FacebookOutlined,
  YoutubeOutlined,
  InstagramOutlined,
  XOutlined,
  PhoneOutlined,
  MailOutlined,
  EnvironmentOutlined,
} from '@ant-design/icons'
import Logo from '../components/Logo'
import { getLibros, getConteoPorPrograma, registrarEventoPublico } from '../api/biblioteca'

const nombreCorto: Record<string, string> = {
  'TECNOLOGÍA SUPERIOR EN DESARROLLO DE SOFTWARE': 'Desarrollo de Software',
  'TECNOLOGÍA SUPERIOR EN MARKETING': 'Marketing Digital y Negocios',
  'TECNOLOGÍA SUPERIOR EN GASTRONOMÍA': 'Gastronomía',
  'DISEÑO GRÁFICO CON NIVEL EQUIVALENTE A TECNOLOGÍA SUPERIOR': 'Diseño Gráfico',
  'TECNOLOGÍA SUPERIOR EN TURISMO': 'Turismo',
  'ENFERMERÍA': 'Enfermería',
  'CONTABILIDAD Y ASESORIA TRIBUTARIA': 'Contabilidad y Asesoría Tributaria',
  'REDES Y TELECOMUNICACIONES': 'Redes y Telecomunicaciones',
  'ELECTRICIDAD': 'Electricidad',
  'TECNOLOGÍA SUPERIOR EN ADMINISTRACIÓN DEL TALENTO HUMANO': 'Talento Humano',
}

function Landing() {
  const navigate = useNavigate()
  const [mostrarScrollTop, setMostrarScrollTop] = useState(false)
  const [totalLibros, setTotalLibros] = useState(0)
  const [disponibles, setDisponibles] = useState(0)
  const [carreras, setCarreras] = useState<{ nombre: string; programa: string; ejemplares: number }[]>([])

  useEffect(() => {
    const handleScroll = () => setMostrarScrollTop(window.scrollY > 400)
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  useEffect(() => {
    registrarEventoPublico({ tipo: 'visita_pagina' })
  }, [])

  useEffect(() => {
    getLibros().then((data: any[]) => {
      setTotalLibros(data.length)
      setDisponibles(data.reduce((a, b) => a + (b.disponibles ?? 0), 0))
    })
    getConteoPorPrograma().then((data: { programa: string; total: number }[]) => {
      const mapeado = data
        .filter(d => d.programa !== 'EDUCACIÓN CONTINUA')
        .map(d => ({
          nombre: nombreCorto[d.programa] || d.programa,
          programa: d.programa,
          ejemplares: d.total,
        }))
        .sort((a, b) => b.ejemplares - a.ejemplares)
      setCarreras(mapeado)
    })
  }, [])

  const scrollTop = () => window.scrollTo({ top: 0, behavior: 'smooth' })
  const irA = (id: string) => document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' })

  return (
    <div className="landing">

      {/* NAVBAR */}
      <nav className="landing-nav" id="inicio">
        <Logo />
        <div className="nav-links">
          <button onClick={() => irA('servicios')}>Servicios</button>
          <button onClick={() => irA('catalogo')}>Catálogo</button>
          <button onClick={() => irA('horarios')}>Horarios</button>
          <button onClick={() => irA('contacto')}>Contacto</button>
        </div>
        <Button
          className="btn-admin"
          onClick={() => navigate('/login')}
          icon={<ArrowRightOutlined />}
        >
          Acceso administrativo
        </Button>
      </nav>

      {/* HERO */}
      <section className="landing-hero">
        <div className="hero-content">
          <h1 className="landing-title">
            Tu espacio para<br />
            <span className="title-gradient">aprender, crear</span><br />
            e innovar
          </h1>
          <p className="landing-subtitle">
            Recursos académicos, espacio de estudio y tecnología
            al servicio de tu formación profesional.
          </p>
          <div className="hero-actions">
            <Button className="btn-hero-primary" size="large" icon={<BookOutlined />} onClick={() => irA('catalogo')}>
              Ver catálogo
            </Button>
            <Button className="btn-hero-secondary" size="large" onClick={() => irA('servicios')}>
              Ver servicios
            </Button>
          </div>
          <div className="hero-stats">
            <div className="hero-stat">
              <span className="hstat-num">{totalLibros}</span>
              <span className="hstat-label">Títulos disponibles</span>
            </div>
            <div className="hero-stat-divider" />
            <div className="hero-stat">
              <span className="hstat-num">6</span>
              <span className="hstat-label">Computadoras</span>
            </div>
            <div className="hero-stat-divider" />
            <div className="hero-stat">
              <span className="hstat-num">23</span>
              <span className="hstat-label">Mesas de estudio</span>
            </div>
          </div>
        </div>

        <div className="hero-visual">
          <div className="blob-wrap">
            <div className="blob blob-1" />
            <div className="blob blob-2" />
            <div className="blob blob-3" />
            <div className="blob-shine" />
            <div className="blob-card card-1">
              <BookOutlined style={{ color: '#00796B', fontSize: 20 }} />
              <div>
                <div className="bcard-title">Libros disponibles</div>
                <div className="bcard-sub">{disponibles} títulos listos para préstamo</div>
              </div>
            </div>
            <div className="blob-card card-2">
              <span className="bcard-num">1995</span>
              <div className="bcard-title">Establecidos en Cuenca</div>
            </div>
          </div>
        </div>
      </section>

      {/* SERVICIOS */}
      <section className="landing-section" id="servicios">
        <div className="section-label">Servicios</div>
        <h2 className="section-title">Todo lo que necesitas<br />en un solo lugar</h2>
        <div className="servicios-grid">
          <div className="servicio-card">
            <div className="servicio-icon servicio-icon-teal">
              <BookOutlined style={{ color: '#00796B', fontSize: 24 }} />
            </div>
            <h3>Préstamo de libros</h3>
            <p>Accede a nuestra colección de títulos académicos. Registro rápido con tecnología RFID.</p>
            <Tag color="cyan">Disponible</Tag>
          </div>
          <div className="servicio-card">
            <div className="servicio-icon servicio-icon-indigo">
              <DesktopOutlined style={{ color: '#78909C', fontSize: 24 }} />
            </div>
            <h3>Computadoras</h3>
            <p>6 equipos de cómputo disponibles para investigación, trabajos académicos y navegación.</p>
            <Tag color="default">6 equipos</Tag>
          </div>
          <div className="servicio-card">
            <div className="servicio-icon servicio-icon-orange">
              <TeamOutlined style={{ color: '#607D8B', fontSize: 24 }} />
            </div>
            <h3>Sala de estudio</h3>
            <p>23 mesas para estudio individual o grupal en un ambiente tranquilo y cómodo.</p>
            <Tag color="default">23 mesas</Tag>
          </div>
        </div>
      </section>

      {/* CATÁLOGO */}
      <section className="landing-section catalogo-section" id="catalogo">
        <div className="section-label">Catálogo</div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', flexWrap: 'wrap', gap: 12 }}>
          <h2 className="section-title" style={{ marginBottom: 24 }}>Recursos por carrera</h2>
          <Button
            className="btn-hero-secondary"
            icon={<BookOutlined />}
            onClick={() => navigate('/catalogo')}
            style={{ marginBottom: 24 }}
          >
            Buscar en todo el catálogo
          </Button>
        </div>
        <div className="catalogo-grid catalogo-grid-carreras">
          {carreras.map(carrera => (
            <div
              key={carrera.nombre}
              className="catalogo-card catalogo-card-carrera"
              role="button"
              tabIndex={0}
              onClick={() => {
                registrarEventoPublico({ tipo: 'clic_carrera', programa: carrera.programa })
                navigate(`/catalogo?programa=${encodeURIComponent(carrera.programa)}`)
              }}
              onKeyDown={e => {
                if (e.key === 'Enter') {
                  registrarEventoPublico({ tipo: 'clic_carrera', programa: carrera.programa })
                  navigate(`/catalogo?programa=${encodeURIComponent(carrera.programa)}`)
                }
              }}
              style={{ cursor: 'pointer' }}
            >
              <BookOutlined style={{ color: '#00796B', fontSize: 26, marginBottom: 12 }} />
              <h3 className="catalogo-titulo">{carrera.nombre}</h3>
              <div className="catalogo-footer-carrera">
                <Statistic
                  title="Ejemplares disponibles"
                  value={carrera.ejemplares}
                  valueStyle={{ fontSize: 26, fontWeight: 800, color: '#00796B' }}
                />
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* HORARIOS */}
      <section className="landing-section" id="horarios">
        <div className="section-label">Horarios</div>
        <h2 className="section-title">Estamos aquí para ti</h2>
        <div className="horarios-grid">
          <div className="horario-card">
            <CalendarOutlined style={{ fontSize: 28, color: '#00796B' }} />
            <h3>Lunes a Viernes</h3>
            <p className="horario-time">
              08:00 — 13:00<br />
              17:00 — 20:00
            </p>
            <Tag color="cyan">Abierto</Tag>
          </div>
          <div className="horario-card cerrado">
            <ClockCircleOutlined style={{ fontSize: 28, color: '#9ca3af' }} />
            <h3>Sábados y Domingos</h3>
            <p className="horario-time">Sin atención</p>
            <Tag color="default">Cerrado</Tag>
          </div>
        </div>
        <div className="hora-actual" style={{ marginTop: 16 }}>
          <ClockCircleOutlined style={{ marginRight: 8 }} />
          Horario de atención: <strong>lunes a viernes de 08:00 a 13:00 y de 17:00 a 20:00</strong>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="landing-footer" id="contacto">
        <div className="footer-content">
          <div className="footer-left">
            <Logo size="large" dark />
            <p className="footer-desc">
              Formando profesionales de excelencia<br />
              desde 1995 en Cuenca, Ecuador.
            </p>
            <div className="footer-redes">
              <a href="https://facebook.com" target="_blank" rel="noreferrer" className="red-social"><FacebookOutlined /></a>
              <a href="https://youtube.com" target="_blank" rel="noreferrer" className="red-social"><YoutubeOutlined /></a>
              <a href="https://x.com" target="_blank" rel="noreferrer" className="red-social"><XOutlined /></a>
              <a href="https://instagram.com" target="_blank" rel="noreferrer" className="red-social"><InstagramOutlined /></a>
            </div>
          </div>

          <div className="footer-contacto">
            <h4>Información de contacto</h4>
            <div className="contacto-item">
              <PhoneOutlined style={{ color: 'rgba(255,255,255,0.7)' }} />
              <span>(593-7) 283 8323 / 284 3619 / 0996976449</span>
            </div>
            <div className="contacto-item">
              <MailOutlined style={{ color: 'rgba(255,255,255,0.7)' }} />
              <span>info@sudamericano.edu.ec</span>
            </div>
            <div className="contacto-item">
              <MailOutlined style={{ color: 'rgba(255,255,255,0.7)' }} />
              <span>relpublicaits@sudamericano.edu.ec</span>
            </div>
            <div className="contacto-item">
              <EnvironmentOutlined style={{ color: 'rgba(255,255,255,0.7)' }} />
              <span>Simón Bolívar y Manuel Vega Esq. Cuenca EC</span>
            </div>
            <div className="contacto-item">
              <EnvironmentOutlined style={{ color: 'rgba(255,255,255,0.7)' }} />
              <span>Edificio Huayna Cápac: Jaime Roldós 4-85</span>
            </div>
          </div>

          <div className="footer-links">
            <h4>Biblioteca</h4>
            <button onClick={() => irA('servicios')}>Servicios</button>
            <button onClick={() => irA('catalogo')}>Catálogo de libros</button>
            <button onClick={() => irA('horarios')}>Horarios de atención</button>
            <button onClick={() => navigate('/login')}>Acceso administrativo</button>
          </div>
        </div>

        <div className="footer-bottom">
          <span>© 2026 Instituto de Tecnologías Sudamericano. Todos los derechos reservados.</span>
          <span>Biblioteca Daniel Perazzo · Cuenca, Ecuador</span>
        </div>
      </footer>

      {mostrarScrollTop && (
        <button className="scroll-top" onClick={scrollTop}>
          <ArrowUpOutlined />
        </button>
      )}

    </div>
  )
}

export default Landing