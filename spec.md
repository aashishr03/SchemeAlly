# SchemeAlly — Product & Technical Specification

**Product:** SchemeAlly  
**Tagline:** Your Ally for Government Benefits  
**Application:** Full-stack, responsive web application  
**Target audience:** Indian citizens  
**Initial scheme coverage:** Tamil Nadu and Central Government schemes  
**Languages:** English and Tamil  
**Deployment:** Vercel

---

# 1. Product Vision

SchemeAlly is an AI-powered government welfare scheme discovery and application assistance platform.

It helps citizens:

1. Discover government schemes relevant to them.
2. Understand whether they meet eligibility conditions.
3. Understand the benefits and requirements of each scheme.
4. Upload and organize required documents.
5. Track their application preparation progress.
6. Get guidance through an AI-powered assistant.
7. Access official government application links.

The goal is to make complicated government scheme information simple and accessible.

## Product principles

- Simple and easy to use.
- Accurate and source-grounded information.
- Clear eligibility explanations.
- Secure handling of personal documents.
- Useful AI assistance without misleading claims.
- Complete Tamil and English support.
- Real functionality, not a static prototype.
- No unnecessary features or complicated navigation.

---

# 2. Fixed Technology Stack

| Layer | Technology |
|---|---|
| Frontend | Next.js App Router |
| UI | React |
| Language | TypeScript |
| Styling | Tailwind CSS |
| Components | shadcn/ui |
| Icons | Lucide React |
| Database | Supabase PostgreSQL |
| Authentication | Supabase Auth |
| File storage | Supabase Storage |
| AI | Google Gemini API |
| AI SDK | @google/genai |
| Validation | Zod |
| Vector search | Supabase pgvector |
| Unit testing | Vitest |
| E2E testing | Playwright |
| Version control | GitHub |
| Deployment | Vercel |

### Fixed decisions

- Supabase is the only primary database.
- Gemini is the primary AI provider.
- Do not introduce MongoDB, Firebase or another database.
- Do not introduce another AI provider without approval.
- All secret API calls must happen on the server.
- Use current stable package versions and official documentation.

---

# 3. Target Users

SchemeAlly is intended for ordinary Indian citizens, including:

- Students.
- Farmers.
- Women seeking welfare assistance.
- Families.
- Senior citizens.
- Job seekers.
- Small business owners.
- Citizens seeking government financial assistance.

The initial version should support relevant Central Government and Tamil Nadu schemes.

---

# 4. Application Pages and Navigation

Keep the application navigation minimal and understandable.

## Main navigation

- Home
- Discover
- My Opportunities
- Saved
- AI Ally
- Language selector
- Sign in / Profile

## Application routes

### Public pages

- `/` — Home
- `/discover` — Government scheme discovery
- `/schemes/[slug]` — Scheme details
- `/trust` — Information sources and verification policy
- `/privacy` — Privacy policy
- `/terms` — Terms and conditions

### Authentication

- `/login`
- `/register`
- `/forgot-password`
- `/reset-password`

### Citizen application

- `/dashboard` — Personalized overview
- `/opportunities` — Eligibility results and recommendations
- `/profile` — Personal information
- `/documents` — Uploaded documents
- `/saved` — Saved schemes
- `/applications` — Application preparation and tracking
- `/assistant` — AI Ally
- `/settings` — Account and language settings

Do not add unnecessary navigation items. Related functionality should be grouped into sensible pages.

For example, application readiness should appear within the relevant scheme workspace and dashboard rather than becoming an unnecessarily complicated standalone module.

---

# 5. Visual Design and User Experience

## 5.1 Design reference

Use the screenshots supplied by the user as the primary visual reference.

The design should follow these characteristics:

- Soft light-blue background.
- White and translucent glass-style cards.
- Dark navy typography.
- Green accents for positive eligibility and primary actions.
- Rounded corners.
- Subtle shadows.
- Generous whitespace.
- Clean layouts.
- Simple icons.
- Clear labels and readable text.
- Smooth, restrained transitions.

Use glassmorphism carefully. Maintain strong text contrast and readability.

## 5.2 Design requirements

