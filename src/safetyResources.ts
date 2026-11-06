export type SafetyHarm = 'scam' | 'grooming' | 'cyberbullying';
export type SafetyResource = { title: string; url: string; description: string };

// Primary guidance checked on 6 November 2026. Links are opened only by the player.
export const PLATFORM_GUIDES = {
  telegram: { title: 'Telegram: report a message', url: 'https://telegram.org/faq#q-there-39s-illegal-content-on-telegram-how-do-i-take-it-down' },
  gmailBlock: { title: 'Gmail on iPhone: block a sender', url: 'https://support.google.com/mail/answer/8151?co=GENIE.Platform%3DiOS&hl=en' },
  gmailPhishing: { title: 'Gmail on a computer: report phishing', url: 'https://support.google.com/mail/answer/8253?hl=en' },
  gmailSpam: { title: 'Gmail on iPhone: report spam', url: 'https://support.google.com/mail/answer/1366858?co=GENIE.Platform%3DiOS&hl=en' },
} as const;

export const HELP_GROUPS: Record<SafetyHarm, { title: string; guidance: string; links: SafetyResource[] }> = {
  scam: {
    title: 'Scams and suspicious requests',
    guidance: 'Unsure about a request? Check through an independent contact. If money or banking details were compromised, contact your bank promptly and make a police report.',
    links: [
      { title: 'ScamShield: check a suspicious request', url: 'https://www.scamshield.gov.sg/check-for-scams/', description: 'Use the ScamShield app or call 1799 for scam advice.' },
      { title: 'ScamShield: how to submit a scam report', url: 'https://guide.scamshield.gov.sg/using-scamshield/submit-a-scam-report', description: 'Report suspicious messages, emails, links or calls. A ScamShield submission is not an official police report.' },
    ],
  },
  grooming: {
    title: 'Grooming, pressure and abuse',
    guidance: 'You can stop a conversation or refuse a request. Tell a trusted person, school counsellor or campus support service. Abuse is never the fault of the person targeted.',
    links: [
      { title: 'MSF: get help and report abuse', url: 'https://www.msf.gov.sg/what-we-do/break-the-silence/get-help/i-want-to-report-domestic-violence', description: 'MSF lists the National Anti-Violence and Sexual Harassment Helpline (1800-777-0000) and its online reporting form.' },
    ],
  },
  cyberbullying: {
    title: 'Cyberbullying and harassment',
    guidance: 'Keep a record, report the abusive content and block or mute the account. Do not forward humiliating posts. If you are a bystander, support the person privately and involve a trusted adult or campus support.',
    links: [
      { title: 'IMDA: responding to cyberbullying', url: 'https://www.digitalforlife.gov.sg/learn/resources/all-resources/cyberbullying', description: 'Guidance on recognising bullying, using platform tools and getting support from people you trust.' },
      { title: 'OSC: online harassment reporting options', url: 'https://www.osc.gov.sg/what-you-can-report/online-harassment/', description: 'For eligible victims after reporting to the platform at least 24 hours earlier. Under-18s can ask a parent or guardian to help. Check the official eligibility and evidence requirements.' },
    ],
  },
};

export const POLICE_REPORT: SafetyResource = {
  title: 'Singapore Police Force: lodge a police report',
  url: 'https://www.police.gov.sg/e-services/lodge-police-report/',
  description: 'Use the official service for a suspected crime that does not need immediate police action. In immediate danger, call 999; do not wait for a platform response.',
};

export const harmLabel = (harm: SafetyHarm) => ({ scam: 'Scam', grooming: 'Grooming / boundary pressure', cyberbullying: 'Cyberbullying' })[harm];
