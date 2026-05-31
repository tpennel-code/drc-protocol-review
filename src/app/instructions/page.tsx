import Link from 'next/link'

export const metadata = {
  title: 'How to Use the Site — Surgical DRC',
}

/* ---- small presentational helpers ---- */

function Figure({ src, alt, caption }: { src: string; alt: string; caption: string }) {
  return (
    <figure className="my-6">
      <img
        src={src}
        alt={alt}
        className="w-full rounded-xl border border-gray-200 shadow-sm"
      />
      <figcaption className="mt-2 text-center text-sm text-gray-500">{caption}</figcaption>
    </figure>
  )
}

function Step({ n, title, children }: { n: number; title: string; children: React.ReactNode }) {
  return (
    <li className="relative pl-12 py-4 border-t border-gray-100 first:border-t-0">
      <span className="absolute left-0 top-4 flex h-8 w-8 items-center justify-center rounded-full bg-blue-600 text-sm font-bold text-white">
        {n}
      </span>
      <span className="block font-semibold text-gray-900">{title}</span>
      <div className="mt-1 text-sm text-gray-600">{children}</div>
    </li>
  )
}

function Callout({ tone, children }: { tone: 'tip' | 'warn' | 'ok'; children: React.ReactNode }) {
  const styles = {
    tip: 'bg-blue-50 border-blue-200 text-blue-900',
    warn: 'bg-amber-50 border-amber-200 text-amber-800',
    ok: 'bg-green-50 border-green-200 text-green-800',
  }[tone]
  return <div className={`my-5 rounded-lg border px-4 py-3 text-sm ${styles}`}>{children}</div>
}

function RoleTag({ kind }: { kind: 'rev' | 'exec' }) {
  const map = {
    rev: { c: 'bg-blue-100 text-blue-800', t: 'For Reviewers' },
    exec: { c: 'bg-purple-100 text-purple-800', t: 'For Executives & Chair' },
  }[kind]
  return (
    <span className={`inline-block rounded-full px-3 py-1 text-xs font-bold uppercase tracking-wide ${map.c}`}>
      {map.t}
    </span>
  )
}

