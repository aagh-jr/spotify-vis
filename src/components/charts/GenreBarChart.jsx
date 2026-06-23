'use client'

import { useRef, useEffect } from 'react'
import * as d3 from 'd3'

/**
 * Horizontal bar chart of top genres (or platforms, for real data).
 * Ported from `drawGenres` in the Spotify Visualizer design.
 *
 * @param {Array<{name:string, streams:number, color:string}>} items
 */
export function GenreBarChart({ items }) {
  const svgRef = useRef(null)

  useEffect(() => {
    const svg = svgRef.current
    if (!svg || !items?.length) return

    function draw() {
      const W = svg.clientWidth
      const H = svg.clientHeight
      if (!W || !H) return

      const margin = { top: 4, right: 56, bottom: 4, left: 88 }
      const iW = W - margin.left - margin.right
      const iH = H - margin.top - margin.bottom

      const sel = d3.select(svg)
      sel.selectAll('*').remove()
      sel.attr('width', W).attr('height', H)
      const g = sel.append('g').attr('transform', `translate(${margin.left},${margin.top})`)

      const yScale = d3.scaleBand().domain(items.map((d) => d.name)).range([0, iH]).padding(0.32)
      const xScale = d3.scaleLinear().domain([0, d3.max(items, (d) => d.streams) * 1.1]).range([0, iW])

      items.forEach((item) => {
        g.append('text')
          .attr('x', -10)
          .attr('y', yScale(item.name) + yScale.bandwidth() / 2)
          .attr('text-anchor', 'end')
          .attr('dominant-baseline', 'middle')
          .attr('fill', '#777')
          .attr('font-size', '11px')
          .attr('font-family', "'Inter',system-ui,sans-serif")
          .text(item.name)

        g.append('rect')
          .attr('x', 0)
          .attr('y', yScale(item.name))
          .attr('height', yScale.bandwidth())
          .attr('rx', 5)
          .attr('fill', 'rgba(255,255,255,0.04)')
          .attr('width', iW)

        g.append('rect')
          .attr('x', 0)
          .attr('y', yScale(item.name))
          .attr('height', yScale.bandwidth())
          .attr('rx', 5)
          .attr('fill', item.color)
          .attr('opacity', 0.8)
          .attr('width', 0)
          .transition()
          .duration(600)
          .ease(d3.easeCubicOut)
          .attr('width', xScale(item.streams))

        g.append('text')
          .attr('x', xScale(item.streams) + 8)
          .attr('y', yScale(item.name) + yScale.bandwidth() / 2)
          .attr('dominant-baseline', 'middle')
          .attr('fill', '#555')
          .attr('font-size', '10px')
          .attr('font-family', "'Inter',system-ui,sans-serif")
          .text(item.streams.toLocaleString())
      })
    }

    draw()
    const ro = new ResizeObserver(() => draw())
    ro.observe(svg.parentElement || svg)
    return () => ro.disconnect()
  }, [items])

  return <svg ref={svgRef} style={{ width: '100%', height: '100%' }} />
}
