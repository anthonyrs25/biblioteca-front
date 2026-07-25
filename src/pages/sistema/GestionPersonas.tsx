import { useState, useEffect, useRef, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { Table, Button, Modal, Form, Input, Select, App, Tag, Divider, Popconfirm, Segmented } from 'antd'
import { ArrowLeftOutlined, EditOutlined, TeamOutlined, CreditCardOutlined, PlusOutlined, WifiOutlined, DeleteOutlined, CrownOutlined, FilterOutlined } from '@ant-design/icons'
import { useModo } from '../../context/ModoContext'
import {
  getUsuarios, actualizarUsuario, crearUsuario, reemplazarAsignacion,
  getUltimoEscaneoDesde, getUsuarioByRfid,
  cambiarRolUsuario, eliminarUsuario, getPapeleraUsuarios, restaurarUsuario, getCarreras,
} from '../../api/biblioteca'
import { escucharDatosActualizados } from '../../utils/refresco'
import AsignacionAcademica from '../../components/AsignacionAcademica'
import type { CarreraAsignada } from '../../components/AsignacionAcademica'
import { inicialesDe } from '../../utils/iniciales'
import { validarDocumento } from '../../utils/documento'

const OPCIONES_CICLO = [1, 2, 3, 4].map(n => ({ value: n, label: `${n}° Ciclo` }))
const OPCIONES_JORNADA = [
  { value: 'matutino', label: 'Matutino' },
  { value: 'vespertino', label: 'Vespertino' },
  { value: 'nocturno', label: 'Nocturno' },
]

type Tipo = 'DOCENTE' | 'ESTUDIANTE' | 'INVITADO'
type Segmento = 'TODOS' | Tipo

const ETIQUETAS: Record<Tipo, string> = {
  DOCENTE: 'Docente',
  ESTUDIANTE: 'Estudiante',
  INVITADO: 'Invitado',
}
const etiquetaDe = (t: Tipo) => ETIQUETAS[t] || 'Usuario'

interface Props {
  // Sin prop = página unificada de Usuarios (arranca en "Todos").
  // Con prop = las rutas viejas (/docentes, /estudiantes, /invitados) siguen igual.
  tipoPersona?: Tipo
}

function GestionPersonas({ tipoPersona }: Props) {
  const navigate = useNavigate()
  const { message } = App.useApp()
  const { modoAdminActivo } = useModo()

  const [segmento, setSegmento] = useState<Segmento>(tipoPersona ?? 'TODOS')
  useEffect(() => { setSegmento(tipoPersona ?? 'TODOS') }, [tipoPersona])

  const esTodos = segmento === 'TODOS'
  const esDocente = segmento === 'DOCENTE'
  const esInvitado = segmento === 'INVITADO'
  const etiqueta = esTodos ? 'usuario' : esDocente ? 'docente' : esInvitado ? 'invitado' : 'estudiante'
  const etiquetaPlural = esTodos ? 'Usuarios' : esDocente ? 'Docentes' : esInvitado ? 'Invitados' : 'Estudiantes'

  const [personas, setPersonas] = useState<any[]>([])
  const [carrerasDisponibles, setCarrerasDisponibles] = useState<string[]>([])
  const [cargando, setCargando] = useState(false)
  const [modalEditar, setModalEditar] = useState(false)
  const [modalCrear, setModalCrear] = useState(false)
  const [editando, setEditando] = useState<any | null>(null)
  const [asignacionEditar, setAsignacionEditar] = useState<CarreraAsignada[]>([])
  const [asignacionCrear, setAsignacionCrear] = useState<CarreraAsignada[]>([])
  const [formEditar] = Form.useForm()
  const [formCrear] = Form.useForm()
  const [modalPapelera, setModalPapelera] = useState(false)
  const [papelera, setPapelera] = useState<any[]>([])
  const [cargandoPapelera, setCargandoPapelera] = useState(false)
  const [pageSize, setPageSize] = useState(10)
  const [busquedaTexto, setBusquedaTexto] = useState('')

  // El tipo de la persona que se está EDITANDO se deduce de su registro,
  // no del segmento activo — así editar funciona también desde "Todos".
  const tipoEditando: Tipo = (editando?.tipoPersona as Tipo) || (esTodos ? 'DOCENTE' : (segmento as Tipo))
  const editarEsInvitado = tipoEditando === 'INVITADO'

  // Tipo elegido en el formulario de creación (solo relevante en "Todos").
  const tipoCrearSeleccionado = Form.useWatch('tipoPersonaNuevo', formCrear) as Tipo | undefined
  const tipoCrear: Tipo | undefined = esTodos ? tipoCrearSeleccionado : (segmento as Tipo)
  const crearEsInvitado = tipoCrear === 'INVITADO'
  const crearEsEstudiante = tipoCrear === 'ESTUDIANTE'

  // ── Filtros ──
  const [filtroCarrera, setFiltroCarrera] = useState<string | undefined>()
  const [filtroCiclo, setFiltroCiclo] = useState<number | undefined>()
  const [filtroJornada, setFiltroJornada] = useState<string | undefined>()

  // Vinculación de llavero: puede estar activa desde el modal de EDITAR
  // o desde el de CREAR — se guarda cuál para escribir en el form correcto.
  const [vinculando, setVinculando] = useState<null | 'editar' | 'crear'>(null)
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null)

  useEffect(() => {
    getCarreras().then((data: any[]) => setCarrerasDisponibles(data.map(c => c.nombre)))
  }, [])

  const abrirPapelera = () => {
    setModalPapelera(true)
    setCargandoPapelera(true)
    getPapeleraUsuarios(esTodos ? undefined : (segmento as Tipo))
      .then(setPapelera)
      .finally(() => setCargandoPapelera(false))
  }

  const handleRestaurar = async (id: number) => {
    try {
      await restaurarUsuario(id)
      message.success('Restaurado correctamente')
      setPapelera(papelera.filter(d => d.id !== id))
      cargarPersonas()
    } catch {
      message.error('Error al restaurar')
    }
  }

  const handleEliminar = async (id: number) => {
    try {
      await eliminarUsuario(id)
      message.success('Eliminado (movido a la papelera)')
      cargarPersonas()
    } catch {
      message.error('Error al eliminar')
    }
  }

  const handleCambiarRol = async (id: number, rol: string) => {
    try {
      await cambiarRolUsuario(id, rol)
      message.success('Rol actualizado')
      cargarPersonas()
    } catch {
      message.error('Error al cambiar el rol')
    }
  }

  const cargarPersonas = () => {
    setCargando(true)
    getUsuarios(esTodos ? undefined : (segmento as Tipo))
      // El staff (admin/bibliotecario) tiene su propia página en Gestión de
      // Staff — aquí solo se administran los usuarios de la biblioteca.
      .then((data: any[]) => setPersonas(data.filter((p: any) => p.tipoPersona !== 'STAFF')))
      .catch(() => message.error(`Error al cargar los ${etiquetaPlural.toLowerCase()}`))
      .finally(() => setCargando(false))
  }

  useEffect(() => { cargarPersonas() }, [segmento])
  useEffect(() => escucharDatosActualizados(cargarPersonas), [segmento])
  useEffect(() => () => { if (pollRef.current) clearInterval(pollRef.current) }, [])

  const personasFiltradas = useMemo(() => {
    let resultado = personas

    if (busquedaTexto.trim()) {
      const q = busquedaTexto.trim().toLowerCase()
      resultado = resultado.filter(p => p.nombre?.toLowerCase().includes(q) || p.email?.toLowerCase().includes(q))
    }

    if (esInvitado) return resultado

    if (!filtroCarrera && !filtroCiclo && !filtroJornada) return resultado

    // Busca, para cada persona, si existe UNA combinación carrera+ciclo que
    // cumpla TODOS los filtros activos a la vez — así "Carrera=Software" y
    // "Ciclo=3" no se mezclan si ese ciclo en realidad pertenece a otra
    // carrera distinta que también tiene esa persona.
    return resultado.filter(p => {
      const carreras = p.carreras ?? []
      return carreras.some((dc: any) => {
        if (filtroCarrera && dc.carrera?.nombre !== filtroCarrera) return false
        return (dc.ciclos ?? []).some((c: any) => {
          if (filtroCiclo && c.numero !== filtroCiclo) return false
          if (filtroJornada && c.jornada !== filtroJornada) return false
          return true
        })
      })
    })
  }, [personas, filtroCarrera, filtroCiclo, filtroJornada, esInvitado, busquedaTexto])

  const limpiarFiltros = () => {
    setFiltroCarrera(undefined)
    setFiltroCiclo(undefined)
    setFiltroJornada(undefined)
  }

  const cambiarSegmento = (val: Segmento) => {
    setSegmento(val)
    limpiarFiltros()
    setBusquedaTexto('')
  }

  const construirAsignacion = (persona: any): CarreraAsignada[] =>
    (persona.carreras ?? [])
      .filter((dc: any) => dc.carrera)
      .map((dc: any) => ({
        nombre: dc.carrera.nombre,
        ciclos: (dc.ciclos ?? []).map((c: any) => ({
          numero: c.numero,
          jornada: c.jornada,
          materias: (c.materias ?? []).map((m: any) => m.nombre),
        })),
      }))

  const abrirEditar = (persona: any) => {
    setEditando(persona)
    setAsignacionEditar(construirAsignacion(persona))
    formEditar.setFieldsValue({
      rfid: persona.rfid,
      // Si la persona es de antes de la separación, puede no tener apellidos/
      // nombres por separado; en ese caso se muestra el nombre combinado en
      // el campo Apellidos para que el bibliotecario lo reordene al editar.
      apellidos: persona.apellidos ?? persona.nombre ?? '',
      nombres: persona.nombres ?? '',
      iniciales: persona.iniciales,
      tipoDocumento: persona.tipoDocumento,
      numeroDocumento: persona.numeroDocumento,
    })
    setModalEditar(true)
  }

  // ───── Vincular llavero — 100% software, sin tocar el ESP32 ─────
  const detenerVinculacion = () => {
    setVinculando(null)
    if (pollRef.current) { clearInterval(pollRef.current); pollRef.current = null }
  }

  const iniciarVinculacion = (destino: 'editar' | 'crear') => {
    setVinculando(destino)
    const form = destino === 'editar' ? formEditar : formCrear
    const desde = new Date().toISOString()
    pollRef.current = setInterval(async () => {
      try {
        const scan = await getUltimoEscaneoDesde(desde)
        if (!scan) return
        detenerVinculacion()
        const yaAsignado = await getUsuarioByRfid(scan.uid).catch(() => null)
        // Al crear, cualquier llavero con dueño se rechaza; al editar,
        // se permite re-leer el llavero de la misma persona.
        if (yaAsignado && (destino === 'crear' || yaAsignado.id !== editando?.id)) {
          message.warning(`Ese llavero ya está vinculado a ${yaAsignado.nombre}. Usa uno distinto.`)
          return
        }
        form.setFieldValue('rfid', scan.uid)
        message.success('Llavero detectado y cargado en el formulario')
      } catch {
        // sin escaneo todavía, seguir esperando
      }
    }, 1500)
  }

  // Valida la asignación académica y la deja lista para el backend.
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
      }
    }
    return asignacion.map(c => ({
      nombre: c.nombre,
      ciclos: c.ciclos.map(ci => ({
        numero: ci.numero,
        jornada: ci.jornada,
        materias: [],
      })),
    }))
  }

  const handleGuardarEdicion = async () => {
    try {
      const valores = await formEditar.validateFields()

      // Para no-invitados, la asignación académica se valida antes de tocar nada
      const carreras = editarEsInvitado ? [] : prepararCarreras(asignacionEditar)
      if (!editarEsInvitado && !carreras) return

      await actualizarUsuario(editando.id, {
        rfid: valores.rfid,
        apellidos: valores.apellidos,
        nombres: valores.nombres,
        iniciales: inicialesDe(valores.apellidos, valores.nombres),
        ...(editarEsInvitado ? { tipoDocumento: valores.tipoDocumento, numeroDocumento: valores.numeroDocumento } : {}),
      })

      if (!editarEsInvitado && carreras) {
        // Una sola llamada atómica: el backend resuelve altas, bajas y
        // modificaciones de carreras y ciclos en una transacción.
        await reemplazarAsignacion(editando.id, carreras)
      }

      message.success(`${etiquetaDe(tipoEditando)} actualizado`)
      detenerVinculacion()
      setModalEditar(false)
      cargarPersonas()
    } catch (err: any) {
      if (err?.errorFields) return
      message.error(err?.response?.data?.message || 'Error al guardar — verifica que el RFID no esté en uso por otra persona')
    }
  }

  const handleCrearPersona = async () => {
    try {
      const valores = await formCrear.validateFields()
      const tipoFinal: Tipo = esTodos ? valores.tipoPersonaNuevo : (segmento as Tipo)
      const tipoFinalEsInvitado = tipoFinal === 'INVITADO'

      // La asignación académica es obligatoria salvo para invitados
      const carreras = tipoFinalEsInvitado ? undefined : prepararCarreras(asignacionCrear)
      if (!tipoFinalEsInvitado && !carreras) return

      await crearUsuario({
        apellidos: valores.apellidos,
        nombres: valores.nombres,
        iniciales: inicialesDe(valores.apellidos, valores.nombres),
        rfid: valores.rfid || undefined,
        email: valores.email || undefined,
        tipoPersona: tipoFinal,
        tipoDocumento: tipoFinalEsInvitado ? valores.tipoDocumento : undefined,
        numeroDocumento: tipoFinalEsInvitado ? valores.numeroDocumento : undefined,
        carreras: carreras ?? undefined,
      })
      message.success(`${etiquetaDe(tipoFinal)} creado correctamente`)
      detenerVinculacion()
      setModalCrear(false)
      formCrear.resetFields()
      setAsignacionCrear([])
      cargarPersonas()
    } catch (err: any) {
      if (err?.errorFields) return
      message.error(err?.response?.data?.message || `Error al crear el ${etiqueta}`)
    }
  }

  const renderCarreras = (d: any) => {
    const carreras = d.carreras ?? []
    if (carreras.length === 0) return <span style={{ color: '#94A3B8' }}>Sin carrera</span>
    return carreras.map((dc: any) => (
      <div key={dc.carrera?.nombre} style={{ marginBottom: 4 }}>
        <Tag color="cyan">{dc.carrera?.nombre}</Tag>
        {dc.ciclos?.map((c: any, i: number) => (
          <Tag key={i} color="blue">{c.numero}° {c.jornada ? `· ${c.jornada}` : ''}</Tag>
        ))}
      </div>
    ))
  }

  const renderDocumento = (d: any) => d.numeroDocumento
    ? <Tag>{d.tipoDocumento === 'cedula' ? 'Cédula' : 'Pasaporte'}: {d.numeroDocumento}</Tag>
    : <span style={{ color: '#94A3B8' }}>Sin documento</span>

  const columnas = [
    {
      title: 'Nombre', dataIndex: 'nombre', key: 'nombre',
      sorter: (a: any, b: any) => a.nombre.localeCompare(b.nombre),
      defaultSortOrder: 'ascend' as const,
    },
    ...(esTodos ? [{
      title: 'Tipo', dataIndex: 'tipoPersona', key: 'tipoPersona', width: 120,
      render: (t: Tipo) => (
        <Tag color={t === 'DOCENTE' ? 'geekblue' : t === 'ESTUDIANTE' ? 'green' : 'purple'}>
          {etiquetaDe(t)}
        </Tag>
      ),
    }] : []),
    ...(esTodos || esInvitado ? [] : [
      { title: 'Correo', dataIndex: 'email', key: 'email', render: (email: string) => email || <span style={{ color: '#94A3B8' }}>—</span> },
    ]),
    {
      title: 'RFID', dataIndex: 'rfid', key: 'rfid',
      render: (rfid: string) => rfid
        ? <Tag color="cyan"><CreditCardOutlined style={{ marginRight: 4 }} />{rfid}</Tag>
        : <Tag color="default">Sin llavero</Tag>,
    },
    ...(esTodos ? [{
      title: 'Carrera / Documento', key: 'detalle',
      render: (_: any, d: any) => d.tipoPersona === 'INVITADO' ? renderDocumento(d) : renderCarreras(d),
    }] : esInvitado ? [{
      title: 'Documento', key: 'documento',
      render: (_: any, d: any) => renderDocumento(d),
    }] : [{
      title: 'Carreras / Ciclos', key: 'carrera',
      render: (_: any, d: any) => renderCarreras(d),
    }]),
    { title: 'Préstamos activos', dataIndex: 'prestamosActivos', key: 'prestamosActivos', width: 140 },
    {
      title: 'Rol', dataIndex: 'rol', key: 'rol', width: 150,
      render: (rol: string, persona: any) => modoAdminActivo ? (
        <Select
          value={rol}
          size="small"
          style={{ width: 130 }}
          onChange={val => handleCambiarRol(persona.id, val)}
          options={[
            { value: 'usuario', label: 'Usuario' },
            { value: 'bibliotecario', label: 'Bibliotecario' },
            { value: 'admin', label: 'Administrador' },
          ]}
        />
      ) : (
        <Tag color={rol === 'admin' ? 'gold' : rol === 'bibliotecario' ? 'blue' : 'default'}>
          {rol === 'admin' && <CrownOutlined style={{ marginRight: 4 }} />}
          {rol || 'usuario'}
        </Tag>
      ),
    },
    {
      title: 'Acciones', key: 'acciones', width: 160,
      render: (_: any, persona: any) => modoAdminActivo ? (
        <div style={{ display: 'flex', gap: 8 }}>
          <Button size="small" icon={<EditOutlined />} onClick={() => abrirEditar(persona)}>
            Editar
          </Button>
          <Popconfirm
            title="¿Eliminar este registro?"
            description={
              persona.rfid
                ? 'Se moverá a la papelera y su llavero RFID quedará libre para otra persona. Al restaurarlo habrá que vincularle un llavero de nuevo.'
                : 'Se moverá a la papelera — se puede restaurar después.'
            }
            onConfirm={() => handleEliminar(persona.id)}
            okText="Sí, eliminar" cancelText="Cancelar"
          >
            <Button size="small" danger icon={<DeleteOutlined />} />
          </Popconfirm>
        </div>
      ) : <span style={{ color: '#CBD5E1' }}>—</span>,
    },
  ]

  const hayFiltrosActivos = filtroCarrera || filtroCiclo || filtroJornada

  return (
    <div className="reportes-page">
      <div className="reportes-header">
        <div>
          <button className="btn-volver" onClick={() => navigate('/sistema')}>
            <ArrowLeftOutlined /> Volver al sistema
          </button>
          <h1 className="reportes-titulo">
            <TeamOutlined style={{ marginRight: 12, color: '#00796B' }} />
            Gestión de {etiquetaPlural}
          </h1>
          <p className="reportes-subtitulo">
            Administra los {etiquetaPlural.toLowerCase()} registrados · {personasFiltradas.length} de {personas.length}
          </p>
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          {modoAdminActivo && (
            <Button icon={<DeleteOutlined />} size="large" onClick={abrirPapelera}>
              Papelera
            </Button>
          )}
          <Button
            className="btn-exportar"
            icon={<PlusOutlined />}
            size="large"
            onClick={() => { formCrear.resetFields(); setAsignacionCrear([]); setModalCrear(true) }}
          >
            Nuevo {etiqueta}
          </Button>
        </div>
      </div>

      <Segmented
        value={segmento}
        onChange={val => cambiarSegmento(val as Segmento)}
        options={[
          { value: 'TODOS', label: 'Todos' },
          { value: 'DOCENTE', label: 'Docentes' },
          { value: 'ESTUDIANTE', label: 'Estudiantes' },
          { value: 'INVITADO', label: 'Invitados' },
        ]}
        style={{ marginBottom: 16 }}
      />

      <div style={{ display: 'flex', gap: 12, marginBottom: 16, flexWrap: 'wrap', alignItems: 'center' }}>
        <Input
          placeholder={`Buscar ${etiqueta} por nombre o correo...`}
          allowClear
          style={{ maxWidth: 340 }}
          value={busquedaTexto}
          onChange={e => setBusquedaTexto(e.target.value)}
        />
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginLeft: 'auto' }}>
          <span style={{ fontSize: 13, color: '#4A5568' }}>Mostrar:</span>
          <Select
            value={pageSize}
            onChange={setPageSize}
            style={{ width: 100 }}
            options={[
              { value: 10, label: '10' },
              { value: 25, label: '25' },
              { value: 50, label: '50' },
              { value: 9999, label: 'Todos' },
            ]}
          />
        </div>
      </div>

      {!esInvitado && (
        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginBottom: 16, padding: '12px 16px', background: '#F5F7FA', borderRadius: 10, border: '1px solid #E2E8F0', alignItems: 'center' }}>
          <FilterOutlined style={{ color: '#4A5568' }} />
          <Select
            placeholder="Carrera" allowClear style={{ width: 220 }}
            value={filtroCarrera} onChange={setFiltroCarrera}
            options={carrerasDisponibles.map(c => ({ value: c, label: c }))}
            showSearch
            optionFilterProp="label"
          />
          <Select
            placeholder="Ciclo" allowClear style={{ width: 120 }}
            value={filtroCiclo} onChange={setFiltroCiclo}
            options={OPCIONES_CICLO}
          />
          <Select
            placeholder="Jornada" allowClear style={{ width: 140 }}
            value={filtroJornada} onChange={setFiltroJornada}
            options={OPCIONES_JORNADA}
          />
          {hayFiltrosActivos && (
            <Button size="small" onClick={limpiarFiltros}>Limpiar filtros</Button>
          )}
        </div>
      )}

      <div className="reporte-card">
        <Table
          columns={columnas}
          dataSource={personasFiltradas}
          rowKey="id"
          loading={cargando}
          pagination={pageSize >= 9999 ? false : { pageSize, showTotal: (total) => `${total} ${etiquetaPlural.toLowerCase()}` }}
        />
      </div>

      {/* Modal editar */}
      <Modal
        title={`Editar ${etiquetaDe(tipoEditando).toLowerCase()}`}
        open={modalEditar}
        onOk={handleGuardarEdicion}
        onCancel={() => { detenerVinculacion(); setModalEditar(false) }}
        okText="Guardar cambios"
        cancelText="Cancelar"
        width={640}
        destroyOnClose
      >
        <Form form={formEditar} layout="vertical" style={{ marginTop: 20 }}>
          <Form.Item name="apellidos" label="Apellidos" rules={[{ required: true, message: 'Ingresa los apellidos' }]}>
            <Input placeholder="Ej: PÉREZ GARCÍA" />
          </Form.Item>
          <Form.Item name="nombres" label="Nombres">
            <Input placeholder="Ej: JUAN CARLOS" />
          </Form.Item>
          <Form.Item
            label="UID del llavero RFID"
            extra="Puedes escribirlo a mano, o usar el botón de la derecha y acercar el llavero al lector."
          >
            <div style={{ display: 'flex', gap: 8 }}>
              <Form.Item name="rfid" noStyle>
                <Input placeholder="Ej: 6AE13E3E" disabled={vinculando === 'editar'} />
              </Form.Item>
              <Button
                icon={<WifiOutlined />}
                onClick={vinculando === 'editar' ? detenerVinculacion : () => iniciarVinculacion('editar')}
                danger={vinculando === 'editar'}
              >
                {vinculando === 'editar' ? 'Cancelar' : 'Vincular llavero'}
              </Button>
            </div>
          </Form.Item>
          {vinculando === 'editar' && (
            <div style={{ fontSize: 13, color: '#00796B', marginTop: -8, marginBottom: 16 }}>
              <WifiOutlined style={{ marginRight: 6 }} />
              Esperando... acerca el llavero nuevo al lector RFID de la biblioteca.
            </div>
          )}
          {editarEsInvitado && (
            <>
              <Form.Item
                name="numeroDocumento"
                label="Número de documento"
                rules={[
                  { required: true, message: 'Ingresa el número' },
                  ({ getFieldValue }) => ({
                    validator(_, value) {
                      if (!value) return Promise.resolve()
                      const tipo = getFieldValue('tipoDocumento') || 'cedula'
                      const check = validarDocumento(tipo, value)
                      return check.valida
                        ? Promise.resolve()
                        : Promise.reject(new Error(check.mensaje))
                    },
                  }),
                ]}
              >
                <Input placeholder="Ej: 0102030405" maxLength={20} />
              </Form.Item>
            </>
          )}
        </Form>

        {editando && !editarEsInvitado && (
          <div style={{ marginTop: 8 }}>
            <Divider>Asignación académica</Divider>
            <AsignacionAcademica
              valor={asignacionEditar}
              onChange={setAsignacionEditar}
              carrerasDisponibles={carrerasDisponibles}
              titulo={tipoEditando === 'DOCENTE' ? 'Carreras en las que dicta' : 'Carrera que cursa'}
              carreraUnica={tipoEditando === 'ESTUDIANTE'}
            />
            <div style={{ fontSize: 11, color: '#94A3B8', marginTop: 8 }}>
              Todo se aplica junto al presionar "Guardar cambios".
            </div>
          </div>
        )}
      </Modal>

      {/* Modal crear */}
      <Modal
        title={`Nuevo ${etiqueta}`}
        open={modalCrear}
        onOk={handleCrearPersona}
        onCancel={() => { detenerVinculacion(); setModalCrear(false) }}
        okText={tipoCrear ? `Crear ${etiquetaDe(tipoCrear).toLowerCase()}` : 'Crear'}
        cancelText="Cancelar"
        width={640}
      >
        <Form form={formCrear} layout="vertical" style={{ marginTop: 20 }}>
          {esTodos && (
            <Form.Item
              name="tipoPersonaNuevo"
              label="Tipo de usuario"
              rules={[{ required: true, message: 'Selecciona el tipo' }]}
            >
              <Select
                placeholder="Docente, estudiante o invitado"
                options={[
                  { value: 'DOCENTE', label: 'Docente' },
                  { value: 'ESTUDIANTE', label: 'Estudiante' },
                  { value: 'INVITADO', label: 'Invitado / externo' },
                ]}
              />
            </Form.Item>
          )}

          {tipoCrear && (
            <>
              <Form.Item name="apellidos" label="Apellidos" rules={[{ required: true, message: 'Ingresa los apellidos' }]}>
                <Input placeholder="Ej: PÉREZ GARCÍA" />
              </Form.Item>
              <Form.Item name="nombres" label="Nombres">
                <Input placeholder="Ej: JUAN CARLOS" />
              </Form.Item>
              <Form.Item
                name="email"
                label={crearEsEstudiante ? 'Correo institucional' : 'Correo (opcional)'}
                rules={crearEsEstudiante ? [{ type: 'email', message: 'Correo inválido' }] : []}
              >
                <Input placeholder="nombre@sudamericano.edu.ec" />
              </Form.Item>
              <Form.Item
                label="UID del llavero RFID (opcional)"
                extra="Puedes escribirlo a mano, usar el botón y acercar el llavero al lector, o asignarlo después."
              >
                <div style={{ display: 'flex', gap: 8 }}>
                  <Form.Item name="rfid" noStyle>
                    <Input placeholder="Ej: 6AE13E3E" disabled={vinculando === 'crear'} />
                  </Form.Item>
                  <Button
                    icon={<WifiOutlined />}
                    onClick={vinculando === 'crear' ? detenerVinculacion : () => iniciarVinculacion('crear')}
                    danger={vinculando === 'crear'}
                  >
                    {vinculando === 'crear' ? 'Cancelar' : 'Vincular llavero'}
                  </Button>
                </div>
              </Form.Item>
              {vinculando === 'crear' && (
                <div style={{ fontSize: 13, color: '#00796B', marginTop: -8, marginBottom: 16 }}>
                  <WifiOutlined style={{ marginRight: 6 }} />
                  Esperando... acerca el llavero nuevo al lector RFID de la biblioteca.
                </div>
              )}
              {crearEsInvitado ? (
                <>
                  <Divider style={{ margin: '8px 0 16px' }}>Documento</Divider>
                  <Form.Item name="tipoDocumento" label="Tipo de documento" rules={[{ required: true, message: 'Selecciona el tipo de documento' }]}>
                    <Select placeholder="Selecciona el tipo" options={[{ value: 'cedula', label: 'Cédula' }, { value: 'pasaporte', label: 'Pasaporte' }]} />
                  </Form.Item>
                  <Form.Item
                    name="numeroDocumento"
                    label="Número de documento"
                    rules={[
                      { required: true, message: 'Ingresa el número' },
                      ({ getFieldValue }) => ({
                        validator(_, value) {
                          if (!value) return Promise.resolve()
                          const tipo = getFieldValue('tipoDocumento') || 'cedula'
                          const check = validarDocumento(tipo, value)
                          return check.valida
                            ? Promise.resolve()
                            : Promise.reject(new Error(check.mensaje))
                        },
                      }),
                    ]}
                  >
                    <Input placeholder="Ej: 0102030405" maxLength={20} />
                  </Form.Item>
                </>
              ) : (
                <>
                  <Divider style={{ margin: '8px 0 16px' }}>Asignación académica</Divider>
                  <AsignacionAcademica
                    valor={asignacionCrear}
                    onChange={setAsignacionCrear}
                    carrerasDisponibles={carrerasDisponibles}
                    titulo={tipoCrear === 'DOCENTE' ? 'Carreras en las que dicta' : 'Carrera que cursa'}
                    carreraUnica={tipoCrear === 'ESTUDIANTE'}
                  />
                </>
              )}
            </>
          )}
        </Form>
      </Modal>

      <Modal
        title={`Papelera de ${etiquetaPlural.toLowerCase()}`}
        open={modalPapelera}
        onCancel={() => setModalPapelera(false)}
        footer={null}
        width={600}
      >
        {papelera.length === 0 && !cargandoPapelera ? (
          <p style={{ color: '#94A3B8', textAlign: 'center', padding: '30px 0' }}>La papelera está vacía.</p>
        ) : (
          <Table
            dataSource={papelera}
            loading={cargandoPapelera}
            rowKey="id"
            pagination={{ pageSize: 8 }}
            size="small"
            columns={[
              { title: 'Nombre', dataIndex: 'nombre' },
              { title: 'Iniciales', dataIndex: 'iniciales', width: 90 },
              {
                title: '', key: 'restaurar', width: 110,
                render: (_: any, persona: any) => (
                  <Button size="small" onClick={() => handleRestaurar(persona.id)}>Restaurar</Button>
                ),
              },
            ]}
          />
        )}
      </Modal>
    </div>
  )
}

export default GestionPersonas