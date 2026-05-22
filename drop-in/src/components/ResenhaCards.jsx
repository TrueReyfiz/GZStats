/**
 * MVP da rodada + Troll do dia — twin sticker-style cards.
 * Pass the chosen players + (optional) quotes. Falls back to defaults.
 */
export default function ResenhaCards({ mvp, troll, mvpQuote, trollQuote }) {
  if (!mvp && !troll) return null

  return (
    <section className="grid grid-cols-1 lg:grid-cols-2 gap-5 mb-8">
      {mvp && (
        <article className="relative rounded-lg shadow-sticker overflow-hidden p-6 pl-[140px] min-h-[160px] gz-card-mvp">
          <div className="gz-tape"/>
          <img
            src="/mascot-mvp.svg"
            alt="MVP gorilla"
            className="absolute left-3 -bottom-1 w-[130px] h-[130px] -rotate-[8deg]"
          />
          <div className="font-display text-[13px] tracking-[1.5px] uppercase opacity-85 mb-2">
            ⭐ MVP da rodada
          </div>
          <div className="font-display text-[36px] leading-none -tracking-[0.5px] mb-3">
            {mvp.riot_id}
          </div>
          <p className="text-[13px] leading-snug font-bold opacity-90 m-0">
            {mvpQuote || `${mvp.kda_medio} de KDA e WR de ${mvp.winrate}% — tá voando. Hoje pode pedir o lanche.`}
          </p>
          <div className="flex flex-wrap gap-3 mt-2.5">
            <Chip kind="mvp">KDA {mvp.kda_medio}</Chip>
            {mvp.gd15_medio != null && (
              <Chip kind="mvp">{mvp.gd15_medio >= 0 ? '+' : ''}{Math.round(mvp.gd15_medio)} GD@15</Chip>
            )}
            {mvp.hot_streak && <Chip kind="mvp">🔥 Em sequência</Chip>}
          </div>
        </article>
      )}

      {troll && (
        <article className="relative rounded-lg shadow-sticker overflow-hidden p-6 pl-[140px] min-h-[160px] gz-card-troll border-2 border-bg-2">
          <div className="gz-tape"/>
          <img
            src="/mascot-troll.svg"
            alt="Troll gorilla"
            className="absolute left-3 -bottom-1 w-[130px] h-[130px] -rotate-[6deg]"
          />
          <div className="font-display text-[13px] tracking-[1.5px] uppercase text-clay mb-2">
            🤡 Troll do dia
          </div>
          <div className="font-display text-[36px] leading-none -tracking-[0.5px] text-cream mb-3">
            {troll.riot_id}
          </div>
          <p className="text-[13px] leading-snug font-bold text-warm-3 m-0">
            {trollQuote || `${troll.kda_medio} de KDA e WR de ${troll.winrate}%. Bora pausar antes que o tilt vire dorame, fera.`}
          </p>
          <div className="flex flex-wrap gap-3 mt-2.5">
            <Chip kind="troll">KDA {troll.kda_medio}</Chip>
            {troll.gd15_medio != null && (
              <Chip kind="troll">{troll.gd15_medio >= 0 ? '+' : ''}{Math.round(troll.gd15_medio)} GD@15</Chip>
            )}
            <Chip kind="troll">💀 {troll.losses} derrotas</Chip>
          </div>
        </article>
      )}
    </section>
  )
}

function Chip({ children, kind }) {
  const cls = kind === 'mvp'
    ? 'bg-bg-0/20 text-bg-0'
    : 'bg-loss/15 text-red-300'
  return (
    <span className={`px-2.5 py-1 rounded-full font-mono text-[11px] font-bold whitespace-nowrap ${cls}`}>
      {children}
    </span>
  )
}
