import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Table, Button, Modal, Form, Input, App, Tag } from 'antd'
import { ArrowLeftOutlined, EditOutlined, TeamOutlined, CreditCardOutlined } from '@ant-design/icons'
import { getDocentes, actualizarDocente } from '../../api/biblioteca'

function GestionDocentes() {
  const navigate = useNavigate()
  const { message } = App.useApp()
  const [docentes, setDocentes] = useState<any[]>([])
  const [cargando, setCargando] = useState(false)
  const [modalAbierto, setModalAbierto] = useState(false)
  const [editando, setEditando] = useState<any | null>(null)
  const [form] = Form.useForm()

  const cargarDocentes = () => {
    setCargando(true)
    getDocentes()
      .then(setDocentes)
      .catch(() => message.error('Error al cargar los docentes'))
      .finally(() => setCargando(false))
  }

  useEffect(() => {
    cargarDocentes()
  }, [])

  const abrirEditar = (docente: any) => {
    setEditando(docente)
    form.setFieldsValue({ rfid: docente.rfid, nombre: docente.nombre, iniciales: docente.iniciales })
    setModalAbierto(true)
  }

  const handleGuardar = async () => {
    try {
      const valores = await form.validateFields()
      await actualizarDocente(editando.id, valores)
      message.success('Docente actualizado — el llavero quedó vinculado')
      setModalAbierto(false)
      cargarDocentes()
    } catch (err: any) {
      if (err?.errorFields) return
      message.error('Error al guardar — verifica que el RFID no esté en uso por otro docente')
    }
  }

  const columnas = [
    { title: 'Nombre', dataIndex: 'nombre', key: 'nombre' },
    { title: 'Iniciales', dataIndex: 'iniciales', key: 'iniciales', width: 100 },
    {
      title: 'RFID actual', dataIndex: 'rfid', key: 'rfid',
      render: (rfid: string) => <Tag color="purple"><CreditCardOutlined style={{ marginRight: 4 }} />{rfid}</Tag>,
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
          <button className="btn-volver" onClick={() => navigate('/sistema/gestion')}>
            <ArrowLeftOutlined /> Volver a Gestión
          </button>
          <h1 className="reportes-titulo">
            <TeamOutlined style={{ marginRight: 12, color: '#0d9488' }} />
            Gestión de Docentes
          </h1>
          <p className="reportes-subtitulo">
            Cambia el llavero RFID asignado a cada docente
          </p>
        </div>
      </div>

      <div className="reporte-card">
        <Table
          columns={columnas}
          dataSource={docentes}
          rowKey="id"
          loading={cargando}
          pagination={{ pageSize: 8 }}
        />
      </div>

      <Modal
        title="Editar docente"
        open={modalAbierto}
        onOk={handleGuardar}
        onCancel={() => setModalAbierto(false)}
        okText="Guardar cambios"
        cancelText="Cancelar"
      >
        <Form form={form} layout="vertical" style={{ marginTop: 20 }}>
          <Form.Item name="nombre" label="Nombre" rules={[{ required: true, message: 'Ingresa el nombre' }]}>
            <Input />
          </Form.Item>
          <Form.Item name="iniciales" label="Iniciales" rules={[{ required: true, message: 'Ingresa las iniciales' }]}>
            <Input maxLength={3} />
          </Form.Item>
          <Form.Item
            name="rfid"
            label="UID del llavero RFID"
            rules={[{ required: true, message: 'Ingresa el UID del llavero' }]}
            extra="Acerca el llavero nuevo al lector y copia el UID que muestra el sistema, o el monitor serial del ESP32."
          >
            <Input placeholder="Ej: A1B2C3D4" />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  )
}

export default GestionDocentes