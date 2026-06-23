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
import { libros } from '../data/libros'

// CARRERAS — total de ejemplares por carrera (dato referencial, ajustar cuando exista backend real)
const carreras = [
  { nombre: 'Desarrollo de Software', ejemplares: 18 },
  { nombre: 'Diseño Gráfico', ejemplares: 9 },
  { nombre: 'Gastronomía', ejemplares: 7 },
  { nombre: 'Marketing Digital y Negocios', ejemplares: 11 },
  { nombre: 'Turismo', ejemplares: 6 },
  { nombre: 'Talento Humano', ejemplares: 8 },
  { nombre: 'Enfermería', ejemplares: 10 },
  { nombre: 'Electricidad', ejemplares: 9 },
  { nombre: 'Contabilidad y Asesoría Tributaria', ejemplares: 12 },
  { nombre: 'Redes y Telecomunicaciones', ejemplares: 14 },
]

function Landing() {
  const navigate = useNavigate()
  const [mostrarScrollTop, setMostrarScrollTop] = useState(false)

  useEffect(() => {
    const handleScroll = () => setMostrarScrollTop(window.scrollY > 400)
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  const scrollTop = () => window.scrollTo({ top: 0, behavior: 'smooth' })

  const irA = (id: string) => {
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' })
  }

  const totalLibros = libros.reduce((a, b) => a + b.totalEjemplares, 0)
  const disponibles = libros.reduce((a, b) => a + b.disponibles, 0)

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
            <Button
              className="btn-hero-primary"
              size="large"
              icon={<BookOutlined />}
              onClick={() => irA('catalogo')}
            >
              Ver catálogo
            </Button>
            <Button
              className="btn-hero-secondary"
              size="large"
              onClick={() => irA('servicios')}
            >
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
              <span className="hstat-num">3</span>
              <span className="hstat-label">Computadoras</span>
            </div>
            <div className="hero-stat-divider" />
            <div className="hero-stat">
              <span className="hstat-num">20+</span>
              <span className="hstat-label">Mesas de estudio</span>
            </div>
          </div>
        </div>

        {/* BLOB DECORATIVO */}
        <div className="hero-visual">
          <div className="blob-wrap">
            <div className="blob blob-1" />
            <div className="blob blob-2" />
            <div className="blob blob-3" />
            <div className="blob-shine" />
            <div className="blob-card card-1">
              <BookOutlined style={{ color: '#0d9488', fontSize: 20 }} />
              <div>
                <div className="bcard-title">Libros disponibles</div>
                <div className="bcard-sub">{disponibles} títulos listos para préstamo</div>
              </div>
            </div>
            <div className="blob-card card-2">
              <span className="bcard-num" style={{ color: '#0d9488' }}>1995</span>
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
            <div className="servicio-icon" style={{ background: 'rgba(13,148,136,0.1)' }}>
              <BookOutlined style={{ color: '#0d9488', fontSize: 24 }} />
            </div>
            <h3>Préstamo de libros</h3>
            <p>Accede a nuestra colección de títulos académicos. Registro rápido con tecnología RFID.</p>
            <Tag color="cyan">Disponible</Tag>
          </div>
          <div className="servicio-card">
            <div className="servicio-icon" style={{ background: 'rgba(14,165,233,0.1)' }}>
              <DesktopOutlined style={{ color: '#0ea5e9', fontSize: 24 }} />
            </div>
            <h3>Computadoras</h3>
            <p>3 equipos de cómputo disponibles para investigación, trabajos académicos y navegación.</p>
            <Tag color="blue">3 equipos</Tag>
          </div>
          <div className="servicio-card">
            <div className="servicio-icon" style={{ background: 'rgba(139,92,246,0.1)' }}>
              <TeamOutlined style={{ color: '#8b5cf6', fontSize: 24 }} />
            </div>
            <h3>Sala de estudio</h3>
            <p>Espacio amplio con mesas para estudio individual o grupal en un ambiente tranquilo.</p>
            <Tag color="purple">Amplia sala</Tag>
          </div>
        </div>
      </section>

      {/* CATÁLOGO — por carreras */}
      <section className="landing-section catalogo-section" id="catalogo">
        <div className="section-label">Catálogo</div>
        <h2 className="section-title">Recursos por carrera</h2>
        <div className="catalogo-grid catalogo-grid-carreras">
          {carreras.map(carrera => (
            <div key={carrera.nombre} className="catalogo-card catalogo-card-carrera">
              <BookOutlined style={{ color: '#0d9488', fontSize: 26, marginBottom: 12 }} />
              <h3 className="catalogo-titulo">{carrera.nombre}</h3>
              <div className="catalogo-footer-carrera">
                <Statistic
                  title="Ejemplares disponibles"
                  value={carrera.ejemplares}
                  valueStyle={{ fontSize: 26, fontWeight: 800, color: '#0d9488' }}
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
            <CalendarOutlined style={{ fontSize: 28, color: '#0d9488' }} />
            <h3>Lunes a Viernes</h3>
            <p className="horario-time">07:00 — 19:00</p>
            <Tag color="cyan">Abierto hoy</Tag>
          </div>
          <div className="horario-card">
            <CalendarOutlined style={{ fontSize: 28, color: '#6b7280' }} />
            <h3>Sábados</h3>
            <p className="horario-time">08:00 — 13:00</p>
            <Tag color="default">Medio día</Tag>
          </div>
          <div className="horario-card cerrado">
            <ClockCircleOutlined style={{ fontSize: 28, color: '#9ca3af' }} />
            <h3>Domingos</h3>
            <p className="horario-time">Cerrado</p>
            <Tag color="red">No disponible</Tag>
          </div>
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
              <a href="https://facebook.com" target="_blank" rel="noreferrer" className="red-social">
                <FacebookOutlined />
              </a>
              <a href="https://youtube.com" target="_blank" rel="noreferrer" className="red-social">
                <YoutubeOutlined />
              </a>
              <a href="https://x.com" target="_blank" rel="noreferrer" className="red-social">
                <XOutlined />
              </a>
              <a href="https://instagram.com" target="_blank" rel="noreferrer" className="red-social">
                <InstagramOutlined />
              </a>
            </div>
          </div>

          <div className="footer-contacto">
            <h4>Información de contacto</h4>
            <div className="contacto-item">
              <PhoneOutlined style={{ color: '#0d9488' }} />
              <span>(593-7) 283 8323 / 284 3619 / 0996976449</span>
            </div>
            <div className="contacto-item">
              <MailOutlined style={{ color: '#0d9488' }} />
              <span>info@sudamericano.edu.ec</span>
            </div>
            <div className="contacto-item">
              <MailOutlined style={{ color: '#0d9488' }} />
              <span>relpublicaits@sudamericano.edu.ec</span>
            </div>
            <div className="contacto-item">
              <EnvironmentOutlined style={{ color: '#0d9488' }} />
              <span>Simón Bolívar y Manuel Vega Esq. Cuenca EC</span>
            </div>
            <div className="contacto-item">
              <EnvironmentOutlined style={{ color: '#0d9488' }} />
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
          <span style={{ color: '#9ca3af', fontSize: 12 }}>
            Biblioteca Daniel Perazzo · Cuenca, Ecuador
          </span>
        </div>
      </footer>

      {/* SCROLL TO TOP */}
      {mostrarScrollTop && (
        <button className="scroll-top" onClick={scrollTop}>
          <ArrowUpOutlined />
        </button>
      )}

    </div>
  )
}

export default Landing
