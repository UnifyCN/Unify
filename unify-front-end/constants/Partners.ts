import type { Partner, PartnerCategory } from '@/types/partner';
import { CATEGORY_ORDER } from '@/types/partner';

/**
 * Partner directory. Hardcoded for V1 (initial outreach stage).
 *
 * To add a partner: append to its category group, set active: true, bump
 * displayOrder. Add a `logo` / `heroImage` require() when real assets arrive
 * (UI falls back to a monogram + tinted gradient until then).
 *
 * Migration note: when partner count reaches ~5 per category OR content edits
 * ship more than weekly, migrate to Sanity (the Partner shape maps 1:1). May
 * later merge into the Service Map `services` pipeline (DOCS/tickets/04-service-map.md).
 */
export const PARTNERS: Partner[] = [
  // ── Newcomer Services ───────────────────────────────────────────────
  {
    slug: 'amssa',
    name: 'AMSSA',
    category: 'newcomerServices',
    partnershipType: 'resource',
    tagline: "The backbone supporting BC's newcomer-serving agencies.",
    description:
      'The Affiliation of Multicultural Societies and Service Agencies of BC is a provincial umbrella organization that strengthens the settlement and diversity sector — providing training, resources, e-learning, and advocacy for the agencies serving newcomers across BC.',
    highlights: [
      'Sector-wide training & e-learning',
      'Resources for newcomer-serving agencies',
      'Province-wide reach across BC',
    ],
    location: 'British Columbia',
    websiteUrl: 'https://www.amssa.org/',
    displayOrder: 0,
    active: true,
  },
  {
    slug: 'burnaby-neighbourhood-house',
    name: 'Burnaby Neighbourhood House',
    category: 'newcomerServices',
    partnershipType: 'resource',
    tagline: 'Community programs, childcare, and newcomer support in Burnaby.',
    description:
      'Burnaby Neighbourhood House helps people enhance their lives and strengthen their community through programs built around the changing needs of a diverse population — childcare, family and food security, and dedicated newcomer support.',
    highlights: [
      'Newcomer settlement support',
      'Childcare & family programs',
      'Food security initiatives',
    ],
    location: 'Burnaby',
    websiteUrl: 'https://burnabynh.ca/',
    displayOrder: 1,
    active: true,
  },
  {
    slug: 'diversecity',
    name: 'DIVERSEcity',
    category: 'newcomerServices',
    partnershipType: 'resource',
    tagline: 'Culturally safe programs across education, employment & wellbeing.',
    description:
      'DIVERSEcity Community Resources Society is a BC-registered charity (since 1978) that connects newcomers to culturally safe programs across education, employment, health, and wellbeing — the on-the-ground service arm for immigrant and refugee support in Greater Vancouver.',
    highlights: [
      'Culturally safe settlement programs',
      'Education, employment & health support',
      'Serving immigrants & refugees since 1978',
    ],
    location: 'Greater Vancouver',
    websiteUrl: 'https://www.dcrs.ca/',
    displayOrder: 2,
    active: true,
  },
  {
    slug: 'ymca-bc',
    name: 'YMCA BC',
    category: 'newcomerServices',
    partnershipType: 'resource',
    tagline: 'Programs for families, children, and seniors across BC.',
    description:
      'YMCA BC supports families, children, and seniors in communities across British Columbia, building vibrant and healthy communities with a shared sense of social responsibility where people can thrive in spirit, mind, and body.',
    highlights: [
      'Programs for all ages',
      'Health & wellness focus',
      'Communities across BC',
    ],
    location: 'British Columbia',
    websiteUrl: 'https://www.ymcabc.ca/',
    displayOrder: 3,
    active: true,
  },
  {
    slug: 'surrey-lip',
    name: 'Surrey Local Immigration Partnership',
    category: 'newcomerServices',
    partnershipType: 'resource',
    tagline: '30+ organizations coordinating newcomer integration in Surrey.',
    description:
      'An IRCC-funded, multi-stakeholder council that brings together 30+ community organizations to develop collaborative, research-driven strategies for newcomer integration in Surrey. Managed by DIVERSEcity, it also offers tools like a services map and a racism-reporting tool.',
    highlights: [
      'Coordinates 30+ local organizations',
      'Services map for newcomers',
      'Racism-reporting tool',
    ],
    location: 'Surrey',
    websiteUrl: 'https://www.surreylip.ca/',
    displayOrder: 4,
    active: true,
  },

  // ── Employment & Careers ────────────────────────────────────────────
  {
    slug: 'iec-bc',
    name: 'Immigrant Employment Council of BC',
    category: 'employment',
    partnershipType: 'resource',
    tagline: 'Helping BC employers hire and retain immigrant talent.',
    description:
      'The Immigrant Employment Council of BC works on the employer side of immigrant integration — helping BC businesses recruit, hire, and retain skilled immigrant talent through mentorship programs, job boards, and employer education.',
    highlights: [
      'Mentorship programs',
      'Job boards for newcomers',
      'Employer education',
    ],
    location: 'British Columbia',
    websiteUrl: 'https://iecbc.ca/',
    programs: [
      {
        name: 'MentorConnect',
        description:
          'One-on-one, occupation-specific coaching that pairs job-ready newcomers with established local professionals.',
        url: 'https://iecbc.ca/our-work/programs/mentorconnect/',
      },
      {
        name: 'TalentConnect',
        description:
          'Connects BC employers with globally trained professionals through tailored hiring and networking opportunities.',
        url: 'https://iecbc.ca/our-work/programs/talentconnect/',
      },
      {
        name: 'ASCEND',
        description:
          'Online, self-paced learning to build the workplace soft skills Canadian employers look for (English & French).',
        url: 'https://ascendemployment.com/participants/',
      },
      {
        name: 'FAST',
        description:
          'Helps newcomers see how their experience and training meet Canadian standards, with career-prep streams by field.',
        url: 'https://fastcanada.ca/',
      },
    ],
    displayOrder: 0,
    active: true,
  },
  {
    slug: 'newcomer-jobs-canada',
    name: 'Newcomer Jobs Canada',
    category: 'employment',
    partnershipType: 'resource',
    tagline: 'A job board built for newcomers to Canada.',
    description:
      'Newcomer Jobs Canada is a dedicated job board connecting newcomers to Canada with employment opportunities across the country, making the job search more accessible for those starting their Canadian journey.',
    highlights: [
      'Newcomer-focused job board',
      'Opportunities across Canada',
      'Easier job search for new arrivals',
    ],
    location: 'Canada',
    websiteUrl: 'https://newcomerjobscanada.ca/',
    displayOrder: 1,
    active: true,
  },
  {
    slug: 'anutio',
    name: 'Anutio',
    category: 'employment',
    partnershipType: 'referral',
    tagline: 'AI-driven job matching, skill mapping, and on-demand learning.',
    description:
      'Anutio is an all-in-one career development platform that combines AI-driven job matching, skill mapping, and on-demand learning to help people develop their skills, grow, and find the right roles.',
    highlights: ['AI-powered job matching', 'Skill mapping', 'On-demand learning'],
    location: 'Online',
    websiteUrl: 'https://www.anutio.com/',
    displayOrder: 2,
    active: true,
  },

  // ── Libraries ───────────────────────────────────────────────────────
  {
    slug: 'burnaby-public-library',
    name: 'Burnaby Public Library',
    category: 'libraries',
    partnershipType: 'resource',
    tagline: 'Inclusive spaces to gather, learn, and play.',
    description:
      'Burnaby Public Library creates inclusive spaces where people can gather, learn, and play across four branches — free programs, resources, and places to connect.',
    highlights: [
      'Free programs & resources',
      '4 branches across Burnaby',
      'Welcoming spaces to learn',
    ],
    location: 'Burnaby · 4 branches',
    websiteUrl: 'https://bpl.bc.ca/',
    displayOrder: 0,
    active: true,
  },
  {
    slug: 'surrey-libraries',
    name: 'Surrey Libraries',
    category: 'libraries',
    partnershipType: 'resource',
    tagline: 'Sparking curiosity and lifelong learning.',
    description:
      'Surrey Libraries connects people, sparks curiosity, and inspires lifelong learning to enhance the lives of Surrey residents across ten branches.',
    highlights: [
      'Free lifelong-learning programs',
      '10 branches across Surrey',
      'Connecting the community',
    ],
    location: 'Surrey · 10 branches',
    websiteUrl: 'https://www.surreylibraries.ca/',
    displayOrder: 1,
    active: true,
  },
  {
    slug: 'vancouver-public-library',
    name: 'Vancouver Public Library',
    category: 'libraries',
    partnershipType: 'resource',
    tagline: 'Free places to discover, create, and share.',
    description:
      'Vancouver Public Library has served the lifelong learning, reading, and information needs of Vancouver residents for over 100 years across 21 branches — free places for everyone to discover, create, and share ideas and information.',
    highlights: [
      'Free for all residents',
      '21 branches across Vancouver',
      '100+ years serving the city',
    ],
    location: 'Vancouver · 21 branches',
    websiteUrl: 'https://www.vpl.ca/',
    displayOrder: 2,
    active: true,
  },

  // ── Community & Nonprofits ──────────────────────────────────────────
  {
    slug: 'big-brothers-big-sisters',
    name: 'Big Brothers Big Sisters',
    category: 'community',
    partnershipType: 'resource',
    tagline: 'Life-changing mentoring for young people.',
    description:
      'Big Brothers Big Sisters champions the health and wellbeing of youth by providing life-changing mentoring experiences, ensuring children and teens are supported by caring adult role models.',
    highlights: [
      '1:1 youth mentoring',
      "Supporting children's wellbeing",
      'Caring adult role models',
    ],
    location: 'Canada',
    websiteUrl: 'https://bigbrothersbigsisters.ca/',
    displayOrder: 0,
    active: true,
  },
  {
    slug: 'united-way-bc',
    name: 'United Way BC',
    category: 'community',
    partnershipType: 'resource',
    tagline: 'Support for the people who need it most across BC.',
    description:
      "United Way BC serves over five million British Columbians, delivering resources and support where they're needed most — emergency response, children & youth, seniors, poverty, mental health, and food security.",
    highlights: [
      'Emergency & poverty support',
      'Programs for children, youth & seniors',
      'Mental health & food security',
    ],
    location: 'British Columbia',
    websiteUrl: 'https://uwbc.ca/',
    displayOrder: 1,
    active: true,
  },
  {
    slug: 'trout-lake-community-centre',
    name: 'Trout Lake Community Centre',
    category: 'community',
    partnershipType: 'resource',
    tagline: '200+ programs for people of all ages.',
    description:
      'Trout Lake Community Centre offers more than 200 programs for people of all ages — a welcoming neighbourhood hub in East Vancouver run in partnership with the Vancouver Park Board.',
    highlights: [
      '200+ community programs',
      'Activities for all ages',
      'A neighbourhood gathering place',
    ],
    location: 'Vancouver',
    websiteUrl: 'https://troutlakecc.com/',
    displayOrder: 2,
    active: true,
  },

  // ── Immigration ─────────────────────────────────────────────────────
  {
    slug: 'canada-shaw-immigration',
    name: 'Canada Shaw Immigration Consultancy',
    category: 'immigration',
    partnershipType: 'referral',
    tagline: 'CICC-licensed firm for Express Entry, permits, and LMIA.',
    description:
      'A Richmond-based, CICC-licensed immigration consulting firm (est. 2015) offering full-service support — Express Entry, study and work permits, and LMIA applications — with bilingual English and Chinese service.',
    highlights: [
      'CICC-licensed consultants',
      'Express Entry, permits & LMIA',
      'Bilingual English / 中文',
    ],
    location: 'Richmond',
    websiteUrl: 'https://canadashaws.ca/',
    displayOrder: 0,
    active: true,
  },
  {
    slug: 'global-connect-immigration',
    name: 'Global Connect Immigration',
    category: 'immigration',
    partnershipType: 'referral',
    tagline: 'Registered consultancy for PR, visas, and settlement.',
    description:
      'Global Connect is a registered Canadian immigration consulting firm helping newcomers navigate permanent residency pathways, visa processes, and settlement planning with expert, personalized guidance.',
    highlights: [
      'PR pathway guidance',
      'Visa & work-permit support',
      'Personalized settlement planning',
    ],
    location: 'Surrey',
    websiteUrl: 'https://globalconnectmigration.com/',
    displayOrder: 1,
    active: true,
  },
];

/** Active partners only, sorted by displayOrder. */
export const getActivePartners = (): Partner[] =>
  PARTNERS.filter(p => p.active).sort((a, b) => a.displayOrder - b.displayOrder);

/** Active partners in a category, sorted by displayOrder. */
export const getPartnersByCategory = (category: PartnerCategory): Partner[] =>
  getActivePartners().filter(p => p.category === category);

/** A single partner by slug (any active state), for the detail route. */
export const getPartnerBySlug = (slug: string): Partner | undefined =>
  PARTNERS.find(p => p.slug === slug);

/**
 * Categories that have ≥1 active partner, in CATEGORY_ORDER, with counts.
 * Empty categories are omitted.
 */
export const getCategoriesWithPartners = (): {
  category: PartnerCategory;
  partnerCount: number;
}[] => {
  const counts = new Map<PartnerCategory, number>();
  for (const p of getActivePartners()) {
    counts.set(p.category, (counts.get(p.category) ?? 0) + 1);
  }
  return CATEGORY_ORDER.filter(c => counts.has(c)).map(category => ({
    category,
    partnerCount: counts.get(category)!,
  }));
};
