/**
 * sampleData.js
 * Demonstration dataset used as a fallback when the user hasn't imported their
 * own Spotify history yet. Ported from the Claude Design `generateData()` in
 * `Spotify Visualizer.dc.html` so the visualizer renders meaningfully out of
 * the box (and matches the design previews).
 *
 * Shape matches the output of processSpotify.js (meta/allTime/yearly/monthly/
 * yearlyStreams) plus a `genres` field the real export doesn't carry.
 */

const YEARS = ['2017', '2018', '2019', '2020', '2021', '2022', '2023', '2024']

const ARTIST_RANKINGS = {
  '2017': ['Drake', 'Kendrick Lamar', 'Kanye West', 'The Weeknd', 'Post Malone', 'Taylor Swift', 'SZA', 'Harry Styles', 'Billie Eilish', 'Bad Bunny'],
  '2018': ['Drake', 'Post Malone', 'The Weeknd', 'Kendrick Lamar', 'Taylor Swift', 'Billie Eilish', 'Kanye West', 'Bad Bunny', 'Harry Styles', 'SZA'],
  '2019': ['Billie Eilish', 'Drake', 'Post Malone', 'The Weeknd', 'Bad Bunny', 'Taylor Swift', 'Kendrick Lamar', 'Harry Styles', 'SZA', 'Kanye West'],
  '2020': ['The Weeknd', 'Bad Bunny', 'Drake', 'Billie Eilish', 'Taylor Swift', 'Post Malone', 'Harry Styles', 'Kendrick Lamar', 'SZA', 'Kanye West'],
  '2021': ['Taylor Swift', 'Bad Bunny', 'Drake', 'The Weeknd', 'Billie Eilish', 'Harry Styles', 'Kendrick Lamar', 'SZA', 'Post Malone', 'Kanye West'],
  '2022': ['Bad Bunny', 'Taylor Swift', 'The Weeknd', 'Drake', 'Harry Styles', 'Kendrick Lamar', 'Billie Eilish', 'SZA', 'Post Malone', 'Kanye West'],
  '2023': ['Taylor Swift', 'SZA', 'Kendrick Lamar', 'Drake', 'Bad Bunny', 'The Weeknd', 'Billie Eilish', 'Harry Styles', 'Post Malone', 'Kanye West'],
  '2024': ['Taylor Swift', 'Kendrick Lamar', 'Drake', 'SZA', 'Bad Bunny', 'Billie Eilish', 'The Weeknd', 'Harry Styles', 'Post Malone', 'Kanye West'],
}

const ARTIST_ALLTIME_PLAYS = {
  Drake: 4800, 'Taylor Swift': 4600, 'The Weeknd': 3900, 'Bad Bunny': 3700,
  'Kendrick Lamar': 3500, 'Billie Eilish': 3200, 'Post Malone': 3000,
  'Harry Styles': 2800, SZA: 2600, 'Kanye West': 2200,
}

const ALBUMS = [
  { name: 'Scorpion', artist: 'Drake', plays: 1200 },
  { name: 'Midnights', artist: 'Taylor Swift', plays: 1100 },
  { name: 'After Hours', artist: 'The Weeknd', plays: 980 },
  { name: 'un verano sin ti', artist: 'Bad Bunny', plays: 920 },
  { name: 'DAMN.', artist: 'Kendrick Lamar', plays: 880 },
  { name: 'Happier Than Ever', artist: 'Billie Eilish', plays: 830 },
  { name: "Hollywood's Bleeding", artist: 'Post Malone', plays: 780 },
  { name: 'Fine Line', artist: 'Harry Styles', plays: 740 },
  { name: 'SOS', artist: 'SZA', plays: 700 },
  { name: 'Donda', artist: 'Kanye West', plays: 620 },
]

const SONGS = [
  { name: "God's Plan", artist: 'Drake', plays: 342 },
  { name: 'Anti-Hero', artist: 'Taylor Swift', plays: 318 },
  { name: 'Blinding Lights', artist: 'The Weeknd', plays: 295 },
  { name: 'Tití Me Preguntó', artist: 'Bad Bunny', plays: 271 },
  { name: 'HUMBLE.', artist: 'Kendrick Lamar', plays: 254 },
  { name: 'bad guy', artist: 'Billie Eilish', plays: 238 },
  { name: 'Sunflower', artist: 'Post Malone', plays: 224 },
  { name: 'Watermelon Sugar', artist: 'Harry Styles', plays: 210 },
  { name: 'Kill Bill', artist: 'SZA', plays: 198 },
  { name: 'Stronger', artist: 'Kanye West', plays: 176 },
]

