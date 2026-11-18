-- ============================================================================
-- Migration 004: Scheme Catalogue Constraints, Indexes, and Verified Seed Data
-- Project: SchemeAlly (Phase 4 — Scheme Catalogue & Discovery)
-- ============================================================================

-- 1. Ensure idempotent uniqueness on scheme_sources (scheme_id, source_url)
--    and GIN index on schemes.target_audiences for audience filtering
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'uq_scheme_sources_scheme_url'
  ) THEN
    ALTER TABLE public.scheme_sources
      ADD CONSTRAINT uq_scheme_sources_scheme_url UNIQUE (scheme_id, source_url);
  END IF;
END
$$;

CREATE INDEX IF NOT EXISTS idx_schemes_target_audiences
ON public.schemes USING GIN (target_audiences);

-- ============================================================================
-- 2. VERIFIED SCHEME CATEGORIES (9 Core Categories)
-- ============================================================================

INSERT INTO public.scheme_categories (
  id, slug, name_en, name_ta, description_en, description_ta, icon, display_order
) VALUES
  (
    '10000000-0000-4000-8000-000000000001',
    'education',
    'Education',
    'கல்வி',
    'Higher education assurance, tuition fee concessions, and central/state scholarships for school and college students.',
    'பள்ளி மற்றும் கல்லூரி மாணவர்களுக்கான உயர்கல்வி உறுதித் திட்டங்கள், கல்விக்கட்டணச் சலுகைகள் மற்றும் உதவித்தொகைகள்.',
    'GraduationCap',
    1
  ),
  (
    '10000000-0000-4000-8000-000000000002',
    'financial-assistance',
    'Financial Assistance',
    'நிதி உதவி',
    'Direct benefit transfers, social security savings, and guaranteed pension schemes for citizens.',
    'நேரடிப் பணப்பரிமாற்றம், சமூகப் பாதுகாப்புச் சேமிப்பு மற்றும் உத்தரவாத ஓய்வூதியத் திட்டங்கள்.',
    'Wallet',
    2
  ),
  (
    '10000000-0000-4000-8000-000000000003',
    'women-child-welfare',
    'Women & Child Welfare',
    'மகளிர் மற்றும் குழந்தைகள் நலன்',
    'Monthly women entitlement assistance, girl child savings, and family empowerment initiatives.',
    'மகளிர் உரிமைத்தொகை, பெண் குழந்தை சேமிப்பு மற்றும் குடும்ப நல மேம்பாட்டுத் திட்டங்கள்.',
    'HeartHandshake',
    3
  ),
  (
    '10000000-0000-4000-8000-000000000004',
    'healthcare',
    'Healthcare',
    'மருத்துவம் மற்றும் சுகாதாரம்',
    'Cashless family health insurance coverage and maternity financial and nutrition support.',
    'கட்டணமில்லா குடும்ப மருத்துவக் காப்பீடு மற்றும் மகப்பேறு நிதியுதவித் திட்டங்கள்.',
    'Stethoscope',
    4
  ),
  (
    '10000000-0000-4000-8000-000000000005',
    'agriculture',
    'Agriculture',
    'வேளாண்மை',
    'Farmer income support, crop insurance protection, and agricultural livelihood assistance.',
    'விவசாயிகள் வருமான ஆதரவு, பயிர்க் காப்பீடு மற்றும் வேளாண் வாழ்வாதாரத் திட்டங்கள்.',
    'Sprout',
    5
  ),
  (
    '10000000-0000-4000-8000-000000000006',
    'employment',
    'Employment & Skills',
    'வேலைவாய்ப்பு மற்றும் திறன் மேம்பாடு',
    'Industry skill certification, career guidance, and traditional artisan skill upgradation.',
    'தொழில் திறன் சான்றிதழ் பயிற்சி, வேலைவாய்ப்பு வழிகாட்டுதல் மற்றும் கைவினைஞர் திறன் மேம்பாடு.',
    'Briefcase',
    6
  ),
  (
    '10000000-0000-4000-8000-000000000007',
    'housing',
    'Housing',
    'வீட்டுவசதி',
    'Urban and rural affordable housing construction and credit-linked subsidy schemes.',
    'நகர்ப்புற மற்றும் ஊரகப் பகுதிகளில் சொந்த வீடு கட்டுவதற்கான மானியத் திட்டங்கள்.',
    'Home',
    7
  ),
  (
    '10000000-0000-4000-8000-000000000008',
    'small-business',
    'Small Business Support',
    'சிறு தொழில் ஆதரவு',
    'Subsidized micro-enterprise loans, street vendor working capital, and self-employment credit.',
    'சிறு தொழில் மானியக் கடன்கள், சாலையோர வியாபாரிகள் நடைமுறை மூலதனக் கடன் மற்றும் சுயதொழில் ஆதரவு.',
    'Store',
    8
  ),
  (
    '10000000-0000-4000-8000-000000000009',
    'social-welfare',
    'Social Welfare',
    'சமூக நலன்',
    'Monthly pensions and social protection for senior citizens, Persons with Disabilities, and vulnerable households.',
    'மூத்த குடிமக்கள், மாற்றுத்திறனாளிகள் மற்றும் நலிந்த குடும்பங்களுக்கான மாதாந்திர ஓய்வூதியத் திட்டங்கள்.',
    'Users',
    9
  )
ON CONFLICT (slug) DO UPDATE SET
  name_en = EXCLUDED.name_en,
  name_ta = EXCLUDED.name_ta,
  description_en = EXCLUDED.description_en,
  description_ta = EXCLUDED.description_ta,
  icon = EXCLUDED.icon,
  display_order = EXCLUDED.display_order,
  updated_at = timezone('utc', now());

-- ============================================================================
-- 3. VERIFIED GOVERNMENT SCHEMES (18 Schemes: 8 Tamil Nadu + 10 Central)
-- ============================================================================

