/**
 * Derives the data for the bump chart from the raw processed dataset.
 *
 * Returns:
 *   periods  — array of x-axis labels (years or "YYYY-MM" strings)
 *   series   — array of { name, artist?, plays, ranks[] }
 *              ranks[i] is the 1-based rank at periods[i], or null if not ranked
 */
export function getChartData(data, category, periodType, selectedYear, topN) {
  if (!data) return { periods: [], series: [] }

  let periods       // x-axis tick labels
  let baseList      // entities to show (top N from the selected scope)
  let getRank       // (name) => ranks[] aligned to periods

  if (periodType === 'allTime') {
    // x-axis = each year in the dataset
    periods = data.meta.years.slice().sort()

    // The entities shown are the overall top N
    baseList = (data.allTime[category] || []).slice(0, topN)

    getRank = (name) =>
      periods.map((year) => {
        const list = data.yearly[year]?.[category] || []
        const idx  = list.findIndex((e) => e.name === name)
        return idx === -1 ? null : idx + 1
      })

  } else {
    // x-axis = months within the selected year that have data
    periods = data.meta.months
      .filter((m) => m.startsWith(selectedYear))
      .sort()

    // The entities shown are the top N for that specific year
    baseList = (data.yearly[selectedYear]?.[category] || []).slice(0, topN)

    getRank = (name) =>
      periods.map((month) => {
        const list = data.monthly[month]?.[category] || []
        const idx  = list.findIndex((e) => e.name === name)
        return idx === -1 ? null : idx + 1
      })
  }

  const series = baseList.map((item) => ({
    name:   item.name,
    artist: item.artist ?? null,   // present for songs & albums
    plays:  item.plays,
    ranks:  getRank(item.name),
  }))

  return { periods, series }
}

/** Format a period label for display on the x-axis. */
const MONTH_NAMES = ['Jan','Feb','Mar','Apr','May','Jun',
                     'Jul','Aug','Sep','Oct','Nov','Dec']

export function formatPeriod(period, periodType) {
  if (periodType === 'allTime') return period
  // "2023-04" → "Apr"
  const monthIdx = parseInt(period.split('-')[1], 10) - 1
  return MONTH_NAMES[monthIdx]
}