export default function InstructionsPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-blue-700 px-6 py-8 text-white">
        <div className="mx-auto max-w-3xl">
          <h1 className="text-2xl font-bold">Surgical DRC — How to Use the Site</h1>
          <p className="mt-1 text-sm text-blue-100">
            A step-by-step guide for Reviewers and Committee Executives
          </p>
        </div>
      </header>

      <main className="mx-auto max-w-3xl bg-white px-6 py-10 shadow-sm sm:px-10">
        <p className="text-gray-700">
          This guide shows you everything you need to do on the Surgical DRC site: how to log in,
          review the protocols assigned to you, and (for executives) manage protocols and meetings.
          Each step has a picture with the buttons circled, so you can follow it the first time.
        </p>

        <div className="my-6 rounded-lg border border-gray-200 bg-gray-50 px-5 py-4 text-sm">
          <strong>Need help at any point?</strong>
          <br />
          📧 <a className="text-blue-600 hover:underline" href="mailto:tim.pennel@uct.ac.za">tim.pennel@uct.ac.za</a>
          {' '}·{' '}💬 WhatsApp <strong>083 233 5518</strong>
          {' '}·{' '}🌐 <a className="text-blue-600 hover:underline" href="https://surgicaldrc.co.za">surgicaldrc.co.za</a>
        </div>

        {/* Contents */}
        <nav className="my-8 rounded-xl border border-gray-200 bg-gray-50 p-5">
          <h2 className="mb-2 text-base font-bold text-blue-700">What&apos;s in this guide</h2>
          <ol className="list-decimal space-y-1 pl-5 text-sm text-blue-700">
            <li><a className="hover:underline" href="#start">Getting started — logging in</a></li>
            <li><a className="hover:underline" href="#reviewers">For Reviewers — reviewing your protocols</a></li>
            <li><a className="hover:underline" href="#execs">For Executives &amp; the Chair</a></li>
            <li><a className="hover:underline" href="#profile">Updating your details &amp; password</a></li>
            <li><a className="hover:underline" href="#email">About the emails you&apos;ll receive</a></li>
            <li><a className="hover:underline" href="#faq">Common questions &amp; troubleshooting</a></li>
          </ol>
        </nav>

        {/* 1. GETTING STARTED */}
        <h2 id="start" className="mt-12 border-b-2 border-gray-100 pb-2 text-xl font-bold text-blue-700">
          1. Getting started — logging in
        </h2>
        <p className="mt-3 text-gray-700">
          Everyone logs in the same way. You only do the first-time steps once; after that, signing in
          takes seconds.
        </p>

        <Figure src="/instructions/step1-login.png" alt="The login screen" caption="The login screen at surgicaldrc.co.za" />

        <ol className="my-4">
          <Step n={1} title="Open the site & choose your name">
            Go to <a className="text-blue-600 hover:underline" href="https://surgicaldrc.co.za/login">surgicaldrc.co.za/login</a> and
            pick your name from the <strong>Name</strong>{' '}dropdown. You don&apos;t create an account — your name is
            already in the system.
          </Step>
          <Step n={2} title="Enter your password">
            Your starting password is your <strong>surname with a capital first letter, then 123</strong>.
            For example, Tim <strong>Pennel</strong> → <code className="rounded bg-gray-100 px-1.5 py-0.5">Pennel123</code>.
          </Step>
          <Step n={3} title="Set your own password (first time only)">
            The very first time you sign in, the site asks you to choose a new, private password before you
            can continue. Pick something only you know.
          </Step>
        </ol>

        <Callout tone="tip">
          💡 <strong>Let your browser save the password</strong> when it offers — next time it fills in
          automatically. You&apos;ll still pick your name from the dropdown.
        </Callout>
        <Callout tone="warn">
          🔑 <strong>Forgotten your password?</strong> Select your name, then click{' '}
          <strong>&quot;Forgot password?&quot;</strong>{' '}— a reset link is emailed to the address we have on
          record for you. (If it doesn&apos;t arrive, check your spam/junk folder — see section 5.)
        </Callout>

        {/* 2. REVIEWERS */}
        <h2 id="reviewers" className="mt-12 border-b-2 border-gray-100 pb-2 text-xl font-bold text-blue-700">
          2. Reviewing your protocols
        </h2>
        <div className="mt-3"><RoleTag kind="rev" /></div>
        <p className="mt-3 text-gray-700">
          When you sign in, you land on <strong>My Assigned Protocols</strong> — every protocol the
          committee has assigned to you. For each one, you either <strong>submit a review</strong> or{' '}
          <strong>decline</strong> it.
        </p>

        <Figure src="/instructions/step2-dashboard.png" alt="The reviewer dashboard" caption="Your dashboard: a summary at the top, then each protocol with a status" />

        <h3 className="mt-8 font-semibold text-gray-900">Understanding the status of each protocol</h3>
        <div className="mt-3 overflow-hidden rounded-lg border border-gray-200">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-left text-gray-600">
              <tr><th className="px-4 py-2">What you see</th><th className="px-4 py-2">What it means</th></tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              <tr><td className="px-4 py-2 font-medium">Awaiting your review</td><td className="px-4 py-2 text-gray-600">Still waiting for you to review it.</td></tr>
              <tr><td className="px-4 py-2 font-medium">Review submitted</td><td className="px-4 py-2 text-gray-600">You&apos;ve already submitted your review.</td></tr>
              <tr><td className="px-4 py-2 font-medium text-red-600">Declined</td><td className="px-4 py-2 text-gray-600">You declined; the Chair was notified.</td></tr>
            </tbody>
          </table>
        </div>

        <h3 className="mt-8 font-semibold text-gray-900">To review a protocol</h3>
        <ol className="my-4">
          <Step n={1} title="Open it">Click the protocol in your list to open its full details.</Step>
          <Step n={2} title="Read it & download the documents">
            Open the documents in the <strong>Submitted Documents</strong> section and read the protocol and
            data sheet before deciding.
          </Step>
        </ol>

        <Figure src="/instructions/step5-review.png" alt="The review form" caption="The review form: recommendation, comments, optional file, then Submit" />

        <ol className="my-4">
          <Step n={3} title="Choose your recommendation">
            Pick one from the dropdown: <em>Approved</em>, <em>Minor Amendment</em>,{' '}
            <em>Major Amendment</em>, or <em>Rejected</em>.
          </Step>
          <Step n={4} title="Add comments (and a file if needed)">
            Type your feedback — be specific, as it guides the applicant. You can also attach a marked-up
            file, but that&apos;s optional.
          </Step>
          <Step n={5} title="Submit">
            Click <strong>Submit Review</strong>. The protocol&apos;s status changes to show your recommendation.
          </Step>
        </ol>

        <Figure src="/instructions/step6-submitted.png" alt="A submitted review" caption="After submitting, you see “Review saved successfully” — you can still edit it later" />

        <Callout tone="ok">
          ✅ You can review protocols in any order and over several sittings. Only the ones marked
          <strong> Awaiting your review</strong> still need you.
        </Callout>

        <h3 className="mt-8 font-semibold text-gray-900">If you can&apos;t review a protocol — decline it</h3>
        <p className="mt-2 text-gray-700">
          If you have a conflict of interest or can&apos;t review in time, hand it back to the Chair.
        </p>

        <Figure src="/instructions/step3-decline.png" alt="The decline dialog" caption="Click “Decline to review”, optionally give a reason, then confirm" />

        <ol className="my-4">
          <Step n={1} title="Click “Decline to review” on the protocol">A dialog opens.</Step>
          <Step n={2} title="Give a brief reason (optional) and confirm">
            Click <strong>Decline &amp; notify Chair</strong>. The Chair is emailed automatically and reassigns
            it — you don&apos;t need to contact anyone.
          </Step>
        </ol>

        <Figure src="/instructions/step4-declined.png" alt="A declined protocol" caption="A declined protocol is clearly marked in your list" />

        {/* 3. EXECUTIVES */}
        <h2 id="execs" className="mt-12 border-b-2 border-gray-100 pb-2 text-xl font-bold text-blue-700">
          3. For Executives &amp; the Chair
        </h2>
        <div className="mt-3"><RoleTag kind="exec" /></div>
        <p className="mt-3 text-gray-700">
          Executives see everything. The top menu has <strong>Protocols</strong>, <strong>Reviewers</strong>,{' '}
          <strong>Stats</strong>, <strong>Agenda</strong>, and <strong>Import</strong> (the Chair/admin also
          sees <strong>Executives</strong>).
        </p>

        <Figure src="/instructions/step8-exec.png" alt="The executive dashboard" caption="The Executive Dashboard: every protocol, with assigned reviewers and outcomes" />

        <h3 className="mt-8 font-semibold text-gray-900">Managing a protocol</h3>
        <p className="mt-2 text-gray-700">Click any protocol to open it, then you can:</p>
        <ol className="my-4">
          <Step n={1} title="Assign reviewers">
            Choose Reviewer 1 and Reviewer 2. Newly-assigned reviewers are emailed automatically.
          </Step>
          <Step n={2} title="Set the meeting date">Assign it to a committee meeting date.</Step>
          <Step n={3} title="Record the outcome & generate the letter">
            Record the final outcome and generate the matching letter (Approval, Minor/Major Amendment, or
            Fast-Track).
          </Step>
          <Step n={4} title="Email the applicant">
            Click <strong>Send … Email to Applicant</strong> to send the outcome letter from the system.
          </Step>
        </ol>

        <h3 className="mt-8 font-semibold text-gray-900">The other menus</h3>
        <ul className="my-3 list-disc space-y-1 pl-5 text-sm text-gray-700">
          <li><strong>Send Review Reminders</strong> (on the dashboard) — nudges reviewers who haven&apos;t submitted.</li>
          <li><strong>Agenda</strong> — builds a meeting agenda and emails it (with the PDF attached) to applicants and reviewers.</li>
          <li><strong>Stats</strong> — totals, average response time, outcomes, protocols by year, and reviewer activity.</li>
          <li><strong>Import</strong> — drag &amp; drop old protocol-submission emails (.eml files) straight into the system.</li>
        </ul>

        <Figure src="/instructions/step9-stats.png" alt="The statistics page" caption="The Stats page gives an at-a-glance overview of the committee’s workload" />

        <Callout tone="tip">
          💡 Want a different statistic on the Stats page, or another column in the dashboard? Just ask — it can be added.
        </Callout>

        {/* 4. PROFILE */}
        <h2 id="profile" className="mt-12 border-b-2 border-gray-100 pb-2 text-xl font-bold text-blue-700">
          4. Updating your details &amp; password
        </h2>
        <p className="mt-3 text-gray-700">
          Click <strong>Profile</strong> (top right) any time to update your title, name, email, division,
          and portfolio — or to change your password.
        </p>

        <Figure src="/instructions/step7-profile.png" alt="The profile page" caption="Edit your details, or set a new password and click Save Changes" />

        <Callout tone="tip">
          💡 To change your password, fill in <strong>New Password</strong> and{' '}
          <strong>Confirm New Password</strong>, then save. Leave them blank to keep your current one.
        </Callout>

        {/* 5. EMAIL */}
        <h2 id="email" className="mt-12 border-b-2 border-gray-100 pb-2 text-xl font-bold text-blue-700">
          5. About the emails you&apos;ll receive
        </h2>
        <p className="mt-3 text-gray-700">
          The system emails you about submission confirmations, review reminders, reviewer assignments, and
          meeting agendas.
        </p>
        <Callout tone="tip">
          ✉️ Emails come from <strong>noreply@surgicaldrc.co.za</strong>. Even though it says
          &quot;no-reply,&quot; you can simply <strong>reply</strong> to any of them — your reply goes straight
          to the DRC Chair.
        </Callout>
        <Callout tone="warn">
          📁 <strong>Not seeing the emails?</strong> Because the address is new, Gmail and iCloud may put the
          first few messages in your <strong>spam / junk folder</strong>. Move them to your inbox and mark
          them <strong>&quot;Not spam&quot;</strong> — after once or twice, they&apos;ll arrive normally.
        </Callout>

        {/* 6. FAQ */}
        <h2 id="faq" className="mt-12 border-b-2 border-gray-100 pb-2 text-xl font-bold text-blue-700">
          6. Common questions &amp; troubleshooting
        </h2>

        <h3 className="mt-6 font-semibold text-gray-900">I can&apos;t log in.</h3>
        <p className="mt-1 text-sm text-gray-700">
          Check you&apos;ve selected the correct name and that your password is your surname with a capital
          first letter + 123 (e.g. <code className="rounded bg-gray-100 px-1.5 py-0.5">Pennel123</code>) — or
          the new password you set. Still stuck? Use <strong>&quot;Forgot password?&quot;</strong> or contact Tim.
        </p>

        <h3 className="mt-6 font-semibold text-gray-900">The site asked me to change my password — is that normal?</h3>
        <p className="mt-1 text-sm text-gray-700">Yes — that happens automatically on your first login. Choose a private password and continue.</p>

        <h3 className="mt-6 font-semibold text-gray-900">I declined a protocol by mistake.</h3>
        <p className="mt-1 text-sm text-gray-700">No problem — contact the Chair or Tim and it can be reassigned to you.</p>

        <h3 className="mt-6 font-semibold text-gray-900">Can I use this on my phone?</h3>
        <p className="mt-1 text-sm text-gray-700">Yes — the site works in any phone or tablet browser.</p>

        <div className="my-8 rounded-lg border border-gray-200 bg-gray-50 px-5 py-4 text-sm">
          <strong>Still need help?</strong>
          <br />
          📧 <a className="text-blue-600 hover:underline" href="mailto:tim.pennel@uct.ac.za">tim.pennel@uct.ac.za</a>
          {' '}·{' '}💬 WhatsApp <strong>083 233 5518</strong>
        </div>

        <div className="mt-10 border-t border-gray-100 pt-6 text-center">
          <Link href="/login" className="inline-flex rounded-xl bg-blue-600 px-6 py-2.5 text-sm font-medium text-white hover:bg-blue-700">
            Go to the login page
          </Link>
        </div>
      </main>

      <footer className="mx-auto max-w-3xl px-6 py-6 text-center text-xs text-gray-500 sm:px-10">
        Surgical Data Review Committee · Department of Surgery, University of Cape Town
      </footer>
    </div>
  )
}