INSERT INTO public.schemes (
  id, slug, category_id,
  name_en, name_ta,
  short_description_en, short_description_ta,
  detailed_description_en, detailed_description_ta,
  benefits_en, benefits_ta,
  department_en, department_ta,
  government_level, state_code, target_audiences,
  application_instructions_en, application_instructions_ta,
  official_source_url, official_application_url,
  last_verified_at, is_verified, status
) VALUES
  -- 1. Pudhumai Penn (TN State - Education)
  (
    '20000000-0000-4000-8000-000000000001',
    'pudhumai-penn-scheme',
    '10000000-0000-4000-8000-000000000001',
    'Moovalur Ramamirtham Ammaiyar Higher Education Assurance Scheme (Pudhumai Penn)',
    'மூவலூர் இராமாமிர்தம் அம்மையார் உயர்கல்வி உறுதித் திட்டம் (புதுமைப் பெண்)',
    'Monthly financial assistance of ₹1,000 for girl students who studied Classes 6 to 12 in government schools and pursue higher education.',
    'அரசுப் பள்ளிகளில் 6 முதல் 12-ஆம் வகுப்பு வரை பயின்று உயர்கல்வி பயிலும் மாணவிகளுக்கு மாதம் ₹1,000 நிதியுதவி.',
    'Launched by the Government of Tamil Nadu to increase higher education enrolment among girls from government schools and reduce early marriage. Eligible girl students enrolled in undergraduate degree, diploma, or ITI courses receive ₹1,000 every month directly into their bank accounts until course completion.',
    'அரசுப் பள்ளிகளில் பயிலும் மாணவிகளின் உயர்கல்விச் சேர்க்கையை அதிகரிக்கும் நோக்கில் தமிழ்நாடு அரசால் தொடங்கப்பட்ட திட்டம். 6 முதல் 12-ஆம் வகுப்பு வரை அரசுப் பள்ளிகள் அல்லது அரசு உதவிபெறும் தமிழ் வழிப் பள்ளிகளில் பயின்று இளங்கலைப் பட்டம், பட்டயம் (Diploma) அல்லது ஐடிஐ (ITI) பயிலும் மாணவிகளுக்குப் படிப்பு முடியும் வரை மாதம் ₹1,000 வங்கிக் கணக்கில் நேரடியாக வழங்கப்படுகிறது.',
    '₹1,000 per month transferred directly to the student''s bank account throughout the standard duration of their first undergraduate degree, diploma, or ITI programme.',
    'இளங்கலைப் பட்டம், டிப்ளமோ அல்லது ஐடிஐ படிப்புக் காலம் முழுவதும் மாணவியின் வங்கிக் கணக்கில் நேரடியாக மாதம் ₹1,000 வரவு வைக்கப்படும்.',
    'Social Welfare and Women Empowerment Department, Government of Tamil Nadu',
    'சமூக நலன் மற்றும் மகளிர் உரிமைத் துறை, தமிழ்நாடு அரசு',
    'state',
    'TN',
    ARRAY['students', 'women'],
    'Applications are submitted through the University Management Information System (UMIS) portal via the respective college nodal officer using EMIS verification.',
    'மாணவிகள் பயிலும் கல்லூரியின் ஒருங்கிணைப்பு அலுவலர் (Nodal Officer) மூலம் UMIS மற்றும் EMIS எண் அடிப்படையில் விண்ணப்பிக்கலாம்.',
    'https://www.pudhumaipenn.tn.gov.in/',
    'https://umis.tn.gov.in/',
    '2026-11-15T17:25:00Z',
    true,
    'active'
  ),

  -- 2. Tamil Pudhalvan (TN State - Education)
  (
    '20000000-0000-4000-8000-000000000002',
    'tamil-pudhalvan-scheme',
    '10000000-0000-4000-8000-000000000001',
    'Tamil Pudhalvan Higher Education Assurance Scheme',
    'தமிழ்ப் புதல்வன் உயர்கல்வி உறுதித் திட்டம்',
    'Monthly financial assistance of ₹1,000 for boys who studied Classes 6 to 12 in government or government-aided Tamil medium schools and pursue higher education.',
    'அரசுப் பள்ளிகள் அல்லது அரசு உதவிபெறும் தமிழ் வழிப் பள்ளிகளில் 6 முதல் 12-ஆம் வகுப்பு வரை பயின்று உயர்கல்வி பயிலும் மாணவர்களுக்கு மாதம் ₹1,000 நிதியுதவி.',
    'The Tamil Pudhalvan scheme supports male students from government schools and Tamil-medium sections of government-aided schools across Tamil Nadu to pursue undergraduate degrees, diplomas, and ITI programmes without financial hardship for books and academic essentials.',
    'அரசுப் பள்ளிகள் மற்றும் அரசு உதவிபெறும் பள்ளிகளில் தமிழ் வழியில் 6 முதல் 12-ஆம் வகுப்பு வரை பயின்று உயர்கல்வியில் (பட்டம், டிப்ளமோ, ஐடிஐ) சேரும் மாணவர்களுக்குப் பாடப்புத்தகங்கள் மற்றும் கல்விச் செலவுகளுக்காக மாதம் ₹1,000 வழங்கும் தமிழ்நாடு அரசின் திட்டம்.',
    '₹1,000 per month credited directly via Direct Benefit Transfer (DBT) into the student''s bank account during their first higher education course.',
    'உயர்கல்விப் படிப்புக் காலத்தில் மாணவரின் வங்கிக் கணக்கில் நேரடியாக மாதம் ₹1,000 வரவு வைக்கப்படும்.',
    'Special Programme Implementation Department, Government of Tamil Nadu',
    'சிறப்புத் திட்ட செயலாக்கத் துறை, தமிழ்நாடு அரசு',
    'state',
    'TN',
    ARRAY['students'],
    'Eligible students register through the UMIS portal at their higher education institution with their school EMIS ID and Aadhaar-seeded bank account.',
    'கல்லூரியில் உள்ள UMIS இணையதளம் வாயிலாகப் பள்ளி EMIS எண் மற்றும் வங்கிக் கணக்கு விவரங்களுடன் விண்ணப்பிக்க வேண்டும்.',
    'https://umis.tn.gov.in/',
    'https://umis.tn.gov.in/',
    '2026-11-15T17:25:00Z',
    true,
    'active'
  ),

  -- 3. Kalaignar Magalir Urimai Thittam (TN State - Women & Child Welfare)
  (
    '20000000-0000-4000-8000-000000000003',
    'kalaignar-magalir-urimai-thittam',
    '10000000-0000-4000-8000-000000000003',
    'Kalaignar Magalir Urimai Thittam',
    'கலைஞர் மகளிர் உரிமைத் திட்டம்',
    'Monthly women''s entitlement grant of ₹1,000 for eligible women heads of households in Tamil Nadu.',
    'தமிழ்நாட்டில் தகுதியுள்ள குடும்பத் தலைவிகளுக்கு மாதம் ₹1,000 மகளிர் உரிமைத் தொகை வழங்கும் திட்டம்.',
    'Kalaignar Magalir Urimai Thittam recognizes the unpaid lifelong labour of women and strengthens household livelihood security. One eligible woman aged 21 years or above per ration card household with annual family income below ₹2.5 lakh receives ₹1,000 every month.',
    'மகளிரின் உழைப்பை அங்கீகரித்து அவர்களின் வாழ்வாதாரத்தை மேம்படுத்தும் நோக்கில், ஆண்டு குடும்ப வருமானம் ₹2.5 இலட்சத்திற்குக் கீழ் உள்ள தகுதியான குடும்பத் தலைவிகளுக்கு (21 வயது நிரம்பியவர்கள்) மாதம் ₹1,000 வங்கிக் கணக்கில் நேரடியாக வழங்கப்படுகிறது.',
    '₹1,000 per month (₹12,000 per year) transferred directly to the beneficiary''s Aadhaar-linked bank account on the 15th of every month.',
    'ஒவ்வொரு மாதமும் ₹1,000 (ஆண்டுக்கு ₹12,000) பயனாளியின் வங்கிக் கணக்கில் நேரடியாகச் செலுத்தப்படும்.',
    'Special Programme Implementation Department, Government of Tamil Nadu',
    'சிறப்புத் திட்ட செயலாக்கத் துறை, தமிழ்நாடு அரசு',
    'state',
    'TN',
    ARRAY['women', 'families'],
    'Applications and grievance petitions are filed at designated special camps or e-Sevai centres using the Smart Family Card (Ration Card) and bank passbook.',
    'குடும்ப அட்டை மற்றும் வங்கிக் கணக்குப் புத்தகத்துடன் இ-சேவை மையங்கள் அல்லது சிறப்பு முகாம்கள் மூலம் விண்ணப்பிக்கலாம்.',
    'https://kmut.tn.gov.in/',
    'https://kmut.tn.gov.in/',
    '2026-11-15T17:25:00Z',
    true,
    'active'
  ),

  -- 4. CMCHIS (TN State - Healthcare)
  (
    '20000000-0000-4000-8000-000000000004',
    'cmchis-tamil-nadu',
    '10000000-0000-4000-8000-000000000004',
    'Chief Minister''s Comprehensive Health Insurance Scheme (CMCHIS)',
    'முதலமைச்சரின் விரிவான மருத்துவக் காப்பீட்டுத் திட்டம் (CMCHIS)',
    'Cashless hospitalization and surgical coverage up to ₹5,00,000 per family per year for eligible Tamil Nadu families.',
    'தமிழ்நாட்டில் தகுதியுள்ள குடும்பங்களுக்கு ஆண்டுக்கு ₹5,00,000 வரை கட்டணமில்லா மருத்துவக் காப்பீட்டுத் திட்டம்.',
    'CMCHIS provides quality cashless medical and surgical care through empanelled government and private hospitals across Tamil Nadu for families whose annual family income is below ₹1,20,000, covering over 1,000 medical packages, diagnostic procedures, and follow-up treatments.',
    'ஆண்டு குடும்ப வருமானம் ₹1,20,000-க்குக் குறைவாக உள்ள குடும்பங்களுக்கு அரசு மற்றும் அங்கீகரிக்கப்பட்ட தனியார் மருத்துவமனைகளில் ஆண்டுக்கு ₹5,00,000 வரை கட்டணமில்லா உயர் சிகிச்சை வழங்கும் தமிழ்நாடு அரசின் மருத்துவக் காப்பீட்டுத் திட்டம்.',
    'Cashless medical coverage up to ₹5,00,000 per family per year across more than 800 government and 900 private empanelled hospitals.',
    'குடும்பத்திற்கு ஆண்டுக்கு ₹5,00,000 வரை அரசு மற்றும் அங்கீகரிக்கப்பட்ட தனியார் மருத்துவமனைகளில் கட்டணமில்லா மருத்துவச் சிகிச்சை.',
    'Health and Family Welfare Department, Government of Tamil Nadu',
    'மருத்துவம் மற்றும் மக்கள் நல்வாழ்வுத் துறை, தமிழ்நாடு அரசு',
    'state',
    'TN',
    ARRAY['families', 'senior_citizens'],
    'Obtain an Income Certificate (below ₹1,20,000/year) via e-Sevai and enrol at the District Collectorate CMCHIS Kiosk with the Family Smart Card to receive the health insurance e-card.',
    'இ-சேவை மையம் மூலம் வருமானச் சான்றிதழ் பெற்று, குடும்ப அட்டையுடன் மாவட்ட ஆட்சியர் அலுவலகத்தில் உள்ள காப்பீட்டு மையத்தில் பதிவு செய்து மருத்துவக் காப்பீட்டு அட்டையைப் பெறலாம்.',
    'https://www.cmchistn.com/',
    'https://www.cmchistn.com/',
    '2026-11-15T17:25:00Z',
    true,
    'active'
  ),

  -- 5. Dr. Muthulakshmi Reddy Maternity Benefit Scheme (TN State - Healthcare)
  (
    '20000000-0000-4000-8000-000000000005',
    'dr-muthulakshmi-reddy-maternity-benefit',
    '10000000-0000-4000-8000-000000000004',
    'Dr. Muthulakshmi Reddy Maternity Benefit Scheme',
    'டாக்டர் முத்துலட்சுமி ரெட்டி மகப்பேறு நிதியுதவித் திட்டம்',
    'Maternity financial assistance and nutrition kits totaling ₹18,000 for pregnant mothers from economically weaker families in Tamil Nadu.',
    'தமிழ்நாட்டில் ஏழை கர்ப்பிணித் தாய்மார்களுக்கு ஊட்டச்சத்துப் பெட்டகம் மற்றும் நிதியுதவியாக மொத்தம் ₹18,000 வழங்கும் திட்டம்.',
    'Provides ₹18,000 (₹14,000 direct financial assistance in three instalments + ₹4,000 worth of two Amma Maternity Nutrition Kits) to pregnant women aged 19 years and above (up to two deliveries) to compensate for wage loss and ensure maternal and infant nutrition and full immunization.',
    'ஏழைக் குடும்பங்களைச் சேர்ந்த கர்ப்பிணிப் பெண்களின் (19 வயது நிரம்பியவர்கள், முதல் இரண்டு பிரசவங்களுக்கு) பேறுகால ஊட்டச்சத்து மற்றும் குழந்தையின் தடுப்பூசியை உறுதி செய்ய ₹14,000 ரொக்க நிதியுதவியும் ₹4,000 மதிப்புள்ள ஊட்டச்சத்துப் பெட்டகமும் சேர்த்து மொத்தம் ₹18,000 வழங்கப்படுகிறது.',
    '₹18,000 total benefit (₹14,000 bank transfer in three milestone instalments + 2 nutrition kits worth ₹4,000).',
    'மொத்தம் ₹18,000 மதிப்பிலான உதவி (₹14,000 வங்கி நேரடிப் பணப்பரிமாற்றம் + ₹4,000 மதிப்புள்ள 2 ஊட்டச்சத்துப் பெட்டகங்கள்).',
    'Directorate of Public Health and Preventive Medicine, Government of Tamil Nadu',
    'பொது சுகாதாரம் மற்றும் நோய்த் தடுப்பு மருந்துத் துறை, தமிழ்நாடு அரசு',
    'state',
    'TN',
    ARRAY['women', 'families'],
    'Register pregnancy early (within 12 weeks) on the PICME portal or through the Village Health Nurse (VHN) / Urban Primary Health Centre to receive a 12-digit RCH/PICME ID.',
    'கர்ப்பம் தரித்த 12 வாரங்களுக்குள் கிராம சுகாதாரச் செவிலியர் (VHN), ஆரம்ப சுகாதார நிலையம் அல்லது PICME இணையதளத்தில் பதிவு செய்து RCH/PICME எண்ணைப் பெற வேண்டும்.',
    'https://picme.tn.gov.in/',
    'https://picme.tn.gov.in/',
    '2026-11-15T17:25:00Z',
    true,
    'active'
  ),

  -- 6. Naan Mudhalvan (TN State - Employment & Skills)
  (
    '20000000-0000-4000-8000-000000000006',
    'naan-mudhalvan-skill-development',
    '10000000-0000-4000-8000-000000000006',
    'Naan Mudhalvan Skill Development & Career Guidance Initiative',
    'நான் முதல்வன் திறன் மேம்பாடு மற்றும் வழிகாட்டுதல் திட்டம்',
    'Industry-aligned skill training, certifications, competitive exam scholarships, and placement support for Tamil Nadu students and youth.',
    'தமிழ்நாடு மாணவர்கள் மற்றும் இளைஞர்களுக்குத் தொழில் திறன் பயிற்சி, போட்டித் தேர்வு ஊக்கத்தொகை மற்றும் வேலைவாய்ப்பு வழிகாட்டுதல் திட்டம்.',
    'Implemented by the Tamil Nadu Skill Development Corporation (TNSDC), Naan Mudhalvan equips college students and unemployed youth in Tamil Nadu with industry-recognized technical certifications, spoken English and foreign languages, UPSC/SSC/Banking exam stipends, and direct campus placement drives.',
    'தமிழ்நாடு திறன் மேம்பாட்டுக் கழகம் (TNSDC) மூலம் கல்லூரி மாணவர்கள் மற்றும் இளைஞர்களுக்கு நவீன தொழில்நுட்பப் பயிற்சிகள், மொழித் திறன், மத்திய அரசுப் போட்டித் தேர்வுகளுக்கான ஊக்கத்தொகை மற்றும் வேலைவாய்ப்பு முகாம்களை வழங்கும் முதன்மைத் திட்டம்.',
    'Free or heavily subsidized industry certifications, competitive exam stipends (e.g., ₹7,500/month for UPSC Prelims coaching), and placement access.',
    'கட்டணமில்லாத் தொழில் திறன் சான்றிதழ் பயிற்சிகள், போட்டித் தேர்வு உதவித்தொகை மற்றும் நேரடி வேலைவாய்ப்பு இணைப்பு.',
    'Tamil Nadu Skill Development Corporation (TNSDC), Government of Tamil Nadu',
    'தமிழ்நாடு திறன் மேம்பாட்டுக் கழகம் (TNSDC), தமிழ்நாடு அரசு',
    'state',
    'TN',
    ARRAY['students', 'job_seekers'],
    'Sign in to the official Naan Mudhalvan portal using institutional credentials or register directly for open skilling and competitive examination programmes.',
    'நான் முதல்வன் அதிகாரப்பூர்வ இணையதளத்தில் கல்லூரிப் பதிவு எண் அல்லது சுயவிவரம் மூலம் உள்நுழைந்து திறன் பயிற்சிகள் மற்றும் தேர்வுப் பிரிவுகளில் விண்ணப்பிக்கலாம்.',
    'https://www.naanmudhalvan.tn.gov.in/',
    'https://www.naanmudhalvan.tn.gov.in/',
    '2026-11-15T17:25:00Z',
    true,
    'active'
  ),

  -- 7. TN First Generation Graduate Tuition Fee Concession (TN State - Education)
  (
    '20000000-0000-4000-8000-000000000007',
    'tn-first-generation-graduate-scholarship',
    '10000000-0000-4000-8000-000000000001',
    'Tamil Nadu First Generation Graduate Tuition Fee Concession Scheme',
    'தமிழ்நாடு முதல் தலைமுறை பட்டதாரி கல்விக்கட்டணச் சலுகைத் திட்டம்',
    'Annual tuition fee concession for students in Tamil Nadu who are the first person in their family to pursue an undergraduate professional degree.',
    'குடும்பத்தில் முதன்முறையாகப் பட்டப்படிப்பு பயிலும் தமிழ்நாடு மாணவர்களுக்கான கல்விக்கட்டணச் சலுகைத் திட்டம்.',
    'Supports students domiciled in Tamil Nadu whose parents or siblings have not completed any graduate degree, providing annual tuition fee waivers for professional undergraduate courses (Engineering, Medicine, Law, Agriculture, Veterinary) admitted through single-window government counselling.',
    'குடும்பத்தில் இதுவரை பட்டதாரிகளே இல்லாத நிலையில், அரசு ஒற்றைச்சாளரக் கலந்தாய்வு (Single Window Counselling) மூலம் பொறியியல், மருத்துவம், சட்டம், வேளாண்மை போன்ற தொழில்முறைப் பட்டப்படிப்புகளில் சேரும் தமிழ்நாடு மாணவர்களுக்கு ஆண்டுக் கல்விக்கட்டணச் சலுகை வழங்கப்படுகிறது.',
    'Tuition fee waiver of ₹25,000 to ₹27,500 per academic year for eligible professional degree programmes.',
    'தொழில்முறைப் பட்டப்படிப்புகளுக்கு ஆண்டுக்கு ₹25,000 முதல் ₹27,500 வரை கல்விக்கட்டணத் தள்ளுபடி.',
    'Higher Education Department, Government of Tamil Nadu',
    'உயர்கல்வித் துறை, தமிழ்நாடு அரசு',
    'state',
    'TN',
    ARRAY['students'],
    'Apply for the First Generation Graduate Certificate on the Tamil Nadu e-Sevai portal (TNeGA) and submit the verified certificate during single-window admission counselling.',
    'தமிழ்நாடு இ-சேவை (TNeGA) தளத்தில் முதல் தலைமுறை பட்டதாரிச் சான்றிதழுக்கு விண்ணப்பித்து, பெற்ற சான்றிதழைக் கலந்தாய்வின் போது சமர்ப்பிக்க வேண்டும்.',
    'https://www.tnesevai.tn.gov.in/',
    'https://www.tnesevai.tn.gov.in/',
    '2026-11-15T17:25:00Z',
    true,
    'active'
  ),

  -- 8. TN UYEGP Self-Employment Scheme (TN State - Small Business Support)
  (
    '20000000-0000-4000-8000-000000000008',
    'tn-uyegp-self-employment-scheme',
    '10000000-0000-4000-8000-000000000008',
    'Unemployed Youth Employment Generation Programme (UYEGP)',
    'படித்த வேலைவாய்ப்பற்ற இளைஞர்களுக்கான வேலைவாய்ப்பு உருவாக்கும் திட்டம் (UYEGP)',
    'Subsidized bank loan up to ₹15,00,000 with 25% Government capital subsidy for educated unemployed youth in Tamil Nadu starting manufacturing enterprises.',
    'தமிழ்நாட்டில் படித்த வேலைவாய்ப்பற்ற இளைஞர்கள் உற்பத்தித் தொழில் தொடங்க 25% அரசு மானியத்துடன் ₹15,00,000 வரை வங்கிக் கடன்.',
    'Administered by the MSME Department and District Industries Centres (DIC) in Tamil Nadu, UYEGP helps educated youth (passed at least Class 8) establish manufacturing enterprises with project cost up to ₹15 lakh, providing a 25% state capital subsidy.',
    'தமிழ்நாடு குறு, சிறு மற்றும் நடுத்தரத் தொழில் நிறுவனங்கள் துறை மற்றும் மாவட்டத் தொழில் மையங்கள் (DIC) மூலம் படித்த இளைஞர்கள் சுயதொழில் தொடங்க 25% அரசு மானியத்துடன் (அதிகபட்சம் ₹2.50 இலட்சம்; சிறப்புப் பிரிவினருக்கு ₹3.75 இலட்சம் வரை) வங்கிக் கடன் வழங்கப்படுகிறது.',
    '25% capital subsidy on project cost (up to ₹2,50,000 general / ₹3,75,000 special category) on loans up to ₹15,00,000.',
    '₹15,00,000 வரையிலான திட்டத் தொகையில் 25% அரசு மானியம் (₹2,50,000 முதல் ₹3,75,000 வரை).',
    'MSME Department & Directorate of Industries and Commerce, Government of Tamil Nadu',
    'குறு, சிறு மற்றும் நடுத்தரத் தொழில் நிறுவனங்கள் துறை, தமிழ்நாடு அரசு',
    'state',
    'TN',
    ARRAY['job_seekers', 'small_business'],
    'Submit an online application with project quotation and educational/residence certificates on the Tamil Nadu MSME UYEGP portal for District Industries Centre (DIC) interview and bank sanction.',
    'தமிழ்நாடு MSME UYEGP இணையதளத்தில் திட்ட அறிக்கை மற்றும் சான்றிதழ்களுடன் விண்ணப்பித்து, மாவட்டத் தொழில் மைய நேர்காணல் மூலம் வங்கிக் கடன் பெறலாம்.',
    'https://www.msmeonline.tn.gov.in/uyegp/',
    'https://www.msmeonline.tn.gov.in/uyegp/',
    '2026-11-15T17:25:00Z',
    true,
    'active'
  ),

  -- 9. PM-KISAN (Central - Agriculture)
  (
    '20000000-0000-4000-8000-000000000009',
    'pm-kisan-samman-nidhi',
    '10000000-0000-4000-8000-000000000005',
    'Pradhan Mantri Kisan Samman Nidhi (PM-KISAN)',
    'பிரதான் மந்திரி கிசான் சம்மான் நிதி (PM-KISAN)',
    'Annual income support of ₹6,000 in three equal instalments for landholding farmer families across India.',
    'வேளாண் நிலம் வைத்துள்ள விவசாயக் குடும்பங்களுக்கு ஆண்டுக்கு ₹6,000 (மூன்று தவணைகளில்) நேரடி வருமான ஆதரவு வழங்கும் திட்டம்.',
    'PM-KISAN is a Central Sector scheme with 100% funding from the Government of India that supplements the financial needs of landholding farmer families for procuring crop inputs. ₹6,000 per year is transferred in three 4-monthly instalments of ₹2,000 directly into Aadhaar-seeded bank accounts.',
    'சாகுபடி நிலம் வைத்துள்ள விவசாயக் குடும்பங்களின் வேளாண் இடுபொருள் செலவுகளுக்கு உதவும் வகையில், இந்திய அரசால் ஆண்டுக்கு ₹6,000 நிதியுதவி நான்கு மாதங்களுக்கு ஒருமுறை ₹2,000 வீதம் மூன்று சம தவணைகளில் நேரடியாக வங்கிக் கணக்கில் செலுத்தப்படுகிறது.',
    '₹6,000 per year (₹2,000 every four months) transferred directly via DBT.',
    'ஆண்டுக்கு ₹6,000 (4 மாதங்களுக்கு ஒருமுறை ₹2,000 வீதம் 3 தவணைகள்) நேரடி வங்கிப் பரிமாற்றம்.',
    'Ministry of Agriculture and Farmers Welfare, Government of India',
    'வேளாண்மை மற்றும் உழவர் நல அமைச்சகம், இந்திய அரசு',
    'central',
    'ALL',
    ARRAY['farmers'],
    'Register under "New Farmer Registration" on the official PM-KISAN portal or through a Common Service Centre (CSC) with land ownership records (Chitta/Patta) and complete e-KYC.',
    'அதிகாரப்பூர்வ PM-KISAN இணையதளம் அல்லது பொதுச் சேவை மையம் (CSC) மூலம் நிலப்பட்டா/சிட்டா ஆவணங்களுடன் பதிவு செய்து e-KYC சரிபார்ப்பை நிறைவு செய்யவும்.',
    'https://pmkisan.gov.in/',
    'https://pmkisan.gov.in/RegistrationFormNew.aspx',
    '2026-11-15T17:25:00Z',
    true,
    'active'
  ),

  -- 10. PM Fasal Bima Yojana (Central - Agriculture)
  (
    '20000000-0000-4000-8000-000000000010',
    'pm-fasal-bima-yojana',
    '10000000-0000-4000-8000-000000000005',
    'Pradhan Mantri Fasal Bima Yojana (PMFBY)',
    'பிரதான் மந்திரி பயிர்க் காப்பீட்டுத் திட்டம் (PMFBY)',
    'Comprehensive crop insurance protecting farmers against yield losses from natural calamities, pests, and unseasonal weather.',
    'இயற்கைப் பேரிடர்கள், வறட்சி, வெள்ளம் மற்றும் பூச்சித் தாக்குதலால் ஏற்படும் பயிர் இழப்புகளிலிருந்து விவசாயிகளைப் பாதுகாக்கும் பயிர்க் காப்பீட்டுத் திட்டம்.',
    'PMFBY provides affordable financial support and crop insurance coverage to farmers cultivating notified crops in notified areas. Farmers pay a capped uniform premium (2% for Kharif, 1.5% for Rabi, and 5% for commercial/horticultural crops), while the remaining actuarial premium is subsidized by Central and State Governments.',
    'அறிவிக்கப்பட்ட பகுதிகளில் சாகுபடி செய்யும் விவசாயிகளுக்கு மிகக் குறைந்த காப்பீட்டுத் தொகையில் (காரிஃப் பருவப் பயிர்களுக்கு 2%, ரபி பருவப் பயிர்களுக்கு 1.5%, தோட்டக்கலைப் பயிர்களுக்கு 5%) விரிவான பயிர் இழப்பீட்டுப் பாதுகாப்பை மத்திய மற்றும் மாநில அரசுகளின் மானியத்துடன் வழங்குகிறது.',
    'Full insured sum coverage against prevented sowing, standing crop loss, post-harvest loss, and localized calamities at heavily subsidized premium rates.',
    'குறைந்த பிரிமியம் தொகையில் விதைப்புத் தடை, பயிர் சேதம் மற்றும் அறுவடைக்குப் பிந்தைய இழப்புகளுக்கு முழுக் காப்பீட்டுத் தொகை பாதுகாப்பு.',
    'Ministry of Agriculture and Farmers Welfare, Government of India',
    'வேளாண்மை மற்றும் உழவர் நல அமைச்சகம், இந்திய அரசு',
    'central',
    'ALL',
    ARRAY['farmers'],
    'Enrol before the seasonal cut-off date via the PMFBY portal, lending bank, Primary Agricultural Cooperative Credit Society (PACCS), or Common Service Centre with Adangal/sowing certificate.',
    'பருவகாலக் காலக்கெடுவுக்குள் PMFBY இணையதளம், தொடக்க வேளாண்மைக் கூட்டுறவுக் கடன் சங்கம் (PACCS), வங்கி அல்லது இ-சேவை மையம் மூலம் அடங்கல் சான்றுடன் பதிவு செய்யவும்.',
    'https://pmfby.gov.in/',
    'https://pmfby.gov.in/',
    '2026-11-15T17:25:00Z',
    true,
    'active'
  ),

  -- 11. Ayushman Bharat PM-JAY (Central - Healthcare)
  (
    '20000000-0000-4000-8000-000000000011',
    'ayushman-bharat-pm-jay',
    '10000000-0000-4000-8000-000000000004',
    'Ayushman Bharat — Pradhan Mantri Jan Arogya Yojana (AB PM-JAY)',
    'ஆயுஷ்மான் பாரத் — பிரதான் மந்திரி ஜன் ஆரோக்கிய யோஜனா (AB PM-JAY)',
    'Cashless secondary and tertiary hospitalization cover of ₹5,00,000 per family per year across India, including coverage for all senior citizens aged 70+.',
    'இந்தியா முழுவதும் அங்கீகரிக்கப்பட்ட மருத்துவமனைகளில் குடும்பத்திற்கு ஆண்டுக்கு ₹5,00,000 வரை கட்டணமில்லா மருத்துவக் காப்பீடு (70 வயதுக்கு மேற்பட்ட மூத்த குடிமக்கள் உட்பட).',
    'AB PM-JAY is the national public health assurance scheme providing ₹5,00,000 per family per year for secondary and tertiary hospitalization across empanelled hospitals nationwide, implemented in convergence with CMCHIS in Tamil Nadu and expanded to cover all senior citizens aged 70 years and above regardless of income.',
    'நாடு முழுவதும் உள்ள அரசு மற்றும் அங்கீகரிக்கப்பட்ட தனியார் மருத்துவமனைகளில் ஆண்டுக்கு ₹5,00,000 வரை கட்டணமில்லா உள்நோயாளி சிகிச்சை வழங்கும் திட்டம். தமிழ்நாட்டில் முதலமைச்சரின் காப்பீட்டுத் திட்டத்துடன் இணைந்து செயல்படுத்தப்படுகிறது மற்றும் 70 வயதுக்கு மேற்பட்ட அனைத்து மூத்த குடிமக்களுக்கும் வருமான வரம்பின்றிப் பொருந்தும்.',
    'Cashless health cover up to ₹5,00,000 per family per year with nationwide portability across empanelled hospitals.',
    'ஆண்டுக்கு ₹5,00,000 வரை நாடு முழுவதும் உள்ள அங்கீகரிக்கப்பட்ட மருத்துவமனைகளில் கட்டணமில்லா மருத்துவச் சிகிச்சை.',
    'National Health Authority, Ministry of Health and Family Welfare, Government of India',
    'தேசிய சுகாதார ஆணையம், சுகாதாரம் மற்றும் குடும்ப நல அமைச்சகம், இந்திய அரசு',
    'central',
    'ALL',
    ARRAY['families', 'senior_citizens'],
    'Verify eligibility and generate the Ayushman Card on the National Health Authority (NHA) beneficiary portal or at an empanelled hospital Ayushman Mitra desk.',
    'NHA பயனாளிகள் இணையதளம் (beneficiary.nha.gov.in) அல்லது அங்கீகரிக்கப்பட்ட மருத்துவமனைகளில் உள்ள ஆயுஷ்மான் மித்ரா மையத்தில் தகுதியைச் சரிபார்த்து அட்டையைப் பெறலாம்.',
    'https://pmjay.gov.in/',
    'https://beneficiary.nha.gov.in/',
    '2026-11-15T17:25:00Z',
    true,
    'active'
  ),

  -- 12. Central Sector Scholarship (Central - Education)
  (
    '20000000-0000-4000-8000-000000000012',
    'central-sector-scholarship-college-university',
    '10000000-0000-4000-8000-000000000001',
    'Central Sector Scheme of Scholarships for College and University Students (CSSS)',
    'கல்லூரி மற்றும் பல்கலைக்கழக மாணவர்களுக்கான மத்திய அரசு கல்வி உதவித்தொகைத் திட்டம் (CSSS)',
    'Merit-cum-means scholarship of ₹12,000 to ₹20,000 per year for regular undergraduate and postgraduate students from families with annual income up to ₹4.5 lakh.',
    'ஆண்டு குடும்ப வருமானம் ₹4.5 இலட்சத்திற்குள் உள்ள தகுதியான கல்லூரி மற்றும் பல்கலைக்கழக மாணவர்களுக்கு ஆண்டுக்கு ₹12,000 முதல் ₹20,000 வரை கல்வி உதவித்தொகை.',
    'Funded by the Department of Higher Education, Government of India, CSSS supports meritorious students (above the 80th percentile in Class 12 board examinations) from families with annual income up to ₹4,50,000 to meet day-to-day expenses while pursuing regular degree courses in recognized institutions.',
    '12-ஆம் வகுப்பு பொதுத்தேர்வில் சிறந்த மதிப்பெண்கள் பெற்று (80 சதவீதப் பிரிவுக்கு மேல்), ஆண்டு குடும்ப வருமானம் ₹4,50,000-க்கு மிகாமல் உள்ள மாணவர்கள் அங்கீகரிக்கப்பட்ட கல்வி நிறுவனங்களில் பட்டப்படிப்பு மற்றும் முதுகலைப் படிப்பு பயில மத்திய உயர்கல்வித் துறையால் வழங்கப்படும் உதவித்தொகை.',
    '₹12,000 per annum during the first three years of Graduation courses and ₹20,000 per annum at Post-Graduation level and 4th/5th year of integrated/professional courses.',
    'இளங்கலைப் படிப்பின் முதல் 3 ஆண்டுகளுக்கு ஆண்டுக்கு ₹12,000 மற்றும் முதுகலை / 4, 5-ஆம் ஆண்டுத் தொழில்முறைப் படிப்புகளுக்கு ஆண்டுக்கு ₹20,000.',
    'Department of Higher Education, Ministry of Education, Government of India',
    'உயர்கல்வித் துறை, கல்வி அமைச்சகம், இந்திய அரசு',
    'central',
    'ALL',
    ARRAY['students'],
    'Complete One-Time Registration (OTR) and submit the scholarship application online through the National Scholarship Portal (NSP) for institute and state nodal verification.',
    'தேசிய கல்வி உதவித்தொகை இணையதளத்தில் (scholarships.gov.in) ஒருமுறைப் பதிவு (OTR) செய்து, சான்றிதழ்களுடன் ஆன்லைனில் விண்ணப்பித்து கல்லூரிச் சரிபார்ப்பை முடிக்கவும்.',
    'https://scholarships.gov.in/',
    'https://scholarships.gov.in/',
    '2026-11-15T17:25:00Z',
    true,
    'active'
  ),

  -- 13. PM SVANidhi (Central - Small Business Support)
  (
    '20000000-0000-4000-8000-000000000013',
    'pm-svanidhi-street-vendor-loan',
    '10000000-0000-4000-8000-000000000008',
    'PM Street Vendor''s AtmaNirbhar Nidhi (PM SVANidhi)',
    'பிஎம் ஸ்வநிதி சாலையோர வியாபாரிகள் தன்னிறைவு நிதித் திட்டம் (PM SVANidhi)',
    'Collateral-free working capital loans of ₹10,000, ₹20,000, and ₹50,000 with 7% interest subsidy for urban street vendors.',
    'சாலையோர வியாபாரிகளுக்குப் பிணையமில்லாத ₹10,000, ₹20,000 மற்றும் ₹50,000 நடைமுறை மூலதனக் கடன் மற்றும் 7% வட்டி மானியம்.',
    'PM SVANidhi empowers street vendors to resume and expand their livelihoods through collateral-free working capital loans in three progressive tranches (₹10,000, ₹20,000, and ₹50,000), rewarding timely repayment with a 7% interest subsidy and digital UPI transactions with cashback up to ₹1,200 per year.',
    'சாலையோர வியாபாரிகளின் வாழ்வாதாரத்தை வலுப்படுத்த எந்தவிதப் பிணையமும் இன்றி முதல் தவணையாக ₹10,000, முறையாகத் திருப்பிச் செலுத்தினால் இரண்டாம் தவணையாக ₹20,000 மற்றும் மூன்றாம் தவணையாக ₹50,000 கடன் வழங்கப்படுகிறது. மேலும் 7% வட்டி மானியமும் டிஜிட்டல் பரிவர்த்தனை ஊக்கத்தொகையும் உண்டு.',
    'Collateral-free working capital credit up to ₹10,000 / ₹20,000 / ₹50,000 + 7% interest subsidy + up to ₹1,200/year digital cashback.',
    'பிணையமில்லா ₹10,000 / ₹20,000 / ₹50,000 கடன் + 7% வட்டி மானியம் + ஆண்டுக்கு ₹1,200 வரை டிஜிட்டல் பரிவர்த்தனை ஊக்கத்தொகை.',
    'Ministry of Housing and Urban Affairs, Government of India',
    'வீட்டுவசதி மற்றும் நகர்ப்புற விவகாரங்கள் அமைச்சகம், இந்திய அரசு',
    'central',
    'ALL',
    ARRAY['small_business'],
    'Apply online on the PM SVANidhi portal or through an Urban Local Body (ULB) / Common Service Centre using a Certificate of Vending, Voter ID, and bank account details.',
    'PM SVANidhi இணையதளம், நகராட்சி அலுவலகம் அல்லது பொதுச் சேவை மையம் மூலம் வியாபார அடையாள அட்டை / பரிந்துரைக் கடிதம் மற்றும் வங்கிக் கணக்குடன் விண்ணப்பிக்கலாம்.',
    'https://pmsvanidhi.mohua.gov.in/',
    'https://pmsvanidhi.mohua.gov.in/',
    '2026-11-15T17:25:00Z',
    true,
    'active'
  ),

  -- 14. PM Vishwakarma (Central - Employment & Skills)
  (
    '20000000-0000-4000-8000-000000000014',
    'pm-vishwakarma-artisan-scheme',
    '10000000-0000-4000-8000-000000000006',
    'PM Vishwakarma Scheme for Traditional Artisans and Craftspeople',
    'பாரம்பரிய கைவினைஞர்கள் மற்றும் கலைஞர்களுக்கான பிஎம் விஸ்வகர்மா திட்டம்',
    'Holistic support for 18 traditional trades with artisan certification, ₹15,000 toolkit e-voucher, paid skill training, and concessional loans up to ₹3,00,000.',
    '18 வகையான பாரம்பரியக் கைவினைக் கலைஞர்களுக்கு அடையாள அட்டை, ₹15,000 கருவித்தொகுப்பு மானியம், உதவித்தொகையுடன் பயிற்சி மற்றும் ₹3,00,000 வரை குறைந்த வட்டிக் கடன்.',
    'PM Vishwakarma supports traditional artisans and craftspeople working with their hands and tools across 18 recognized trades (carpenter, blacksmith, goldsmith, potter, mason, tailor, weaver, barber, cobbler, etc.) with formal recognition, skill upgradation, toolkit grant, and collateral-free credit at 5% concessional interest.',
    'தச்சுத் தொழில், கொல்லர், குயவர், கொத்தனார், தையல்காரர், சலவையாளர், முடிதிருத்துபவர் உள்ளிட்ட 18 பாரம்பரியத் தொழில்களில் ஈடுபட்டுள்ள கைவினைஞர்களுக்கு விஸ்வகர்மா சான்றிதழ், நாள் ஒன்றுக்கு ₹500 உதவித்தொகையுடன் பயிற்சி, ₹15,000 கருவிகள் வாங்கும் மானியம் மற்றும் 5% குறைந்த வட்டியில் ₹3,00,000 வரை பிணையமில்லாக் கடன் வழங்கப்படுகிறது.',
    '₹15,000 toolkit incentive + ₹500/day training stipend + collateral-free loan up to ₹3,00,000 (₹1,00,000 + ₹2,00,000) at 5% interest.',
    '₹15,000 கருவித்தொகுப்பு e-Voucher + பயிற்சிக் காலத்தில் தினசரி ₹500 உதவித்தொகை + 5% வட்டியில் ₹3,00,000 வரை பிணையமில்லாக் கடன்.',
    'Ministry of Micro, Small and Medium Enterprises, Government of India',
    'குறு, சிறு மற்றும் நடுத்தரத் தொழில் நிறுவனங்கள் அமைச்சகம், இந்திய அரசு',
    'central',
    'ALL',
    ARRAY['artisans', 'small_business', 'job_seekers'],
    'Enrol through the nearest Common Service Centre (CSC) on the official PM Vishwakarma portal for three-stage verification (Panchayat/ULB, District, and State Committee).',
    'அருகிலுள்ள பொதுச் சேவை மையம் (CSC) மூலம் PM Vishwakarma இணையதளத்தில் பதிவு செய்து உள்ளாட்சி மற்றும் மாவட்ட அளவிலான சரிபார்ப்புக்குப் பின் பயன்பெறலாம்.',
    'https://pmvishwakarma.gov.in/',
    'https://pmvishwakarma.gov.in/',
    '2026-11-15T17:25:00Z',
    true,
    'active'
  ),

  -- 15. PMAY-U 2.0 (Central - Housing)
  (
    '20000000-0000-4000-8000-000000000015',
    'pm-awas-yojana-urban-2',
    '10000000-0000-4000-8000-000000000007',
    'Pradhan Mantri Awas Yojana — Urban 2.0 (PMAY-U 2.0)',
    'பிரதான் மந்திரி ஆவாஸ் யோஜனா — நகர்ப்புற வீட்டுவசதித் திட்டம் 2.0 (PMAY-U 2.0)',
    'Financial assistance up to ₹2,50,000 for house construction or home loan interest subsidy up to ₹1,80,000 for urban EWS/LIG/MIG families without a pucca house.',
    'நகர்ப்புறப் பகுதிகளில் சொந்தக் கான்கிரீட் வீடு இல்லாத குடும்பங்களுக்கு வீடு கட்ட ₹2,50,000 வரை நிதியுதவி அல்லது வீட்டுக் கடன் வட்டி மானியம்.',
    'PMAY-U 2.0 assists urban Economically Weaker Section (EWS, income up to ₹3 lakh), Lower Income Group (LIG, income up to ₹6 lakh), and Middle Income Group (MIG, income up to ₹9 lakh) families who do not own a pucca house anywhere in India through Beneficiary-Led Construction (BLC), Affordable Housing in Partnership (AHP), and Interest Subsidy Scheme (ISS).',
    'இந்தியாவின் எந்தப் பகுதியிலும் சொந்தமாகக் கான்கிரீட் வீடு இல்லாத நகர்ப்புற EWS (வருமானம் ₹3 இலட்சம் வரை), LIG (₹6 இலட்சம் வரை) மற்றும் MIG (₹9 இலட்சம் வரை) குடும்பங்கள் சொந்த வீடு கட்ட ₹2.50 இலட்சம் வரை மானியம் அல்லது வீட்டுக் கடனுக்கு ₹1.80 இலட்சம் வரை வட்டி மானியம் வழங்கப்படுகிறது.',
    'Up to ₹2,50,000 central/state construction assistance under BLC/AHP or up to ₹1,80,000 interest subsidy under ISS.',
    'வீடு கட்ட ₹2,50,000 வரை நிதியுதவி அல்லது வீட்டுக் கடனுக்கு ₹1,80,000 வரை வட்டி மானியம்.',
    'Ministry of Housing and Urban Affairs, Government of India',
    'வீட்டுவசதி மற்றும் நகர்ப்புற விவகாரங்கள் அமைச்சகம், இந்திய அரசு',
    'central',
    'ALL',
    ARRAY['families'],
    'Complete the unified beneficiary survey and submit the online application on the PMAY-U 2.0 portal with income certificate, land/property documents, and family details.',
    'PMAY-U 2.0 அதிகாரப்பூர்வ இணையதளத்தில் வருமானச் சான்றிதழ், நில ஆவணம் மற்றும் குடும்ப விவரங்களுடன் ஆன்லைனில் விண்ணப்பிக்கவும்.',
    'https://pmaymis.gov.in/',
    'https://pmaymis.gov.in/PMAYMIS2_2024/PmayDefault.aspx',
    '2026-11-15T17:25:00Z',
    true,
    'active'
  ),

  -- 16. IGNOAPS Senior Citizen Pension (Central / TN NSAP - Social Welfare)
  (
    '20000000-0000-4000-8000-000000000016',
    'ignoas-senior-citizen-pension',
    '10000000-0000-4000-8000-000000000009',
    'Indira Gandhi National Old Age Pension Scheme (IGNOAPS)',
    'இந்திரா காந்தி தேசிய முதியோர் ஓய்வூதியத் திட்டம் (IGNOAPS)',
    'Monthly social security pension for destitute senior citizens aged 60 years and above from Below Poverty Line households.',
    'வறுமைக்கோட்டிற்குக் கீழ் உள்ள 60 வயது மற்றும் அதற்கு மேற்பட்ட ஆதரவற்ற மூத்த குடிமக்களுக்கான மாதாந்திர ஓய்வூதியத் திட்டம்.',
    'Part of the National Social Assistance Programme (NSAP) of the Government of India and supplemented by the Government of Tamil Nadu, IGNOAPS provides monthly financial assistance (₹1,200/month in Tamil Nadu including State share) to destitute senior citizens aged 60 years and above.',
    'மத்திய அரசின் தேசிய சமூக உதவிகள் திட்டத்தின் (NSAP) கீழ் செயல்படுத்தப்பட்டு தமிழ்நாடு அரசின் கூடுதல் பங்களிப்புடன், 60 வயது நிரம்பிய ஏழை மற்றும் ஆதரவற்ற மூத்த குடிமக்களுக்கு மாதாந்திர ஓய்வூதியம் (தமிழ்நாட்டில் மாதம் ₹1,200) வழங்கப்படுகிறது.',
    'Monthly pension (₹1,200 per month in Tamil Nadu combining Central NSAP and State top-up) credited to the beneficiary''s bank or post office account.',
    'மாதந்தோறும் ஓய்வூதியம் (தமிழ்நாட்டில் மத்திய மற்றும் மாநில அரசுப் பங்களிப்புடன் மாதம் ₹1,200) வங்கி அல்லது அஞ்சலகக் கணக்கில் செலுத்தப்படும்.',
    'Ministry of Rural Development, Government of India & Revenue Department, Tamil Nadu',
    'ஊரக வளர்ச்சி அமைச்சகம், இந்திய அரசு மற்றும் வருவாய்த்துறை, தமிழ்நாடு அரசு',
    'central',
    'ALL',
    ARRAY['senior_citizens'],
    'Apply via the Tamil Nadu e-Sevai portal (TNeGA) or Taluk Office to the Tahsildar (Social Security Scheme) with age proof, income/BPL details, and bank passbook.',
    'வயதுச் சான்று, குடும்ப அட்டை மற்றும் வங்கிக் கணக்குப் புத்தகத்துடன் இ-சேவை மையம் அல்லது வட்டாட்சியர் அலுவலகத்தில் (சமூகப் பாதுகாப்புத் திட்டம்) விண்ணப்பிக்கலாம்.',
    'https://nsap.nic.in/',
    'https://www.tnesevai.tn.gov.in/',
    '2026-11-15T17:25:00Z',
    true,
    'active'
  ),

  -- 17. Sukanya Samriddhi Yojana (Central - Women & Child Welfare)
  (
    '20000000-0000-4000-8000-000000000017',
    'sukanya-samriddhi-yojana',
    '10000000-0000-4000-8000-000000000003',
    'Sukanya Samriddhi Yojana (SSY) Girl Child Savings Scheme',
    'சுகன்யா சம்ரித்தி யோஜனா (செல்வமகள் சேமிப்புத் திட்டம்)',
    'Government-backed high-interest, tax-free small savings scheme for the higher education and future financial security of girl children.',
    'பெண் குழந்தைகளின் உயர்கல்வி மற்றும் எதிர்காலப் பாதுகாப்பிற்காக அதிக வட்டி மற்றும் வரி விலக்கு அளிக்கும் மத்திய அரசின் செல்வமகள் சேமிப்புத் திட்டம்.',
    'Under the Beti Bachao Beti Padhao initiative, parents or legal guardians can open a Sukanya Samriddhi Account at any India Post office or authorized bank for a girl child below 10 years of age (up to two girl children per family), earning sovereign-guaranteed compound interest with full Section 80C tax exemption.',
    '10 வயதுக்குட்பட்ட பெண் குழந்தைகளின் பெயரில் பெற்றோர் அல்லது பாதுகாவலர் அஞ்சலகம் அல்லது அங்கீகரிக்கப்பட்ட வங்கிகளில் கணக்குத் தொடங்கலாம். ஆண்டுக்கு குறைந்தபட்சம் ₹250 முதல் அதிகபட்சம் ₹1,50,000 வரை செலுத்தி அரசு உத்தரவாத வட்டி மற்றும் முழு வருமான வரி விலக்குப் பெறலாம்.',
    'Sovereign-guaranteed high interest rate (8.2% p.a. notified rate), triple-exempt (EEE) tax benefit under Section 80C, and partial withdrawal of 50% at age 18 for higher education.',
    'அரசு உத்தரவாத உயர் வட்டி (ஆண்டுக்கு 8.2%), பிரிவு 80C-ன் கீழ் முழு வரி விலக்கு மற்றும் 18 வயதில் உயர்கல்விக்காக 50% தொகையை எடுக்கும் வசதி.',
    'Ministry of Finance & Department of Posts, Government of India',
    'நிதி அமைச்சகம் மற்றும் அஞ்சல் துறை, இந்திய அரசு',
    'central',
    'ALL',
    ARRAY['women', 'families'],
    'Visit the nearest India Post Office or authorized commercial bank branch with the girl child''s Birth Certificate and parent/guardian identity and address proof to open the account.',
    'பெண் குழந்தையின் பிறப்புச் சான்றிதழ் மற்றும் பெற்றோரின் அடையாள/முகவரிச் சான்றுடன் அருகிலுள்ள அஞ்சலகம் அல்லது வங்கிக் கிளையில் கணக்கைத் தொடங்கலாம்.',
    'https://www.nsiindia.gov.in/InternalPage.aspx?Id_Pk=89',
    'https://www.indiapost.gov.in/',
    '2026-11-15T17:25:00Z',
    true,
    'active'
  ),

  -- 18. Atal Pension Yojana (Central - Financial Assistance)
  (
    '20000000-0000-4000-8000-000000000018',
    'atal-pension-yojana',
    '10000000-0000-4000-8000-000000000002',
    'Atal Pension Yojana (APY) Guaranteed Social Security Pension',
    'அடல் பென்ஷன் யோஜனா (APY) உத்தரவாத ஓய்வூதியத் திட்டம்',
    'Government-guaranteed monthly pension of ₹1,000 to ₹5,000 after age 60 for citizens aged 18 to 40, particularly in the unorganized sector.',
    '18 முதல் 40 வயதுடைய அமைப்புசாராத் தொழிலாளர்கள் மற்றும் குடிமக்களுக்கு 60 வயதிற்குப் பிறகு மாதம் ₹1,000 முதல் ₹5,000 வரை உத்தரவாத ஓய்வூதியம்.',
    'Administered by PFRDA under the Ministry of Finance, Atal Pension Yojana enables Indian citizens aged 18 to 40 years (who are not income-tax payers) with a bank or post office savings account to make modest monthly contributions and receive a sovereign-guaranteed fixed monthly pension of ₹1,000, ₹2,000, ₹3,000, ₹4,000, or ₹5,000 from age 60.',
    'நிதி அமைச்சகத்தின் PFRDA ஆணையத்தால் செயல்படுத்தப்படும் இத்திட்டத்தில், 18 முதல் 40 வயதுக்குட்பட்ட வருமான வரி செலுத்தாத குடிமக்கள் சிறிய மாதாந்திரப் பங்களிப்பைச் செலுத்தி, 60 வயதுக்குப் பிறகு மாதம் ₹1,000 முதல் ₹5,000 வரை அரசு உத்தரவாத ஓய்வூதியம் பெறலாம்.',
    'Guaranteed monthly pension of ₹1,000, ₹2,000, ₹3,000, ₹4,000, or ₹5,000 from age 60 for the subscriber, continuing to the spouse thereafter.',
    '60 வயது முதல் சந்தாதாரருக்கு மாதம் ₹1,000 முதல் ₹5,000 வரை உத்தரவாத ஓய்வூதியம் மற்றும் அவருக்குப் பின் வாழ்க்கைத் துணைக்கும் ஓய்வூதியப் பாதுகாப்பு.',
    'Pension Fund Regulatory and Development Authority (PFRDA), Ministry of Finance, Government of India',
    'ஓய்வூதிய நிதி ஒழுங்காற்று மற்றும் மேம்பாட்டு ஆணையம் (PFRDA), நிதி அமைச்சகம், இந்திய அரசு',
    'central',
    'ALL',
    ARRAY['families', 'job_seekers', 'small_business'],
    'Enrol online via eNPS (NSDL/Protean) or through your savings bank branch / post office using auto-debit authorization.',
    'உங்கள் வங்கிக் கிளை, அஞ்சலகம் அல்லது eNPS (npscra.nsdl.co.in) இணையதளம் மூலம் சேமிப்புக் கணக்குடன் இணைத்து ஆன்லைனில் இணையலாம்.',
    'https://www.jansuraksha.gov.in/',
    'https://enps.nsdl.com/eNPS/NationalPensionSystem.html',
    '2026-11-15T17:25:00Z',
    true,
    'active'
  )
