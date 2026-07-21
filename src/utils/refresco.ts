// Aviso global de "acaba de registrarse algo". App lo emite cuando se
// completa un uso, préstamo, devolución o alta de usuario; las pantallas
// abiertas lo escuchan y recargan sus datos, sin depender unas de otras.

const EVENTO = 'biblioteca-datos-actualizados'

export const avisarDatosActualizados = () => {
  window.dispatchEvent(new Event(EVENTO))
}

// Devuelve la función de limpieza, para usarla dentro de un useEffect:
//   useEffect(() => escucharDatosActualizados(cargarDatos), [])
export const escucharDatosActualizados = (recargar: () => void) => {
  window.addEventListener(EVENTO, recargar)
  return () => window.removeEventListener(EVENTO, recargar)
}