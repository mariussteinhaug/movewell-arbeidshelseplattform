import React from "react";
import { base44 } from "@/api/base44Client";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Loader2, CheckCircle2, AlertTriangle } from "lucide-react";
import { createPageUrl } from "../utils";

export default function AcceptInvite() {
  const [loading, setLoading] = React.useState(true);
  const [inv, setInv] = React.useState(null);
  const [error, setError] = React.useState("");
  const [accepted, setAccepted] = React.useState(false);

  const token = React.useMemo(() => new URLSearchParams(window.location.search).get("token"), []);

  React.useEffect(() => {
    const run = async () => {
      try {
        if (!token) {
          setError("Ugyldig lenke (mangler token)");
          setLoading(false);
          return;
        }
        const list = await base44.entities.Invitation.filter({ token });
        const invitation = Array.isArray(list) ? list[0] : list;
        if (!invitation) {
          setError("Fant ikke invitasjon");
          setLoading(false);
          return;
        }
        const exp = invitation.expires_at ? new Date(invitation.expires_at).getTime() : 0;
        if (invitation.status !== "pending" || (exp && Date.now() > exp)) {
          setError("Invitasjonen er ikke gyldig");
          setLoading(false);
          return;
        }
        setInv(invitation);
      } catch (e) {
        setError("Kunne ikke hente invitasjon");
      } finally {
        setLoading(false);
      }
    };
    run();
  }, [token]);

  const handleLogin = async () => {
    const next = createPageUrl("AcceptInvite") + `?token=${encodeURIComponent(token)}`;
    await base44.auth.redirectToLogin(next);
  };

  const handleAccept = async () => {
    if (!inv) return;
    setLoading(true);
    try {
      const me = await base44.auth.me();
      if (!me) {
        await handleLogin();
        return;
      }
      const appRole = inv.role; // hr | manager | employee
      const profile = {
        app_role: appRole,
        organization_id: inv.organization_id || "eramet",
        status: "active",
      };
      if ((appRole === "manager" || appRole === "employee") && inv.department_id) {
        profile.department_id = inv.department_id;
      }
      await base44.auth.updateMe(profile);

      await base44.entities.Invitation.update(inv.id, {
        status: "accepted",
        accepted_by_user_id: me.id,
        accepted_at: new Date().toISOString(),
      });

      setAccepted(true);
      setTimeout(() => {
        const dest = appRole === "employee" ? "Assessment" : "Dashboard";
        window.location.href = createPageUrl(dest);
      }, 1200);
    } catch (e) {
      setError("Kunne ikke akseptere invitasjon");
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-emerald-600" />
      </div>
    );
  }

  return (
    <div className="max-w-lg mx-auto">
      <Card>
        <CardHeader>
          <CardTitle>Aksepter invitasjon</CardTitle>
          <CardDescription>Fullfør for å få tilgang til organisasjonen</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {error && (
            <div className="text-sm text-red-600 flex items-center gap-2">
              <AlertTriangle className="h-4 w-4" /> {error}
            </div>
          )}

          {inv && !accepted && (
            <div className="space-y-2 text-sm text-slate-700">
              <p><span className="font-medium">E-post:</span> {inv.email}</p>
              <p><span className="font-medium">Rolle:</span> {inv.role}</p>
              {inv.department_id && <p><span className="font-medium">Avdeling:</span> {inv.department_id}</p>}
            </div>
          )}

          {!accepted ? (
            <div className="flex gap-2">
              <Button onClick={handleLogin} variant="outline">Logg inn</Button>
              <Button onClick={handleAccept} className="bg-emerald-600 hover:bg-emerald-700">Aksepter</Button>
            </div>
          ) : (
            <div className="flex items-center gap-2 text-emerald-700 text-sm">
              <CheckCircle2 className="h-4 w-4" /> Akseptert! Sender deg videre…
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}