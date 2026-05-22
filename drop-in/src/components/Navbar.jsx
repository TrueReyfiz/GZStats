import { NavLink } from 'react-router-dom'

const NAV = [
  { to: '/',             label: 'Resenha',          end: true },
  { to: '/comparativo',  label: 'Comparativo' },
  { to: '/evolucao',     label: 'Evolução' },
  { to: '/vergonha',     label: 'Hall da Vergonha' },
]

const linkBase = 'px-4 py-2 rounded-full text-[13px] font-extrabold border-2 transition-all whitespace-nowrap'
const linkActive = 'bg-banana text-bg-0 border-bg-0 shadow-pill'
const linkIdle = 'text-warm-3 border-transparent hover:text-cream hover:bg-bg-1'

export default function Navbar() {
  return (
    <header className="sticky top-0 z-50 flex items-center gap-4 px-8 py-4 bg-bg-0 border-b-2 border-dashed gz-divider-dashed">
      <NavLink to="/" className="flex items-center gap-3 no-underline">
        <img src="/mascot-gorilla.svg" alt="Gorilla mascot" className="w-11 h-11"/>
        <div>
          <div className="font-display text-[22px] text-banana tracking-[1px] leading-none whitespace-nowrap">
            GORILLAZ <span className="text-cream">HUB</span>
          </div>
          <div className="text-[11px] text-warm-4 font-bold tracking-[0.5px] mt-1">
            A resenha do squad · BR1 Flex
          </div>
        </div>
      </NavLink>

      <nav className="flex gap-1.5 ml-6">
        {NAV.map(l => (
          <NavLink
            key={l.to}
            to={l.to}
            end={l.end}
            className={({ isActive }) => `${linkBase} ${isActive ? linkActive : linkIdle}`}
          >
            {l.label}
          </NavLink>
        ))}
      </nav>

      <div className="ml-auto flex items-center gap-3 text-xs text-warm-3 font-bold whitespace-nowrap">
        <span className="gz-live-dot w-2.5 h-2.5 rounded-full animate-bounce"/>
        <span>squad online</span>
      </div>
    </header>
  )
}
