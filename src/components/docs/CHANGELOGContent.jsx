
const CHANGELOG = `# Changelog — 2026-01-07

## This batch
- Dashboard: ADMIN now sees data same as HR; queries scoped by organization_id.
- AcceptInvite: added email verification against Invitation.email.
- simulateAssessmentFlow: writes submitted_at on AssessmentSession.
- Centralized role/access helper; Layout and Accommodation refactored to use it.
- Message schema: added status/replies; aligned MyMessages.
- Route guard hook added; applied to Accommodation and Invite; unified redirects.
- Invitations: revoke/resend and org-scoped listing.
- Tracking docs added.
`;

export default CHANGELOG;
