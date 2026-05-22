/**
 * Round avatar with initial — colored border per player.
 * Used in player cards, profile hero, etc.
 */
export default function Avatar({ name = '?', color = '#fbbf24', size = 52, badge = null }) {
  return (
    <div className="relative flex-shrink-0">
      <div
        className="rounded-full bg-bg-2 flex items-center justify-center font-display text-cream border-[3px]"
        style={{
          width: size,
          height: size,
          fontSize: size * 0.42,
          color,
          borderColor: color,
        }}
      >
        {name[0]}
      </div>
      {badge && (
        <span
          className="absolute -top-2 left-1/2 -translate-x-1/2 text-2xl"
          title={badge.title}
        >
          {badge.emoji}
        </span>
      )}
    </div>
  )
}