ON CONFLICT (slug) DO UPDATE SET
  category_id = EXCLUDED.category_id,
  name_en = EXCLUDED.name_en,
  name_ta = EXCLUDED.name_ta,
  short_description_en = EXCLUDED.short_description_en,
  short_description_ta = EXCLUDED.short_description_ta,
  detailed_description_en = EXCLUDED.detailed_description_en,
  detailed_description_ta = EXCLUDED.detailed_description_ta,
  benefits_en = EXCLUDED.benefits_en,
  benefits_ta = EXCLUDED.benefits_ta,
  department_en = EXCLUDED.department_en,
  department_ta = EXCLUDED.department_ta,
  government_level = EXCLUDED.government_level,
  state_code = EXCLUDED.state_code,
  target_audiences = EXCLUDED.target_audiences,
  application_instructions_en = EXCLUDED.application_instructions_en,
  application_instructions_ta = EXCLUDED.application_instructions_ta,
  official_source_url = EXCLUDED.official_source_url,
  official_application_url = EXCLUDED.official_application_url,
  last_verified_at = EXCLUDED.last_verified_at,
  is_verified = EXCLUDED.is_verified,
  status = EXCLUDED.status,
  updated_at = timezone('utc', now());

-- ============================================================================
-- 4. STRUCTURED ELIGIBILITY RULES (18 Versioned Active Rule Trees)
-- ============================================================================

