export const REQUISITION_PATTERN =
  /\b(?:req(?:uisition)?(?:\s*(?:id|number|#))?|job\s*(?:id|number|#)|posting\s*(?:id|number|#))\s*[:#-]?\s*[a-z0-9][a-z0-9-]{2,}\b/i;

export const SALARY_PATTERN =
  /(?:\$\s?\d{2,3}(?:,\d{3})?(?:\.\d{1,2})?(?:\s*(?:-|–|to)\s*\$?\s?\d{2,3}(?:,\d{3})?(?:\.\d{1,2})?)?|\b(?:salary|compensation|pay range|hourly rate)\s*[:=-])/i;

export const PIPELINE_PATTERN =
  /\b(?:pipeline role|proposal role|proposal-based|talent pool|talent community|evergreen requisition|future opportunities|anticipated opening)\b/i;

export const CONTINGENT_AWARD_PATTERN =
  /\b(?:contingent upon|subject to|pending)\s+(?:contract|task order|funding|award)|\bcontract award pending\b/i;

export const SENSITIVE_INFORMATION_PATTERN =
  /\b(?:social security(?: number)?|ssn|bank account|routing number|online banking login|credit card|debit card)\b/i;

export const PAYMENT_PATTERN =
  /\b(?:gift card|bitcoin|cryptocurrency|crypto payment|wire transfer|send money|pay a fee|application fee|training fee|purchase equipment|buy equipment)\b/i;

export const FAKE_CHECK_PATTERN =
  /\b(?:deposit|cash|mobile deposit)\b.{0,50}\bcheck\b|\bcheck\b.{0,50}\b(?:equipment|vendor|reimburse|purchase)\b/i;

export const MESSAGING_APP_PATTERN =
  /\b(?:telegram|whatsapp|signal app)\b/i;

export const NO_INTERVIEW_PATTERN =
  /\b(?:no interview(?: is)? required|hired immediately|instant job offer|offer without an interview)\b/i;

export const PERSONAL_EMAIL_PATTERN =
  /\b[a-z0-9._%+-]+@(gmail|yahoo|outlook|hotmail|aol)\.com\b/i;

export const URGENCY_PATTERN =
  /\b(?:act immediately|respond immediately|urgent response|limited slots|respond within \d+ hours)\b/i;

export const PUBLIC_URL_PATTERN = /^https?:\/\/\S+$/i;