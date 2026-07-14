import { useState, useEffect } from 'react'
import { Button, App, Input } from 'antd'
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

// Grupo de botones: 1 clic para elegir, en vez de abrir un desplegable y luego elegir
function ChipGroup({ opciones, valor, onChange }: { opciones: { value: any; label: string }[]; valor: any; onChange: (v: any) => void }) {
  return (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
      {opciones.map(op => (
        <Button
          key={String(op.value)}
          onClick={() => onChange(op.value)}
          type={valor === op.value ? 'primary' : 'default'}
          style={valor === op.value ? { background: '#00796B', borderColor: '#00796B' } : {}}
          size="large"
        >
          {op.label}
        </Button>
      ))}
    </div>
  )
}

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

  const carrerasReales = (docente?.carreras ?? [])
    .filter((dc: any) => dc.carrera)
    .map((dc: any) => ({ ...dc.carrera, ciclos: dc.ciclos ?? [] }))
  const opcionesCarrera = carrerasReales.map((c: any) => ({ value: c.nombre, label: c.nombre }))
  const carreraActual = carrerasReales.find((c: any) => c.nombre === carreraSeleccionada)
  const opcionesCiclo = carreraActual?.ciclos.map((c: any) => ({ value: c.numero, label: `${c.numero}° Ciclo` })) ?? []
  const cicloActual = carreraActual?.ciclos.find((c: any) => c.numero === cicloSeleccionado)
  const opcionesMateria = cicloActual?.materias.map((m: any) => ({ value: m.nombre, label: m.nombre })) ?? []
  const jornadaHabitual: string | undefined = cicloActual?.jornada

  // Auto-selección: si solo hay una opción posible, se precarga sola — el
  // docente no tiene que elegir algo que de todos modos es lo único que hay.
  useEffect(() => {
    if (opcionesCarrera.length === 1 && !carreraSeleccionada) {
      setCarreraSeleccionada(opcionesCarrera[0].value)
    }
  }, [docente])

  useEffect(() => {
    if (opcionesCiclo.length === 1 && carreraSeleccionada) {
      setCicloSeleccionado(opcionesCiclo[0].value)
    }
  }, [carreraSeleccionada])

  useEffect(() => {
    if (cicloSeleccionado && jornadaHabitual && !jornadaSeleccionada) {
      setJornadaSeleccionada(jornadaHabitual)
    }
  }, [cicloSeleccionado, jornadaHabitual])

  useEffect(() => {
    if (opcionesMateria.length === 1 && cicloSeleccionado) {
      setMateriaSeleccionada(opcionesMateria[0].value)
    }
  }, [cicloSeleccionado])

  if (!docente) return null

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

  const esInvitado = docente?.tipoPersona === 'INVITADO'
  const esDocenteOEstudiante = !esInvitado

  const handleConfirmar = async () => {
    if (!actividad) { message.warning('Selecciona una actividad'); return }
    if (!esInvitado) {
      if (!carreraSeleccionada) { message.warning('Selecciona una carrera'); return }
      if (!cicloSeleccionado) { message.warning('Selecciona el ciclo'); return }
      if (!jornadaSeleccionada) { message.warning('Selecciona la jornada'); return }
      if (!materiaSeleccionada) { message.warning('Selecciona la materia'); return }
    }

    setGuardando(true)
    try {
      await crearRegistro({
        tipo: 'uso',
        usuarioId: docente.id,
        actividad,
        detalle: detalle || undefined,
        carrera: esInvitado ? undefined : carreraSeleccionada,
        ciclo: esInvitado ? undefined : cicloSeleccionado,
        jornada: esInvitado ? undefined : jornadaSeleccionada,
        materia: esInvitado ? undefined : materiaSeleccionada,
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
        <ChipGroup opciones={actividades} valor={actividad} onChange={setActividad} />
      </div>

      <div className="form-field">
        <label className="field-label">Detalle <span style={{ color: '#94A3B8', fontWeight: 400 }}>(opcional)</span></label>
        <Input placeholder="Descripción breve..." value={detalle}
          onChange={e => setDetalle(e.target.value)} size="large" maxLength={120} />
      </div>

      {opcionesCarrera.length > 1 && (
        <div className="form-field">
          <label className="field-label">Carrera</label>
          <ChipGroup opciones={opcionesCarrera} valor={carreraSeleccionada} onChange={handleCarreraChange} />
        </div>
      )}

      {carreraSeleccionada && opcionesCiclo.length > 1 && (
        <div className="form-field">
          <label className="field-label">Ciclo</label>
          <ChipGroup opciones={opcionesCiclo} valor={cicloSeleccionado} onChange={handleCicloChange} />
        </div>
      )}

      {cicloSeleccionado && !jornadaHabitual && (
        <div className="form-field">
          <label className="field-label">Jornada</label>
          <ChipGroup opciones={jornadas} valor={jornadaSeleccionada}
            onChange={val => { setJornadaSeleccionada(val); setMateriaSeleccionada(opcionesMateria.length === 1 ? opcionesMateria[0].value : undefined) }} />
        </div>
      )}

      {esDocenteOEstudiante && jornadaSeleccionada && opcionesMateria.length > 1 && (
        <div className="form-field">
          <label className="field-label">Materia</label>
          <ChipGroup opciones={opcionesMateria} valor={materiaSeleccionada} onChange={setMateriaSeleccionada} />
        </div>
      )}

      {esDocenteOEstudiante && jornadaSeleccionada && opcionesMateria.length === 1 && (
        <div style={{ fontSize: 12, color: '#94A3B8', marginTop: -12, marginBottom: 18 }}>
          Materia: <strong style={{ color: '#00796B' }}>{opcionesMateria[0].label}</strong> (única para este ciclo — precargada)
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