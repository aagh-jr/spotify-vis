'use client'

import { useRef, useEffect } from 'react'
import * as d3 from 'd3'

const COLORS = ['#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7']

/**
 * Multi-line chart of the top-5 all-time artists' play counts over time.
 * Ported from `drawPlayCount` in the Spotify Visualizer design.
 *
 * @param {object} data       processed dataset (meta/yearly/monthly/allTime)
 * @param {'monthly'|'yearly'} timeUnit
 */
export function PlayCountChart({ data, timeUnit }) {
  const svgRef = useRef(null)

  useEffect(() => {
    const svg = svgRef.current
    if (!svg || !data) return

    function draw() {
      const W = svg.clientWidth
      const H = svg.clientHeight
      if (!W || !H) return

      const top5 = data.allTime.artists.slice(0, 5)
      let periods, getValue
      if (timeUnit === 'monthly') {
        periods = data.meta.months
        getValue = (name, p) => {
          const e = (data.monthly[p]?.artists || []).find((a) => a.name === name)
          return e ? e.plays : 0
        }
      } else {
        periods = data.meta.years
        getValue = (name, p) => {
          const e = (data.yearly[p]?.artists || []).find((a) => a.name === name)
          return e ? e.plays : 0
        }
      }

      const series = top5.map((a, i) => ({
        name: a.name,
        color: COLORS[i],
        values: periods.map((p) => getValue(a.name, p)),
      }))

      const margin = { top: 8, right: 110, bottom: 28, left: 38 }
      const iW = W - margin.left - margin.right
      const iH = H - margin.top - margin.bottom

      const sel = d3.select(svg)
      sel.selectAll('*').remove()
      sel.attr('width', W).attr('height', H)
      const g = sel.append('g').attr('transform', `translate(${margin.left},${margin.top})`)

      const xScale = d3.scalePoint().domain(periods).range([0, iW]).padding(0.1)
      const maxVal = d3.max(series.flatMap((s) => s.values)) || 10
      const yScale = d3.scaleLinear().domain([0, maxVal * 1.1]).range([iH, 0])

      yScale.ticks(3).forEach((t) => {
        g.append('line')
          .attr('x1', 0).attr('x2', iW)
          .attr('y1', yScale(t)).attr('y2', yScale(t))
          .attr('stroke', 'rgba(255,255,255,0.05)').attr('stroke-width', 1)
        g.append('text')
          .attr('x', -6).attr('y', yScale(t))
          .attr('text-anchor', 'end').attr('dominant-baseline', 'middle')
          .attr('fill', '#555').attr('font-size', '10px')
          .attr('font-family', "'Inter',system-ui,sans-serif")
          .text(t)
      })

      const step = timeUnit === 'monthly' ? 12 : 1
      periods.forEach((p, i) => {
        if (i % step !== 0) return
        g.append('text')
          .attr('x', xScale(p)).attr('y', iH + 16)
          .attr('text-anchor', 'middle')
          .attr('fill', '#555').attr('font-size', '10px')
          .attr('font-family', "'Inter',system-ui,sans-serif")
          .text(timeUnit === 'monthly' ? p.slice(0, 4) : p)
      })

      series.forEach((s) => {
        const lineGen = d3
          .line()
          .x((d, i) => xScale(periods[i]))
          .y((d) => yScale(d))
          .curve(d3.curveBumpX)
          .defined((d) => d > 0)
        g.append('path')
          .datum(s.values)
          .attr('fill', 'none')
          .attr('stroke', s.color)
          .attr('stroke-width', 2.5)
          .attr('opacity', 0.85)
          .attr('d', lineGen)
        const lastVal = s.values[s.values.length - 1]
        g.append('text')
          .attr('x', iW + 8).attr('y', yScale(lastVal))
          .attr('dominant-baseline', 'middle')
          .attr('fill', s.color).attr('font-size', '11px')
          .attr('font-family', "'Inter',system-ui,sans-serif")
          .text(s.name.split(' ')[0])
      })
    }

    draw()
    const ro = new ResizeObserver(() => draw())
    ro.observe(svg.parentElement || svg)
    return () => ro.disconnect()
  }, [data, timeUnit])

  return <svg ref={svgRef} style={{ width: '100%', height: '100%' }} />
}
