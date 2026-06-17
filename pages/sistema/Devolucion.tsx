import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Button, Tag, App } from 'antd'
import { RollbackOutlined, CheckCircleOutlined, ArrowLeftOutlined, BookOutlined } from '@ant-design/icons'
import { libros } from '../../data/libros'
import type { Docente } from '../../data/docentes'

interface Props { docente: Docente | null }

function Devolucion({ docente }: Props) {
  const navigate = useNavigate()
  const { message } = App.useApp()
  const [seleccionado, setSeleccionado] = useState<string | null>(null)
  const [confirmado, setConfirmado] = useState(false)

  if (!docente) { navigate('/sistema'); return null }

  const librosDocente = libros.slice(0, docente.prestamosActivos)

  const handleDevolver = () => {
    if (!seleccionado) { message.warning('Selecciona el libro a devolver'); return }
    setConfirmado(true)
    message.success('Devolución registrada')
    setTimeout(() => navigate('/sistema'), 2000)
  }

  if (confirmado) return (
    <div className="page-wrapper">
      <div className="page-card" style={{ textAlign: 'center' }}>
        <CheckCircleOutlined style={{ fontSize: 64, color: '#FF6B35', marginBottom: 16 }} />
        <h2 className="perfil-nombre">¡Devolución exitosa!</h2>
        <p className="perfil-depto">Redirigiendo...</p>
      </div>
    </div>
  )

  return (
    <div className="page-wrapper">
      <div className="page-card">
        <button className="btn-volver" onClick={() => navigate('/sistema/docente')}>
          <ArrowLeftOutlined /> Volver
        </button>
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <RollbackOutlined style={{ fontSize: 40, color: '#FF6B35', marginBottom: 12 }} />
          <h2 className="perfil-nombre">Devolución de libro</h2>
          <p className="perfil-depto">{docente.nombre}</p>
        </div>
        <p className="field-label" style={{ marginBottom: 16 }}>Selecciona el libro a devolver:</p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 24 }}>
          {librosDocente.map(libro => (
            <div key={libro.codigo} className={`libro-opcion ${seleccionado === libro.codigo ? 'selected' : ''}`} onClick={() => setSeleccionado(libro.codigo)}>
              <BookOutlined style={{ color: '#FF6B35', fontSize: 18 }} />
              <div style={{ flex: 1 }}>
                <p className="libro-titulo" style={{ margin: 0 }}>{libro.titulo}</p>
                <p className="libro-autor" style={{ margin: 0 }}>{libro.autor}</p>
              </div>
              <Tag style={{ background: 'rgba(255,107,53,0.1)', border: '1px solid rgba(255,107,53,0.3)', color: '#E8541A', borderRadius: 6 }}>{libro.codigo}</Tag>
            </div>
          ))}
        </div>
        <Button className="btn-devolucion" block size="large" onClick={handleDevolver}>
          <CheckCircleOutlined /> Confirmar devolución
        </Button>
      </div>
    </div>
  )
}

export default Devolucion
