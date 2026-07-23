// Validación de documentos de identidad ecuatorianos.
// La cédula tiene 10 dígitos y un algoritmo de verificación (módulo 10)
// que detecta números inventados o mal transcritos.

export const soloDigitos = (v: string) => v.replace(/\D/g, '')

export const validarCedulaEcuatoriana = (cedula: string): { valida: boolean; mensaje?: string } => {
  const c = cedula.trim()

  if (!/^\d+$/.test(c)) return { valida: false, mensaje: 'La cédula solo puede contener números' }
  if (c.length !== 10) return { valida: false, mensaje: 'La cédula debe tener exactamente 10 dígitos' }

  // Los dos primeros dígitos corresponden a la provincia (01 a 24, o 30
  // para ecuatorianos registrados en el exterior)
  const provincia = parseInt(c.slice(0, 2), 10)
  if ((provincia < 1 || provincia > 24) && provincia !== 30) {
    return { valida: false, mensaje: 'Los dos primeros dígitos no corresponden a una provincia válida' }
  }

  // El tercer dígito debe ser menor a 6 para personas naturales
  if (parseInt(c[2], 10) >= 6) {
    return { valida: false, mensaje: 'El tercer dígito no corresponde a una cédula de persona natural' }
  }

  // Algoritmo módulo 10: se multiplican alternadamente por 2 y 1; si el
  // producto pasa de 9 se le resta 9. El último dígito es el verificador.
  const coeficientes = [2, 1, 2, 1, 2, 1, 2, 1, 2]
  let suma = 0
  for (let i = 0; i < 9; i++) {
    let producto = parseInt(c[i], 10) * coeficientes[i]
    if (producto > 9) producto -= 9
    suma += producto
  }
  const verificador = (10 - (suma % 10)) % 10

  if (verificador !== parseInt(c[9], 10)) {
    return { valida: false, mensaje: 'El número de cédula no es válido' }
  }

  return { valida: true }
}

// El pasaporte admite letras y números, pero no símbolos ni espacios
export const validarPasaporte = (v: string): { valida: boolean; mensaje?: string } => {
  const p = v.trim()
  if (p.length < 5) return { valida: false, mensaje: 'El pasaporte debe tener al menos 5 caracteres' }
  if (!/^[A-Za-z0-9]+$/.test(p)) return { valida: false, mensaje: 'El pasaporte solo admite letras y números' }
  return { valida: true }
}

export const validarDocumento = (tipo: string, valor: string) =>
  tipo === 'cedula' ? validarCedulaEcuatoriana(valor) : validarPasaporte(valor)