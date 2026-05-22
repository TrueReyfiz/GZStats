/**
 * Tilt / hot streak banner. Reads { tipo, mensagem } from getAlertas().
 */
export default function AlertBanner({ tipo, mensagem }) {
  const cfg = tipo === 'tilt'
    ? { bg: 'bg-loss/10', fg: 'text-red-300', bd: 'border-loss/30', icon: '⚠️' }
    : { bg: 'bg-clay/10', fg: 'text-orange-300', bd: 'border-clay/30', icon: '🔥' }
  return (
    <div className={`flex items-center gap-2.5 px-4 py-3 rounded-md border-2 text-sm font-bold ${cfg.bg} ${cfg.fg} ${cfg.bd}`}>
      <span>{cfg.icon}</span>
      <span>{mensagem}</span>
    </div>
  )
}
