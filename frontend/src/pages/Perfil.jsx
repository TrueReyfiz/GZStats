import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { getPerfil, getPartidas } from '../services/api'

export default function Perfil() {
  const { puuid } = useParams()
  const navigate  = useNavigate()
  const [perfil, setPerfil]   = useState(null)
  const [partidas, setPartidas] = useState([])
  const [loading, setLoading]  = useState(true)

  useEffect(() => {
    Promise.all([getPerfil(puuid), getPartidas(puuid)])
      .then(([p, m]) => { setPerfil(p.data); setPartidas(m.data) })
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [puuid])

  if (loading) return <div className="text-center py-20 text-slate-500">Carregando perfil...</div>
  if (!perfil)  return <div className="text-center py-20 text-red-400">Jogador não encontrado.</div>

  const s = perfil.stats_medios

  return (
    <div className="py-8">
      <button onClick={() => navigate('/')} className="text-xs text-slate-500 hover:text-slate-300 mb-4">← Voltar ao Ranking</button>

      <div className="bg-[#0d1117] border border-white/5 rounded-lg p-6 mb-6 flex gap-4 items-center">
        <div className="w-14 h-14 rounded-full bg-green-400/10 border-2 border-green-400 flex items-center justify-center text-green-400 font-bold text-xl">
          {perfil.riot_id?.[0]}
        </div>
        <div className="flex-1">
          <div className="text-xl font-bold text-white">{perfil.riot_id} <span className="text-slate-500 text-sm font-normal">#{perfil.tag_line}</span></div>
          <div className="text-sm text-slate-400 mt-1">{perfil.tier} {perfil.rank} · {perfil.lp} LP</div>
        </div>
        {perfil.hot_streak && <div className="text-orange-400 text-sm">🔥 Em sequência!</div>}
      </div>

      {s && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          {[
            { label: 'KDA Médio',   value: s.kda_medio,   color: 'text-cyan-400' },
            { label: 'CS / Min',    value: s.cspm_medio,  color: 'text-amber-400' },
            { label: 'Dano / Min',  value: s.dpm_medio,   color: 'text-green-400' },
            { label: 'Winrate',     value: `${s.winrate}%`, color: 'text-white' },
          ].map(c => (
            <div key={c.label} className="bg-[#0d1117] border border-white/5 rounded-lg p-4">
              <div className="text-xs uppercase tracking-widest text-slate-500 mb-2">{c.label}</div>
              <div className={`text-2xl font-bold ${c.color}`}>{c.value}</div>
            </div>
          ))}
        </div>
      )}

      <div className="bg-[#0d1117] border border-white/5 rounded-lg overflow-hidden">
        <div className="px-4 py-3 border-b border-white/5 text-xs uppercase tracking-widest text-slate-500">Últimas Partidas</div>
        {partidas.slice(0, 10).map(p => (
          <div key={p.match_id} className="flex items-center gap-4 px-4 py-3 border-b border-white/5 hover:bg-white/3 transition-colors">
            <div className={`w-1 h-10 rounded-full ${p.vitoria ? 'bg-green-400' : 'bg-red-400'}`}/>
            <div className="w-10 h-10 rounded bg-white/5 flex items-center justify-center text-xs font-bold text-amber-400">
              {p.campeao?.slice(0, 3).toUpperCase()}
            </div>
            <div className="flex-1">
              <div className="font-semibold text-white text-sm">{p.campeao}</div>
              <div className="text-xs text-slate-500">{p.rota} · {p.duracao_min}min</div>
            </div>
            <div className="text-sm text-center">
              <span className="text-green-400">{p.kills}</span>
              <span className="text-slate-500">/</span>
              <span className="text-red-400">{p.deaths}</span>
              <span className="text-slate-500">/</span>
              <span className="text-white">{p.assists}</span>
              <div className="text-xs text-slate-500">KDA {p.kda}</div>
            </div>
            <div className="text-right text-sm">
              <div className="text-white font-semibold">{p.cs} CS</div>
              <div className="text-xs text-slate-500">{p.cspm}/min</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
