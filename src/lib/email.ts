// Sender address for all outbound DRC email.
//
// Set EMAIL_FROM in the environment once the sending domain is verified in
// Resend, e.g. "DRC <noreply@surgicaldrc.co.za>". Until then it falls back to
// Resend's shared sandbox sender, which can only deliver to the Resend account
// owner's address — fine for local testing, not for real recipients.
export const EMAIL_FROM = process.env.EMAIL_FROM ?? 'DRC <onboarding@resend.dev>'
