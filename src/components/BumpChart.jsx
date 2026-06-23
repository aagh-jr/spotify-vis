import { useEffect, useRef, useCallback } from 'react'
import * as d3 from 'd3'
import { ENTITY_COLORS } from '../utils/colors.js'
import { formatPeriod } from '../utils/chartData.js'
import './BumpChart.css'

/**
 * Bump chart — shows ranking lines for the top N entities over time.
 *
 * Props:
 *   periods      string[]   — x-axis labels (years or "YYYY-MM")
 *   series       object[]   — [{ name, plays, ranks[] }]
 *   periodType   string     — 'allTime' | 'year'
 *   hoveredName  string|null
 *   setHoveredName fn
 */
export function BumpChart({ periods, series, periodType, hoveredName, setHoveredName }) {
  const svgRef       = useRef(null)
  const containerRef = useRef(null)

  // ── Draw function ───────────────────────────────────────────────────────
  const draw = useCallback(() => {
    if (!periods.length || !series.length) return

    const container = containerRef.current
    if (!container) return

    const W = container.clientWidth
    const H = container.clientHeight
    if (W === 0 || H === 0) return

    const margin = { top: 50, right: 180, bottom: 50, left: 55 }
    const iW = W - margin.left - margin.right
    const iH = H - margin.top  - margin.bottom

    // Highest rank value we need to display (1 is always min)
    const maxRank = series.length

    // ── Scales ───────────────────────────────────────────────────────────
    const xScale = d3.scalePoint()
      .domain(periods)
      .range([0, iW])
      .padding(0.4)

    // Rank 1 at top → lower y value
    const yScale = d3.scaleLinear()
      .domain([0.5, maxRank + 0.5])
      .range([0, iH])

    const xBand = xScale.step() // pixels between each period

    // ── SVG setup ─────────────────────────────────────────────────────────
    const svg = d3.select(svgRef.current)
    svg.selectAll('*').remove()
    svg.attr('width', W).attr('height', H)

    const g = svg.append('g')
      .attr('transform', `translate(${margin.left},${margin.top})`)

    // ── Background grid ───────────────────────────────────────────────────
    // Horizontal rank lines
    for (let rank = 1; rank <= maxRank; rank++) {
      g.append('line')
        .attr('class', 'grid-line')
        .attr('x1', 0).attr('x2', iW)
        .attr('y1', yScale(rank)).attr('y2', yScale(rank))
    }

    // Vertical period lines
    periods.forEach((p) => {
      g.append('line')
        .attr('class', 'grid-line-v')
        .attr('x1', xScale(p)).attr('x2', xScale(p))
        .attr('y1', 0).attr('y2', iH)
    })

    // ── X-axis labels ─────────────────────────────────────────────────────
    periods.forEach((p) => {
      g.append('text')
        .attr('class', 'axis-label')
        .attr('x', xScale(p))
        .attr('y', -20)
        .attr('text-anchor', 'middle')
        .text(formatPeriod(p, periodType))
    })

    // x-axis baseline
    g.append('text')
      .attr('class', 'axis-title')
      .attr('x', iW / 2)
      .attr('y', iH + 40)
      .attr('text-anchor', 'middle')
      .text(periodType === 'allTime' ? 'Year' : 'Month')

    // ── Y-axis rank labels ─────────────────────────────────────────────────
    for (let rank = 1; rank <= maxRank; rank++) {
      g.append('text')
        .attr('class', 'rank-label')
        .attr('x', -12)
        .attr('y', yScale(rank))
        .attr('text-anchor', 'middle')
        .attr('dominant-baseline', 'middle')
        .text(`#${rank}`)
    }

    // y-axis title
    g.append('text')
      .attr('class', 'axis-title')
      .attr('transform', `rotate(-90)`)
      .attr('x', -iH / 2)
      .attr('y', -45)
      .attr('text-anchor', 'middle')
      .text('Ranking')

    // ── Draw series ────────────────────────────────────────────────────────
    series.forEach((s, i) => {
      const color     = ENTITY_COLORS[i % ENTITY_COLORS.length]
      const isHovered = hoveredName === s.name
      const isDimmed  = hoveredName !== null && !isHovered
      const opacity   = isDimmed ? 0.12 : isHovered ? 1 : 0.8
      const strokeW   = isHovered ? 3 : 1.8

      // Build connected segments (skip nulls by breaking line)
      // d3 line with .defined() handles this natively
      const lineGen = d3.line()
        .x((d, j) => xScale(periods[j]))
        .y((d) => yScale(d))
        .curve(d3.curveMonotoneX)
        .defined((d) => d !== null)

      // Line path
      const path = g.append('path')
        .datum(s.ranks)
        .attr('class', 'bump-line')
        .attr('fill', 'none')
        .attr('stroke', color)
        .attr('stroke-width', strokeW)
        .attr('opacity', opacity)
        .attr('d', lineGen)
        // Animate line drawing on mount
        .attr('stroke-dasharray', function() {
          return this.getTotalLength()
        })
        .attr('stroke-dashoffset', function() {
          return this.getTotalLength()
        })

      // Trigger draw animation (staggered per series)
      path.transition()
        .delay(i * 80)
        .duration(600)
        .ease(d3.easeCubicOut)
        .attr('stroke-dashoffset', 0)

      // Dots at each valid rank point
      s.ranks.forEach((rank, j) => {
        if (rank === null) return

        g.append('circle')
          .attr('class', 'bump-dot')
          .attr('cx', xScale(periods[j]))
          .attr('cy', yScale(rank))
          .attr('r', isHovered ? 6 : 4)
          .attr('fill', color)
          .attr('opacity', opacity)
          .attr('stroke', 'var(--bg)')
          .attr('stroke-width', 1.5)
          // Hover interaction on dots
          .on('mouseenter', () => setHoveredName(s.name))
          .on('mouseleave', () => setHoveredName(null))
      })

      // ── End labels ────────────────────────────────────────────────────
      // Find first & last valid rank index for labels
      const firstIdx = s.ranks.findIndex((r) => r !== null)
      const lastIdx  = s.ranks.length - 1 - [...s.ranks].reverse().findIndex((r) => r !== null)

      const shortName = (str, len = 14) =>
        str.length > len ? str.slice(0, len - 1) + '…' : str

      // Left label (only if first point is the leftmost period)
      if (firstIdx === 0) {
        g.append('text')
          .attr('class', 'bump-label')
          .attr('x', xScale(periods[0]) - 8)
          .attr('y', yScale(s.ranks[0]))
          .attr('text-anchor', 'end')
          .attr('dominant-baseline', 'middle')
          .attr('fill', color)
          .attr('opacity', isDimmed ? 0.15 : 1)
          .attr('font-weight', isHovered ? 700 : 400)
          .text(shortName(s.name))
      }

      // Right label
      if (lastIdx >= 0 && s.ranks[lastIdx] !== null) {
        g.append('text')
          .attr('class', 'bump-label')
          .attr('x', xScale(periods[lastIdx]) + 8)
          .attr('y', yScale(s.ranks[lastIdx]))
          .attr('text-anchor', 'start')
          .attr('dominant-baseline', 'middle')
          .attr('fill', color)
          .attr('opacity', isDimmed ? 0.15 : 1)
          .attr('font-weight', isHovered ? 700 : 400)
          .text(shortName(s.name))
      }

      // ── Invisible wider hit area for hover ────────────────────────────
      g.append('path')
        .datum(s.ranks)
        .attr('fill', 'none')
        .attr('stroke', 'transparent')
        .attr('stroke-width', 20)
        .attr('d', lineGen)
        .style('cursor', 'pointer')
        .on('mouseenter', () => setHoveredName(s.name))
        .on('mouseleave', () => setHoveredName(null))
    })

    // ── Tooltip area (period column hover) ────────────────────────────────
    // Shows a vertical highlight band on hover
    const tooltip = g.append('line')
      .attr('class', 'hover-line')
      .attr('y1', 0).attr('y2', iH)
      .attr('opacity', 0)

    // Transparent column hit areas
    periods.forEach((p) => {
      g.append('rect')
        .attr('x', xScale(p) - xBand / 2)
        .attr('y', 0)
        .attr('width', xBand)
        .attr('height', iH)
        .attr('fill', 'transparent')
        .on('mouseenter', () => {
          tooltip
            .attr('x1', xScale(p)).attr('x2', xScale(p))
            .attr('opacity', 1)
        })
        .on('mouseleave', () => {
          tooltip.attr('opacity', 0)
        })
    })

  }, [periods, series, periodType, hoveredName, setHoveredName])

  // ── Redraw on data/hover change ────────────────────────────────────────
  useEffect(() => {
    draw()
  }, [draw])

  // ── Resize observer ────────────────────────────────────────────────────
  useEffect(() => {
    const container = containerRef.current
    if (!container) return
    const ro = new ResizeObserver(() => draw())
    ro.observe(container)
    return () => ro.disconnect()
  }, [draw])

  if (!periods.length) {
    return (
      <div ref={containerRef} className="bump-container bump-empty">
        <span>No data for selected period</span>
      </div>
    )
  }

  return (
    <div ref={containerRef} className="bump-container">
      <svg ref={svgRef} />
    </div>
  )
}
