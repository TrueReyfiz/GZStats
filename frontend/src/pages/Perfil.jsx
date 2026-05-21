import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { getPerfil, getPartidas } from '../services/api'

const TIER_COLOR = {
  IRON: 'text-slate-400',        BRONZE: 'text-amber-700',
  SILVER: 'text-slate-300',      GOLD: 'text-amber-400',
  PLATINUM: 'text-teal-400',     EMERALD: 'text-green-400',
  DIAMOND: 'text-blue-400',      MASTER: 'text-purple-400',
  GRANDMASTER: 'text-red-400',   CHALLENGER: 'text-yellow-300',
  UNRANKED: 'text-slate-500',
}

function StatCard({ label, value, color = 'text-white', sub }) {
  return (
    <div className="bg-[#0d1117] border border-white/5 rounded-lg p-4">
      <div className="text-xs uppercase tracking-widest text-slate-500 mb-1">{label}</div>
      <div className={`text-2xl font-bold ${color}`}>{value ?? '—'}</div>
      {sub && <div className="text-xs text-slate-600 mt-1">{sub}</div>}
    </div>
  )
}

function diffColor(val) {
  if (val === null || val === undefined) return 'text-slate-500'
  if (val >= 300)  return 'text-green-400'
  if (val >= 0)    return 'text-slate-300'
  if (val >= -300) return 'text-amber-400'
  return 'text-red-400'
}

function fmtDiff(val, decimals = 0) {
  if (val === null || val === undefined) return 'N/A'
  const n = decimals > 0 ? val.toFixed(decimals) : Math.round(val)
  return val >= 0 ? `+${n}` : `${n}`
}

function formatDate(iso) {
  if (!iso) return ''
  const d = new Date(iso)
  return d.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' }) +
         ' ' +
         d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
}

