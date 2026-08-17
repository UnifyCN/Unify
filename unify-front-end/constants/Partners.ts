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
  // ── Getting Settled ─────────────────────────────────────────────────────
  {
    slug: 'diversecity',
    name: 'DIVERSEcity',
    category: 'gettingSettled',
    partnershipType: 'resource',
    tagline:
      'Culturally safe programs across education, employment & wellbeing.',
    description:
      'DIVERSEcity Community Resources Society is a BC-registered charity (since 1978) that connects newcomers to culturally safe programs across education, employment, health, and wellbeing — the on-the-ground service arm for immigrant and refugee support in Greater Vancouver.',
    highlights: [
      'Culturally safe settlement programs',
      'Education, employment & health support',
      'Serving immigrants & refugees since 1978',
    ],
    serviceArea: 'Greater Vancouver',
    website: 'https://www.dcrs.ca/',
    howToStart:
      'For settlement services, email newcomers@dcrs.ca or call 604-507-6060. General enquiries: 604-597-0205.',
    phone: '604-597-0205',
    email: 'info@dcrs.ca',
    address: '13455 76 Avenue, Surrey, BC V3W 2W3',
    programs: [
      {
        id: 'diversecity-settlement-services',
        name: 'Settlement Services',
        description:
          'Help with settling in, from housing navigation to connecting with community supports.',
        eligibility:
          'Permanent residents, refugees and protected persons through IRCC funding; temporary residents, international students, naturalized citizens and refugee claimants through the BC Newcomer Services Program.',
        cost: 'free',
        url: 'https://www.dcrs.ca/our-services/settlement-services/',
      },
      {
        id: 'diversecity-english-language-programs',
        name: 'English Language Programs',
        description: 'English classes and language support for newcomers.',
        url: 'https://www.dcrs.ca/our-services/english-language-programs/',
      },
      {
        id: 'diversecity-employment-programs',
        name: 'Employment Programs',
        description:
          'Job search support and employment programs for newcomers.',
        url: 'https://www.dcrs.ca/our-services/employment-programs/',
      },
      {
        id: 'diversecity-mental-health-and-substance-use-services',
        name: 'Mental Health and Substance Use Services',
        description:
          'Counselling and support. Intake: 604-547-1202, intake@dcrs.ca.',
        url: 'https://www.dcrs.ca/our-services/mental-health-and-substance-use-services/',
      },
      {
        id: 'diversecity-language-testing-centre-celpip',
        name: 'Language Testing Centre (CELPIP)',
        description:
          'CELPIP language testing for immigration and citizenship applications.',
        url: 'https://www.dcrs.ca/our-services/celpip/',
      },
    ],
    displayOrder: 0,
    active: true,
  },
  {
    slug: 'burnaby-neighbourhood-house',
    name: 'Burnaby Neighbourhood House',
    category: 'gettingSettled',
    partnershipType: 'resource',
    tagline: 'Community programs, childcare, and newcomer support in Burnaby.',
    description:
      'Burnaby Neighbourhood House helps people enhance their lives and strengthen their community through programs built around the changing needs of a diverse population — childcare, family and food security, and dedicated newcomer support.',
    highlights: [
      'Newcomer settlement support',
      'Childcare & family programs',
      'Food security initiatives',
    ],
    serviceArea: 'Burnaby',
    website: 'https://burnabynh.ca/',
    howToStart:
      'Call or email the nearest house. For settlement services, contact settlementprogram@burnabynh.ca or 604-431-0400.',
    phone: '(604) 431-0400',
    email: 'receptiona@burnabynh.ca',
    address: '#100 – 4460 Beresford St, Burnaby, BC V5H 0B8',
    hours:
      'South House Mon–Fri 9:00am–5:00pm · North House Mon–Fri 9:30am–4:30pm · Brentwood House Mon–Fri 9:00am–4:00pm',
    programs: [
      {
        id: 'burnaby-neighbourhood-house-newcomers-settlement-services',
        name: 'Newcomers Settlement Services',
        description:
          'Settlement plans, benefit applications, language support and community connections.',
        eligibility:
          'Funded by IRCC and, in accordance with their requirements, focused on supporting permanent residents and convention refugees.',
        url: 'https://burnabynh.ca/programs-and-services/newcomers-settlement-services/',
      },
      {
        id: 'burnaby-neighbourhood-house-volunteer-income-tax-program',
        name: 'Volunteer Income Tax Program',
        description: 'Free help filing your income tax return.',
        url: 'https://burnabynh.ca/programs-and-services/community-program/volunteer-income-tax-program/',
      },
      {
        id: 'burnaby-neighbourhood-house-early-years-program-05-years',
        name: 'Early Years Program (0–5 years)',
        description: 'Programs for families with children under five.',
        url: 'https://burnabynh.ca/programs-and-services/child-care-programs/early-years-program-0-5-years-old/',
      },
    ],
    displayOrder: 1,
    active: true,
  },
  {
    slug: 'ymca-bc',
    name: 'YMCA BC',
    category: 'gettingSettled',
    partnershipType: 'resource',
    tagline: 'Programs for families, children, and seniors across BC.',
    description:
      'YMCA BC supports families, children, and seniors in communities across British Columbia, building vibrant and healthy communities with a shared sense of social responsibility where people can thrive in spirit, mind, and body.',
    highlights: [
      'Programs for all ages',
      'Health & wellness focus',
      'Communities across BC',
    ],
    serviceArea: 'British Columbia',
    website: 'https://www.ymcabc.ca/',
    cost: 'mixed',
    howToStart:
      'Call 604-681-9622 or email information.request@ymcabc.ca. Individual programs have their own registration forms.',
    phone: '604-681-9622',
    email: 'information.request@ymcabc.ca',
    address: '620 Royal Ave #10, New Westminster, BC V3M 1J2',
    hours: 'Mon–Fri 8:30am–4:30pm',
    programs: [
      {
        id: 'ymca-bc-international-students-employment-support',
        name: 'International Students Employment Support',
        description:
          'Free program to help overcome employment barriers in Canada.',
        cost: 'free',
      },
      {
        id: 'ymca-bc-self-employment-for-newcomers',
        name: 'Self Employment for Newcomers',
        description: 'Supports newcomers launching their own small business.',
      },
      {
        id: 'ymca-bc-self-employment-program',
        name: 'Self Employment Program',
        description:
          'Fully funded business coaching to help you launch and grow a small business.',
        cost: 'free',
      },
      {
        id: 'ymca-bc-tradeworks',
        name: 'TradeWorks',
        description: 'Free support into trade employment or further training.',
        cost: 'free',
      },
      {
        id: 'ymca-bc-interviewme',
        name: 'InterviewME',
        description:
          'Helps job seekers connect with the right people at the right time.',
      },
    ],
    displayOrder: 2,
    active: true,
  },
  // ── Find Work ───────────────────────────────────────────────────────────
  {
    slug: 'iec-bc',
    name: 'Immigrant Employment Council of BC',
    category: 'findWork',
    partnershipType: 'resource',
    tagline: 'Helping BC employers hire and retain immigrant talent.',
    description:
      'The Immigrant Employment Council of BC works on the employer side of immigrant integration — helping BC businesses recruit, hire, and retain skilled immigrant talent through mentorship programs, job boards, and employer education.',
    highlights: [
      'Mentorship programs',
      'Job boards for newcomers',
      'Employer education',
    ],
    serviceArea: 'British Columbia',
    website: 'https://iecbc.ca/',
    cost: 'free',
    howToStart: 'Register online — each program has its own registration form.',
    phone: '(604) 629-5364',
    email: 'employerengagement@iecbc.ca',
    address: '720 – 750 West Pender St, Vancouver, BC V6C 2T7',
    programs: [
      {
        id: 'iec-bc-mentorconnect',
        name: 'MentorConnect',
        description:
          'One-on-one, occupation-specific coaching that pairs job-ready newcomers with established local professionals.',
        eligibility:
          'Newcomers to Canada within the past 10 years who are eligible to work and have a job-ready resume. You must be in BC or planning to move to BC.',
        cost: 'free',
        url: 'https://iecbc.ca/our-work/programs/mentorconnect/',
      },
      {
        id: 'iec-bc-talentconnect',
        name: 'TalentConnect',
        description:
          'Connects BC employers with globally trained professionals through tailored hiring and networking opportunities.',
        eligibility:
          'Permanent residents in Canada, and those approved for immigration who have yet to land.',
        cost: 'free',
        url: 'https://iecbc.ca/our-work/programs/talentconnect/',
      },
      {
        id: 'iec-bc-ascend',
        name: 'ASCEND',
        description:
          'Online, self-paced learning to build the workplace soft skills Canadian employers look for (English & French).',
        cost: 'free',
        url: 'https://ascendemployment.com/participants/',
      },
      {
        id: 'iec-bc-fast',
        name: 'FAST',
        description:
          'Helps newcomers see how their experience and training meet Canadian standards, with career-prep streams by field.',
        cost: 'free',
        url: 'https://fastcanada.ca/',
      },
    ],
    displayOrder: 0,
    active: true,
  },
  {
    slug: 'newcomer-jobs-canada',
    name: 'Newcomer Jobs Canada',
    category: 'findWork',
    partnershipType: 'resource',
    tagline: 'A job board built for newcomers to Canada.',
    description:
      'Newcomer Jobs Canada is a dedicated job board connecting newcomers to Canada with employment opportunities across the country, making the job search more accessible for those starting their Canadian journey.',
    highlights: [
      'Newcomer-focused job board',
      'Opportunities across Canada',
      'Easier job search for new arrivals',
    ],
    serviceArea: 'Canada',
    website: 'https://newcomerjobscanada.ca/',
    cost: 'mixed',
    howToStart:
      'Create an account online, upload your resume and apply for jobs on the website.',
    phone: '(306) 229-6774',
    hours: 'Mon–Fri 9:00am–5:00pm CST',
    displayOrder: 1,
    active: true,
  },
  // ── Immigration Help ────────────────────────────────────────────────────
  {
    slug: 'canada-shaw-immigration',
    name: 'Canada Shaw Immigration Consultancy',
    category: 'immigrationHelp',
    partnershipType: 'referral',
    tagline: 'CICC-licensed firm for Express Entry, permits, and LMIA.',
    description:
      'A Richmond-based, CICC-licensed immigration consulting firm (est. 2015) offering full-service support — Express Entry, study and work permits, and LMIA applications — with bilingual English and Chinese service.',
    highlights: [
      'CICC-licensed consultants',
      'Express Entry, permits & LMIA',
      'Bilingual English / 中文',
    ],
    serviceArea: 'Richmond',
    // Affiliate link supplied by the partner; deliberately unlabelled in the
    // UI and opened by the standard Website button.
    website: 'https://www.immshaws.com/unify/',
    ctaLabelKey: 'learn.resources.cta.bookAssessment',
    cost: 'paid',
    howToStart:
      'Request a free assessment through the website, or contact them by phone, email or WhatsApp.',
    phone: '+1 672-867-6886',
    email: 'info@canadashaws.com',
    address: '308-5811 Cooney Rd, Richmond, BC V6X 3M1',
    hours: 'Mon–Fri 9:00am–6:00pm · Closed weekends',
    languages: ['English', 'Chinese (中文)'],
    programs: [
      {
        id: 'canada-shaw-immigration-free-lmia-consultation',
        name: 'Free LMIA Consultation',
        description:
          'Consultation on employer employment needs, with a scheduled 30-minute orientation.',
      },
    ],
    displayOrder: 0,
    active: true,
  },
  {
    slug: 'global-connect-immigration',
    name: 'Global Connect Immigration',
    category: 'immigrationHelp',
    partnershipType: 'referral',
    tagline: 'Registered consultancy for PR, visas, and settlement.',
    description:
      'Global Connect is a registered Canadian immigration consulting firm helping newcomers navigate permanent residency pathways, visa processes, and settlement planning with expert, personalized guidance.',
    highlights: [
      'PR pathway guidance',
      'Visa & work-permit support',
      'Personalized settlement planning',
    ],
    serviceArea: 'Surrey',
    website: 'https://globalconnectmigration.com/',
    cost: 'paid',
    howToStart: 'Phone, email, or book a consultation through the website.',
    phone: '+1 (604) 495-1927',
    email: 'info@globalconnectmigration.com',
    address: '8556 120th Street, Unit 208, Surrey, BC V3W 3N5',
    programs: [
      {
        id: 'global-connect-immigration-family-sponsorship',
        name: 'Family Sponsorship',
        description:
          'Help sponsoring a spouse, partner, children or parents for permanent residency.',
      },
    ],
    displayOrder: 1,
    active: true,
  },
  // ── Libraries & Learning ────────────────────────────────────────────────
  {
    slug: 'burnaby-public-library',
    name: 'Burnaby Public Library',
    category: 'librariesLearning',
    partnershipType: 'resource',
    tagline: 'Inclusive spaces to gather, learn, and play.',
    description:
      'Burnaby Public Library creates inclusive spaces where people can gather, learn, and play across four branches — free programs, resources, and places to connect.',
    highlights: [
      'Free programs & resources',
      '4 branches across Burnaby',
      'Welcoming spaces to learn',
    ],
    serviceArea: 'Burnaby · 4 branches',
    website: 'https://bpl.bc.ca/',
    ctaLabelKey: 'learn.resources.cta.joinLibrary',
    cost: 'mixed',
    eligibility:
      'Membership is for people aged 13+ who live or own property in Burnaby, or live within the InterLINK area. A BC OneCard is available to BC residents outside InterLINK.',
    howToStart: 'Walk in to any branch and ask at the service desk, or call.',
    phone: '604-436-5400',
    email: 'eref@bpl.bc.ca',
    address: '6100 Willingdon Ave, Burnaby, BC V5H 4N5 (Bob Prittie Metrotown)',
    hours: 'Mon–Thu 10:00am–8:00pm · Fri–Sun 10:00am–6:00pm',
    programs: [
      {
        id: 'burnaby-public-library-services-for-immigrants-newcomers',
        name: 'Services for Immigrants & Newcomers',
        description:
          'A guide to settlement, employment, English learning and citizenship services in Burnaby and nearby.',
        url: 'https://bpl.bc.ca/services-immigrants-newcomers',
      },
      {
        id: 'burnaby-public-library-summer-reading-club',
        name: 'Summer Reading Club',
        description: 'Free summer reading program for children of all ages.',
        cost: 'free',
      },
    ],
    displayOrder: 0,
    active: true,
  },
  {
    slug: 'surrey-libraries',
    name: 'Surrey Libraries',
    category: 'librariesLearning',
    partnershipType: 'resource',
    tagline: 'Sparking curiosity and lifelong learning.',
    description:
      'Surrey Libraries connects people, sparks curiosity, and inspires lifelong learning to enhance the lives of Surrey residents across ten branches.',
    highlights: [
      'Free lifelong-learning programs',
      '10 branches across Surrey',
      'Connecting the community',
    ],
    serviceArea: 'Surrey · 10 branches',
    website: 'https://www.surreylibraries.ca/',
    ctaLabelKey: 'learn.resources.cta.visitWelcomeCentre',
    cost: 'free',
    howToStart:
      'Visit the Newcomer Welcome Centre at City Centre Branch, Level 4 — 604-590-7847 or newcomerwelcomecentre@surrey.ca.',
    phone: '604-598-7300',
    email: 'libraryinfo@surrey.ca',
    address: 'City Centre Branch, 10350 University Drive, Surrey, BC V3T 4B8',
    hours:
      'Newcomer Welcome Centre: Mon–Thu 10:00am–9:00pm · Fri–Sat 10:00am–5:00pm',
    languages: [
      'Arabic',
      'Cantonese',
      'Dari',
      'Farsi',
      'French',
      'Hindi',
      'Kinyarwanda',
      'Kirundi',
      'Konkani',
      'Mandarin',
      'Marathi',
      'Pashto',
      'Punjabi',
      'Somali',
    ],
    programs: [
      {
        id: 'surrey-libraries-free-settlement-services-for-newcomers',
        name: 'Free Settlement Services for Newcomers',
        description:
          'Settlement workers help you look for a job, find housing and start your life in Canada.',
        eligibility:
          'No status restriction is stated. Services are delivered by partner agencies — call ahead to confirm times and locations.',
        cost: 'free',
        url: 'https://www.surreylibraries.ca/programs-services/newcomers',
      },
      {
        id: 'surrey-libraries-newcomer-library-services',
        name: 'Newcomer Library Services',
        description:
          'English language learning tools and connections to settlement services, free at all branches.',
        eligibility:
          'Free and available at all branches. No immigration-status restriction is stated.',
        cost: 'free',
      },
      {
        id: 'surrey-libraries-get-a-library-card',
        name: 'Get a Library Card',
        description: 'Free library cards for all ages. Bring ID to any branch.',
        eligibility:
          'You can become a member if you live in Surrey or a neighbouring community. Digital resources are for Surrey residents only.',
        cost: 'free',
      },
    ],
    displayOrder: 1,
    active: true,
  },
  {
    slug: 'vancouver-public-library',
    name: 'Vancouver Public Library',
    category: 'librariesLearning',
    partnershipType: 'resource',
    tagline: 'Free places to discover, create, and share.',
    description:
      'Vancouver Public Library has served the lifelong learning, reading, and information needs of Vancouver residents for over 100 years across 21 branches — free places for everyone to discover, create, and share ideas and information.',
    highlights: [
      'Free for all residents',
      '21 branches across Vancouver',
      '100+ years serving the city',
    ],
    serviceArea: 'Vancouver · 21 branches',
    website: 'https://www.vpl.ca/',
    displayOrder: 2,
    active: true,
  },
  // ── Community & Belonging ───────────────────────────────────────────────
  {
    slug: 'big-brothers-big-sisters',
    name: 'Big Brothers Big Sisters',
    category: 'communityBelonging',
    partnershipType: 'resource',
    tagline: 'Life-changing mentoring for young people.',
    description:
      'Big Brothers Big Sisters champions the health and wellbeing of youth by providing life-changing mentoring experiences, ensuring children and teens are supported by caring adult role models.',
    highlights: [
      '1:1 youth mentoring',
      "Supporting children's wellbeing",
      'Caring adult role models',
    ],
    serviceArea: 'Canada',
    website: 'https://bigbrothersbigsisters.ca/',
    cost: 'free',
    howToStart:
      'Use the "Find an agency near you" locator on their website to reach your local agency.',
    programs: [
      {
        id: 'big-brothers-big-sisters-community-based-1-1-mentoring',
        name: 'Community-Based 1:1 Mentoring',
        description:
          'Mentee and mentor explore their local community together, around 6–8 hours a month.',
        cost: 'free',
      },
      {
        id: 'big-brothers-big-sisters-site-based-1-1-mentoring',
        name: 'Site-Based 1:1 Mentoring',
        description:
          'Mentor and mentee meet weekly at a set location such as a school, working towards set goals.',
        cost: 'free',
      },
      {
        id: 'big-brothers-big-sisters-go-girls-healthy-bodies-healthy-minds',
        name: 'Go Girls! Healthy Bodies, Healthy Minds',
        description:
          'Group mentoring on physical activity, healthy eating and self-esteem, over seven sessions.',
        eligibility: 'Girls ages 12–14.',
        cost: 'free',
      },
      {
        id: 'big-brothers-big-sisters-game-on-eat-smart-play-smart',
        name: 'Game On! Eat Smart, Play Smart',
        description:
          'Group mentoring giving boys and young men support to make informed healthy choices.',
        eligibility: 'Boys and young men.',
        cost: 'free',
      },
    ],
    displayOrder: 0,
    active: true,
  },
  {
    slug: 'united-way-bc',
    name: 'United Way BC',
    category: 'communityBelonging',
    partnershipType: 'resource',
    tagline: 'Support for the people who need it most across BC.',
    description:
      "United Way BC serves over five million British Columbians, delivering resources and support where they're needed most — emergency response, children & youth, seniors, poverty, mental health, and food security.",
    highlights: [
      'Emergency & poverty support',
      'Programs for children, youth & seniors',
      'Mental health & food security',
    ],
    serviceArea: 'British Columbia',
    website: 'https://uwbc.ca/',
    howToStart:
      'Call, email info@uwbc.ca, or use the contact form on their website.',
    phone: '604.294.8929',
    email: 'info@uwbc.ca',
    address: '4543 Canada Way, Burnaby, BC V5G 4T4',
    hours: 'Mon–Fri 8:30am–4:30pm (closed 12:00–1:00pm)',
    programs: [
      {
        id: 'united-way-bc-bc-safe-haven-program',
        name: 'BC Safe Haven Program',
        description:
          'Supports refugee claimants through volunteer mobilisations and public appeals for housing and services.',
        eligibility: 'Refugee claimants.',
      },
      {
        id: 'united-way-bc-better-at-home',
        name: 'Better at Home',
        description:
          'Non-medical help for seniors — groceries, housekeeping and social connection — in 260+ communities.',
      },
      {
        id: 'united-way-bc-work-experience-opportunities-grant',
        name: 'Work Experience Opportunities Grant',
        description: 'Skills and job training supports.',
        eligibility:
          'People receiving income assistance or disability assistance.',
      },
      {
        id: 'united-way-bc-school-s-out',
        name: "School's Out",
        description:
          'Out-of-school-time wellness, nutrition and developmental support for children.',
        eligibility: 'Ages 6–12.',
      },
      {
        id: 'united-way-bc-youth-futures-education-fund',
        name: 'Youth Futures Education Fund',
        description: 'Low-barrier funding for education.',
        eligibility: 'Youth formerly in government care.',
      },
    ],
    displayOrder: 1,
    active: true,
  },
  {
    slug: 'trout-lake-community-centre',
    name: 'Trout Lake Community Centre',
    category: 'communityBelonging',
    partnershipType: 'resource',
    tagline: '200+ programs for people of all ages.',
    description:
      'Trout Lake Community Centre offers more than 200 programs for people of all ages — a welcoming neighbourhood hub in East Vancouver run in partnership with the Vancouver Park Board.',
    highlights: [
      '200+ community programs',
      'Activities for all ages',
      'A neighbourhood gathering place',
    ],
    serviceArea: 'Vancouver',
    website: 'https://troutlakecc.com/',
    cost: 'mixed',
    howToStart:
      'Register online through the City of Vancouver recreation system, or drop in and ask at the front desk.',
    phone: '604-257-6955',
    email: 'troutlakecc@vancouver.ca',
    address: '3360 Victoria Dr, Vancouver, BC V5N 4M4',
    hours: 'Mon–Fri 9:00am–9:00pm · Sat–Sun 8:00am–4:00pm',
    programs: [
      {
        id: 'trout-lake-community-centre-leisure-access-program-lap',
        name: 'Leisure Access Program (LAP)',
        description:
          'City of Vancouver subsidy giving reduced-cost access to recreation.',
        eligibility:
          'Low-income Vancouver residents holding a valid leisure access card.',
      },
      {
        id: 'trout-lake-community-centre-tlcca-program-cost-assistance',
        name: 'TLCCA Program Cost Assistance',
        description:
          'Help with program fees for community members in financial need.',
        eligibility:
          'Community members in financial need who are not eligible for LAP.',
      },
      {
        id: 'trout-lake-community-centre-adaptive-programs',
        name: 'Adaptive Programs',
        description: 'Inclusive activities for all ages and abilities.',
      },
      {
        id: 'trout-lake-community-centre-licensed-preschool',
        name: 'Licensed Preschool',
        description: 'Licensed preschool program run at the community centre.',
      },
      {
        id: 'trout-lake-community-centre-older-adult-programs',
        name: 'Older Adult Programs',
        description: 'Stay active and connected with peers.',
      },
    ],
    displayOrder: 2,
    active: true,
  },
  // ── Networks & Planning Tables ──────────────────────────────────────────
  {
    slug: 'amssa',
    name: 'AMSSA',
    category: 'networksPlanning',
    partnershipType: 'resource',
    tagline: "The backbone supporting BC's newcomer-serving agencies.",
    description:
      'The Affiliation of Multicultural Societies and Service Agencies of BC is a provincial umbrella organization that strengthens the settlement and diversity sector — providing training, resources, e-learning, and advocacy for the agencies serving newcomers across BC.',
    highlights: [
      'Sector-wide training & e-learning',
      'Resources for newcomer-serving agencies',
      'Province-wide reach across BC',
    ],
    serviceArea: 'British Columbia',
    website: 'https://www.amssa.org/',
    cost: 'mixed',
    howToStart:
      'Email amssa@amssa.org or use the contact form. AMSSA works with organizations, not individuals.',
    phone: '604-718-2780',
    email: 'amssa@amssa.org',
    address: 'Metrotower II, Suite 2308, 4720 Kingsway, Burnaby, BC V5H 4N2',
    programs: [
      {
        id: 'amssa-re-settlement-and-integration',
        name: '(Re)Settlement and Integration',
        description:
          'Indirect support to organizations and institutions funded by IRCC.',
      },
      {
        id: 'amssa-migrant-worker-hub',
        name: 'Migrant Worker Hub',
        description:
          'Builds the capacity of organizations supporting migrant workers in BC.',
      },
      {
        id: 'amssa-amssa-institute',
        name: 'AMSSA Institute',
        description:
          'Online learning centre — webinars, AMSSATalks and e-learning for sector staff.',
      },
      {
        id: 'amssa-national-sector-engagement',
        name: 'National Sector Engagement',
        description:
          'Coordinates national engagement initiatives across the settlement sector.',
      },
      {
        id: 'amssa-canadian-humanitarian-assistance-response-char',
        name: 'Canadian Humanitarian Assistance Response (CHAR)',
        description:
          'A network of community-based service providers offering essential supports across Canada.',
      },
    ],
    displayOrder: 0,
    active: true,
  },
  {
    slug: 'surrey-lip',
    name: 'Surrey Local Immigration Partnership',
    category: 'networksPlanning',
    partnershipType: 'resource',
    tagline: '30+ organizations coordinating newcomer integration in Surrey.',
    description:
      'An IRCC-funded, multi-stakeholder council that brings together 30+ community organizations to develop collaborative, research-driven strategies for newcomer integration in Surrey. Managed by DIVERSEcity, it also offers tools like a services map and a racism-reporting tool.',
    highlights: [
      'Coordinates 30+ local organizations',
      'Services map for newcomers',
      'Racism-reporting tool',
    ],
    serviceArea: 'Surrey',
    website: 'https://www.surreylip.ca/',
    howToStart:
      'Use the contact form on their website, or join one of the working groups or round tables. Surrey LIP works with agencies, not individuals.',
    programs: [
      {
        id: 'surrey-lip-surrey-services-map',
        name: 'Surrey Services Map',
        description: 'Online map of services available in Surrey.',
      },
      {
        id: 'surrey-lip-community-connector-project',
        name: 'Community Connector Project',
        description:
          'Community connector streams with referral contacts for specific communities.',
      },
    ],
    displayOrder: 1,
    active: true,
  },
  {
    slug: 'delta-lip',
    name: 'Delta Local Immigration Partnership',
    category: 'networksPlanning',
    partnershipType: 'resource',
    tagline: 'Coordinates newcomer services across Delta.',
    description:
      'The Delta Local Immigration Partnership is an IRCC-funded partnership table bringing local organizations together to make Delta more welcoming for newcomers. It states that it does not provide direct services to individuals.',
    highlights: [
      'Coordinates local newcomer services in Delta',
      'Youth and immigrant advisory tables',
      'Publishes the Delta Services Map',
    ],
    serviceArea: 'Delta',
    website: 'https://deltalip.ca/',
    howToStart:
      'Use the contact form on their website, or apply to join an advisory table. Delta LIP works with agencies, not individuals.',
    programs: [
      {
        id: 'delta-lip-delta-services-map',
        name: 'Delta Services Map',
        description:
          'An online map of services available to newcomers in Delta.',
        url: 'https://deltalip.ca/delta-services-map/',
      },
      {
        id: 'delta-lip-delta-youth-newcomer-advisory-table-dynat',
        name: 'Delta Youth Newcomer Advisory Table (DYNAT)',
        description:
          'Brings together young people who want to make Delta more welcoming for newcomer youth.',
        eligibility:
          'Youth aged 16 to 25 who want to make Delta a more welcoming and inclusive place for newcomer youth.',
      },
      {
        id: 'delta-lip-immigrant-advisory-table',
        name: 'Immigrant Advisory Table',
        description:
          'A volunteer roundtable with members representing a diversity of backgrounds and experiences.',
        eligibility: 'Applicants must be at least 26 years old.',
      },
    ],
    displayOrder: 2,
    active: true,
  },
  // ── International Students ──────────────────────────────────────────────
  {
    slug: 'sfu-international',
    name: 'SFU International Services for Students',
    category: 'internationalStudents',
    partnershipType: 'resource',
    tagline: 'Advising, orientation, and newcomer support for SFU students.',
    description:
      "Simon Fraser University's International Services for Students supports international students with non-academic advising, orientation, and career programming, plus dedicated support for students who identify as refugees or newcomers.",
    highlights: [
      'Non-academic advising for international students',
      'Orientation and career programming',
      'Dedicated refugee and newcomer support',
    ],
    serviceArea: 'SFU Burnaby campus',
    website: 'https://www.sfu.ca/students/iss.html',
    ctaLabelKey: 'learn.resources.cta.bookAdvising',
    eligibility:
      'International students enrolled at SFU, including undergraduate, graduate and exchange students.',
    howToStart:
      'Drop in (in person or virtual), book an appointment, or email iss_office@sfu.ca.',
    phone: '+1 778-782-4232',
    email: 'iss_office@sfu.ca',
    address: 'MBC 1200 – 8888 University Drive, Burnaby, BC V5A 1S6',
    hours: 'Mon–Fri 9:00am–4:00pm (closed 12:00–1:00pm)',
    programs: [
      {
        id: 'sfu-international-international-and-newcomer-student-advising',
        name: 'International and Newcomer Student Advising',
        description:
          'Non-academic advising for international undergraduate, graduate and exchange students.',
        eligibility:
          'International students, including undergraduate, graduate and exchange students.',
        url: 'https://www.sfu.ca/students/isap.html',
      },
      {
        id: 'sfu-international-refugee-and-newcomer-programs',
        name: 'Refugee and Newcomer Programs',
        description:
          'Support for students who identify as refugees or newcomers, including the World University Service of Canada Student Refugee Program.',
        eligibility: 'SFU students who identify as refugees or newcomers.',
        url: 'https://www.sfu.ca/students/iss/refugee-and-newcomer-program.html',
      },
      {
        id: 'sfu-international-international-student-orientation-series',
        name: 'International Student Orientation Series',
        description:
          'A multi-part series for all new international students beginning studies at SFU.',
        eligibility: 'New international students starting at SFU.',
        url: 'https://www.sfu.ca/students/isap/programs/intlorientation.html',
      },
      {
        id: 'sfu-international-international-student-career-week',
        name: 'International Student Career Week',
        description:
          'A week-long series of career activities designed for international students.',
        eligibility: 'International undergraduate and graduate students.',
        url: 'https://www.sfu.ca/students/isap/programs/IntlCareerWeek.html',
      },
    ],
    displayOrder: 0,
    active: true,
  },
  {
    slug: 'fraser-international-college',
    name: 'Fraser International College',
    category: 'internationalStudents',
    partnershipType: 'resource',
    tagline: 'Pathway college programs leading into SFU degrees.',
    description:
      "Fraser International College is a private pathway college on SFU's Burnaby campus, offering foundation and first-year programs that lead into Simon Fraser University degrees. All programs are tuition-based.",
    highlights: [
      'University transfer pathway into SFU',
      'Foundation and first-year university programs',
      'Located on the SFU Burnaby campus',
    ],
    serviceArea: 'Burnaby',
    website: 'https://www.fraseric.ca/',
    ctaLabelKey: 'learn.resources.cta.applyOnline',
    cost: 'paid',
    eligibility:
      'Applicants must be at least 17 years old by the last day of their first semester and submit all academic transcripts. Academic requirements vary by program and by country of origin.',
    howToStart:
      'Apply online through the FIC student portal, email info@fraseric.ca, or apply through a listed education agent.',
    phone: '(778) 782-5011',
    email: 'info@fraseric.ca',
    address: '8999 Nelson Way, Burnaby, BC V5A 4B5',
    programs: [
      {
        id: 'fraser-international-college-foundation-program-utp-stage-i',
        name: 'Foundation Program (UTP Stage I)',
        description: 'Pre-university program taken over two terms.',
        eligibility:
          'Successful completion of Year 11 or equivalent, with benchmarks depending on the chosen program.',
        cost: 'paid',
        url: 'https://www.fraseric.ca/admissions/fees/',
      },
      {
        id: 'fraser-international-college-international-year-one-utp-stage-ii',
        name: 'International Year One (UTP Stage II)',
        description:
          'First-year university credit programme leading into an SFU degree.',
        eligibility:
          'Generally Year 12 completion or equivalent; requirements vary by country system and program.',
        cost: 'paid',
        url: 'https://www.fraseric.ca/admissions/fees/',
      },
      {
        id: 'fraser-international-college-associate-of-arts-degree',
        name: 'Associate of Arts Degree',
        description: 'Two-year associate degree taken at FIC.',
        eligibility: 'Generally Year 12 completion or equivalent.',
        cost: 'paid',
        url: 'https://www.fraseric.ca/admissions/fees/',
      },
    ],
    displayOrder: 1,
    active: true,
  },
  // ── Insurance ───────────────────────────────────────────────────────────
  {
    slug: 'tugo',
    name: 'TuGo',
    category: 'insurance',
    partnershipType: 'referral',
    tagline:
      'Travel and visitor insurance, including cover during the health-plan wait.',
    description:
      'TuGo is a Canadian-owned travel insurance provider with its head office in Richmond, BC. Its Visitors to Canada plans cover emergency medical costs for family visiting from abroad and for people waiting for a provincial health plan to take effect.',
    highlights: [
      'Emergency medical cover for visitors to Canada',
      'Coverage options for pre-existing conditions',
      'Canadian-owned, head office in Richmond, BC',
    ],
    serviceArea: 'Canada and worldwide',
    // Affiliate link supplied by the partner; deliberately unlabelled in the
    // UI and opened by the standard Website button.
    website: 'https://tugo.partnerlinks.io/68e8fsmokbc7',
    ctaLabelKey: 'learn.resources.cta.getQuote',
    cost: 'paid',
    howToStart:
      'Start a quote online through a TuGo insurance partner, or call 1-855-929-8846.',
    phone: '1-855-929-8846',
    email: 'info@tugo.com',
    address: '1200–6081 No. 3 Road, Richmond, BC V6Y 2B2',
    hours: 'Mon–Fri 6:00am–5:00pm PST · Sat 7:00am–4:00pm PST · Sun closed',
    languages: ['English', 'French'],
    programs: [
      {
        id: 'tugo-visitors-to-canada-insurance',
        name: 'Visitors to Canada Insurance',
        description:
          'Emergency medical protection for visitors, with options covering pre-existing conditions.',
        eligibility:
          'For people visiting family or friends, travelling in Canada, or waiting for a provincial health plan to take effect.',
        cost: 'paid',
      },
      {
        id: 'tugo-basic-visitors-to-canada-insurance',
        name: 'Basic Visitors to Canada Insurance',
        description:
          'Lower-cost emergency medical coverage for visitors on a budget.',
        cost: 'paid',
      },
      {
        id: 'tugo-trip-cancellation-trip-interruption-insurance',
        name: 'Trip Cancellation & Trip Interruption Insurance',
        description:
          'Covers costs if a trip is cancelled before departure or disrupted during travel.',
        cost: 'paid',
      },
      {
        id: 'tugo-24-7-emergency-medical-assistance',
        name: '24/7 Emergency Medical Assistance',
        description:
          'Round-the-clock emergency medical assistance and claims support on 1-800-663-0399.',
      },
    ],
    displayOrder: 0,
    active: true,
  },
  // ── Money & Banking ─────────────────────────────────────────────────────
  {
    slug: 'desjardins',
    name: 'Desjardins',
    category: 'money',
    partnershipType: 'referral',
    tagline: 'Newcomer banking, credit building, and free legal help.',
    description:
      "Desjardins is Canada's largest cooperative financial group. Its newcomer offer includes a chequing account with no monthly plan fee during an eligibility period, no-annual-fee credit cards to help build Canadian credit history, and a free legal assistance service. Its branch network is in Quebec and Ontario.",
    highlights: [
      'No monthly plan fee during the newcomer period',
      'Credit cards to build Canadian credit history',
      'Free legal assistance service for two years',
    ],
    serviceArea: 'Quebec and Ontario',
    website: 'https://www.desjardins.com/ca/personal/you-are/newcomers-canada/',
    cost: 'mixed',
    eligibility:
      'The newcomer account offer is for people aged 25 and over who are permanent residents, or temporary residents with a work permit valid for more than 8 months, who have lived in Canada 3 years or less and are not already Desjardins members. Separate offers cover ages 18–24 and full-time students aged 25–30.',
    howToStart:
      'Open an account online in about 15 minutes, or apply from abroad and confirm your identity at a service location on arrival.',
    phone: '1-877-435-6098',
    hours:
      'Legal assistance: file opening 24/7 · advisors Mon–Fri 9:00am–8:00pm, Sat 9:00am–5:00pm',
    languages: ['English', 'French'],
    programs: [
      {
        id: 'desjardins-newcomers-chequing-account-unlimited-plan',
        name: 'Newcomers chequing account (Unlimited plan)',
        description:
          'Chequing account with the monthly Unlimited plan fee waived during the eligibility period.',
        eligibility:
          'Aged 25+, permanent resident or temporary resident with a work permit valid more than 8 months, in Canada 3 years or less, and not already a Desjardins member.',
        cost: 'mixed',
      },
      {
        id: 'desjardins-free-legal-assistance-service',
        name: 'Free legal assistance service',
        description:
          'Legal assistance included with the newcomer offer for two years, covering everyday matters.',
        cost: 'free',
      },
      {
        id: 'desjardins-international-money-transfers',
        name: 'International money transfers',
        description: 'International money transfers of up to $25,000 per day.',
      },
      {
        id: 'desjardins-youth-and-student-accounts',
        name: 'Youth and student accounts',
        description:
          'Account offers for younger newcomers and full-time students.',
        eligibility: 'Ages 18–24, or 25–30 if a full-time student.',
        cost: 'mixed',
      },
    ],
    displayOrder: 0,
    active: true,
  },
];

/**
 * Active partners from an arbitrary list, sorted by displayOrder.
 * Split out from `getActivePartners` so the filter is testable without an
 * inactive partner in the shipped data.
 */
export const selectActivePartners = (partners: Partner[]): Partner[] =>
  partners
    .filter(p => p.active)
    .sort((a, b) => a.displayOrder - b.displayOrder);

/** Active partners only, sorted by displayOrder. */
export const getActivePartners = (): Partner[] =>
  selectActivePartners(PARTNERS);

/** Active partners in a category, sorted by displayOrder. */
export const getPartnersByCategory = (category: PartnerCategory): Partner[] =>
  getActivePartners().filter(p => p.category === category);

/** Selects an active partner by slug from an arbitrary directory. */
export const selectActivePartnerBySlug = (
  partners: Partner[],
  slug: string
): Partner | undefined =>
  selectActivePartners(partners).find(p => p.slug === slug);

/** A single active partner by slug for the detail route. */
export const getPartnerBySlug = (slug: string): Partner | undefined =>
  selectActivePartnerBySlug(PARTNERS, slug);

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
