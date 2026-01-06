import React from "react";
import InviteUserModal from "../components/invitations/InviteUserModal";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export default function Invite() {
  const { data: me } = useQuery({ queryKey: ['current-user'], queryFn: () => base44.auth.me() });
  const { data: invites = [] } = useQuery({
    queryKey: ['invites'],
    queryFn: () => base44.entities.Invitation.filter({ status: 'pending' })
  });

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
              <Badge className="bg-amber-100 text-amber-800">{i.status}</Badge>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}