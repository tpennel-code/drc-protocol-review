import SubmitForm from './SubmitForm'

export const metadata = {
  title: 'Submit Protocol — DRC',
}

export default function SubmitPage() {
  return (
    <div className="relative min-h-screen bg-gray-50 py-10 px-4 overflow-hidden">

      {/* Watermark */}
      <img
        src="/uct-logo-large.png"
        alt=""
        aria-hidden="true"
        className="pointer-events-none select-none absolute w-[250vw] top-[-30vh] object-contain"
        style={{ opacity: 0.06, left: 'calc(-50vw + 300px)' }}
      />

      <div className="relative max-w-2xl mx-auto">
        <div className="mb-8 text-center">
          <h1 className="text-2xl font-bold text-gray-900">Protocol Submission</h1>
          <p className="text-sm text-gray-500 mt-1">
            Department of Surgery Research Committee · University of Cape Town
          </p>
        </div>
        <SubmitForm />
      </div>
    </div>
  )
}
