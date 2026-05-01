'use client'

export default function PrintButton() {
  const handlePrint = () => {
    const letter = document.querySelector('.letter-page') as HTMLElement | null
    if (!letter) { window.print(); return }

    const parent = letter.parentElement!
    const next = letter.nextSibling

    document.body.appendChild(letter)

    const restore = () => {
      if (next) {
        parent.insertBefore(letter, next)
      } else {
        parent.appendChild(letter)
      }
      window.removeEventListener('afterprint', restore)
    }

    window.addEventListener('afterprint', restore)
    window.print()
  }

  return (
    <button
      onClick={handlePrint}
      className="print:hidden bg-blue-600 hover:bg-blue-700 text-white font-medium px-6 py-2.5 rounded-lg text-sm transition"
    >
      Save / Print PDF
    </button>
  )
}