INSERT INTO public.scheme_eligibility_rules (
  scheme_id, rule_version, is_active, root_group, summary_en, summary_ta
) VALUES
  -- 1. Pudhumai Penn
  (
    '20000000-0000-4000-8000-000000000001',
    1,
    true,
    '{
      "type": "GROUP",
      "id": "root-pudhumai-penn",
      "logicalOperator": "AND",
      "children": [
        {
          "type": "CONDITION",
          "id": "cond-state",
          "field": "state",
          "operator": "EQUALS",
          "value": "Tamil Nadu",
          "label_en": "Resident of Tamil Nadu",
          "label_ta": "தமிழ்நாடு மாநிலத்தில் வசிப்பவர்"
        },
        {
          "type": "CONDITION",
          "id": "cond-gender",
          "field": "gender",
          "operator": "EQUALS",
          "value": "female",
          "label_en": "Applicant is a female student",
          "label_ta": "விண்ணப்பதாரர் மாணவியாக இருக்க வேண்டும்"
        },
        {
          "type": "CONDITION",
          "id": "cond-student",
          "field": "is_student",
          "operator": "EQUALS",
          "value": true,
          "label_en": "Currently enrolled as a higher education student",
          "label_ta": "தற்போது உயர்கல்வி பயிலும் மாணவியாக இருக்க வேண்டும்"
        },
        {
          "type": "CONDITION",
          "id": "cond-education",
          "field": "education_level",
          "operator": "IN",
          "value": ["12th_pass", "diploma", "undergraduate"],
          "label_en": "Education level is Class 12 pass, diploma, or undergraduate",
          "label_ta": "கல்வித் தகுதி 12-ஆம் வகுப்பு தேர்ச்சி, டிப்ளமோ அல்லது இளங்கலை"
        }
      ],
      "additionalConditions": [
        {
          "id": "verify-govt-school-6-12",
          "label_en": "Studied continuously from Class 6 to Class 12 in a Tamil Nadu Government school or Tamil-medium Government-aided school (verified via school EMIS ID)",
          "label_ta": "தமிழ்நாடு அரசுப் பள்ளி அல்லது அரசு உதவிபெறும் தமிழ் வழிப் பள்ளியில் 6 முதல் 12-ஆம் வகுப்பு வரை தொடர்ந்து பயின்றிருக்க வேண்டும் (பள்ளி EMIS எண் மூலம் சரிபார்க்கப்படும்)"
        },
        {
          "id": "verify-first-higher-ed",
          "label_en": "Enrolled in first undergraduate degree, diploma, or ITI course at a recognized institution (not a second degree or distance education)",
          "label_ta": "அங்கீகரிக்கப்பட்ட கல்வி நிறுவனத்தில் முதல் இளங்கலைப் பட்டம், டிப்ளமோ அல்லது ஐடிஐ படிப்பில் பயில வேண்டும் (இரண்டாவது பட்டம் அல்லது தொலைநிலைக் கல்விக்குப் பொருந்தாது)"
        }
      ]
    }'::jsonb,
    'Girl students residing in Tamil Nadu who studied from Class 6 to Class 12 in Government schools (or Tamil-medium Government-aided schools) and are pursuing their first undergraduate degree, diploma, or ITI course.',
    'தமிழ்நாட்டில் அரசுப் பள்ளிகளில் (அல்லது அரசு உதவிபெறும் தமிழ் வழிப் பள்ளிகளில்) 6 முதல் 12-ஆம் வகுப்பு வரை பயின்று முதல் இளங்கலைப் பட்டம், டிப்ளமோ அல்லது ஐடிஐ பயிலும் மாணவிகள்.'
  ),

  -- 2. Tamil Pudhalvan
  (
    '20000000-0000-4000-8000-000000000002',
    1,
    true,
    '{
      "type": "GROUP",
      "id": "root-tamil-pudhalvan",
      "logicalOperator": "AND",
      "children": [
        {
          "type": "CONDITION",
          "id": "cond-state",
          "field": "state",
          "operator": "EQUALS",
          "value": "Tamil Nadu",
          "label_en": "Resident of Tamil Nadu",
          "label_ta": "தமிழ்நாடு மாநிலத்தில் வசிப்பவர்"
        },
        {
          "type": "CONDITION",
          "id": "cond-gender",
          "field": "gender",
          "operator": "EQUALS",
          "value": "male",
          "label_en": "Applicant gender is male",
          "label_ta": "விண்ணப்பதாரர் ஆணாக இருக்க வேண்டும்"
        },
        {
          "type": "CONDITION",
          "id": "cond-student",
          "field": "is_student",
          "operator": "EQUALS",
          "value": true,
          "label_en": "Currently enrolled as a student",
          "label_ta": "தற்போது பயிலும் மாணவராக இருக்க வேண்டும்"
        },
        {
          "type": "CONDITION",
          "id": "cond-education",
          "field": "education_level",
          "operator": "IN",
          "value": ["12th_pass", "diploma", "undergraduate"],
          "label_en": "Education level is Class 12 pass, diploma, or undergraduate",
          "label_ta": "கல்வித் தகுதி 12-ஆம் வகுப்பு தேர்ச்சி, டிப்ளமோ அல்லது இளங்கலை"
        }
      ],
      "additionalConditions": [
        {
          "id": "verify-govt-school-6-12",
          "label_en": "Studied continuously from Class 6 to Class 12 in a Tamil Nadu Government school or Tamil-medium Government-aided school (verified via school EMIS ID)",
          "label_ta": "தமிழ்நாடு அரசுப் பள்ளி அல்லது அரசு உதவிபெறும் தமிழ் வழிப் பள்ளியில் 6 முதல் 12-ஆம் வகுப்பு வரை தொடர்ந்து பயின்றிருக்க வேண்டும் (பள்ளி EMIS எண் மூலம் சரிபார்க்கப்படும்)"
        },
        {
          "id": "verify-first-higher-ed",
          "label_en": "Enrolled in first higher education degree, diploma, or ITI course at a recognized institution",
          "label_ta": "அங்கீகரிக்கப்பட்ட கல்வி நிறுவனத்தில் முதல் உயர்கல்விப் பட்டம், டிப்ளமோ அல்லது ஐடிஐ படிப்பில் பயில வேண்டும்"
        }
      ]
    }'::jsonb,
    'Male students in Tamil Nadu who studied Classes 6 to 12 in Government schools or Tamil-medium Government-aided schools and are enrolled in an undergraduate degree, diploma, or ITI programme.',
    'அரசுப் பள்ளிகள் அல்லது அரசு உதவிபெறும் தமிழ் வழிப் பள்ளிகளில் 6 முதல் 12-ஆம் வகுப்பு வரை பயின்று இளங்கலைப் பட்டம், டிப்ளமோ அல்லது ஐடிஐ பயிலும் மாணவர்கள்.'
  ),

  -- 3. Kalaignar Magalir Urimai Thittam
  (
    '20000000-0000-4000-8000-000000000003',
    1,
    true,
    '{
      "type": "GROUP",
      "id": "root-kmut",
      "logicalOperator": "AND",
      "children": [
        {
          "type": "CONDITION",
          "id": "cond-state",
          "field": "state",
          "operator": "EQUALS",
          "value": "Tamil Nadu",
          "label_en": "Resident of Tamil Nadu",
          "label_ta": "தமிழ்நாடு மாநிலத்தில் வசிப்பவர்"
        },
        {
          "type": "CONDITION",
          "id": "cond-gender",
          "field": "gender",
          "operator": "EQUALS",
          "value": "female",
          "label_en": "Applicant gender is female",
          "label_ta": "விண்ணப்பதாரர் பெண்ணாக இருக்க வேண்டும்"
        },
        {
          "type": "CONDITION",
          "id": "cond-age",
          "field": "age",
          "operator": "GREATER_THAN_OR_EQUAL",
          "value": 21,
          "label_en": "Age is 21 years or above",
          "label_ta": "வயது 21 அல்லது அதற்கு மேல் இருக்க வேண்டும்"
        },
        {
          "type": "CONDITION",
          "id": "cond-income",
          "field": "annual_household_income",
          "operator": "LESS_THAN",
          "value": 250000,
          "label_en": "Annual household income is below ₹2,50,000",
          "label_ta": "குடும்ப ஆண்டு வருமானம் ₹2,50,000-க்குக் கீழ் இருக்க வேண்டும்"
        }
      ],
      "additionalConditions": [
        {
          "id": "verify-ration-card-woman-head",
          "label_en": "Listed as the eligible woman head of household on a valid Tamil Nadu Family Smart Card (one beneficiary per ration card)",
          "label_ta": "செல்லுபடியாகும் தமிழ்நாடு குடும்ப அட்டையில் தகுதியுள்ள பெண் குடும்பத் தலைவராகப் பெயர் இடம்பெற்றிருக்க வேண்டும் (ஒரு குடும்ப அட்டைக்கு ஒருவர் மட்டுமே)"
        },
        {
          "id": "verify-land-electricity-limits",
          "label_en": "Family landholding is below 5 acres of wetland or 10 acres of dryland, and domestic electricity consumption is below 3,600 units per year",
          "label_ta": "குடும்ப நில உடைமை 5 ஏக்கர் நன்செய் அல்லது 10 ஏக்கர் புன்செய் நிலத்திற்குக் குறைவாகவும், வீட்டு மின் பயன்பாடு ஆண்டுக்கு 3,600 யூனிட்டுகளுக்குக் கீழும் இருக்க வேண்டும்"
        },
        {
          "id": "verify-household-exclusions",
          "label_en": "Household does not own a four-wheeler for personal use and includes no income-tax payer, government/PSU employee, or elected representative",
          "label_ta": "குடும்பத்தில் சொந்தப் பயன்பாட்டிற்கான நான்கு சக்கர வாகனம் இருக்கக் கூடாது; வருமான வரி செலுத்துபவர், அரசு/பொதுத்துறை ஊழியர் அல்லது மக்கள் பிரதிநிதி இருக்கக் கூடாது"
        }
      ]
    }'::jsonb,
    'Women aged 21 years and above residing in Tamil Nadu whose household annual income is below ₹2,50,000 and whose family holds less than 5 acres of wetland (or 10 acres of dryland).',
    'தமிழ்நாட்டில் வசிக்கும் 21 வயது நிரம்பிய, குடும்ப ஆண்டு வருமானம் ₹2,50,000-க்குக் குறைவாக உள்ள பெண்கள்.'
  ),

  -- 4. CMCHIS
  (
    '20000000-0000-4000-8000-000000000004',
    1,
    true,
    '{
      "type": "GROUP",
      "id": "root-cmchis",
      "logicalOperator": "AND",
      "children": [
        {
          "type": "CONDITION",
          "id": "cond-state",
          "field": "state",
          "operator": "EQUALS",
          "value": "Tamil Nadu",
          "label_en": "Resident of Tamil Nadu",
          "label_ta": "தமிழ்நாடு மாநிலத்தில் வசிப்பவர்"
        },
        {
          "type": "CONDITION",
          "id": "cond-income",
          "field": "annual_household_income",
          "operator": "LESS_THAN",
          "value": 120000,
          "label_en": "Annual household income is below ₹1,20,000",
          "label_ta": "குடும்ப ஆண்டு வருமானம் ₹1,20,000-க்குக் கீழ் இருக்க வேண்டும்"
        }
      ],
      "additionalConditions": [
        {
          "id": "verify-family-smart-card",
          "label_en": "Applicant and covered dependents must be listed on an active Tamil Nadu Family Smart Card and verified with a VAO/Revenue Income Certificate",
          "label_ta": "விண்ணப்பதாரர் மற்றும் குடும்ப உறுப்பினர்களின் பெயர்கள் தமிழ்நாடு குடும்ப அட்டையில் இடம்பெற்று, வருவாய்த்துறை வருமானச் சான்றிதழுடன் சரிபார்க்கப்பட வேண்டும்"
        }
      ]
    }'::jsonb,
    'Families residing in Tamil Nadu with a valid Family Ration Card and an annual household income below ₹1,20,000.',
    'தமிழ்நாட்டில் வசிக்கும், ஆண்டு குடும்ப வருமானம் ₹1,20,000-க்குக் குறைவாக உள்ள குடும்ப அட்டைதாரர்கள்.'
  ),

  -- 5. Dr. Muthulakshmi Reddy Maternity Benefit Scheme
  (
    '20000000-0000-4000-8000-000000000005',
    1,
    true,
    '{
      "type": "GROUP",
      "id": "root-mrmbs",
      "logicalOperator": "AND",
      "children": [
        {
          "type": "CONDITION",
          "id": "cond-state",
          "field": "state",
          "operator": "EQUALS",
          "value": "Tamil Nadu",
          "label_en": "Resident of Tamil Nadu",
          "label_ta": "தமிழ்நாடு மாநிலத்தில் வசிப்பவர்"
        },
        {
          "type": "CONDITION",
          "id": "cond-gender",
          "field": "gender",
          "operator": "EQUALS",
          "value": "female",
          "label_en": "Applicant gender is female",
          "label_ta": "விண்ணப்பதாரர் பெண்ணாக இருக்க வேண்டும்"
        },
        {
          "type": "CONDITION",
          "id": "cond-age",
          "field": "age",
          "operator": "GREATER_THAN_OR_EQUAL",
          "value": 19,
          "label_en": "Age is 19 years or above",
          "label_ta": "வயது 19 அல்லது அதற்கு மேல் இருக்க வேண்டும்"
        }
      ],
      "additionalConditions": [
        {
          "id": "verify-pregnancy-parity",
          "label_en": "Applicant is a pregnant mother from an economically weaker household and the benefit is limited to the first two deliveries",
          "label_ta": "விண்ணப்பதாரர் பொருளாதாரத்தில் நலிந்த குடும்பத்தைச் சேர்ந்த கர்ப்பிணித் தாயாக இருக்க வேண்டும் மற்றும் முதல் இரண்டு பிரசவங்களுக்கு மட்டுமே இத்திட்டம் பொருந்தும்"
        },
        {
          "id": "verify-picme-registration",
          "label_en": "Pregnancy registered within 12 weeks on the PICME portal via the Village Health Nurse (VHN) or Primary Health Centre, with scheduled antenatal checkups and immunizations completed",
          "label_ta": "கர்ப்பம் தரித்த 12 வாரங்களுக்குள் PICME தளத்தில் பதிவு செய்து, அரசு ஆரம்ப சுகாதார நிலையத்தில் மாதாந்திரப் பரிசோதனைகள் மற்றும் தடுப்பூசிகளை நிறைவு செய்ய வேண்டும்"
        }
      ]
    }'::jsonb,
    'Pregnant women in Tamil Nadu aged 19 years or older from economically weaker households (for first two deliveries) registered in the PICME portal.',
    'தமிழ்நாட்டில் பொருளாதாரத்தில் நலிந்த குடும்பங்களைச் சேர்ந்த 19 வயது நிரம்பிய கர்ப்பிணிப் பெண்கள் (முதல் இரண்டு பிரசவங்களுக்கு).'
  ),

  -- 6. Naan Mudhalvan
  (
    '20000000-0000-4000-8000-000000000006',
    1,
    true,
    '{
      "type": "GROUP",
      "id": "root-naan-mudhalvan",
      "logicalOperator": "AND",
      "children": [
        {
          "type": "CONDITION",
          "id": "cond-state",
          "field": "state",
          "operator": "EQUALS",
          "value": "Tamil Nadu",
          "label_en": "Resident of Tamil Nadu",
          "label_ta": "தமிழ்நாடு மாநிலத்தில் வசிப்பவர்"
        },
        {
          "type": "CONDITION",
          "id": "cond-age",
          "field": "age",
          "operator": "BETWEEN",
          "value": [17, 35],
          "label_en": "Age between 17 and 35 years",
          "label_ta": "வயது 17 முதல் 35-க்குள் இருக்க வேண்டும்"
        },
        {
          "type": "GROUP",
          "id": "group-student-or-jobseeker",
          "logicalOperator": "OR",
          "children": [
            {
              "type": "CONDITION",
              "id": "cond-is-student",
              "field": "is_student",
              "operator": "EQUALS",
              "value": true,
              "label_en": "Currently enrolled as a student",
              "label_ta": "தற்போது பயிலும் மாணவர்"
            },
            {
              "type": "CONDITION",
              "id": "cond-emp-status",
              "field": "employment_status",
              "operator": "IN",
              "value": ["student", "unemployed"],
              "label_en": "Employment status is student or unemployed",
              "label_ta": "மாணவர் அல்லது வேலை தேடுபவர்"
            }
          ]
        }
      ],
      "additionalConditions": [
        {
          "id": "verify-subprogramme-criteria",
          "label_en": "Meets track-specific educational and category criteria (e.g., recognized Tamil Nadu college enrolment for campus tracks, or a completed Bachelor''s degree and category age limits for competitive exam scholarships)",
          "label_ta": "தேர்ந்தெடுக்கும் பயிற்சி அல்லது போட்டித் தேர்வு உதவித்தொகைப் பிரிவிற்கான சிறப்புக் கல்வி மற்றும் வயது வரம்பு நிபந்தனைகளைப் பூர்த்தி செய்ய வேண்டும்"
        }
      ]
    }'::jsonb,
    'Students and job-seeking youth aged 17 to 35 years residing or studying in Tamil Nadu.',
    'தமிழ்நாட்டில் பயிலும் மாணவர்கள் மற்றும் வேலைவாய்ப்பைத் தேடும் 17 முதல் 35 வயதுக்குட்பட்ட இளைஞர்கள்.'
  ),

  -- 7. TN First Generation Graduate
  (
    '20000000-0000-4000-8000-000000000007',
    1,
    true,
    '{
      "type": "GROUP",
      "id": "root-fgg",
      "logicalOperator": "AND",
      "children": [
        {
          "type": "CONDITION",
          "id": "cond-state",
          "field": "state",
          "operator": "EQUALS",
          "value": "Tamil Nadu",
          "label_en": "Resident of Tamil Nadu",
          "label_ta": "தமிழ்நாடு மாநிலத்தில் வசிப்பவர்"
        },
        {
          "type": "CONDITION",
          "id": "cond-student",
          "field": "is_student",
          "operator": "EQUALS",
          "value": true,
          "label_en": "Currently enrolled as a student",
          "label_ta": "தற்போது பயிலும் மாணவர்"
        },
        {
          "type": "CONDITION",
          "id": "cond-edu",
          "field": "education_level",
          "operator": "IN",
          "value": ["12th_pass", "undergraduate"],
          "label_en": "Education level is Class 12 pass or undergraduate",
          "label_ta": "கல்வித் தகுதி 12-ஆம் வகுப்பு தேர்ச்சி அல்லது இளங்கலை"
        }
      ],
      "additionalConditions": [
        {
          "id": "verify-no-prior-family-graduate",
          "label_en": "No parent, grandparent, or sibling in the family holds a graduate degree, and no sibling has previously availed the First Generation Graduate concession (certified via TNeGA e-Sevai)",
          "label_ta": "குடும்பத்தில் பெற்றோர், தாத்தா-பாட்டி அல்லது உடன்பிறந்தோர் யாரும் பட்டதாரியாக இருக்கக் கூடாது மற்றும் உடன்பிறந்தோர் இச்சலுகையைப் பெற்றிருக்கக் கூடாது (இ-சேவை சான்றிதழ் அவசியம்)"
        },
        {
          "id": "verify-counselling-admission",
          "label_en": "Admitted to a professional undergraduate degree course through single-window government counselling (such as TNEA), not under management quota",
          "label_ta": "அரசு ஒற்றைச்சாளரக் கலந்தாய்வு (TNEA போன்றவை) மூலம் தொழில்முறை இளங்கலைப் படிப்பில் சேர்ந்திருக்க வேண்டும்"
        }
      ]
    }'::jsonb,
    'Students domiciled in Tamil Nadu admitted to professional undergraduate degree courses through single-window counselling who are the first graduate in their family.',
    'குடும்பத்தில் முதல் பட்டதாரியாக, அரசு ஒற்றைச்சாளரக் கலந்தாய்வு மூலம் தொழில்முறைப் பட்டப்படிப்பில் சேரும் தமிழ்நாடு மாணவர்கள்.'
  ),

  -- 8. TN UYEGP
  (
    '20000000-0000-4000-8000-000000000008',
    1,
    true,
    '{
      "type": "GROUP",
      "id": "root-uyegp",
      "logicalOperator": "AND",
      "children": [
        {
          "type": "CONDITION",
          "id": "cond-state",
          "field": "state",
          "operator": "EQUALS",
          "value": "Tamil Nadu",
          "label_en": "Resident of Tamil Nadu",
          "label_ta": "தமிழ்நாட்டில் வசிப்பவர்"
        },
        {
          "type": "CONDITION",
          "id": "cond-emp-unemployed",
          "field": "employment_status",
          "operator": "EQUALS",
          "value": "unemployed",
          "label_en": "Employment status is unemployed",
          "label_ta": "வேலைவாய்ப்பற்றவராக இருக்க வேண்டும்"
        },
        {
          "type": "CONDITION",
          "id": "cond-age",
          "field": "age",
          "operator": "BETWEEN",
          "value": [18, 45],
          "label_en": "Age between 18 and 45 years",
          "label_ta": "வயது 18 முதல் 45-க்குள் இருக்க வேண்டும்"
        },
        {
          "type": "CONDITION",
          "id": "cond-income",
          "field": "annual_household_income",
          "operator": "LESS_THAN_OR_EQUAL",
          "value": 500000,
          "label_en": "Annual household income does not exceed ₹5,00,000",
          "label_ta": "குடும்ப ஆண்டு வருமானம் ₹5,00,000-க்கு மிகாமல் இருக்க வேண்டும்"
        }
      ],
      "additionalConditions": [
        {
          "id": "verify-class8-and-residence",
          "label_en": "Passed at least Class 8 (8th Standard) and resided in Tamil Nadu continuously for at least 3 years",
          "label_ta": "குறைந்தபட்சம் 8-ஆம் வகுப்பு தேர்ச்சி பெற்றிருக்க வேண்டும் மற்றும் தமிழ்நாட்டில் குறைந்தது 3 ஆண்டுகள் தொடர்ந்து வசித்திருக்க வேண்டும்"
        },
        {
          "id": "verify-category-age-and-no-prior-loan",
          "label_en": "Meets category-specific upper age limit (35 years for General category; 45 years for Special categories) and has not availed any prior government-subsidized loan",
          "label_ta": "பிரிவு வாரியான வயது வரம்பிற்குள் இருக்க வேண்டும் (பொதுப் பிரிவினருக்கு 35 வயது; சிறப்புப் பிரிவினருக்கு 45 வயது) மற்றும் இதற்கு முன் அரசு மானியக் கடன் பெற்றிருக்கக் கூடாது"
        }
      ]
    }'::jsonb,
    'Educated youth in Tamil Nadu aged 18 to 45 years (up to 35 for general category, 45 for special categories) with annual family income up to ₹5,00,000.',
    'தமிழ்நாட்டில் வசிக்கும் 18 முதல் 45 வயதுக்குட்பட்ட, குடும்ப ஆண்டு வருமானம் ₹5,00,000-க்கு மிகாமல் உள்ள படித்த இளைஞர்கள்.'
  ),

  -- 9. PM-KISAN
  (
    '20000000-0000-4000-8000-000000000009',
    1,
    true,
    '{
      "type": "GROUP",
      "id": "root-pm-kisan",
      "logicalOperator": "AND",
      "children": [
        {
          "type": "CONDITION",
          "id": "cond-farmer",
          "field": "is_farmer",
          "operator": "EQUALS",
          "value": true,
          "label_en": "Applicant is a farmer",
          "label_ta": "விண்ணப்பதாரர் விவசாயியாக இருக்க வேண்டும்"
        },
        {
          "type": "CONDITION",
          "id": "cond-land",
          "field": "land_holding_acres",
          "operator": "GREATER_THAN",
          "value": 0,
          "label_en": "Agricultural land holding is greater than 0 acres",
          "label_ta": "வேளாண் நில உடைமை 0 ஏக்கருக்கு மேல் இருக்க வேண்டும்"
        }
      ],
      "additionalConditions": [
        {
          "id": "verify-cultivable-land-record",
          "label_en": "Holds cultivable agricultural land recorded in state land revenue records (Patta / Chitta) in the farmer family''s name",
          "label_ta": "விவசாயக் குடும்பத்தின் பெயரில் வருவாய்த்துறை நில ஆவணங்களில் (பட்டா / சிட்டா) சாகுபடி நிலம் பதிவாகியிருக்க வேண்டும்"
        },
        {
          "id": "verify-pmkisan-exclusions",
          "label_en": "No family member falls under statutory exclusions (income-tax payer, serving/retired non-Group-D government/PSU employee, pensioner receiving ₹10,000+ per month, constitutional post holder, or practising doctor/engineer/lawyer/CA/architect)",
          "label_ta": "குடும்ப உறுப்பினர்கள் யாரும் விலக்கு அளிக்கப்பட்ட பிரிவுகளில் (வருமான வரி செலுத்துபவர், அரசு/பொதுத்துறை ஊழியர், மாதம் ₹10,000-க்கு மேல் ஓய்வூதியம் பெறுபவர், பதிவுபெற்ற மருத்துவர்/பொறியாளர்/வழக்கறிஞர்/ஆடிட்டர்) இருக்கக் கூடாது"
        }
      ]
    }'::jsonb,
    'Landholding farmer families with cultivable land in their name (excluding institutional landholders and income-tax payers).',
    'தங்கள் பெயரில் சாகுபடி நிலம் வைத்துள்ள விவசாயக் குடும்பங்கள் (வருமான வரி செலுத்துபவர்கள் நீங்கலாக).'
  ),

  -- 10. PM Fasal Bima Yojana
  (
    '20000000-0000-4000-8000-000000000010',
    1,
    true,
    '{
      "type": "GROUP",
      "id": "root-pmfby",
      "logicalOperator": "AND",
      "children": [
        {
          "type": "CONDITION",
          "id": "cond-farmer",
          "field": "is_farmer",
          "operator": "EQUALS",
          "value": true,
          "label_en": "Applicant is a farmer",
          "label_ta": "விண்ணப்பதாரர் விவசாயியாக இருக்க வேண்டும்"
        }
      ],
      "additionalConditions": [
        {
          "id": "verify-notified-crop-and-area",
          "label_en": "Cultivating a state-notified crop in a notified insurance unit area during the current Kharif/Rabi season (verified via VAO Adangal sowing certificate) and enrolled before the seasonal cut-off date",
          "label_ta": "நடப்புப் பருவத்தில் அறிவிக்கப்பட்ட பகுதியில் அறிவிக்கப்பட்ட பயிரைச் சாகுபடி செய்து (கிராம நிர்வாக அலுவலரின் அடங்கல் சான்றுடன்) காலக்கெடுவுக்குள் காப்பீடு செய்ய வேண்டும்"
        }
      ]
    }'::jsonb,
    'All farmers (including sharecroppers and tenant farmers) growing notified crops in notified insurance unit areas.',
    'அறிவிக்கப்பட்ட பகுதிகளில் அறிவிக்கப்பட்ட பயிர்களைச் சாகுபடி செய்யும் அனைத்து விவசாயிகள் மற்றும் குத்தகை விவசாயிகள்.'
  ),

  -- 11. Ayushman Bharat PM-JAY
  (
    '20000000-0000-4000-8000-000000000011',
    1,
    true,
    '{
      "type": "GROUP",
      "id": "root-pmjay",
      "logicalOperator": "OR",
      "children": [
        {
          "type": "CONDITION",
          "id": "cond-income",
          "field": "annual_household_income",
          "operator": "LESS_THAN_OR_EQUAL",
          "value": 120000,
          "label_en": "Annual household income is ₹1,20,000 or below",
          "label_ta": "ஆண்டு குடும்ப வருமானம் ₹1,20,000 அல்லது அதற்குக் கீழ்"
        },
        {
          "type": "CONDITION",
          "id": "cond-senior-70",
          "field": "age",
          "operator": "GREATER_THAN_OR_EQUAL",
          "value": 70,
          "label_en": "Age is 70 years or above",
          "label_ta": "வயது 70 அல்லது அதற்கு மேல்"
        }
      ],
      "additionalConditions": [
        {
          "id": "verify-secc-cmchis-or-senior-kyc",
          "label_en": "For households under age 70, family must be listed in the SECC 2011 database or hold an active CMCHIS family card; for senior citizens aged 70+, Aadhaar e-KYC enrolment on beneficiary.nha.gov.in is required",
          "label_ta": "70 வயதுக்குட்பட்ட குடும்பங்கள் SECC 2011 பட்டியல் அல்லது முதலமைச்சரின் விரிவான மருத்துவக் காப்பீட்டுத் திட்ட அட்டையில் இடம்பெற்றிருக்க வேண்டும்; 70 வயதுக்கு மேற்பட்ட மூத்த குடிமக்கள் beneficiary.nha.gov.in தளத்தில் e-KYC பதிவு செய்ய வேண்டும்"
        }
      ]
    }'::jsonb,
    'Economically vulnerable households (SECC / CMCHIS-linked families with income up to ₹1,20,000) and all senior citizens aged 70 years and above regardless of income.',
    'ஆண்டு வருமானம் ₹1,20,000-க்குள் உள்ள குடும்பங்கள் மற்றும் வருமான வரம்பின்றி 70 வயதுக்கு மேற்பட்ட அனைத்து மூத்த குடிமக்கள்.'
  ),

  -- 12. Central Sector Scholarship (CSSS)
  (
    '20000000-0000-4000-8000-000000000012',
    1,
    true,
    '{
      "type": "GROUP",
      "id": "root-csss",
      "logicalOperator": "AND",
      "children": [
        {
          "type": "CONDITION",
          "id": "cond-student",
          "field": "is_student",
          "operator": "EQUALS",
          "value": true,
          "label_en": "Currently enrolled as a student",
          "label_ta": "தற்போது பயிலும் மாணவர்"
        },
        {
          "type": "CONDITION",
          "id": "cond-age",
          "field": "age",
          "operator": "BETWEEN",
          "value": [17, 25],
          "label_en": "Age between 17 and 25 years",
          "label_ta": "வயது 17 முதல் 25-க்குள் இருக்க வேண்டும்"
        },
        {
          "type": "CONDITION",
          "id": "cond-income",
          "field": "annual_household_income",
          "operator": "LESS_THAN_OR_EQUAL",
          "value": 450000,
          "label_en": "Annual household income is ₹4,50,000 or below",
          "label_ta": "குடும்ப ஆண்டு வருமானம் ₹4,50,000 அல்லது அதற்குக் கீழ்"
        },
        {
          "type": "CONDITION",
          "id": "cond-edu",
          "field": "education_level",
          "operator": "IN",
          "value": ["12th_pass", "undergraduate", "postgraduate"],
          "label_en": "Education level is Class 12 pass, undergraduate, or postgraduate",
          "label_ta": "கல்வித் தகுதி 12-ஆம் வகுப்பு தேர்ச்சி, இளங்கலை அல்லது முதுகலை"
        }
      ],
      "additionalConditions": [
        {
          "id": "verify-80th-percentile-regular-mode",
          "label_en": "Scored above the 80th percentile in Class 12 board examinations and enrolled in a regular, full-time degree course at an AICTE/UGC-recognized institution (not receiving any other scholarship)",
          "label_ta": "12-ஆம் வகுப்பு பொதுத்தேர்வில் முதல் 20 சதவீதத்திற்குள் (80th percentile மேல்) மதிப்பெண் பெற்று, AICTE/UGC அங்கீகரிக்கப்பட்ட கல்லூரியில் முழுநேரப் பட்டப்படிப்பில் பயில வேண்டும் (மற்ற உதவித்தொகைப் பெறக்கூடாது)"
        }
      ]
    }'::jsonb,
    'Regular undergraduate and postgraduate students aged 17–25 years who scored above the 80th percentile in Class 12 and whose family annual income does not exceed ₹4,50,000.',
    '12-ஆம் வகுப்பில் சிறந்த மதிப்பெண் பெற்று, குடும்ப ஆண்டு வருமானம் ₹4,50,000-க்குள் உள்ள 17–25 வயதுடைய கல்லூரி மற்றும் பல்கலைக்கழக மாணவர்கள்.'
  ),

  -- 13. PM SVANidhi
  (
    '20000000-0000-4000-8000-000000000013',
    1,
    true,
    '{
      "type": "GROUP",
      "id": "root-svanidhi",
      "logicalOperator": "AND",
      "children": [
        {
          "type": "CONDITION",
          "id": "cond-age",
          "field": "age",
          "operator": "GREATER_THAN_OR_EQUAL",
          "value": 18,
          "label_en": "Age is 18 years or above",
          "label_ta": "வயது 18 அல்லது அதற்கு மேல் இருக்க வேண்டும்"
        },
        {
          "type": "GROUP",
          "id": "group-vendor-status",
          "logicalOperator": "OR",
          "children": [
            {
              "type": "CONDITION",
              "id": "cond-biz",
              "field": "is_business_owner",
              "operator": "EQUALS",
              "value": true,
              "label_en": "Owns a micro/small business or street vending activity",
              "label_ta": "சாலையோர வியாபாரம் அல்லது சிறு வணிகத்தில் ஈடுபடுபவர்"
            },
            {
              "type": "CONDITION",
              "id": "cond-self-emp",
              "field": "employment_status",
              "operator": "EQUALS",
              "value": "self_employed",
              "label_en": "Employment status is self-employed",
              "label_ta": "சுயதொழில் செய்பவர்"
            }
          ]
        }
      ],
      "additionalConditions": [
        {
          "id": "verify-ulb-vending-certificate",
          "label_en": "Actively engaged in urban or peri-urban street vending and holds an Urban Local Body (ULB) Certificate of Vending, ID card, or Town Vending Committee Letter of Recommendation",
          "label_ta": "நகர்ப்புற அல்லது புறநகர்ப் பகுதியில் சாலையோர வியாபாரத்தில் ஈடுபட்டு, உள்ளாட்சி அமைப்பின் விற்பனைச் சான்றிதழ், அடையாள அட்டை அல்லது பரிந்துரைக் கடிதம் வைத்திருக்க வேண்டும்"
        }
      ]
    }'::jsonb,
    'Adult street vendors aged 18 years and above engaged in vending in urban or peri-urban areas holding a Certificate of Vending / ID card or Letter of Recommendation.',
    'நகர்ப்புற மற்றும் புறநகர்ப் பகுதிகளில் சாலையோர வியாபாரத்தில் ஈடுபட்டுள்ள 18 வயது நிரம்பிய வியாபாரிகள்.'
  ),

  -- 14. PM Vishwakarma
  (
    '20000000-0000-4000-8000-000000000014',
    1,
    true,
    '{
      "type": "GROUP",
      "id": "root-vishwakarma",
      "logicalOperator": "AND",
      "children": [
        {
          "type": "CONDITION",
          "id": "cond-age",
          "field": "age",
          "operator": "GREATER_THAN_OR_EQUAL",
          "value": 18,
          "label_en": "Age is 18 years or above",
          "label_ta": "வயது 18 அல்லது அதற்கு மேல் இருக்க வேண்டும்"
        },
        {
          "type": "GROUP",
          "id": "group-artisan-work",
          "logicalOperator": "OR",
          "children": [
            {
              "type": "CONDITION",
              "id": "cond-emp",
              "field": "employment_status",
              "operator": "IN",
              "value": ["self_employed", "daily_wage"],
              "label_en": "Employment status is self-employed or daily wage worker",
              "label_ta": "சுயதொழில் அல்லது தினக்கூலி / அமைப்புசாராத் தொழிலாளி"
            },
            {
              "type": "CONDITION",
              "id": "cond-biz",
              "field": "is_business_owner",
              "operator": "EQUALS",
              "value": true,
              "label_en": "Owns a micro/small business or craft activity",
              "label_ta": "கைவினை அல்லது சிறு தொழில் செய்பவர்"
            }
          ]
        }
      ],
      "additionalConditions": [
        {
          "id": "verify-18-trades-and-credit-rules",
          "label_en": "Working with hands and tools in one of the 18 notified traditional trades in the unorganized sector (one beneficiary per family, no family member in government service, and no outstanding PMEGP/PM SVANidhi/MUDRA loan from the past 5 years)",
          "label_ta": "அமைப்புசாராத் துறையில் அறிவிக்கப்பட்ட 18 பாரம்பரியக் கைவினைத் தொழில்களில் ஒன்றில் ஈடுபட்டிருக்க வேண்டும் (குடும்பத்திற்கு ஒருவர் மட்டுமே, குடும்பத்தில் அரசு ஊழியர் இருக்கக் கூடாது மற்றும் கடந்த 5 ஆண்டுகளில் PMEGP/PM SVANidhi/MUDRA கடன் நிலுவை இருக்கக் கூடாது)"
        }
      ]
    }'::jsonb,
    'Artisans and craftspeople aged 18 years and above working with hands and tools in one of the 18 specified traditional trades in the unorganized sector.',
    '18 வகையான பாரம்பரியக் கைவினைத் தொழில்களில் ஈடுபட்டுள்ள 18 வயது நிரம்பிய அமைப்புசாராக் கைவினைஞர்கள்.'
  ),

  -- 15. PMAY-U 2.0
  (
    '20000000-0000-4000-8000-000000000015',
    1,
    true,
    '{
      "type": "GROUP",
      "id": "root-pmay-u2",
      "logicalOperator": "AND",
      "children": [
        {
          "type": "CONDITION",
          "id": "cond-age",
          "field": "age",
          "operator": "GREATER_THAN_OR_EQUAL",
          "value": 18,
          "label_en": "Age is 18 years or above",
          "label_ta": "வயது 18 அல்லது அதற்கு மேல் இருக்க வேண்டும்"
        },
        {
          "type": "CONDITION",
          "id": "cond-income",
          "field": "annual_household_income",
          "operator": "LESS_THAN_OR_EQUAL",
          "value": 900000,
          "label_en": "Annual household income is ₹9,00,000 or below",
          "label_ta": "குடும்ப ஆண்டு வருமானம் ₹9,00,000 அல்லது அதற்குக் கீழ்"
        }
      ],
      "additionalConditions": [
        {
          "id": "verify-no-pucca-house-urban",
          "label_en": "Residing in a notified urban area, beneficiary family does not own a pucca house anywhere in India, has not availed central/state housing assistance in the last 20 years, and house ownership/co-ownership includes the female head of household",
          "label_ta": "அறிவிக்கப்பட்ட நகர்ப்புறப் பகுதியில் வசித்து, இந்தியாவில் எங்கும் சொந்தக் கான்கிரீட் (பக்கா) வீடு இல்லாமலும், கடந்த 20 ஆண்டுகளில் அரசு வீட்டுவசதி மானியம் பெறாமலும் இருக்க வேண்டும் (வீட்டு உரிமை குடும்பப் பெண் தலைவர் பெயரில் அல்லது கூட்டுப் பெயரில் இருக்க வேண்டும்)"
        }
      ]
    }'::jsonb,
    'Urban families without a pucca house anywhere in India belonging to EWS (income up to ₹3,00,000), LIG (up to ₹6,00,000), or MIG (up to ₹9,00,000).',
    'இந்தியாவில் சொந்தமாகக் கான்கிரீட் வீடு இல்லாத, ஆண்டு குடும்ப வருமானம் ₹9,00,000-க்குள் உள்ள நகர்ப்புறக் குடும்பங்கள்.'
  ),

  -- 16. IGNOAPS Senior Citizen Pension
  (
    '20000000-0000-4000-8000-000000000016',
    1,
    true,
    '{
      "type": "GROUP",
      "id": "root-ignoaps",
      "logicalOperator": "AND",
      "children": [
        {
          "type": "CONDITION",
          "id": "cond-age",
          "field": "age",
          "operator": "GREATER_THAN_OR_EQUAL",
          "value": 60,
          "label_en": "Age is 60 years or above",
          "label_ta": "வயது 60 அல்லது அதற்கு மேல் இருக்க வேண்டும்"
        }
      ],
      "additionalConditions": [
        {
          "id": "verify-bpl-destitute-status",
          "label_en": "Belongs to a Below Poverty Line (BPL) household with destitution and lack of regular subsistence verified by the Tahsildar / Revenue Department",
          "label_ta": "வறுமைக்கோட்டிற்குக் கீழ் (BPL) உள்ள ஆதரவற்ற நிலை மற்றும் நிலையான வருமானம் இன்மை வட்டாட்சியர் / வருவாய்த்துறையால் சரிபார்க்கப்பட வேண்டும்"
        }
      ]
    }'::jsonb,
    'Senior citizens aged 60 years and above belonging to Below Poverty Line (BPL) or destitute households with little or no regular means of subsistence.',
    'வறுமைக்கோட்டிற்குக் கீழ் உள்ள 60 வயது மற்றும் அதற்கு மேற்பட்ட ஆதரவற்ற மூத்த குடிமக்கள்.'
  ),

  -- 17. Sukanya Samriddhi Yojana
  (
    '20000000-0000-4000-8000-000000000017',
    1,
    true,
    '{
      "type": "GROUP",
      "id": "root-ssy",
      "logicalOperator": "AND",
      "children": [
        {
          "type": "CONDITION",
          "id": "cond-gender",
          "field": "gender",
          "operator": "EQUALS",
          "value": "female",
          "label_en": "Beneficiary gender is female",
          "label_ta": "பயனாளி பெண்"
        },
        {
          "type": "CONDITION",
          "id": "cond-age-child",
          "field": "age",
          "operator": "LESS_THAN_OR_EQUAL",
          "value": 10,
          "label_en": "Age is 10 years or below",
          "label_ta": "வயது 10 அல்லது அதற்குக் கீழ் இருக்க வேண்டும்"
        }
      ],
      "additionalConditions": [
        {
          "id": "verify-guardian-and-family-account-limit",
          "label_en": "Account is opened by a parent or legal guardian in the name of a girl child below 10 years of age, within the limit of one account per girl child and at most two girl children per family (except twin/triplet birth)",
          "label_ta": "10 வயதுக்குட்பட்ட பெண் குழந்தையின் பெயரில் பெற்றோர் அல்லது சட்டப்பூர்வப் பாதுகாவலரால் கணக்குத் தொடங்கப்பட வேண்டும் (ஒரு குழந்தைக்கு ஒரு கணக்கு மட்டுமே; ஒரு குடும்பத்தில் அதிகபட்சம் இரண்டு பெண் குழந்தைகளுக்கு மட்டுமே)"
        }
      ]
    }'::jsonb,
    'Girl children below the age of 10 years (account opened by a parent or legal guardian, up to two girl children per family).',
    '10 வயதுக்குட்பட்ட பெண் குழந்தைகள் (பெற்றோர் அல்லது சட்டப்பூர்வப் பாதுகாவலரால் குடும்பத்திற்கு இரு பெண் குழந்தைகள் வரை கணக்குத் தொடங்கலாம்).'
  ),

  -- 18. Atal Pension Yojana
  (
    '20000000-0000-4000-8000-000000000018',
    1,
    true,
    '{
      "type": "GROUP",
      "id": "root-apy",
      "logicalOperator": "AND",
      "children": [
        {
          "type": "CONDITION",
          "id": "cond-age",
          "field": "age",
          "operator": "BETWEEN",
          "value": [18, 40],
          "label_en": "Age between 18 and 40 years",
          "label_ta": "வயது 18 முதல் 40-க்குள் இருக்க வேண்டும்"
        }
      ],
      "additionalConditions": [
        {
          "id": "verify-non-taxpayer-and-savings-account",
          "label_en": "Applicant must not be an income-tax payer (mandatory rule effective October 1, 2022), must not be covered under another statutory social security scheme, and must hold an active savings bank or post office account",
          "label_ta": "விண்ணப்பதாரர் வருமான வரி செலுத்துபவராக இருக்கக் கூடாது (அக்டோபர் 1, 2022 முதல் கட்டாய விதி), பிற சட்டப்பூர்வ சமூகப் பாதுகாப்புத் திட்டத்தில் உறுப்பினராக இருக்கக் கூடாது மற்றும் சேமிப்பு வங்கி/அஞ்சலகக் கணக்கு வைத்திருக்க வேண்டும்"
        }
      ]
    }'::jsonb,
    'Indian citizens aged 18 to 40 years with a savings bank or post office account who are not income-tax payers.',
    'வங்கி அல்லது அஞ்சலகச் சேமிப்புக் கணக்கு வைத்திருக்கும், வருமான வரி செலுத்தாத 18 முதல் 40 வயதுக்குட்பட்ட இந்தியக் குடிமக்கள்.'
  )
