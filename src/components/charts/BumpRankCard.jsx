'use client'

import { useRef, useEffect, useState } from 'react'
import * as d3 from 'd3'
import { ENTITY_COLORS } from '../../utils/colors.js'
import { formatPeriod } from '../../utils/chartData.js'

const SIDEBAR_W = 170
const LABELS_H = 40
const MARGIN = { top: 24, right: 16, bottom: 20, left: 46 }

/**
 * Combined rank "bump" chart card. The SVG is masked so lines fade toward the
 * pinned artist-icon sidebar (right) and the year-label strip (bottom). The
 * sidebar icons are absolutely positioned to line up with each line's most
 * recent dot. Ported from the `draw()` routine in the Spotify Visualizer design.
 *
 * Props: periods, series, periodType, topN, hoveredName, setHoveredName, onSelect
 */
export function BumpRankCard({ periods, series, periodType, topN, hoveredName, setHoveredName, onSelect }) {
  const containerRef = useRef(null)
  const svgRef = useRef(null)
  const [dotY, setDotY] = useState({})
  const [periodPos, setPeriodPos] = useState([])

  useEffect(() => {
    const container = containerRef.current
    const svgEl = svgRef.current
    if (!container || !svgEl || !periods.length || !series.length) return

    function draw() {
      const W = container.clientWidth
      const H = container.clientHeight
      if (!W || !H) return

      const iW = W - MARGIN.left - MARGIN.right
      const iH = H - MARGIN.top - MARGIN.bottom
      const maxRank = series.length

      const xScale = d3.scalePoint().domain(periods).range([0, iW]).padding(0.4)
      const yScale = d3.scaleLinear().domain([0.5, maxRank + 0.5]).range([0, iH])

      const svg = d3.select(svgEl)
      svg.selectAll('*').remove()
      svg.attr('width', W).attr('height', H)
      const g = svg.append('g').attr('transform', `translate(${MARGIN.left},${MARGIN.top})`)

      // Grid
      for (let rank = 1; rank <= maxRank; rank++) {
        g.append('line').attr('x1', 0).attr('x2', iW).attr('y1', yScale(rank)).attr('y2', yScale(rank))
          .attr('stroke', '#1e1e1e').attr('stroke-width', 1)
      }
      periods.forEach((p) => {
        g.append('line').attr('x1', xScale(p)).attr('x2', xScale(p)).attr('y1', 0).attr('y2', iH)
          .attr('stroke', '#181818').attr('stroke-width', 1)
      })

      // Period x-positions for the HTML year labels (outside the mask)
      const newPeriodPos = periods.map((p) => ({
        label: formatPeriod(p, periodType),
        x: xScale(p) + MARGIN.left,
      }))

      // Last-dot y-positions for sidebar icon alignment
      const newDotY = {}
      series.forEach((s) => {
        const lastRank = [...s.ranks].reverse().find((r) => r !== null)
        if (lastRank != null) newDotY[s.name] = yScale(lastRank) + MARGIN.top
      })

      // Rank labels (#1, #2…)
      for (let rank = 1; rank <= maxRank; rank++) {
        g.append('text').attr('x', -12).attr('y', yScale(rank))
          .attr('text-anchor', 'middle').attr('dominant-baseline', 'middle')
          .attr('fill', '#555').attr('font-size', '11px')
          .attr('font-family', "'Inter',system-ui,sans-serif").text(`#${rank}`)
      }

      // Series lines + dots
      series.forEach((s, i) => {
        const color = ENTITY_COLORS[i % ENTITY_COLORS.length]
        const isHovered = hoveredName === s.name
        const isDimmed = hoveredName !== null && !isHovered
        const opacity = isDimmed ? 0.1 : isHovered ? 1 : 0.85
        const strokeW = isHovered ? 12 : 8

        const lineGen = d3.line()
          .x((d, j) => xScale(periods[j]))
          .y((d) => yScale(d))
          .curve(d3.curveBumpX)
          .defined((d) => d !== null)

        const path = g.append('path').datum(s.ranks)
          .attr('fill', 'none').attr('stroke', color).attr('stroke-width', strokeW)
          .attr('stroke-linecap', 'round').attr('stroke-linejoin', 'round')
          .attr('opacity', opacity).attr('d', lineGen)
          .attr('stroke-dasharray', function () { return this.getTotalLength() })
          .attr('stroke-dashoffset', function () { return this.getTotalLength() })
        path.transition().delay(i * 80).duration(700).ease(d3.easeCubicOut).attr('stroke-dashoffset', 0)

        s.ranks.forEach((rank, j) => {
          if (rank === null) return
          g.append('circle').attr('cx', xScale(periods[j])).attr('cy', yScale(rank))
            .attr('r', isHovered ? 7 : 5).attr('fill', color).attr('opacity', opacity)
            .attr('stroke', 'rgba(8,8,16,0.8)').attr('stroke-width', 2)
            .style('cursor', 'pointer')
            .on('mouseenter', () => setHoveredName(s.name))
            .on('mouseleave', () => setHoveredName(null))
            .on('click', () => onSelect(s))
        })

        // Wider transparent hit area
        g.append('path').datum(s.ranks).attr('fill', 'none').attr('stroke', 'transparent')
          .attr('stroke-width', 20).attr('d', lineGen).style('cursor', 'pointer')
          .on('mouseenter', () => setHoveredName(s.name))
          .on('mouseleave', () => setHoveredName(null))
          .on('click', () => onSelect(s))
      })

      // Vertical hover guide
      const hoverLine = g.append('line').attr('y1', 0).attr('y2', iH)
        .attr('stroke', 'rgba(255,255,255,0.08)').attr('stroke-width', 1)
        .attr('pointer-events', 'none').attr('opacity', 0)
      const xBand = xScale.step()
      periods.forEach((p) => {
        g.append('rect').attr('x', xScale(p) - xBand / 2).attr('y', 0)
          .attr('width', xBand).attr('height', iH).attr('fill', 'transparent')
          .on('mouseenter', () => hoverLine.attr('x1', xScale(p)).attr('x2', xScale(p)).attr('opacity', 1))
          .on('mouseleave', () => hoverLine.attr('opacity', 0))
      })

      // Publish positions for the React-rendered overlays (guard against loops)
      setDotY((prev) => (JSON.stringify(prev) === JSON.stringify(newDotY) ? prev : newDotY))
      setPeriodPos((prev) => (JSON.stringify(prev) === JSON.stringify(newPeriodPos) ? prev : newPeriodPos))
    }

    draw()
    const ro = new ResizeObserver(() => draw())
    ro.observe(container)
    return () => ro.disconnect()
  }, [periods, series, periodType, hoveredName, setHoveredName, onSelect])

  // ── Sidebar items, sorted to align with line endpoints ───────────────────
  const isTop5 = topN === 5
  const sorted = [...series].sort((a, b) => {
    const aLast = [...a.ranks].reverse().find((r) => r !== null) ?? 999
    const bLast = [...b.ranks].reverse().find((r) => r !== null) ?? 999
    return aLast - bLast
  })

  return (
    <div className="rk-bump-card">
      {/* Masked chart area */}
      <div ref={containerRef} className="rk-bump-mask">
        <svg ref={svgRef} style={{ position: 'absolute', inset: 0 }} />
      </div>

      {/* Artist icons pinned right */}
      <div className="rk-bump-sidebar">
        {sorted.map((item, i) => {
          const origIdx = series.findIndex((s) => s.name === item.name)
          const color = ENTITY_COLORS[origIdx % ENTITY_COLORS.length]
          const isHov = hoveredName === item.name
          const isDim = hoveredName !== null && !isHov
          const maxLen = isTop5 ? 13 : 17
          const displayName = item.name.length > maxLen ? item.name.slice(0, maxLen - 1) + '…' : item.name
          const y = dotY[item.name]
          const topPx = y != null ? y - 18 : i * 80 + 20
          return (
            <div
              key={item.name}
              className="sidebar-item rk-side-item"
              style={{ top: `${topPx}px`, opacity: isDim ? 0.15 : 1 }}
              onMouseEnter={() => setHoveredName(item.name)}
              onMouseLeave={() => setHoveredName(null)}
              onClick={() => onSelect(item)}
            >
              <div
                className="rk-side-icon"
                style={{ border: `2px solid ${isHov ? color : color + '44'}`, background: color + '18', color }}
              >
                {item.name.charAt(0).toUpperCase()}
              </div>
              <div className="rk-side-info">
                <span className="rk-side-name" style={{ color: isHov ? color : '#d8d8d8' }}>{displayName}</span>
                <span className="rk-side-plays">{item.plays.toLocaleString()} plays</span>
              </div>
            </div>
          )
        })}
      </div>

      {/* Year labels (outside mask) */}
      <div className="rk-bump-labels">
        {periodPos.map((p, i) => (
          <span key={i} className="rk-period-label" style={{ left: `${p.x}px` }}>{p.label}</span>
        ))}
      </div>
    </div>
  )
}
