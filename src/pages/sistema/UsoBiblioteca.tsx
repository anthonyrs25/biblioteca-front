import { useState } from 'react'
import { Select, Button, App, Input } from 'antd'
import { ReadOutlined, CheckCircleOutlined, ArrowLeftOutlined } from '@ant-design/icons'
import { crearRegistro } from '../../api/biblioteca'

interface Props {
  docente: any | null
  onTerminar?: () => void
  enModal?: boolean
}

const actividades = [
  { value: 'lectura', label: '📖 Lectura en sala' },
  { value: 'investigacion', label: '🔬 Investigación' },
  { value: 'trabajo', label: '💻 Trabajo académico' },
  { value: 'reunion', label: '👥 Reunión de trabajo' },
  { value: 'otro', label: '📝 Otro' },
]

const jornadas = [
  { value: 'matutino', label: '🌅 Matutino' },
  { value: 'vespertino', label: '🌇 Vespertino' },
  { value: 'nocturno', label: '🌙 Nocturno' },
]

function UsoBiblioteca({ docente, onTerminar, enModal }: Props) {
  const { message } = App.useApp()
  const [actividad, setActividad] = useState<string | undefined>()
  const [detalle, setDetalle] = useState('')
  const [carreraSeleccionada, setCarreraSeleccionada] = useState<string | undefined>()
  const [cicloSeleccionado, setCicloSeleccionado] = useState<number | undefined>()
  const [jornadaSeleccionada, setJornadaSeleccionada] = useState<string | undefined>()
  const [materiaSeleccionada, setMateriaSeleccionada] = useState<string | undefined>()
  const [confirmado, setConfirmado] = useState(false)
  const [guardando, setGuardando] = useState(false)

  if (!docente) return null

  const carrerasReales = (docente.carreras ?? []).map((dc: any) => dc.carrera).filter(Boolean)
  const opcionesCarrera = carrerasReales.map((c: any) => ({ value: c.nombre, label: c.nombre }))
  const carreraActual = carrerasReales.find((c: any) => c.nombre === carreraSeleccionada)
  const opcionesCiclo = carreraActual?.ciclos.map((c: any) => ({ value: c.numero, label: `${c.numero}° Ciclo` })) ?? []
  const cicloActual = carreraActual?.ciclos.find((c: any) => c.numero === cicloSeleccionado)
  const opcionesMateria = cicloActual?.materias.map((m: any) => ({ value: m.nombre, label: m.nombre })) ?? []

  const handleCarreraChange = (val: string) => {
    setCarreraSeleccionada(val)
    setCicloSeleccionado(undefined)
    setJornadaSeleccionada(undefined)
    setMateriaSeleccionada(undefined)
  }

  const handleCicloChange = (val: number) => {
    setCicloSeleccionado(val)
    setJornadaSeleccionada(undefined)
    setMateriaSeleccionada(undefined)
  }

  const handleConfirmar = async () => {
    if (!actividad) { message.warning('Selecciona una actividad'); return }
    if (!carreraSeleccionada) { message.warning('Selecciona una carrera'); return }
    if (!cicloSeleccionado) { message.warning('Selecciona el ciclo'); return }
    if (!jornadaSeleccionada) { message.warning('Selecciona la jornada'); return }
    if (!materiaSeleccionada) { message.warning('Selecciona la materia'); return }

    setGuardando(true)
    try {
      await crearRegistro({
        tipo: 'uso',
        usuarioId: docente.id,
        actividad,
        detalle: detalle || undefined,
        carrera: carreraSeleccionada,
        ciclo: cicloSeleccionado,
        jornada: jornadaSeleccionada,
        materia: materiaSeleccionada,
      })
      setConfirmado(true)
      message.success('Registro de uso guardado')
      setTimeout(() => onTerminar?.(), 1500)
    } catch {
      message.error('Error al guardar el registro')
    } finally {
      setGuardando(false)
    }
  }

  if (confirmado) return (
    <div style={{ padding: 40, textAlign: 'center' }}>
      <CheckCircleOutlined style={{ fontSize: 64, color: '#00796B', marginBottom: 16 }} />
      <h2 className="perfil-nombre">¡Registro exitoso!</h2>
      <p className="perfil-depto">{docente.nombre}</p>
    </div>
  )

  const contenido = (
    <>
      {enModal && (
        <button className="btn-volver" onClick={onTerminar}>
          <ArrowLeftOutlined /> Volver
        </button>
      )}
      <div style={{ textAlign: 'center', marginBottom: 28 }}>
        <ReadOutlined style={{ fontSize: 40, color: '#00796B', marginBottom: 12 }} />
        <h2 className="perfil-nombre">Uso de biblioteca</h2>
        <p className="perfil-depto">{docente.nombre}</p>
      </div>

      <div className="form-field">
        <label className="field-label">Actividad</label>
        <Select placeholder="¿Qué vas a hacer hoy?" options={actividades} value={actividad}
          onChange={setActividad} style={{ width: '100%' }} size="large" />
      </div>

      <div className="form-field">
        <label className="field-label">Detalle <span style={{ color: '#94A3B8', fontWeight: 400 }}>(opcional)</span></label>
        <Input placeholder="Descripción breve..." value={detalle}
          onChange={e => setDetalle(e.target.value)} size="large" maxLength={120} />
      </div>

      <div className="form-field">
        <label className="field-label">Carrera</label>
        <Select placeholder="Selecciona la carrera" options={opcionesCarrera}
          value={carreraSeleccionada} onChange={handleCarreraChange} style={{ width: '100%' }} size="large" />
      </div>

      {carreraSeleccionada && (
        <div className="form-field">
          <label className="field-label">Ciclo</label>
          <Select placeholder="Selecciona el ciclo" options={opcionesCiclo}
            value={cicloSeleccionado} onChange={handleCicloChange} style={{ width: '100%' }} size="large" />
        </div>
      )}

      {cicloSeleccionado && (
        <div className="form-field">
          <label className="field-label">Jornada</label>
          <Select placeholder="Matutino, vespertino o nocturno" options={jornadas}
            value={jornadaSeleccionada} onChange={val => { setJornadaSeleccionada(val); setMateriaSeleccionada(undefined) }}
            style={{ width: '100%' }} size="large" />
        </div>
      )}

      {jornadaSeleccionada && (
        <div className="form-field">
          <label className="field-label">Materia</label>
          <Select placeholder="Selecciona la materia" options={opcionesMateria}
            value={materiaSeleccionada} onChange={setMateriaSeleccionada} style={{ width: '100%' }} size="large" />
        </div>
      )}

      <Button className="btn-confirmar" block size="large" onClick={handleConfirmar}
        loading={guardando} style={{ marginTop: 8 }}>
        <CheckCircleOutlined /> Confirmar registro
      </Button>
    </>
  )

  if (enModal) return <div style={{ padding: 32 }}>{contenido}</div>

  return (
    <div className="page-wrapper">
      <div className="page-card">{contenido}</div>
    </div>
  )
}

export default UsoBiblioteca