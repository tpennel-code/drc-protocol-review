import SubmitForm from './SubmitForm'

export const metadata = {
  title: 'Submit Protocol — DRC',
}

export default function SubmitPage() {
  return (
    <div className="min-h-screen bg-gray-50 py-10 px-4">
      <div className="max-w-2xl mx-auto">
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
