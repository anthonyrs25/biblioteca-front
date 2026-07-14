import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { Table, Button, Modal, Form, Input, Select, App, Tag, Divider, Popconfirm } from 'antd'
import { ArrowLeftOutlined, EditOutlined, TeamOutlined, CreditCardOutlined, PlusOutlined, WifiOutlined, DeleteOutlined, CrownOutlined } from '@ant-design/icons'
import { useModo } from '../../context/ModoContext'
import {
  getDocentes, actualizarDocente, crearDocente, actualizarCiclosDocente,
  agregarCarreraDocente, quitarCarreraDocente, getUltimoEscaneoDesde, getDocenteByRfid,
  cambiarRolDocente, eliminarDocente, getPapeleraDocentes, restaurarDocente,
} from '../../api/biblioteca'

const CARRERAS_DISPONIBLES = [
  'Desarrollo de Software',
  'Diseño Gráfico',
  'Gastronomía',
  'Marketing Digital y Negocios',
  'Turismo',
  'Enfermería',
  'Contabilidad y Asesoría Tributaria',
  'Redes y Telecomunicaciones',
  'Electricidad',
  'Talento Humano',
]

const OPCIONES_CICLO = [1, 2, 3, 4].map(n => ({ value: n, label: `${n}° Ciclo` }))

type CicloEditando = { numero: number; materias: string }
type CarreraEditando = { nombre: string; ciclos: CicloEditando[] }

