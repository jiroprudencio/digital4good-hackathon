export type Gender = 'woman' | 'man' | 'non-binary' | 'unspecified';
export interface Character {
  name: string;
  gender: Gender;
  skinTone: number;
}
export const SKIN_TONES = [
  '#f5d4b5',
  '#e9b88b',
  '#cb925e',
  '#a86e40',
  '#7b4c30',
  '#4e2e22',
] as const;
export const GENDERS: { value: Gender; label: string }[] = [
  { value: 'woman', label: 'Woman' },
  { value: 'man', label: 'Man' },
  { value: 'non-binary', label: 'Non-binary' },
  { value: 'unspecified', label: 'Prefer not to say' },
];
export const DEFAULT_CHARACTER: Character = { name: 'Jiro', gender: 'unspecified', skinTone: 3 };
export function normaliseCharacter(character: Partial<Character> = {}): Character {
  const name =
    typeof character.name === 'string'
      ? Array.from(character.name.trim().replace(/\s+/g, ' ')).slice(0, 24).join('')
      : '';
  return {
    name: name || DEFAULT_CHARACTER.name,
    gender: GENDERS.some((g) => g.value === character.gender) ? character.gender! : 'unspecified',
    skinTone:
      Number.isInteger(character.skinTone) &&
      character.skinTone! >= 0 &&
      character.skinTone! < SKIN_TONES.length
        ? character.skinTone!
        : DEFAULT_CHARACTER.skinTone,
  };
}
export interface ProfileContact {
  id: string;
  name: string;
  relationship: string;
  phone: string;
  email?: string;
  note: string;
}
export interface StageProfile {
  age: number;
  role: string;
  organisation?: string;
  goals: string[];
  contacts: ProfileContact[];
}
export const STAGE_PROFILES: StageProfile[] = [
  {
    age: 15,
    role: 'Student',
    goals: ['Planning a concert with Maya', 'Collecting trading cards'],
    contacts: [
      {
        id: 'maya',
        name: 'Maya',
        relationship: 'Concert friend',
        phone: '•••• 1638',
        note: 'You agreed to find two tickets for Saturday together.',
      },
      {
        id: 'wei',
        name: 'Wei',
        relationship: 'Classmate',
        phone: '•••• 2946',
        note: 'Your trading-card club meets after class on Wednesdays.',
      },
      {
        id: 'organiser',
        name: 'Harbour Live',
        relationship: 'Concert organiser',
        phone: '•••• 3150',
        note: 'Box office saved when you first checked the event listing.',
      },
      {
        id: 'school-teacher',
        name: 'Mr Lee',
        relationship: 'Form teacher',
        phone: 'Simulated school line',
        note: 'A trusted adult you can approach about online worries. Contact saved from your school handbook; no real call is made.',
      },
      {
        id: 'school-counsellor',
        name: 'Ms Tan',
        relationship: 'School counsellor',
        phone: 'Simulated school line',
        note: 'Listens without blaming you and helps plan support. Saved from your school handbook; no real call is made.',
      },
    ],
  },
  {
    age: 22,
    role: 'Student',
    organisation: 'Meranti University',
    goals: ['Semester fees due this month', 'Applying for internships'],
    contacts: [
      {
        id: 'finance',
        name: 'Campus Finance',
        relationship: 'Fee enquiries',
        phone: '•••• 1200',
        email: 'finance@meranti.example',
        note: 'Saved from your university welcome pack.',
      },
      {
        id: 'careers',
        name: 'Nadia',
        relationship: 'Careers adviser',
        phone: '•••• 1230',
        email: 'careers@meranti.example',
        note: 'Your adviser helped submit application MU-207.',
      },
      {
        id: 'employer',
        name: 'Linden Studio HR',
        relationship: 'Internship employer',
        phone: '•••• 4300',
        email: 'hr@linden.example',
        note: 'Contact supplied by the campus careers office before your application.',
      },
      {
        id: 'campus-wellbeing',
        name: 'Campus Wellbeing',
        relationship: 'Student support',
        phone: 'Simulated campus line',
        email: 'wellbeing@meranti.example',
        note: 'Support for boundaries, harassment and looking out for a friend. Saved from your welcome pack; this fictional service makes no real call.',
      },
    ],
  },
  {
    age: 35,
    role: 'Programme executive',
    organisation: 'IMDA',
    goals: ['Preparing a team event', 'Waiting for an iPhone delivery'],
    contacts: [
      {
        id: 'ethan',
        name: 'Ethan',
        relationship: 'Manager',
        phone: '•••• 7250',
        email: 'ethan@imda.gov.sg',
        note: 'Your manager. You discussed Friday’s agenda yesterday. Fictional employee.',
      },
      {
        id: 'alyssa',
        name: 'Alyssa',
        relationship: 'Colleague',
        phone: '•••• 7260',
        note: 'Works on your programme team.',
      },
      {
        id: 'courier',
        name: 'Delivery enquiries',
        relationship: 'Carrier contact',
        phone: '•••• 4410',
        note: 'Saved from your original order confirmation. Order IP-2048.',
      },
    ],
  },
  {
    age: 65,
    role: 'Retired',
    goals: ['Thursday coffee with friends', 'Joining a community class'],
    contacts: [
      {
        id: 'ravi',
        name: 'Ravi',
        relationship: 'Coffee friend',
        phone: '•••• 4821',
        note: 'Usually meets you at 9am on Thursdays. You have used this number for years.',
      },
      {
        id: 'mei',
        name: 'Mei',
        relationship: 'Neighbour',
        phone: '•••• 6138',
        note: 'You are joining the community class together.',
      },
      {
        id: 'official',
        name: 'Official enquiries',
        relationship: 'Government directory',
        phone: 'Simulated official line',
        note: 'Independent directory entry established before the incoming call. This game makes no real calls.',
      },
    ],
  },
];
export function availableContacts(stage: number): ProfileContact[] {
  return STAGE_PROFILES.slice(0, stage + 1).flatMap((p) => p.contacts);
}
