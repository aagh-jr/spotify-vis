import './Controls.css'

/**
 * Top control bar: category toggle, period picker, topN toggle.
 */
export function Controls({
  category, setCategory,
  periodType, setPeriodType,
  selectedYear, setSelectedYear,
  topN, setTopN,
  years,
}) {
  const categories = ['artists', 'albums', 'songs']

  function handleYearSelect(e) {
    const val = e.target.value
    if (val) {
      setPeriodType('year')
      setSelectedYear(val)
    }
  }

  return (
    <div className="controls">
      {/* Category */}
      <div className="ctrl-group">
        {categories.map((c) => (
          <button
            key={c}
            className={`ctrl-btn ${category === c ? 'active' : ''}`}
            onClick={() => setCategory(c)}
          >
            {c.charAt(0).toUpperCase() + c.slice(1)}
          </button>
        ))}
      </div>

      {/* Divider */}
      <div className="ctrl-divider" />

      {/* Period */}
      <div className="ctrl-group">
        <button
          className={`ctrl-btn ${periodType === 'allTime' ? 'active' : ''}`}
          onClick={() => setPeriodType('allTime')}
        >
          All Time
        </button>

        <select
          className={`ctrl-select ${periodType === 'year' ? 'active' : ''}`}
          value={periodType === 'year' ? selectedYear : ''}
          onChange={handleYearSelect}
        >
          <option value="">By Year…</option>
          {years.map((y) => (
            <option key={y} value={y}>{y}</option>
          ))}
        </select>
      </div>

      {/* Divider */}
      <div className="ctrl-divider" />

      {/* TopN */}
      <div className="ctrl-group">
        {[5, 10].map((n) => (
          <button
            key={n}
            className={`ctrl-btn ${topN === n ? 'active' : ''}`}
            onClick={() => setTopN(n)}
          >
            Top {n}
          </button>
        ))}
      </div>
    </div>
  )
}
