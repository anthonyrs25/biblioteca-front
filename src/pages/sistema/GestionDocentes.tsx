import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Table, Button, Modal, Form, Input, App, Tag, Divider } from 'antd'
import { ArrowLeftOutlined, EditOutlined, TeamOutlined, CreditCardOutlined, PlusOutlined } from '@ant-design/icons'
import { getDocentes, actualizarDocente, crearDocente, actualizarCiclosDocente } from '../../api/biblioteca'

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

function GestionDocentes() {
  const navigate = useNavigate()
  const { message } = App.useApp()
  const [docentes, setDocentes] = useState<any[]>([])
  const [cargando, setCargando] = useState(false)
  const [modalEditar, setModalEditar] = useState(false)
  const [modalCrear, setModalCrear] = useState(false)
  const [editando, setEditando] = useState<any | null>(null)
  const [ciclosEditando, setCiclosEditando] = useState<{ numero: number; materias: string }[]>([])
  const [formEditar] = Form.useForm()
  const [formCrear] = Form.useForm()

  const cargarDocentes = () => {
    setCargando(true)
    getDocentes()
      .then(setDocentes)
      .catch(() => message.error('Error al cargar los docentes'))
      .finally(() => setCargando(false))
  }

  useEffect(() => { cargarDocentes() }, [])

  const abrirEditar = (docente: any) => {
    setEditando(docente)
    const ciclos = docente.carreras?.[0]?.ciclos?.map((c: any) => ({
      numero: c.numero,
      materias: c.materias?.map((m: any) => m.nombre).join(', ') || '',
    })) || []
    setCiclosEditando(ciclos.length > 0 ? ciclos : [{ numero: 2, materias: '' }])
    formEditar.setFieldsValue({
      rfid: docente.rfid,
      nombre: docente.nombre,
      iniciales: docente.iniciales,
    })
    setModalEditar(true)
  }

  const handleGuardarEdicion = async () => {
    try {
      const valores = await formEditar.validateFields()
      await actualizarDocente(editando.id, {
        rfid: valores.rfid,
        nombre: valores.nombre,
        iniciales: valores.iniciales,
      })
      if (ciclosEditando.length > 0) {
        await actualizarCiclosDocente(editando.id, ciclosEditando.map(c => ({
          numero: c.numero,
          materias: c.materias.split(',').map((m: string) => m.trim()).filter(Boolean),
        })))
      }
      message.success('Docente actualizado')
      setModalEditar(false)
      cargarDocentes()
    } catch (err: any) {
      if (err?.errorFields) return
      message.error('Error al guardar — verifica que el RFID no esté en uso por otro docente')
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
      title: 'Acciones', key: 'acciones', width: 100,
      render: (_: any, docente: any) => (
        <Button size="small" icon={<EditOutlined />} onClick={() => abrirEditar(docente)}>
          Editar
        </Button>
      ),
    },
  ]

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
        <Button
          className="btn-exportar"
          icon={<PlusOutlined />}
          size="large"
          onClick={() => { formCrear.resetFields(); setModalCrear(true) }}
        >
          Nuevo docente
        </Button>
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
        onCancel={() => setModalEditar(false)}
        okText="Guardar cambios"
        cancelText="Cancelar"
        width={560}
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
            extra="Acerca el llavero al lector ESP32 y copia el UID del monitor serial."
          >
            <Input placeholder="Ej: 6AE13E3E" />
          </Form.Item>
        </Form>

        {editando && (
          <div style={{ marginTop: 8 }}>
            <Divider>Carreras y materias</Divider>
            <div style={{ fontSize: 13, color: '#4A5568', marginBottom: 12 }}>
              Carrera: <strong>{editando.carreras?.[0]?.carrera?.nombre || 'Sin carrera'}</strong>
            </div>
            {ciclosEditando.map((ciclo, i) => (
              <div key={i} style={{ background: '#F5F7FA', borderRadius: 8, padding: '12px 16px', marginBottom: 10 }}>
                <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                  <span style={{ fontSize: 13, fontWeight: 600, color: '#1A2332', whiteSpace: 'nowrap' }}>
                    Ciclo {ciclo.numero}
                  </span>
                  <Input
                    value={ciclo.materias}
                    placeholder="Materias separadas por coma"
                    onChange={e => {
                      const nuevos = [...ciclosEditando]
                      nuevos[i].materias = e.target.value
                      setCiclosEditando(nuevos)
                    }}
                  />
                  <Button
                    danger size="small"
                    onClick={() => setCiclosEditando(ciclosEditando.filter((_, j) => j !== i))}
                  >✕</Button>
                </div>
              </div>
            ))}
            <Button
              size="small"
              icon={<PlusOutlined />}
              onClick={() => {
                const maxCiclo = ciclosEditando.length > 0
                  ? Math.max(...ciclosEditando.map(c => c.numero))
                  : 1
                setCiclosEditando([...ciclosEditando, { numero: maxCiclo + 1, materias: '' }])
              }}
            >
              Agregar ciclo
            </Button>
            <div style={{ fontSize: 11, color: '#94A3B8', marginTop: 8 }}>
              Escribe las materias separadas por coma. Los cambios se aplican al guardar.
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
            <Input placeholder="Ej: 2" type="number" min={1} max={8} />
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
    </div>
  )
}

export default GestionDocentes