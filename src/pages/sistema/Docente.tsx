import { useNavigate } from 'react-router-dom'
import { Avatar, Tag, Divider, App } from 'antd'
import { UserOutlined, BookOutlined, ReadOutlined, RollbackOutlined, ArrowLeftOutlined } from '@ant-design/icons'

interface Props {
  docente: any | null
}

function Docente({ docente }: Props) {
  const navigate = useNavigate()
  const { message } = App.useApp()

  if (!docente) { navigate('/sistema'); return null }

  const ir = (ruta: string) => {
    message.loading('Cargando...', 0.5)
    setTimeout(() => navigate(ruta), 500)
  }

  // El backend devuelve docente.carreras como un array:
  // [{ carrera: { nombre: 'Desarrollo de Software', ciclos: [...] } }, ...]
  // Si el docente tiene varias carreras, las unimos en un solo texto separado por coma.
  const nombresCarreras = docente.carreras
    ?.map((dc: any) => dc.carrera?.nombre)
    .filter(Boolean)
    .join(' · ') || 'Sin carrera asignada'

  // prestamosActivos viene directo del modelo Docente (campo numérico simple)
  const prestamosActivos = docente.prestamosActivos ?? 0

  return (
    <div className="page-wrapper">
      <div className="page-card">
        <button className="btn-volver" onClick={() => navigate('/sistema')}>
          <ArrowLeftOutlined /> Volver
        </button>
        <div className="perfil-container">
          <Avatar size={72} style={{ background: 'linear-gradient(135deg,#0d9488,#0ea5e9)', fontSize: 24, fontWeight: 700 }}>
            {docente.iniciales}
          </Avatar>
          <div>
            <h2 className="perfil-nombre">{docente.nombre}</h2>
            <p className="perfil-depto">{nombresCarreras}</p>
            <Tag style={{ background: 'rgba(13,148,136,0.1)', border: '1px solid rgba(13,148,136,0.3)', color: '#0d9488', borderRadius: 6 }}>
              <UserOutlined style={{ marginRight: 4 }} />{docente.rfid}
            </Tag>
          </div>
        </div>
        <Divider style={{ borderColor: 'rgba(0,0,0,0.06)' }} />
        <p className="opciones-label">¿Qué desea hacer hoy?</p>
        <div className="opciones-grid">
          <button className="opcion-btn" onClick={() => ir('/sistema/uso-biblioteca')}>
            <ReadOutlined style={{ fontSize: 26, color: '#0d9488' }} />
            <span><span className="opcion-titulo">Uso de biblioteca</span><span className="opcion-desc">Registrar permanencia en sala</span></span>
          </button>
          <button className="opcion-btn" onClick={() => ir('/sistema/prestamo')}>
            <BookOutlined style={{ fontSize: 26, color: '#0ea5e9' }} />
            <span><span className="opcion-titulo">Préstamo de libro</span><span className="opcion-desc">Buscar y solicitar un libro</span></span>
          </button>
          {prestamosActivos > 0 && (
            <button className="opcion-btn opcion-devolucion" onClick={() => ir('/sistema/devolucion')}>
              <RollbackOutlined style={{ fontSize: 26, color: '#8b5cf6' }} />
              <span><span className="opcion-titulo">Devolución de libro</span><span className="opcion-desc">{prestamosActivos} préstamo{prestamosActivos > 1 ? 's' : ''} activo{prestamosActivos > 1 ? 's' : ''}</span></span>
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

export default Docente