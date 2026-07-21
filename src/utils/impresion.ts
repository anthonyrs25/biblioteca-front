// Genera las hojas imprimibles que replican los formularios en papel de la
// biblioteca: "Registro de uso" y "Registro de préstamos de libros".
// Se abren en una ventana nueva y disparan el diálogo de impresión del
// navegador, desde donde se puede imprimir o guardar como PDF.

const FILAS_EN_BLANCO = 18

export type TipoHoja = 'DOCENTE' | 'ESTUDIANTE' | 'INVITADO' | 'TODOS'

const TITULO_TIPO: Record<TipoHoja, string> = {
  DOCENTE: 'DOCENTES',
  ESTUDIANTE: 'ESTUDIANTES',
  INVITADO: 'INVITADOS',
  TODOS: 'TODOS LOS USUARIOS',
}

const ETIQUETA_TIPO: Record<string, string> = {
  DOCENTE: 'Docente',
  ESTUDIANTE: 'Estudiante',
  INVITADO: 'Invitado',
}

const escapar = (v: any) =>
  String(v ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')

const fecha = (f?: string | null) =>
  f ? new Date(f).toLocaleDateString('es-EC') : ''

// Estilos comunes: pensados para papel A4 y para que la tabla se lea igual
// que el formulario impreso que usa la biblioteca.
const ESTILOS = `
  @page { size: A4 portrait; margin: 12mm 10mm; }
  * { box-sizing: border-box; }
  body {
    font-family: Arial, Helvetica, sans-serif;
    color: #000;
    margin: 0;
    font-size: 11px;
  }
  .encabezado {
    display: flex;
    align-items: center;
    gap: 12px;
    border-bottom: 2px solid #000;
    padding-bottom: 8px;
    margin-bottom: 10px;
  }
  .encabezado img { height: 42px; }
  .inst { flex: 1; }
  .inst .nombre { font-size: 13px; font-weight: bold; }
  .inst .datos { font-size: 9px; color: #333; line-height: 1.4; }
  .titulo { text-align: center; margin-bottom: 10px; }
  .titulo h1 { font-size: 14px; margin: 0; letter-spacing: .5px; }
  .titulo h2 { font-size: 11px; margin: 2px 0 0; font-weight: normal; }
  .titulo .periodo { font-size: 10px; color: #333; margin-top: 3px; }
  table { width: 100%; border-collapse: collapse; }
  th, td {
    border: 1px solid #000;
    padding: 4px 5px;
    text-align: left;
    vertical-align: top;
  }
  th {
    background: #e8e8e8;
    font-size: 10px;
    text-align: center;
    text-transform: uppercase;
  }
  td { height: 24px; font-size: 10px; }
  .num { text-align: center; width: 26px; }
  .firma { width: 80px; }
  .pie {
    margin-top: 28px;
    text-align: center;
    page-break-inside: avoid;
  }
  .pie .linea {
    width: 220px;
    border-top: 1px solid #000;
    margin: 0 auto 4px;
  }
  .pie .cargo { font-size: 10px; }
  .generado {
    margin-top: 10px;
    font-size: 8px;
    color: #555;
    text-align: right;
  }
  tr { page-break-inside: avoid; }
  thead { display: table-header-group; }
  @media print { .no-print { display: none; } }
`

function abrirVentana(html: string) {
  const ventana = window.open('', '_blank', 'width=900,height=700')
  if (!ventana) {
    alert('El navegador bloqueó la ventana emergente. Permite las ventanas emergentes para este sitio e inténtalo de nuevo.')
    return
  }
  ventana.document.write(html)
  ventana.document.close()
  // Se espera a que el logo cargue para que no salga en blanco al imprimir
  ventana.onload = () => {
    ventana.focus()
    setTimeout(() => ventana.print(), 300)
  }
}

function documento(titulo: string, subtitulo: string, periodo: string, tablaHtml: string) {
  const logo = `${window.location.origin}/logo-sudamericano.png`
  return `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="utf-8">
  <title>${escapar(titulo)}</title>
  <style>${ESTILOS}</style>
</head>
<body>
  <div class="encabezado">
    <img src="${logo}" alt="">
    <div class="inst">
      <div class="nombre">INSTITUTO DE TECNOLOGÍAS SUDAMERICANO</div>
      <div class="datos">
        Biblioteca Daniel Perazzo · Cuenca, Ecuador<br>
        (593-7) 2838323 · Bolívar y Manuel Vega - San Blas
      </div>
    </div>
  </div>

  <div class="titulo">
    <h1>${escapar(titulo)}</h1>
    <h2>- ${escapar(subtitulo)} -</h2>
    ${periodo ? `<div class="periodo">${escapar(periodo)}</div>` : ''}
  </div>

  ${tablaHtml}

  <div class="pie">
    <div class="linea"></div>
    <div class="cargo">Mgtr. Roberto Salazar</div>
  </div>

  <div class="generado">
    Generado el ${new Date().toLocaleDateString('es-EC')} a las ${new Date().toLocaleTimeString('es-EC', { hour: '2-digit', minute: '2-digit' })}
  </div>
</body>
</html>`
}

// ───────────────────────────────────────────────
// HOJAS EN BLANCO (contingencia: sin sistema, se llena a mano)
// ───────────────────────────────────────────────

export function imprimirPlantillaUso(tipo: TipoHoja) {
  const filas = Array.from({ length: FILAS_EN_BLANCO }, (_, i) => `
    <tr>
      <td class="num">${i + 1}</td>
      <td></td><td></td><td></td><td></td><td class="firma"></td>
    </tr>`).join('')

  const tabla = `
  <table>
    <thead>
      <tr>
        <th class="num">N°</th>
        <th style="width:24%">Nombre</th>
        <th style="width:26%">Actividad</th>
        <th style="width:14%">Fecha</th>
        <th style="width:20%">Carrera</th>
        <th class="firma">Firma</th>
      </tr>
    </thead>
    <tbody>${filas}</tbody>
  </table>`

  abrirVentana(documento('REGISTRO DE USO DE BIBLIOTECA', TITULO_TIPO[tipo], '', tabla))
}

export function imprimirPlantillaPrestamos(tipo: TipoHoja) {
  const filas = Array.from({ length: FILAS_EN_BLANCO }, (_, i) => `
    <tr>
      <td class="num">${i + 1}</td>
      <td></td><td></td><td></td><td></td>
      <td class="firma"></td><td></td><td class="firma"></td>
    </tr>`).join('')

  const tabla = `
  <table>
    <thead>
      <tr>
        <th class="num">N°</th>
        <th style="width:17%">Nombre</th>
        <th style="width:23%">Libro/s</th>
        <th style="width:14%">Carrera</th>
        <th style="width:11%">Fecha de préstamo</th>
        <th class="firma">Firma</th>
        <th style="width:11%">Fecha de entrega</th>
        <th class="firma">Firma</th>
      </tr>
    </thead>
    <tbody>${filas}</tbody>
  </table>`

  abrirVentana(documento('REGISTRO DE PRÉSTAMOS DE LIBROS', TITULO_TIPO[tipo], '', tabla))
}

// ───────────────────────────────────────────────
// HOJAS CON DATOS (archivo físico: se imprime y se firma)
// ───────────────────────────────────────────────

export function imprimirRegistrosUso(registros: any[], tipo: TipoHoja, periodo: string) {
  const usos = registros.filter(r => r.tipo === 'uso')
  const filtrados = tipo === 'TODOS'
    ? usos
    : usos.filter(r => r.usuario?.tipoPersona === tipo)

  const ordenados = [...filtrados].sort(
    (a, b) => new Date(a.fecha).getTime() - new Date(b.fecha).getTime()
  )

  const filas = ordenados.length === 0
    ? `<tr><td colspan="6" style="text-align:center;padding:14px">Sin registros en este período.</td></tr>`
    : ordenados.map((r, i) => `
      <tr>
        <td class="num">${i + 1}</td>
        <td>${escapar(r.usuario?.nombre)}</td>
        <td>${escapar(r.actividad)}</td>
        <td>${fecha(r.fecha)}</td>
        <td>${escapar(r.carrera)}</td>
        <td class="firma"></td>
      </tr>`).join('')

  const tabla = `
  <table>
    <thead>
      <tr>
        <th class="num">N°</th>
        <th style="width:24%">Nombre</th>
        <th style="width:26%">Actividad</th>
        <th style="width:14%">Fecha</th>
        <th style="width:20%">Carrera</th>
        <th class="firma">Firma</th>
      </tr>
    </thead>
    <tbody>${filas}</tbody>
  </table>`

  abrirVentana(documento('REGISTRO DE USO DE BIBLIOTECA', TITULO_TIPO[tipo], periodo, tabla))
}

export function imprimirPrestamos(prestamos: any[], tipo: TipoHoja, periodo: string) {
  const filtrados = tipo === 'TODOS'
    ? prestamos
    : prestamos.filter(p => p.usuario?.tipoPersona === tipo)

  // Una fila por libro, igual que en el formulario en papel.
  const ordenados = [...filtrados].sort(
    (a, b) => new Date(a.fechaPrestamo).getTime() - new Date(b.fechaPrestamo).getTime()
  )

  const filas = ordenados.length === 0
    ? `<tr><td colspan="8" style="text-align:center;padding:14px">Sin préstamos en este período.</td></tr>`
    : ordenados.map((p, i) => `
      <tr>
        <td class="num">${i + 1}</td>
        <td>${escapar(p.usuario?.nombre)}</td>
        <td>${escapar(p.libro?.titulo)}</td>
        <td>${escapar(p.usuario?.carreras?.[0]?.carrera?.nombre ?? ETIQUETA_TIPO[p.usuario?.tipoPersona] ?? '')}</td>
        <td>${fecha(p.fechaPrestamo)}</td>
        <td class="firma"></td>
        <td>${fecha(p.fechaDevolucion)}</td>
        <td class="firma"></td>
      </tr>`).join('')

  const tabla = `
  <table>
    <thead>
      <tr>
        <th class="num">N°</th>
        <th style="width:17%">Nombre</th>
        <th style="width:23%">Libro/s</th>
        <th style="width:14%">Carrera</th>
        <th style="width:11%">Fecha de préstamo</th>
        <th class="firma">Firma</th>
        <th style="width:11%">Fecha de entrega</th>
        <th class="firma">Firma</th>
      </tr>
    </thead>
    <tbody>${filas}</tbody>
  </table>`

  abrirVentana(documento('REGISTRO DE PRÉSTAMOS DE LIBROS', TITULO_TIPO[tipo], periodo, tabla))
}

// ───────────────────────────────────────────────
// REPORTE DE GESTIÓN (resumen para presentar a la institución)
// ───────────────────────────────────────────────

const ESTILOS_REPORTE = `
  @page { size: A4 portrait; margin: 14mm 12mm; }
  * { box-sizing: border-box; }
  body { font-family: Arial, Helvetica, sans-serif; color: #1A2332; margin: 0; font-size: 11px; }
  .encabezado {
    display: flex; align-items: center; gap: 12px;
    border-bottom: 2px solid #00695C; padding-bottom: 8px; margin-bottom: 14px;
  }
  .encabezado img { height: 42px; }
  .inst .nombre { font-size: 13px; font-weight: bold; }
  .inst .datos { font-size: 9px; color: #4A5568; line-height: 1.4; }
  .titulo { text-align: center; margin-bottom: 16px; }
  .titulo h1 { font-size: 16px; margin: 0; color: #00695C; }
  .titulo .periodo { font-size: 11px; color: #4A5568; margin-top: 4px; }
  h2 {
    font-size: 12px; color: #00695C; margin: 18px 0 8px;
    border-bottom: 1px solid #B2DFDB; padding-bottom: 4px;
  }
  .kpis { display: flex; gap: 10px; margin-bottom: 6px; }
  .kpi {
    flex: 1; border: 1px solid #B2DFDB; border-radius: 6px;
    padding: 10px; text-align: center; background: #F5FBFA;
  }
  .kpi .num { font-size: 22px; font-weight: bold; color: #00695C; }
  .kpi .lab { font-size: 9px; color: #4A5568; margin-top: 2px; }
  table { width: 100%; border-collapse: collapse; margin-bottom: 6px; }
  th, td { border: 1px solid #CBD5E1; padding: 5px 7px; text-align: left; font-size: 10px; }
  th { background: #E0F2F1; font-size: 9px; text-transform: uppercase; }
  td.n { text-align: center; width: 34px; }
  td.v { text-align: right; width: 70px; font-weight: bold; }
  .barra-fondo { background: #E8F5F3; border-radius: 3px; height: 12px; width: 100%; }
  .barra { background: #00796B; height: 12px; border-radius: 3px; }
  .vacio { text-align: center; color: #94A3B8; padding: 12px; font-size: 10px; }
  .pie { margin-top: 26px; text-align: center; page-break-inside: avoid; }
  .pie .linea { width: 220px; border-top: 1px solid #000; margin: 0 auto 4px; }
  .pie .cargo { font-size: 10px; }
  .generado { margin-top: 10px; font-size: 8px; color: #64748B; text-align: right; }
  h2, table, .kpis { page-break-inside: avoid; }
  thead { display: table-header-group; }
`

type DatosReporte = {
  periodo: string
  totalVisitas: number
  usos: number
  prestamos: number
  devoluciones: number
  activos: number
  porCarrera: { carrera: string; visitas: number }[]
  porTipo: { tipoPersona: string; visitas: number; prestamos: number; devoluciones: number }[]
  librosTop: { titulo: string; autor: string; codigo: string; prestamos: number }[]
  totalLibros: number
  disponibles: number
}

export function imprimirReporteGestion(d: DatosReporte) {
  const logo = `${window.location.origin}/logo-sudamericano.png`

  const maxCarrera = Math.max(1, ...d.porCarrera.map(c => c.visitas))
  const filasCarrera = d.porCarrera.length === 0
    ? `<tr><td colspan="3" class="vacio">Sin registros en este período.</td></tr>`
    : d.porCarrera.map(c => `
      <tr>
        <td style="width:38%">${escapar(c.carrera)}</td>
        <td>
          <div class="barra-fondo">
            <div class="barra" style="width:${Math.round((c.visitas / maxCarrera) * 100)}%"></div>
          </div>
        </td>
        <td class="v">${c.visitas}</td>
      </tr>`).join('')

  const filasTipo = d.porTipo.map(t => `
    <tr>
      <td>${escapar(ETIQUETA_TIPO[t.tipoPersona] ?? t.tipoPersona)}</td>
      <td class="v">${t.visitas}</td>
      <td class="v">${t.prestamos}</td>
      <td class="v">${t.devoluciones}</td>
    </tr>`).join('')

  const filasLibros = d.librosTop.length === 0
    ? `<tr><td colspan="4" class="vacio">Sin préstamos en este período.</td></tr>`
    : d.librosTop.map((l, i) => `
      <tr>
        <td class="n">${i + 1}</td>
        <td>${escapar(l.titulo)}<br><span style="color:#64748B;font-size:9px">${escapar(l.autor)}</span></td>
        <td style="width:90px">${escapar(l.codigo)}</td>
        <td class="v">${l.prestamos}</td>
      </tr>`).join('')

  const pctDisponible = d.totalLibros > 0
    ? Math.round((d.disponibles / d.totalLibros) * 100)
    : 0

  const html = `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="utf-8">
  <title>Reporte de gestión</title>
  <style>${ESTILOS_REPORTE}</style>
</head>
<body>
  <div class="encabezado">
    <img src="${logo}" alt="">
    <div class="inst">
      <div class="nombre">INSTITUTO DE TECNOLOGÍAS SUDAMERICANO</div>
      <div class="datos">
        Biblioteca Daniel Perazzo · Cuenca, Ecuador<br>
        (593-7) 2838323 · Bolívar y Manuel Vega - San Blas
      </div>
    </div>
  </div>

  <div class="titulo">
    <h1>REPORTE DE GESTIÓN DE BIBLIOTECA</h1>
    <div class="periodo">${escapar(d.periodo)}</div>
  </div>

  <h2>Indicadores generales</h2>
  <div class="kpis">
    <div class="kpi"><div class="num">${d.totalVisitas}</div><div class="lab">Registros totales</div></div>
    <div class="kpi"><div class="num">${d.usos}</div><div class="lab">Usos de sala</div></div>
    <div class="kpi"><div class="num">${d.prestamos}</div><div class="lab">Préstamos</div></div>
    <div class="kpi"><div class="num">${d.devoluciones}</div><div class="lab">Devoluciones</div></div>
    <div class="kpi"><div class="num">${d.activos}</div><div class="lab">Préstamos activos</div></div>
  </div>

  <h2>Estado del catálogo</h2>
  <table>
    <tr>
      <td style="width:38%">Ejemplares disponibles</td>
      <td>
        <div class="barra-fondo"><div class="barra" style="width:${pctDisponible}%"></div></div>
      </td>
      <td class="v">${d.disponibles} / ${d.totalLibros}</td>
    </tr>
  </table>

  <h2>Uso por carrera</h2>
  <table>
    <thead><tr><th>Carrera</th><th>Distribución</th><th>Registros</th></tr></thead>
    <tbody>${filasCarrera}</tbody>
  </table>

  <h2>Actividad por tipo de usuario</h2>
  <table>
    <thead><tr><th>Tipo</th><th>Visitas</th><th>Préstamos</th><th>Devoluciones</th></tr></thead>
    <tbody>${filasTipo}</tbody>
  </table>

  <h2>Libros más prestados</h2>
  <table>
    <thead><tr><th class="n">N°</th><th>Libro</th><th>Código</th><th>Préstamos</th></tr></thead>
    <tbody>${filasLibros}</tbody>
  </table>

  <div class="pie">
    <div class="linea"></div>
    <div class="cargo">Mgtr. Roberto Salazar</div>
  </div>

  <div class="generado">
    Generado el ${new Date().toLocaleDateString('es-EC')} a las ${new Date().toLocaleTimeString('es-EC', { hour: '2-digit', minute: '2-digit' })}
  </div>
</body>
</html>`

  abrirVentana(html)
}