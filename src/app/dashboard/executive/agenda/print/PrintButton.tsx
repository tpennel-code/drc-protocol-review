export default function PrintButton({ date, apologyIds }: { date: string; apologyIds: string[] }) {
  const params = new URLSearchParams({ date })
  if (apologyIds.length > 0) params.set('apologies', apologyIds.join(','))

  return (
    <a
      href={`/api/agenda-pdf?${params.toString()}`}
      target="_blank"
      rel="noopener"
      className="bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium px-5 py-2 rounded-lg transition"
    >
      Download / Print PDF
    </a>
  )
}
