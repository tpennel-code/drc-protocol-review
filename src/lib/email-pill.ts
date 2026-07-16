import type { DeliveryStatus, EmailType } from '@/lib/types'

// The compact shape the dashboard needs per protocol to render its email pill.
export type EmailPillData = {
  emailType: EmailType
  recipient: string
  sentAt: string
  status: DeliveryStatus | null
  checkedAt: string | null
}

type PillTone = 'blue' | 'red' | 'gray'

const TONE_CLASS: Record<PillTone, string> = {
  blue: 'bg-blue-100 text-blue-700',
  red: 'bg-red-100 text-red-700',
  gray: 'bg-gray-100 text-gray-600',
}

// Map Resend's last_event onto a label + colour for the pill.
function present(status: DeliveryStatus | null): { label: string; tone: PillTone } {
  switch (status) {
    case 'delivered':
    case 'opened':
    case 'clicked':
      return { label: 'Email Delivered', tone: 'blue' }
    case 'bounced':
    case 'complained':
    case 'failed':
    case 'canceled':
      return { label: 'Email Bounced', tone: 'red' }
    default:
      // sent, queued, scheduled, delivery_delayed, or not yet polled
      return { label: 'Email Sent', tone: 'gray' }
  }
}

export function emailPill(status: DeliveryStatus | null): { label: string; className: string } {
  const { label, tone } = present(status)
  return { label, className: TONE_CLASS[tone] }
}
