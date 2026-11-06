export type PhoneApp = 'home' | 'notifications' | 'messages' | 'mail' | 'calls' | 'contacts' | 'bank' | 'feedback' | 'profile';
export type Decision = 'proceed' | 'decline' | 'report';
export interface Evidence { id: string; app: PhoneApp; title: string; origin: string; body: string[]; call?: boolean; contactId?: string }
export interface Source { title: string; url: string }
export interface EncounterVariant {
  id: string; stage: number; scam: boolean; channel: 'messages' | 'mail' | 'calls'; sender: string;
  initials: string; title: string; preview: string; messages: string[]; evidence: Evidence[];
  decisive: string; cost: number; proceed: string; success: string; declined: string;
  lesson: string; habit: string; sources: Source[]; reviewDate: string; confirmText: string;
  senderEmail?: string; replyTo?: string; reward?: number; employerLoss?: number;
  callTranscript?: string[]; followUp?: string[];
}
export interface Stage { name: string; chapter: string; setting: string; description: string; tap: number; upgrade: string; upgradeDescription: string; cost: number; gate: number; color: string }
export const STAGES: Stage[] = [
  { name: 'School', chapter: '01', setting: 'School', description: 'Concert plans and trading cards.', tap: 2, upgrade: 'Study routine', upgradeDescription: 'Double your tap earnings this stage.', cost: 200, gate: 1000, color: '#a7cf91' },
  { name: 'Tertiary', chapter: '02', setting: 'Tertiary education', description: 'Semester fees and internship applications.', tap: 10, upgrade: 'Better workspace', upgradeDescription: 'Double your tap earnings this stage.', cost: 2000, gate: 10000, color: '#e4be79' },
  { name: 'Adult', chapter: '03', setting: 'Adult life', description: 'Work commitments and a new delivery.', tap: 50, upgrade: 'Work toolkit', upgradeDescription: 'Double your tap earnings this stage.', cost: 20000, gate: 100000, color: '#e1a083' },
  { name: 'Senior', chapter: '04', setting: 'Retired at home', description: 'Old friends and new plans.', tap: 100, upgrade: 'Hobby workspace', upgradeDescription: 'Double your tap earnings this stage.', cost: 100000, gate: 1000000, color: '#b7aad6' },
];
export function personalise(text: string, name: string) { return text.replaceAll('{name}', name); }

