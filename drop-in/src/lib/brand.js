// Brand constants + helpers — Direção D / Resenha aesthetic.

export const TIER_HEX = {
  IRON:        '#94a3b8',
  BRONZE:      '#b45309',
  SILVER:      '#cbd5e1',
  GOLD:        '#fbbf24',
  PLATINUM:    '#2dd4bf',
  EMERALD:     '#34d399',
  DIAMOND:     '#60a5fa',
  MASTER:      '#c084fc',
  GRANDMASTER: '#ef4444',
  CHALLENGER:  '#fde047',
  UNRANKED:    '#64748b',
}

export const TIER_EMOJI = {
  IRON:        '⚙️',
  BRONZE:      '🥉',
  SILVER:      '🥈',
  GOLD:        '🏆',
  PLATINUM:    '🌊',
  EMERALD:     '🌿',
  DIAMOND:     '💎',
  MASTER:      '🌟',
  GRANDMASTER: '👑',
  CHALLENGER:  '🔱',
  UNRANKED:    '❓',
}

export const TIER_ORDER = {
  UNRANKED: -1,
  IRON: 0, BRONZE: 1, SILVER: 2, GOLD: 3, PLATINUM: 4,
  EMERALD: 5, DIAMOND: 6, MASTER: 7, GRANDMASTER: 8, CHALLENGER: 9,
}

export const RANK_ORDER = { IV: 0, III: 1, II: 2, I: 3, '': 0 }

export const ROTA_LABEL = {
  TOP: 'Top', JUNGLE: 'JG', MIDDLE: 'Mid', BOTTOM: 'Bot', UTILITY: 'Sup',
}

// Per-player consistent line color (used in Evolução).
export const SQUAD_COLORS = ['#60a5fa', '#c084fc', '#2dd4bf', '#34d399', '#fbbf24', '#ec4899', '#f97316']

export function tierBg(tier) {
  const h = TIER_HEX[tier] || '#64748b'
  const r = parseInt(h.slice(1, 3), 16)
  const g = parseInt(h.slice(3, 5), 16)
  const b = parseInt(h.slice(5, 7), 16)
  return `rgba(${r},${g},${b},0.10)`
}

export function corJogador(jogadores, puuid) {
  const idx = jogadores.findIndex(j => j.puuid === puuid)
  return SQUAD_COLORS[idx % SQUAD_COLORS.length]
}

export function fmtDiff(val, decimals = 0) {
  if (val == null) return '—'
  const n = decimals > 0 ? val.toFixed(decimals) : Math.round(val)
  return val >= 0 ? `+${n}` : `${n}`
}

export function diffColor(val) {
  if (val == null) return '#a07956'      // warm-4
  if (val >= 300)  return '#84cc16'      // win
  if (val >= 0)    return '#fef3c7'      // cream
  if (val >= -300) return '#f97316'      // clay / warn
  return '#ef4444'                       // loss
}

export function fmtDate(iso) {
  if (!iso) return ''
  const d = new Date(iso)
  return d.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })
}

export function fmtDateFull(iso) {
  if (!iso) return ''
  const d = new Date(iso)
  return d.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: '2-digit' })
}

export function eloScore(j) {
  return (TIER_ORDER[j.tier] ?? -1) * 10000 + (RANK_ORDER[j.rank] ?? 0) * 100 + (j.lp ?? 0)
}