const ALBUM_ORDERS_BY_YEAR = {
  '2017': [0, 4, 2, 9, 1, 5, 6, 7, 8, 3], '2018': [0, 2, 4, 1, 5, 6, 7, 8, 9, 3],
  '2019': [5, 0, 6, 2, 3, 1, 7, 8, 9, 4], '2020': [2, 3, 0, 5, 1, 6, 7, 4, 8, 9],
  '2021': [1, 3, 0, 2, 5, 7, 4, 8, 6, 9], '2022': [3, 1, 2, 0, 7, 4, 5, 8, 6, 9],
  '2023': [1, 8, 4, 0, 3, 2, 5, 7, 6, 9], '2024': [1, 4, 0, 8, 3, 5, 2, 7, 6, 9],
}

const GENRES = [
  { name: 'Hip-Hop', streams: 12400, color: '#FF6B6B' },
  { name: 'Pop', streams: 10200, color: '#4ECDC4' },
  { name: 'R&B', streams: 8900, color: '#45B7D1' },
  { name: 'Reggaeton', streams: 7100, color: '#96CEB4' },
  { name: 'Alternative', streams: 5800, color: '#FFEAA7' },
  { name: 'Electronic', streams: 4200, color: '#DDA0DD' },
  { name: 'Latin', streams: 3800, color: '#74B9FF' },
]

/** Build the full demo dataset (matches processSpotify.js output shape). */
export function buildSampleDataset() {
  const allTimeArtists = Object.entries(ARTIST_ALLTIME_PLAYS)
    .sort((a, b) => b[1] - a[1])
    .map(([name, plays]) => ({ name, plays }))

  const yearly = {}
  YEARS.forEach((year) => {
    const rankings = ARTIST_RANKINGS[year]
    yearly[year] = {
      artists: rankings.map((name, i) => ({
        name,
        plays: Math.round(ARTIST_ALLTIME_PLAYS[name] * 0.12 * (1 - i * 0.04)),
      })),
    }
  })

  const months = []
  const monthly = {}
  YEARS.forEach((year) => {
    for (let m = 1; m <= 12; m++) {
      const key = `${year}-${String(m).padStart(2, '0')}`
      months.push(key)
      const yr = ARTIST_RANKINGS[year].slice()
      const swapIdx = (m * 3) % (yr.length - 1)
      if (m % 2 === 0) {
        const t = yr[swapIdx]
        yr[swapIdx] = yr[swapIdx + 1]
        yr[swapIdx + 1] = t
      }
      monthly[key] = {
        artists: yr.map((name, i) => ({
          name,
          plays: Math.round(ARTIST_ALLTIME_PLAYS[name] * 0.01 * (1 - i * 0.04)),
        })),
      }
    }
  })

  YEARS.forEach((year) => {
    const order = ALBUM_ORDERS_BY_YEAR[year] || [0, 1, 2, 3, 4, 5, 6, 7, 8, 9]
    yearly[year].albums = order.map((idx, rank) => ({
      name: ALBUMS[idx].name, artist: ALBUMS[idx].artist,
      plays: Math.round(ALBUMS[idx].plays * 0.12 * (1 - rank * 0.04)),
    }))
    yearly[year].songs = order.map((idx, rank) => ({
      name: SONGS[idx].name, artist: SONGS[idx].artist,
      plays: Math.round(SONGS[idx].plays * 0.12 * (1 - rank * 0.04)),
    }))
  })

  Object.keys(monthly).forEach((key) => {
    const year = key.slice(0, 4)
    monthly[key].albums = yearly[year].albums
    monthly[key].songs = yearly[year].songs
  })

  const yearlyStreams = YEARS.map((year) => ({
    year,
    streams: (yearly[year]?.artists || []).reduce((s, a) => s + a.plays, 0),
  }))

  return {
    meta: { totalPlays: 45231, years: YEARS, months },
    allTime: { artists: allTimeArtists, albums: ALBUMS, songs: SONGS },
    yearly,
    monthly,
    genres: GENRES,
    yearlyStreams,
    isSample: true,
  }
}

/**
 * Normalize a real or sample dataset so the rankings charts always have the
 * fields they read (`genres`/`platforms` and `yearlyStreams`).
 */
export function augmentDataset(data) {
  if (!data) return null
  const out = { ...data }
  if (!out.genres) out.genres = out.platforms || []
  if (!out.yearlyStreams) {
    out.yearlyStreams = (out.meta?.years || []).map((year) => ({
      year,
      streams: (out.yearly?.[year]?.artists || []).reduce((s, a) => s + a.plays, 0),
    }))
  }
  return out
}
