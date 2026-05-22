/**
 * Eyebrow section header with banana decoration + accented word.
 * Usage: <SectionHeader title="Ranking" accent="do squad" sub="..." />
 */
export default function SectionHeader({ title, accent, sub }) {
  return (
    <div className="flex items-center gap-3.5 mt-9 mb-4">
      <img src="/banana.svg" alt="" className="w-9 h-[18px] -rotate-[20deg] flex-shrink-0"/>
      <h2 className="gz-heading font-display text-[28px] text-cream m-0 -tracking-[0.5px]">
        {title} <em>{accent}</em>
      </h2>
      {sub && (
        <span className="ml-auto text-xs text-warm-4 font-bold">{sub}</span>
      )}
    </div>
  )
}
