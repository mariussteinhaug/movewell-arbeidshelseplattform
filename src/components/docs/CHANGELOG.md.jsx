# Changelog — 2026-01-07

## This batch
- Dashboard: ADMIN now sees data same as HR; queries now scoped by organization_id.
- AcceptInvite: added email verification against Invitation.email.
- simulateAssessmentFlow: writes submitted_at on AssessmentSession.
- Tracking docs added: components/docs/TODO.md and components/docs/CHANGELOG.md.

## Note
- Assessment already creates HealthAssessment snapshot; Dashboard should now populate after submissions.