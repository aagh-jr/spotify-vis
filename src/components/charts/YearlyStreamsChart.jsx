'use client'

import { useRef, useEffect } from 'react'
import * as d3 from 'd3'

/**
 * Vertical bar chart of total streams per year.
 * Ported from `drawYearlyStreams` in the Spotify Visualizer design.
 *
 * @param {Array<{year:string, streams:number}>} data
 */
export function YearlyStreamsChart({ data }) {
  const svgRef = useRef(null)

  useEffect(() => {
    const svg = svgRef.current
    if (!svg || !data?.length) return

    function draw() {
      const W = svg.clientWidth
      const H = svg.clientHeight
      if (!W || !H) return

      const margin = { top: 16, right: 8, bottom: 28, left: 38 }
      const iW = W - margin.left - margin.right
      const iH = H - margin.top - margin.bottom

      const sel = d3.select(svg)
      sel.selectAll('*').remove()
      sel.attr('width', W).attr('height', H)
      const g = sel.append('g').attr('transform', `translate(${margin.left},${margin.top})`)

      const xScale = d3.scaleBand().domain(data.map((d) => d.year)).range([0, iW]).padding(0.25)
      const yScale = d3.scaleLinear().domain([0, d3.max(data, (d) => d.streams) * 1.15]).range([iH, 0])

      yScale.ticks(3).forEach((t) => {
        g.append('line')
          .attr('x1', 0).attr('x2', iW)
          .attr('y1', yScale(t)).attr('y2', yScale(t))
          .attr('stroke', 'rgba(255,255,255,0.05)').attr('stroke-width', 1)
        g.append('text')
          .attr('x', -6).attr('y', yScale(t))
          .attr('text-anchor', 'end').attr('dominant-baseline', 'middle')
          .attr('fill', '#555').attr('font-size', '9px')
          .attr('font-family', "'Inter',system-ui,sans-serif")
          .text(t)
      })

      data.forEach((d, i) => {
        g.append('text')
          .attr('x', xScale(d.year) + xScale.bandwidth() / 2)
          .attr('y', iH + 16)
          .attr('text-anchor', 'middle')
          .attr('fill', '#555').attr('font-size', '10px')
          .attr('font-family', "'Inter',system-ui,sans-serif")
          .text(d.year)

        g.append('rect')
          .attr('x', xScale(d.year))
          .attr('width', xScale.bandwidth())
          .attr('rx', 6)
          .attr('fill', '#1DB954')
          .attr('opacity', 0.75)
          .attr('y', iH).attr('height', 0)
          .transition()
          .delay(i * 60)
          .duration(500)
          .ease(d3.easeCubicOut)
          .attr('y', yScale(d.streams))
          .attr('height', iH - yScale(d.streams))
      })
    }

    draw()
    const ro = new ResizeObserver(() => draw())
    ro.observe(svg.parentElement || svg)
    return () => ro.disconnect()
  }, [data])

  return <svg ref={svgRef} style={{ width: '100%', height: '100%' }} />
}
