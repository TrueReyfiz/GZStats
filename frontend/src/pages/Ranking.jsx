import { useEffect, useState } from 'react'
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

function KdaBadge({ value }) {
  const color =
    value >= 4   ? 'text-cyan-400' :
    value >= 3   ? 'text-green-400' :
    value >= 2   ? 'text-amber-400' :
                   'text-red-400'
  return <span className={`font-bold ${color}`}>{value}</span>
}

function WrBadge({ value }) {
  const color =
    value >= 55 ? 'text-cyan-400' :
    value >= 50 ? 'text-green-400' :
    value >= 45 ? 'text-amber-400' :
                  'text-red-400'
  return <span className={`font-bold ${color}`}>{value}%</span>
}

export default function Ranking() {
  const [jogadores, setJogadores] = useState([])
  const [loading, setLoading]     = useState(true)
  const navigate = useNavigate()

  useEffect(() => {
    getJogadores()
      .then(r => setJogadores(r.data))
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [])

  if (loading) return <div className="text-center py-20 text-slate-500">Carregando...</div>

  const maxPartidas = Math.max(...jogadores.map(j => j.partidas_analisadas || 0), 0)

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

      <div className="bg-[#0d1117] border border-white/5 rounded-lg overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-white/5 text-slate-500 text-xs uppercase tracking-widest">
              <th className="py-3 px-4 text-center w-10">#</th>
              <th className="py-3 px-4 text-left">Jogador</th>
              <th className="py-3 px-4 text-left">Elo</th>
              <th className="py-3 px-4 text-center">LP</th>
              <th className="py-3 px-4 text-center hidden sm:table-cell">W / D</th>
              <th className="py-3 px-4 text-center">WR%</th>
              <th className="py-3 px-4 text-center hidden md:table-cell">KDA</th>
              <th className="py-3 px-4 text-center hidden lg:table-cell">DPM</th>
            </tr>
          </thead>
          <tbody>
            {jogadores.map((j, i) => (
              <tr
                key={j.puuid}
                onClick={() => navigate(`/jogador/${j.puuid}`)}
                className="border-b border-white/5 hover:bg-white/[0.03] cursor-pointer transition-colors"
              >
                {/* Posição */}
                <td className="py-3 px-4 text-center font-bold text-slate-500">{i + 1}</td>

                {/* Jogador */}
                <td className="py-3 px-4">
                  <div className="flex items-center gap-2">
                    {j.hot_streak && <span title="Em sequência!">🔥</span>}
                    <div>
                      <div className="font-semibold text-white text-sm leading-tight">{j.riot_id}</div>
                      <div className="text-xs text-slate-500">#{j.tag_line}</div>
                    </div>
                  </div>
                </td>

                {/* Elo badge */}
                <td className="py-3 px-4">
                  <span className={`text-xs font-bold px-2 py-0.5 rounded ${TIER_COLOR[j.tier] ?? 'text-slate-400'} ${TIER_BG[j.tier] ?? 'bg-white/5'}`}>
                    {j.tier === 'UNRANKED' ? 'UNRANKED' : `${j.tier} ${j.rank}`}
                  </span>
                </td>

                {/* LP */}
                <td className="py-3 px-4 text-center font-bold text-white text-sm">{j.lp}</td>

                {/* W/D */}
                <td className="py-3 px-4 text-center text-xs hidden sm:table-cell">
                  <span className="text-green-400">{j.wins}V</span>
                  <span className="text-slate-600 mx-1">/</span>
                  <span className="text-red-400">{j.losses}D</span>
                </td>

                {/* Winrate */}
                <td className="py-3 px-4 text-center text-sm">
                  <WrBadge value={j.winrate} />
                </td>

                {/* KDA */}
                <td className="py-3 px-4 text-center hidden md:table-cell">
                  <KdaBadge value={j.kda_medio} />
                </td>

                {/* DPM */}
                <td className="py-3 px-4 text-center text-sm text-slate-300 hidden lg:table-cell">
                  {j.dpm_medio ? Math.round(j.dpm_medio) : '—'}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
