import { TIER_HEX, TIER_EMOJI, tierBg } from '../lib/brand'

export default function TierPill({ tier, rank, size = 'sm' }) {
  const color = TIER_HEX[tier] || '#64748b'
  const px = size === 'lg' ? 'px-3 py-1.5 text-sm' : 'px-2.5 py-1 text-xs'

  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full font-display border-2 whitespace-nowrap ${px}`}
      style={{
        color,
        borderColor: color,
        background: tierBg(tier),
        letterSpacing: '0.5px',
      }}
    >
      {TIER_EMOJI[tier]} {tier === 'UNRANKED' ? 'UNRANKED' : `${tier} ${rank}`}
    </span>
  )
}