function GestionDocentes() {
  const navigate = useNavigate()
  const { message } = App.useApp()
  const { modoAdminActivo } = useModo()
  const [docentes, setDocentes] = useState<any[]>([])
  const [cargando, setCargando] = useState(false)
  const [modalEditar, setModalEditar] = useState(false)
  const [modalCrear, setModalCrear] = useState(false)
  const [editando, setEditando] = useState<any | null>(null)
  const [carrerasEditando, setCarrerasEditando] = useState<CarreraEditando[]>([])
  const [carreraNuevaSel, setCarreraNuevaSel] = useState<string | undefined>()
  const [formEditar] = Form.useForm()
  const [formCrear] = Form.useForm()
  const [modalPapelera, setModalPapelera] = useState(false)
  const [papelera, setPapelera] = useState<any[]>([])
  const [cargandoPapelera, setCargandoPapelera] = useState(false)

  const [vinculando, setVinculando] = useState(false)
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const abrirPapelera = () => {
    setModalPapelera(true)
    setCargandoPapelera(true)
    getPapeleraDocentes().then(setPapelera).finally(() => setCargandoPapelera(false))
  }

  const handleRestaurar = async (id: number) => {
    try {
      await restaurarDocente(id)
      message.success('Docente restaurado')
      setPapelera(papelera.filter(d => d.id !== id))
      cargarDocentes()
    } catch {
      message.error('Error al restaurar')
    }
  }

  const handleEliminar = async (id: number) => {
    try {
      await eliminarDocente(id)
      message.success('Docente eliminado (movido a la papelera)')
      cargarDocentes()
    } catch {
      message.error('Error al eliminar')
    }
  }

  const handleCambiarRol = async (id: number, rol: string) => {
    try {
      await cambiarRolDocente(id, rol)
      message.success('Rol actualizado')
      cargarDocentes()
    } catch {
      message.error('Error al cambiar el rol')
    }
  }

  const cargarDocentes = () => {
    setCargando(true)
    getDocentes()
      .then(setDocentes)
      .catch(() => message.error('Error al cargar los docentes'))
      .finally(() => setCargando(false))
  }

  useEffect(() => { cargarDocentes() }, [])
  useEffect(() => () => { if (pollRef.current) clearInterval(pollRef.current) }, [])

  const construirCarrerasEditando = (docente: any): CarreraEditando[] =>
    (docente.carreras ?? [])
      .filter((dc: any) => dc.carrera)
      .map((dc: any) => ({
        nombre: dc.carrera.nombre,
        ciclos: (dc.ciclos ?? []).map((c: any) => ({
          numero: c.numero,
          materias: (c.materias ?? []).map((m: any) => m.nombre).join(', '),
        })),
      }))

  const abrirEditar = (docente: any) => {
    setEditando(docente)
    setCarrerasEditando(construirCarrerasEditando(docente))
    formEditar.setFieldsValue({
      rfid: docente.rfid,
      nombre: docente.nombre,
      iniciales: docente.iniciales,
    })
    setModalEditar(true)
  }

  // ───── Vincular llavero nuevo — 100% software, sin tocar el ESP32 ─────
  const detenerVinculacion = () => {
    setVinculando(false)
    if (pollRef.current) { clearInterval(pollRef.current); pollRef.current = null }
  }

  const iniciarVinculacion = () => {
    setVinculando(true)
    const desde = new Date().toISOString()
    pollRef.current = setInterval(async () => {
      try {
        const scan = await getUltimoEscaneoDesde(desde)
        if (!scan) return
        detenerVinculacion()
        const yaAsignado = await getDocenteByRfid(scan.uid).catch(() => null)
        if (yaAsignado && yaAsignado.id !== editando?.id) {
          message.warning(`Ese llavero ya está vinculado a ${yaAsignado.nombre}. Usa uno distinto.`)
          return
        }
        formEditar.setFieldValue('rfid', scan.uid)
        message.success('Llavero detectado y cargado en el formulario')
      } catch {
        // sin escaneo todavía, seguir esperando
      }
    }, 1500)
  }

  const handleGuardarEdicion = async () => {
    try {
      const valores = await formEditar.validateFields()
      await actualizarDocente(editando.id, {
        rfid: valores.rfid,
        nombre: valores.nombre,
        iniciales: valores.iniciales,
      })
      for (const carrera of carrerasEditando) {
        await actualizarCiclosDocente(editando.id, carrera.nombre, carrera.ciclos.map(c => ({
          numero: c.numero,
          materias: c.materias.split(',').map((m: string) => m.trim()).filter(Boolean),
        })))
      }
      message.success('Docente actualizado')
      detenerVinculacion()
      setModalEditar(false)
      cargarDocentes()
    } catch (err: any) {
      if (err?.errorFields) return
      message.error('Error al guardar — verifica que el RFID no esté en uso por otro docente')
    }
  }

  const handleAgregarCarrera = async () => {
    if (!carreraNuevaSel || !editando) return
    try {
      const res = await agregarCarreraDocente(editando.id, carreraNuevaSel)
      if (res.ok === false) { message.warning(res.mensaje); return }
      setCarrerasEditando([...carrerasEditando, { nombre: carreraNuevaSel, ciclos: [{ numero: 2, materias: '' }] }])
      setCarreraNuevaSel(undefined)
    } catch {
      message.error('Error al agregar la carrera')
    }
  }

  const handleQuitarCarrera = async (nombre: string) => {
    if (!editando) return
    try {
      await quitarCarreraDocente(editando.id, nombre)
      setCarrerasEditando(carrerasEditando.filter(c => c.nombre !== nombre))
      message.success('Carrera removida del docente')
    } catch {
      message.error('Error al quitar la carrera')
    }
  }

  const handleCrearDocente = async () => {
    try {
      const valores = await formCrear.validateFields()
      await crearDocente({
        nombre: valores.nombre,
        iniciales: valores.iniciales,
        rfid: valores.rfid || undefined,
        carreras: valores.carrera ? [{
          nombre: valores.carrera,
          ciclos: [{
            numero: parseInt(valores.ciclo) || 1,
            materias: valores.materias
              ? valores.materias.split(',').map((m: string) => m.trim()).filter(Boolean)
              : [],
          }],
        }] : undefined,
      })
      message.success('Docente creado correctamente')
      setModalCrear(false)
      formCrear.resetFields()
      cargarDocentes()
    } catch (err: any) {
      if (err?.errorFields) return
      message.error('Error al crear el docente')
    }
  }

  const columnas = [
    { title: 'Nombre', dataIndex: 'nombre', key: 'nombre' },
    { title: 'Iniciales', dataIndex: 'iniciales', key: 'iniciales', width: 90 },
    {
      title: 'RFID', dataIndex: 'rfid', key: 'rfid',
      render: (rfid: string) => rfid
        ? <Tag color="cyan"><CreditCardOutlined style={{ marginRight: 4 }} />{rfid}</Tag>
        : <Tag color="default">Sin llavero</Tag>,
    },
    {
      title: 'Carrera', key: 'carrera',
      render: (_: any, d: any) => {
        const carreras = d.carreras?.map((dc: any) => dc.carrera?.nombre).filter(Boolean)
        return carreras?.length > 0
          ? carreras.map((c: string) => <Tag key={c}>{c}</Tag>)
          : <span style={{ color: '#94A3B8' }}>Sin carrera</span>
      },
    },
    { title: 'Préstamos activos', dataIndex: 'prestamosActivos', key: 'prestamosActivos', width: 140 },
    {
      title: 'Rol', dataIndex: 'rol', key: 'rol', width: 150,
      render: (rol: string, docente: any) => modoAdminActivo ? (
        <Select
          value={rol}
          size="small"
          style={{ width: 130 }}
          onChange={val => handleCambiarRol(docente.id, val)}
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
      render: (_: any, docente: any) => modoAdminActivo ? (
        <div style={{ display: 'flex', gap: 8 }}>
          <Button size="small" icon={<EditOutlined />} onClick={() => abrirEditar(docente)}>
            Editar
          </Button>
          <Popconfirm
            title="¿Eliminar este docente?"
            description="Se moverá a la papelera — se puede restaurar después."
            onConfirm={() => handleEliminar(docente.id)}
            okText="Sí, eliminar" cancelText="Cancelar"
          >
            <Button size="small" danger icon={<DeleteOutlined />} />
          </Popconfirm>
        </div>
      ) : <span style={{ color: '#CBD5E1' }}>—</span>,
    },
  ]

  const carrerasNoAsignadas = CARRERAS_DISPONIBLES.filter(
    c => !carrerasEditando.some(ce => ce.nombre === c)
  )

  return (
    <div className="reportes-page">
      <div className="reportes-header">
        <div>
          <button className="btn-volver" onClick={() => navigate('/sistema')}>
            <ArrowLeftOutlined /> Volver al sistema
          </button>
          <h1 className="reportes-titulo">
            <TeamOutlined style={{ marginRight: 12, color: '#00796B' }} />
            Gestión de Docentes
          </h1>
          <p className="reportes-subtitulo">Administra los docentes registrados en el sistema</p>
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
            onClick={() => { formCrear.resetFields(); setModalCrear(true) }}
          >
            Nuevo docente
          </Button>
        </div>
      </div>

      <div className="reporte-card">
        <Table
          columns={columnas}
          dataSource={docentes}
          rowKey="id"
          loading={cargando}
          pagination={{ pageSize: 10 }}
        />
      </div>

      {/* Modal editar */}
      <Modal
        title="Editar docente"
        open={modalEditar}
        onOk={handleGuardarEdicion}
        onCancel={() => { detenerVinculacion(); setModalEditar(false) }}
        okText="Guardar cambios"
        cancelText="Cancelar"
        width={600}
        destroyOnClose
      >
        <Form form={formEditar} layout="vertical" style={{ marginTop: 20 }}>
          <Form.Item name="nombre" label="Nombre completo" rules={[{ required: true }]}>
            <Input />
          </Form.Item>
          <Form.Item name="iniciales" label="Iniciales" rules={[{ required: true }]}>
            <Input maxLength={3} />
          </Form.Item>
          <Form.Item
            name="rfid"
            label="UID del llavero RFID"
            extra="Puedes escribirlo a mano, o usar el botón de la derecha y acercar el llavero al lector."
          >
            <div style={{ display: 'flex', gap: 8 }}>
              <Input placeholder="Ej: 6AE13E3E" disabled={vinculando} />
              <Button
                icon={<WifiOutlined />}
                onClick={vinculando ? detenerVinculacion : iniciarVinculacion}
                danger={vinculando}
              >
                {vinculando ? 'Cancelar' : 'Vincular llavero'}
              </Button>
            </div>
          </Form.Item>
          {vinculando && (
            <div style={{ fontSize: 13, color: '#00796B', marginTop: -8, marginBottom: 16 }}>
              <WifiOutlined style={{ marginRight: 6 }} />
              Esperando... acerca el llavero nuevo al lector RFID de la biblioteca.
            </div>
          )}
        </Form>

        {editando && (
          <div style={{ marginTop: 8 }}>
            <Divider>Carreras y materias</Divider>

            {carrerasEditando.map(carrera => (
              <div key={carrera.nombre} style={{ marginBottom: 16, border: '1px solid #E2E8F0', borderRadius: 10, padding: 14 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                  <strong style={{ color: '#1A2332' }}>{carrera.nombre}</strong>
                  <Popconfirm
                    title="¿Quitar esta carrera del docente?"
                    description="Se eliminarán sus ciclos y materias asociados."
                    onConfirm={() => handleQuitarCarrera(carrera.nombre)}
                    okText="Sí, quitar" cancelText="Cancelar"
                  >
                    <Button size="small" danger>Quitar carrera</Button>
                  </Popconfirm>
                </div>

                {carrera.ciclos.map((ciclo, i) => (
                  <div key={i} style={{ background: '#F5F7FA', borderRadius: 8, padding: '10px 14px', marginBottom: 8 }}>
                    <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                      <Select
                        value={ciclo.numero}
                        options={OPCIONES_CICLO}
                        style={{ width: 110 }}
                        onChange={val => {
                          setCarrerasEditando(carrerasEditando.map(c => c.nombre !== carrera.nombre ? c : {
                            ...c, ciclos: c.ciclos.map((cc, j) => j === i ? { ...cc, numero: val } : cc),
                          }))
                        }}
                      />
                      <Input
                        value={ciclo.materias}
                        placeholder="Materias separadas por coma"
                        onChange={e => {
                          const valor = e.target.value
                          setCarrerasEditando(carrerasEditando.map(c => c.nombre !== carrera.nombre ? c : {
                            ...c, ciclos: c.ciclos.map((cc, j) => j === i ? { ...cc, materias: valor } : cc),
                          }))
                        }}
                      />
                      <Button
                        danger size="small"
                        onClick={() => setCarrerasEditando(carrerasEditando.map(c => c.nombre !== carrera.nombre ? c : {
                          ...c, ciclos: c.ciclos.filter((_, j) => j !== i),
                        }))}
                      >✕</Button>
                    </div>
                  </div>
                ))}

                <Button
                  size="small"
                  icon={<PlusOutlined />}
                  onClick={() => setCarrerasEditando(carrerasEditando.map(c => c.nombre !== carrera.nombre ? c : {
                    ...c, ciclos: [...c.ciclos, { numero: 1, materias: '' }],
                  }))}
                >
                  Agregar ciclo
                </Button>
              </div>
            ))}

            {carrerasNoAsignadas.length > 0 && (
              <div style={{ display: 'flex', gap: 8, marginTop: 4 }}>
                <Select
                  placeholder="Agregar otra carrera..."
                  options={carrerasNoAsignadas.map(c => ({ value: c, label: c }))}
                  value={carreraNuevaSel}
                  onChange={setCarreraNuevaSel}
                  style={{ flex: 1 }}
                />
                <Button icon={<PlusOutlined />} onClick={handleAgregarCarrera} disabled={!carreraNuevaSel}>
                  Agregar
                </Button>
              </div>
            )}
            <div style={{ fontSize: 11, color: '#94A3B8', marginTop: 8 }}>
              Escribe las materias separadas por coma. Los cambios de materias se aplican al guardar; agregar/quitar carrera se aplica al instante.
            </div>
          </div>
        )}
      </Modal>

      {/* Modal crear */}
      <Modal
        title="Nuevo docente"
        open={modalCrear}
        onOk={handleCrearDocente}
        onCancel={() => setModalCrear(false)}
        okText="Crear docente"
        cancelText="Cancelar"
        width={560}
      >
        <Form form={formCrear} layout="vertical" style={{ marginTop: 20 }}>
          <Form.Item name="nombre" label="Nombre completo" rules={[{ required: true }]}>
            <Input placeholder="Ej: Ing. Juan Pérez" />
          </Form.Item>
          <Form.Item name="iniciales" label="Iniciales" rules={[{ required: true }]}>
            <Input placeholder="Ej: JP" maxLength={3} />
          </Form.Item>
          <Form.Item name="rfid" label="UID del llavero RFID">
            <Input placeholder="Ej: 6AE13E3E (opcional, se puede asignar después)" />
          </Form.Item>
          <Divider style={{ margin: '8px 0 16px' }}>Carrera (opcional)</Divider>
          <Form.Item name="carrera" label="Carrera">
            <select
              style={{ width: '100%', padding: '8px 12px', borderRadius: 8, border: '1.5px solid #E2E8F0', color: '#1A2332' }}
              onChange={e => formCrear.setFieldValue('carrera', e.target.value)}
            >
              <option value="">Sin carrera por ahora</option>
              {CARRERAS_DISPONIBLES.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </Form.Item>
          <Form.Item name="ciclo" label="Número de ciclo">
            <Select placeholder="Selecciona el ciclo" options={OPCIONES_CICLO} />
          </Form.Item>
          <Form.Item
            name="materias"
            label="Materias"
            extra="Escribe las materias separadas por coma"
          >
            <Input.TextArea rows={2} placeholder="Ej: Programación, Base de Datos, Matemáticas" />
          </Form.Item>
        </Form>
      </Modal>

      <Modal
        title="Papelera de docentes"
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
                render: (_: any, docente: any) => (
                  <Button size="small" onClick={() => handleRestaurar(docente.id)}>Restaurar</Button>
                ),
              },
            ]}
          />
        )}
      </Modal>
    </div>
  )
}

export default GestionDocentes