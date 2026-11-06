import type { EncounterVariant, Source } from './content';

const groomingSource: Source = {
  title: 'IMDA Digital for Life · Recognising online grooming',
  url: 'https://www.digitalforlife.gov.sg/learn/resources/all-resources/how-to-protect-my-child-from-online-sexual-grooming',
};
const bullyingSource: Source = {
  title: 'HPB Parenting for Wellness · Supporting someone being cyberbullied',
  url: 'https://parentingforwellness.hpb.gov.sg/Module-11/Topic-11A/Cyberbullying-and-ways-to-support-your-child-if-they-are-a-victim',
};
const supportSource: Source = {
  title: 'Online Safety Commission · Reaching out for help and support',
  url: 'https://www.osc.gov.sg/learn-about-online-safety/adults/reaching-out-for-help-and-support/',
};
const bystanderSource: Source = {
  title: 'Online Safety Commission · Supporting others facing online harassment',
  url: 'https://www.osc.gov.sg/learn-about-online-safety/adults/practise-good-netiquette-and-be-an-upstander-to-prevent-online-harassment/',
};
const helpSource: Source = {
  title: 'MSF Family Assist · Abuse support and emergency help',
  url: 'https://familyassist.msf.gov.sg/content/making-decisions/seeking-safety/getting-help/support-services-available/',
};

