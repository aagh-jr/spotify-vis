'use client'

import { Suspense } from 'react'
import { DetailView } from '../../src/components/DetailView.jsx'

export default function DetailPage() {
  return (
    <Suspense fallback={<div className="app-loading"><div className="loading-spinner" /></div>}>
      <DetailView />
    </Suspense>
  )
}