- Responsive desktop, tablet and mobile layouts.
- Consistent typography and spacing.
- Accessible controls and color contrast.
- Clear loading states.
- Useful empty states.
- Proper error messages.
- Reusable UI components.
- Consistent button and card styles.

Avoid:

- Excessive gradients.
- Overly decorative animations.
- Crowded dashboards.
- Too many navigation items.
- Excessive cards.
- Unnecessary charts.
- Fake statistics.
- Complicated interactions.

## 5.3 Landing page

The hero section should communicate the product immediately.

**Headline:**

Find the Government Benefits That Fit You.

**Supporting text:**

Discover government schemes that may suit your situation, understand your eligibility, prepare the required documents and find your next step.

Primary actions:

- Check My Opportunities
- Explore Schemes

Other sections:

1. How SchemeAlly works.
2. Popular scheme categories.
3. Personalized opportunities.
4. Eligibility and document readiness.
5. AI Ally introduction.
6. Trust and information verification.
7. Footer with useful links.

## 5.4 Reference design handling

The supplied screenshots are design references, not content or data sources.

Reproduce the visual direction while creating original, functional application components.

Do not copy demo values from the screenshots into the real application.

---

# 6. Authentication and Citizen Profile

Use Supabase Auth.

Features:

- Registration.
- Login.
- Logout.
- Password recovery.
- Session persistence.
- Protected pages.
- Profile editing.

## Profile fields

Collect only information relevant to scheme eligibility:

- Full name.
- Date of birth.
- Age derived from date of birth.
- Gender, when relevant.
- State.
- District.
- Occupation.
- Education level.
- Employment status.
- Student status.
- Annual household income.
- Household size.
- Social category, when relevant and voluntarily provided.
- Farmer status and land details, when relevant.
- Business ownership, when relevant.
- Disability status, when relevant.

### Privacy rules

- Avoid unnecessary personal information.
- Make sensitive fields optional unless a scheme requires them.
- Explain why information is requested.
- Allow profile updates.
- Validate all data on the server.
- Do not collect raw Aadhaar numbers unnecessarily.
- Never trust client-supplied user IDs for accessing private records.

---

# 7. Government Scheme Discovery

This is one of the core features.

## Initial coverage

- Tamil Nadu Government schemes.
- Central Government schemes.

## Categories

- Education.
- Agriculture.
- Financial assistance.
- Healthcare.
- Employment.
- Women and child welfare.
- Housing.
- Small business support.
- Social welfare.

## Scheme information

Each scheme should contain:

- Unique ID.
- Slug.
- English name.
- Tamil name.
- Short description.
- Detailed description.
- Benefits.
- Category.
- Department or ministry.
- Government level.
- State coverage.
- Eligibility conditions.
- Required documents.
- Application instructions.
- Official source URL.
- Official application URL.
- Last verification date.
- Active or archived status.

## Discovery functionality

Users can:

- Search by scheme name.
- Filter by category.
- Filter by government level.
- Filter by state.
- Filter by target audience.
- Open scheme details.
- Save schemes.
- Access official application links.

## Data requirements

Start with approximately 15–25 carefully verified schemes.

This is a target for the initial catalogue, not a claim that the data already exists.

Use official government sources wherever possible.

Never invent:

- Scheme names.
- Benefits.
- Eligibility conditions.
- Deadlines.
- Official links.
- Application procedures.

Every published scheme must have an official source reference and verification date.

Clearly mark information that has not been verified. Unverified information must not be used for authoritative eligibility decisions.

---

# 8. Personalized Scheme Recommendations

Recommend schemes using the citizen's profile and structured eligibility conditions.

## Recommendation categories

- Eligible.
- Potential match.
- Not eligible.
- More information required.

Each recommendation should show:

- Scheme name.
- Short description.
- Relevant benefits.
- Eligibility status.
- Reasons for the match.
- Missing information.
- Required documents.
- Next action.

Recommendations must come from actual database records and application logic.

Do not use random or hardcoded recommendations.

For new users, show a useful onboarding prompt rather than fabricated results.

---

# 9. Deterministic Eligibility Engine

Create the eligibility engine in:

`src/core/eligibility/`

This is a critical business-logic component.

**Eligibility must be calculated through structured rules, not by asking Gemini to make the decision.**

## Supported operators

