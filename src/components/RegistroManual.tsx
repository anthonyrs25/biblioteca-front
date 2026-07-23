import { useState, useEffect } from 'react'
import { Button, Input, Select, App } from 'antd'
import {
  IdcardOutlined, ReadOutlined, UserAddOutlined,
  ArrowLeftOutlined, MailOutlined,
} from '@ant-design/icons'
import { getCarreras, getMateriasPorCarrera, buscarPorEmail, buscarPorDocumento, crearUsuario } from '../api/biblioteca'
import type { PasoSelector } from '../config/llaverosGenerales'
import { normalizarMaterias } from '../utils/materias'
import { calcularIniciales } from '../utils/iniciales'
import AsignacionAcademica from './AsignacionAcademica'
import type { CarreraAsignada } from './AsignacionAcademica'
import { validarDocumento, soloDigitos } from '../utils/documento'

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
  const [carrerasDisponibles, setCarrerasDisponibles] = useState<string[]>([])
  const [materiasPorCarrera, setMateriasPorCarrera] = useState<Record<string, string[]>>({})

  // ── Docente ──
  const [emailDocente, setEmailDocente] = useState('')
  const [buscandoDocente, setBuscandoDocente] = useState(false)
  const [docenteNoEncontrado, setDocenteNoEncontrado] = useState(false)
  const [nombreDocente, setNombreDocente] = useState('')
  const [asignacionDocente, setAsignacionDocente] = useState<CarreraAsignada[]>([])
  const [creandoDocente, setCreandoDocente] = useState(false)

  // ── Estudiante ──
  const [emailEstudiante, setEmailEstudiante] = useState('')
  const [buscandoEstudiante, setBuscandoEstudiante] = useState(false)
  const [estudianteNoEncontrado, setEstudianteNoEncontrado] = useState(false)
  const [nombreEstudiante, setNombreEstudiante] = useState('')
  const [asignacionEstudiante, setAsignacionEstudiante] = useState<CarreraAsignada[]>([])
  const [creandoEstudiante, setCreandoEstudiante] = useState(false)

  // ── Invitado ──
  const [nombreInvitado, setNombreInvitado] = useState('')
  const [tipoDocInvitado, setTipoDocInvitado] = useState<string>('cedula')
  const [numeroDocInvitado, setNumeroDocInvitado] = useState('')
  const [buscandoInvitado, setBuscandoInvitado] = useState(false)
  const [creandoInvitado, setCreandoInvitado] = useState(false)

  useEffect(() => {
    getCarreras().then((data: any[]) => setCarrerasDisponibles(data.map(c => c.nombre)))
    getMateriasPorCarrera().then(setMateriasPorCarrera).catch(() => setMateriasPorCarrera({}))
  }, [])

  // Valida la asignación académica y la deja lista para enviar al backend:
  // materias normalizadas y sin ciclos vacíos.
  const prepararCarreras = (asignacion: CarreraAsignada[]): any[] | null => {
    if (asignacion.length === 0) {
      message.warning('Selecciona al menos una carrera')
      return null
    }
    for (const carrera of asignacion) {
      if (carrera.ciclos.length === 0) {
        message.warning(`Agrega al menos un ciclo en ${carrera.nombre}`)
        return null
      }
      for (const ciclo of carrera.ciclos) {
        if (!ciclo.jornada) {
          message.warning(`Selecciona la jornada del ${ciclo.numero}° ciclo en ${carrera.nombre}`)
          return null
        }
        if (normalizarMaterias(ciclo.materias).length === 0) {
          message.warning(`Agrega al menos una materia en el ${ciclo.numero}° ciclo de ${carrera.nombre}`)
          return null
        }
      }
    }
    return asignacion.map(c => ({
      nombre: c.nombre,
      ciclos: c.ciclos.map(ci => ({
        numero: ci.numero,
        jornada: ci.jornada,
        materias: normalizarMaterias(ci.materias),
      })),
    }))
  }

  // ── Flujo Docente ──
  // El correo institucional es el identificador único, así no se crean
  // docentes duplicados por diferencias de escritura del nombre.
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
    const carreras = prepararCarreras(asignacionDocente)
    if (!carreras) return

    setCreandoDocente(true)
    try {
      await crearUsuario({
        nombre: nombreDocente.trim(),
        // Las iniciales son solo el avatar visual: se calculan del nombre
        // en vez de pedírselas al bibliotecario en cada registro.
        iniciales: calcularIniciales(nombreDocente),
        email: emailDocente.trim(),
        rol: 'usuario',
        tipoPersona: 'DOCENTE',
        carreras,
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
    const carreras = prepararCarreras(asignacionEstudiante)
    if (!carreras) return

    setCreandoEstudiante(true)
    try {
      await crearUsuario({
        nombre: nombreEstudiante.trim(),
        iniciales: calcularIniciales(nombreEstudiante),
        email: emailEstudiante.trim(),
        rol: 'usuario',
        tipoPersona: 'ESTUDIANTE',
        carreras,
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
        nombre: nombreInvitado.trim(),
        iniciales: calcularIniciales(nombreInvitado),
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
            <IdcardOutlined style={{ fontSize: 22, color: 'var(--marca)' }} />
            <span>
              <span className="opcion-titulo">Docente</span>
              <span className="opcion-desc">Buscar por correo o registrar uno nuevo</span>
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
          <label className="field-label">Correo institucional</label>
          <div style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
            <Input
              placeholder="nombre@sudamericano.edu.ec"
              prefix={<MailOutlined style={{ color: '#9CA3AF' }} />}
              value={emailDocente}
              onChange={e => { setEmailDocente(e.target.value); setDocenteNoEncontrado(false) }}
              size="large"
              autoFocus
              onPressEnter={buscarDocente}
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

              <AsignacionAcademica
                valor={asignacionDocente}
                onChange={setAsignacionDocente}
                carrerasDisponibles={carrerasDisponibles}
                materiasPorCarrera={materiasPorCarrera}
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
          <label className="field-label">Correo institucional</label>
          <div style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
            <Input
              placeholder="nombre@sudamericano.edu.ec"
              prefix={<MailOutlined style={{ color: '#9CA3AF' }} />}
              value={emailEstudiante}
              onChange={e => { setEmailEstudiante(e.target.value); setEstudianteNoEncontrado(false) }}
              size="large"
              autoFocus
              onPressEnter={buscarEstudiante}
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

              <AsignacionAcademica
                valor={asignacionEstudiante}
                onChange={setAsignacionEstudiante}
                carrerasDisponibles={carrerasDisponibles}
                materiasPorCarrera={materiasPorCarrera}
                titulo="Carreras que cursa"
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