'use client'

import { useRef, useState, useEffect } from 'react'
import { processSpotifyHistory } from '../utils/processSpotify.js'
import './ImportScreen.css'

/**
 * Landing / import screen. Lets the user pick their Spotify "Extended
 * Streaming History" folder (or individual .json files) and processes it
 * entirely in the browser. On success, calls onData(processedDataset).
 */
export function ImportScreen({ onData }) {
  const folderInputRef = useRef(null)
  const fileInputRef   = useRef(null)
  const [status, setStatus] = useState('idle') // idle | processing | error
  const [error, setError]   = useState(null)
  const [dragging, setDragging] = useState(false)

  // webkitdirectory isn't a standard React prop — set it on the DOM node.
  useEffect(() => {
    if (folderInputRef.current) {
      folderInputRef.current.setAttribute('webkitdirectory', '')
      folderInputRef.current.setAttribute('directory', '')
    }
  }, [])

  async function ingest(fileList) {
    const files = Array.from(fileList).filter((f) => f.name.toLowerCase().endsWith('.json'))
    if (!files.length) {
      setStatus('error')
      setError('No .json files found. Select your Spotify "Extended Streaming History" folder or its JSON files.')
      return
    }
    setStatus('processing')
    setError(null)
    try {
      const datasets = await Promise.all(files.map((f) => f.text().then((t) => JSON.parse(t))))
      // Keep only array-shaped files (streaming history), flatten into one list.
      const records = datasets.flatMap((d) => (Array.isArray(d) ? d : []))
      const processed = processSpotifyHistory(records)
      onData(processed)
    } catch (err) {
      setStatus('error')
      setError(err.message || 'Could not read those files.')
    }
  }

  function onDrop(e) {
    e.preventDefault()
    setDragging(false)
    const items = e.dataTransfer?.files
    if (items?.length) ingest(items)
  }

  const processing = status === 'processing'

  return (
    <div className="import-screen">
      <div
        className={`import-card${dragging ? ' is-dragging' : ''}`}
        onDragOver={(e) => { e.preventDefault(); setDragging(true) }}
        onDragLeave={() => setDragging(false)}
        onDrop={onDrop}
      >
        <div className="import-logo">
          <span className="logo-mark">▶</span>
          <span className="logo-text">Spotify Visualizer</span>
        </div>

        <h1 className="import-title">Import your listening history</h1>
        <p className="import-sub">
          Select the <strong>Spotify&nbsp;Extended&nbsp;Streaming&nbsp;History</strong> folder you
          downloaded from Spotify (or its <code>.json</code> files). Everything is processed locally
          in your browser — nothing is uploaded.
        </p>

        <div className="import-drop">
          <div className="import-drop-icon">📂</div>
          <div className="import-drop-text">
            {dragging ? 'Drop your files here' : 'Drag your folder or .json files here'}
          </div>
        </div>

        <div className="import-actions">
          <button
            className="import-btn import-btn-primary"
            disabled={processing}
            onClick={() => folderInputRef.current?.click()}
          >
            {processing ? 'Processing…' : '📁 Open folder'}
          </button>
          <button
            className="import-btn import-btn-ghost"
            disabled={processing}
            onClick={() => fileInputRef.current?.click()}
          >
            Choose files
          </button>
        </div>

        {status === 'error' && <p className="import-error">⚠ {error}</p>}

        <p className="import-hint">
          Get yours at <span>Spotify → Privacy Settings → Download your data → Extended streaming history</span>
        </p>

        {/* Hidden inputs */}
        <input
          ref={folderInputRef}
          type="file"
          multiple
          style={{ display: 'none' }}
          onChange={(e) => e.target.files?.length && ingest(e.target.files)}
        />
        <input
          ref={fileInputRef}
          type="file"
          accept=".json,application/json"
          multiple
          style={{ display: 'none' }}
          onChange={(e) => e.target.files?.length && ingest(e.target.files)}
        />
      </div>
    </div>
  )
}
