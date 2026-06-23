'use client'

import { useState, useEffect, useMemo } from 'react'
import { Controls }  from '../src/components/Controls.jsx'
import { Sidebar }   from '../src/components/Sidebar.jsx'
import { BumpChart } from '../src/components/BumpChart.jsx'
import { getChartData } from '../src/utils/chartData.js'
import '../src/App.css'

export default function Page() {
  // ── Remote data ──────────────────────────────────────────────────────────
  const [data, setData]       = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError]     = useState(null)

  useEffect(() => {
    fetch('/data.json')
      .then((r) => {
        if (!r.ok) throw new Error(`HTTP ${r.status}`)
        return r.json()
      })
      .then((d) => { setData(d); setLoading(false) })
      .catch((e) => { setError(e.message); setLoading(false) })
  }, [])

  // ── UI state ──────────────────────────────────────────────────────────────
  const [category,     setCategory]     = useState('artists')
  const [periodType,   setPeriodType]   = useState('allTime')
  const [selectedYear, setSelectedYear] = useState('2024')
  const [topN,         setTopN]         = useState(5)
  const [hoveredName,  setHoveredName]  = useState(null)

  // ── Derived chart data ────────────────────────────────────────────────────
  const { periods, series } = useMemo(
    () => getChartData(data, category, periodType, selectedYear, topN),
    [data, category, periodType, selectedYear, topN]
  )

  const years = data?.meta?.years ?? []

  // ── Render ─────────────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="app-loading">
        <div className="loading-spinner" />
        <p>Loading your listening history…</p>
      </div>
    )
  }

  if (error) {
    return (
      <div className="app-loading">
        <p className="app-error">Failed to load data: {error}</p>
        <p style={{ color: 'var(--text-muted)', fontSize: 13, marginTop: 8 }}>
          Make sure you ran <code>python3 scripts/process_data.py</code> first.
        </p>
      </div>
    )
  }

  return (
    <div className="app">
      {/* Header */}
      <header className="app-header">
        <div className="app-logo">
          <span className="logo-mark">▶</span>
          <span className="logo-text">Spotify Visualizer</span>
        </div>
        <div className="app-subtitle">
          {data.meta.totalPlays.toLocaleString()} plays · 2017 – 2024
        </div>
      </header>

      {/* Main layout */}
      <div className="app-body">
        <Sidebar
          series={series}
          category={category}
          hoveredName={hoveredName}
          setHoveredName={setHoveredName}
        />

        <div className="chart-panel">
          <Controls
            category={category}     setCategory={setCategory}
            periodType={periodType} setPeriodType={setPeriodType}
            selectedYear={selectedYear} setSelectedYear={setSelectedYear}
            topN={topN}             setTopN={setTopN}
            years={years}
          />

          <div className="chart-area">
            <BumpChart
              periods={periods}
              series={series}
              periodType={periodType}
              hoveredName={hoveredName}
              setHoveredName={setHoveredName}
            />
          </div>
        </div>
      </div>
    </div>
  )
}
