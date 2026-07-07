import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { Table, Button, Modal, Form, Input, InputNumber, App, Popconfirm, Tag, Select } from 'antd'
import { ArrowLeftOutlined, PlusOutlined, EditOutlined, DeleteOutlined, BookOutlined, UploadOutlined, SearchOutlined } from '@ant-design/icons'
import * as XLSX from 'xlsx'
import { getLibros, crearLibro, actualizarLibro, eliminarLibro, buscarLibros, getProgramas } from '../../api/biblioteca'

const limpiarPrograma = (nombre: string) =>
  nombre
    .replace(/^TECNOLOGÍA SUPERIOR EN ADMINISTRACIÓN DEL /i, 'ADMINISTRACIÓN DEL ')
    .replace(/^TECNOLOGÍA SUPERIOR EN /i, '')
    .replace(/DISEÑO GRÁFICO CON NIVEL EQUIVALENTE A TECNOLOGÍA SUPERIOR/i, 'DISEÑO GRÁFICO')
    .trim()

const COLUMNAS_REQUERIDAS = ['CODIGO', 'TITULO', 'AUTOR']

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
  const [programas, setProgramas] = useState<{ value: string; label: string }[]>([])
  const [pageSize, setPageSize] = useState(25)
  const [importando, setImportando] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const cargarLibros = () => {
    setCargando(true)
    const promesa = busqueda || programa
      ? buscarLibros(busqueda || undefined, programa || undefined)
      : getLibros()
    promesa
      .then(setLibros)
      .catch(() => message.error('Error al cargar los libros'))
      .finally(() => setCargando(false))
  }

  useEffect(() => {
    getProgramas().then(data => {
      const opciones = data
        .map((p: string) => ({ value: p, label: limpiarPrograma(p) }))
        .sort((a: any, b: any) => a.label.localeCompare(b.label))
      setProgramas(opciones)
    })
  }, [])

  useEffect(() => {
  const t = setTimeout(() => { cargarLibros() }, 300)
  return () => clearTimeout(t)
}, [busqueda, programa])

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

      if (rows.length === 0) {
        message.error('El archivo está vacío')
        setImportando(false)
        if (fileInputRef.current) fileInputRef.current.value = ''
        return
      }

      // Validar que tenga las columnas requeridas
      const primeraFila = rows[0]
      const columnasArchivo = Object.keys(primeraFila).map(k => k.toUpperCase().trim())
      const faltantes = COLUMNAS_REQUERIDAS.filter(col =>
        !columnasArchivo.some(c => c.includes(col))
      )

      if (faltantes.length > 0) {
        message.error(`El archivo no tiene el formato correcto. Columnas faltantes: ${faltantes.join(', ')}. Usa la plantilla del sistema.`)
        setImportando(false)
        if (fileInputRef.current) fileInputRef.current.value = ''
        return
      }

      let exitosos = 0
      let fallidos = 0

      for (const row of rows) {
        try {
          const libro = {
            codigo: String(row['CODIGO'] || row['Código'] || row['codigo'] || '').trim(),
            titulo: String(row['TITULO'] || row['Título'] || row['titulo'] || '').trim(),
            autor: String(row['AUTOR'] || row['Autor'] || row['autor'] || '').trim(),
            anio: parseInt(row['AÑO'] || row['Año'] || row['anio'] || row['YEAR'] || new Date().getFullYear()),
            categoria: String(row['CATEGORIA'] || row['Categoría'] || row['categoria'] || row['PROGRAMA'] || row['programa'] || '').trim(),
            totalEjemplares: parseInt(row['TOTAL'] || row['total'] || row['Total'] || row['EJEMPLARES'] || 1),
            disponibles: parseInt(row['DISPONIBLES'] || row['disponibles'] || row['Disponibles'] || row['TOTAL'] || row['total'] || 1),
            descripcion: String(row['DESCRIPCION'] || row['Descripción'] || row['descripcion'] || row['TITULO'] || row['titulo'] || '').trim(),
          }
          if (!libro.codigo || !libro.titulo || !libro.autor) { fallidos++; continue }
          await crearLibro(libro)
          exitosos++
        } catch {
          fallidos++
        }
      }

      if (exitosos > 0) {
        message.success(`Importación completada: ${exitosos} libro${exitosos > 1 ? 's' : ''} cargado${exitosos > 1 ? 's' : ''}${fallidos > 0 ? `, ${fallidos} omitido${fallidos > 1 ? 's' : ''} (ya existían o datos incompletos)` : ''}`)
        cargarLibros()
      } else {
        message.warning(`No se cargó ningún libro. ${fallidos} filas omitidas — puede que ya existan o tengan datos incompletos.`)
      }
    } catch {
      message.error('Error al leer el archivo. Asegúrate de que sea un Excel válido (.xlsx o .xls).')
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
          <p className="reportes-subtitulo">Agrega, edita o elimina títulos del catálogo · {libros.length} libros</p>
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          <input ref={fileInputRef} type="file" accept=".xlsx,.xls" style={{ display: 'none' }} onChange={handleImportarExcel} />
          <Button icon={<UploadOutlined />} onClick={() => fileInputRef.current?.click()} loading={importando}>
            Importar Excel
          </Button>
          <Button className="btn-exportar" icon={<PlusOutlined />} onClick={abrirCrear} size="large">
            Nuevo libro
          </Button>
        </div>
      </div>

      <div style={{ display: 'flex', gap: 12, marginBottom: 16, flexWrap: 'wrap', alignItems: 'center' }}>
        <Input
          placeholder="Buscar por título, autor o código..."
          allowClear
          style={{ maxWidth: 380 }}
          prefix={<SearchOutlined style={{ color: '#94A3B8' }} />}
          onChange={e => setBusqueda(e.target.value)}
          value={busqueda}
        />
        <Select
          placeholder="Todos los programas"
          allowClear
          style={{ minWidth: 260 }}
          value={programa || undefined}
          onChange={val => setPrograma(val || '')}
          options={programas}
          showSearch
          filterOption={(input, option) =>
            (option?.label ?? '').toLowerCase().includes(input.toLowerCase())
          }
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
              { value: 100, label: '100' },
              { value: 9999, label: 'Todos' },
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
          pagination={pageSize >= 9999 ? false : { pageSize, showSizeChanger: false, showTotal: (total) => `${total} libros` }}
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
            <Input />
          </Form.Item>
          <Form.Item name="autor" label="Autor" rules={[{ required: true }]}>
            <Input />
          </Form.Item>
          <Form.Item name="anio" label="Año" rules={[{ required: true }]}>
            <InputNumber style={{ width: '100%' }} />
          </Form.Item>
          <Form.Item name="categoria" label="Categoría" rules={[{ required: true }]}>
            <Input />
          </Form.Item>
          <Form.Item name="totalEjemplares" label="Total ejemplares" rules={[{ required: true }]}>
            <InputNumber style={{ width: '100%' }} min={1} />
          </Form.Item>
          <Form.Item name="disponibles" label="Disponibles" rules={[{ required: true }]}>
            <InputNumber style={{ width: '100%' }} min={0} />
          </Form.Item>
          <Form.Item name="descripcion" label="Descripción" rules={[{ required: true }]}>
            <Input.TextArea rows={3} />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  )
}

export default GestionLibros