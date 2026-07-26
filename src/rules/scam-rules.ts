import type { DetectionRule } from "../lib/analysis-types";

import {
  FAKE_CHECK_PATTERN,
  MESSAGING_APP_PATTERN,
  NO_INTERVIEW_PATTERN,
  PAYMENT_PATTERN,
  PERSONAL_EMAIL_PATTERN,
  SENSITIVE_INFORMATION_PATTERN,
  URGENCY_PATTERN,
} from "./patterns";

export const scamRules: DetectionRule[] = [
  {
    id: "sensitive-information",
    category: "phishing-safety",
    target: "scam",
    title: "Sensitive financial or identity information mentioned",
    explanation:
      "Requests for Social Security, bank, routing, or card information before formal onboarding are a critical warning.",
    points: 65,
    type: "critical",
    question:
      "Can the employer confirm this request through contact information published on its official website?",
    matches: ({ combinedText }) =>
      SENSITIVE_INFORMATION_PATTERN.test(combinedText),
  },
  {
    id: "payment-request",
    category: "phishing-safety",
    target: "scam",
    title: "Payment or purchase request detected",
    explanation:
      "Legitimate employers should not require applicants to send money, buy gift cards, transfer cryptocurrency, or pay application fees.",
    points: 75,
    type: "critical",
    matches: ({ combinedText }) =>
      PAYMENT_PATTERN.test(combinedText),
  },
  {
    id: "fake-check",
    category: "phishing-safety",
    target: "scam",
    title: "Possible fake-check or equipment scheme",
    explanation:
      "The message appears to connect a check, deposit, reimbursement, vendor, or equipment purchase.",
    points: 75,
    type: "critical",
    matches: ({ combinedText }) =>
      FAKE_CHECK_PATTERN.test(combinedText),
  },
  {
    id: "messaging-app",
    category: "phishing-safety",
    target: "scam",
    title: "Informal messaging application detected",
    explanation:
      "Recruitment conducted primarily through Telegram, WhatsApp, or similar applications deserves additional verification.",
    points: 25,
    type: "warning",
    matches: ({ recruiterMessage }) =>
      MESSAGING_APP_PATTERN.test(recruiterMessage),
  },
  {
    id: "no-interview",
    category: "phishing-safety",
    target: "scam",
    title: "Offer without a substantive interview",
    explanation:
      "An immediate offer or claim that no interview is required is a significant scam warning.",
    points: 40,
    type: "critical",
    matches: ({ combinedText }) =>
      NO_INTERVIEW_PATTERN.test(combinedText),
  },
  {
    id: "personal-email",
    category: "phishing-safety",
    target: "scam",
    title: "Personal email provider detected",
    explanation:
      "A recruiter using a free personal email address should be independently verified through the employer’s official website.",
    points: 25,
    type: "warning",
    question:
      "Can the employer confirm this recruiter through its official website or published telephone number?",
    matches: ({ recruiterMessage }) =>
      PERSONAL_EMAIL_PATTERN.test(recruiterMessage),
  },
  {
    id: "urgency",
    category: "phishing-safety",
    target: "scam",
    title: "Pressure or artificial urgency detected",
    explanation:
      "Scammers frequently pressure applicants to respond before they have time to verify the opportunity.",
    points: 15,
    type: "warning",
    matches: ({ combinedText }) =>
      URGENCY_PATTERN.test(combinedText),
  },
];
