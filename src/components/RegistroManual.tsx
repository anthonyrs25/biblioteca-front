import { useState, useEffect } from 'react'
import { Button, Input, Empty, Select, App, Divider } from 'antd'
import {
  SearchOutlined, IdcardOutlined, ReadOutlined, UserAddOutlined,
  ArrowLeftOutlined, MailOutlined,
} from '@ant-design/icons'
import { getUsuarios, getCarreras, getMateriasDisponibles, buscarPorEmail, buscarPorDocumento, crearUsuario } from '../api/biblioteca'
import type { PasoSelector } from '../config/llaverosGenerales'
import { normalizarMaterias } from '../utils/materias'

const OPCIONES_CICLO = [1, 2, 3, 4].map(n => ({ value: n, label: `${n}° Ciclo` }))

const JORNADAS = [
  { value: 'matutino', label: '🌅 Matutino' },
  { value: 'vespertino', label: '🌇 Vespertino' },
  { value: 'nocturno', label: '🌙 Nocturno' },
]

type PasoManual = 'tipo' | PasoSelector

interface Props {
  // Paso en el que arranca: 'tipo' (menú) si no se indica.
  // Los tokens generales lo abren directo en su paso correspondiente.
  pasoInicial?: PasoSelector
  onSeleccionar: (usuario: any) => void
}

