import { useEffect, useState, useMemo } from 'react'
import { getJogadores, getAlertas } from '../services/api'
import { TIER_ORDER, eloScore } from '../lib/brand'
import ResenhaCards from '../components/ResenhaCards'
import PlayerCard from '../components/PlayerCard'
import SectionHeader from '../components/SectionHeader'
import AlertBanner from '../components/AlertBanner'
import Chip from '../components/Chip'

const TIER_FILTERS = [
  { label: 'Todo mundo', min: -1 },
  { label: 'Bronze+',    min:  1 },
  { label: 'Gold+',      min:  3 },
  { label: 'Plat+',      min:  4 },
  { label: 'Diamante+',  min:  6 },
]

export default function Ranking() {
  const [jogadores, setJogadores] = useState([])
  const [alertas, setAlertas]     = useState([])
  const [loading, setLoading]     = useState(true)
  const [busca, setBusca]         = useState('')
  const [tierMin, setTierMin]     = useState(-1)

  useEffect(() => {
    Promise.all([getJogadores(), getAlertas()])
      .then(([j, a]) => {
        setJogadores(j.data || [])
        setAlertas(a.data || [])
      })
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [])

  const ordenados = useMemo(() => {
    return [...jogadores]
      .filter(j =>
        j.riot_id.toLowerCase().includes(busca.toLowerCase()) &&
        (TIER_ORDER[j.tier] ?? -1) >= tierMin
      )
      .sort((a, b) => eloScore(b) - eloScore(a))
  }, [jogadores, busca, tierMin])

  // Pick MVP (best winrate+kda among hot-streakers, fallback to best kda)
  // and Troll (worst overall).
  const ranked = useMemo(() =>
    [...jogadores].sort((a, b) =>
      ((b.kda_medio ?? 0) * 10 + (b.winrate ?? 0)) - ((a.kda_medio ?? 0) * 10 + (a.winrate ?? 0))
    ),
    [jogadores]
  )
  const mvp   = ranked.find(j => j.hot_streak) || ranked[0]
  const troll = ranked[ranked.length - 1]

  if (loading) return <Spinner/>

  return (
    <div className="py-8">
      <ResenhaCards mvp={mvp} troll={troll}/>

      {alertas.length > 0 && (
        <div className="flex flex-col gap-2 mb-8">
          {alertas.map((a, i) => <AlertBanner key={i} {...a}/>)}
        </div>
      )}

      <SectionHeader
        title="Ranking"
        accent="do squad"
        sub={`últimas 30 partidas · ${jogadores.length} jogadores`}
      />

      <div className="flex flex-wrap items-center gap-2 mb-5">
        <span className="text-[11px] text-warm-4 font-extrabold uppercase tracking-[1px] mr-1">Tier</span>
        {TIER_FILTERS.map(f => (
          <Chip key={f.min} active={tierMin === f.min} onClick={() => setTierMin(f.min)}>
            {f.label}
          </Chip>
        ))}
        <div className="flex-1 min-w-[200px] flex items-center gap-2 bg-bg-1 border-2 border-bg-2 rounded-full px-4 py-2">
          <span className="text-warm-4">🔍</span>
          <input
            value={busca}
            onChange={e => setBusca(e.target.value)}
            placeholder="Caça o monkey..."
            className="flex-1 bg-transparent outline-none text-cream text-[13px] font-bold placeholder:text-warm-5"
          />
          {busca && (
            <button onClick={() => setBusca('')} className="text-warm-4 hover:text-cream text-xs">✕</button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {ordenados.map((j, i) => (
          <PlayerCard
            key={j.puuid}
            jogador={j}
            rank={i + 1}
            colorIdx={jogadores.findIndex(x => x.puuid === j.puuid)}
          />
        ))}
      </div>

      {ordenados.length === 0 && (
        <div className="py-16 text-center text-warm-4 font-bold">
          🐒 Nenhum monkey encontrado com esses filtros.
        </div>
      )}
    </div>
  )
}

function Spinner() {
  return <div className="py-20 text-center text-warm-4 font-bold">Carregando a resenha…</div>
}
