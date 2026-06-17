import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Select, Button, App } from 'antd'
import { ReadOutlined, CheckCircleOutlined, ArrowLeftOutlined } from '@ant-design/icons'
import type { Docente } from '../../data/docentes'

interface Props { docente: Docente | null }

const actividades = [
  { value: 'lectura', label: '📖 Lectura en sala' },
  { value: 'investigacion', label: '🔬 Investigación' },
  { value: 'trabajo', label: '💻 Trabajo académico' },
  { value: 'reunion', label: '👥 Reunión de trabajo' },
  { value: 'otro', label: '📝 Otro' },
]

function UsoBiblioteca({ docente }: Props) {
  const navigate = useNavigate()
  const { message } = App.useApp()
  const [actividad, setActividad] = useState<string | undefined>()
  const [confirmado, setConfirmado] = useState(false)

  if (!docente) { navigate('/sistema'); return null }

  const handleConfirmar = () => {
    if (!actividad) { message.warning('Selecciona una actividad'); return }
    setConfirmado(true)
    message.success('Registro confirmado')
    setTimeout(() => navigate('/sistema'), 2000)
  }

  if (confirmado) return (
    <div className="page-wrapper">
      <div className="page-card" style={{ textAlign: 'center' }}>
        <CheckCircleOutlined style={{ fontSize: 64, color: '#0094A2', marginBottom: 16 }} />
        <h2 className="perfil-nombre">¡Registro exitoso!</h2>
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
          <ReadOutlined style={{ fontSize: 40, color: '#0094A2', marginBottom: 12 }} />
          <h2 className="perfil-nombre">Uso de biblioteca</h2>
          <p className="perfil-depto">{docente.nombre}</p>
        </div>
        <div className="form-field">
          <label className="field-label">Selecciona tu actividad</label>
          <Select placeholder="¿Qué vas a hacer hoy?" options={actividades} value={actividad} onChange={setActividad} style={{ width: '100%' }} size="large" />
        </div>
        <Button className="btn-confirmar" block size="large" onClick={handleConfirmar}>
          <CheckCircleOutlined /> Confirmar registro
        </Button>
      </div>
    </div>
  )
}

export default UsoBiblioteca
