import React from "react";
import { useRequireRoles, ROLE } from "../components/access/guard";
import InviteUserModal from "../components/invitations/InviteUserModal";
import { base44 } from "@/api/base44Client";
import { createPageUrl } from "../utils";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Loader2 } from "lucide-react";

export default function Invite() {
  const { user: me, role, isLoading: authLoading, scope } = useRequireRoles([ROLE.MANAGER, ROLE.HR], 'Assessment');
  const queryClient = useQueryClient();
  
  const { data: invites = [] } = useQuery({
    queryKey: ['invites', me?.organization_id],
    enabled: !authLoading && !!me?.organization_id,
    queryFn: () => base44.entities.Invitation.filter({ status: 'pending', organization_id: me.organization_id })
  });

  const revokeInvite = useMutation({
    mutationFn: (id) => base44.entities.Invitation.update(id, { status: 'revoked' }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['invites'] })
  });

  const resendInvite = useMutation({
    mutationFn: async (inv) => {
      const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();
      await base44.entities.Invitation.update(inv.id, { expires_at: expiresAt, status: 'pending' });
      const link = window.location.origin + createPageUrl('AcceptInvite') + `?token=${encodeURIComponent(inv.token)}`;
      await base44.integrations.Core.SendEmail({
        to: inv.email,
        subject: 'Ny invitasjon til MoveWell',
        body: `Hei! Du er invitert til MoveWell. Klikk for å akseptere: ${link}`
      });
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['invites'] })
  });

  if (authLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-emerald-600" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-900">Invitasjoner</h1>
          <p className="text-slate-500">Inviter nye brukere til organisasjonen</p>
        </div>
        <InviteUserModal />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Ventende invitasjoner</CardTitle>
          <CardDescription>{invites.length} åpne</CardDescription>
        </CardHeader>
        <CardContent className="space-y-2">
          {invites.length === 0 ? (
            <p className="text-slate-600">Ingen åpne invitasjoner.</p>
          ) : invites.map((i) => (
            <div key={i.id} className="p-3 rounded-lg border bg-white flex items-center justify-between">
              <div className="text-sm">
                <p className="font-medium text-slate-900">{i.email}</p>
                <p className="text-slate-600">Rolle: {i.role}{i.department_id ? ` • Avd: ${i.department_id}` : ''}</p>
              </div>
              <div className="flex items-center gap-2">
                <Badge className="bg-amber-100 text-amber-800">{i.status}</Badge>
                <Button variant="outline" size="sm" onClick={() => resendInvite.mutate(i)}>
                  Send på nytt
                </Button>
                <Button variant="outline" size="sm" onClick={() => revokeInvite.mutate(i.id)}>
                  Opphev
                </Button>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}