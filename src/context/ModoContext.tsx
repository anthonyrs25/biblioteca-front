import { createContext, useContext, useState } from 'react'
import type { ReactNode } from 'react'

type Modo = 'bibliotecario' | 'admin'

interface ModoContextType {
  esAdmin: boolean          // true si el usuario.rol real (en el backend) es 'admin'
  modoAdminActivo: boolean  // true solo si además está usando el sistema EN modo administrador ahora mismo
  activarModoAdmin: () => void
  volverAModoBibliotecario: () => void
}

const ModoContext = createContext<ModoContextType | null>(null)

// Cada sesión arranca en modo Bibliotecario por defecto, incluso para
// cuentas admin — así un clic accidental nunca borra o edita algo mientras
// se hace trabajo del día a día. Cambiar a modo Administrador es una
// decisión explícita cada vez que se inicia sesión.
export function ModoProvider({ children }: { children: ReactNode }) {
  const usuarioRaw = localStorage.getItem('biblioteca_usuario')
  const usuario = usuarioRaw ? JSON.parse(usuarioRaw) : null
  const esAdmin = usuario?.rol === 'admin'
  const [modo, setModo] = useState<Modo>('bibliotecario')

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