ON CONFLICT (scheme_id, rule_version) DO UPDATE SET
  is_active = EXCLUDED.is_active,
  root_group = EXCLUDED.root_group,
  summary_en = EXCLUDED.summary_en,
  summary_ta = EXCLUDED.summary_ta,
  updated_at = timezone('utc', now());

-- ============================================================================
-- 5. SCHEME REQUIRED DOCUMENTS
-- ============================================================================

INSERT INTO public.scheme_required_documents (
  scheme_id, document_type_code, name_en, name_ta, description_en, description_ta, is_mandatory, requires_unexpired, display_order
) VALUES
  -- 1. Pudhumai Penn
  ('20000000-0000-4000-8000-000000000001', 'BONAFIDE_CERTIFICATE', 'College Bonafide / UMIS Enrollment Certificate', 'கல்லூரிப் பயிலும் சான்றிதழ் (Bonafide / UMIS)', 'Proof of current admission in an undergraduate degree, diploma, or ITI institution.', 'இளங்கலைப் பட்டம், டிப்ளமோ அல்லது ஐடிஐ பயில்வதற்கான கல்லூரிச் சான்று.', true, true, 1),
  ('20000000-0000-4000-8000-000000000001', 'MARKSHEET_10_12', 'Class 6 to 12 Government School Study Proof / Marksheets', '6 முதல் 12-ஆம் வகுப்பு வரை அரசுப் பள்ளியில் பயின்ற சான்று / மதிப்பெண் சான்றிதழ்', 'EMIS record or school transfer/marksheet confirming study from Class 6 to 12 in a Government school.', 'அரசுப் பள்ளியில் 6 முதல் 12-ஆம் வகுப்பு வரை பயின்றதற்கான EMIS எண் அல்லது மாற்றுச் சான்றிதழ்.', true, false, 2),
  ('20000000-0000-4000-8000-000000000001', 'BANK_PASSBOOK', 'Student Bank Passbook', 'மாணவியின் வங்கிக் கணக்குப் புத்தகம்', 'Active bank account in the student''s name enabled for Direct Benefit Transfer.', 'நேரடிப் பணப்பரிமாற்றத்திற்கு ஏற்ற மாணவியின் வங்கிக் கணக்கு விவரம்.', true, false, 3),

  -- 2. Tamil Pudhalvan
  ('20000000-0000-4000-8000-000000000002', 'BONAFIDE_CERTIFICATE', 'College Bonafide / UMIS Registration Proof', 'கல்லூரிப் பயிலும் சான்றிதழ் (UMIS)', 'Confirmation of admission in a recognized degree, diploma, or ITI course.', 'அங்கீகரிக்கப்பட்ட கல்லூரி அல்லது நிறுவனத்தில் பயிலும் சான்றிதழ்.', true, true, 1),
  ('20000000-0000-4000-8000-000000000002', 'MARKSHEET_10_12', 'Class 6 to 12 Government / Tamil-Medium School Study Proof', '6 முதல் 12-ஆம் வகுப்பு வரை அரசு / தமிழ் வழிப் பள்ளியில் பயின்ற சான்று', 'School EMIS number and Class 10/12 marksheets.', 'பள்ளி EMIS எண் மற்றும் 10, 12-ஆம் வகுப்பு மதிப்பெண் சான்றிதழ்கள்.', true, false, 2),
  ('20000000-0000-4000-8000-000000000002', 'BANK_PASSBOOK', 'Student Bank Passbook', 'மாணவரின் வங்கிக் கணக்குப் புத்தகம்', 'Bank passbook copy showing IFSC and account number.', 'வங்கிக் கணக்கு எண் மற்றும் IFSC குறியீடு கொண்ட புத்தக நகல்.', true, false, 3),

  -- 3. Kalaignar Magalir Urimai Thittam
  ('20000000-0000-4000-8000-000000000003', 'RATION_SMART_CARD', 'Tamil Nadu Family Smart Card (Ration Card)', 'தமிழ்நாடு குடும்ப அட்டை (Smart Ration Card)', 'Valid Tamil Nadu Civil Supplies family smart card listing household members.', 'குடும்ப உறுப்பினர்களின் விவரம் கொண்ட செல்லுபடியாகும் குடும்ப அட்டை.', true, false, 1),
  ('20000000-0000-4000-8000-000000000003', 'BANK_PASSBOOK', 'Bank Passbook of Woman Applicant', 'விண்ணப்பதாரரின் வங்கிக் கணக்குப் புத்தகம்', 'Active savings bank account passbook for monthly ₹1,000 DBT credit.', 'மாதாந்திர உரிமைத்தொகை பெறுவதற்கான வங்கிக் கணக்குப் புத்தகம்.', true, false, 2),
  ('20000000-0000-4000-8000-000000000003', 'INCOME_CERTIFICATE', 'Income / Household Eligibility Proof (Optional if verified via ration database)', 'வருமானச் சான்றிதழ் (தேவைப்படின்)', 'Used when household income verification is requested during appeal or review.', 'மேல்முறையீடு அல்லது வருமானச் சரிபார்ப்பின் போது தேவைப்படும் ஆவணம்.', false, true, 3),

  -- 4. CMCHIS
  ('20000000-0000-4000-8000-000000000004', 'RATION_SMART_CARD', 'Family Smart Card (Ration Card)', 'குடும்ப அட்டை (Smart Ration Card)', 'Family ration card showing all dependent family members to be covered.', 'காப்பீட்டில் சேர்க்கப்பட வேண்டிய குடும்ப உறுப்பினர்கள் கொண்ட குடும்ப அட்டை.', true, false, 1),
  ('20000000-0000-4000-8000-000000000004', 'INCOME_CERTIFICATE', 'Annual Income Certificate (Below ₹1,20,000)', 'ஆண்டு வருமானச் சான்றிதழ் (₹1,20,000-க்குக் கீழ்)', 'Issued by the Village Administrative Officer (VAO) / Revenue Department via e-Sevai.', 'இ-சேவை மையம் மூலம் வருவாய்த்துறையால் வழங்கப்பட்ட வருமானச் சான்றிதழ்.', true, true, 2),

  -- 5. Dr. Muthulakshmi Reddy Maternity Benefit Scheme
  ('20000000-0000-4000-8000-000000000005', 'IDENTITY_PROOF', 'RCH / PICME Registration Card & Mother-Child Protection Card', 'PICME பதிவு அட்டை மற்றும் தாய்-சேய் நல அட்டை', '12-digit PICME registration number obtained within the first trimester.', 'கர்ப்பம் தரித்தவுடன் பதிவு செய்யப்பட்ட 12 இலக்க PICME எண் மற்றும் தாய்-சேய் நல அட்டை.', true, false, 1),
  ('20000000-0000-4000-8000-000000000005', 'BANK_PASSBOOK', 'Mother''s Bank Passbook', 'தாயின் வங்கிக் கணக்குப் புத்தகம்', 'Bank passbook in the pregnant mother''s name for milestone instalment transfers.', 'தவணைத் தொகைகளைப் பெறுவதற்கான கர்ப்பிணித் தாயின் வங்கிக் கணக்குப் புத்தகம்.', true, false, 2),
  ('20000000-0000-4000-8000-000000000005', 'RATION_SMART_CARD', 'Family Smart Card', 'குடும்ப அட்டை', 'Proof of Tamil Nadu residence and household status.', 'தமிழ்நாடு இருப்பிடம் மற்றும் குடும்ப விவரச் சான்று.', true, false, 3),

  -- 6. Naan Mudhalvan
  ('20000000-0000-4000-8000-000000000006', 'BONAFIDE_CERTIFICATE', 'College ID / Bonafide or Degree Certificate', 'கல்லூரி அடையாள அட்டை / பட்டப்படிப்புச் சான்றிதழ்', 'Proof of enrolment in a Tamil Nadu institution or completion of degree for competitive exam schemes.', 'கல்லூரி அடையாள அட்டை அல்லது பட்டப்படிப்பு தேர்ச்சிச் சான்றிதழ்.', true, false, 1),
  ('20000000-0000-4000-8000-000000000006', 'NATIVITY_CERTIFICATE', 'Tamil Nadu Residence / Nativity Proof', 'இருப்பிடச் சான்றிதழ்', 'Required for competitive exam scholarship stipends.', 'போட்டித் தேர்வு உதவித்தொகைப் பிரிவுகளுக்குத் தேவையான இருப்பிடச் சான்று.', false, false, 2),

  -- 7. TN First Generation Graduate
  ('20000000-0000-4000-8000-000000000007', 'FIRST_GRADUATE_CERTIFICATE', 'First Generation Graduate Certificate (TNeGA)', 'முதல் தலைமுறை பட்டதாரிச் சான்றிதழ்', 'Digitally signed certificate issued by the Tahsildar via Tamil Nadu e-Sevai confirming no prior graduate in the family.', 'குடும்பத்தில் பட்டதாரிகள் இல்லை என்பதை உறுதிப்படுத்தி வட்டாட்சியரால் இ-சேவை மூலம் வழங்கப்படும் சான்றிதழ்.', true, true, 1),
  ('20000000-0000-4000-8000-000000000007', 'MARKSHEET_10_12', 'Class 10 & Class 12 Marksheets and Transfer Certificate', '10 மற்றும் 12-ஆம் வகுப்பு மதிப்பெண் சான்றிதழ் மற்றும் மாற்றுச் சான்றிதழ்', 'Required for single-window professional counselling verification.', 'ஒற்றைச்சாளரக் கலந்தாய்வு சரிபார்ப்பிற்குத் தேவையான மதிப்பெண் சான்றிதழ்கள்.', true, false, 2),
  ('20000000-0000-4000-8000-000000000007', 'NATIVITY_CERTIFICATE', 'Tamil Nadu Nativity Certificate', 'தமிழ்நாடு இருப்பிடச் சான்றிதழ்', 'Proof of domicile in Tamil Nadu.', 'தமிழ்நாட்டில் வசிப்பதற்கான இருப்பிடச் சான்றிதழ்.', true, false, 3),

  -- 8. TN UYEGP
  ('20000000-0000-4000-8000-000000000008', 'MARKSHEET_10_12', 'Educational Qualification Certificate (Minimum Class 8 Pass)', 'கல்வித் தகுதிச் சான்றிதழ் (குறைந்தபட்சம் 8-ஆம் வகுப்பு தேர்ச்சி)', 'Transfer certificate or marksheet proving educational qualification.', 'கல்வித் தகுதியை நிரூபிக்கும் மதிப்பெண் அல்லது மாற்றுச் சான்றிதழ்.', true, false, 1),
  ('20000000-0000-4000-8000-000000000008', 'NATIVITY_CERTIFICATE', 'Residence Proof / Ration Card (Minimum 3 Years in TN)', 'குடும்ப அட்டை / இருப்பிடச் சான்றிதழ்', 'Proof of residence in Tamil Nadu for at least 3 years.', 'தமிழ்நாட்டில் குறைந்தது 3 ஆண்டுகள் வசிப்பதற்கான சான்று.', true, false, 2),
  ('20000000-0000-4000-8000-000000000008', 'COMMUNITY_CERTIFICATE', 'Community Certificate (For Special Category Subsidy)', 'சாதிச் சான்றிதழ் (சிறப்புப் பிரிவு மானியத்திற்கு)', 'Required when claiming special category margin money or 35% subsidy norms.', 'சிறப்புப் பிரிவு மானியம் கோரும் விண்ணப்பதாரர்களுக்குத் தேவை.', false, false, 3),

  -- 9. PM-KISAN
  ('20000000-0000-4000-8000-000000000009', 'LAND_CHITTA_ADANGAL', 'Agricultural Land Ownership Record (Patta / Chitta)', 'வேளாண் நில உடைமை ஆவணம் (பட்டா / சிட்டா)', 'Revenue land record proving cultivable land ownership in the farmer''s name.', 'விவசாயியின் பெயரில் சாகுபடி நிலம் இருப்பதற்கான பட்டா / சிட்டா நகல்.', true, false, 1),
  ('20000000-0000-4000-8000-000000000009', 'BANK_PASSBOOK', 'Bank Account Passbook (DBT-Enabled)', 'வங்கிக் கணக்குப் புத்தகம்', 'Active bank account linked for Direct Benefit Transfer.', 'நேரடிப் பணப்பரிமாற்றத்திற்கு இணைக்கப்பட்ட வங்கிக் கணக்குப் புத்தகம்.', true, false, 2),

  -- 10. PM Fasal Bima Yojana
  ('20000000-0000-4000-8000-000000000010', 'LAND_CHITTA_ADANGAL', 'Land Record (Chitta / Patta) & VAO Sowing Certificate (Adangal)', 'பட்டா / சிட்டா மற்றும் கிராம நிர்வாக அலுவலரின் பயிர்ச் சாகுபடி அடங்கல் சான்று', 'Confirms the notified crop sown and acreage for the current season.', 'நடப்புப் பருவத்தில் சாகுபடி செய்யப்பட்டுள்ள பயிர் மற்றும் நிலப்பரப்பை உறுதிப்படுத்தும் அடங்கல் சான்று.', true, true, 1),
  ('20000000-0000-4000-8000-000000000010', 'BANK_PASSBOOK', 'Farmer Bank Passbook', 'விவசாயியின் வங்கிக் கணக்குப் புத்தகம்', 'Used for claim settlement credit.', 'காப்பீட்டு இழப்பீட்டுத் தொகையைப் பெறுவதற்கான வங்கிக் கணக்குப் புத்தகம்.', true, false, 2),

  -- 11. Ayushman Bharat PM-JAY
  ('20000000-0000-4000-8000-000000000011', 'RATION_SMART_CARD', 'Family Ration Card / CMCHIS Card', 'குடும்ப அட்டை / முதலமைச்சர் காப்பீட்டு அட்டை', 'Verifies family composition for PM-JAY / CMCHIS co-branded card.', 'குடும்ப உறுப்பினர்களின் விவரங்களைச் சரிபார்க்க உதவும் குடும்ப அட்டை.', true, false, 1),
  ('20000000-0000-4000-8000-000000000011', 'AGE_PROOF', 'Age & Identity Proof (Especially for 70+ Senior Citizen Vay Vandana Card)', 'வயது மற்றும் அடையாளச் சான்று (குறிப்பாக 70+ மூத்த குடிமக்களுக்கு)', 'Confirms date of birth / age for senior citizen healthcare enrolment.', 'மூத்த குடிமக்கள் மருத்துவக் காப்பீட்டுப் பதிவிற்கான வயதுச் சான்று.', true, false, 2),

  -- 12. Central Sector Scholarship (CSSS)
  ('20000000-0000-4000-8000-000000000012', 'MARKSHEET_10_12', 'Class 12 Board Examination Marksheet', '12-ஆம் வகுப்பு பொதுத்தேர்வு மதிப்பெண் சான்றிதழ்', 'Proves completion of Class 12 within the top 20th percentile (80th percentile cutoff).', '12-ஆம் வகுப்பு பொதுத்தேர்வில் பெற்ற மதிப்பெண்களை உறுதிப்படுத்தும் சான்றிதழ்.', true, false, 1),
  ('20000000-0000-4000-8000-000000000012', 'INCOME_CERTIFICATE', 'Annual Family Income Certificate (Up to ₹4,50,000)', 'குடும்ப ஆண்டு வருமானச் சான்றிதழ் (₹4,50,000-க்குள்)', 'Valid income certificate issued by the competent state revenue authority.', 'வருவாய்த்துறை அதிகாரியால் வழங்கப்பட்ட செல்லுபடியாகும் வருமானச் சான்றிதழ்.', true, true, 2),
  ('20000000-0000-4000-8000-000000000012', 'BONAFIDE_CERTIFICATE', 'College / University Bonafide Verification', 'கல்லூரி / பல்கலைக்கழகப் பயிலும் சான்றிதழ்', 'Verified online by the institution nodal officer on the National Scholarship Portal.', 'தேசிய கல்வி உதவித்தொகை தளத்தில் கல்லூரியால் சரிபார்க்கப்படும் பயிலும் சான்று.', true, true, 3),
  ('20000000-0000-4000-8000-000000000012', 'BANK_PASSBOOK', 'Student Bank Account Passbook', 'மாணவரின் வங்கிக் கணக்குப் புத்தகம்', 'Active bank account in the student''s name.', 'மாணவரின் பெயரிலான வங்கிக் கணக்குப் புத்தகம்.', true, false, 4),

  -- 13. PM SVANidhi
  ('20000000-0000-4000-8000-000000000013', 'BUSINESS_VENDING_PROOF', 'Certificate of Vending / Urban Local Body ID Card / Letter of Recommendation', 'சாலையோர வியாபாரச் சான்றிதழ் / அடையாள அட்டை / உள்ளாட்சிப் பரிந்துரைக் கடிதம்', 'Issued by the Urban Local Body (ULB) or Town Vending Committee.', 'நகராட்சி / மாநகராட்சி அல்லது நகர விற்பனைக் குழுவால் வழங்கப்பட்ட வியாபாரச் சான்று.', true, false, 1),
  ('20000000-0000-4000-8000-000000000013', 'BANK_PASSBOOK', 'Bank Account Passbook', 'வங்கிக் கணக்குப் புத்தகம்', 'Savings or current account passbook for working capital disbursement and interest subsidy.', 'நடைமுறை மூலதனக் கடன் மற்றும் வட்டி மானியம் பெறுவதற்கான வங்கிக் கணக்குப் புத்தகம்.', true, false, 2),

  -- 14. PM Vishwakarma
  ('20000000-0000-4000-8000-000000000014', 'IDENTITY_PROOF', 'Identity & Address Proof + Ration Card', 'அடையாளம், முகவரிச் சான்று மற்றும் குடும்ப அட்டை', 'Used for artisan household registration at the Common Service Centre.', 'பொதுச் சேவை மையத்தில் கைவினைஞர் குடும்பப் பதிவிற்குத் தேவையான சான்று.', true, false, 1),
  ('20000000-0000-4000-8000-000000000014', 'BANK_PASSBOOK', 'Artisan Bank Account Passbook', 'கைவினைஞரின் வங்கிக் கணக்குப் புத்தகம்', 'Required for receiving the ₹500/day training stipend, ₹15,000 toolkit e-voucher, and credit disbursement.', 'பயிற்சி உதவித்தொகை, கருவித்தொகுப்பு மானியம் மற்றும் கடன் பெறுவதற்கான வங்கிக் கணக்குப் புத்தகம்.', true, false, 2),

  -- 15. PMAY-U 2.0
  ('20000000-0000-4000-8000-000000000015', 'INCOME_CERTIFICATE', 'Annual Household Income Certificate (EWS / LIG / MIG)', 'குடும்ப ஆண்டு வருமானச் சான்றிதழ் (EWS / LIG / MIG)', 'Certifies household annual income is within ₹3L (EWS), ₹6L (LIG), or ₹9L (MIG).', 'குடும்ப ஆண்டு வருமானம் நிர்ணயிக்கப்பட்ட வரம்பிற்குள் இருப்பதை உறுதிப்படுத்தும் சான்றிதழ்.', true, true, 1),
  ('20000000-0000-4000-8000-000000000015', 'LAND_CHITTA_ADANGAL', 'Land Ownership / Property Title Deed (For BLC Construction)', 'வீட்டுமனைப் பட்டா / சொத்து உரிமை ஆவணம் (BLC பிரிவிற்கு)', 'Required when applying for Beneficiary-Led Construction assistance on owned urban land.', 'சொந்த இடத்தில் வீடு கட்ட மானியம் கோரும் (BLC) விண்ணப்பதாரர்களுக்கான நில உரிமை ஆவணம்.', true, false, 2),
  ('20000000-0000-4000-8000-000000000015', 'BANK_PASSBOOK', 'Bank Account Passbook', 'வங்கிக் கணக்குப் புத்தகம்', 'For direct instalment transfer linked to geo-tagged construction stages.', 'கட்டுமான நிலைகளுக்கு ஏற்ப மானியத் தவணைகளைப் பெறுவதற்கான வங்கிக் கணக்குப் புத்தகம்.', true, false, 3),

  -- 16. IGNOAPS Senior Citizen Pension
  ('20000000-0000-4000-8000-000000000016', 'AGE_PROOF', 'Age Proof Certificate (Birth Certificate / Voter ID / School Record)', 'வயதுச் சான்றிதழ் (பிறப்புச் சான்றிதழ் / வாக்காளர் அட்டை / பள்ளிச் சான்று)', 'Confirms applicant is 60 years of age or older.', 'விண்ணப்பதாரர் 60 வயது நிரம்பியவர் என்பதை உறுதிப்படுத்தும் ஆவணம்.', true, false, 1),
  ('20000000-0000-4000-8000-000000000016', 'INCOME_CERTIFICATE', 'BPL / Destitute Income Certificate', 'வறுமைக்கோடு / ஆதரவற்றோர் வருமானச் சான்றிதழ்', 'Revenue verification confirming BPL/destitute status.', 'வறுமைக்கோட்டிற்குக் கீழ் உள்ளவர் என்பதை உறுதிப்படுத்தும் வருவாய்த்துறைச் சான்று.', true, true, 2),
  ('20000000-0000-4000-8000-000000000016', 'BANK_PASSBOOK', 'Bank or Post Office Savings Passbook', 'வங்கி அல்லது அஞ்சலகச் சேமிப்புக் கணக்குப் புத்தகம்', 'Account for monthly pension credit.', 'மாதாந்திர ஓய்வூதியம் பெறுவதற்கான வங்கி அல்லது அஞ்சலகக் கணக்குப் புத்தகம்.', true, false, 3),

  -- 17. Sukanya Samriddhi Yojana
  ('20000000-0000-4000-8000-000000000017', 'AGE_PROOF', 'Girl Child''s Birth Certificate', 'பெண் குழந்தையின் பிறப்புச் சான்றிதழ்', 'Issued by the municipal authority or registrar of births confirming the child is below 10 years of age.', 'பெண் குழந்தை 10 வயதுக்குட்பட்டவர் என்பதை உறுதிப்படுத்தும் பிறப்புச் சான்றிதழ்.', true, false, 1),
  ('20000000-0000-4000-8000-000000000017', 'IDENTITY_PROOF', 'Parent / Legal Guardian Identity & Address Proof', 'பெற்றோர் / பாதுகாவலரின் அடையாள மற்றும் முகவரிச் சான்று', 'Official KYC document of the parent or guardian opening the account.', 'கணக்கைத் தொடங்கும் பெற்றோர் அல்லது பாதுகாவலரின் அதிகாரப்பூர்வ அடையாள மற்றும் முகவரிச் சான்று.', true, false, 2),

  -- 18. Atal Pension Yojana
  ('20000000-0000-4000-8000-000000000018', 'BANK_PASSBOOK', 'Savings Bank or Post Office Account Passbook', 'வங்கி அல்லது அஞ்சலகச் சேமிப்புக் கணக்குப் புத்தகம்', 'Active savings account with auto-debit facility for monthly/quarterly/half-yearly contribution.', 'மாதாந்திரப் பங்களிப்புத் தொகையைச் செலுத்துவதற்கான சேமிப்புக் கணக்குப் புத்தகம்.', true, false, 1),
  ('20000000-0000-4000-8000-000000000018', 'AGE_PROOF', 'Age & KYC Proof (18 to 40 Years)', 'வயது மற்றும் அடையாளச் சான்று (18 முதல் 40 வயது)', 'Confirms entry age between 18 and 40 years.', 'விண்ணப்பதாரரின் வயது 18 முதல் 40-க்குள் இருப்பதை உறுதிப்படுத்தும் ஆவணம்.', true, false, 2)
