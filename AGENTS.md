## Project Summary
PFM Digital is a management system for "Polícia Forças Mirins", a project aimed at young people. It handles enrollment (pre-matricula), student records (dossiê), attendance (frequência), behavior management (comportamento), and communication between the coordination and parents/guardians. It includes features for donation management, study materials, and a reporting system (denúncias).

## Tech Stack
- Framework: Next.js (App Router)
- Language: TypeScript
- Database & Auth: Supabase
- Styling: Tailwind CSS
- Icons: Lucide React
- UI Components: Radix UI (via shadcn/ui)
- Animations: Framer Motion
- Date Utilities: date-fns

## Architecture
- Protected Routes: Located in `src/app/(protected)/`, using a shared layout for sidebar and navigation.
- Role-based Access: Managed via `auth-provider` and explicit checks in pages.
- Database: Supabase tables for `students`, `pre_matriculas`, `instructors`, `turmas`, `frequencias`, `denuncias`, `avisos`, `eventos_notificacoes`, `data_update_requests`, etc.
- Print Logic: Uses hidden printable areas with CSS `@media print` overrides, optimized for A4 Portrait.
- Communication: Central Hub for "Avisos e Comunicados" allowing targeted messages (global, turma, or student) and automatic system event tracking (merits, demerits, attendance).
- Behavior Tracking: Real-time points system with automatic and manual progression/regression status predictions based on monthly performance.

## User Preferences
- Preferred PDF orientation: A4 Portrait for all documents.
- Aesthetic: Creative, distinctive premium frontend using dark themes, gradients (violet/indigo), and motion effects. Avoid generic "AI slop" style.
- Table Layout: Compact name columns in attendance lists to maximize space for data.
- Signatures: Electronic authorization via a physical term, avoiding digital signature capture.

## Project Guidelines
- Keep components as React Server Components (RSC) when possible.
- Use `use client` only for interactive elements.
- No comments in code unless explicitly requested.
- Maintain consistent styling using established CSS variables and Tailwind patterns.
- Always provide clear feedback to users via `sonner` toasts.

## Common Patterns
- **Upserting Data**: Use Supabase `upsert` with unique constraints (e.g., `aluno_id, data` for frequency) for robust data saving.
- **Print Styles**: Use a `#printable-area` div with `hidden print:block` and global CSS to handle multi-page flow.
- **Badges/Alerts**: Pulsing badges and red/amber indicators for pending tasks (denuncias, solicitacoes) to ensure administrative attention.
- **Sidebar Badges**: Implement real-time or effect-based counts for pending items in the sidebar navigation.
