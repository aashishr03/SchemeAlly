# SchemeAlly

**Your Ally for Government Benefits** — Full-stack bilingual (English & Tamil) welfare scheme discovery, deterministic eligibility evaluation, document readiness, and application preparation platform for Indian citizens (initial coverage: Tamil Nadu Government and Central Government schemes).

## Technology Stack

- **Framework**: Next.js App Router, React, TypeScript
- **Styling & UI**: Tailwind CSS, shadcn/ui, Lucide React
- **Database, Auth & Storage**: Supabase PostgreSQL (`pgvector`), Supabase Auth, Supabase Storage
- **AI**: Google Gemini API (`@google/genai`)
- **Testing**: Vitest (Unit & Integration), Playwright (End-to-End)
- **Deployment**: Vercel

## Scripts

- `npm run dev` — Start the Next.js development server
- `npm run build` — Build the production application
- `npm run start` — Start the production server
- `npm run lint` — Run ESLint checks
- `npm run typecheck` — Run TypeScript compiler checks (`tsc --noEmit`)
- `npm test` — Run Vitest unit & integration suites
