import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { Table, Button, Modal, Form, Input, InputNumber, App, Popconfirm, Tag, Select, Upload } from 'antd'
import { ArrowLeftOutlined, PlusOutlined, EditOutlined, DeleteOutlined, BookOutlined, UploadOutlined } from '@ant-design/icons'
import * as XLSX from 'xlsx'
import { crearLibro, actualizarLibro, eliminarLibro, buscarLibros, getProgramas } from '../../api/biblioteca'

function GestionLibros() {
  const navigate = useNavigate()
  const { message, modal } = App.useApp()
  const [libros, setLibros] = useState<any[]>([])
  const [cargando, setCargando] = useState(false)
  const [modalAbierto, setModalAbierto] = useState(false)
  const [editando, setEditando] = useState<any | null>(null)
  const [form] = Form.useForm()
  const [busqueda, setBusqueda] = useState('')
  const [programa, setPrograma] = useState('')
  const [programas, setProgramas] = useState<string[]>([])
  const [pageSize, setPageSize] = useState(25)
  const [importando, setImportando] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const cargarLibros = () => {
    setCargando(true)
    buscarLibros(busqueda || undefined, programa || undefined)
      .then(setLibros)
      .catch(() => message.error('Error al cargar los libros'))
      .finally(() => setCargando(false))
  }

  useEffect(() => { getProgramas().then(setProgramas) }, [])
  useEffect(() => { cargarLibros() }, [busqueda, programa])

  const abrirCrear = () => { setEditando(null); form.resetFields(); setModalAbierto(true) }
  const abrirEditar = (libro: any) => { setEditando(libro); form.setFieldsValue(libro); setModalAbierto(true) }

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
      if (err?.errorFields) return
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

  const handleImportarExcel = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setImportando(true)

    try {
      const buffer = await file.arrayBuffer()
      const workbook = XLSX.read(buffer)
      const sheet = workbook.Sheets[workbook.SheetNames[0]]
      const rows: any[] = XLSX.utils.sheet_to_json(sheet)

      let exitosos = 0
      let fallidos = 0

      for (const row of rows) {
        try {
          const libro = {
            codigo: String(row['CODIGO'] || row['codigo'] || row['Código'] || '').trim(),
            titulo: String(row['TITULO'] || row['titulo'] || row['Título'] || '').trim(),
            autor: String(row['AUTOR'] || row['autor'] || row['Autor'] || '').trim(),
            anio: parseInt(row['AÑO'] || row['anio'] || row['Año'] || row['YEAR'] || new Date().getFullYear()),
            categoria: String(row['CATEGORIA'] || row['categoria'] || row['Categoría'] || row['PROGRAMA'] || row['programa'] || '').trim(),
            totalEjemplares: parseInt(row['TOTAL'] || row['total'] || row['Total'] || row['EJEMPLARES'] || 1),
            disponibles: parseInt(row['DISPONIBLES'] || row['disponibles'] || row['Disponibles'] || row['TOTAL'] || row['total'] || 1),
            descripcion: String(row['DESCRIPCION'] || row['descripcion'] || row['Descripción'] || row['TITULO'] || row['titulo'] || '').trim(),
          }

          if (!libro.codigo || !libro.titulo) { fallidos++; continue }

          await crearLibro(libro)
          exitosos++
        } catch {
          fallidos++
        }
      }

      message.success(`Importación completada: ${exitosos} libros cargados, ${fallidos} omitidos`)
      cargarLibros()
    } catch {
      message.error('Error al leer el archivo Excel')
    } finally {
      setImportando(false)
      if (fileInputRef.current) fileInputRef.current.value = ''
    }
  }

  const columnas = [
    { title: 'Código', dataIndex: 'codigo', key: 'codigo', width: 130 },
    { title: 'Título', dataIndex: 'titulo', key: 'titulo' },
    { title: 'Autor', dataIndex: 'autor', key: 'autor' },
    {
      title: 'Categoría', dataIndex: 'categoria', key: 'categoria',
      render: (cat: string) => <Tag color="cyan">{cat}</Tag>,
    },
    { title: 'Total', dataIndex: 'totalEjemplares', key: 'total', width: 70 },
    {
      title: 'Disponibles', dataIndex: 'disponibles', key: 'disponibles', width: 100,
      render: (val: number) => <Tag color={val > 0 ? 'green' : 'red'}>{val}</Tag>,
    },
    {
      title: 'Acciones', key: 'acciones', width: 100,
      render: (_: any, libro: any) => (
        <div style={{ display: 'flex', gap: 8 }}>
          <Button size="small" icon={<EditOutlined />} onClick={() => abrirEditar(libro)} />
          <Popconfirm
            title="¿Eliminar este libro?"
            description="Esta acción no se puede deshacer."
            onConfirm={() => handleEliminar(libro.id)}
            okText="Sí, eliminar" cancelText="Cancelar"
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
          <button className="btn-volver" onClick={() => navigate('/sistema')}>
            <ArrowLeftOutlined /> Volver al sistema
          </button>
          <h1 className="reportes-titulo">
            <BookOutlined style={{ marginRight: 12, color: '#00796B' }} />
            Gestión de Libros
          </h1>
          <p className="reportes-subtitulo">Agrega, edita o elimina títulos del catálogo</p>
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          <input
            ref={fileInputRef}
            type="file"
            accept=".xlsx,.xls,.csv"
            style={{ display: 'none' }}
            onChange={handleImportarExcel}
          />
          <Button
            icon={<UploadOutlined />}
            onClick={() => fileInputRef.current?.click()}
            loading={importando}
          >
            Importar Excel
          </Button>
          <Button className="btn-exportar" icon={<PlusOutlined />} onClick={abrirCrear} size="large">
            Nuevo libro
          </Button>
        </div>
      </div>

      <div style={{ display: 'flex', gap: 12, marginBottom: 16, flexWrap: 'wrap', alignItems: 'center' }}>
        <Input.Search
          placeholder="Buscar por título, autor o código..."
          allowClear
          style={{ maxWidth: 380 }}
          onSearch={setBusqueda}
          onChange={e => { if (!e.target.value) setBusqueda('') }}
        />
        <select
          value={programa}
          onChange={e => setPrograma(e.target.value)}
          style={{ padding: '6px 12px', borderRadius: 6, border: '1.5px solid #E2E8F0', minWidth: 200, color: '#1A2332' }}
        >
          <option value="">Todos los programas</option>
          {programas.map(p => <option key={p} value={p}>{p}</option>)}
        </select>
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
              { value: 100, label: '100' },
            ]}
          />
        </div>
      </div>

      <div className="reporte-card">
        <Table
          columns={columnas}
          dataSource={libros}
          rowKey="id"
          loading={cargando}
          pagination={{ pageSize, showSizeChanger: false }}
          scroll={{ x: true }}
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
          <Form.Item name="codigo" label="Código" rules={[{ required: true }]}>
            <Input placeholder="Ej: LIT.863.271V" disabled={!!editando} />
          </Form.Item>
          <Form.Item name="titulo" label="Título" rules={[{ required: true }]}>
            <Input placeholder="Ej: Clean Architecture" />
          </Form.Item>
          <Form.Item name="autor" label="Autor" rules={[{ required: true }]}>
            <Input placeholder="Ej: Robert C. Martin" />
          </Form.Item>
          <Form.Item name="anio" label="Año" rules={[{ required: true }]}>
            <InputNumber style={{ width: '100%' }} placeholder="Ej: 2017" />
          </Form.Item>
          <Form.Item name="categoria" label="Categoría" rules={[{ required: true }]}>
            <Input placeholder="Ej: Programación" />
          </Form.Item>
          <Form.Item name="totalEjemplares" label="Total de ejemplares" rules={[{ required: true }]}>
            <InputNumber style={{ width: '100%' }} min={1} />
          </Form.Item>
          <Form.Item name="disponibles" label="Disponibles" rules={[{ required: true }]}>
            <InputNumber style={{ width: '100%' }} min={0} />
          </Form.Item>
          <Form.Item name="descripcion" label="Descripción" rules={[{ required: true }]}>
            <Input.TextArea rows={3} placeholder="Breve resumen del libro..." />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  )
}

export default GestionLibros