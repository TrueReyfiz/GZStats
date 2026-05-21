import { useEffect, useState, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { getJogadores } from '../services/api'

const TIER_COLOR = {
  IRON: 'text-slate-400',        BRONZE: 'text-amber-700',
  SILVER: 'text-slate-300',      GOLD: 'text-amber-400',
  PLATINUM: 'text-teal-400',     EMERALD: 'text-green-400',
  DIAMOND: 'text-blue-400',      MASTER: 'text-purple-400',
  GRANDMASTER: 'text-red-400',   CHALLENGER: 'text-yellow-300',
  UNRANKED: 'text-slate-500',
}
const TIER_BG = {
  IRON: 'bg-slate-400/10',       BRONZE: 'bg-amber-700/10',
  SILVER: 'bg-slate-300/10',     GOLD: 'bg-amber-400/10',
  PLATINUM: 'bg-teal-400/10',    EMERALD: 'bg-green-400/10',
  DIAMOND: 'bg-blue-400/10',     MASTER: 'bg-purple-400/10',
  GRANDMASTER: 'bg-red-400/10',  CHALLENGER: 'bg-yellow-300/10',
  UNRANKED: 'bg-slate-500/10',
}
const TIER_ORDER = {
  UNRANKED:-1, IRON:0, BRONZE:1, SILVER:2, GOLD:3,
  PLATINUM:4, EMERALD:5, DIAMOND:6, MASTER:7, GRANDMASTER:8, CHALLENGER:9,
}
const RANK_ORDER = { IV:0, III:1, II:2, I:3, '':0 }

const TIERS_FILTER = [
  { label: 'Todos',     min: -1 },
  { label: 'IRON+',     min:  0 },
  { label: 'BRONZE+',   min:  1 },
  { label: 'SILVER+',   min:  2 },
  { label: 'GOLD+',     min:  3 },
  { label: 'PLATINUM+', min:  4 },
  { label: 'EMERALD+',  min:  5 },
  { label: 'DIAMOND+',  min:  6 },
]

function SortIcon({ col, sortCol, sortDir }) {
  if (sortCol !== col) return <span className="text-slate-700 ml-1">↕</span>
  return <span className="text-cyan-400 ml-1">{sortDir === 'asc' ? '↑' : '↓'}</span>
}

function KdaBadge({ value }) {
  const color = value >= 4 ? 'text-cyan-400' : value >= 3 ? 'text-green-400' : value >= 2 ? 'text-amber-400' : 'text-red-400'
  return <span className={`font-bold ${color}`}>{value}</span>
}
function WrBadge({ value }) {
  const color = value >= 55 ? 'text-cyan-400' : value >= 50 ? 'text-green-400' : value >= 45 ? 'text-amber-400' : 'text-red-400'
  return <span className={`font-bold ${color}`}>{value}%</span>
}

export default function Ranking() {
  const [jogadores, setJogadores] = useState([])
  const [loading,   setLoading]   = useState(true)
  const [busca,     setBusca]     = useState('')
  const [tierMin,   setTierMin]   = useState(-1)
  const [sortCol,   setSortCol]   = useState('elo')
  const [sortDir,   setSortDir]   = useState('desc')
  const navigate = useNavigate()

  useEffect(() => {
    getJogadores()
      .then(r => setJogadores(r.data))
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [])

  function handleSort(col) {
    if (sortCol === col) {
      setSortDir(d => d === 'desc' ? 'asc' : 'desc')
    } else {
      setSortCol(col)
      setSortDir('desc')
    }
  }

  const lista = useMemo(() => {
    let arr = jogadores.filter(j => {
      const nomeFit = j.riot_id.toLowerCase().includes(busca.toLowerCase())
      const tierFit = TIER_ORDER[j.tier] >= tierMin
      return nomeFit && tierFit
    })

    arr = [...arr].sort((a, b) => {
      let va, vb
      switch (sortCol) {
        case 'elo':
          va = TIER_ORDER[a.tier] * 10000 + RANK_ORDER[a.rank] * 100 + a.lp
          vb = TIER_ORDER[b.tier] * 10000 + RANK_ORDER[b.rank] * 100 + b.lp
          break
        case 'lp':     va = a.lp;         vb = b.lp;         break
        case 'winrate':va = a.winrate;     vb = b.winrate;    break
        case 'kda':    va = a.kda_medio;   vb = b.kda_medio;  break
        case 'dpm':    va = a.dpm_medio;   vb = b.dpm_medio;  break
        default:       va = 0;             vb = 0
      }
      return sortDir === 'desc' ? vb - va : va - vb
    })

    return arr
  }, [jogadores, busca, tierMin, sortCol, sortDir])

  if (loading) return <div className="text-center py-20 text-slate-500">Carregando...</div>

  const maxPartidas = Math.max(...jogadores.map(j => j.partidas_analisadas || 0), 0)
  const tiersPresentes = new Set(jogadores.map(j => j.tier))

  return (
    <div className="py-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-white">
          Ranking do <span className="text-cyan-400">Time</span>
        </h1>
        <p className="text-slate-500 text-sm mt-1">
          Ranked Flex · BR1 · {jogadores.length} jogadores
          {maxPartidas > 0 && ` · stats das últimas ${maxPartidas} partidas`}
        </p>
      </div>

      {/* ── Filtros ── */}
      <div className="bg-[#0d1117] border border-white/5 rounded-lg p-4 mb-4 flex flex-col gap-3">

        {/* Busca por nome */}
        <div className="relative">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 text-sm">🔍</span>
          <input
            type="text"
            placeholder="Buscar jogador..."
            value={busca}
            onChange={e => setBusca(e.target.value)}
            className="w-full bg-white/5 border border-white/10 rounded-lg pl-8 pr-4 py-2 text-sm text-white placeholder-slate-600 focus:outline-none focus:border-cyan-400/50 transition-colors"
          />
          {busca && (
            <button
              onClick={() => setBusca('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 text-xs"
            >✕</button>
          )}
        </div>

        {/* Filtro por Tier */}
        <div className="flex gap-2 flex-wrap items-center">
          <span className="text-xs text-slate-500 uppercase tracking-widest mr-1">Tier</span>
          {TIERS_FILTER.filter(t =>
            t.min === -1 || [...tiersPresentes].some(tier => TIER_ORDER[tier] >= t.min)
          ).map(t => (
            <button
              key={t.min}
              onClick={() => setTierMin(t.min)}
              className={`px-3 py-1 text-xs font-medium rounded border transition-all ${
                tierMin === t.min
                  ? 'text-cyan-400 bg-cyan-400/10 border-cyan-400/30'
                  : 'text-slate-400 border-white/10 hover:border-white/20'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {/* ── Tabela ── */}
      <div className="bg-[#0d1117] border border-white/5 rounded-lg overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-white/5 text-slate-500 text-xs uppercase tracking-widest select-none">
              <th className="py-3 px-4 text-center w-10">#</th>
              <th className="py-3 px-4 text-left">Jogador</th>
              <th
                className="py-3 px-4 text-left cursor-pointer hover:text-slate-300 transition-colors"
                onClick={() => handleSort('elo')}
              >
                Elo <SortIcon col="elo" sortCol={sortCol} sortDir={sortDir} />
              </th>
              <th
                className="py-3 px-4 text-center cursor-pointer hover:text-slate-300 transition-colors"
                onClick={() => handleSort('lp')}
              >
                LP <SortIcon col="lp" sortCol={sortCol} sortDir={sortDir} />
              </th>
              <th className="py-3 px-4 text-center hidden sm:table-cell">W / D</th>
              <th
                className="py-3 px-4 text-center cursor-pointer hover:text-slate-300 transition-colors"
                onClick={() => handleSort('winrate')}
              >
                WR% <SortIcon col="winrate" sortCol={sortCol} sortDir={sortDir} />
              </th>
              <th
                className="py-3 px-4 text-center cursor-pointer hover:text-slate-300 transition-colors hidden md:table-cell"
                onClick={() => handleSort('kda')}
              >
                KDA <SortIcon col="kda" sortCol={sortCol} sortDir={sortDir} />
              </th>
              <th
                className="py-3 px-4 text-center cursor-pointer hover:text-slate-300 transition-colors hidden lg:table-cell"
                onClick={() => handleSort('dpm')}
              >
                DPM <SortIcon col="dpm" sortCol={sortCol} sortDir={sortDir} />
              </th>
            </tr>
          </thead>
          <tbody>
            {lista.length === 0 && (
              <tr>
                <td colSpan={8} className="py-10 text-center text-slate-600 text-sm">
                  Nenhum jogador encontrado com esses filtros.
                </td>
              </tr>
            )}
            {lista.map((j, i) => (
              <tr
                key={j.puuid}
                onClick={() => navigate(`/jogador/${j.puuid}`)}
                className="border-b border-white/5 hover:bg-white/[0.03] cursor-pointer transition-colors"
              >
                <td className="py-3 px-4 text-center font-bold text-slate-500">{i + 1}</td>
                <td className="py-3 px-4">
                  <div className="flex items-center gap-2">
                    {j.hot_streak && <span title="Em sequência!">🔥</span>}
                    <div>
                      <div className="font-semibold text-white text-sm leading-tight">{j.riot_id}</div>
                      <div className="text-xs text-slate-500">#{j.tag_line}</div>
                    </div>
                  </div>
                </td>
                <td className="py-3 px-4">
                  <span className={`text-xs font-bold px-2 py-0.5 rounded ${TIER_COLOR[j.tier] ?? 'text-slate-400'} ${TIER_BG[j.tier] ?? 'bg-white/5'}`}>
                    {j.tier === 'UNRANKED' ? 'UNRANKED' : `${j.tier} ${j.rank}`}
                  </span>
                </td>
                <td className="py-3 px-4 text-center font-bold text-white text-sm">{j.lp}</td>
                <td className="py-3 px-4 text-center text-xs hidden sm:table-cell">
                  <span className="text-green-400">{j.wins}V</span>
                  <span className="text-slate-600 mx-1">/</span>
                  <span className="text-red-400">{j.losses}D</span>
                </td>
                <td className="py-3 px-4 text-center text-sm">
                  <WrBadge value={j.winrate} />
                </td>
                <td className="py-3 px-4 text-center hidden md:table-cell">
                  <KdaBadge value={j.kda_medio} />
                </td>
                <td className="py-3 px-4 text-center text-sm text-slate-300 hidden lg:table-cell">
                  {j.dpm_medio ? Math.round(j.dpm_medio) : '—'}
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {lista.length > 0 && (
          <div className="px-4 py-2 border-t border-white/5 text-xs text-slate-600 text-right">
            {lista.length} de {jogadores.length} jogadores
          </div>
        )}
      </div>
    </div>
  )
}
