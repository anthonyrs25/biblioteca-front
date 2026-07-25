import { useState, useEffect, useRef } from 'react'
import { Button, Input, Select, App, AutoComplete } from 'antd'
import {
  IdcardOutlined, ReadOutlined, UserAddOutlined,
  ArrowLeftOutlined, MailOutlined,
} from '@ant-design/icons'
import { getCarreras, buscarPorEmail, buscarPorDocumento, buscarUsuarios, crearUsuario } from '../api/biblioteca'
import type { PasoSelector } from '../config/llaverosGenerales'
import { inicialesDe } from '../utils/iniciales'
import AsignacionAcademica from './AsignacionAcademica'
import type { CarreraAsignada } from './AsignacionAcademica'
import { validarDocumento, soloDigitos } from '../utils/documento'

type PasoManual = 'tipo' | PasoSelector

// Dominio institucional: el bibliotecario solo escribe la parte de antes de la
// arroba y el sistema completa el resto, para no teclear lo mismo cada vez.
const DOMINIO = '@sudamericano.edu.ec'

// Une la parte local con el dominio. Si el usuario ya escribió una arroba
// (pegó el correo completo, o es de otro dominio), se respeta lo que puso.
function componerCorreo(parteLocal: string): string {
  const limpio = parteLocal.trim()
  if (!limpio) return ''
  if (limpio.includes('@')) return limpio
  return limpio + DOMINIO
}

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
  const [carrerasDisponibles, setCarrerasDisponibles] = useState<string[]>([])

  // ── Docente ──
  const [emailDocente, setEmailDocente] = useState('')
  const [buscandoDocente, setBuscandoDocente] = useState(false)
  const [docenteNoEncontrado, setDocenteNoEncontrado] = useState(false)
  const [apellidosDocente, setApellidosDocente] = useState('')
  const [nombresDocente, setNombresDocente] = useState('')
  const [asignacionDocente, setAsignacionDocente] = useState<CarreraAsignada[]>([])
  const [creandoDocente, setCreandoDocente] = useState(false)

  // ── Estudiante ──
  const [emailEstudiante, setEmailEstudiante] = useState('')
  const [buscandoEstudiante, setBuscandoEstudiante] = useState(false)
  const [estudianteNoEncontrado, setEstudianteNoEncontrado] = useState(false)
  const [apellidosEstudiante, setApellidosEstudiante] = useState('')
  const [nombresEstudiante, setNombresEstudiante] = useState('')
  const [asignacionEstudiante, setAsignacionEstudiante] = useState<CarreraAsignada[]>([])
  const [creandoEstudiante, setCreandoEstudiante] = useState(false)

  // ── Invitado ──
  const [apellidosInvitado, setApellidosInvitado] = useState('')
  const [nombresInvitado, setNombresInvitado] = useState('')
  const [tipoDocInvitado, setTipoDocInvitado] = useState<string>('cedula')
  const [numeroDocInvitado, setNumeroDocInvitado] = useState('')
  const [buscandoInvitado, setBuscandoInvitado] = useState(false)
  const [creandoInvitado, setCreandoInvitado] = useState(false)

  // ── Autocompletado por nombre o correo (docente / estudiante) ──
  // Guarda las coincidencias devueltas por el backend para poder recuperar
  // el usuario completo cuando se elige una opción.
  const [sugerencias, setSugerencias] = useState<any[]>([])
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    getCarreras().then((data: any[]) => setCarrerasDisponibles(data.map(c => c.nombre)))
  }, [])

  // Busca coincidencias mientras se escribe, con un pequeño retardo para no
  // disparar una petición por cada tecla. Filtra por tipoPersona para que el
  // flujo de docente no sugiera estudiantes y viceversa.
  const buscarSugerencias = (texto: string, tipoPersona: string) => {
    if (debounceRef.current) clearTimeout(debounceRef.current)
    if (texto.trim().length < 2) { setSugerencias([]); return }
    debounceRef.current = setTimeout(async () => {
      try {
        const resultados = await buscarUsuarios(texto.trim(), tipoPersona)
        setSugerencias(resultados ?? [])
      } catch {
        setSugerencias([])
      }
    }, 300)
  }

  // Opciones para el AutoComplete: muestra nombre y correo en cada fila.
  const opcionesSugerencia = sugerencias.map(u => ({
    value: String(u.id),
    label: (
      <div style={{ display: 'flex', flexDirection: 'column' }}>
        <span style={{ fontWeight: 600 }}>{u.nombre}</span>
        {u.email && <span style={{ fontSize: 12, color: '#94A3B8' }}>{u.email}</span>}
      </div>
    ),
  }))

  // Al elegir una coincidencia, se entra directo con ese usuario ya registrado.
  const elegirSugerencia = (id: string) => {
    const usuario = sugerencias.find(u => String(u.id) === id)
    if (usuario) onSeleccionar(usuario)
  }

  // ── Flujo Docente ──
  // El correo institucional es el identificador único, así no se crean
  // docentes duplicados por diferencias de escritura del nombre.
  const buscarDocente = async () => {
    const correo = componerCorreo(emailDocente)
    if (!correo) { message.warning('Ingresa el correo o el nombre'); return }
    setBuscandoDocente(true)
    setDocenteNoEncontrado(false)
    try {
      const encontrado = await buscarPorEmail(correo)
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
    if (!apellidosDocente.trim() && !nombresDocente.trim()) { message.warning('Ingresa apellidos y nombres'); return }
    if (asignacionDocente.length === 0) { message.warning('Selecciona al menos una carrera'); return }
    for (const carrera of asignacionDocente) {
      if (carrera.ciclos.length === 0) { message.warning(`Agrega al menos un ciclo en ${carrera.nombre}`); return }
      for (const ciclo of carrera.ciclos) {
        if (!ciclo.jornada) { message.warning(`Selecciona la jornada del ${ciclo.numero}° ciclo en ${carrera.nombre}`); return }
      }
    }

    setCreandoDocente(true)
    try {
      await crearUsuario({
        apellidos: apellidosDocente.trim(),
        nombres: nombresDocente.trim(),
        iniciales: inicialesDe(apellidosDocente, nombresDocente),
        email: componerCorreo(emailDocente),
        rol: 'usuario',
        tipoPersona: 'DOCENTE',
        carreras: asignacionDocente,
      })
      const creado = await buscarPorEmail(componerCorreo(emailDocente))
      onSeleccionar(creado)
    } catch {
      message.error('Error al registrar al docente')
    } finally {
      setCreandoDocente(false)
    }
  }

  // ── Flujo Estudiante ──
  const buscarEstudiante = async () => {
    const correo = componerCorreo(emailEstudiante)
    if (!correo) { message.warning('Ingresa el correo o el nombre'); return }
    setBuscandoEstudiante(true)
    setEstudianteNoEncontrado(false)
    try {
      const encontrado = await buscarPorEmail(correo)
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
    if (!apellidosEstudiante.trim() && !nombresEstudiante.trim()) { message.warning('Ingresa apellidos y nombres'); return }
    const carrera = asignacionEstudiante[0]
    if (!carrera) { message.warning('Selecciona la carrera'); return }
    const ciclo = carrera.ciclos[0]
    if (!ciclo?.jornada) { message.warning('Selecciona la jornada del ciclo'); return }

    setCreandoEstudiante(true)
    try {
      await crearUsuario({
        apellidos: apellidosEstudiante.trim(),
        nombres: nombresEstudiante.trim(),
        iniciales: inicialesDe(apellidosEstudiante, nombresEstudiante),
        email: componerCorreo(emailEstudiante),
        rol: 'usuario',
        tipoPersona: 'ESTUDIANTE',
        carreras: asignacionEstudiante,
      })
      const creado = await buscarPorEmail(componerCorreo(emailEstudiante))
      onSeleccionar(creado)
    } catch {
      message.error('Error al registrar al estudiante')
    } finally {
      setCreandoEstudiante(false)
    }
  }

  // ── Flujo Invitado ──
  const buscarOCrearInvitado = async () => {
    if (!apellidosInvitado.trim() && !nombresInvitado.trim()) { message.warning('Ingresa apellidos y nombres'); return }
    if (!numeroDocInvitado.trim()) { message.warning('Ingresa el número de documento'); return }

    const check = validarDocumento(tipoDocInvitado, numeroDocInvitado)
    if (!check.valida) { message.warning(check.mensaje); return }

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
        apellidos: apellidosInvitado.trim(),
        nombres: nombresInvitado.trim(),
        iniciales: inicialesDe(apellidosInvitado, nombresInvitado),
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

  // Campo de correo con dominio fijo a la derecha: el bibliotecario escribe
  // solo la parte local. Encima, un buscador por nombre o correo que muestra
  // coincidencias ya registradas mientras se escribe.
  const bloqueBusqueda = (
    tipoPersona: 'DOCENTE' | 'ESTUDIANTE',
    emailValor: string,
    setEmail: (v: string) => void,
    onNoEncontrado: () => void,
    buscar: () => void,
    buscando: boolean,
  ) => (
    <>
      <label className="field-label">Buscar por nombre o correo</label>
      <AutoComplete
        options={opcionesSugerencia}
        onSearch={texto => buscarSugerencias(texto, tipoPersona)}
        onSelect={elegirSugerencia}
        style={{ width: '100%', marginBottom: 12 }}
        size="large"
        placeholder="Escribe el nombre o correo de alguien ya registrado"
      />

      <label className="field-label">O ingresa el correo para registrar</label>
      <div style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
        <Input
          placeholder="nombre.apellido"
          prefix={<MailOutlined style={{ color: '#9CA3AF' }} />}
          suffix={<span style={{ color: '#94A3B8', fontSize: 13 }}>{DOMINIO}</span>}
          value={emailValor}
          onChange={e => { setEmail(e.target.value); onNoEncontrado() }}
          size="large"
          onPressEnter={buscar}
        />
        <Button size="large" onClick={buscar} loading={buscando}>Buscar</Button>
      </div>
    </>
  )

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
            <IdcardOutlined style={{ fontSize: 22, color: 'var(--marca)' }} />
            <span>
              <span className="opcion-titulo">Docente</span>
              <span className="opcion-desc">Buscar por nombre o correo, o registrar uno nuevo</span>
            </span>
          </button>
          <button className="opcion-btn" onClick={() => setPasoManual('estudiante')}>
            <ReadOutlined style={{ fontSize: 22, color: 'var(--marca)' }} />
            <span>
              <span className="opcion-titulo">Estudiante</span>
              <span className="opcion-desc">Con correo institucional, carrera y ciclo</span>
            </span>
          </button>
          <button className="opcion-btn" onClick={() => setPasoManual('invitado')}>
            <UserAddOutlined style={{ fontSize: 22, color: 'var(--marca)' }} />
            <span>
              <span className="opcion-titulo">Invitado / externo</span>
              <span className="opcion-desc">Visitante que no pertenece al instituto</span>
            </span>
          </button>
        </div>
      )}

      {pasoManual === 'docente' && (
        <div className="form-field">
          {bloqueBusqueda('DOCENTE', emailDocente, setEmailDocente,
            () => setDocenteNoEncontrado(false), buscarDocente, buscandoDocente)}

          {docenteNoEncontrado && (
            <>
              <p style={{ fontSize: 13, color: '#94A3B8', margin: '4px 0 16px' }}>
                No encontramos este correo — completa los datos para registrarlo por primera vez.
              </p>
              <div className="form-field">
                <label className="field-label">Apellidos</label>
                <Input value={apellidosDocente} onChange={e => setApellidosDocente(e.target.value)} size="large" placeholder="Ej: PÉREZ GARCÍA" style={{ marginBottom: 10 }} />
                <label className="field-label">Nombres</label>
                <Input value={nombresDocente} onChange={e => setNombresDocente(e.target.value)} size="large" placeholder="Ej: JUAN CARLOS" />
              </div>

              <AsignacionAcademica
                valor={asignacionDocente}
                onChange={setAsignacionDocente}
                carrerasDisponibles={carrerasDisponibles}
                titulo="Carreras en las que dicta"
              />

              <Button className="btn-confirmar" block size="large" onClick={crearYRegistrarDocente} loading={creandoDocente} style={{ marginTop: 8 }}>
                Registrar e ingresar
              </Button>
            </>
          )}
        </div>
      )}

      {pasoManual === 'estudiante' && (
        <div className="form-field">
          {bloqueBusqueda('ESTUDIANTE', emailEstudiante, setEmailEstudiante,
            () => setEstudianteNoEncontrado(false), buscarEstudiante, buscandoEstudiante)}

          {estudianteNoEncontrado && (
            <>
              <p style={{ fontSize: 13, color: '#94A3B8', margin: '4px 0 16px' }}>
                No encontramos este correo — completa los datos para registrarlo por primera vez.
              </p>
              <div className="form-field">
                <label className="field-label">Apellidos</label>
                <Input value={apellidosEstudiante} onChange={e => setApellidosEstudiante(e.target.value)} size="large" placeholder="Ej: PÉREZ GARCÍA" style={{ marginBottom: 10 }} />
                <label className="field-label">Nombres</label>
                <Input value={nombresEstudiante} onChange={e => setNombresEstudiante(e.target.value)} size="large" placeholder="Ej: JUAN CARLOS" />
              </div>

              <AsignacionAcademica
                valor={asignacionEstudiante}
                onChange={setAsignacionEstudiante}
                carrerasDisponibles={carrerasDisponibles}
                titulo="Carrera que cursa"
                carreraUnica
              />

              <Button className="btn-confirmar" block size="large" onClick={crearYRegistrarEstudiante} loading={creandoEstudiante} style={{ marginTop: 8 }}>
                Registrar e ingresar
              </Button>
            </>
          )}
        </div>
      )}

      {pasoManual === 'invitado' && (
        <div className="form-field">
          <label className="field-label">Apellidos</label>
          <Input value={apellidosInvitado} onChange={e => setApellidosInvitado(e.target.value)} size="large" autoFocus placeholder="Ej: PÉREZ GARCÍA" style={{ marginBottom: 10 }} />
          <label className="field-label">Nombres</label>
          <Input value={nombresInvitado} onChange={e => setNombresInvitado(e.target.value)} size="large" placeholder="Ej: JUAN CARLOS" style={{ marginBottom: 12 }} />

          <label className="field-label">Tipo de documento</label>
          <Select
            value={tipoDocInvitado}
            onChange={setTipoDocInvitado}
            options={[{ value: 'cedula', label: 'Cédula' }, { value: 'pasaporte', label: 'Pasaporte' }]}
            style={{ width: '100%', marginBottom: 12 }}
            size="large"
          />

          <label className="field-label">Número de documento</label>
          <Input
            value={numeroDocInvitado}
            onChange={e => setNumeroDocInvitado(
              tipoDocInvitado === 'cedula'
                ? soloDigitos(e.target.value).slice(0, 10)
                : e.target.value.toUpperCase()
            )}
            placeholder={tipoDocInvitado === 'cedula' ? '10 dígitos' : 'Ej: AB123456'}
            size="large"
            style={{ marginBottom: 16 }}
          />

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
