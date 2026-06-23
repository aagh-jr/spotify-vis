'use client'

import { useRef, useEffect } from 'react'
import * as d3 from 'd3'

/**
 * "Top Artists This Week" bar chart. Ported from the Claude Design
 * Home.dc.html `drawBar` routine. Renders an animated, responsive D3 bar
 * chart of weekly artist stream counts.
 *
 * @param {Array<{name:string, streams:number, color:string}>} artists
 */
export function WeeklyBarChart({ artists }) {
  const svgRef = useRef(null)

  useEffect(() => {
    const svg = svgRef.current
    const container = svg && svg.parentElement
    if (!svg || !container) return

    function draw() {
      const W = container.clientWidth
      const H = container.clientHeight
      if (W === 0 || H === 0) return

      const margin = { top: 16, right: 20, bottom: 40, left: 48 }
      const iW = W - margin.left - margin.right
      const iH = H - margin.top - margin.bottom

      const sel = d3.select(svg)
      sel.selectAll('*').remove()
      sel.attr('width', W).attr('height', H)

      const g = sel.append('g').attr('transform', `translate(${margin.left},${margin.top})`)

      const xScale = d3.scaleBand().domain(artists.map((a) => a.name)).range([0, iW]).padding(0.28)
      const yScale = d3
        .scaleLinear()
        .domain([0, d3.max(artists, (a) => a.streams) * 1.15])
        .range([iH, 0])

      // Subtle grid
      const ticks = yScale.ticks(4)
      ticks.forEach((t) => {
        g.append('line')
          .attr('x1', 0)
          .attr('x2', iW)
          .attr('y1', yScale(t))
          .attr('y2', yScale(t))
          .attr('stroke', 'rgba(255,255,255,0.05)')
          .attr('stroke-width', 1)
        g.append('text')
          .attr('x', -10)
          .attr('y', yScale(t))
          .attr('text-anchor', 'end')
          .attr('dominant-baseline', 'middle')
          .attr('fill', '#555')
          .attr('font-size', '11px')
          .attr('font-family', "'Inter',system-ui,sans-serif")
          .text(t)
      })

      // Bars
      artists.forEach((a, i) => {
        const x = xScale(a.name)
        const bw = xScale.bandwidth()
        const barH = iH - yScale(a.streams)

        // Bar bg (subtle track)
        g.append('rect')
          .attr('x', x)
          .attr('y', 0)
          .attr('width', bw)
          .attr('height', iH)
          .attr('rx', 8)
          .attr('fill', 'rgba(255,255,255,0.03)')

        // Bar fill
        const bar = g
          .append('rect')
          .attr('x', x)
          .attr('width', bw)
          .attr('rx', 8)
          .attr('fill', a.color)
          .attr('opacity', 0.85)
          .attr('y', iH)
          .attr('height', 0)

        bar
          .transition()
          .delay(i * 80)
          .duration(600)
          .ease(d3.easeCubicOut)
          .attr('y', yScale(a.streams))
          .attr('height', barH)

        // Value label above bar
        const label = g
          .append('text')
          .attr('x', x + bw / 2)
          .attr('y', yScale(a.streams) - 8)
          .attr('text-anchor', 'middle')
          .attr('fill', a.color)
          .attr('font-size', '12px')
          .attr('font-weight', '600')
          .attr('font-family', "'Inter',system-ui,sans-serif")
          .attr('opacity', 0)

        label
          .text(a.streams)
          .transition()
          .delay(i * 80 + 400)
          .duration(300)
          .attr('opacity', 1)

        // X axis label (wrap long names to first word)
        const short = a.name.length > 12 ? a.name.split(' ')[0] : a.name
        g.append('text')
          .attr('x', x + bw / 2)
          .attr('y', iH + 16)
          .attr('text-anchor', 'middle')
          .attr('dominant-baseline', 'hanging')
          .attr('fill', '#888')
          .attr('font-size', '12px')
          .attr('font-weight', '500')
          .attr('font-family', "'Inter',system-ui,sans-serif")
          .text(short)
      })
    }

    draw()
    const ro = new ResizeObserver(() => draw())
    ro.observe(container)
    return () => ro.disconnect()
  }, [artists])

  return <svg ref={svgRef} style={{ width: '100%', height: '100%' }} />
}
