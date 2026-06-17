import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Input, Button, Tag, Divider, App } from 'antd'
import { BookOutlined, SearchOutlined, CheckCircleOutlined, ArrowLeftOutlined, CloseCircleOutlined } from '@ant-design/icons'
import { libros } from '../../data/libros'
import type { Docente } from '../../data/docentes'

interface Props { docente: Docente | null }

function Prestamo({ docente }: Props) {
  const navigate = useNavigate()
  const { message } = App.useApp()
  const [codigo, setCodigo] = useState('')
  const [libro, setLibro] = useState<typeof libros[0] | null>(null)
  const [buscado, setBuscado] = useState(false)
  const [confirmado, setConfirmado] = useState(false)

  if (!docente) { navigate('/sistema'); return null }

  const handleBuscar = () => {
    if (!codigo.trim()) { message.warning('Ingresa el código del libro'); return }
    const encontrado = libros.find(l => l.codigo.toLowerCase() === codigo.toLowerCase())
    setLibro(encontrado || null)
    setBuscado(true)
    if (!encontrado) message.error('Libro no encontrado')
  }

  const handlePrestar = () => {
    setConfirmado(true)
    message.success('Préstamo registrado')
    setTimeout(() => navigate('/sistema'), 2000)
  }

  if (confirmado) return (
    <div className="page-wrapper">
      <div className="page-card" style={{ textAlign: 'center' }}>
        <CheckCircleOutlined style={{ fontSize: 64, color: '#5B5FE3', marginBottom: 16 }} />
        <h2 className="perfil-nombre">¡Préstamo registrado!</h2>
        <p className="perfil-depto">{libro?.titulo}</p>
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
          <BookOutlined style={{ fontSize: 40, color: '#5B5FE3', marginBottom: 12 }} />
          <h2 className="perfil-nombre">Préstamo de libro</h2>
          <p className="perfil-depto">{docente.nombre}</p>
        </div>
        <div className="form-field">
          <label className="field-label">Código del libro</label>
          <div style={{ display: 'flex', gap: 10 }}>
            <Input placeholder="Ej: LIB-001" value={codigo} onChange={e => setCodigo(e.target.value)} onPressEnter={handleBuscar} size="large" />
            <Button className="btn-buscar" onClick={handleBuscar} size="large" icon={<SearchOutlined />}>Buscar</Button>
          </div>
        </div>
        {buscado && libro && (
          <>
            <Divider style={{ borderColor: 'rgba(0,0,0,0.06)' }} />
            <div className="libro-resultado">
              <div className="libro-header">
                <span className="libro-titulo">{libro.titulo}</span>
                <Tag color={libro.disponibles > 0 ? 'cyan' : 'red'} style={{ borderRadius: 6 }}>
                  {libro.disponibles > 0 ? 'Disponible' : 'No disponible'}
                </Tag>
              </div>
              <p className="libro-autor">{libro.autor} · {libro.anio}</p>
              <p className="libro-categoria">{libro.categoria}</p>
              <div className="libro-stock">
                <div className="stock-item"><span className="stock-num">{libro.totalEjemplares}</span><span className="stock-label">Total</span></div>
                <div className="stock-item"><span className="stock-num" style={{ color: '#0094A2' }}>{libro.disponibles}</span><span className="stock-label">Disponibles</span></div>
                <div className="stock-item"><span className="stock-num" style={{ color: '#FF6B35' }}>{libro.totalEjemplares - libro.disponibles}</span><span className="stock-label">Prestados</span></div>
              </div>
              {libro.disponibles > 0
                ? <Button className="btn-confirmar" block size="large" onClick={handlePrestar}><CheckCircleOutlined /> Confirmar préstamo</Button>
                : <div className="no-disponible"><CloseCircleOutlined style={{ marginRight: 8 }} />No hay ejemplares disponibles</div>
              }
            </div>
          </>
        )}
        {buscado && !libro && (
          <div className="no-encontrado">
            <CloseCircleOutlined style={{ fontSize: 32, color: '#ef4444' }} />
            <p>No se encontró ningún libro con ese código</p>
          </div>
        )}
      </div>
    </div>
  )
}

export default Prestamo
