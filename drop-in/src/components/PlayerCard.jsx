import { useNavigate } from 'react-router-dom'
import { SQUAD_COLORS, ROTA_LABEL } from '../lib/brand'
import Avatar from './Avatar'
import TierPill from './TierPill'

/**
 * Player card with rank medallion, avatar, tier pill and a 3-stat footer.
 * Used in the Ranking grid.
 */
export default function PlayerCard({ jogador, rank, colorIdx = 0 }) {
  const navigate = useNavigate()
  const p = jogador
  const color = SQUAD_COLORS[colorIdx % SQUAD_COLORS.length]

  const rankColor =
    rank === 1 ? 'bg-banana text-bg-0' :
    rank === 2 ? 'bg-[#cbd5e1] text-bg-0' :
    rank === 3 ? 'bg-clay text-cream' :
                 'bg-warm-5 text-cream'

  const kdaColor = p.kda_medio >= 3 ? 'text-banana' : p.kda_medio >= 2 ? 'text-cream' : 'text-loss'
  const wrColor =
    p.winrate >= 55 ? 'text-banana' :
    p.winrate >= 50 ? 'text-win' :
    p.winrate >= 45 ? 'text-warn' : 'text-loss'

  const border = p.hot_streak
    ? 'border-clay/40'
    : 'border-bg-2 hover:border-warm-5'

  return (
    <button
      onClick={() => navigate(`/jogador/${p.puuid}`)}
      className={`relative text-left bg-bg-1 rounded-md p-[18px] border-2 ${border} shadow-card transition-transform duration-200 hover:-translate-y-1 cursor-pointer w-full`}
    >
      <span className={`absolute -top-2.5 -left-2.5 w-9 h-9 rounded-full ${rankColor} font-display text-base flex items-center justify-center border-[3px] border-bg-0 shadow-pill`}>
        {rank}
      </span>

      {p.hot_streak && (
        <span className="absolute top-3.5 right-3.5 text-lg rotate-[8deg]" title="Em sequência!">🔥</span>
      )}

      <div className="flex items-center gap-3 mb-3.5">
        <Avatar name={p.riot_id} color={color}/>
        <div>
          <div className="font-display text-[18px] text-cream leading-none -tracking-[0.3px]">
            {p.riot_id}
          </div>
          <div className="text-[11px] text-warm-4 mt-1 font-mono">
            #{p.tag_line}{p.rota_principal ? ` · ${ROTA_LABEL[p.rota_principal] || p.rota_principal}` : ''}
          </div>
        </div>
      </div>

      <div className="flex items-center gap-2 flex-wrap mb-3">
        <TierPill tier={p.tier} rank={p.rank}/>
        <span className="font-mono text-xs text-warm-4">· {p.lp} LP</span>
      </div>

      <div className="grid grid-cols-3 gap-2 pt-3 border-t-2 border-dashed border-warm-5/30">
        <Cell label="KDA" value={p.kda_medio} colorClass={kdaColor}/>
        <Cell label="WR"  value={`${p.winrate}%`} colorClass={wrColor}/>
        <Cell label="DPM" value={Math.round(p.dpm_medio || 0)} colorClass="text-cream"/>
      </div>
    </button>
  )
}

function Cell({ label, value, colorClass }) {
  return (
    <div className="text-center">
      <div className="text-[10px] text-warm-4 font-extrabold uppercase tracking-[0.5px]">{label}</div>
      <div className={`font-mono text-[17px] font-bold mt-0.5 ${colorClass}`}>{value}</div>
    </div>
  )
}