ON CONFLICT (scheme_id, document_type_code) DO UPDATE SET
  name_en = EXCLUDED.name_en,
  name_ta = EXCLUDED.name_ta,
  description_en = EXCLUDED.description_en,
  description_ta = EXCLUDED.description_ta,
  is_mandatory = EXCLUDED.is_mandatory,
  requires_unexpired = EXCLUDED.requires_unexpired,
  display_order = EXCLUDED.display_order,
  updated_at = timezone('utc', now());

-- ============================================================================
-- 6. SCHEME APPLICATION STEPS
-- ============================================================================

INSERT INTO public.scheme_application_steps (
  scheme_id, step_number, title_en, title_ta, description_en, description_ta
) VALUES
  -- 1. Pudhumai Penn
  ('20000000-0000-4000-8000-000000000001', 1, 'Verify School EMIS Number', 'பள்ளி EMIS எண்ணைச் சரிபார்த்தல்', 'Confirm your Class 6 to Class 12 Government school attendance record and EMIS ID from your school transfer certificate.', 'உங்கள் மாற்றுச் சான்றிதழ் மூலம் 6 முதல் 12-ஆம் வகுப்பு வரை அரசுப் பள்ளியில் பயின்ற EMIS எண்ணை உறுதிப்படுத்தவும்.'),
  ('20000000-0000-4000-8000-000000000001', 2, 'Submit Details to College UMIS Nodal Officer', 'கல்லூரி UMIS ஒருங்கிணைப்பு அலுவலரிடம் சமர்ப்பித்தல்', 'Provide your EMIS ID, college admission details, and active bank passbook to your college''s UMIS Nodal Officer.', 'கல்லூரியின் UMIS ஒருங்கிணைப்பு அலுவலரிடம் EMIS எண், சேர்க்கைச் சான்று மற்றும் வங்கிக் கணக்குப் புத்தகத்தை வழங்கவும்.'),
  ('20000000-0000-4000-8000-000000000001', 3, 'Institutional & Education Department Verification', 'கல்லூரி மற்றும் கல்வித்துறைச் சரிபார்ப்பு', 'The college uploads your application on the UMIS portal and the School Education database verifies Class 6–12 eligibility for monthly ₹1,000 disbursement.', 'கல்லூரி மூலம் UMIS தளத்தில் பதிவேற்றப்பட்டு, பள்ளிக்கல்வித் துறைத் தரவுகளுடன் சரிபார்க்கப்பட்ட பின் மாதம் ₹1,000 வங்கிக் கணக்கில் வரவு வைக்கப்படும்.'),

  -- 2. Tamil Pudhalvan
  ('20000000-0000-4000-8000-000000000002', 1, 'Keep School EMIS ID & Bank Account Ready', 'பள்ளி EMIS எண் மற்றும் வங்கிக் கணக்கைத் தயார் செய்தல்', 'Ensure you have your school EMIS ID (Classes 6–12 in Govt / Govt-aided Tamil medium school) and an active bank account.', 'அரசு அல்லது அரசு உதவிபெறும் தமிழ் வழிப் பள்ளியில் பயின்ற EMIS எண் மற்றும் வங்கிக் கணக்கைத் தயாராக வைத்திருக்கவும்.'),
  ('20000000-0000-4000-8000-000000000002', 2, 'Register Through College UMIS Portal', 'கல்லூரி UMIS தளத்தில் பதிவு செய்தல்', 'Complete the Tamil Pudhalvan application through your college''s UMIS nodal cell.', 'நீங்கள் பயிலும் கல்லூரியின் UMIS மையம் மூலம் தமிழ்ப் புதல்வன் திட்டத்திற்குப் பதிவு செய்யவும்.'),
  ('20000000-0000-4000-8000-000000000002', 3, 'Receive Monthly DBT Credit', 'மாதாந்திர நிதியுதவியைப் பெறுதல்', 'Upon EMIS and institutional verification, ₹1,000 per month is credited directly to your bank account.', 'சரிபார்ப்பு முடிந்தவுடன் ஒவ்வொரு மாதமும் ₹1,000 நேரடியாக உங்கள் வங்கிக் கணக்கில் செலுத்தப்படும்.'),

  -- 3. Kalaignar Magalir Urimai Thittam
  ('20000000-0000-4000-8000-000000000003', 1, 'Check Household Ration Card & Bank Seeding', 'குடும்ப அட்டை மற்றும் வங்கி இணைப்பைச் சரிபார்த்தல்', 'Ensure your Family Smart Card is active and your bank account is enabled for Direct Benefit Transfer.', 'உங்கள் குடும்ப அட்டை மற்றும் வங்கிக் கணக்கு நேரடிப் பணப்பரிமாற்றத்திற்கு இணைக்கப்பட்டுள்ளதை உறுதி செய்யவும்.'),
  ('20000000-0000-4000-8000-000000000003', 2, 'Apply at e-Sevai Centre or Special Camp', 'இ-சேவை மையம் அல்லது சிறப்பு முகாமில் விண்ணப்பித்தல்', 'Visit the designated e-Sevai centre with your Family Smart Card and bank passbook to submit the application and biometric verification.', 'குடும்ப அட்டை மற்றும் வங்கிக் கணக்குப் புத்தகத்துடன் இ-சேவை மையத்திற்குச் சென்று விண்ணப்பத்தைப் பதிவு செய்யவும்.'),
  ('20000000-0000-4000-8000-000000000003', 3, 'Track Status on KMUT Portal', 'KMUT தளத்தில் விண்ணப்ப நிலையை அறிதல்', 'Check application approval status on the official kmut.tn.gov.in portal.', 'அதிகாரப்பூர்வ kmut.tn.gov.in இணையதளத்தில் விண்ணப்ப நிலையைச் சரிபார்க்கலாம்.'),

  -- 4. CMCHIS
  ('20000000-0000-4000-8000-000000000004', 1, 'Obtain Annual Income Certificate via e-Sevai', 'இ-சேவை மூலம் வருமானச் சான்றிதழ் பெறுதல்', 'Apply for a family income certificate (confirming annual income below ₹1,20,000) from the VAO/Revenue Department.', 'குடும்ப ஆண்டு வருமானம் ₹1,20,000-க்குக் கீழ் உள்ளதற்கான வருமானச் சான்றிதழை இ-சேவை மூலம் பெறவும்.'),
  ('20000000-0000-4000-8000-000000000004', 2, 'Enrol at District Collectorate CMCHIS Kiosk', 'மாவட்ட ஆட்சியர் அலுவலக காப்பீட்டு மையத்தில் பதிவு செய்தல்', 'Submit the original Family Smart Card and Income Certificate at the CMCHIS enrolment centre for photograph and card generation.', 'மாவட்ட ஆட்சியர் அலுவலகத்தில் உள்ள முதலமைச்சர் காப்பீட்டு மையத்தில் குடும்ப அட்டை மற்றும் வருமானச் சான்றிதழைச் சமர்ப்பித்து e-Card பெறவும்.'),

  -- 5. Dr. Muthulakshmi Reddy Maternity Benefit Scheme
  ('20000000-0000-4000-8000-000000000005', 1, 'Register Pregnancy on PICME 3.0 Portal', 'PICME தளத்தில் கர்ப்பத்தைப் பதிவு செய்தல்', 'Register within 12 weeks of pregnancy via picme.tn.gov.in, e-Sevai, or the local Village Health Nurse (VHN) to obtain a 12-digit PICME number.', 'கர்ப்பம் தரித்த 12 வாரங்களுக்குள் picme.tn.gov.in அல்லது கிராம சுகாதாரச் செவிலியர் மூலம் பதிவு செய்து 12 இலக்க PICME எண்ணைப் பெறவும்.'),
  ('20000000-0000-4000-8000-000000000005', 2, 'Complete Antenatal Checkups at Government Health Centre', 'அரசு ஆரம்ப சுகாதார நிலையத்தில் பரிசோதனைகள் மற்றும் வங்கிக் கணக்கு இணைப்பு', 'Provide bank passbook details at the Primary Health Centre and complete scheduled antenatal checkups, institutional delivery, and child immunization to receive all three cash instalments and two nutrition kits.', 'ஆரம்ப சுகாதார நிலையத்தில் வங்கிக் கணக்கு விவரங்களை வழங்கி, மாதாந்திரப் பரிசோதனைகள் மற்றும் குழந்தை தடுப்பூசிகளை முடிக்கும்போது மூன்று தவணைத் தொகைகள் மற்றும் இரண்டு ஊட்டச்சத்துப் பெட்டகங்கள் வழங்கப்படும்.'),

  -- 6. Naan Mudhalvan
  ('20000000-0000-4000-8000-000000000006', 1, 'Log In to Naan Mudhalvan Portal', 'நான் முதல்வன் இணையதளத்தில் உள்நுழைதல்', 'Sign in at naanmudhalvan.tn.gov.in using your college student ID or register as a Tamil Nadu youth candidate.', 'naanmudhalvan.tn.gov.in தளத்தில் கல்லூரிப் பதிவு எண் அல்லது தனிப்பட்ட கணக்கு மூலம் உள்நுழையவும்.'),
  ('20000000-0000-4000-8000-000000000006', 2, 'Select Skill Course or Competitive Exam Programme', 'திறன் பயிற்சி அல்லது போட்டித் தேர்வுத் திட்டத்தைத் தேர்ந்தெடுத்தல்', 'Enrol in industry certification tracks, placement drives, or competitive exam scholarship notifications.', 'உங்கள் துறைக்கு ஏற்ற தொழில் திறன் சான்றிதழ் பயிற்சி அல்லது போட்டித் தேர்வு உதவித்தொகைப் பிரிவில் விண்ணப்பிக்கவும்.'),

  -- 7. TN First Generation Graduate
  ('20000000-0000-4000-8000-000000000007', 1, 'Apply for First Graduate Certificate on TNeGA e-Sevai', 'இ-சேவை தளத்தில் முதல் பட்டதாரிச் சான்றிதழுக்கு விண்ணப்பித்தல்', 'Submit parent/sibling non-graduate declaration, ration card, and transfer certificates on tnesevai.tn.gov.in.', 'tnesevai.tn.gov.in தளத்தில் பெற்றோர் மற்றும் உடன்பிறந்தோர் பட்டதாரி இல்லை என்பதற்கான உறுதிமொழி மற்றும் சான்றிதழ்களுடன் விண்ணப்பிக்கவும்.'),
  ('20000000-0000-4000-8000-000000000007', 2, 'Submit Certificate During Single-Window Counselling', 'ஒற்றைச்சாளரக் கலந்தாய்வில் சான்றிதழைச் சமர்ப்பித்தல்', 'Upload the digitally signed First Generation Graduate Certificate during TNEA / state professional admission counselling to claim tuition fee waiver.', 'பொறியியல் / தொழில்முறைப் படிப்புக்கான அரசுக் கலந்தாய்வின் போது முதல் பட்டதாரிச் சான்றிதழைச் சமர்ப்பித்துக் கட்டணச் சலுகையைப் பெறவும்.'),

  -- 8. TN UYEGP
  ('20000000-0000-4000-8000-000000000008', 1, 'Register Online on TN MSME UYEGP Portal', 'தமிழ்நாடு MSME UYEGP தளத்தில் ஆன்லைன் பதிவு', 'Fill out the online application at msmeonline.tn.gov.in/uyegp with project summary, quotation, and educational/nativity certificates.', 'msmeonline.tn.gov.in/uyegp தளத்தில் தொழில் திட்ட அறிக்கை, விலைப்புள்ளி மற்றும் கல்வி/இருப்பிடச் சான்றிதழ்களுடன் விண்ணப்பிக்கவும்.'),
  ('20000000-0000-4000-8000-000000000008', 2, 'District Industries Centre (DIC) Selection & Bank Sanction', 'மாவட்டத் தொழில் மைய நேர்காணல் மற்றும் வங்கிக் கடன் ஒப்புதல்', 'Attend the DIC task-force interview, complete the Entrepreneur Development Programme (EDP) training, and receive bank loan sanction with 25% subsidy.', 'மாவட்டத் தொழில் மைய நேர்காணலில் பங்கேற்று, தொழில்முனைவோர் பயிற்சியை முடித்தவுடன் 25% மானியத்துடன் வங்கிக் கடன் வழங்கப்படும்.'),

  -- 9. PM-KISAN
  ('20000000-0000-4000-8000-000000000009', 1, 'Submit New Farmer Registration on PM-KISAN Portal', 'PM-KISAN இணையதளத்தில் புதிய விவசாயி பதிவு', 'Visit pmkisan.gov.in -> "New Farmer Registration" (or nearest CSC) and enter state, district, sub-district, village, and land Patta/Survey details.', 'pmkisan.gov.in தளத்தில் "New Farmer Registration" பகுதியில் அல்லது பொதுச் சேவை மையத்தில் நிலப்பட்டா மற்றும் சர்வே எண் விவரங்களுடன் பதிவு செய்யவும்.'),
  ('20000000-0000-4000-8000-000000000009', 2, 'Complete e-KYC & Revenue Land Seeding Verification', 'e-KYC மற்றும் வருவாய்த்துறை நிலச் சரிபார்ப்பு', 'Complete OTP/biometric e-KYC on the portal; once state revenue/agriculture authorities verify the land record, ₹2,000 instalments are credited every 4 months.', 'இணையதளத்தில் e-KYC சரிபார்ப்பை முடித்தவுடன், வேளாண்/வருவாய்த்துறை அதிகாரிகள் நில ஆவணத்தை உறுதி செய்து 4 மாதங்களுக்கு ஒருமுறை ₹2,000 வழங்குவர்.'),

  -- 10. PM Fasal Bima Yojana
  ('20000000-0000-4000-8000-000000000010', 1, 'Obtain VAO Crop Sowing Certificate (Adangal)', 'கிராம நிர்வாக அலுவலரிடம் அடங்கல் சான்று பெறுதல்', 'Get the current season''s crop cultivation certificate (Adangal) and Chitta from the Village Administrative Officer.', 'கிராம நிர்வாக அலுவலரிடம் (VAO) நடப்புப் பருவப் பயிர்ச் சாகுபடி அடங்கல் மற்றும் சிட்டா சான்று பெறவும்.'),
  ('20000000-0000-4000-8000-000000000010', 2, 'Pay Subsidized Premium via PMFBY Portal, Bank, or PACCS', 'PMFBY தளம், வங்கி அல்லது கூட்டுறவுச் சங்கத்தில் பிரிமியம் செலுத்துதல்', 'Enrol before the seasonal cut-off date at pmfby.gov.in, your bank, PACCS, or CSC and keep the insurance policy receipt.', 'பருவகாலக் காலக்கெடுவுக்குள் pmfby.gov.in, வங்கி, கூட்டுறவுச் சங்கம் அல்லது பொதுச் சேவை மையத்தில் பிரிமியம் செலுத்திக் காப்பீட்டு இரசீதைப் பெறவும்.'),

  -- 11. Ayushman Bharat PM-JAY
  ('20000000-0000-4000-8000-000000000011', 1, 'Check Eligibility on NHA Beneficiary Portal', 'NHA பயனாளிகள் தளத்தில் தகுதியைச் சரிபார்த்தல்', 'Log in to beneficiary.nha.gov.in using your mobile number and search by state, district, Family ID (Ration Card / CMCHIS), or 70+ senior citizen enrolment.', 'beneficiary.nha.gov.in தளத்தில் மொபைல் எண் மூலம் உள்நுழைந்து குடும்ப அட்டை எண் அல்லது 70+ மூத்த குடிமக்கள் பிரிவில் தகுதியைச் சரிபார்க்கவும்.'),
  ('20000000-0000-4000-8000-000000000011', 2, 'Complete e-KYC & Download Ayushman Card', 'e-KYC முடித்து ஆயுஷ்மான் அட்டையைப் பதிவிறக்குதல்', 'Complete e-KYC verification online or at an empanelled hospital Ayushman Mitra counter to download your cashless Ayushman Card.', 'ஆன்லைனில் அல்லது அங்கீகரிக்கப்பட்ட மருத்துவமனையின் ஆயுஷ்மான் மித்ரா மையத்தில் e-KYC முடித்து அட்டையைப் பதிவிறக்கம் செய்யலாம்.'),

  -- 12. Central Sector Scholarship (CSSS)
  ('20000000-0000-4000-8000-000000000012', 1, 'Complete One-Time Registration (OTR) on NSP', 'தேசிய கல்வி உதவித்தொகை தளத்தில் ஒருமுறைப் பதிவு (OTR)', 'Visit scholarships.gov.in and generate your unique NSP One-Time Registration (OTR) ID.', 'scholarships.gov.in இணையதளத்தில் ஒருமுறைப் பதிவு (OTR) செய்து அடையாள எண்ணைப் பெறவும்.'),
  ('20000000-0000-4000-8000-000000000012', 2, 'Submit CSSS Application & Verify at College Nodal Office', 'ஆன்லைன் விண்ணப்பம் மற்றும் கல்லூரிச் சரிபார்ப்பு', 'Select "Central Sector Scheme of Scholarships for College and University Students", upload Class 12 marksheet and income certificate, and submit printed copy to your college nodal officer.', 'CSSS உதவித்தொகைத் திட்டத்தைத் தேர்ந்தெடுத்து, 12-ஆம் வகுப்பு மதிப்பெண் மற்றும் வருமானச் சான்றிதழைப் பதிவேற்றிக் கல்லூரி ஒருங்கிணைப்பாளரிடம் சரிபார்ப்பை முடிக்கவும்.'),

  -- 13. PM SVANidhi
  ('20000000-0000-4000-8000-000000000013', 1, 'Check Vendor Survey Status or Obtain LoR', 'வியாபார அடையாள எண் அல்லது பரிந்துரைக் கடிதம் பெறுதல்', 'Check your Street Vendor Survey Reference Number on pmsvanidhi.mohua.gov.in or apply for an Urban Local Body Letter of Recommendation (LoR).', 'pmsvanidhi.mohua.gov.in தளத்தில் வியாபார அடையாள எண்ணைச் சரிபார்க்கவும் அல்லது நகராட்சியின் பரிந்துரைக் கடிதத்தைப் (LoR) பெறவும்.'),
  ('20000000-0000-4000-8000-000000000013', 2, 'Submit Working Capital Loan Application Online', 'நடைமுறை மூலதனக் கடனுக்கு ஆன்லைனில் விண்ணப்பித்தல்', 'Log in on the PM SVANidhi portal or visit a CSC, choose your preferred lending bank, and submit the collateral-free loan application.', 'PM SVANidhi இணையதளம் அல்லது பொதுச் சேவை மையம் மூலம் விரும்பும் வங்கியைத் தேர்ந்தெடுத்துப் பிணையமில்லாக் கடனுக்கு விண்ணப்பிக்கவும்.'),

  -- 14. PM Vishwakarma
  ('20000000-0000-4000-8000-000000000014', 1, 'Register at Common Service Centre (CSC)', 'பொதுச் சேவை மையத்தில் (CSC) பதிவு செய்தல்', 'Visit your nearest CSC with your Ration Card and bank passbook to register under your traditional trade on pmvishwakarma.gov.in.', 'குடும்ப அட்டை மற்றும் வங்கிக் கணக்குப் புத்தகத்துடன் அருகிலுள்ள பொதுச் சேவை மையத்திற்குச் சென்று pmvishwakarma.gov.in தளத்தில் உங்கள் பாரம்பரியத் தொழிலைப் பதிவு செய்யவும்.'),
  ('20000000-0000-4000-8000-000000000014', 2, 'Three-Stage Verification, Skill Training & Toolkit Grant', 'சரிபார்ப்பு, திறன் பயிற்சி மற்றும் கருவித்தொகுப்பு மானியம்', 'After Panchayat/ULB and District verification, receive your PM Vishwakarma Digital ID, attend the 5-day basic skill training (with ₹500/day stipend), and receive the ₹15,000 toolkit e-voucher and loan eligibility.', 'உள்ளாட்சி மற்றும் மாவட்டச் சரிபார்ப்பிற்குப் பிறகு விஸ்வகர்மா சான்றிதழ் பெற்று, 5 நாள் பயிற்சியில் பங்கேற்று ₹15,000 கருவித்தொகுப்பு மானியம் மற்றும் வங்கிக் கடன் பெறலாம்.'),

  -- 15. PMAY-U 2.0
  ('20000000-0000-4000-8000-000000000015', 1, 'Check Eligibility & Select Vertical on PMAY-U 2.0 Portal', 'PMAY-U 2.0 தளத்தில் தகுதியைச் சரிபார்த்துப் பிரிவைத் தேர்ந்தெடுத்தல்', 'Open pmaymis.gov.in, complete the eligibility check, and select Beneficiary-Led Construction (BLC), Affordable Housing in Partnership (AHP), or Interest Subsidy Scheme (ISS).', 'pmaymis.gov.in தளத்தில் தகுதியைச் சரிபார்த்து, சொந்த இடத்தில் வீடு கட்டுதல் (BLC) அல்லது வீட்டுக் கடன் வட்டி மானியம் (ISS) பிரிவைத் தேர்ந்தெடுக்கவும்.'),
  ('20000000-0000-4000-8000-000000000015', 2, 'Upload Income & Land Documents for ULB / Bank Verification', 'வருமானம் மற்றும் நில ஆவணங்களைப் பதிவேற்றுதல்', 'Submit household details, income certificate, and land ownership proof for Urban Local Body field inspection or Primary Lending Institution verification.', 'வருமானச் சான்றிதழ் மற்றும் நில உரிமை ஆவணங்களைப் பதிவேற்றி நகராட்சி / வங்கிச் சரிபார்ப்புக்குப் பின் மானியத்தைப் பெறலாம்.'),

  -- 16. IGNOAPS Senior Citizen Pension
  ('20000000-0000-4000-8000-000000000016', 1, 'Submit OAP Application via Tamil Nadu e-Sevai Portal', 'இ-சேவை மையம் மூலம் முதியோர் ஓய்வூதிய விண்ணப்பம்', 'Visit an e-Sevai centre or log in to tnesevai.tn.gov.in and submit the Indira Gandhi National Old Age Pension Scheme (OAP) form with age proof, ration card, and bank passbook.', 'வயதுச் சான்று, குடும்ப அட்டை மற்றும் வங்கிக் கணக்குப் புத்தகத்துடன் இ-சேவை மையம் (tnesevai.tn.gov.in) மூலம் முதியோர் ஓய்வூதியத் திட்டத்திற்கு விண்ணப்பிக்கவும்.'),
  ('20000000-0000-4000-8000-000000000016', 2, 'VAO / Revenue Inspector Field Verification & Tahsildar Sanction', 'கிராம நிர்வாக அலுவலர் ஆய்வு மற்றும் வட்டாட்சியர் ஆணை', 'Following field verification by the VAO and Revenue Inspector, the Social Security Scheme Tahsildar issues the pension sanction order for monthly bank credit.', 'கிராம நிர்வாக அலுவலர் மற்றும் வருவாய் ஆய்வாளரின் கள ஆய்விற்குப் பிறகு, சமூகப் பாதுகாப்புத் திட்ட வட்டாட்சியரால் மாதாந்திர ஓய்வூதிய ஆணை வழங்கப்படும்.'),

  -- 17. Sukanya Samriddhi Yojana
  ('20000000-0000-4000-8000-000000000017', 1, 'Collect Account Opening Form at Post Office or Authorized Bank', 'அஞ்சலகம் அல்லது அங்கீகரிக்கப்பட்ட வங்கியில் விண்ணப்பம் பெறுதல்', 'Visit any India Post Office or participating public/private sector bank branch and fill out the Sukanya Samriddhi Account opening form (Form-1).', 'அருகிலுள்ள அஞ்சலகம் அல்லது அங்கீகரிக்கப்பட்ட வங்கிக் கிளைக்குச் சென்று செல்வமகள் சேமிப்புக் கணக்கு விண்ணப்பப் படிவத்தைப் பூர்த்தி செய்யவும்.'),
  ('20000000-0000-4000-8000-000000000017', 2, 'Submit Birth Certificate & Initial Deposit (Minimum ₹250)', 'பிறப்புச் சான்றிதழ் மற்றும் ஆரம்ப வைப்புத்தொகை (குறைந்தது ₹250) செலுத்துதல்', 'Attach the girl child''s Birth Certificate and parent/guardian KYC documents along with an initial deposit between ₹250 and ₹1,50,000 to receive the SSY passbook.', 'பெண் குழந்தையின் பிறப்புச் சான்றிதழ், பெற்றோரின் அடையாளச் சான்று மற்றும் குறைந்தபட்சம் ₹250 வைப்புத்தொகை செலுத்திக் கணக்குப் புத்தகத்தைப் பெறவும்.'),

  -- 18. Atal Pension Yojana
  ('20000000-0000-4000-8000-000000000018', 1, 'Select Guaranteed Monthly Pension Slab (₹1,000 to ₹5,000)', 'மாதாந்திர ஓய்வூதியத் தொகையைத் தேர்ந்தெடுத்தல் (₹1,000 முதல் ₹5,000 வரை)', 'Choose your desired monthly pension amount (₹1,000, ₹2,000, ₹3,000, ₹4,000, or ₹5,000 after age 60); contribution depends on your current entry age.', '60 வயதிற்குப் பிறகு பெற விரும்பும் மாதாந்திர ஓய்வூதியத் தொகையைத் (₹1,000 முதல் ₹5,000 வரை) தேர்ந்தெடுக்கவும்.'),
  ('20000000-0000-4000-8000-000000000018', 2, 'Activate Auto-Debit via Bank, Post Office, or eNPS Portal', 'வங்கி, அஞ்சலகம் அல்லது eNPS தளத்தில் கணக்கைத் தொடங்குதல்', 'Submit the APY registration form online via enps.nsdl.com or through your savings bank branch to activate PRAN and automatic contribution debit.', 'உங்கள் வங்கிக் கிளை, அஞ்சலகம் அல்லது enps.nsdl.com இணையதளம் மூலம் விண்ணப்பித்து PRAN எண்ணைப் பெறவும்.')
