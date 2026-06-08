export type UserRole = 'reviewer' | 'executive' | 'admin'

export type ReviewRecommendation = 'approved' | 'minor_amendment' | 'major_amendment' | 'rejected'

export type OutcomeStatus = 'pending' | 'approved' | 'minor_amendment' | 'major_amendment' | 'rejected' | 'rolled_over' | 'na' | 'Unclassified' | 'fast_track_accepted' | 'fast_track_rejected'

// The fast-track lifecycle is tracked separately from the formal review
// outcome: a rejected fast-track still proceeds to full review and gets its
// own `final_outcome`.
export type FastTrackDecision = 'accepted' | 'rejected'
export type FastTrackState = 'requested' | 'accepted' | 'rejected'

export function fastTrackState(
  p: { fast_tracked: boolean | null; fast_track_decision: string | null },
): FastTrackState | null {
  if (!p.fast_tracked) return null
  if (p.fast_track_decision === 'accepted') return 'accepted'
  if (p.fast_track_decision === 'rejected') return 'rejected'
  return 'requested'
}

export const fastTrackLabel: Record<FastTrackState, string> = {
  requested: 'Fast Track Request',
  accepted: 'Fast Tracked',
  rejected: 'Fast Track Reject',
}

export interface Profile {
  id: string
  email: string
  firstname: string | null
  surname: string | null
  professional_title: string | null
  division: string | null
  portfolio: string | null
  role: UserRole
  signature_url: string | null
  archived: boolean
  must_change_password: boolean
  created_at: string
}

export interface Protocol {
  id: string
  protocol_number: string | null
  serial_text: string | null
  title: string | null
  approved_title: string | null
  study_type: string | null
  submission_type: string | null
  degree: string | null
  fast_tracked: boolean | null
  fast_track_decision: FastTrackDecision | null
  submitted_at: string | null
  final_outcome: OutcomeStatus
  approval_date: string | null
  meeting_date: string | null
  meeting_outcome: string | null
  applicant_email: string | null
  applicant_firstname: string | null
  applicant_surname: string | null
  applicant_title: string | null
  supervisor: string | null
  reviewer_comments: string | null
  amendment_letter_status: string | null
  approval_letter_status: string | null
  amendment_date: string | null
  protocol_file: string | null
  datasheet_file: string | null
  supplementary_file: string | null
  checklist: string | null
  submission_id: string | null
  year: string | null
  year_submitted: string | null
  list_amendments: string | null
  page_count: number | null
  if_resubmission_drc_number: string | null
  omit_record: boolean
  created_at: string
  updated_at: string
}

export interface ProtocolAssignment {
  id: string
  protocol_id: string
  reviewer_id: string
  assigned_by: string
  assigned_at: string
  status: 'pending' | 'in_review' | 'completed' | 'declined'
  reviewer?: Profile
  protocol?: Protocol
}

export interface Review {
  id: string
  protocol_id: string
  reviewer_id: string
  recommendation: ReviewRecommendation | null
  comments: string | null
  attachment_path: string | null
  submitted_at: string
  reviewer?: Profile
}

export interface EmailLog {
  id: string
  protocol_id: string
  sent_by: string
  recipient_email: string
  email_type: 'approval' | 'rejection' | 'amendment'
  sent_at: string
}
