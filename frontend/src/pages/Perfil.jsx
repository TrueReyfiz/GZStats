import { useEffect, useState, useMemo } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { getPerfil, getPartidas } from '../services/api'
import { TIER_HEX, ROTA_LABEL, fmtDiff, diffColor, SQUAD_COLORS } from '../lib/brand'
import TierPill from '../components/TierPill'
import Avatar from '../components/Avatar'
import StatBox from '../components/StatBox'
import MatchRow from '../components/MatchRow'
import Chip from '../components/Chip'

export default function Perfil() {
  const { puuid } = useParams()
  const navigate = useNavigate()
  const [perfil, setPerfil] = useState(null)
  const [partidas, setPartidas] = useState([])
  const [loading, setLoading] = useState(true)
  const [resultado, setResultado] = useState('todos')

  useEffect(() => {
    setLoading(true)
    Promise.all([getPerfil(puuid), getPartidas(puuid)])
      .then(([p, m]) => { setPerfil(p.data); setPartidas(m.data || []) })
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [puuid])

  const filtradas = useMemo(() =>
    partidas.filter(p =>
      resultado === 'todos' ? true :
      resultado === 'vitoria' ? p.vitoria : !p.vitoria
    ),
    [partidas, resultado]
  )

  if (loading) return <div className="py-20 text-center text-warm-4 font-bold">Carregando perfil…</div>
  if (!perfil)  return <div className="py-20 text-center text-loss font-bold">Jogador não encontrado.</div>

  const s = perfil.stats_medios || {}
  const tierColor = TIER_HEX[perfil.tier] || '#64748b'
  // We don't know the colorIdx here without the full squad — use a stable hash from puuid.
  const colorIdx = perfil.puuid?.charCodeAt(2) % SQUAD_COLORS.length
  const color = SQUAD_COLORS[colorIdx] || tierColor

  const v = filtradas.filter(p => p.vitoria).length
  const d = filtradas.length - v

  return (
    <div className="py-8">
      <button
        onClick={() => navigate('/')}
        className="bg-transparent border-0 text-warm-3 hover:text-banana text-xs font-extrabold tracking-wide cursor-pointer pl-0 mb-4 inline-flex items-center gap-1.5"
      >
        ← Voltar pra Resenha
      </button>

      {/* Hero */}
      <div className="bg-bg-1 rounded-lg p-6 mb-4 shadow-card border-2 border-bg-2 grid grid-cols-[110px_1fr_auto] gap-6 items-center">
        <Avatar
          name={perfil.riot_id}
          color={color}
          size={110}
          badge={perfil.hot_streak ? { emoji: '🔥', title: 'Hot streak' } : null}
        />
        <div>
          <h1 className="font-display text-[36px] text-cream m-0 -tracking-[0.5px]">
            {perfil.riot_id}
            <span className="text-warm-4 text-lg font-mono ml-1.5 tracking-normal">#{perfil.tag_line}</span>
          </h1>
          <div className="flex items-center gap-3 mt-2 flex-wrap">
            <TierPill tier={perfil.tier} rank={perfil.rank} size="lg"/>
            <span className="font-mono text-[13px] text-warm-3 font-bold">
              {perfil.lp} LP
              {perfil.rota_principal && ` · ${ROTA_LABEL[perfil.rota_principal] || perfil.rota_principal} main`}
            </span>
          </div>
          <div className="text-[13px] text-warm-3 mt-2.5 font-bold">
            {perfil.wins}V {perfil.losses}D · {perfil.winrate_geral}% WR geral · últimas {s.partidas_analisadas || 30} partidas
          </div>
        </div>
        {perfil.hot_streak && (
          <div className="bg-gradient-to-br from-clay to-clay-2 text-bg-0 px-4 py-2 rounded-full font-display text-sm tracking-wide shadow-pill">
            🔥 Em sequência!
          </div>
        )}
      </div>

      {/* Stat grids */}
      {s.kda_medio != null ? (
        <>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-3">
            <StatBox label="KDA Médio"   value={s.kda_medio}  color="#fbbf24" sub={`últimas ${s.partidas_analisadas || 30} partidas`}/>
            <StatBox label="CS / Min"    value={s.cspm_medio} color="#fde68a"/>
            <StatBox label="Dano / Min"  value={Math.round(s.dpm_medio)} color="#84cc16"/>
            <StatBox label="WR recente"
              value={`${s.winrate_recente}%`}
              color={s.winrate_recente >= 50 ? '#84cc16' : '#ef4444'}
              sub={`WR geral ${perfil.winrate_geral}%`}
            />
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
            <StatBox label="Kill Part."  value={`${s.kp_medio}%`} color="#ec4899"/>
            <StatBox label="Vision"      value={s.visao_medio} color="#60a5fa"/>
            <StatBox label="GD@15"       value={fmtDiff(s.gd15_medio)} color={diffColor(s.gd15_medio)} sub="ouro vs oponente"/>
            <StatBox label="CSD@15"      value={fmtDiff(s.csd15_medio, 1)} color={diffColor((s.csd15_medio || 0) * 100)} sub="CS vs oponente"/>
          </div>
        </>
      ) : (
        <div className="bg-bg-1 border-2 border-bg-2 rounded-md p-6 mb-6 text-center text-warm-4 font-bold">
          Sem partidas registradas ainda. Aguarde a sincronização automática.
        </div>
      )}

      {/* Filtros */}
      <div className="flex flex-wrap items-center gap-2 mb-2.5">
        <span className="text-[11px] text-warm-4 font-extrabold uppercase tracking-[1px] mr-1">Resultado</span>
        <Chip active={resultado==='todos'}   onClick={() => setResultado('todos')}>Todas</Chip>
        <Chip active={resultado==='vitoria'} onClick={() => setResultado('vitoria')}>✅ Vitórias</Chip>
        <Chip active={resultado==='derrota'} onClick={() => setResultado('derrota')}>❌ Derrotas</Chip>
      </div>

      {/* Histórico */}
      <div className="bg-bg-1 rounded-md border-2 border-bg-2 overflow-hidden shadow-card">
        <div className="px-[18px] py-3.5 border-b-2 border-dashed border-warm-5/30 flex items-center justify-between">
          <h3 className="font-display text-base text-cream m-0">📜 Histórico de partidas</h3>
          <span className="text-xs text-warm-4 font-bold">
            {filtradas.length} partidas · <span className="text-win">{v}V</span> / <span className="text-loss">{d}D</span>
          </span>
        </div>
        {filtradas.slice(0, 30).map(p => <MatchRow key={p.match_id} partida={p}/>)}
        {filtradas.length === 0 && (
          <div className="py-10 text-center text-warm-4 font-bold">
            🐒 Nenhuma partida com esse filtro.
          </div>
        )}
        {filtradas.length > 30 && (
          <div className="px-[18px] py-3 text-center text-xs text-warm-4 font-bold">
            Mostrando 30 de {filtradas.length} partidas
          </div>
        )}
      </div>
    </div>
  )
}
