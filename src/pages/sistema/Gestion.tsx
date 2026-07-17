import { useNavigate } from 'react-router-dom'
import { ArrowLeftOutlined, BookOutlined, TeamOutlined, UserAddOutlined } from '@ant-design/icons'
import { useModo } from '../../context/ModoContext'

function Gestion() {
  const navigate = useNavigate()
  const { modoAdminActivo } = useModo()

  return (
    <div className="page-wrapper">
      <div className="page-card" style={{ maxWidth: 640 }}>
        <button className="btn-volver" onClick={() => navigate('/sistema')}>
          <ArrowLeftOutlined /> Volver al sistema
        </button>

        <div style={{ textAlign: 'center', marginBottom: 28 }}>
          <h2 className="perfil-nombre">Gestión del sistema</h2>
          <p className="perfil-depto">¿Qué deseas administrar?</p>
        </div>

        <div className="opciones-grid">
          <button className="opcion-btn" onClick={() => navigate('/sistema/gestion/libros')}>
            <BookOutlined style={{ fontSize: 26, color: '#0d9488' }} />
            <span>
              <span className="opcion-titulo">Libros</span>
              <span className="opcion-desc">Agregar, editar o eliminar títulos del catálogo</span>
            </span>
          </button>
          <button className="opcion-btn" onClick={() => navigate('/sistema/gestion/docentes')}>
            <TeamOutlined style={{ fontSize: 26, color: '#0ea5e9' }} />
            <span>
              <span className="opcion-titulo">Docentes</span>
              <span className="opcion-desc">Cambiar el llavero RFID asignado a cada docente</span>
            </span>
          </button>
          {modoAdminActivo && (
            <button className="opcion-btn" onClick={() => navigate('/sistema/gestion/staff')}>
              <UserAddOutlined style={{ fontSize: 26, color: '#D97706' }} />
              <span>
                <span className="opcion-titulo">Cuentas del sistema</span>
                <span className="opcion-desc">Crear cuentas nuevas de bibliotecario o administrador</span>
              </span>
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

export default Gestion