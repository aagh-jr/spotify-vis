"""
Processes Spotify Extended Streaming History JSON files into a single
structured JSON file for the visualizer app.
"""
import json, os, glob
from collections import defaultdict

DATA_DIR = '/Users/abelgonzalez/Desktop/Spotify Extended Streaming History'
OUTPUT = '/Users/abelgonzalez/Desktop/spotify-visualizer/public/data.json'
TOP_N = 50  # Store top 50 per period so we have room to find ranks

files = sorted(glob.glob(os.path.join(DATA_DIR, 'Streaming_History_Audio_*.json')))

print(f"Loading {len(files)} files...")
all_records = []
for f in files:
    with open(f) as fh:
        all_records.extend(json.load(fh))

# Filter: only songs (not podcasts), played more than 30 seconds
songs = [r for r in all_records
         if r.get('master_metadata_track_name')
         and r.get('ms_played', 0) > 30000
         and not r.get('episode_name')]

print(f"Filtered to {len(songs)} song plays (>30s, no podcasts)")

# ── Aggregation helpers ─────────────────────────────────────────────────────

def rank_artists(counter):
    return [{"name": k, "plays": v}
            for k, v in sorted(counter.items(), key=lambda x: -x[1])[:TOP_N]]

def rank_albums(counter):
    return [{"name": k[0], "artist": k[1], "plays": v}
            for k, v in sorted(counter.items(), key=lambda x: -x[1])[:TOP_N]]

def rank_songs(counter):
    return [{"name": k[0], "artist": k[1], "plays": v}
            for k, v in sorted(counter.items(), key=lambda x: -x[1])[:TOP_N]]

# ── All-time ────────────────────────────────────────────────────────────────

artist_all = defaultdict(int)
album_all  = defaultdict(int)
song_all   = defaultdict(int)

for r in songs:
    artist = r['master_metadata_album_artist_name']
    album  = r['master_metadata_album_album_name']
    track  = r['master_metadata_track_name']
    artist_all[artist]         += 1
    album_all[(album, artist)] += 1
    song_all[(track, artist)]  += 1

# ── Per-year ────────────────────────────────────────────────────────────────

yearly = defaultdict(lambda: {
    "artists": defaultdict(int),
    "albums":  defaultdict(int),
    "songs":   defaultdict(int),
})

for r in songs:
    year   = r['ts'][:4]
    artist = r['master_metadata_album_artist_name']
    album  = r['master_metadata_album_album_name']
    track  = r['master_metadata_track_name']
    yearly[year]["artists"][artist]         += 1
    yearly[year]["albums"][(album, artist)] += 1
    yearly[year]["songs"][(track, artist)]  += 1

# ── Per-month ───────────────────────────────────────────────────────────────

monthly = defaultdict(lambda: {
    "artists": defaultdict(int),
    "albums":  defaultdict(int),
    "songs":   defaultdict(int),
})

for r in songs:
    month  = r['ts'][:7]   # "2017-01"
    artist = r['master_metadata_album_artist_name']
    album  = r['master_metadata_album_album_name']
    track  = r['master_metadata_track_name']
    monthly[month]["artists"][artist]         += 1
    monthly[month]["albums"][(album, artist)] += 1
    monthly[month]["songs"][(track, artist)]  += 1

# ── Build output ────────────────────────────────────────────────────────────

result = {
    "allTime": {
        "artists": rank_artists(artist_all),
        "albums":  rank_albums(album_all),
        "songs":   rank_songs(song_all),
    },
    "yearly": {
        year: {
            "artists": rank_artists(data["artists"]),
            "albums":  rank_albums(data["albums"]),
            "songs":   rank_songs(data["songs"]),
        }
        for year, data in sorted(yearly.items())
    },
    "monthly": {
        month: {
            "artists": rank_artists(data["artists"]),
            "albums":  rank_albums(data["albums"]),
            "songs":   rank_songs(data["songs"]),
        }
        for month, data in sorted(monthly.items())
    },
    "meta": {
        "totalPlays": len(songs),
        "years": sorted(yearly.keys()),
        "months": sorted(monthly.keys()),
    }
}

with open(OUTPUT, 'w') as f:
    json.dump(result, f, separators=(',', ':'))  # compact JSON

size_kb = os.path.getsize(OUTPUT) / 1024
print(f"\nDone! Wrote to {OUTPUT}")
print(f"Years: {sorted(yearly.keys())}")
print(f"Months: {len(monthly)} total")
print(f"File size: {size_kb:.0f} KB")
print(f"\nTop 5 all-time artists:")
for item in result['allTime']['artists'][:5]:
    print(f"  {item['plays']:5d}  {item['name']}")