- EQUALS
- NOT_EQUALS
- GREATER_THAN
- GREATER_THAN_OR_EQUAL
- LESS_THAN
- LESS_THAN_OR_EQUAL
- IN
- NOT_IN
- CONTAINS
- BETWEEN

## Example

A hypothetical scheme requires:

- Age between 18 and 35.
- State is Tamil Nadu.
- Annual income below ₹2,50,000.
- Applicant is a student.

The engine compares the user's profile against the structured conditions.

## Results

- `ELIGIBLE`
- `NOT_ELIGIBLE`
- `INSUFFICIENT_INFORMATION`
- `NEEDS_VERIFICATION`

## Evaluation output

Return:

- Overall result.
- Conditions passed.
- Conditions failed.
- Missing information.
- Explanation for each condition.
- Evaluation timestamp.
- Rule version.

The same profile and rule version must produce the same result.

Write automated tests for every supported operator and outcome.

---

# 10. Document Management and Gemini Extraction

Allow citizens to securely upload documents.

## Supported formats

- PDF
- JPG
- JPEG
- PNG
- WEBP

## Storage

Use private Supabase Storage buckets.

Never expose uploaded documents publicly by default.

## Gemini document extraction

Use Gemini's multimodal capabilities to extract relevant information.

Possible fields:

- Document type.
- Applicant name.
- Date of birth, when relevant.
- Income details, when relevant.
- Issuing authority.
- Issue date.
- Expiry date.
- Education details.
- Document legibility.

## Processing workflow

1. User uploads a document.
2. Server validates file size, type and actual content.
3. Document is stored in private Supabase Storage.
4. Gemini processes the document server-side.
5. Extracted output is validated with Zod.
6. User reviews the extracted information.
7. User can correct mistakes.
8. Approved information is saved.
9. Document can be matched against scheme requirements.

## Document statuses

- `UPLOADED`
- `PROCESSING`
- `NEEDS_REVIEW`
- `VERIFIED_AGAINST_REQUIREMENTS`
- `DOES_NOT_MEET_REQUIREMENT`
- `INVALID`
- `REJECTED`

## Important limitations

Gemini extraction does not authenticate a government certificate.

Do not claim a document is genuine or officially verified without an authorized verification integration.

Minimize extraction and retention of sensitive information.

---

# 11. Application Readiness Tracker

Eligibility and application readiness are separate calculations.

A user can be eligible but not have all required documents.

## Readiness engine

Create one authoritative implementation in:

`src/core/readiness/`

Formula:

`Readiness = (Satisfied required documents / Total required documents) × 100`

## Rules

- Only required documents count.
- Optional documents do not reduce the score.
- Missing documents are incomplete.
- Invalid documents are incomplete.
- Documents awaiting review are incomplete.
- Expired documents are incomplete where validity is required.
- A document counts only when it satisfies the relevant requirement.

If no required documents are configured, show:

**No document requirements configured.**

Never display a misleading 100% score.

All pages must use the same readiness service.

---

# 12. Citizen Dashboard

The dashboard should be simple and useful.

## Dashboard content

- Welcome message.
- Profile completion.
- Personalized opportunities.
- Eligible scheme count.
- Potential matches.
- Saved schemes.
- Missing documents.
- Application readiness.
- Recent activity.
- Recommended next steps.

All displayed values must come from real application services and database records.

Do not add decorative statistics or fake charts.

For new accounts, provide helpful empty states and a clear next action.

---

# 13. AI Ally Assistant

Create a conversational assistant called **AI Ally**, powered by Gemini.

## Capabilities

- Explain government schemes in simple language.
- Explain eligibility conditions.
- Explain why a user matches a scheme.
- Identify missing information.
- Explain required documents.
- Guide users through application procedures.
- Answer follow-up questions.
- Support Tamil and English.
- Maintain conversation history.
- Provide source references.

## Retrieval-augmented generation

Use Supabase PostgreSQL with pgvector to retrieve relevant verified scheme information and official source content.

## AI processing flow

1. Validate the user's message.
2. Identify the relevant scheme or topic.
3. Retrieve relevant verified information.
4. Retrieve authorized profile context when necessary.
5. Call the deterministic eligibility engine if eligibility is involved.
6. Send grounded context to Gemini.
7. Validate the response.
8. Return the response with source references.
9. Save conversation history.

