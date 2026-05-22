/**
 * Filter chip — banana-yellow when active, dark-warm when default.
 * Drop-in for buttons that toggle a state.
 */
export default function Chip({ active, onClick, children, type = 'button' }) {
  const base = 'px-3.5 py-1.5 rounded-full text-xs font-bold border-2 transition-all whitespace-nowrap font-body'
  if (active) {
    return (
      <button type={type} onClick={onClick}
        className={`${base} bg-banana text-bg-0 border-bg-0 shadow-pill`}>
        {children}
      </button>
    )
  }
  return (
    <button type={type} onClick={onClick}
      className={`${base} bg-bg-1 text-warm-3 border-bg-2 hover:text-cream hover:border-warm-5`}>
      {children}
    </button>
  )
}
