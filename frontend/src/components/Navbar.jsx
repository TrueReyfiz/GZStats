import { NavLink } from 'react-router-dom'

export default function Navbar() {
  const link = ({ isActive }) =>
    `px-4 py-1.5 text-xs font-medium uppercase tracking-widest rounded transition-all border ${
      isActive
        ? 'text-cyan-400 bg-cyan-400/10 border-cyan-400/30'
        : 'text-slate-400 border-transparent hover:text-slate-200 hover:bg-white/5'
    }`

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 h-14 flex items-center px-6 gap-6 bg-[#080b10]/90 backdrop-blur border-b border-white/5">
      <span className="font-bold text-sm tracking-widest text-amber-400 mr-2">
        ⚔️ GZ<span className="text-cyan-400">STATS</span>
      </span>
      <div className="flex gap-1">
        <NavLink to="/"             className={link}>Ranking</NavLink>
        <NavLink to="/comparativo"  className={link}>Comparativo</NavLink>
        <NavLink to="/evolucao"     className={link}>Evolução</NavLink>
      </div>
      <span className="ml-auto text-xs text-green-400 flex items-center gap-2">
        <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse"/>
        Online
      </span>
    </nav>
  )
}