## AI safety

- Never invent government information.
- Never independently determine eligibility.
- Never promise government approval.
- Never invent deadlines or official links.
- Never expose another user's data.
- Communicate uncertainty.
- Distinguish official information from general guidance.
- Do not represent AI extraction as document authentication.

Use safe Markdown rendering and do not render untrusted HTML.

---

# 14. Saved Schemes

Provide a simple saved schemes feature.

Users can:

- Save a scheme.
- Remove a saved scheme.
- View saved schemes.
- Open scheme details.
- Navigate to the official application portal.

Scheme comparison is not required in the initial release.

---

# 15. Application Management

Allow citizens to organize their own application preparation and progress.

Each application record may contain:

- Scheme reference.
- Document checklist.
- User-managed status.
- Application reference number entered by the user.
- Personal notes.
- Created date.
- Updated date.

## Application statuses

- Not Started.
- Preparing Documents.
- Ready to Apply.
- Submitted.
- Under Review.
- Approved.
- Rejected.
- Closed.

These statuses are user-managed records.

Do not claim real-time government application tracking or automatic submission without an authorized government integration.

Always provide the official application URL when available.

---

# 16. Scheme Data Management

A separate full Admin Dashboard is not required in the initial release.

## Initial approach

Manage scheme information directly through Supabase.

The scheme catalogue must be database-driven.

Use Supabase tables and authorized database access to:

- Add schemes.
- Edit descriptions.
- Update benefits.
- Update eligibility rules.
- Manage document requirements.
- Update application instructions.
- Add official source references.
- Update verification dates.
- Archive outdated schemes.

## Important requirements

- Do not hardcode the scheme catalogue into frontend components.
- Keep scheme data separate from UI code.
- Use database migrations and seed files.
- Restrict write access to trusted administrators.
- Citizen accounts must never be able to modify official scheme information.
- Do not grant administrator privileges through browser metadata or local storage.

A secure dedicated admin interface may be considered in a future version.

---

# 17. Tamil and English Support

Provide complete English and Tamil interfaces.

Use centralized dictionaries:

`src/i18n/dictionaries/en.json`

`src/i18n/dictionaries/ta.json`

Requirements:

- Language selector.
- Persistent language preference.
- Translated navigation.
- Translated forms.
- Translated buttons.
- Translated validation messages.
- Translated notifications and empty states.
- Translated dashboard.
- Tamil-friendly typography.
- AI Ally responds in the selected language unless requested otherwise.

Do not implement Tamil only on the landing page.

All user-facing features must support both languages.

---

# 18. Security and Privacy

Implement:

- Supabase Auth.
- Server-side session verification.
- Row Level Security.
- Private document storage.
- User-specific database access.
- Secure API routes.
- Input validation.
- File validation.
- Rate limiting for sensitive API endpoints.
- Safe error handling.

Test that one user cannot access another user's:

- Profile.
- Documents.
- Applications.
- Saved schemes.
- AI conversations.

The Supabase service-role key and Gemini API key must never be exposed in browser code.

---

# 19. Database Architecture

Use Supabase PostgreSQL.

Suggested tables:

## User data

- `profiles`
- `user_roles`

## Scheme catalogue

- `schemes`
- `scheme_categories`
- `scheme_eligibility_rules`
- `scheme_required_documents`
- `scheme_application_steps`
- `scheme_sources`

## Documents

- `documents`
- `document_extractions`

## User activity

- `saved_schemes`
- `applications`
- `application_checklist_items`

## AI

- `chat_conversations`
- `chat_messages`
- `knowledge_documents`
- `knowledge_chunks`

## Optional notifications

- `notifications`

Use UUID primary keys, foreign-key relationships, constraints, appropriate indexes and timestamps.

Create database migrations in:

`supabase/migrations/`

Use `seed.sql` for initial verified scheme data.

Do not use local JSON files as the application's persistent database.

---

# 20. Gemini API Integration

Use the official Google Gen AI SDK.

Gemini supports:

- AI Ally conversations.
- Document information extraction.
- Scheme explanations.
- Structured JSON output.
- Responses grounded in retrieved scheme information.

Requirements:

