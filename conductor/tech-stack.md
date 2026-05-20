# Tech Stack - Sarkardada.com

## Core Technologies
- **Frontend Framework**: Next.js 14+ (App Router, JavaScript)
- **Styling**: Vanilla CSS (Tailwind variables supported, but utilizing native dark glassmorphism styling)
- **Database**: PostgreSQL (Supabase backend wrapper with mock database fallback layer for local development/sandboxing)

## Primary Dependencies
- `react` / `react-dom`: v18
- `next`: v14
- `@supabase/supabase-js`: v2 (PostgreSQL interaction client)
- `lucide-react`: v0.300+ (Modern iconography)
- `recharts`: v2 (Admin anomaly velocity visualization charts)

## Directory Structure
- `/app`: App routing directory
- `/components`: Reusable frontend components
- `/lib`: Supabase data layers and LocalStorage fallbacks
- `/conductor`: Configuration context files