ON CONFLICT (scheme_id, step_number) DO UPDATE SET
  title_en = EXCLUDED.title_en,
  title_ta = EXCLUDED.title_ta,
  description_en = EXCLUDED.description_en,
  description_ta = EXCLUDED.description_ta,
  updated_at = timezone('utc', now());

-- ============================================================================
-- 7. OFFICIAL SOURCE REFERENCES
-- ============================================================================

INSERT INTO public.scheme_sources (
  scheme_id, source_title, source_url, source_type, verified_at
) VALUES
  ('20000000-0000-4000-8000-000000000001', 'Pudhumai Penn Official Portal — Social Welfare & Women Empowerment Department, Govt of Tamil Nadu', 'https://www.pudhumaipenn.tn.gov.in/', 'official_portal', '2026-11-15T17:25:00Z'),
  ('20000000-0000-4000-8000-000000000001', 'University Management Information System (UMIS) — Government of Tamil Nadu', 'https://umis.tn.gov.in/', 'application_portal', '2026-11-15T17:25:00Z'),

  ('20000000-0000-4000-8000-000000000002', 'University Management Information System (UMIS) — Tamil Pudhalvan Official Portal, Govt of Tamil Nadu', 'https://umis.tn.gov.in/', 'official_portal', '2026-11-15T17:25:00Z'),

  ('20000000-0000-4000-8000-000000000003', 'Kalaignar Magalir Urimai Thittam (KMUT) Official Portal — Government of Tamil Nadu', 'https://kmut.tn.gov.in/', 'official_portal', '2026-11-15T17:25:00Z'),

  ('20000000-0000-4000-8000-000000000004', 'Chief Minister''s Comprehensive Health Insurance Scheme (CMCHIS) Official Portal', 'https://www.cmchistn.com/', 'official_portal', '2026-11-15T17:25:00Z'),

  ('20000000-0000-4000-8000-000000000005', 'Pregnancy and Infant Cohort Monitoring and Evaluation (PICME) — Directorate of Public Health, Tamil Nadu', 'https://picme.tn.gov.in/', 'official_portal', '2026-11-15T17:25:00Z'),

  ('20000000-0000-4000-8000-000000000006', 'Naan Mudhalvan Official Portal — Tamil Nadu Skill Development Corporation (TNSDC)', 'https://www.naanmudhalvan.tn.gov.in/', 'official_portal', '2026-11-15T17:25:00Z'),

  ('20000000-0000-4000-8000-000000000007', 'Tamil Nadu e-Sevai (TNeGA) Citizen Portal — First Generation Graduate Certificate (REV-104)', 'https://www.tnesevai.tn.gov.in/', 'official_portal', '2026-11-15T17:25:00Z'),

  ('20000000-0000-4000-8000-000000000008', 'Unemployed Youth Employment Generation Programme (UYEGP) — MSME Department, Govt of Tamil Nadu', 'https://www.msmeonline.tn.gov.in/uyegp/', 'official_portal', '2026-11-15T17:25:00Z'),

  ('20000000-0000-4000-8000-000000000009', 'PM-KISAN Samman Nidhi Official Portal — Ministry of Agriculture & Farmers Welfare, Govt of India', 'https://pmkisan.gov.in/', 'official_portal', '2026-11-15T17:25:00Z'),

  ('20000000-0000-4000-8000-000000000010', 'Pradhan Mantri Fasal Bima Yojana (PMFBY) Official Portal — Ministry of Agriculture & Farmers Welfare', 'https://pmfby.gov.in/', 'official_portal', '2026-11-15T17:25:00Z'),

  ('20000000-0000-4000-8000-000000000011', 'Ayushman Bharat PM-JAY Official Portal — National Health Authority, Govt of India', 'https://pmjay.gov.in/', 'official_portal', '2026-11-15T17:25:00Z'),
  ('20000000-0000-4000-8000-000000000011', 'NHA PM-JAY Beneficiary Enrolment Portal', 'https://beneficiary.nha.gov.in/', 'application_portal', '2026-11-15T17:25:00Z'),

  ('20000000-0000-4000-8000-000000000012', 'National Scholarship Portal (NSP) — Ministry of Education, Government of India', 'https://scholarships.gov.in/', 'official_portal', '2026-11-15T17:25:00Z'),

  ('20000000-0000-4000-8000-000000000013', 'PM Street Vendor''s AtmaNirbhar Nidhi (PM SVANidhi) — Ministry of Housing and Urban Affairs', 'https://pmsvanidhi.mohua.gov.in/', 'official_portal', '2026-11-15T17:25:00Z'),

  ('20000000-0000-4000-8000-000000000014', 'PM Vishwakarma Official Portal — Ministry of Micro, Small and Medium Enterprises', 'https://pmvishwakarma.gov.in/', 'official_portal', '2026-11-15T17:25:00Z'),

  ('20000000-0000-4000-8000-000000000015', 'Pradhan Mantri Awas Yojana — Urban 2.0 (PMAY-U 2.0) Official Portal — MoHUA', 'https://pmaymis.gov.in/', 'official_portal', '2026-11-15T17:25:00Z'),

  ('20000000-0000-4000-8000-000000000016', 'National Social Assistance Programme (NSAP) Official Portal — Ministry of Rural Development', 'https://nsap.nic.in/', 'official_portal', '2026-11-15T17:25:00Z'),
  ('20000000-0000-4000-8000-000000000016', 'Tamil Nadu e-Sevai Portal — Revenue Social Security Pension Services', 'https://www.tnesevai.tn.gov.in/', 'application_portal', '2026-11-15T17:25:00Z'),

  ('20000000-0000-4000-8000-000000000017', 'National Savings Institute (Ministry of Finance) — Sukanya Samriddhi Account Rules', 'https://www.nsiindia.gov.in/InternalPage.aspx?Id_Pk=89', 'official_portal', '2026-11-15T17:25:00Z'),
  ('20000000-0000-4000-8000-000000000017', 'Department of Posts (India Post) Official Portal', 'https://www.indiapost.gov.in/', 'application_portal', '2026-11-15T17:25:00Z'),

  ('20000000-0000-4000-8000-000000000018', 'JanSuraksha (Department of Financial Services, Ministry of Finance) — Atal Pension Yojana Official Portal', 'https://www.jansuraksha.gov.in/', 'official_portal', '2026-11-15T17:25:00Z'),
  ('20000000-0000-4000-8000-000000000018', 'eNPS National Pension System / APY Online Enrolment Portal', 'https://enps.nsdl.com/eNPS/NationalPensionSystem.html', 'application_portal', '2026-11-15T17:25:00Z')
ON CONFLICT (scheme_id, source_url) DO UPDATE SET
  source_title = EXCLUDED.source_title,
  source_type = EXCLUDED.source_type,
  verified_at = EXCLUDED.verified_at;