- All Gemini requests happen server-side.
- Validate AI-generated structured output.
- Handle rate limits.
- Handle API failures and timeouts.
- Avoid logging sensitive document content.
- Never trust AI output without validation.
- Select currently supported Gemini model IDs using official documentation.

Do not hardcode outdated model identifiers.

---

# 21. Environment Variables

Create `.env.example`.

```env
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=
SUPABASE_SERVICE_ROLE_KEY=

GEMINI_API_KEY=
GEMINI_MODEL=
GEMINI_EMBEDDING_MODEL=

NEXT_PUBLIC_APP_URL=
```

Optional integrations must not block the core application.

Rules:

- Keep `.env.local` out of Git.
- Commit only placeholder values in `.env.example`.
- Keep server secrets server-side.
- Never expose the Supabase service-role key.
- Never expose the Gemini API key.

Bhashini, Resend and voice integrations are outside the initial implementation scope.

---

# 22. Project Structure

```text
SchemeAlly/
│
├── public/
│
├── src/
│   ├── app/
│   │   ├── (public)/
│   │   ├── (auth)/
│   │   ├── (citizen)/
│   │   └── api/
│   │
│   ├── components/
│   │   ├── ui/
│   │   ├── layout/
│   │   ├── dashboard/
│   │   ├── schemes/
│   │   ├── eligibility/
│   │   ├── documents/
│   │   ├── applications/
│   │   └── ai/
│   │
│   ├── core/
│   │   ├── eligibility/
│   │   ├── readiness/
│   │   ├── documents/
│   │   ├── recommendations/
│   │   └── schemes/
│   │
│   ├── infrastructure/
│   │   ├── supabase/
│   │   ├── ai/
│   │   ├── storage/
│   │   └── repositories/
│   │
│   ├── services/
│   │   ├── auth/
│   │   ├── profile/
│   │   ├── scheme/
│   │   ├── document/
│   │   └── application/
│   │
│   ├── i18n/
│   │   ├── dictionaries/
│   │   └── config/
│   │
│   ├── hooks/
│   ├── types/
│   └── utils/
│
├── supabase/
│   ├── migrations/
│   └── seed.sql
│
├── tests/
│   ├── unit/
│   ├── integration/
│   └── e2e/
│
├── docs/
│
├── .env.example
├── .gitignore
├── package.json
├── tsconfig.json
├── next.config.ts
├── README.md
└── spec.md
```

Adjust the structure when technically justified, while maintaining separation between UI, business logic and infrastructure.

---

# 23. Testing

Testing is mandatory.

## Unit tests

Test:

- Eligibility operators.
- Eligibility outcomes.
- Readiness calculations.
- Document validation.
- Recommendation logic.
- Input validation.
- Sensitive data handling.

## Integration tests

Test:

- Authentication.
- Profile persistence.
- Scheme retrieval.
- Document uploads.
- Gemini integration.
- Storage permissions.
- RLS policies.

## End-to-end tests

Test these user journeys:

1. Register.
2. Log in.
3. Complete onboarding.
4. Discover schemes.
5. Search and filter.
6. View scheme details.
7. Check eligibility.
8. Upload a document.
9. Review extracted information.
10. Check application readiness.
11. Ask AI Ally a question.
12. Save a scheme.
13. Create an application record.
14. Switch between Tamil and English.
15. Verify unauthorized access is denied.

Run:

- TypeScript checks.
- ESLint.
- Vitest.
- Playwright.
- Production build.

Do not claim tests passed unless they were actually executed.

---

# 24. Future Features — Not in Initial Scope

These features should not be implemented in the initial release.

They can be reconsidered after the core application works.

## Nearby Government Service Centre Finder

Potential future functionality:

- Find nearby government service centres.
- Display service centre locations.
- Show available services.
- Provide directions and contact details where verified.

Possible sources and integrations must be researched before implementation.

Do not invent service centre locations or contact information.

## Other possible future enhancements

- Dedicated admin interface.
- Scheme comparison.
- Voice assistant.
- Email notifications.
- Additional Indian languages.
- More states and government schemes.
- Authorized government application integrations.

Keep the architecture extensible, but do not build these features now.

---

# 25. Development Phases

Build in controlled phases.

## Phase 0 — Specification and architecture review

