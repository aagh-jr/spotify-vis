'use client'

import { useState, useEffect, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { getChartData } from '../utils/chartData.js'
import { buildSampleDataset, augmentDataset } from '../utils/sampleData.js'
import { BumpRankCard } from './charts/BumpRankCard.jsx'
import { GenreBarChart } from './charts/GenreBarChart.jsx'
import { YearlyStreamsChart } from './charts/YearlyStreamsChart.jsx'
import { PlayCountChart } from './charts/PlayCountChart.jsx'
import './RankingsView.css'

const STORAGE_KEY = 'spotifyProcessedData'

/**
 * Full rankings view — port of the Claude Design `Spotify Visualizer.dc.html`.
 * Controls bar + combined bump chart with pinned artist sidebar + secondary
 * charts (genres/platforms, yearly streams, play count over time).
 */
export function RankingsView() {
  const router = useRouter()

  const [data, setData] = useState(null)
  const [hydrated, setHydrated] = useState(false)

  const [category, setCategory] = useState('artists')
  const [periodType, setPeriodType] = useState('allTime') // 'allTime' | 'year'
  const [selectedYear, setSelectedYear] = useState('')
  const [topN, setTopN] = useState(5)
  const [hoveredName, setHoveredName] = useState(null)
  const [timeUnit, setTimeUnit] = useState('monthly') // 'monthly' | 'yearly'

  // Load real data, or fall back to the sample dataset (matches the design).
  useEffect(() => {
    let loaded = null
    try {
      const stored = localStorage.getItem(STORAGE_KEY)
      if (stored) loaded = JSON.parse(stored)
    } catch { /* ignore corrupt cache */ }
    setData(augmentDataset(loaded) || buildSampleDataset())
    setHydrated(true)
  }, [])

  // Keep selected year valid when switching into year mode.
  useEffect(() => {
    const years = data?.meta?.years
    if (years?.length && !selectedYear) setSelectedYear(years[years.length - 1])
  }, [data, selectedYear])

  const { periods, series } = useMemo(
    () => (data ? getChartData(data, category, periodType, selectedYear, topN) : { periods: [], series: [] }),
    [data, category, periodType, selectedYear, topN]
  )

  function onSelect(item) {
    router.push(`/detail?type=${category}&name=${encodeURIComponent(item.name)}`)
  }

  if (!hydrated || !data) {
    return (
      <div className="app-loading">
        <div className="loading-spinner" />
      </div>
    )
  }

  const years = data.meta.years ?? []
  const yearRange = years.length ? `${years[0]} – ${years[years.length - 1]}` : ''
  const genreItems = data.platforms || data.genres || []
  const genreTitle = data.platforms ? 'By Platform' : 'Top Genres'

  const tab = (active) => `rk-tab${active ? ' is-active' : ''}`

  return (
    <div className="rk">
      {/* Header */}
      <header className="rk-header">
        <div className="rk-header-left">
          <Link href="/" className="rk-back">← Home</Link>
          <div className="rk-brand">
            <span className="rk-brand-mark">▶</span>
            <span className="rk-brand-name">Spotify Visualizer</span>
          </div>
        </div>
        <div className="rk-totals">
          {data.meta.totalPlays.toLocaleString()} plays{yearRange ? ` · ${yearRange}` : ''}
          {data.isSample && <span className="rk-sample-tag"> · sample data</span>}
        </div>
      </header>

      {/* Controls card */}
      <div className="rk-controls">
        <div className="rk-tabgroup">
          <button className={tab(category === 'artists')} onClick={() => setCategory('artists')}>Artists</button>
          <button className={tab(category === 'albums')} onClick={() => setCategory('albums')}>Albums</button>
          <button className={tab(category === 'songs')} onClick={() => setCategory('songs')}>Songs</button>
        </div>
        <div className="rk-tabgroup">
          <button className={tab(periodType === 'allTime')} onClick={() => setPeriodType('allTime')}>All Time</button>
          <select
            className={`rk-year-select${periodType === 'year' ? ' is-active' : ''}`}
            value={periodType === 'year' ? selectedYear : ''}
            onChange={(e) => {
              const v = e.target.value
              if (v) { setPeriodType('year'); setSelectedYear(v) }
              else setPeriodType('allTime')
            }}
          >
            <option value="">By Year…</option>
            {years.map((y) => <option key={y} value={y}>{y}</option>)}
          </select>
        </div>
        <div className="rk-tabgroup rk-tabgroup-end">
          <button className={tab(topN === 5)} onClick={() => setTopN(5)}>Top 5</button>
          <button className={tab(topN === 10)} onClick={() => setTopN(10)}>Top 10</button>
        </div>
      </div>

      {/* Scrollable charts body */}
      <div className="rk-body">
        {/* Row 1: bump chart + artist sidebar */}
        <div className="rk-row-bump">
          <BumpRankCard
            periods={periods}
            series={series}
            periodType={periodType}
            topN={topN}
            hoveredName={hoveredName}
            setHoveredName={setHoveredName}
            onSelect={onSelect}
          />
        </div>

        {/* Row 2: genres/platforms + yearly streams */}
        <div className="rk-row-2">
          <div className="rk-card">
            <div className="rk-card-title">{genreTitle}</div>
            <div className="rk-card-sub">All time</div>
            <div className="rk-card-body">
              <GenreBarChart items={genreItems} />
            </div>
          </div>
          <div className="rk-card">
            <div className="rk-card-title">Total Streams by Year</div>
            <div className="rk-card-sub">{yearRange}</div>
            <div className="rk-card-body">
              <YearlyStreamsChart data={data.yearlyStreams} />
            </div>
          </div>
        </div>

        {/* Row 3: artist play count over time */}
        <div className="rk-card rk-row-3">
          <div className="rk-card-headrow">
            <div className="rk-card-title">Artist Play Count Over Time</div>
            <div className="rk-tabgroup rk-tabgroup-sm">
              <button className={tab(timeUnit === 'monthly')} onClick={() => setTimeUnit('monthly')}>Monthly</button>
              <button className={tab(timeUnit === 'yearly')} onClick={() => setTimeUnit('yearly')}>Yearly</button>
            </div>
          </div>
          <div className="rk-card-sub">Top 5 artists · streams per period</div>
          <div className="rk-card-body">
            <PlayCountChart data={data} timeUnit={timeUnit} />
          </div>
        </div>
      </div>
    </div>
  )
}
