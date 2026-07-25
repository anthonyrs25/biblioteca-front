import { useState, useEffect, useRef } from 'react'
import { Button, Input, Select, App, AutoComplete, Tag } from 'antd'
import {
  IdcardOutlined, ReadOutlined, UserAddOutlined,
  ArrowLeftOutlined, MailOutlined, SearchOutlined,
} from '@ant-design/icons'
import { getCarreras, buscarPorEmail, buscarPorDocumento, buscarUsuarios, crearUsuario } from '../api/biblioteca'
import type { PasoSelector } from '../config/llaverosGenerales'
import { inicialesDe } from '../utils/iniciales'
import AsignacionAcademica from './AsignacionAcademica'
import type { CarreraAsignada } from './AsignacionAcademica'
import { validarDocumento, soloDigitos } from '../utils/documento'

type PasoManual = 'tipo' | PasoSelector

const DOMINIO = '@sudamericano.edu.ec'

// Une la parte local con el dominio. Si el usuario ya escribió una arroba
// (pegó el correo completo, o es de otro dominio), se respeta lo que puso.
function componerCorreo(parteLocal: string): string {
  const limpio = parteLocal.trim()
  if (!limpio) return ''
  if (limpio.includes('@')) return limpio
  return limpio + DOMINIO
}

// Cada tipo de usuario tiene su identidad visual (título, color, icono), para
// que el bibliotecario siempre sepa a quién está buscando o registrando, sin
// importar si llegó por clic o por un llavero/tarjeta general.
const META_TIPO = {
  docente: { titulo: 'Docente', color: 'cyan', icono: <IdcardOutlined /> },
  estudiante: { titulo: 'Estudiante', color: 'purple', icono: <ReadOutlined /> },
  invitado: { titulo: 'Invitado / externo', color: 'magenta', icono: <UserAddOutlined /> },
} as const

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
  const [sugerencias, setSugerencias] = useState<any[]>([])
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    getCarreras().then((data: any[]) => setCarrerasDisponibles(data.map(c => c.nombre)))
  }, [])

  // Busca coincidencias mientras se escribe, filtrando por el tipo en curso
  // para que el flujo de docente no sugiera estudiantes y viceversa.
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

  const opcionesSugerencia = sugerencias.map(u => ({
    value: String(u.id),
    label: (
      <div style={{ display: 'flex', flexDirection: 'column' }}>
        <span style={{ fontWeight: 600 }}>{u.nombre}</span>
        {u.email && <span style={{ fontSize: 12, color: '#94A3B8' }}>{u.email}</span>}
      </div>
    ),
  }))

  const elegirSugerencia = (id: string) => {
    const usuario = sugerencias.find(u => String(u.id) === id)
    if (usuario) onSeleccionar(usuario)
  }

  // ── Flujo Docente ──
  const buscarDocente = async () => {
    const correo = componerCorreo(emailDocente)
    if (!correo) { message.warning('Escribe el correo para buscar'); return }
    setBuscandoDocente(true)
    setDocenteNoEncontrado(false)
    try {
      const encontrado = await buscarPorEmail(correo)
      if (encontrado) {
        onSeleccionar(encontrado)
      } else {
        // No existe → pasar directo a registro (tu punto 1)
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
    if (!correo) { message.warning('Escribe el correo para buscar'); return }
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

  // Encabezado con el tipo de usuario en curso: título claro + tag de color.
  // Así el bibliotecario siempre sabe a quién está buscando/registrando.
  const encabezadoTipo = (tipo: 'docente' | 'estudiante' | 'invitado', accion: 'Buscar' | 'Registrar') => {
    const meta = META_TIPO[tipo]
    return (
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
        <span style={{ fontSize: 20, color: 'var(--marca)' }}>{meta.icono}</span>
        <span style={{ fontSize: 17, fontWeight: 700, color: '#12303A' }}>
          {accion} {meta.titulo.toLowerCase()}
        </span>
        <Tag color={meta.color} style={{ margin: 0, marginLeft: 'auto' }}>{meta.titulo}</Tag>
      </div>
    )
  }

  // Bloque de búsqueda unificado (docente / estudiante). Un solo campo con el
  // dominio precargado; el autocompletado sugiere coincidencias ya registradas,
  // y tanto Enter como el botón Buscar disparan la búsqueda. Si no existe,
  // el flujo pasa solo a la parte de registro.
  const bloqueBusqueda = (
    tipoPersona: 'DOCENTE' | 'ESTUDIANTE',
    emailValor: string,
    setEmail: (v: string) => void,
    onNoEncontrado: () => void,
    buscar: () => void,
    buscando: boolean,
  ) => (
    <>
      <label className="field-label">Correo institucional o nombre</label>
      <div style={{ display: 'flex', gap: 8 }}>
        <AutoComplete
          options={opcionesSugerencia}
          onSearch={texto => { buscarSugerencias(texto, tipoPersona); setEmail(texto); onNoEncontrado() }}
          onSelect={elegirSugerencia}
          value={emailValor}
          style={{ flex: 1 }}
          size="large"
        >
          <Input
            placeholder="nombre.apellido o nombre de la persona"
            prefix={<SearchOutlined style={{ color: '#9CA3AF' }} />}
            suffix={<span style={{ color: '#94A3B8', fontSize: 13 }}>{DOMINIO}</span>}
            onPressEnter={buscar}
          />
        </AutoComplete>
        <Button type="primary" size="large" icon={<SearchOutlined />} onClick={buscar} loading={buscando}
          style={{ background: 'var(--marca)', borderColor: 'var(--marca)' }}>
          Buscar
        </Button>
      </div>
      <p style={{ fontSize: 11, color: '#94A3B8', marginTop: 6 }}>
        Escribe para ver coincidencias ya registradas. Si no aparece, presiona Buscar o Enter para registrarlo.
      </p>
    </>
  )

  // Muestra fijo, en la parte de registro, a quién se está registrando —
  // reemplaza al buscador (que ya no aporta) para no confundir.
  const cintaCorreo = (correo: string) => (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 8,
      background: '#E6F7F6', border: '1px solid #9FDEDC',
      borderRadius: 8, padding: '10px 14px', marginBottom: 16,
    }}>
      <MailOutlined style={{ color: '#00796B' }} />
      <span style={{ fontSize: 13, color: '#12303A' }}>
        Registrando: <strong>{correo}</strong>
      </span>
    </div>
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
          {/* Mientras busca: encabezado "Buscar docente" + buscador.
              Al no encontrar: encabezado "Registrar docente" + cinta con el correo,
              y el buscador desaparece para no confundir (tu punto 3). */}
          {!docenteNoEncontrado ? (
            <>
              {encabezadoTipo('docente', 'Buscar')}
              {bloqueBusqueda('DOCENTE', emailDocente, setEmailDocente,
                () => setDocenteNoEncontrado(false), buscarDocente, buscandoDocente)}
            </>
          ) : (
            <>
              {encabezadoTipo('docente', 'Registrar')}
              {cintaCorreo(componerCorreo(emailDocente))}
              <div className="form-field">
                <label className="field-label">Apellidos</label>
                <Input value={apellidosDocente} onChange={e => setApellidosDocente(e.target.value)} size="large" autoFocus placeholder="Ej: PÉREZ GARCÍA" style={{ marginBottom: 10 }} />
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
          {!estudianteNoEncontrado ? (
            <>
              {encabezadoTipo('estudiante', 'Buscar')}
              {bloqueBusqueda('ESTUDIANTE', emailEstudiante, setEmailEstudiante,
                () => setEstudianteNoEncontrado(false), buscarEstudiante, buscandoEstudiante)}
            </>
          ) : (
            <>
              {encabezadoTipo('estudiante', 'Registrar')}
              {cintaCorreo(componerCorreo(emailEstudiante))}
              <div className="form-field">
                <label className="field-label">Apellidos</label>
                <Input value={apellidosEstudiante} onChange={e => setApellidosEstudiante(e.target.value)} size="large" autoFocus placeholder="Ej: PÉREZ GARCÍA" style={{ marginBottom: 10 }} />
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
          {/* El invitado no se busca por correo (no tiene institucional): se
              identifica por documento. El encabezado mantiene la coherencia
              visual con los otros tipos. */}
          {encabezadoTipo('invitado', 'Registrar')}
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
            onPressEnter={buscarOCrearInvitado}
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