- Read this complete specification.
- Inspect the project folder.
- Confirm architecture.
- Identify dependencies.
- Identify configuration requirements.
- Report technical concerns.
- Wait for approval.

## Phase 1 — Project foundation and design

- Initialize Next.js.
- Configure TypeScript.
- Configure Tailwind.
- Install shadcn/ui.
- Establish the design system using the supplied screenshots.
- Create the responsive layout.
- Build the landing page.
- Build navigation and reusable components.

## Phase 2 — Supabase foundation

- Configure Supabase clients.
- Configure environment variables.
- Create database migrations.
- Configure authentication.
- Implement RLS.
- Configure private storage.
- Test database security.

## Phase 3 — Authentication and profiles

- Registration.
- Login.
- Password recovery.
- Onboarding.
- Profile management.

## Phase 4 — Scheme catalogue

- Database-driven catalogue.
- Search.
- Filters.
- Scheme details.
- Official references.
- Initial verified scheme data.

## Phase 5 — Eligibility engine

- Structured rules.
- Rule evaluation.
- Explanations.
- Missing information.
- Automated tests.

## Phase 6 — Dashboard and recommendations

- Personalized dashboard.
- Scheme recommendations.
- Eligibility summaries.
- Saved schemes.
- Next steps.

## Phase 7 — Document intelligence

- Secure uploads.
- Gemini extraction.
- Structured validation.
- User review.
- Document management.

## Phase 8 — Application readiness

- Single readiness engine.
- Required document matching.
- Missing document tracking.
- Readiness display.
- Automated tests.

## Phase 9 — AI Ally

- Gemini integration.
- Conversation history.
- Retrieval pipeline.
- Scheme explanations.
- Source references.
- Tamil and English responses.

## Phase 10 — Application management

- Application records.
- Document checklist.
- User-managed status.
- Personal notes.
- Official application links.

## Phase 11 — Localization and refinement

- Complete Tamil support.
- Complete English support.
- Responsive refinements.
- Accessibility improvements.
- Loading, error and empty states.

## Phase 12 — Quality assurance and security

- Full testing.
- Security review.
- RLS review.
- Performance checks.
- Accessibility review.
- Production build.

## Phase 13 — Deployment

- Configure production Supabase.
- Apply migrations.
- Configure Vercel environment variables.
- Connect GitHub.
- Deploy to Vercel.
- Test authentication.
- Test database access.
- Test document uploads.
- Test Gemini integration.
- Verify major user journeys.

---

# 26. Definition of Done

The initial SchemeAlly release is complete only when:

1. Users can register and log in.
2. Users can manage their profiles.
3. Users can discover verified schemes.
4. Search and filters work.
5. Scheme details display official information and links.
6. Eligibility is calculated through structured rules.
7. Eligibility results have clear explanations.
8. Users can upload documents securely.
9. Gemini can extract relevant document information.
10. Users can review and correct extracted information.
11. Application readiness is calculated correctly.
12. AI Ally provides grounded responses with sources.
13. Users can save schemes.
14. Users can manage application preparation records.
15. English and Tamil interfaces work.
16. Unauthorized access is prevented.
17. Tests pass.
18. Production build succeeds.
19. The website is deployed and verified on Vercel.

A visual interface alone does not count as a completed feature.

Every feature must have working logic, appropriate database integration, error handling and tests.

---

# 27. Final Development Instructions

Treat this document as the master specification for SchemeAlly.

Build a clean, reliable and usable web application.

Prioritize the core citizen experience over unnecessary functionality.

Do not implement the Family Scheme Finder or full Admin Dashboard in the initial release.

Do not implement the nearby government service centre finder in the initial release.

Manage scheme information through Supabase initially.

Follow the development phases in order.

At the end of each phase, report:

- What was implemented.
- Files created or modified.
- Dependencies installed.
- Tests executed.
- Test results.
- Errors remaining.
- External configuration required.
- What comes next.

Do not silently skip requirements.

Do not fabricate test results or successful integrations.

Do not replace real functionality with mock data.

If a technical requirement is unclear, explain the issue and recommend a solution before making major architectural changes.

**Final objective: Build and deploy a complete, secure, responsive and genuinely usable SchemeAlly web application using Supabase and Gemini.**