// `scam` remains the legacy unsafe-request flag. `harm` supplies the accurate
// online-safety category; these encounters never cost or award money.
export const YOUTH_ENCOUNTERS: EncounterVariant[] = [
  {
    id: 'school-grooming', stage: 0, harm: 'grooming', scam: true,
    channel: 'messages', sender: 'Kai · Game squad', initials: 'K',
    title: 'After the match', preview: 'Want to chat after the next match?',
    messages: [
      'Hey {name}, you played well again. I like talking with you more than the rest of the squad.',
      'Let’s move to a private chat. Your parents and teacher would not understand our friendship, so keep it between us.',
      'Send a personal photo just for me to show you trust me. After all the help I gave you, don’t let me down.',
    ],
    evidence: [
      {
        id: 'history', app: 'messages', title: 'Earlier squad messages', origin: 'Saved chat history',
        body: [
          'Kai previously said they were an adult. Over several weeks they offered game tips and special attention.',
          'The conversation has shifted from playing together to secrecy, private contact and pressure for a personal photo.',
        ],
      },
      {
        id: 'reply', app: 'messages', title: 'Kai’s reply', origin: 'Reply in this conversation',
        body: ['Kai: If you tell anyone, they will stop us talking. You can trust only me with this.'],
      },
      {
        id: 'independent', app: 'contacts', title: 'Ms Tan', origin: 'Saved school counsellor contact',
        contactId: 'school-counsellor', call: true,
        body: [
          'Ms Tan: Thank you for telling me. An adult asking a 15-year-old for secrecy and private photos is a warning sign. You owe them neither photos nor continued contact.',
          'Keep the messages and account details if safe. Do not forward private images. We can involve a trusted adult and get help with blocking, platform reporting and any police report needed.',
          'Even if you already replied or shared something, the pressure is not your fault. You can still ask for help.',
        ],
      },
    ],
    decisive: 'independent', cost: 0, reward: 0, employerLoss: 0,
    proceed: 'Continue the private chat',
    confirmText: 'Continue this fictional conversation despite the pressure. No message or photo is sent, and no upload is requested.',
    success: 'The private conversation brings more pressure to keep secrets. You can stop and ask for help at any point. The person applying the pressure is responsible; trusting them does not make this your fault.',
    declined: 'You stopped the conversation. A trusted adult or school counsellor can help preserve the messages and plan what to do next, even if you replied earlier.',
    lesson: 'Building trust before pushing secrecy, isolation and private-photo requests can be a grooming pattern. You do not have to prove someone’s intentions before seeking support.',
    habit: 'Pause contact and tell a trusted adult. Preserve messages safely; do not share private images to explain what happened.',
    sources: [groomingSource, helpSource], reviewDate: '6 November 2026',
  },
  {
    id: 'school-bullying', stage: 0, harm: 'cyberbullying', scam: true,
    channel: 'messages', sender: 'Jordan · Class project chat', initials: 'J',
    title: 'Group chat update', preview: 'New messages in the project chat.',
    messages: [
      'Jordan has reposted an edited clip of your presentation with a mocking caption. Several people add laughing reactions.',
      'Another message says: We’re posting this in the other class chat too. It’s only a joke.',
      'A classmate adds: Go on, post a comeback about them. Everyone is watching.',
    ],
    evidence: [
      {
        id: 'history', app: 'messages', title: 'Earlier posts', origin: 'Project chat history',
        body: [
          'The same edited clip has been posted on three days, including after you asked for it to stop. The clip is described here, not displayed.',
          'Your classmate Maya privately asks whether you would like her to sit with you and speak to a teacher together.',
        ],
      },
      {
        id: 'independent', app: 'contacts', title: 'Ms Tan', origin: 'Saved school counsellor contact',
        contactId: 'school-counsellor', call: true,
        body: [
          'Ms Tan: Repeated humiliation is not made harmless by calling it a joke. You did not cause or deserve it. You do not have to argue back.',
          'Save the post links, account names and message times if safe. Mute or block the accounts, use the platform report tool and tell a trusted adult. I can help involve your form teacher.',
          'If you witness this happening to someone else, check in privately and offer support. Do not like, forward or pile onto the posts.',
        ],
      },
    ],
    decisive: 'independent', cost: 0, reward: 0, employerLoss: 0,
    proceed: 'Post an insulting comeback',
    confirmText: 'Simulate posting an insulting comeback in the fictional chat. Nothing is posted outside the game.',
    success: 'The argument grows in the fictional chat. You still deserve support, and being bullied was never your fault. Step away, keep the evidence safely and ask someone you trust to help.',
    declined: 'You stepped away instead of joining the argument. You can still keep the post details, report the content and ask Maya or a trusted adult to support you.',
    lesson: 'Repeated targeting, humiliating edits and unwanted sharing are cyberbullying. A person being targeted needs support, not blame or pressure to fight back.',
    habit: 'Pause, save evidence safely, mute or block, and seek support. As a bystander, check in privately and avoid spreading the abuse.',
    sources: [bullyingSource, bystanderSource], reviewDate: '6 November 2026',
  },
  {
    id: 'uni-grooming', stage: 1, harm: 'grooming', scam: true,
    channel: 'messages', sender: 'Rowan · Portfolio mentor', initials: 'R',
    title: 'Portfolio follow-up', preview: 'I have some ideas for your portfolio.',
    messages: [
      'Hi {name}, your portfolio has potential. I can introduce you to people who choose interns.',
      'Let’s keep our sessions off the campus channels. Your adviser will only slow things down, so don’t involve them.',
      'I need a personal photo, just for me, before I put in a recommendation. If you trusted my help, you would not make this difficult.',
    ],
    evidence: [
      {
        id: 'history', app: 'messages', title: 'Mentoring messages', origin: 'Earlier conversation',
        body: [
          'At first Rowan gave ordinary portfolio advice. Later messages demanded private contact and treated access to opportunities as conditional on personal attention.',
          'You already said you wanted to keep the mentoring professional. Rowan continued pushing for a private photo.',
        ],
      },
      {
        id: 'independent', app: 'contacts', title: 'Campus Wellbeing', origin: 'Saved student-support contact',
        contactId: 'campus-wellbeing', call: true,
        body: [
          'Student support: Help with your career does not create a debt of personal attention or photos. Ignoring your boundary and using a recommendation as pressure is coercive behaviour.',
          'You can pause contact and keep the messages and account details. We can discuss support and reporting options with you, including involving your careers adviser.',
          'You are 22 in this chapter. This scenario concerns coercive adult mentorship and boundary manipulation; it does not label the conduct as the legal offence of child grooming.',
        ],
      },
    ],
    decisive: 'independent', cost: 0, reward: 0, employerLoss: 0,
    proceed: 'Continue on Rowan’s terms',
    confirmText: 'Simulate continuing the fictional private mentoring chat. No photo, message or personal information is sent.',
    success: 'Rowan keeps making professional help conditional on private attention. You can withdraw from the conversation and seek support now. Their misuse of trust is not your fault, even if you agreed earlier.',
    declined: 'You paused the mentoring conversation. Campus Wellbeing or your careers adviser can help you consider safe support and reporting options without contacting Rowan alone.',
    lesson: 'Secrecy, isolation and pressure can occur in adult relationships too. At 22, this scenario teaches recognition of coercive mentorship, not the legal definition of child grooming.',
    habit: 'Treat your boundaries as valid. Keep relevant messages safely and speak to a trusted person or campus support before continuing under pressure.',
    sources: [supportSource, helpSource], reviewDate: '6 November 2026',
  },
  {
    id: 'uni-bullying', stage: 1, harm: 'cyberbullying', scam: true,
    channel: 'messages', sender: 'Dev · Course group chat', initials: 'D',
    title: 'A post from the course group', preview: 'Have you seen the latest group post?',
    messages: [
      'Dev has posted a cropped screenshot of your coursemate Aisha’s message, making it look as though she refused to help with a project.',
      'The post tags her repeatedly and asks everyone to leave her out of the next group. Aisha has asked for it to be removed.',
      'A group member writes: Forward this to the other course chats so everyone sees it.',
    ],
    evidence: [
      {
        id: 'original', app: 'messages', title: 'Full project conversation', origin: 'Earlier group chat',
        body: [
          'The full message says Aisha could not attend one meeting but offered to finish her section the next morning. The shared crop omitted that offer.',
          'Aisha says the repeated tags are upsetting and asks a friend to help. The abusive post is summarised here, not reproduced.',
        ],
      },
      {
        id: 'independent', app: 'contacts', title: 'Campus Wellbeing', origin: 'Saved student-support contact',
        contactId: 'campus-wellbeing', call: true,
        body: [
          'Student support: Do not forward the post or join the pile-on. Check in with Aisha privately and ask what support she wants. You can offer to accompany her to a support appointment.',
          'Keep the post link, account name, dates and relevant messages safely for a report. Use platform tools and the campus support route; avoid publishing the evidence to another audience.',
          'If you are the person being targeted, you deserve the same support. You can mute or block contact and get help without defending yourself in the group.',
        ],
      },
    ],
    decisive: 'independent', cost: 0, reward: 0, employerLoss: 0,
    proceed: 'Forward the group post',
    confirmText: 'Simulate forwarding the fictional post to another course chat. No real content is sent.',
    success: 'The fictional post reaches more people and increases the unwanted attention on Aisha. You can stop sharing, remove your repost where possible and offer her support without repeating the abuse.',
    declined: 'You did not amplify the post. A private check-in with Aisha and an offer to help with platform or campus reporting can make support easier to reach.',
    lesson: 'A cropped message, repeated tagging and deliberate exclusion can fuel cyberbullying. Forwarding abuse to condemn it can still widen its audience.',
    habit: 'Support the person privately, keep evidence safely and report through appropriate channels. Do not forward, like or pile onto harmful posts.',
    sources: [bystanderSource, supportSource], reviewDate: '6 November 2026',
  },
];
