'use client'

import { useState, useEffect, useMemo } from 'react'
import { Controls }     from '../src/components/Controls.jsx'
import { Sidebar }      from '../src/components/Sidebar.jsx'
import { BumpChart }    from '../src/components/BumpChart.jsx'
import { ImportScreen } from '../src/components/ImportScreen.jsx'
import { getChartData } from '../src/utils/chartData.js'
import '../src/App.css'

const STORAGE_KEY = 'spotifyProcessedData'

export default function Page() {
  // ── Imported dataset (null until the user imports their history) ──────────
  const [data, setData]       = useState(null)
  const [hydrated, setHydrated] = useState(false)

  // ── UI state ──────────────────────────────────────────────────────────────
  const [category,     setCategory]     = useState('artists')
  const [periodType,   setPeriodType]   = useState('allTime')
  const [selectedYear, setSelectedYear] = useState('')
  const [topN,         setTopN]         = useState(5)
  const [hoveredName,  setHoveredName]  = useState(null)

  // Restore a previously imported dataset from localStorage on mount.
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY)
      if (stored) setData(JSON.parse(stored))
    } catch { /* ignore corrupt cache */ }
    setHydrated(true)
  }, [])

  // Keep the selected year valid for the active dataset.
  useEffect(() => {
    const years = data?.meta?.years
    if (years?.length) setSelectedYear(years[years.length - 1])
  }, [data])

  function handleImport(processed) {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(processed)) } catch { /* quota */ }
    setData(processed)
    setPeriodType('allTime')
    setCategory('artists')
  }

  function clearData() {
    setData(null)
  }

  // ── Derived chart data ────────────────────────────────────────────────────
  const { periods, series } = useMemo(
    () => getChartData(data, category, periodType, selectedYear, topN),
    [data, category, periodType, selectedYear, topN]
  )

  // Avoid a hydration flash before localStorage is read.
  if (!hydrated) {
    return (
      <div className="app-loading">
        <div className="loading-spinner" />
      </div>
    )
  }

  // No data yet → the import screen is the entry point.
  if (!data) {
    return <ImportScreen onData={handleImport} />
  }

  const years = data.meta.years ?? []
  const yearRange = years.length ? `${years[0]} – ${years[years.length - 1]}` : ''

  return (
    <div className="app">
      {/* Header */}
      <header className="app-header">
        <div className="app-logo">
          <span className="logo-mark">▶</span>
          <span className="logo-text">Spotify Visualizer</span>
        </div>
        <div className="app-header-right">
          <div className="app-subtitle">
            {data.meta.totalPlays.toLocaleString()} plays{yearRange ? ` · ${yearRange}` : ''}
          </div>
          <button className="reimport-btn" onClick={clearData}>↺ Import new data</button>
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
