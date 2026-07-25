import { createContext, useContext, useState, useEffect } from 'react'
import type { ReactNode } from 'react'

type Modo = 'bibliotecario' | 'admin'

interface ModoContextType {
  esAdmin: boolean          // true si el usuario.rol real (en el backend) es 'admin'
  modoAdminActivo: boolean  // true solo si además está usando el sistema EN modo administrador ahora mismo
  activarModoAdmin: () => void
  volverAModoBibliotecario: () => void
}

const ModoContext = createContext<ModoContextType | null>(null)

// Lee el rol admin desde localStorage. Se usa tanto en el valor inicial
// como al re-leer, para no duplicar la lógica de parseo.
function leerEsAdmin(): boolean {
  try {
    const usuarioRaw = localStorage.getItem('biblioteca_usuario')
    const usuario = usuarioRaw ? JSON.parse(usuarioRaw) : null
    return usuario?.rol === 'admin'
  } catch {
    return false
  }
}

// Cada sesión arranca en modo Bibliotecario por defecto, incluso para
// cuentas admin — así un clic accidental nunca borra o edita algo mientras
// se hace trabajo del día a día. Cambiar a modo Administrador es una
// decisión explícita cada vez que se inicia sesión.
export function ModoProvider({ children }: { children: ReactNode }) {
  // Antes esAdmin se calculaba UNA sola vez al montar. Si en ese instante
  // el usuario todavía no estaba en localStorage (timing de login, re-montaje
  // por StrictMode, escritura del navegador un pelo atrasada), esAdmin
  // quedaba en false para toda la sesión y el badge de modo desaparecía
  // hasta recargar la página. Ahora es estado reactivo: se re-lee cuando
  // el usuario cambia, así el badge aparece sin necesidad de recargar.
  const [esAdmin, setEsAdmin] = useState<boolean>(leerEsAdmin)
  const [modo, setModo] = useState<Modo>('bibliotecario')

  useEffect(() => {
    const revisar = () => setEsAdmin(leerEsAdmin())

    // 'storage' cubre cambios hechos en OTRA pestaña.
    // 'usuario-cambiado' es un evento propio que dispara el login en ESTA
    // misma pestaña (storage no se dispara en la pestaña que escribe).
    window.addEventListener('storage', revisar)
    window.addEventListener('usuario-cambiado', revisar)

    // Una re-lectura inmediata cubre el caso en que el usuario se guardó
    // entre el render inicial y el montaje de este efecto.
    revisar()

    return () => {
      window.removeEventListener('storage', revisar)
      window.removeEventListener('usuario-cambiado', revisar)
    }
  }, [])

  return (
    <ModoContext.Provider value={{
      esAdmin,
      modoAdminActivo: esAdmin && modo === 'admin',
      activarModoAdmin: () => setModo('admin'),
      volverAModoBibliotecario: () => setModo('bibliotecario'),
    }}>
      {children}
    </ModoContext.Provider>
  )
}

export function useModo() {
  const ctx = useContext(ModoContext)
  if (!ctx) throw new Error('useModo debe usarse dentro de <ModoProvider>')
  return ctx
}
