import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Button, Tag, Statistic } from 'antd'
import {
  BookOutlined,
  DesktopOutlined,
  TeamOutlined,
  SearchOutlined,
  ArrowRightOutlined,
  ClockCircleOutlined,
  ReadOutlined,
  CalendarOutlined,
} from '@ant-design/icons'
import Logo from '../components/Logo'
import { libros } from '../data/libros'

function Landing() {
  const navigate = useNavigate()
  const [hora, setHora] = useState(new Date())

  useEffect(() => {
    const t = setInterval(() => setHora(new Date()), 1000)
    return () => clearInterval(t)
  }, [])

  const totalLibros = libros.reduce((a, b) => a + b.totalEjemplares, 0)
  const disponibles = libros.reduce((a, b) => a + b.disponibles, 0)

  return (
    <div className="landing">

      {/* NAVBAR */}
      <nav className="landing-nav">
        <Logo />
        <div className="nav-links">
          <a href="#servicios">Servicios</a>
          <a href="#catalogo">Catálogo</a>
          <a href="#horarios">Horarios</a>
          <a href="#contacto">Contacto</a>
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
          <Tag className="hero-tag">
            <span className="tag-dot" />
            Biblioteca abierta ahora
          </Tag>
          <h1 className="landing-title">
            Tu espacio para<br />
            <span className="title-gradient">aprender, crear</span><br />
            e innovar
          </h1>
          <p className="landing-subtitle">
            Biblioteca Daniel Perazzo — Instituto Sudamericano.<br />
            Recursos académicos, espacio de estudio y tecnología
            al servicio de tu formación profesional.
          </p>
          <div className="hero-actions">
            <Button className="btn-hero-primary" size="large" icon={<SearchOutlined />}>
              Buscar en el catálogo
            </Button>
            <Button className="btn-hero-secondary" size="large">
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
                <div className="bcard-title">Préstamo activo</div>
                <div className="bcard-sub">Clean Code · Ing. Paul Tigre</div>
              </div>
            </div>
            <div className="blob-card card-2">
              <span className="bcard-num" style={{ color: '#0d9488' }}>{disponibles}</span>
              <div className="bcard-title">Libros disponibles hoy</div>
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
          <div className="servicio-card">
            <div className="servicio-icon" style={{ background: 'rgba(249,115,22,0.1)' }}>
              <ReadOutlined style={{ color: '#f97316', fontSize: 24 }} />
            </div>
            <h3>Asesoría bibliográfica</h3>
            <p>El personal de la biblioteca te ayuda a encontrar los recursos que necesitas para tu carrera.</p>
            <Tag color="orange">Presencial</Tag>
          </div>
        </div>
      </section>

      {/* CATÁLOGO */}
      <section className="landing-section catalogo-section" id="catalogo">
        <div className="section-label">Catálogo</div>
        <h2 className="section-title">Recursos disponibles</h2>
        <div className="catalogo-grid">
          {libros.map(libro => (
            <div key={libro.codigo} className="catalogo-card">
              <div className="catalogo-top">
                <Tag color={libro.disponibles > 0 ? 'cyan' : 'red'} style={{ borderRadius: 6 }}>
                  {libro.disponibles > 0 ? `${libro.disponibles} disponible${libro.disponibles > 1 ? 's' : ''}` : 'No disponible'}
                </Tag>
                <span className="catalogo-categoria">{libro.categoria}</span>
              </div>
              <h3 className="catalogo-titulo">{libro.titulo}</h3>
              <p className="catalogo-autor">{libro.autor} · {libro.anio}</p>
              <p className="catalogo-desc">{libro.descripcion}</p>
              <div className="catalogo-footer">
                <Statistic
                  title="Total"
                  value={libro.totalEjemplares}
                  valueStyle={{ fontSize: 20, fontWeight: 800, color: '#0f172a' }}
                />
                <Statistic
                  title="Disponibles"
                  value={libro.disponibles}
                  valueStyle={{ fontSize: 20, fontWeight: 800, color: '#0d9488' }}
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
        <div className="hora-actual">
          <ClockCircleOutlined style={{ marginRight: 8, color: '#0d9488' }} />
          Hora actual: <strong>{hora.toLocaleTimeString('es-EC')}</strong>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="landing-footer" id="contacto">
        <div className="footer-content">
          <Logo size="large" />
          <div className="footer-info">
            <p>Biblioteca Daniel Perazzo</p>
            <p>Instituto Sudamericano · Cuenca, Ecuador</p>
          </div>
        </div>
        <div className="footer-bottom">
          <span>© 2026 Instituto Sudamericano. Todos los derechos reservados.</span>
          <Button
            type="link"
            onClick={() => navigate('/login')}
            style={{ color: '#6b7280', fontSize: 12 }}
          >
            Acceso administrativo
          </Button>
        </div>
      </footer>

    </div>
  )
}

export default Landing