import { ENTITY_COLORS } from '../utils/colors.js'
import './Sidebar.css'

/**
 * Left panel — shows top N entities as a stacked bubble card.
 * Clicking or hovering an item highlights the corresponding chart line.
 */
export function Sidebar({ series, category, hoveredName, setHoveredName }) {
  if (!series.length) {
    return (
      <aside className="sidebar">
        <div className="sidebar-label">Loading…</div>
      </aside>
    )
  }

  // Display label above the card
  const catLabel = category.charAt(0).toUpperCase() + category.slice(1)

  return (
    <aside className="sidebar">
      <div className="sidebar-label">Top {series.length}</div>
      <div className="sidebar-label sidebar-category">{catLabel}</div>

      {/* The tall "bubble" card */}
      <div className="bubble-card">
        {series.map((item, i) => {
          const color     = ENTITY_COLORS[i % ENTITY_COLORS.length]
          const isHovered = hoveredName === item.name
          const isDimmed  = hoveredName && !isHovered

          // Abbreviate long names for display
          const displayName = item.name.length > 18
            ? item.name.slice(0, 17) + '…'
            : item.name

          const subLabel = item.artist
            ? (item.artist.length > 16 ? item.artist.slice(0, 15) + '…' : item.artist)
            : null

          return (
            <div
              key={item.name}
              className={`bubble-item ${isHovered ? 'hovered' : ''} ${isDimmed ? 'dimmed' : ''}`}
              onMouseEnter={() => setHoveredName(item.name)}
              onMouseLeave={() => setHoveredName(null)}
            >
              {/* Rank badge */}
              <div className="rank-badge" style={{ color }}>
                #{i + 1}
              </div>

              {/* Circle icon */}
              <div
                className="icon-circle"
                style={{
                  background: `${color}22`,
                  borderColor: isHovered ? color : `${color}55`,
                  color,
                }}
              >
                {item.name.charAt(0).toUpperCase()}
              </div>

              {/* Name + subtitle */}
              <div className="item-info">
                <span className="item-name" style={{ color: isHovered ? color : undefined }}>
                  {displayName}
                </span>
                {subLabel && (
                  <span className="item-sub">{subLabel}</span>
                )}
                <span className="item-plays">
                  {item.plays.toLocaleString()} plays
                </span>
              </div>
            </div>
          )
        })}
      </div>
    </aside>
  )
}