// Contenido del "Registro manual". Vive como componente independiente
// para que App lo muestre en un modal GLOBAL: así los tokens RFID
// generales funcionan en cualquier pantalla del sistema, interrumpiendo
// sin alterar lo que el bibliotecario esté haciendo debajo.
function RegistroManual({ pasoInicial, onSeleccionar }: Props) {
  const { message } = App.useApp()
  const [pasoManual, setPasoManual] = useState<PasoManual>(pasoInicial ?? 'tipo')
  const [docentes, setDocentes] = useState<any[]>([])
  const [carrerasDisponibles, setCarrerasDisponibles] = useState<string[]>([])
  const [materiasSugeridas, setMateriasSugeridas] = useState<string[]>([])

  // ── Docente ──
  const [busquedaManual, setBusquedaManual] = useState('')
  const [emailDocente, setEmailDocente] = useState('')
  const [buscandoDocente, setBuscandoDocente] = useState(false)
  const [docenteNoEncontrado, setDocenteNoEncontrado] = useState(false)
  const [nombreDocente, setNombreDocente] = useState('')
  const [inicialesDocente, setInicialesDocente] = useState('')
  const [carreraDocente, setCarreraDocente] = useState<string | undefined>()
  const [cicloDocente, setCicloDocente] = useState<number | undefined>()
  const [jornadaDocente, setJornadaDocente] = useState<string | undefined>()
  const [materiasDocente, setMateriasDocente] = useState<string[]>([])
  const [creandoDocente, setCreandoDocente] = useState(false)

  // ── Estudiante ──
  const [emailEstudiante, setEmailEstudiante] = useState('')
  const [buscandoEstudiante, setBuscandoEstudiante] = useState(false)
  const [estudianteNoEncontrado, setEstudianteNoEncontrado] = useState(false)
  const [nombreEstudiante, setNombreEstudiante] = useState('')
  const [carreraEstudiante, setCarreraEstudiante] = useState<string | undefined>()
  const [cicloEstudiante, setCicloEstudiante] = useState<number | undefined>()
  const [jornadaEstudiante, setJornadaEstudiante] = useState<string | undefined>()
  const [materiasEstudiante, setMateriasEstudiante] = useState<string[]>([])
  const [creandoEstudiante, setCreandoEstudiante] = useState(false)

  // ── Invitado ──
  const [nombreInvitado, setNombreInvitado] = useState('')
  const [tipoDocInvitado, setTipoDocInvitado] = useState<string>('cedula')
  const [numeroDocInvitado, setNumeroDocInvitado] = useState('')
  const [buscandoInvitado, setBuscandoInvitado] = useState(false)
  const [creandoInvitado, setCreandoInvitado] = useState(false)

  useEffect(() => {
    getCarreras().then((data: any[]) => setCarrerasDisponibles(data.map(c => c.nombre)))
    getUsuarios('DOCENTE').then((data: any[]) =>
      setDocentes(data.filter((d: any) => d.rol === 'usuario'))
    )
    getMateriasDisponibles().then(setMateriasSugeridas).catch(() => setMateriasSugeridas([]))
  }, [])

  const docentesFiltrados = docentes.filter((d: any) =>
    d.nombre?.toLowerCase().includes(busquedaManual.toLowerCase()),
  )

  const opcionesMaterias = [...materiasSugeridas].sort().map(m => ({ value: m, label: m }))

  // ── Flujo Docente ──
  // Igual que el de estudiante: el correo institucional es el identificador
  // único, así no se crean docentes duplicados por diferencias de escritura.
  const buscarDocente = async () => {
    if (!emailDocente.trim()) { message.warning('Ingresa el correo institucional'); return }
    setBuscandoDocente(true)
    setDocenteNoEncontrado(false)
    try {
      const encontrado = await buscarPorEmail(emailDocente.trim())
      if (encontrado) {
        onSeleccionar(encontrado)
      } else {
        setDocenteNoEncontrado(true)
      }
    } catch {
      setDocenteNoEncontrado(true)
    } finally {
      setBuscandoDocente(false)
    }
  }

  const crearYRegistrarDocente = async () => {
    if (!nombreDocente.trim()) { message.warning('Ingresa el nombre'); return }
    if (!inicialesDocente.trim()) { message.warning('Ingresa las iniciales'); return }
    if (!carreraDocente) { message.warning('Selecciona la carrera'); return }
    if (!cicloDocente) { message.warning('Selecciona el ciclo'); return }
    if (!jornadaDocente) { message.warning('Selecciona la jornada'); return }
    const materiasLimpias = normalizarMaterias(materiasDocente)
    if (materiasLimpias.length === 0) { message.warning('Agrega al menos una materia'); return }

    setCreandoDocente(true)
    try {
      await crearUsuario({
        nombre: nombreDocente.trim(),
        iniciales: inicialesDocente.trim().toUpperCase(),
        email: emailDocente.trim(),
        rol: 'usuario',
        tipoPersona: 'DOCENTE',
        carreras: [{
          nombre: carreraDocente,
          ciclos: [{
            numero: cicloDocente,
            materias: materiasLimpias,
            jornada: jornadaDocente,
          }],
        }],
      })
      // Se vuelve a pedir con las relaciones completas (carreras/ciclos)
      // para que el panel de uso/préstamo funcione de inmediato.
      const creado = await buscarPorEmail(emailDocente.trim())
      onSeleccionar(creado)
    } catch {
      message.error('Error al registrar al docente')
    } finally {
      setCreandoDocente(false)
    }
  }

  // ── Flujo Estudiante ──
  const buscarEstudiante = async () => {
    if (!emailEstudiante.trim()) { message.warning('Ingresa el correo institucional'); return }
    setBuscandoEstudiante(true)
    setEstudianteNoEncontrado(false)
    try {
      const encontrado = await buscarPorEmail(emailEstudiante.trim())
      if (encontrado) {
        onSeleccionar(encontrado)
      } else {
        setEstudianteNoEncontrado(true)
      }
    } catch {
      setEstudianteNoEncontrado(true)
    } finally {
      setBuscandoEstudiante(false)
    }
  }

  const crearYRegistrarEstudiante = async () => {
    if (!nombreEstudiante.trim()) { message.warning('Ingresa el nombre'); return }
    if (!carreraEstudiante) { message.warning('Selecciona la carrera'); return }
    if (!cicloEstudiante) { message.warning('Selecciona el ciclo'); return }
    if (!jornadaEstudiante) { message.warning('Selecciona la jornada'); return }
    const materiasLimpias = normalizarMaterias(materiasEstudiante)
    if (materiasLimpias.length === 0) { message.warning('Agrega al menos una materia'); return }

    setCreandoEstudiante(true)
    try {
      await crearUsuario({
        nombre: nombreEstudiante.trim(),
        email: emailEstudiante.trim(),
        rol: 'usuario',
        tipoPersona: 'ESTUDIANTE',
        carreras: [{
          nombre: carreraEstudiante,
          ciclos: [{
            numero: cicloEstudiante,
            materias: materiasLimpias,
            jornada: jornadaEstudiante,
          }],
        }],
      })
      const creado = await buscarPorEmail(emailEstudiante.trim())
      onSeleccionar(creado)
    } catch {
      message.error('Error al registrar al estudiante')
    } finally {
      setCreandoEstudiante(false)
    }
  }

  // ── Flujo Invitado ──
  const buscarOCrearInvitado = async () => {
    if (!nombreInvitado.trim()) { message.warning('Ingresa el nombre'); return }
    if (!numeroDocInvitado.trim()) { message.warning('Ingresa el número de documento'); return }

    setBuscandoInvitado(true)
    try {
      const encontrado = await buscarPorDocumento(numeroDocInvitado.trim())
      if (encontrado) {
        onSeleccionar(encontrado)
        return
      }
    } catch {
      // no encontrado, seguimos a crear uno nuevo
    } finally {
      setBuscandoInvitado(false)
    }

    setCreandoInvitado(true)
    try {
      await crearUsuario({
        nombre: nombreInvitado.trim(),
        tipoDocumento: tipoDocInvitado,
        numeroDocumento: numeroDocInvitado.trim(),
        rol: 'usuario',
        tipoPersona: 'INVITADO',
      })
      const creado = await buscarPorDocumento(numeroDocInvitado.trim())
      onSeleccionar(creado)
    } catch {
      message.error('Error al registrar al invitado')
    } finally {
      setCreandoInvitado(false)
    }
  }

  return (
    <>
      {pasoManual !== 'tipo' && (
        <button className="btn-volver" onClick={() => setPasoManual('tipo')} style={{ marginBottom: 12 }}>
          <ArrowLeftOutlined /> Cambiar tipo de usuario
        </button>
      )}

      {pasoManual === 'tipo' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          <button className="opcion-btn" onClick={() => setPasoManual('docente')}>
            <IdcardOutlined style={{ fontSize: 22, color: '#00796B' }} />
            <span>
              <span className="opcion-titulo">Docente</span>
              <span className="opcion-desc">Buscar por nombre o registrar uno nuevo</span>
            </span>
          </button>
          <button className="opcion-btn" onClick={() => setPasoManual('estudiante')}>
            <ReadOutlined style={{ fontSize: 22, color: '#00796B' }} />
            <span>
              <span className="opcion-titulo">Estudiante</span>
              <span className="opcion-desc">Con correo institucional, carrera y ciclo</span>
            </span>
          </button>
          <button className="opcion-btn" onClick={() => setPasoManual('invitado')}>
            <UserAddOutlined style={{ fontSize: 22, color: '#00796B' }} />
            <span>
              <span className="opcion-titulo">Invitado / externo</span>
              <span className="opcion-desc">Visitante que no pertenece al instituto</span>
            </span>
          </button>
        </div>
      )}

      {pasoManual === 'docente' && (
        <>
          <Input
            placeholder="Buscar docente por nombre..."
            prefix={<SearchOutlined style={{ color: '#9CA3AF' }} />}
            value={busquedaManual}
            onChange={e => setBusquedaManual(e.target.value)}
            size="large"
            autoFocus
            allowClear
            style={{ marginBottom: 16 }}
          />
          {docentesFiltrados.length === 0 ? (
            <Empty
              description={busquedaManual ? 'Ningún docente coincide' : 'Aún no hay docentes registrados'}
              style={{ margin: '12px 0' }}
            />
          ) : (
            <div style={{ maxHeight: 260, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 8 }}>
              {docentesFiltrados.map((docente: any) => (
                <button
                  key={docente.id}
                  className="opcion-btn"
                  onClick={() => onSeleccionar(docente)}
                  style={{ textAlign: 'left' }}
                >
                  <span style={{
                    width: 40, height: 40, borderRadius: '50%',
                    background: 'linear-gradient(135deg, #00695C, #00897B)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    color: '#fff', fontSize: 14, fontWeight: 700, flexShrink: 0,
                  }}>
                    {docente.iniciales}
                  </span>
                  <span>
                    <span className="opcion-titulo">{docente.nombre}</span>
                    <span className="opcion-desc">
                      {docente.carreras?.map((dc: any) => dc.carrera?.nombre).filter(Boolean).join(' · ') || 'Sin carrera asignada'}
                    </span>
                  </span>
                </button>
              ))}
            </div>
          )}

          <Divider style={{ margin: '18px 0 12px' }}>¿No aparece en la lista?</Divider>

          <div className="form-field">
            <label className="field-label">Correo institucional</label>
            <div style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
              <Input
                placeholder="nombre@sudamericano.edu.ec"
                prefix={<MailOutlined style={{ color: '#9CA3AF' }} />}
                value={emailDocente}
                onChange={e => { setEmailDocente(e.target.value); setDocenteNoEncontrado(false) }}
                size="large"
              />
              <Button size="large" onClick={buscarDocente} loading={buscandoDocente}>Buscar</Button>
            </div>

            {docenteNoEncontrado && (
              <>
                <p style={{ fontSize: 13, color: '#94A3B8', margin: '4px 0 16px' }}>
                  No encontramos este correo — completa los datos para registrarlo por primera vez.
                </p>
                <div className="form-field">
                  <label className="field-label">Nombre completo</label>
                  <Input value={nombreDocente} onChange={e => setNombreDocente(e.target.value)} size="large" />
                </div>
                <div className="form-field">
                  <label className="field-label">Iniciales</label>
                  <Input
                    value={inicialesDocente}
                    onChange={e => setInicialesDocente(e.target.value)}
                    maxLength={3}
                    placeholder="Ej: HT"
                    size="large"
                  />
                </div>
                <div className="form-field">
                  <label className="field-label">Carrera</label>
                  <Select
                    placeholder="Selecciona la carrera"
                    value={carreraDocente}
                    onChange={setCarreraDocente}
                    options={carrerasDisponibles.map(c => ({ value: c, label: c }))}
                    style={{ width: '100%' }}
                    size="large"
                  />
                </div>
                <div className="form-field">
                  <label className="field-label">Ciclo</label>
                  <Select
                    placeholder="Selecciona el ciclo"
                    value={cicloDocente}
                    onChange={setCicloDocente}
                    options={OPCIONES_CICLO}
                    style={{ width: '100%' }}
                    size="large"
                  />
                </div>
                <div className="form-field">
                  <label className="field-label">Jornada</label>
                  <div style={{ display: 'flex', gap: 8 }}>
                    {JORNADAS.map(j => (
                      <Button
                        key={j.value}
                        type={jornadaDocente === j.value ? 'primary' : 'default'}
                        style={jornadaDocente === j.value ? { background: '#00796B', borderColor: '#00796B' } : {}}
                        onClick={() => setJornadaDocente(j.value)}
                      >
                        {j.label}
                      </Button>
                    ))}
                  </div>
                </div>
                <div className="form-field">
                  <label className="field-label">Materias que dicta</label>
                  <Select
                    mode="tags"
                    placeholder="Escribe y elige de las sugerencias, o presiona Enter"
                    value={materiasDocente}
                    onChange={setMateriasDocente}
                    options={opcionesMaterias}
                    tokenSeparators={[',']}
                    style={{ width: '100%' }}
                    size="large"
                  />
                  <p style={{ fontSize: 11, color: '#94A3B8', marginTop: 4 }}>
                    Elige de las materias existentes para evitar duplicados; si es nueva, escríbela y presiona Enter.
                  </p>
                </div>
                <Button className="btn-confirmar" block size="large" onClick={crearYRegistrarDocente} loading={creandoDocente} style={{ marginTop: 8 }}>
                  Registrar e ingresar
                </Button>
              </>
            )}
          </div>
        </>
      )}

      {pasoManual === 'estudiante' && (
        <div className="form-field">
          <label className="field-label">Correo institucional</label>
          <div style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
            <Input
              placeholder="nombre@sudamericano.edu.ec"
              prefix={<MailOutlined style={{ color: '#9CA3AF' }} />}
              value={emailEstudiante}
              onChange={e => { setEmailEstudiante(e.target.value); setEstudianteNoEncontrado(false) }}
              size="large"
              autoFocus
            />
            <Button size="large" onClick={buscarEstudiante} loading={buscandoEstudiante}>Buscar</Button>
          </div>

          {estudianteNoEncontrado && (
            <>
              <p style={{ fontSize: 13, color: '#94A3B8', margin: '4px 0 16px' }}>
                No encontramos este correo — completa los datos para registrarlo por primera vez.
              </p>
              <div className="form-field">
                <label className="field-label">Nombre completo</label>
                <Input value={nombreEstudiante} onChange={e => setNombreEstudiante(e.target.value)} size="large" />
              </div>
              <div className="form-field">
                <label className="field-label">Carrera</label>
                <Select
                  placeholder="Selecciona la carrera"
                  value={carreraEstudiante}
                  onChange={setCarreraEstudiante}
                  options={carrerasDisponibles.map(c => ({ value: c, label: c }))}
                  style={{ width: '100%' }}
                  size="large"
                />
              </div>
              <div className="form-field">
                <label className="field-label">Ciclo</label>
                <Select
                  placeholder="Selecciona el ciclo"
                  value={cicloEstudiante}
                  onChange={setCicloEstudiante}
                  options={OPCIONES_CICLO}
                  style={{ width: '100%' }}
                  size="large"
                />
              </div>
              <div className="form-field">
                <label className="field-label">Jornada</label>
                <div style={{ display: 'flex', gap: 8 }}>
                  {JORNADAS.map(j => (
                    <Button
                      key={j.value}
                      type={jornadaEstudiante === j.value ? 'primary' : 'default'}
                      style={jornadaEstudiante === j.value ? { background: '#00796B', borderColor: '#00796B' } : {}}
                      onClick={() => setJornadaEstudiante(j.value)}
                    >
                      {j.label}
                    </Button>
                  ))}
                </div>
              </div>
              <div className="form-field">
                <label className="field-label">Materias que cursa</label>
                <Select
                  mode="tags"
                  placeholder="Escribe y elige de las sugerencias, o presiona Enter"
                  value={materiasEstudiante}
                  onChange={setMateriasEstudiante}
                  options={opcionesMaterias}
                  tokenSeparators={[',']}
                  style={{ width: '100%' }}
                  size="large"
                />
                <p style={{ fontSize: 11, color: '#94A3B8', marginTop: 4 }}>
                  Elige de las materias existentes para evitar duplicados; si es nueva, escríbela y presiona Enter.
                </p>
              </div>
              <Button className="btn-confirmar" block size="large" onClick={crearYRegistrarEstudiante} loading={creandoEstudiante} style={{ marginTop: 8 }}>
                Registrar e ingresar
              </Button>
            </>
          )}
        </div>
      )}

      {pasoManual === 'invitado' && (
        <div className="form-field">
          <label className="field-label">Nombre completo</label>
          <Input value={nombreInvitado} onChange={e => setNombreInvitado(e.target.value)} size="large" autoFocus style={{ marginBottom: 12 }} />

          <label className="field-label">Tipo de documento</label>
          <Select
            value={tipoDocInvitado}
            onChange={setTipoDocInvitado}
            options={[{ value: 'cedula', label: 'Cédula' }, { value: 'pasaporte', label: 'Pasaporte' }]}
            style={{ width: '100%', marginBottom: 12 }}
            size="large"
          />

          <label className="field-label">Número de documento</label>
          <Input value={numeroDocInvitado} onChange={e => setNumeroDocInvitado(e.target.value)} size="large" style={{ marginBottom: 16 }} />

          <Button
            className="btn-confirmar" block size="large"
            onClick={buscarOCrearInvitado}
            loading={buscandoInvitado || creandoInvitado}
          >
            Continuar
          </Button>
          <p style={{ fontSize: 11, color: '#94A3B8', marginTop: 8 }}>
            Si ya visitó antes con este documento, se reconoce automáticamente — no hace falta volver a llenar sus datos.
          </p>
        </div>
      )}
    </>
  )
}

export default RegistroManual