import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Button, Statistic, Modal, Input, Empty, Switch, Tag, Select, App } from 'antd'
import {
  WifiOutlined, BookOutlined, SwapOutlined, TeamOutlined,
  LogoutOutlined, BarChartOutlined, SettingOutlined, SearchOutlined, CrownOutlined,
  IdcardOutlined, ReadOutlined, UserAddOutlined, ArrowLeftOutlined, MailOutlined,
} from '@ant-design/icons'
import Logo from '../../components/Logo'
import { getUsuarios, getLibros, buscarPorEmail, buscarPorDocumento, crearUsuario, getCarreras, esKioscoActivo, setKioscoActivo } from '../../api/biblioteca'
import { useModo } from '../../context/ModoContext'

const OPCIONES_CICLO = [1, 2, 3, 4].map(n => ({ value: n, label: `${n}° Ciclo` }))

const JORNADAS = [
  { value: 'matutino', label: '🌅 Matutino' },
  { value: 'vespertino', label: '🌇 Vespertino' },
  { value: 'nocturno', label: '🌙 Nocturno' },
]

type PasoManual = 'tipo' | 'docente' | 'estudiante' | 'invitado'

function SistemaHome({ onDetectado }: { onDetectado: (docente: any) => void }) {
  const navigate = useNavigate()
  const { message } = App.useApp()
  const { esAdmin, modoAdminActivo, activarModoAdmin, volverAModoBibliotecario } = useModo()
  const [pulso, setPulso] = useState(false)
  const [totalLibros, setTotalLibros] = useState(0)
  const [prestamosActivos, setPrestamosActivos] = useState(0)
  const [totalUsuarios, setTotalUsuarios] = useState(0)
  const [docentes, setDocentes] = useState<any[]>([])
  const [modalManual, setModalManual] = useState(false)
  const [busquedaManual, setBusquedaManual] = useState('')
  const [pasoManual, setPasoManual] = useState<PasoManual>('tipo')
  const [kiosco, setKiosco] = useState(esKioscoActivo())

  // ── Estudiante ──
  const [emailEstudiante, setEmailEstudiante] = useState('')
  const [buscandoEstudiante, setBuscandoEstudiante] = useState(false)
  const [estudianteNoEncontrado, setEstudianteNoEncontrado] = useState(false)
  const [nombreEstudiante, setNombreEstudiante] = useState('')
  const [carreraEstudiante, setCarreraEstudiante] = useState<string | undefined>()
  const [cicloEstudiante, setCicloEstudiante] = useState<number | undefined>()
  const [jornadaEstudiante, setJornadaEstudiante] = useState<string | undefined>()
  const [materiasEstudiante, setMateriasEstudiante] = useState('')
  const [creandoEstudiante, setCreandoEstudiante] = useState(false)
  const [carrerasDisponibles, setCarrerasDisponibles] = useState<string[]>([])

  // ── Invitado ──
  const [nombreInvitado, setNombreInvitado] = useState('')
  const [tipoDocInvitado, setTipoDocInvitado] = useState<string>('cedula')
  const [numeroDocInvitado, setNumeroDocInvitado] = useState('')
  const [buscandoInvitado, setBuscandoInvitado] = useState(false)
  const [creandoInvitado, setCreandoInvitado] = useState(false)

  const cambiarKiosco = (activo: boolean) => {
    setKioscoActivo(activo)
    setKiosco(activo)
  }

  useEffect(() => {
    getCarreras().then((data: any[]) => setCarrerasDisponibles(data.map(c => c.nombre)))
  }, [])

  useEffect(() => {
    const t = setInterval(() => setPulso(p => !p), 1500)
    return () => clearInterval(t)
  }, [])

  useEffect(() => {
    getLibros().then(libros => {
      setTotalLibros(libros.reduce((a: number, b: any) => a + b.totalEjemplares, 0))
    })
    getUsuarios().then(data => {
      const todos = data.filter((d: any) => d.rol === 'usuario')
      setDocentes(todos.filter((d: any) => d.tipoPersona === 'DOCENTE'))
      setTotalUsuarios(todos.length)
      const total = todos.reduce((a: number, d: any) => a + d.prestamosActivos, 0)
      setPrestamosActivos(total)
    })
  }, [])

  const docentesFiltrados = docentes.filter((d: any) =>
    d.nombre?.toLowerCase().includes(busquedaManual.toLowerCase()),
  )

  const cerrarModalManual = () => {
    setModalManual(false)
    setPasoManual('tipo')
    setBusquedaManual('')
    setEmailEstudiante('')
    setEstudianteNoEncontrado(false)
    setNombreEstudiante('')
    setCarreraEstudiante(undefined)
    setCicloEstudiante(undefined)
    setJornadaEstudiante(undefined)
    setMateriasEstudiante('')
    setNombreInvitado('')
    setNumeroDocInvitado('')
  }

  const seleccionarManual = (docente: any) => {
    cerrarModalManual()
    onDetectado(docente)
  }

  // ── Flujo Estudiante ──
  const buscarEstudiante = async () => {
    if (!emailEstudiante.trim()) { message.warning('Ingresa el correo institucional'); return }
    setBuscandoEstudiante(true)
    setEstudianteNoEncontrado(false)
    try {
      const encontrado = await buscarPorEmail(emailEstudiante.trim())
      if (encontrado) {
        seleccionarManual(encontrado)
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
    if (!materiasEstudiante.trim()) { message.warning('Ingresa al menos una materia'); return }

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
            materias: materiasEstudiante.split(',').map(m => m.trim()).filter(Boolean),
            jornada: jornadaEstudiante,
          }],
        }],
      })
      // Se vuelve a pedir con las relaciones completas (carreras/ciclos) para que
      // el panel de Uso de Biblioteca funcione igual que con un docente.
      const creado = await buscarPorEmail(emailEstudiante.trim())
      seleccionarManual(creado)
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
        seleccionarManual(encontrado)
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
      seleccionarManual(creado)
    } catch {
      message.error('Error al registrar al invitado')
    } finally {
      setCreandoInvitado(false)
    }
  }

  const handleLogout = () => {
    localStorage.removeItem('biblioteca_token')
    localStorage.removeItem('biblioteca_usuario')
    navigate('/')
  }

  return (
    <div className="home-page">
      <div className="home-header">
        <div className="home-header-left"><Logo /></div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16, flex: 1 }}>
          {esAdmin && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, background: modoAdminActivo ? '#FEF3C7' : '#F5F7FA', padding: '6px 12px', borderRadius: 10 }}>
              <Tag color={modoAdminActivo ? 'gold' : 'default'} style={{ margin: 0 }}>
                {modoAdminActivo ? <><CrownOutlined /> Administrador</> : 'Bibliotecario'}
              </Tag>
              <Switch
                checked={modoAdminActivo}
                onChange={checked => checked ? activarModoAdmin() : volverAModoBibliotecario()}
                size="small"
              />
            </div>
          )}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, background: kiosco ? '#E0F2F1' : '#F5F7FA', padding: '6px 12px', borderRadius: 10 }}>
            <Tag color={kiosco ? 'cyan' : 'default'} style={{ margin: 0 }}>
              <WifiOutlined style={{ marginRight: 4 }} />
              Lector RFID
            </Tag>
            <Switch checked={kiosco} onChange={cambiarKiosco} size="small" />
          </div>
          <Button onClick={() => navigate('/sistema/reportes')} icon={<BarChartOutlined />} className="btn-reportes">
            Reportes
          </Button>
          <Button onClick={() => setModalManual(true)} icon={<TeamOutlined />} className="btn-reportes">
            Registro manual
          </Button>
          <Button onClick={() => navigate('/sistema/gestion')} icon={<SettingOutlined />} className="btn-reportes">
            Gestión
          </Button>
          <Button onClick={handleLogout} icon={<LogoutOutlined />} className="btn-salir" style={{ marginLeft: 'auto' }}>
            Salir
          </Button>
        </div>
      </div>

      <div className="home-hero">
        <div className="hero-left">
          <div className="hero-badge">
            <WifiOutlined /> {kiosco ? 'Esperando tarjeta RFID' : 'Lector RFID desactivado en este dispositivo'}
          </div>
          <h1 className="hero-title">
            Sistema de<br /><span>Gestión</span><br />Bibliotecaria
          </h1>
          <p className="hero-subtitle">
            {kiosco
              ? 'Acerque su tarjeta RFID al lector para registrar préstamos, devoluciones y uso de sala.'
              : 'Active el interruptor "Lector RFID" para que este dispositivo reciba los escaneos del lector.'}
          </p>
        </div>
        <div className="hero-right">
          <div className="blob-container">
            <div className="blob blob-1" /><div className="blob blob-2" /><div className="blob blob-3" />
            <div className="blob-shine" />
            <div className="radar-container">
              <div className={`radar-ring ring-1 ${pulso && kiosco ? 'pulso' : ''}`} />
              <div className={`radar-ring ring-2 ${pulso && kiosco ? 'pulso' : ''}`} />
              <div className={`radar-ring ring-3 ${pulso && kiosco ? 'pulso' : ''}`} />
              <div className="radar-center">
                <WifiOutlined style={{ fontSize: 24, color: '#fff' }} />
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="stats-row">
        <div className="stat-glass" style={{ cursor: 'pointer' }} onClick={() => navigate('/sistema/gestion/libros')}>
          <BookOutlined style={{ fontSize: 20, color: '#00796B', marginBottom: 8 }} />
          <Statistic title="Libros registrados" value={totalLibros}
            valueStyle={{ color: '#1A2332', fontSize: 32, fontWeight: 800 }} />
        </div>
        <div className="stat-glass" style={{ cursor: 'pointer' }} onClick={() => navigate('/sistema/reportes?tab=prestamos')}>
          <SwapOutlined style={{ fontSize: 20, color: '#00796B', marginBottom: 8 }} />
          <Statistic title="Préstamos activos" value={prestamosActivos}
            valueStyle={{ color: '#1A2332', fontSize: 32, fontWeight: 800 }} />
        </div>
        <div className="stat-glass" style={{ cursor: 'pointer' }} onClick={() => navigate('/sistema/gestion/usuarios')}>
          <TeamOutlined style={{ fontSize: 20, color: '#00796B', marginBottom: 8 }} />
          <Statistic title="Usuarios registrados" value={totalUsuarios}
            valueStyle={{ color: '#1A2332', fontSize: 32, fontWeight: 800 }} />
        </div>
      </div>

      <Modal
        title="Registrar manualmente"
        open={modalManual}
        onCancel={cerrarModalManual}
        footer={null}
        destroyOnClose
        width={pasoManual === 'tipo' ? 420 : 480}
      >
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
                <span className="opcion-desc">Buscar entre los docentes ya registrados</span>
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
              <Empty description="No se encontraron docentes" />
            ) : (
              <div style={{ maxHeight: 360, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 8 }}>
                {docentesFiltrados.map((docente: any) => (
                  <button
                    key={docente.id}
                    className="opcion-btn"
                    onClick={() => seleccionarManual(docente)}
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
                  <Input
                    placeholder="Ej: Programación, Base de Datos, Matemáticas"
                    value={materiasEstudiante}
                    onChange={e => setMateriasEstudiante(e.target.value)}
                    size="large"
                  />
                  <p style={{ fontSize: 11, color: '#94A3B8', marginTop: 4 }}>Escribe las materias separadas por coma.</p>
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
      </Modal>
    </div>
  )
}

export default SistemaHome