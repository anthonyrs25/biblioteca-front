import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Table, Button, Modal, Form, Input, InputNumber, App, Popconfirm, Tag } from 'antd'
import { ArrowLeftOutlined, PlusOutlined, EditOutlined, DeleteOutlined, BookOutlined } from '@ant-design/icons'
import { crearLibro, actualizarLibro, eliminarLibro, buscarLibros, getProgramas } from '../../api/biblioteca'
function GestionLibros() {
  const navigate = useNavigate()
  const { message } = App.useApp()
  const [libros, setLibros] = useState<any[]>([])
  const [cargando, setCargando] = useState(false)
  const [modalAbierto, setModalAbierto] = useState(false)
  const [editando, setEditando] = useState<any | null>(null)
  const [form] = Form.useForm()
  const [busqueda, setBusqueda] = useState('')
  const [programa, setPrograma] = useState('')
  const [programas, setProgramas] = useState<string[]>([])

  const cargarLibros = () => {
    setCargando(true)
    buscarLibros(busqueda || undefined, programa || undefined)
      .then(setLibros)
      .catch(() => message.error('Error al cargar los libros'))
      .finally(() => setCargando(false))
  }

  useEffect(() => {
    getProgramas().then(setProgramas)
  }, [])

  useEffect(() => {
    cargarLibros()
  }, [busqueda, programa])

  const abrirCrear = () => {
    setEditando(null)
    form.resetFields()
    setModalAbierto(true)
  }

  const abrirEditar = (libro: any) => {
    setEditando(libro)
    form.setFieldsValue(libro)
    setModalAbierto(true)
  }

  const handleGuardar = async () => {
    try {
      const valores = await form.validateFields()
      if (editando) {
        await actualizarLibro(editando.id, valores)
        message.success('Libro actualizado')
      } else {
        await crearLibro(valores)
        message.success('Libro creado')
      }
      setModalAbierto(false)
      cargarLibros()
    } catch (err: any) {
      if (err?.errorFields) return // error de validación del form, ya se muestra solo
      message.error('Error al guardar el libro')
    }
  }

  const handleEliminar = async (id: number) => {
    try {
      await eliminarLibro(id)
      message.success('Libro eliminado')
      cargarLibros()
    } catch {
      message.error('Error al eliminar el libro')
    }
  }

  const columnas = [
    { title: 'Código', dataIndex: 'codigo', key: 'codigo', width: 100 },
    { title: 'Título', dataIndex: 'titulo', key: 'titulo' },
    { title: 'Autor', dataIndex: 'autor', key: 'autor' },
    {
      title: 'Categoría', dataIndex: 'categoria', key: 'categoria',
      render: (cat: string) => <Tag color="cyan">{cat}</Tag>
    },
    { title: 'Total', dataIndex: 'totalEjemplares', key: 'totalEjemplares', width: 80 },
    {
      title: 'Disponibles', dataIndex: 'disponibles', key: 'disponibles', width: 100,
      render: (val: number) => <Tag color={val > 0 ? 'green' : 'red'}>{val}</Tag>
    },
    {
      title: 'Acciones', key: 'acciones', width: 140,
      render: (_: any, libro: any) => (
        <div style={{ display: 'flex', gap: 8 }}>
          <Button size="small" icon={<EditOutlined />} onClick={() => abrirEditar(libro)} />
          <Popconfirm
            title="¿Eliminar este libro?"
            description="Esta acción no se puede deshacer."
            onConfirm={() => handleEliminar(libro.id)}
            okText="Sí, eliminar"
            cancelText="Cancelar"
          >
            <Button size="small" danger icon={<DeleteOutlined />} />
          </Popconfirm>
        </div>
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
            <BookOutlined style={{ marginRight: 12, color: '#0d9488' }} />
            Gestión de Libros
          </h1>
          <p className="reportes-subtitulo">Agrega, edita o elimina títulos del catálogo</p>
        </div>
        <Button className="btn-exportar" icon={<PlusOutlined />} onClick={abrirCrear} size="large">
          Nuevo libro
        </Button>
      </div>
      <div style={{ display: 'flex', gap: 12, marginBottom: 16, flexWrap: 'wrap' }}>
        <Input.Search
          placeholder="Buscar por título, autor o código..."
          allowClear
          style={{ maxWidth: 400 }}
          onSearch={setBusqueda}
          onChange={e => { if (!e.target.value) setBusqueda('') }}
        />
        <select
          value={programa}
          onChange={e => setPrograma(e.target.value)}
          style={{ padding: '4px 12px', borderRadius: 6, border: '1px solid #d1d5db', minWidth: 200 }}
        >
          <option value="">Todos los programas</option>
          {programas.map(p => <option key={p} value={p}>{p}</option>)}
        </select>
      </div>
      <div className="reporte-card">
        <Table
          columns={columnas}
          dataSource={libros}
          rowKey="id"
          loading={cargando}
          pagination={{ pageSize: 8 }}
        />
      </div>

      <Modal
        title={editando ? 'Editar libro' : 'Nuevo libro'}
        open={modalAbierto}
        onOk={handleGuardar}
        onCancel={() => setModalAbierto(false)}
        okText={editando ? 'Guardar cambios' : 'Crear libro'}
        cancelText="Cancelar"
      >
        <Form form={form} layout="vertical" style={{ marginTop: 20 }}>
          <Form.Item name="codigo" label="Código" rules={[{ required: true, message: 'Ingresa el código' }]}>
            <Input placeholder="Ej: LIB-002" disabled={!!editando} />
          </Form.Item>
          <Form.Item name="titulo" label="Título" rules={[{ required: true, message: 'Ingresa el título' }]}>
            <Input placeholder="Ej: Clean Architecture" />
          </Form.Item>
          <Form.Item name="autor" label="Autor" rules={[{ required: true, message: 'Ingresa el autor' }]}>
            <Input placeholder="Ej: Robert C. Martin" />
          </Form.Item>
          <Form.Item name="anio" label="Año" rules={[{ required: true, message: 'Ingresa el año' }]}>
            <InputNumber style={{ width: '100%' }} placeholder="Ej: 2017" />
          </Form.Item>
          <Form.Item name="categoria" label="Categoría" rules={[{ required: true, message: 'Ingresa la categoría' }]}>
            <Input placeholder="Ej: Programación" />
          </Form.Item>
          <Form.Item name="totalEjemplares" label="Total de ejemplares" rules={[{ required: true, message: 'Ingresa el total' }]}>
            <InputNumber style={{ width: '100%' }} min={1} />
          </Form.Item>
          <Form.Item name="disponibles" label="Disponibles" rules={[{ required: true, message: 'Ingresa disponibles' }]}>
            <InputNumber style={{ width: '100%' }} min={0} />
          </Form.Item>
          <Form.Item name="descripcion" label="Descripción" rules={[{ required: true, message: 'Ingresa una descripción' }]}>
            <Input.TextArea rows={3} placeholder="Breve resumen del libro..." />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  )
}

export default GestionLibros