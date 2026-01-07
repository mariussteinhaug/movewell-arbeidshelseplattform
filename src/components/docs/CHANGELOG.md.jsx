# Changelog

Date: 2026-01-07

## Added
- entities/Invitation.json — Invitation model (token, expires_at, status, role, department_id, org scoping).
- pages/AcceptInvite.js — Accept invitation via token; validates expiry, updates user profile (app_role, organization_id, department_id, status) and marks invitation accepted.
- components/invitations/InviteUserModal.jsx — Create invitation (token generation, org/role/department), copy link.
- pages/Invite.js — List pending invitations and entry point to the modal.

## Changed
- entities/AssessmentSession.json — Added submitted_at (required) to session schema.
- pages/Assessment — On submit, now sets submitted_at (and aligns timestamps via nowIso).
- layout — Added “Invitasjoner” navigation item (visible to HR/Manager) and imported UserPlus icon.
- pages/Accommodation — Enforced org/department filtering and added route-guard style redirect for non HR/Owner/Manager.

## Notes
- Dashboard currently reads HealthAssessment for primary stats; since Assessment submit only writes AssessmentSession, main stats may appear empty until snapshot creation is implemented (see TODO P0).
- Role usage is being unified (admin→hr) but some pages still read user.app_role vs user.role; planned centralization in TODO P0.