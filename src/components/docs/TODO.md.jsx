# Project To‑Do (Now → Next)

Status: 2026-01-07

## P0 — Do Now (Blockers / Core)
- [ ] Create HealthAssessment snapshot on assessment submit; ensure organization_id/department_id are set; Dashboard uses snapshots and gracefully falls back to sessions when needed.
- [ ] Centralize role/access: implement useAppRole() + useAccessScope() and replace mixed usage of user.role vs user.app_role; treat admin as hr unless overridden; apply in Layout, Dashboard, Accommodation, Departments, Messages.
- [ ] Enforce org/department scoping at query level (use base44.entities.X.filter with organization_id and department_id); remove hardcoded "eramet"; avoid in-memory filtering.
- [ ] Fix Dashboard visibility for ADMIN/HR parity and ensure data windows use a single date field consistently (created_at).
- [ ] AcceptInvite hardening: require logged-in email === invitation.email; block mismatch; keep expiry/status checks; rotate/disable token on accept.
- [ ] Update simulateAssessmentFlow to include submitted_at (required by AssessmentSession schema).

## P1 — Soon (Consistency & Safety)
- [ ] Extend Message entity with fields used by UI: status ("ulest" | "besvart") and replies[]; align MyMessages to schema.
- [ ] Normalize department fields across models/pages: prefer department_id + department_name (deprecate ambiguous department).
- [ ] Add a small route guard helper/HOC for hard redirects and reuse across pages.
- [ ] Invitations UX: list scoped to organization, add revoke/resend actions, show expiry countdown.

## P2 — Polish (UX, Ops)
- [ ] Improve empty/error states + toasts for key flows (Assessment submit, Invite accept, Case actions).
- [ ] Replace list() + client-side filters with filter() + sort + limit everywhere for performance.
- [ ] Add scheduled task to purge/expire old invitations.
- [ ] Introduce tiny constants/i18n mapping for roles/statuses to avoid label drift (NO/EN).

## Notes / Dependencies
- Message schema update (P1) should precede MyMessages adjustments.
- After access hooks exist, refactor ad-hoc checks incrementally page-by-page to reduce risk.