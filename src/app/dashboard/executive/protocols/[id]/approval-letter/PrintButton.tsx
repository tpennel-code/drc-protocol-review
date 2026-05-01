'use client'

export default function PrintButton() {
  const handlePrint = () => {
    const letter = document.querySelector('.letter-page') as HTMLElement | null
    if (!letter) return

    // Clone and resolve all image src to absolute URLs
    const clone = letter.cloneNode(true) as HTMLElement
    Array.from(letter.querySelectorAll('img')).forEach((img, i) => {
      (clone.querySelectorAll('img')[i] as HTMLImageElement)
        ?.setAttribute('src', (img as HTMLImageElement).src)
    })

    const pdfTitle = letter.dataset.pdfTitle ?? 'Approval Letter'

    const styleLinks = Array.from(document.querySelectorAll('link[rel="stylesheet"]'))
      .map(el => `<link rel="stylesheet" href="${(el as HTMLLinkElement).href}">`)
      .join('\n')

    const html = `<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<title>${pdfTitle}</title>
${styleLinks}
<style>
  @page { size: A4 portrait; margin: 0; }
  html, body {
    margin: 0 !important;
    padding: 0 !important;
    background: white !important;
    width: 210mm !important;
  }
  .letter-page {
    display: flex !important;
    flex-direction: column !important;
    box-sizing: border-box !important;
    width: 210mm !important;
    padding: 10mm 15mm !important;
    background: white !important;
    border: none !important;
    border-radius: 0 !important;
    box-shadow: none !important;
    margin: 0 !important;
    max-width: none !important;
  }
  .letter-header {
    padding: 0 0 10px 0 !important;
  }
  .letter-header > div:first-child,
  .letter-header > div:last-child { width: 72px !important; height: 72px !important; }
  .letter-header img { max-height: 70px !important; max-width: 70px !important; }
  .letter-body {
    padding: 24px 0 0 !important;
  }
  .letter-body .mb-8 { margin-bottom: 20px !important; }
  .letter-body .mb-6 { margin-bottom: 18px !important; }
  .letter-body .mb-4 { margin-bottom: 14px !important; }
  .letter-body .mb-10 { margin-bottom: 22px !important; }
  .letter-body .leading-7 { line-height: 1.6 !important; }
  .letter-body .leading-6 { line-height: 1.5 !important; }
  .letter-body .leading-5 { line-height: 1.4 !important; }
  .letter-body .space-y-5 > * + * { margin-top: 12px !important; }
  .letter-body img { height: 70px !important; margin-bottom: 4px !important; }
  .letter-footer {
    padding: 6px 0 !important;
    margin-top: 25mm !important;
  }
</style>
</head>
<body>${clone.outerHTML}</body>
</html>`

    const blob = new Blob([html], { type: 'text/html' })
    const blobUrl = URL.createObjectURL(blob)
    const win = window.open(blobUrl, '_blank')
    if (!win) return

    win.onload = () => {
      win.focus()
      win.print()
      URL.revokeObjectURL(blobUrl)
    }
    win.onafterprint = () => win.close()
  }

  return (
    <button
      onClick={handlePrint}
      className="print:hidden inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-medium px-6 py-2.5 rounded-lg text-sm transition"
    >
      <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
      </svg>
      Save / Print PDF
    </button>
  )
}
