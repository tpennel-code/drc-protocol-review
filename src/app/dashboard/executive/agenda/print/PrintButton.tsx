'use client'

export default function PrintButton({ title }: { title: string }) {
  const handlePrint = () => {
    const agenda = document.querySelector('.agenda-page') as HTMLElement | null
    if (!agenda) return

    const clone = agenda.cloneNode(true) as HTMLElement
    Array.from(agenda.querySelectorAll('img')).forEach((img, i) => {
      (clone.querySelectorAll('img')[i] as HTMLImageElement)
        ?.setAttribute('src', (img as HTMLImageElement).src)
    })

    // Inject page number footer into cloned content
    const pageNumDiv = document.createElement('div')
    pageNumDiv.className = 'print-page-number'
    pageNumDiv.innerHTML = '<span class="cur-page"></span> of <span id="total-pages"></span>'
    clone.appendChild(pageNumDiv)

    const styleLinks = Array.from(document.querySelectorAll('link[rel="stylesheet"]'))
      .map(el => `<link rel="stylesheet" href="${(el as HTMLLinkElement).href}">`)
      .join('\n')

    const html = `<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<title>${title}</title>
${styleLinks}
<style>
  @page { size: A4 portrait; margin: 0; }
  html, body { margin: 0 !important; padding: 0 !important; background: white !important; width: 210mm !important; }
  .agenda-page {
    width: 210mm !important;
    min-height: 297mm !important;
    padding: 15mm 15mm 20mm !important;
    box-sizing: border-box !important;
    background: white !important;
    border: none !important;
    border-radius: 0 !important;
    box-shadow: none !important;
    margin: 0 !important;
    max-width: none !important;
    -webkit-box-decoration-break: clone !important;
    box-decoration-break: clone !important;
  }
  .print-page-number {
    position: fixed;
    bottom: 8mm;
    left: 0;
    right: 0;
    text-align: center;
    font-size: 9pt;
    color: #555;
    font-family: sans-serif;
  }
  .cur-page::after { content: counter(page); }
</style>
</head>
<body>${clone.outerHTML}</body>
</html>`

    const blob = new Blob([html], { type: 'text/html' })
    const blobUrl = URL.createObjectURL(blob)
    const win = window.open(blobUrl, '_blank')
    if (!win) return

    win.onload = () => {
      // Estimate total pages from body scroll height vs A4 at 96dpi
      const A4_HEIGHT_PX = 297 * (96 / 25.4)
      const totalPages = Math.ceil(win.document.body.scrollHeight / A4_HEIGHT_PX)
      const totalEl = win.document.getElementById('total-pages')
      if (totalEl) totalEl.textContent = String(totalPages)

      win.focus()
      win.print()
      URL.revokeObjectURL(blobUrl)
    }
    win.onafterprint = () => win.close()
  }

  return (
    <button
      onClick={handlePrint}
      className="bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium px-5 py-2 rounded-lg transition"
    >
      Download / Print PDF
    </button>
  )
}
