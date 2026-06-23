/**
 * processSpotify.js
 * Converts raw Spotify "Extended Streaming History" JSON arrays into the
 * internal data format consumed by the visualizer (see utils/chartData.js).
 *
 * Ported from the Claude Design `dataProcessor.js` for the Spotify-vis project.
 *
 * Raw record fields used:
 *   ts                                 — ISO timestamp
 *   ms_played                          — milliseconds played
 *   master_metadata_track_name         — song title
 *   master_metadata_album_artist_name  — artist
 *   master_metadata_album_album_name   — album
 *   platform                           — device/platform string
 */

function simplifyPlatform(raw) {
  const p = (raw || '').toLowerCase()
  if (p.includes('ios') || p.includes('iphone') || p.includes('ipad')) return 'iOS'
  if (p.includes('android')) return 'Android'
  if (p.includes('web') || p.includes('websocket') || p.includes('webplayer')) return 'Web Player'
  if (p.includes('windows') || p.includes('osx') || p.includes('macos') || p.includes('desktop')) return 'Desktop'
  if (p.includes('cast') || p.includes('tv') || p.includes('chromecast')) return 'TV / Cast'
  if (p.includes('ps') || p.includes('xbox') || p.includes('game')) return 'Console'
  return 'Other'
}

function topEntities(plays, keyFn, n, artistFn) {
  const map = new Map()
  for (const r of plays) {
    const key = keyFn(r)
    if (!key) continue
    if (!map.has(key)) map.set(key, { name: key, plays: 0, artist: artistFn ? artistFn(r) : null })
    map.get(key).plays++
  }
  return [...map.values()].sort((a, b) => b.plays - a.plays).slice(0, n)
}

/**
 * @param {Array} records  raw streaming-history records (single array or array-of-arrays)
 * @returns processed dataset: { meta, allTime, yearly, monthly, platforms, yearlyStreams }
 */
export function processSpotifyHistory(records) {
  // Accept single array or array-of-arrays (multiple files merged)
  const raw = Array.isArray(records[0]) ? records.flat() : records

  // Filter: must have a track name and played > 10 seconds
  const plays = raw.filter((r) => r.master_metadata_track_name && r.ms_played > 10000)

  if (!plays.length) {
    throw new Error('No valid plays found. Make sure you selected your Spotify Extended Streaming History files.')
  }

  const years  = [...new Set(plays.map((r) => r.ts.slice(0, 4)))].sort()
  const months = [...new Set(plays.map((r) => r.ts.slice(0, 7)))].sort()

  // ── All-time aggregates ──────────────────────────────────────────────
  const allTime = {
    artists: topEntities(plays, (r) => r.master_metadata_album_artist_name, 10),
    albums:  topEntities(plays, (r) => r.master_metadata_album_album_name,  10, (r) => r.master_metadata_album_artist_name),
    songs:   topEntities(plays, (r) => r.master_metadata_track_name,        10, (r) => r.master_metadata_album_artist_name),
  }

  // ── Yearly aggregates ────────────────────────────────────────────────
  const yearly = {}
  for (const year of years) {
    const yp = plays.filter((r) => r.ts.startsWith(year))
    yearly[year] = {
      artists: topEntities(yp, (r) => r.master_metadata_album_artist_name, 10),
      albums:  topEntities(yp, (r) => r.master_metadata_album_album_name,  10, (r) => r.master_metadata_album_artist_name),
      songs:   topEntities(yp, (r) => r.master_metadata_track_name,        10, (r) => r.master_metadata_album_artist_name),
    }
  }

  // ── Monthly aggregates ───────────────────────────────────────────────
  const monthly = {}
  for (const month of months) {
    const mp = plays.filter((r) => r.ts.startsWith(month))
    monthly[month] = {
      artists: topEntities(mp, (r) => r.master_metadata_album_artist_name, 10),
      albums:  topEntities(mp, (r) => r.master_metadata_album_album_name,  10, (r) => r.master_metadata_album_artist_name),
      songs:   topEntities(mp, (r) => r.master_metadata_track_name,        10, (r) => r.master_metadata_album_artist_name),
    }
  }

  // ── Platforms ────────────────────────────────────────────────────────
  const platMap = new Map()
  for (const r of plays) {
    const p = simplifyPlatform(r.platform)
    platMap.set(p, (platMap.get(p) || 0) + 1)
  }
  const PLATFORM_COLORS = ['#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7', '#DDA0DD', '#74B9FF']
  const platforms = [...platMap.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 7)
    .map(([name, streams], i) => ({ name, streams, color: PLATFORM_COLORS[i] }))

  // ── Yearly stream counts ─────────────────────────────────────────────
  const yearlyStreams = years.map((year) => ({
    year,
    streams: plays.filter((r) => r.ts.startsWith(year)).length,
  }))

  // ── Last played ──────────────────────────────────────────────────────
  const latestPlay = [...plays].sort((a, b) => b.ts.localeCompare(a.ts))[0]
  const lastPlayed = latestPlay
    ? {
        title:  latestPlay.master_metadata_track_name,
        artist: latestPlay.master_metadata_album_artist_name,
        album:  latestPlay.master_metadata_album_album_name,
        ts:     latestPlay.ts,
      }
    : null

  // ── Weekly top artists (last 7 days from latest play) ────────────────
  const cutoff = lastPlayed
    ? new Date(new Date(lastPlayed.ts).getTime() - 7 * 86400000).toISOString()
    : ''
  const weeklyArtists = topEntities(
    plays.filter((r) => r.ts >= cutoff),
    (r) => r.master_metadata_album_artist_name,
    5
  )

  return {
    meta: { totalPlays: plays.length, years, months, lastPlayed, weeklyArtists },
    allTime,
    yearly,
    monthly,
    platforms,
    yearlyStreams,
  }
}