export default function Perfil() {
  const { puuid }  = useParams()
  const navigate   = useNavigate()
  const [perfil,   setPerfil]   = useState(null)
  const [partidas, setPartidas] = useState([])
  const [loading,  setLoading]  = useState(true)

  useEffect(() => {
    Promise.all([getPerfil(puuid), getPartidas(puuid)])
      .then(([p, m]) => { setPerfil(p.data); setPartidas(m.data) })
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [puuid])

  if (loading) return <div className="text-center py-20 text-slate-500">Carregando perfil...</div>
  if (!perfil)  return <div className="text-center py-20 text-red-400">Jogador não encontrado.</div>

  const s          = perfil.stats_medios
  const tierColor  = TIER_COLOR[perfil.tier] ?? 'text-slate-400'

  return (
    <div className="py-8">
      <button
        onClick={() => navigate('/')}
        className="text-xs text-slate-500 hover:text-slate-300 mb-4 flex items-center gap-1"
      >
        ← Voltar ao Ranking
      </button>

      {/* ── Header ── */}
      <div className="bg-[#0d1117] border border-white/5 rounded-lg p-6 mb-6">
        <div className="flex gap-4 items-center">
          <div className={`w-14 h-14 rounded-full bg-white/5 border-2 flex items-center justify-center font-bold text-xl ${tierColor}`}
               style={{ borderColor: 'currentColor' }}>
            {perfil.riot_id?.[0]}
          </div>

          <div className="flex-1">
            <div className="text-xl font-bold text-white">
              {perfil.riot_id}
              <span className="text-slate-500 text-sm font-normal ml-1">#{perfil.tag_line}</span>
            </div>
            <div className={`text-sm font-semibold mt-0.5 ${tierColor}`}>
              {perfil.tier} {perfil.rank} · {perfil.lp} LP
            </div>
            <div className="text-xs text-slate-500 mt-1">
              {perfil.wins}V {perfil.losses}D · {perfil.winrate_geral}% WR geral
            </div>
          </div>

          {perfil.hot_streak && (
            <div className="text-orange-400 text-sm font-semibold">🔥 Em sequência!</div>
          )}
        </div>
      </div>

      {/* ── Stats ── */}
      {s ? (
        <>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-3">
            <StatCard
              label="KDA Médio" value={s.kda_medio} color="text-cyan-400"
              sub={`últ. ${s.partidas_analisadas} partidas`}
            />
            <StatCard label="CS / Min"    value={s.cspm_medio}             color="text-amber-400" />
            <StatCard label="Dano / Min"  value={Math.round(s.dpm_medio)}  color="text-green-400" />
            <StatCard
              label="WR recente" value={`${s.winrate_recente}%`}
              color={s.winrate_recente >= 50 ? 'text-green-400' : 'text-red-400'}
              sub={`WR geral: ${perfil.winrate_geral}%`}
            />
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
            <StatCard label="Kill Part."   value={`${s.kp_medio}%`}              color="text-purple-400" />
            <StatCard label="Vision Score" value={s.visao_medio}                 color="text-blue-400" />
            <StatCard
              label="GD@15 Médio"
              value={fmtDiff(s.gd15_medio)}
              color={diffColor(s.gd15_medio)}
              sub="ouro vs oponente"
            />
            <StatCard
              label="CSD@15"
              value={fmtDiff(s.csd15_medio, 1)}
              color={diffColor(s.csd15_medio)}
              sub="CS vs oponente"
            />
          </div>
        </>
      ) : (
        <div className="bg-[#0d1117] border border-white/5 rounded-lg p-6 mb-6 text-center text-slate-500 text-sm">
          Sem partidas registradas ainda. Aguarde a sincronização automática.
        </div>
      )}

      {/* ── Histórico ── */}
      <div className="bg-[#0d1117] border border-white/5 rounded-lg overflow-hidden">
        <div className="px-4 py-3 border-b border-white/5 flex items-center justify-between">
          <span className="text-xs uppercase tracking-widest text-slate-500">Histórico de Partidas</span>
          <span className="text-xs text-slate-600">{partidas.length} registradas</span>
        </div>

        {partidas.length === 0 && (
          <div className="px-4 py-8 text-center text-slate-600 text-sm">
            Nenhuma partida registrada.
          </div>
        )}

        {partidas.slice(0, 20).map(p => (
          <div
            key={p.match_id}
            className="flex items-center gap-3 px-4 py-3 border-b border-white/5 hover:bg-white/[0.03] transition-colors"
          >
            {/* Barra vitória/derrota */}
            <div className={`w-1 h-12 rounded-full flex-shrink-0 ${p.vitoria ? 'bg-green-400' : 'bg-red-400'}`} />

            {/* Campeão */}
            <div className="w-9 h-9 rounded bg-white/5 flex items-center justify-center text-xs font-bold text-amber-400 flex-shrink-0">
              {p.campeao?.slice(0, 3).toUpperCase()}
            </div>

            {/* Info principal */}
            <div className="flex-1 min-w-0">
              <div className="font-semibold text-white text-sm leading-tight">{p.campeao}</div>
              <div className="text-xs text-slate-500 mt-0.5">
                {p.rota || '—'} · {p.duracao_min}min
                {p.data ? ` · ${formatDate(p.data)}` : ''}
              </div>
            </div>

            {/* KDA */}
            <div className="text-sm text-center w-20 flex-shrink-0">
              <div>
                <span className="text-green-400">{p.kills}</span>
                <span className="text-slate-600">/</span>
                <span className="text-red-400">{p.deaths}</span>
                <span className="text-slate-600">/</span>
                <span className="text-white">{p.assists}</span>
              </div>
              <div className="text-xs text-slate-500">KDA {p.kda}</div>
            </div>

            {/* CS */}
            <div className="text-right text-sm w-16 flex-shrink-0 hidden sm:block">
              <div className="text-white font-semibold">{p.cs} CS</div>
              <div className="text-xs text-slate-500">{p.cspm}/min</div>
            </div>

            {/* GD@15 */}
            <div className={`text-right text-xs w-14 flex-shrink-0 hidden md:block font-semibold ${diffColor(p.gd15)}`}>
              {p.gd15 !== null && p.gd15 !== undefined ? fmtDiff(p.gd15) : '—'}
              <div className="text-slate-600 font-normal">GD@15</div>
            </div>

            {/* KP% */}
            <div className="text-right text-xs w-12 flex-shrink-0 hidden lg:block">
              <div className="text-purple-400 font-semibold">
                {p.kill_participation != null ? `${Math.round(p.kill_participation)}%` : '—'}
              </div>
              <div className="text-slate-600">KP</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
