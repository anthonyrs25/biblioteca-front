import { useNavigate } from 'react-router-dom'
import { Avatar, Tag, Divider, App } from 'antd'
import { UserOutlined, BookOutlined, ReadOutlined, RollbackOutlined, ArrowLeftOutlined, IdcardOutlined } from '@ant-design/icons'

interface Props {
  docente: any | null
}

// Etiqueta e identidad visual según el tipo real de la persona, para no
// llamar "docente" a un estudiante o invitado.
const META_TIPO: Record<string, { etiqueta: string; color: string; icono: any }> = {
  DOCENTE: { etiqueta: 'Docente', color: 'cyan', icono: <IdcardOutlined /> },
  ESTUDIANTE: { etiqueta: 'Estudiante', color: 'purple', icono: <ReadOutlined /> },
  INVITADO: { etiqueta: 'Invitado', color: 'magenta', icono: <UserOutlined /> },
}

// Panel que aparece tras identificar a una persona (por RFID o registro).
// Sirve para docentes, estudiantes e invitados — el contenido se adapta al tipo.
function Docente({ docente }: Props) {
  const navigate = useNavigate()
  const { message } = App.useApp()

  if (!docente) { navigate('/sistema'); return null }

  const ir = (ruta: string) => {
    message.loading('Cargando...', 0.5)
    setTimeout(() => navigate(ruta), 500)
  }

  const tipo = docente.tipoPersona ?? 'DOCENTE'
  const meta = META_TIPO[tipo] ?? META_TIPO.DOCENTE
  const esInvitado = tipo === 'INVITADO'

  // Carreras del backend: [{ carrera: { nombre, ciclos } }, ...]. Los invitados
  // no tienen carrera, así que para ellos no se muestra esa línea.
  const nombresCarreras = docente.carreras
    ?.map((dc: any) => dc.carrera?.nombre)
    .filter(Boolean)
    .join(' · ') || (esInvitado ? '' : 'Sin carrera asignada')

  const prestamosActivos = (docente.prestamos ?? []).filter((p: any) => p.activo).length

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
            {nombresCarreras && <p className="perfil-depto">{nombresCarreras}</p>}
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginTop: 4 }}>
              <Tag color={meta.color} style={{ borderRadius: 6 }}>
                {meta.icono} <span style={{ marginLeft: 4 }}>{meta.etiqueta}</span>
              </Tag>
              {docente.rfid && (
                <Tag style={{ background: 'rgba(13,148,136,0.1)', border: '1px solid rgba(13,148,136,0.3)', color: '#0d9488', borderRadius: 6 }}>
                  <UserOutlined style={{ marginRight: 4 }} />{docente.rfid}
                </Tag>
              )}
            </div>
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
