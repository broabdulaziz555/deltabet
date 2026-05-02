import React, { useEffect, useRef, useState } from 'react'
import * as pdfjs from 'pdfjs-dist'
import type { PDFDocumentProxy, PDFPageProxy } from 'pdfjs-dist'

// Vite resolves this to the bundled worker asset URL
pdfjs.GlobalWorkerOptions.workerSrc = new URL(
  'pdfjs-dist/build/pdf.worker.min.mjs',
  import.meta.url,
).toString()

const PDFViewer: React.FC<{ base64: string }> = ({ base64 }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const pdfRef   = useRef<PDFDocumentProxy | null>(null)
  const [pageNum,  setPageNum]  = useState(1)
  const [numPages, setNumPages] = useState(0)
  const [loading,  setLoading]  = useState(true)
  const [error,    setError]    = useState('')

  // Load PDF document from base64
  useEffect(() => {
    if (!base64) return
    setLoading(true)
    setError('')
    setPageNum(1)

    const raw = base64.includes(',') ? base64.split(',')[1] : base64
    let bytes: Uint8Array
    try {
      const binary = atob(raw)
      bytes = new Uint8Array(binary.length)
      for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i)
    } catch {
      setError('Invalid PDF data')
      setLoading(false)
      return
    }

    pdfjs.getDocument({ data: bytes }).promise
      .then((doc: PDFDocumentProxy) => {
        pdfRef.current = doc
        setNumPages(doc.numPages)
        setLoading(false)
      })
      .catch(() => {
        setError('Failed to load PDF')
        setLoading(false)
      })

    return () => { pdfRef.current?.destroy() }
  }, [base64])

  // Render current page to canvas
  useEffect(() => {
    const doc = pdfRef.current
    if (!doc || !canvasRef.current || loading) return

    doc.getPage(pageNum).then((page: PDFPageProxy) => {
      const canvas  = canvasRef.current!
      const ctx     = canvas.getContext('2d')!
      const vp      = page.getViewport({ scale: 1.5 })
      canvas.height = vp.height
      canvas.width  = vp.width
      page.render({ canvasContext: ctx, viewport: vp })
    })
  }, [pageNum, numPages, loading])

  if (loading) {
    return (
      <div className="flex items-center justify-center h-32 text-db-text2 text-sm">
        Loading PDF…
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-24 text-db-red text-sm">
        {error}
      </div>
    )
  }

  return (
    <div className="flex flex-col items-center gap-3">
      <div className="w-full overflow-auto rounded-xl bg-white/5 max-h-96">
        <canvas ref={canvasRef} className="w-full" />
      </div>
      {numPages > 1 && (
        <div className="flex items-center gap-4 text-sm text-db-text2">
          <button
            onClick={() => setPageNum(p => Math.max(1, p - 1))}
            disabled={pageNum <= 1}
            className="px-3 py-1 rounded-lg bg-db-elevated disabled:opacity-30 hover:text-white transition-colors text-xs"
          >
            ← Prev
          </button>
          <span className="mono text-xs">Page {pageNum} of {numPages}</span>
          <button
            onClick={() => setPageNum(p => Math.min(numPages, p + 1))}
            disabled={pageNum >= numPages}
            className="px-3 py-1 rounded-lg bg-db-elevated disabled:opacity-30 hover:text-white transition-colors text-xs"
          >
            Next →
          </button>
        </div>
      )}
    </div>
  )
}

export default PDFViewer
