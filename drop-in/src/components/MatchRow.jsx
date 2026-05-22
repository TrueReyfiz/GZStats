import { ROTA_LABEL, fmtDiff, diffColor } from '../lib/brand'

/**
 * Single row in a player's match history.
 * Reads a record from getPartidas() with shape: { match_id, vitoria, campeao, rota, duracao_min, kills, deaths, assists, kda, cs, cspm, gd15, kill_participation, data }
 */
export default function MatchRow({ partida: p }) {
  return (
    <div className="flex items-center gap-3.5 px-[18px] py-3.5 border-b border-dashed border-warm-5/15 last:border-b-0 hover:bg-white/[0.02] transition-colors">
      <div className={`w-1.5 h-12 rounded-full flex-shrink-0 ${p.vitoria ? 'bg-jungle' : 'bg-loss'}`}/>

      <div className="w-11 h-11 rounded-lg bg-bg-2 flex items-center justify-center font-display text-[13px] text-banana flex-shrink-0">
        {p.campeao?.slice(0, 3).toUpperCase()}
      </div>

      <div className="flex-1 min-w-0">
        <div className="font-display text-base text-cream -tracking-[0.3px]">{p.campeao}</div>
        <div className="text-[11px] text-warm-4 font-mono mt-0.5">
          {ROTA_LABEL[p.rota] || p.rota || '—'} · {p.duracao_min}min · {p.vitoria ? 'Vitória' : 'Derrota'}
        </div>
      </div>

      <div className="w-[100px] text-center font-mono flex-shrink-0">
        <div className="text-sm font-bold">
          <span className="text-win">{p.kills}</span>
          <span className="text-warm-5">/</span>
          <span className="text-loss">{p.deaths}</span>
          <span className="text-warm-5">/</span>
          <span className="text-cream">{p.assists}</span>
        </div>
        <div className="text-[10px] text-warm-4 mt-0.5">KDA {p.kda}</div>
      </div>

      <div className="w-16 text-center font-mono flex-shrink-0 hidden sm:block">
        <div className="text-sm font-bold text-cream">{p.cs}</div>
        <div className="text-[10px] text-warm-4 mt-0.5">{p.cspm}/min</div>
      </div>

      <div className="w-16 text-center font-mono flex-shrink-0 hidden md:block">
        <div className="text-sm font-bold" style={{ color: diffColor(p.gd15) }}>
          {fmtDiff(p.gd15)}
        </div>
        <div className="text-[10px] text-warm-4 mt-0.5">GD@15</div>
      </div>
    </div>
  )
}
