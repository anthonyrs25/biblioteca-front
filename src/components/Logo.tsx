// CÓMO REEMPLAZAR EL LOGO:
// Cambia el contenido de esta función por:
// <img src="/logo.png" alt="Instituto Sudamericano" style={{ height: 40 }} />
// Y coloca tu logo en la carpeta /public

interface Props {
  size?: 'small' | 'large'
  dark?: boolean
}

function Logo({ size = 'small', dark = false }: Props) {
  const isLarge = size === 'large'

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: isLarge ? 16 : 10 }}>
      {/* Placeholder del logo — reemplaza esto con tu imagen */}
      <div style={{
        width: isLarge ? 56 : 38,
        height: isLarge ? 56 : 38,
        borderRadius: isLarge ? 14 : 10,
        background: 'linear-gradient(135deg, #0d9488, #0ea5e9)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontWeight: 900,
        fontSize: isLarge ? 22 : 15,
        color: '#fff',
        letterSpacing: '-0.5px',
        flexShrink: 0,
      }}>
        IS
      </div>
      <div>
        <div style={{
          fontWeight: 800,
          fontSize: isLarge ? 20 : 14,
          color: dark ? '#0f172a' : '#fff',
          lineHeight: 1.1,
          letterSpacing: '-0.3px',
        }}>
          Instituto Sudamericano
        </div>
        <div style={{
          fontSize: isLarge ? 13 : 11,
          color: dark ? '#6b7280' : 'rgba(255,255,255,0.7)',
          fontWeight: 500,
        }}>
          Biblioteca Daniel Perazzo
        </div>
      </div>
    </div>
  )
}

export default Logo