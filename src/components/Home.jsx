'use client'

import { useRef, useState, useEffect } from 'react'
import Link from 'next/link'
import { processSpotifyHistory } from '../utils/processSpotify.js'
import { WeeklyBarChart } from './WeeklyBarChart.jsx'
import './Home.css'

const STORAGE_KEY = 'spotifyProcessedData'
const WEEKLY_COLORS = ['#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7']

// ── Sample fallback data (shown until the user imports their own) ───────────
const SAMPLE_WEEKLY_ARTISTS = [
  { name: 'Taylor Swift',   streams: 312, color: '#FF6B6B' },
  { name: 'Kendrick Lamar', streams: 284, color: '#4ECDC4' },
  { name: 'Drake',          streams: 251, color: '#45B7D1' },
  { name: 'SZA',            streams: 198, color: '#96CEB4' },
  { name: 'Bad Bunny',      streams: 174, color: '#FFEAA7' },
]

const SAMPLE_LAST_SONG = {
  title: 'Anti-Hero',
  artist: 'Taylor Swift · Midnights',
  artBg: 'linear-gradient(135deg, #1a0a2e 0%, #16213e 50%, #0f3460 100%)',
  artEmoji: '🌙',
  progress: 68,
  elapsed: '2:14',
  duration: '3:20',
}

const DEFAULT_COMMENT =
  "You've been on a real indie streak today — The Weeknd has come up three times " +
  'already, and your session is running longer than usual. Looks like a good music day.'

function greetingFor(hour) {
  if (hour < 12) return 'Good morning'
  if (hour < 17) return 'Good afternoon'
  return 'Good evening'
}

function weeklyArtistsFrom(data) {
  const wa = data?.meta?.weeklyArtists
  if (wa?.length) {
    return wa.slice(0, 5).map((a, i) => ({ name: a.name, streams: a.plays, color: WEEKLY_COLORS[i] }))
  }
  return SAMPLE_WEEKLY_ARTISTS
}

function lastSongFrom(data) {
  const lp = data?.meta?.lastPlayed
  if (lp) {
    const date = new Date(lp.ts)
    return {
      title: lp.title,
      artist: `${lp.artist} · ${lp.album}`,
      artBg: 'linear-gradient(135deg, #0d1a0f 0%, #1a2e14 50%, #0d2010 100%)',
      artEmoji: '🎵',
      progress: 100,
      elapsed: `${date.getMonth() + 1}/${date.getDate()}/${date.getFullYear()}`,
      duration: lp.ts.slice(0, 10),
    }
  }
  return SAMPLE_LAST_SONG
}

function commentFrom(data) {
  const wa = data?.meta?.weeklyArtists
  if (wa?.length) {
    const top = wa[0]
    return `${top.name} has been on heavy rotation this week with ${top.plays} plays. ` +
      `Across all your history you've logged ${data.meta.totalPlays.toLocaleString()} streams — here's how this week stacks up.`
  }
  return DEFAULT_COMMENT
}

/**
 * Home / landing page. Implements the Claude Design `Home.dc.html`:
 * a greeting, the last-played card, and a "Top Artists This Week" bar chart
 * that links through to the full rankings view.
 */
export function Home() {
  const [data, setData] = useState(null)
  const [hydrated, setHydrated] = useState(false)
  const [loading, setLoading] = useState(false)
  const [loadError, setLoadError] = useState(null)
  const fileInputRef = useRef(null)

  // Restore a previously imported dataset on mount.
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY)
      if (stored) setData(JSON.parse(stored))
    } catch { /* ignore corrupt cache */ }
    setHydrated(true)
  }, [])

  async function handleFileLoad(e) {
    const files = Array.from(e.target.files || []).filter((f) => f.name.toLowerCase().endsWith('.json'))
    if (!files.length) return
    setLoading(true)
    setLoadError(null)
    try {
      const datasets = await Promise.all(files.map((f) => f.text().then((t) => JSON.parse(t))))
      const records = datasets.flatMap((d) => (Array.isArray(d) ? d : []))
      const processed = processSpotifyHistory(records)
      try { localStorage.setItem(STORAGE_KEY, JSON.stringify(processed)) } catch { /* quota */ }
      setData(processed)
      setLoading(false)
    } catch (err) {
      setLoading(false)
      setLoadError(err.message || 'Could not read those files.')
    } finally {
      e.target.value = '' // allow re-selecting the same files
    }
  }

  const hasRealData = !!data
  const greeting = greetingFor(new Date().getHours())
  const userName = 'Alex'
  const totalPlays = data ? data.meta.totalPlays.toLocaleString() : '—'
  const weeklyArtists = weeklyArtistsFrom(data)
  const lastSong = lastSongFrom(data)
  const listenComment = hydrated ? commentFrom(data) : DEFAULT_COMMENT
  const loadBtnLabel = loading ? 'Processing…' : hasRealData ? '↺ Reload data' : '＋ Load your data'

  return (
    <div className="home">
      {/* Header nav */}
      <header className="home-header">
        <div className="home-brand">
          <span className="home-brand-mark">▶</span>
          <span className="home-brand-name">Spotify Visualizer</span>
        </div>
        <div className="home-header-right">
          {hasRealData && (
            <div className="home-data-badge">✓ Your data · {totalPlays} plays</div>
          )}
          <label className="home-load-btn">
            {loadBtnLabel}
            <input
              ref={fileInputRef}
              type="file"
              accept=".json,application/json"
              multiple
              style={{ display: 'none' }}
              onChange={handleFileLoad}
            />
          </label>
          <Link href="/rankings" className="home-rankings-link">Rankings chart →</Link>
        </div>
      </header>

      {loadError && <div className="home-load-error">⚠ {loadError}</div>}

      {/* Top section: greeting + last played */}
      <div className="home-top">
        <div className="home-greeting">
          <div className="home-greeting-eyebrow">{greeting}</div>
          <h1 className="home-greeting-title">
            Hello, <span className="accent">{userName}</span>
          </h1>
          <p className="home-greeting-comment">{listenComment}</p>
        </div>

        {/* Last played card */}
        <div className="home-lastcard">
          <div className="home-lastcard-art" style={{ background: lastSong.artBg }}>
            <span className="home-lastcard-emoji">{lastSong.artEmoji}</span>
            <div className="home-lastcard-play">
              <span>▶</span>
            </div>
          </div>
          <div className="home-lastcard-info">
            <div className="home-lastcard-label">Last Played</div>
            <div className="home-lastcard-title">{lastSong.title}</div>
            <div className="home-lastcard-artist">{lastSong.artist}</div>
            <div className="home-lastcard-track">
              <div className="home-lastcard-fill" style={{ width: `${lastSong.progress}%` }} />
            </div>
            <div className="home-lastcard-times">
              <span>{lastSong.elapsed}</span>
              <span>{lastSong.duration}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Bar chart card (clickable → rankings) */}
      <Link href="/rankings" className="home-chart-link">
        <div className="home-chart-card bar-card">
          <div className="home-chart-head">
            <span className="home-chart-title">Top Artists This Week</span>
            <span className="home-chart-sub">by streams — click to explore rankings</span>
          </div>
          <div className="home-chart-body">
            <WeeklyBarChart artists={weeklyArtists} />
          </div>
        </div>
      </Link>
    </div>
  )
}
