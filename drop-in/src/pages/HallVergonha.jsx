import { useEffect, useState, useMemo } from 'react'
import { getJogadores } from '../services/api'
import { ROTA_LABEL, SQUAD_COLORS } from '../lib/brand'
import SectionHeader from '../components/SectionHeader'
import Avatar from '../components/Avatar'

/**
 * "Shame score" — lower = worse. Combina KDA, GD@15 e WR.
 * Pode ajustar livremente; nada disso é exato.
 */
function shameScore(j) {
  return Math.round((j.kda_medio ?? 0) * 10 + (j.gd15_medio ?? 0) / 20 + (j.winrate ?? 0))
}

export default function HallVergonha() {
  const [jogadores, setJogadores] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    getJogadores()
      .then(r => setJogadores(r.data || []))
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [])

  const ranked = useMemo(() =>
    [...jogadores].sort((a, b) => shameScore(a) - shameScore(b)),
    [jogadores]
  )
  const pior = ranked[0]

  if (loading) return <div className="py-20 text-center text-warm-4 font-bold">Carregando vergonha…</div>
  if (!pior)   return <div className="py-20 text-center text-warm-4 font-bold">Sem dados ainda.</div>

  return (
    <div className="py-8">
      <SectionHeader title="Hall" accent="da vergonha" sub="atualizado em tempo real · 0% acolhedor"/>

      {/* Headline troll card */}
      <article className="relative rounded-lg shadow-sticker overflow-hidden p-6 pl-[140px] min-h-[160px] gz-card-troll border-2 border-bg-2 mb-6">
        <div className="gz-tape"/>
        <img src="/mascot-troll.svg" alt="Troll gorilla" className="absolute left-3 -bottom-1 w-[130px] h-[130px] -rotate-[6deg]"/>
        <div className="font-display text-[13px] tracking-[1.5px] uppercase text-clay mb-2">💀 Pior performance da semana</div>
        <div className="font-display text-[36px] leading-none -tracking-[0.5px] text-cream mb-3">{pior.riot_id}</div>
        <p className="text-[13px] leading-snug font-bold text-warm-3 m-0">
          "{pior.tier} {pior.rank} · KDA médio {pior.kda_medio} · GD@15 {(pior.gd15_medio ?? 0) >= 0 ? '+' : ''}{Math.round(pior.gd15_medio ?? 0)} · {pior.winrate}% WR."
        </p>
        <div className="flex flex-wrap gap-3 mt-2.5">
          <span className="px-2.5 py-1 rounded-full font-mono text-[11px] font-bold bg-loss/15 text-red-300">
            Score de vergonha: {shameScore(pior)}
          </span>
          <span className="px-2.5 py-1 rounded-full font-mono text-[11px] font-bold bg-loss/15 text-red-300">
            {pior.losses} derrotas
          </span>
        </div>
      </article>

      {/* Ranked list */}
      <div className="flex flex-col gap-2.5">
        {ranked.map((j, i) => (
          <div
            key={j.puuid}
            className="bg-bg-1 border-2 border-bg-2 rounded-md px-[18px] py-3.5 grid grid-cols-[40px_1fr_auto_auto] gap-4 items-center"
          >
            <div className={`font-display text-2xl text-center ${i === 0 ? 'text-loss' : i === 1 ? 'text-clay' : 'text-warm-3'}`}>
              #{i + 1}
            </div>
            <div className="flex items-center gap-3">
              <Avatar name={j.riot_id} color={SQUAD_COLORS[i % SQUAD_COLORS.length]} size={40}/>
              <div>
                <div className="font-display text-base text-cream">{j.riot_id}</div>
                <div className="text-[11px] text-warm-4 font-mono mt-0.5">
                  {j.tier} {j.rank}
                  {j.rota_principal ? ` · ${ROTA_LABEL[j.rota_principal] || j.rota_principal}` : ''}
                </div>
              </div>
            </div>
            <div className="hidden sm:flex gap-2.5 font-mono text-[13px] font-bold">
              <span className={(j.kda_medio ?? 0) < 2 ? 'text-loss' : 'text-cream'}>KDA {j.kda_medio}</span>
              <span className="text-warm-5">·</span>
              <span className={(j.gd15_medio ?? 0) < 0 ? 'text-loss' : 'text-cream'}>
                {(j.gd15_medio ?? 0) >= 0 ? '+' : ''}{Math.round(j.gd15_medio ?? 0)} GD@15
              </span>
              <span className="text-warm-5">·</span>
              <span className={j.winrate < 50 ? 'text-loss' : 'text-cream'}>{j.winrate}% WR</span>
            </div>
            <div className="font-display text-lg text-banana min-w-[60px] text-right">
              {shameScore(j)}
            </div>
          </div>
        ))}
      </div>

      <div className="mt-7 p-[18px] bg-bg-1 border-2 border-dashed border-warm-5 rounded-md text-warm-3 text-xs font-bold leading-relaxed">
        ℹ️ <strong className="text-cream">Score de vergonha:</strong> ranking interno do squad.
        Calculado como <code className="font-mono text-banana">KDA·10 + GD@15/20 + WR</code> —
        quanto menor, mais resenha você vai ouvir. Não leva pra casa.
      </div>
    </div>
  )
}
