export type PhoneApp = 'home' | 'notifications' | 'messages' | 'mail' | 'calls' | 'contacts' | 'bank' | 'feedback';
export type Decision = 'proceed' | 'decline' | 'report';
export interface Evidence {
  id: string; app: PhoneApp; title: string; origin: string; body: string[]; call?: boolean;
}
export interface Source { title: string; url: string }
export interface EncounterVariant {
  id: string; stage: number; scam: boolean; channel: 'messages' | 'mail'; sender: string;
  initials: string; title: string; preview: string; messages: string[]; evidence: Evidence[];
  decisive: string; cost: number; proceed: string; success: string; declined: string;
  lesson: string; habit: string; sources: Source[]; reviewDate: string;
}
export interface Stage {
  name: string; chapter: string; setting: string; description: string; tap: number;
  upgrade: string; upgradeDescription: string; cost: number; gate: number; color: string;
}
export const STAGES: Stage[] = [
  { name: 'School days', chapter: '01', setting: 'A little pocket money. A world of possibilities.', description: 'Between classes, big dreams start small.', tap: 20, upgrade: 'Study routine', upgradeDescription: 'A little structure goes a long way. Double your tap earnings this chapter.', cost: 200, gate: 1000, color: '#a7cf91' },
  { name: 'Campus life', chapter: '02', setting: 'Your own laptop. Your next opportunity.', description: 'New independence, new things to figure out.', tap: 200, upgrade: 'Better workspace', upgradeDescription: 'Make room for your next idea. Double your tap earnings this chapter.', cost: 2000, gate: 10000, color: '#e4be79' },
  { name: 'Working world', chapter: '03', setting: 'New responsibilities. Familiar-looking requests.', description: 'A desk with a view, and decisions that matter.', tap: 2000, upgrade: 'Work toolkit', upgradeDescription: 'Find your flow. Double your tap earnings this chapter.', cost: 20000, gate: 100000, color: '#e1a083' },
  { name: 'Home sweet home', chapter: '04', setting: 'A slower evening. A phone that still rings.', description: 'Keep growing, and look out for the people you love.', tap: 10000, upgrade: 'Hobby workspace', upgradeDescription: 'More space for the things you enjoy. Double your tap earnings this chapter.', cost: 100000, gate: 1000000, color: '#b7aad6' },
];
const ecommerce: Source[] = [
  { title: 'ScamShield · E-commerce scams', url: 'https://www.scamshield.gov.sg/i-want-protection-from-scams/learn-to-recognise-scams/e-commerce-scams/' },
  { title: 'Carousell · Singapore purchase workflow', url: 'https://support.carousell.com/hc/en-us/articles/360019904614--Singapore-Step-by-step-guide-on-how-to-buy-using-Buyer-Protection' },
  { title: 'Carousell · Buyer Protection conditions', url: 'https://support.carousell.com/hc/en-us/articles/360020382834--Singapore-What-is-Buyer-Protection' },
];
const jobs: Source[] = [
  { title: 'SPF · Messaging-platform job scams', url: 'https://www.police.gov.sg/Media-Hub/News/2025/08/20250829_police_advisory_on_job_scams_involving_messaging_platforms' },
  { title: 'ScamShield · Job scams', url: 'https://www.scamshield.gov.sg/i-want-protection-from-scams/learn-to-recognise-scams/job-scams/' },
  { title: 'NUS · Student Work Scheme', url: 'https://www.nus.edu.sg/cfg/students/jobs-internships/nsws' },
];
const office: Source[] = [
  { title: 'SPF · Business email compromise, 29 Oct 2026', url: 'https://www.police.gov.sg/Media-Hub/News/2026/10/20261029_usd_12_8_million_recovered_from_business_email_compromise_scam_through_strong' },
  { title: 'OCBC · Business security guidance', url: 'https://www.ocbc.com/business-banking/security-advisory.page' },
];
const home: Source[] = [
  { title: 'SPF · Compromised WhatsApp accounts, 21 Oct 2026', url: 'https://www.police.gov.sg/Media-Hub/News/2026/10/20261021_police_advisory_on_social_media_impersonation_scams' },
  { title: 'ScamShield · Add, Check, Tell', url: 'https://www.scamshield.gov.sg/get-involved/i-can-act-campaign/' },
];
function school(scam: boolean): EncounterVariant {
  const item = scam ? 'Cloud headphones' : 'Studio headphones';
  return {
    id: scam ? 'school-a' : 'school-b', stage: 0, scam, channel: 'messages', sender: scam ? 'Jamie · LoopMarket' : 'Alex · LoopMarket', initials: scam ? 'JL' : 'AL',
    title: item, preview: 'Still available! I can reserve the headphones for you.',
    messages: ['Hi! The headphones are still available. Lightly used, with the box. SGD 100 for you.', 'I can reserve them until after class.', scam ? 'The checkout is having issues today. PayNow me directly and I’ll reserve them. The reservation still has protection, don’t worry.' : 'You can use the Buy button on my listing. The order will show in your purchases, with tracked delivery.'],
    evidence: [
      { id: 'profile', app: 'messages', title: 'View seller profile', origin: 'Information displayed in the seller’s profile', body: ['Member for 3 years · 4.9 stars · 24 reviews', 'Photos show the headphones, box and ear pads.'] },
      { id: 'reply', app: 'messages', title: 'Ask about the payment', origin: 'Reply from the same seller', body: [scam ? '“Yes, it is protected. Please transfer soon; another buyer is waiting. I cannot use checkout for this sale.”' : '“Sure, use the listing’s checkout. I will confirm the order in the app.”'] },
      { id: 'market', app: 'contacts', title: 'LoopMarket support', origin: 'Saved marketplace support contact; obtained before this request', call: true, body: [
        `${item} · SGD 100 · listing ${scam ? 'LM-318' : 'LM-642'}`,
        scam ? 'This listing has no supported checkout. The marketplace says direct transfers are outside its purchase-protection process. The seller’s “protected reservation” is not a marketplace feature.' : 'This listing supports Buy checkout with PayNow and tracked delivery. The item and price match. A placed order will appear under My Purchases.',
        'Condition: lightly used. Included: headphones and original box.',
      ] },
    ], decisive: 'market', cost: 100, proceed: scam ? 'Transfer to seller' : 'Buy through marketplace',
    success: scam ? 'The transfer went through. The seller stopped replying, and the headphones never arrived. Your SGD 100 is gone.' : 'Your order appeared in My Purchases and the headphones arrived as described. Your school taps now earn 20% more.',
    declined: 'You kept your money. The headphones were optional, so you can continue your journey.',
    lesson: 'PayNow itself is not a scam signal: eligible in-app checkout can support it. Check the transaction route and protections. Refusing safeguards is a reason not to proceed, not by itself proof that a person is a scammer.',
    habit: 'Check the payment route with the marketplace using independently obtained contact details.', sources: ecommerce, reviewDate: '4 November 2026',
  };
}
function university(scam: boolean): EncounterVariant {
  return {
    id: scam ? 'uni-a' : 'uni-b', stage: 1, scam, channel: scam ? 'messages' : 'mail', sender: scam ? 'Rae · flexible work' : 'Bayview Library', initials: scam ? 'RW' : 'BL',
    title: scam ? 'Work between classes' : 'Student assistant opening', preview: 'A flexible opportunity to help with your laptop expenses.',
    messages: scam ? [
      'Hi! I recruit student helpers for Bayview. You can do product-rating tasks between lectures.',
      'Try a short task first. It pays SGD 50, straight to your account.',
      'The next batch needs a SGD 1,000 deposit. You get it back with your commission. Dashboard earnings unlock when the batch is complete.',
    ] : [
      'Hello! Bayview Library is looking for a student assistant. Reference BV-204: shelving returns and helping at the information desk.',
      'The simulated shift pays SGD 1,000 after approved work. Apply through the campus student-work portal. There is no fee or deposit.',
      'Happy to answer questions about the duties and schedule.',
    ],
    evidence: [
      { id: 'reply', app: scam ? 'messages' : 'mail', title: 'Ask the sender for details', origin: 'Reply from the same sender', body: [scam ? '“The deposit unlocks the next task batch. It is standard for our programme. The dashboard will show all your commission.”' : '“The role is listed as BV-204. The supervisor approves your submitted hours before payment.”'] },
      { id: 'portal', app: 'mail', title: 'Bayview student-work bulletin', origin: 'Saved university bulletin; received before this offer', body: [scam ? 'The saved bulletin lists library and departmental shifts. No product-rating role or recruiter named Rae appears. There are no deposits to unlock assignments.' : 'BV-204 · Student library assistant. Duties: returns and information desk. Department: Library Services. Supervisor: Mei Tan. Payment follows an approved timesheet.', 'Student Work Office · contact listed in the campus directory.'] },
      { id: 'campus', app: 'contacts', title: 'Bayview Student Work Office', origin: 'Contact obtained from the campus directory', call: true, body: [scam ? '“We have no recruiter named Rae and no product-rating scheme. We did not send this offer. We do not ask students to fund tasks.”' : '“Yes, BV-204 is our library role. Apply through the campus portal. Complete the shift and submit your hours for supervisor approval. You do not pay us to start.”'] },
      { id: 'dashboard', app: 'messages', title: 'Task dashboard attachment', origin: 'Screenshot supplied by the recruiter in this chat', body: ['Displayed balance: SGD 3,600. Withdrawal status: locked until next batch.', 'Next batch deposit: SGD 1,000. Deposit and commission become available after batch completion.'] },
    ].filter(e => scam || e.id !== 'dashboard') as Evidence[],
    decisive: 'campus', cost: scam ? 1000 : 0, proceed: scam ? 'Fund the next batch' : 'Accept and complete shift',
    success: scam ? 'The deposit was taken, but the dashboard earnings could not be withdrawn. A request for another payment followed. You stopped here; no further money was sent.' : 'You accepted through the campus portal, completed the simulated shift and submitted your hours. The supervisor approved the work. SGD 1,000 is now in your Bank ledger.',
    declined: 'You declined the opportunity. You can still earn and move on.',
    lesson: 'A small first commission can be real and still be part of a scam. Check the employer independently. Receiving wages is different from paying to unlock work or withdrawals. Bayview is fictional; the genuine workflow is informed by Singapore campus work schemes.',
    habit: 'Find the employer’s contact yourself before committing money to a job offer.', sources: jobs, reviewDate: '4 November 2026',
  };
}
function work(scam: boolean): EncounterVariant {
  const supplier = scam ? 'Harbour Supplies' : 'Garden Office Co.';
  return {
    id: scam ? 'office-a' : 'office-b', stage: 2, scam, channel: 'mail', sender: `${supplier} · Accounts`, initials: scam ? 'HS' : 'GO', title: `Invoice ${scam ? '1842' : '2091'} · revised details`, preview: 'Please use our updated receiving account for this invoice.',
    messages: [`Hello, your invoice for 5,000 company units is due on Friday. The goods have already been delivered.`, 'We have changed our receiving bank account. Please use account ending 7314 for the payment.', 'The revised invoice is attached. Let us know if you need an authorisation letter. Thank you.'],
    evidence: [
      { id: 'invoice', app: 'mail', title: 'Compare invoice and purchase order', origin: 'Invoice attached to email; purchase order from your employer', body: ['Supplier, goods, amount and invoice number match the purchase order.', 'Purchase order status: goods received. Payment due Friday. Invoice receiving account: ending 7314.'] },
      { id: 'reply', app: 'mail', title: 'Request an authorisation letter', origin: 'Attachment returned through the same email thread', body: ['A professional letter arrives with the supplier’s signature and company stamp. It asks you to pay account ending 7314.'] },
      { id: 'incoming', app: 'calls', title: `${supplier} · incoming follow-up`, origin: 'Incoming call associated with this request', call: true, body: ['“Hello, just checking you received our email. The new account ends in 7314. Please process it when you can.”'] },
      { id: 'vendor', app: 'contacts', title: `${supplier} · saved accounts contact`, origin: 'Company vendor record · saved before this request', call: true, body: [scam ? '“We have not changed our bank account. Do not pay 7314. Our existing account ends in 2840. We will alert our IT team about that email.”' : '“Yes, we changed accounts. Our new receiving account ends in 7314, as in the invoice. Please record this callback and use your normal approval process.”'] },
    ], decisive: 'vendor', cost: 0, proceed: 'Submit company payment',
    success: scam ? 'The employer paid 5,000 company units to the redirected account. The real supplier’s invoice is still unpaid. Your personal savings were not deducted.' : 'You submitted the genuine invoice through the fictional employer’s approval process. Work objective complete: +SGD 10,000. This is a game reward, not a real salary rule.',
    declined: 'You held the payment for your finance team to review. No personal money was spent.',
    lesson: 'A correct invoice, familiar email thread and company stamp do not establish that changed bank details are genuine. Confirm changes using a trusted contact already held separately. An incoming reassurance call is not the same as that check.',
    habit: 'Call the supplier using your existing vendor record when payment details change.', sources: office, reviewDate: '4 November 2026',
  };
}
function family(scam: boolean): EncounterVariant {
  const name = scam ? 'Kai' : 'Lin';
  return {
    id: scam ? 'home-a' : 'home-b', stage: 3, scam, channel: 'messages', sender: `${name} · family`, initials: name[0], title: 'Could you help with an expense?', preview: 'Hi! Could you help me with a payment this evening?',
    messages: ['Earlier in your chat: “Dinner on Sunday?” · “See you then!”', 'Hi! Could you help me with an expense? I’m having trouble making a payment this evening.', 'Could you send SGD 20,000 to the account ending 5628? I’ll explain when we speak. I’ve attached a number here if you need to call. Thank you.'],
    evidence: [
      { id: 'reply', app: 'messages', title: 'Reply in the family chat', origin: 'Reply from the same messaging account', body: ['“Yes, it’s me. I really appreciate the help. The account ends in 5628.”'] },
      { id: 'supplied', app: 'calls', title: 'Call the number in the message', origin: 'Contact details supplied in this request', call: true, body: ['“Yes, that is the right payment. Please send it now.”'] },
      { id: 'family', app: 'contacts', title: `${name} · saved family contact`, origin: 'Your address book · saved long before today', call: true, body: [scam ? '“I didn’t ask you for money. That isn’t my account. I’ve been locked out of my messaging account—please don’t send anything.”' : '“Yes, I asked. It is for the course materials we discussed on Sunday. The amount is 20,000 and my receiving account ends in 5628. No pressure if you would rather not.”'] },
    ], decisive: 'family', cost: 20000, proceed: 'Send family support',
    success: scam ? 'The transfer reached the account supplied by someone controlling your relative’s messaging account. SGD 20,000 was lost.' : 'You helped with a genuine request. SGD 20,000 was transferred. Choosing to help was your decision; a polite decline after checking would also have been safe.',
    declined: 'You chose not to send money. You are allowed to decline a genuine family request, even after checking it.',
    lesson: 'Scammers can take over an existing messaging account. Check unusual money requests through a separately established route and confirm the purpose and payment details. Familiar chat history is not enough.',
    habit: 'Contact family independently before acting on an unusual request for money.', sources: home, reviewDate: '4 November 2026',
  };
}
export const ENCOUNTERS = [school(true), school(false), university(true), university(false), work(true), work(false), family(true), family(false)];
export const CASES = Object.fromEntries(ENCOUNTERS.map(e => [e.id, e])) as Record<string, EncounterVariant>;
export const REVIEW_DATE = '4 November 2026';
export const money = (cents: number) => new Intl.NumberFormat('en-SG', { maximumFractionDigits: cents % 100 ? 2 : 0 }).format(cents / 100);
export const shortMoney = (value: number) => new Intl.NumberFormat('en', { notation: 'compact', maximumFractionDigits: 1 }).format(value);