export const ENCOUNTERS: EncounterVariant[] = [
  {
    "reward": 0,
    "employerLoss": 0,
    "reviewDate": "6 November 2026",
    "declined": "You declined the request. No money left your account.",
    "id": "school-a",
    "stage": 0,
    "scam": true,
    "channel": "messages",
    "sender": "Alex",
    "initials": "A",
    "title": "Saturday tickets",
    "preview": "Still looking for two tickets?",
    "messages": [
      "Hey {name}, still looking for two tickets for Saturday? I have a pair in the section you wanted.",
      "Receipt attached — I booked them last month. Someone else asked, but I can hold them for you.",
      "S$80 deposit first, then I transfer the tickets into your account. Balance after. Can settle before my class starts?"
    ],
    "evidence": [
      {
        "id": "receipt",
        "app": "messages",
        "title": "Receipt.jpg",
        "origin": "Attachment from Alex",
        "body": [
          "Harbour Live · Saturday · Two seats · Order HL-4820",
          "This is an image of a receipt supplied by the seller."
        ]
      },
      {
        "id": "reply",
        "app": "messages",
        "title": "Alex",
        "origin": "Reply in this conversation",
        "body": [
          "Alex: The receipt is real. I have sold to other fans before. You can trust me."
        ]
      },
      {
        "id": "independent",
        "app": "contacts",
        "title": "Harbour Live",
        "origin": "Saved contact",
        "body": [
          "Box office: For this fictional Saturday event, tickets cannot be transferred between accounts.",
          "We cannot confirm a seller’s ownership from a receipt image. The transfer route you described is not available."
        ],
        "contactId": "organiser",
        "call": true
      },
      {
        "id": "original",
        "app": "mail",
        "title": "Saturday event details",
        "origin": "Earlier event information",
        "body": [
          "Harbour Live · Saturday show",
          "Your enquiry reference: HL-204. Contact the box office through the details saved with your enquiry."
        ]
      }
    ],
    "decisive": "independent",
    "cost": 80,
    "proceed": "Pay S$80 deposit",
    "confirmText": "Send S$80 from your simulated savings to reserve these tickets.",
    "success": "After the deposit, Alex stopped replying. No tickets arrived. Scamagotchi used a copied receipt and your concert plans to get the payment.",
    "lesson": "A receipt image does not establish ticket ownership or valid admission. Transfer rules vary by event; this event did not support the promised route.",
    "habit": "Check the specific event’s sales and transfer rules through the organiser before paying a reseller.",
    "sources": [
      {
        "title": "SPF / ScamShield · Concert-ticket scams",
        "url": "https://www.scamshield.gov.sg/files/2025%20Scams%20Bulletins/monthly_scams_bulletin_2025_issue_04.pdf"
      }
    ]
  },
  {
    "reward": 0,
    "employerLoss": 0,
    "reviewDate": "6 November 2026",
    "declined": "You declined the request. No money left your account.",
    "id": "school-b",
    "stage": 0,
    "scam": true,
    "channel": "messages",
    "sender": "Casey · Card exchange",
    "initials": "C",
    "title": "Trading-card box",
    "preview": "The card box is still available.",
    "messages": [
      "Hi {name}, the sealed card box is still available — S$120.",
      "The photos are from our club meet. I am clearing some duplicates before the weekend.",
      "Can PayNow a deposit directly? The marketplace checkout is being slow. I will send you tracking tonight."
    ],
    "evidence": [
      {
        "id": "photos",
        "app": "messages",
        "title": "Card-box photos",
        "origin": "Seller attachment",
        "body": [
          "A clean-looking box on a blue club table. The image includes a partly visible handwritten card marked W-17."
        ]
      },
      {
        "id": "reply",
        "app": "messages",
        "title": "Casey · Card exchange",
        "origin": "Reply in this conversation",
        "body": [
          "Casey: I cannot meet today, but I have lots of good reviews. A direct payment is faster."
        ]
      },
      {
        "id": "independent",
        "app": "contacts",
        "title": "Wei",
        "origin": "Saved contact",
        "body": [
          "Wei: That is my blue table and my W-17 label. I posted those photos in our club chat.",
          "I am not selling that box, and Casey is not selling it for me. Please don’t pay for it."
        ],
        "contactId": "wei",
        "call": true
      }
    ],
    "decisive": "independent",
    "cost": 120,
    "proceed": "Pay S$120",
    "confirmText": "Send S$120 directly from your simulated savings to the seller.",
    "success": "The seller disappeared after payment. The box was never sent. Scamagotchi reused another collector’s pictures.",
    "lesson": "Good photos and a familiar hobby make a listing plausible. Here, the original owner independently contradicted the seller. PayNow itself is not the problem; the transaction and evidence matter.",
    "habit": "Keep transactions within supported safeguards or arrange inspection before paying.",
    "sources": [
      {
        "title": "SPF · Trading-card e-commerce scams",
        "url": "https://www.police.gov.sg/media-hub/news/2025/05/20250520_police_advisory_on_ecommerce_scams_involving_sale_of_pokemon_cards"
      }
    ]
  },
  {
    "reward": 0,
    "employerLoss": 0,
    "reviewDate": "6 November 2026",
    "declined": "You declined the genuine card offer. No money was spent; this is a missed opportunity, not a safety failure.",
    "id": "school-c",
    "stage": 0,
    "scam": false,
    "channel": "messages",
    "sender": "Wei",
    "initials": "W",
    "title": "Cards after class",
    "preview": "Still want those cards we discussed?",
    "messages": [
      "Hey {name}, still want those cards we discussed? S$100 for the lot.",
      "I can meet at our usual club table after class. Look through everything first; pay only if it matches what we agreed.",
      "No rush if you changed your mind."
    ],
    "evidence": [
      {
        "id": "reply",
        "app": "messages",
        "title": "Wei",
        "origin": "Reply in this conversation",
        "body": [
          "Wei: Same cards as the list I sent. Happy for you to inspect them."
        ]
      },
      {
        "id": "list",
        "app": "mail",
        "title": "Card-club exchange list",
        "origin": "Earlier club message",
        "body": [
          "Wei offered a bundle of ordinary cards for S$100. You discussed meeting at the club table after class."
        ]
      },
      {
        "id": "independent",
        "app": "contacts",
        "title": "Wei",
        "origin": "Saved contact",
        "body": [
          "You call Wei using the number already in your Contacts.",
          "Wei confirms the exact S$100 bundle and meeting place. At the simulated meetup, you inspect the cards and they match the agreed list. No advance payment is required."
        ],
        "contactId": "wei",
        "call": true
      }
    ],
    "decisive": "independent",
    "cost": 100,
    "proceed": "Buy inspected cards",
    "confirmText": "Complete the simulated meetup and pay S$100 after inspecting the agreed cards.",
    "success": "You met Wei, inspected the agreed bundle and paid S$100. The cards were delivered as described.",
    "lesson": "This purchase had a separate established contact, matching details and inspection before payment. Inspection confirms the agreed item in this scenario; it is not a guarantee of authenticity for every rare collectible.",
    "habit": "Seek positive evidence and a safe transaction route rather than assuming every offer is fraudulent.",
    "sources": [
      {
        "title": "SPF · Trading-card e-commerce scams",
        "url": "https://www.police.gov.sg/media-hub/news/2025/05/20250520_police_advisory_on_ecommerce_scams_involving_sale_of_pokemon_cards"
      }
    ]
  },
  {
    "reward": 0,
    "employerLoss": 0,
    "reviewDate": "6 November 2026",
    "declined": "You declined the request. No money left your account.",
    "id": "uni-a",
    "stage": 1,
    "scam": true,
    "channel": "mail",
    "sender": "Campus Finance",
    "senderEmail": "fees@meranti-payments.example",
    "replyTo": "accounts@meranti-payments.example",
    "initials": "CF",
    "title": "Semester account update",
    "preview": "Your semester balance requires attention.",
    "messages": [
      "Dear {name},",
      "Your semester balance of S$1,800 is due this month. We are reconciling payments before registration closes.",
      "Our receiving account has changed. Please use the attached payment instructions so your enrolment is not delayed.",
      "If you have already arranged payment, reply with your receipt and we will update your student record."
    ],
    "evidence": [
      {
        "id": "invoice",
        "app": "mail",
        "title": "Updated payment instructions",
        "origin": "Attachment in this email",
        "body": [
          "Semester balance: S$1,800",
          "Requested recipient: Meranti Processing Services",
          "Pay using the account shown in this attachment."
        ]
      },
      {
        "id": "reply",
        "app": "mail",
        "title": "Finance response",
        "origin": "Reply to this sender",
        "body": [
          "Accounts team: This is our temporary receiving account during maintenance. Your enrolment will be updated once paid."
        ]
      },
      {
        "id": "statement",
        "app": "mail",
        "title": "Semester statement MU-207",
        "origin": "Archived university statement",
        "body": [
          "Outstanding semester fees: S$1,800",
          "Use the university’s established payment process. Campus Finance’s contact details are in your welcome pack."
        ]
      },
      {
        "id": "independent",
        "app": "contacts",
        "title": "Campus Finance",
        "origin": "Saved contact",
        "body": [
          "Finance: Your S$1,800 balance is correct, but we have not changed our receiving account.",
          "The message and replacement payment instructions are not from us. Please use the payment route established in your student records."
        ],
        "contactId": "finance",
        "call": true
      }
    ],
    "decisive": "independent",
    "cost": 1800,
    "proceed": "Pay replacement account",
    "confirmText": "Send S$1,800 to the replacement account supplied in this email.",
    "success": "The S$1,800 went to Scamagotchi’s account. Your genuine semester balance remains unpaid in the story.",
    "lesson": "A correct balance and real deadline can be copied into a fraudulent request. This fictional scenario adapts payment-redirection risks; the NUS source documents legitimate fee-payment routes, including PayNow, rather than this invented incident.",
    "habit": "Confirm changed payment instructions through the institution’s independently saved contact.",
    "sources": [
      {
        "title": "NUS · Legitimate fee-payment methods",
        "url": "https://www.nus.edu.sg/finance/students/student-finance-matters/payments/fee-payment/"
      }
    ]
  },
  {
    "reward": 0,
    "employerLoss": 0,
    "reviewDate": "6 November 2026",
    "declined": "You declined the request. No money left your account.",
    "id": "uni-b",
    "stage": 1,
    "scam": true,
    "channel": "mail",
    "sender": "Linden Studio · Recruitment",
    "senderEmail": "recruitment@linden-careers.example",
    "initials": "LS",
    "title": "Internship placement MU-207",
    "preview": "We would like to offer you a placement.",
    "messages": [
      "Hi {name},",
      "Your application MU-207 stood out. We can offer a summer placement on our design operations team.",
      "To reserve the training slot and equipment, please pay the refundable S$400 onboarding deposit today. We will return it with your first allowance.",
      "The role starts after your exams, as requested."
    ],
    "evidence": [
      {
        "id": "offer",
        "app": "mail",
        "title": "Placement letter.pdf",
        "origin": "Recruiter attachment",
        "body": [
          "Linden Studio · Summer design operations intern",
          "Application MU-207 · refundable equipment deposit S$400",
          "A polished letter with a signature and company branding."
        ]
      },
      {
        "id": "reply",
        "app": "mail",
        "title": "Recruitment response",
        "origin": "Reply to this email",
        "body": [
          "Recruiter: The deposit is standard for students. You will lose the reserved place if it is not completed."
        ]
      },
      {
        "id": "independent",
        "app": "contacts",
        "title": "Linden Studio HR",
        "origin": "Saved contact",
        "body": [
          "HR: We received application MU-207, but this recruiter does not represent us.",
          "We do not charge an onboarding deposit. Interviews are still being arranged through the campus careers office."
        ],
        "contactId": "employer",
        "call": true
      }
    ],
    "decisive": "independent",
    "cost": 400,
    "proceed": "Pay onboarding deposit",
    "confirmText": "Pay S$400 from your savings to reserve this offered internship.",
    "success": "The recruiter stopped responding after the deposit. The promised placement did not exist. Scamagotchi exploited your real application context.",
    "lesson": "A role that fits your plans can still be impersonated. An internship paying wages is different from paying a recruiter to unlock a role. The internship story is an adaptation of documented job-payment scam mechanics.",
    "habit": "Use the employer contact established through your careers office to confirm an offer and any requested payment.",
    "sources": [
      {
        "title": "ScamShield · Job scams",
        "url": "https://www.scamshield.gov.sg/i-want-protection-from-scams/learn-to-recognise-scams/job-scams/"
      }
    ]
  },
  {
    "reward": 1000,
    "employerLoss": 0,
    "reviewDate": "6 November 2026",
    "declined": "You declined a genuine internship. You missed its allowance, but made no unsafe payment.",
    "id": "uni-c",
    "stage": 1,
    "scam": false,
    "channel": "mail",
    "sender": "Linden Studio HR",
    "senderEmail": "hr@linden.example",
    "initials": "LS",
    "title": "Summer internship offer",
    "preview": "Following your interview, here is your offer.",
    "messages": [
      "Hi {name},",
      "Thank you for meeting the team. We would like to offer you the summer design operations internship, reference MU-207.",
      "Your duties include preparing workshop materials and updating project records. The start date is after your exams.",
      "There is no fee to accept. Your S$1,000 allowance will be paid after the first approved work period."
    ],
    "evidence": [
      {
        "id": "offer",
        "app": "mail",
        "title": "Offer MU-207.pdf",
        "origin": "Offer attachment",
        "body": [
          "Summer design operations internship · Linden Studio",
          "Defined duties, start date and S$1,000 allowance after approved work.",
          "Payroll account details are provided later through the established employee process, not passwords or OTPs."
        ]
      },
      {
        "id": "application",
        "app": "mail",
        "title": "Your interview confirmation",
        "origin": "Archived careers-office email",
        "body": [
          "Nadia confirmed your Linden Studio interview and application MU-207.",
          "The position begins after exams and pays an allowance."
        ]
      },
      {
        "id": "independent",
        "app": "contacts",
        "title": "Linden Studio HR",
        "origin": "Saved contact",
        "body": [
          "You call HR through the number supplied earlier by the campus careers office.",
          "HR confirms your interview, reference MU-207, duties, start date and S$1,000 allowance. No payment is needed to accept the offer."
        ],
        "contactId": "employer",
        "call": true
      }
    ],
    "decisive": "independent",
    "cost": 0,
    "proceed": "Accept internship",
    "confirmText": "Accept the internship and complete a simulated approved work period. Receive S$1,000 once.",
    "success": "You completed the simulated first work period and received the agreed S$1,000 allowance.",
    "lesson": "The independently confirmed offer matched your application and interview. Receiving wages through an established payroll process is different from paying to obtain work.",
    "habit": "Verify the employer and offer through records established before the unsolicited message.",
    "sources": [
      {
        "title": "ScamShield · Job scams",
        "url": "https://www.scamshield.gov.sg/i-want-protection-from-scams/learn-to-recognise-scams/job-scams/"
      }
    ]
  },
  {
    "reward": 0,
    "employerLoss": 0,
    "reviewDate": "6 November 2026",
    "declined": "You declined the request. No money left your account.",
    "id": "office-a",
    "stage": 2,
    "scam": true,
    "channel": "mail",
    "sender": "Ethan",
    "senderEmail": "ethan@irnda.gov.sg",
    "replyTo": "ethan.office@team-mail.example",
    "initials": "E",
    "title": "Team event",
    "preview": "Could you arrange something for Friday?",
    "messages": [
      "Hi {name},",
      "Could you arrange the vouchers for Friday? I am in a meeting and need a hand.",
      "Please buy S$500 in gift cards using your own money and send me the redemption codes. I will reimburse you after.",
      "Keep this between us for now; it is a surprise for the team. Thanks, Ethan."
    ],
    "evidence": [
      {
        "id": "reply",
        "app": "mail",
        "title": "Ethan's reply",
        "origin": "Reply to this sender",
        "body": [
          "Ethan: Yes, this is for our team. Please send the codes here once you have them."
        ]
      },
      {
        "id": "agenda",
        "app": "mail",
        "title": "Friday team agenda",
        "origin": "Earlier workplace thread",
        "body": [
          "Yesterday’s discussion covered workshop timings and room arrangements.",
          "No personal gift-card purchase was discussed."
        ]
      },
      {
        "id": "independent",
        "app": "contacts",
        "title": "Ethan",
        "origin": "Saved contact",
        "body": [
          "You call Ethan using his previously saved work contact.",
          "Ethan: I did not send that request. Please do not buy gift cards or share codes. Our Friday arrangements follow the normal team approval process."
        ],
        "contactId": "ethan",
        "call": true
      }
    ],
    "decisive": "independent",
    "cost": 500,
    "proceed": "Buy S$500 gift cards",
    "confirmText": "Spend S$500 of your personal savings and send the redemption codes to this email sender.",
    "success": "Scamagotchi redeemed the codes. The S$500 was your personal money; Ethan had not authorised the request.",
    "lesson": "Display names and workplace details can be imitated. The displayed irnda.gov.sg address is a simulated lookalike, not a claim that attackers can register arbitrary gov.sg domains. Even a correct domain is not enough if an account is compromised.",
    "habit": "Confirm unusual requests through an established separate channel, especially requests for personal payment or redemption codes.",
    "sources": [
      {
        "title": "SPF · Boss impersonation and gift cards",
        "url": "https://www.police.gov.sg/Media-Hub/News/2026/01/20260128_police_advisory_on_business_email_compromise_scams_involving_the_purchase_of_gift_cards"
      }
    ]
  },
  {
    "reward": 0,
    "employerLoss": 0,
    "reviewDate": "6 November 2026",
    "declined": "You declined the request. No money left your account.",
    "id": "office-b",
    "stage": 2,
    "scam": true,
    "channel": "messages",
    "sender": "Delivery update",
    "initials": "DU",
    "title": "Parcel address confirmation",
    "preview": "Your delivery needs an address update.",
    "messages": [
      "Your parcel could not be delivered because the address is incomplete.",
      "Please confirm your delivery details and pay the S$2 re-delivery fee to avoid return to sender.",
      "Order reference IP-2048. Complete the payment form today to reschedule."
    ],
    "evidence": [
      {
        "id": "form",
        "app": "messages",
        "title": "Delivery form",
        "origin": "Link preview in this message",
        "body": [
          "Delivery address update · S$2",
          "The supplied form asks for card information and a banking OTP. No real form or credentials are collected in this game."
        ]
      },
      {
        "id": "order",
        "app": "mail",
        "title": "Your iPhone order IP-2048",
        "origin": "Original order confirmation",
        "body": [
          "Order IP-2048 · iPhone · address already confirmed",
          "Delivery has been arranged. Use the carrier details supplied with the original order for enquiries."
        ]
      },
      {
        "id": "independent",
        "app": "contacts",
        "title": "Delivery enquiries",
        "origin": "Saved contact",
        "body": [
          "You contact the carrier using the details from the original order.",
          "Carrier: Your address is complete and the parcel is scheduled for tomorrow. No re-delivery fee has been requested. Do not enter banking credentials into the supplied message link."
        ],
        "contactId": "courier",
        "call": true
      }
    ],
    "decisive": "independent",
    "cost": 2,
    "proceed": "Submit simulated payment",
    "confirmText": "Approve the simulated S$2 form. This represents sharing payment information with the linked site; do not enter any real information.",
    "success": "The S$2 form belonged to Scamagotchi. The game records S$2 spent and a simulated exposure of payment information; real phishing can cause larger unauthorised losses.",
    "lesson": "Expecting a parcel makes a delivery message feel relevant. A small fee may be a pretext for collecting payment credentials. This outcome does not imply that real losses are capped at S$2.",
    "habit": "Check the original order and carrier through an independent route instead of the payment link in a message.",
    "sources": [
      {
        "title": "SingPost · Online security",
        "url": "https://www.singpost.com/online-security-you"
      }
    ]
  },
  {
    "reward": 10000,
    "employerLoss": 0,
    "reviewDate": "6 November 2026",
    "declined": "You declined the genuine work task. No money was lost, but you missed its game reward.",
    "id": "office-c",
    "stage": 2,
    "scam": false,
    "channel": "mail",
    "sender": "Ethan",
    "senderEmail": "ethan@imda.gov.sg",
    "initials": "E",
    "title": "Friday's agenda",
    "preview": "Please update the timings we agreed.",
    "messages": [
      "Hi {name},",
      "Please update Friday’s agenda with the timings we agreed yesterday. Send the draft when you are ready.",
      "Use the normal team document and approval process. Thanks, Ethan."
    ],
    "evidence": [
      {
        "id": "reply",
        "app": "mail",
        "title": "Ethan's reply",
        "origin": "Reply in this thread",
        "body": [
          "Ethan: Yes, just the agenda update. Let me know if anything is unclear."
        ]
      },
      {
        "id": "agenda",
        "app": "mail",
        "title": "Yesterday’s meeting notes",
        "origin": "Existing workplace record",
        "body": [
          "Friday workshop: arrival 9am, programme begins 9:30am.",
          "You agreed to update the shared draft and send it to Ethan for approval."
        ]
      },
      {
        "id": "independent",
        "app": "contacts",
        "title": "Ethan",
        "origin": "Saved contact",
        "body": [
          "You call Ethan using the previously saved work contact.",
          "Ethan confirms the exact agenda task and timings from yesterday. There is no personal payment or change to the normal approval process."
        ],
        "contactId": "ethan",
        "call": true
      }
    ],
    "decisive": "independent",
    "cost": 0,
    "proceed": "Prepare agenda",
    "confirmText": "Complete the agreed simulated work task. The game awards S$10,000 once; this is a game reward, not a salary claim.",
    "success": "You prepared the agenda through the normal workflow. You received the S$10,000 game reward.",
    "lesson": "A matching sender address was one clue, not proof. Prior records and independent confirmation established that this ordinary request was authorised.",
    "habit": "Look for positive independent evidence; safety does not require rejecting every genuine request.",
    "sources": [
      {
        "title": "SPF · Boss impersonation and gift cards",
        "url": "https://www.police.gov.sg/Media-Hub/News/2026/01/20260128_police_advisory_on_business_email_compromise_scams_involving_the_purchase_of_gift_cards"
      }
    ]
  },
  {
    "reward": 0,
    "employerLoss": 0,
    "reviewDate": "6 November 2026",
    "declined": "You declined the request. No money left your account.",
    "id": "home-a",
    "stage": 3,
    "scam": true,
    "channel": "calls",
    "sender": "Unknown caller",
    "initials": "?",
    "title": "Account investigation",
    "preview": "Missed call from an unknown caller",
    "messages": [
      "This is an officer following up on an account investigation.",
      "Keep your funds available while we send further instructions."
    ],
    "callTranscript": [
      "Caller: Hello {name}. I am calling about suspected misuse of an account linked to your identity.",
      "Caller: This matter is confidential while we investigate. Please do not discuss it with others yet.",
      "Caller: Move S$20,000 to the account we provide so the funds can be checked. You will get it back once the review is complete."
    ],
    "followUp": [
      "Following our call: please transfer S$20,000 to the account provided for the investigation.",
      "Reply here when complete. The officer will update your case."
    ],
    "evidence": [
      {
        "id": "caller",
        "app": "calls",
        "title": "Caller’s explanation",
        "origin": "Incoming caller",
        "body": [
          "Caller: The account is authorised for the investigation. You do not need to call anyone else."
        ]
      },
      {
        "id": "independent",
        "app": "contacts",
        "title": "Official enquiries",
        "origin": "Saved contact",
        "body": [
          "You end the incoming contact and use the independently saved directory entry.",
          "Official enquiries: Government officials do not require a transfer to a safe or investigation account over a phone call. Do not transfer money or share banking credentials."
        ],
        "contactId": "official",
        "call": true
      }
    ],
    "decisive": "independent",
    "cost": 20000,
    "proceed": "Transfer S$20,000",
    "confirmText": "Transfer S$20,000 of simulated personal savings to the account supplied by the caller.",
    "success": "The transfer went to Scamagotchi. There was no authorised investigation account.",
    "lesson": "Authority, confidentiality and fear were used to isolate you. A convincing name, caller ID or case reference does not make a government demand for money valid.",
    "habit": "End the contact and check through an independently obtained official route. Never move funds on a caller’s safe-account instructions.",
    "sources": [
      {
        "title": "ScamShield · Government impersonation",
        "url": "https://www.scamshield.gov.sg/i-want-protection-from-scams/learn-to-recognise-scams/government-officials-impersonation-scams/"
      }
    ]
  },
  {
    "reward": 0,
    "employerLoss": 0,
    "reviewDate": "6 November 2026",
    "declined": "You declined the request. No money left your account.",
    "id": "home-b",
    "stage": 3,
    "scam": true,
    "channel": "calls",
    "sender": "Unknown mobile",
    "initials": "?",
    "title": "A friend needs help",
    "preview": "A caller says they know you.",
    "messages": [
      "Hey {name}, it is Ravi. This is my new number.",
      "Can help me with a short loan? I will explain."
    ],
    "callTranscript": [
      "Caller: Eh {name}, you recognise my voice? We meet for coffee one.",
      "Caller: Yes, Ravi lah. My old phone stopped working, so save this number.",
      "Caller: My banking app is not working. Can lend me S$10,000 first? I will return it tomorrow. I will send the account details."
    ],
    "followUp": [
      "It is Ravi — the number I called from just now.",
      "Can transfer S$10,000 to the account I sent? I need to settle something today. I will pay you back tomorrow."
    ],
    "evidence": [
      {
        "id": "caller",
        "app": "calls",
        "title": "Caller’s explanation",
        "origin": "Incoming caller",
        "body": [
          "Caller: We know each other so long already. Just use the new number; the old one is not working."
        ]
      },
      {
        "id": "reply",
        "app": "messages",
        "title": "Ravi's reply",
        "origin": "Reply to the new number",
        "body": [
          "Sender: Yes, it is me. I will see you at coffee next week."
        ]
      },
      {
        "id": "independent",
        "app": "contacts",
        "title": "Ravi",
        "origin": "Saved contact",
        "body": [
          "You call Ravi’s original number from Contacts, not the number in the request.",
          "Ravi answers. He has not changed his number and did not ask for a loan."
        ],
        "contactId": "ravi",
        "call": true
      }
    ],
    "decisive": "independent",
    "cost": 10000,
    "proceed": "Lend S$10,000",
    "confirmText": "Transfer S$10,000 from your simulated savings to the account provided by this caller.",
    "success": "The loan went to Scamagotchi. The real Ravi knew nothing about it.",
    "lesson": "The caller adopted a familiar identity and offered an explanation for a new contact route. Familiarity, shared routines and a convincing voice do not confirm a money request.",
    "habit": "Use the original saved contact to confirm who is asking, why, how much and where the money is going.",
    "sources": [
      {
        "title": "SPF · Fake-friend loan scams",
        "url": "https://www.police.gov.sg/media-hub/news/2023/20230830_police_advisory_on_persistent_scam_variant_involving_fake_friends"
      }
    ]
  },
  {
    "reward": 0,
    "employerLoss": 0,
    "reviewDate": "6 November 2026",
    "declined": "You declined the confirmed class contribution. That is a personal choice, not a safety failure.",
    "id": "home-c",
    "stage": 3,
    "scam": false,
    "channel": "calls",
    "sender": "Ravi",
    "initials": "R",
    "title": "Community class booking",
    "preview": "Ravi is calling about your class booking.",
    "messages": [
      "Hi {name}, calling about the community class booking.",
      "The group contribution is S$200 if you would still like to join."
    ],
    "callTranscript": [
      "Ravi: Hi {name}, free to talk? It is about the community class we discussed at coffee.",
      "Ravi: I can book the group places. Your contribution is S$200.",
      "Ravi: Check the details and call me back when convenient. No problem if you decide not to join."
    ],
    "followUp": [
      "The community class contribution is S$200, as we discussed.",
      "Call me when convenient if you want to confirm the booking. You can also sit this one out."
    ],
    "evidence": [
      {
        "id": "class",
        "app": "mail",
        "title": "Community class information",
        "origin": "Earlier group information",
        "body": [
          "Your coffee group discussed booking the Saturday community class.",
          "Each participant’s contribution is S$200. Ravi offered to coordinate the booking."
        ]
      },
      {
        "id": "independent",
        "app": "contacts",
        "title": "Ravi",
        "origin": "Saved contact",
        "body": [
          "You independently call Ravi using the original saved number.",
          "Ravi confirms the class, S$200 contribution and the receiving details. They match your earlier group plans. You may help or decline."
        ],
        "contactId": "ravi",
        "call": true
      }
    ],
    "decisive": "independent",
    "cost": 200,
    "proceed": "Contribute S$200",
    "confirmText": "Contribute S$200 of simulated savings toward the community class booking.",
    "success": "Ravi received the contribution and confirmed your class place. The request was genuine.",
    "lesson": "You established a separate route and checked the exact request. Recognising Ravi’s voice alone would not have been decisive.",
    "habit": "Confirm a request’s purpose, amount and receiving details through an established contact route.",
    "sources": [
      {
        "title": "SPF · Fake-friend loan scams",
        "url": "https://www.police.gov.sg/media-hub/news/2023/20230830_police_advisory_on_persistent_scam_variant_involving_fake_friends"
      }
    ]
  }
];

export const CASES: Record<string, EncounterVariant> = Object.fromEntries(ENCOUNTERS.map(e => [e.id, e]));
export const money = (cents: number) => (cents / 100).toLocaleString('en-SG', { maximumFractionDigits: 2 });
export const shortMoney = (cents: number) => cents >= 100000000 ? `${(cents / 100000000).toFixed(1)}m` : cents >= 100000 ? `${(cents / 100000).toFixed(1)}k` : money(cents);

