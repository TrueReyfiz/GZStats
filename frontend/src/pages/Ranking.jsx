import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { getJogadores } from '../services/api'

const TIER_COLOR = {
  IRON: 'text-slate-400', BRONZE: 'text-amber-700', SILVER: 'text-slate-300',
  GOLD: 'text-amber-400', PLATINUM: 'text-teal-400', EMERALD: 'text-green-400',
  DIAMOND: 'text-blue-400', MASTER: 'text-purple-400', GRANDMASTER: 'text-red-400',
  CHALLENGER: 'text-yellow-300', UNRANKED: 'text-slate-500'
}

export default function Ranking() {
  const [jogadores, setJogadores] = useState([])
  const [loading, setLoading] = useState(true)
  const navigate = useNavigate()

  useEffect(() => {
    getJogadores()
      .then(r => setJogadores(r.data))
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [])

  if (loading) return <div className="text-center py-20 text-slate-500">Carregando...</div>

  return (
    <div className="py-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-white">Ranking do <span className="text-cyan-400">Time</span></h1>
        <p className="text-slate-500 text-sm mt-1">Ranked Flex · BR1 · {jogadores.length} jogadores</p>
      </div>

      <div className="bg-[#0d1117] border border-white/5 rounded-lg overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b border-white/5 text-slate-500 text-xs uppercase tracking-widest">
              <th className="py-3 px-4 text-center w-12">#</th>
              <th className="py-3 px-4 text-left">Jogador</th>
              <th className="py-3 px-4 text-left">Elo</th>
              <th className="py-3 px-4 text-left">LP</th>
              <th className="py-3 px-4 text-left">Winrate</th>
            </tr>
          </thead>
          <tbody>
            {jogadores.map((j, i) => (
              <tr
                key={j.puuid}
                onClick={() => navigate(`/jogador/${j.puuid}`)}
                className="border-b border-white/5 hover:bg-white/3 cursor-pointer transition-colors"
              >
                <td className="py-3 px-4 text-center font-bold text-slate-500">{i + 1}</td>
                <td className="py-3 px-4">
                  <div className="font-semibold text-white">{j.riot_id}</div>
                  <div className="text-xs text-slate-500">#{j.tag_line}</div>
                </td>
                <td className="py-3 px-4">
                  <span className={`text-sm font-semibold ${TIER_COLOR[j.tier] || 'text-slate-400'}`}>
                    {j.tier} {j.rank}
                  </span>
                </td>
                <td className="py-3 px-4 font-bold text-white">{j.lp} <span className="text-slate-500 font-normal text-xs">LP</span></td>
                <td className="py-3 px-4">
                  <div className="text-sm font-semibold text-white">{j.winrate}%</div>
                  <div className="text-xs text-slate-500">{j.wins}V / {j.losses}D</div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
