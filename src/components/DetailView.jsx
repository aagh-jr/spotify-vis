'use client'

import { useRef, useEffect, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import * as d3 from 'd3'
import { buildSampleDataset } from '../utils/sampleData.js'
import './DetailView.css'

const STORAGE_KEY = 'spotifyProcessedData'
const MONTH_NAMES = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
const TYPE_LABEL = { artists: 'Artist', albums: 'Album', songs: 'Song' }

function baseFromDataset(ds) {
  const artistPlays = {}
  ds.allTime.artists.forEach((a) => { artistPlays[a.name] = a.plays })
  return { years: ds.meta.years, months: ds.meta.months, monthly: ds.monthly, artistPlays }
}

function loadBase() {
  try {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (stored) return baseFromDataset(JSON.parse(stored))
  } catch { /* ignore */ }
  return baseFromDataset(buildSampleDataset())
}

function buildEntityData(type, name) {
  const { years, months, monthly, artistPlays } = loadBase()

  const fmtMonth = (m) => {
    if (!m) return '—'
    const [y, mo] = m.split('-')
    return `${MONTH_NAMES[parseInt(mo, 10) - 1]} ${y}`
  }

  // For albums/songs the rankings live under those category keys; artists under .artists
  const listFor = (period) => monthly[period]?.[type] || monthly[period]?.artists || []

  const allMonthly = months.map((month) => {
    const entry = listFor(month).find((a) => a.name === name)
    return { month, plays: entry ? entry.plays : 0 }
  })
  const played = allMonthly.filter((d) => d.plays > 0)

  const firstMonth = played[0]?.month
  const lastMonth = played[played.length - 1]?.month
  const totalStreams = artistPlays[name] || played.reduce((s, d) => s + d.plays, 0) || 1200
  const activeYears = years.filter((year) => (monthly[`${year}-06`]?.[type] || monthly[`${year}-06`]?.artists || []).some((a) => a.name === name)).length

  return {
    name,
    type,
    firstPlay: { label: fmtMonth(firstMonth), sub: firstMonth ? `${firstMonth} · first recorded play` : '' },
    lastPlay: { label: fmtMonth(lastMonth), sub: lastMonth ? `${lastMonth} · most recent play` : '' },
    totalStreams: totalStreams.toLocaleString(),
    activeYears,
    years,
    allMonthly,
  }
}

/** Entity detail view — port of the Claude Design `Detail.dc.html`. */
export function DetailView() {
  const params = useSearchParams()
  const type = params.get('type') || 'artists'
  const name = params.get('name') || 'Drake'

  const [viewYear, setViewYear] = useState('all')
  const [entity, setEntity] = useState(null)
  const svgRef = useRef(null)

  useEffect(() => {
    setEntity(buildEntityData(type, name))
  }, [type, name])

  useEffect(() => {
    const svg = svgRef.current
    if (!svg || !entity) return

    function draw() {
      const W = svg.clientWidth
      const H = svg.clientHeight
      if (!W || !H) return

      const rawData = viewYear === 'all'
        ? entity.allMonthly
        : entity.allMonthly.filter((d) => d.month.startsWith(viewYear))

      const margin = { top: 16, right: 24, bottom: 32, left: 44 }
      const iW = W - margin.left - margin.right
      const iH = H - margin.top - margin.bottom

      const sel = d3.select(svg)
      sel.selectAll('*').remove()
      sel.attr('width', W).attr('height', H)
      const g = sel.append('g').attr('transform', `translate(${margin.left},${margin.top})`)

      const xScale = d3.scalePoint().domain(rawData.map((d) => d.month)).range([0, iW]).padding(0.1)
      const yScale = d3.scaleLinear().domain([0, d3.max(rawData, (d) => d.plays) * 1.2 || 10]).range([iH, 0])

      yScale.ticks(4).forEach((t) => {
        g.append('line').attr('x1', 0).attr('x2', iW).attr('y1', yScale(t)).attr('y2', yScale(t))
          .attr('stroke', 'rgba(255,255,255,0.05)').attr('stroke-width', 1)
        g.append('text').attr('x', -8).attr('y', yScale(t))
          .attr('text-anchor', 'end').attr('dominant-baseline', 'middle')
          .attr('fill', '#555').attr('font-size', '10px')
          .attr('font-family', "'Inter',system-ui,sans-serif").text(t)
      })

      const labelStep = viewYear === 'all' ? 12 : 2
      rawData.forEach((d, i) => {
        if (i % labelStep !== 0) return
        g.append('text').attr('x', xScale(d.month)).attr('y', iH + 18).attr('text-anchor', 'middle')
          .attr('fill', '#555').attr('font-size', '10px')
          .attr('font-family', "'Inter',system-ui,sans-serif")
          .text(viewYear === 'all' ? d.month.slice(0, 4) : d.month.slice(5))
      })

      const areaGen = d3.area().x((d) => xScale(d.month)).y0(iH).y1((d) => yScale(d.plays))
        .curve(d3.curveMonotoneX).defined((d) => d.plays > 0)
      g.append('path').datum(rawData).attr('fill', '#1DB954').attr('opacity', 0.08).attr('d', areaGen)

      const lineGen = d3.line().x((d) => xScale(d.month)).y((d) => yScale(d.plays))
        .curve(d3.curveMonotoneX).defined((d) => d.plays > 0)
      const path = g.append('path').datum(rawData).attr('fill', 'none').attr('stroke', '#1DB954')
        .attr('stroke-width', 2.5).attr('d', lineGen)
        .attr('stroke-dasharray', function () { return this.getTotalLength() })
        .attr('stroke-dashoffset', function () { return this.getTotalLength() })
      path.transition().duration(800).ease(d3.easeCubicOut).attr('stroke-dashoffset', 0)

      rawData.filter((d) => d.plays > 0).forEach((d) => {
        g.append('circle').attr('cx', xScale(d.month)).attr('cy', yScale(d.plays))
          .attr('r', 3).attr('fill', '#1DB954').attr('opacity', 0.9)
          .attr('stroke', '#080810').attr('stroke-width', 1.5)
      })
    }

    draw()
    const ro = new ResizeObserver(() => draw())
    ro.observe(svg.parentElement || svg)
    return () => ro.disconnect()
  }, [entity, viewYear])

  if (!entity) {
    return (
      <div className="app-loading">
        <div className="loading-spinner" />
      </div>
    )
  }

  const yearTab = (active) => `dt-tab${active ? ' is-active' : ''}`

  return (
    <div className="dt">
      <header className="dt-header">
        <div className="dt-header-left">
          <Link href="/rankings" className="dt-back">← Rankings</Link>
          <div className="dt-brand">
            <span className="dt-brand-mark">▶</span>
            <span className="dt-brand-name">{entity.name}</span>
          </div>
        </div>
        <div className="dt-type">{TYPE_LABEL[entity.type] || entity.type}</div>
      </header>

      <div className="dt-metrics">
        <div className="dt-metric">
          <div className="dt-metric-label">First Played</div>
          <div className="dt-metric-value">{entity.firstPlay.label}</div>
          <div className="dt-metric-sub">{entity.firstPlay.sub}</div>
        </div>
        <div className="dt-metric">
          <div className="dt-metric-label">Last Played</div>
          <div className="dt-metric-value accent">{entity.lastPlay.label}</div>
          <div className="dt-metric-sub">{entity.lastPlay.sub}</div>
        </div>
        <div className="dt-metric">
          <div className="dt-metric-label">Total Streams</div>
          <div className="dt-metric-value">{entity.totalStreams}</div>
          <div className="dt-metric-sub">across all time</div>
        </div>
        <div className="dt-metric">
          <div className="dt-metric-label">Active Years</div>
          <div className="dt-metric-value">{entity.activeYears}</div>
          <div className="dt-metric-sub">years in your history</div>
        </div>
      </div>

      <div className="dt-chart-card">
        <div className="dt-chart-head">
          <div>
            <div className="dt-chart-title">Streams Over Time</div>
            <div className="dt-chart-sub">Monthly plays · all time</div>
          </div>
          <div className="dt-tabgroup">
            <button className={yearTab(viewYear === 'all')} onClick={() => setViewYear('all')}>All Time</button>
            {entity.years.map((y) => (
              <button key={y} className={yearTab(viewYear === y)} onClick={() => setViewYear(y)}>{y}</button>
            ))}
          </div>
        </div>
        <div className="dt-chart-body">
          <svg ref={svgRef} style={{ width: '100%', height: '100%' }} />
        </div>
      </div>
    </div>
  )
}
