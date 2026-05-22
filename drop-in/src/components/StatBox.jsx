/**
 * Stat tile — eyebrow label + big mono value + optional sub.
 * Used in Perfil page stat grids.
 */
export default function StatBox({ label, value, color = '#fef3c7', sub }) {
  return (
    <div className="bg-bg-1 rounded-md p-[18px] border-2 border-bg-2 hover:border-warm-5 transition-colors">
      <div className="text-[11px] text-warm-4 font-extrabold uppercase tracking-[0.8px]">
        {label}
      </div>
      <div
        className="font-mono text-[28px] font-bold mt-1.5 -tracking-[0.5px] leading-none"
        style={{ color }}
      >
        {value ?? '—'}
      </div>
      {sub && <div className="text-[11px] text-warm-5 mt-1 font-bold">{sub}</div>}
    </div>
  )
}
