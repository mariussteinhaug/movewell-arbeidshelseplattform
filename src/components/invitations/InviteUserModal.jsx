import React from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { base44 } from "@/api/base44Client";
import { createPageUrl } from "../../utils";
import { Copy, Loader2, UserPlus } from "lucide-react";

function randomToken(len = 40) {
  const arr = new Uint8Array(len);
  crypto.getRandomValues(arr);
  return Array.from(arr).map((b) => b.toString(16).padStart(2, "0")).join("");
}

export default function InviteUserModal() {
  const [open, setOpen] = React.useState(false);
  const [email, setEmail] = React.useState("");
  const [role, setRole] = React.useState("employee");
  const [departmentId, setDepartmentId] = React.useState("");
  const [inviteUrl, setInviteUrl] = React.useState("");
  const [loading, setLoading] = React.useState(false);
  const [departments, setDepartments] = React.useState([]);
  const [me, setMe] = React.useState(null);

  React.useEffect(() => {
    (async () => {
      const user = await base44.auth.me();
      setMe(user);
      const list = await base44.entities.Department.list();
      setDepartments(list || []);
      if (user?.app_role === "manager") setDepartmentId(user.department_id || "");
    })();
  }, []);

  const canChooseRole = (me?.app_role === "hr" || me?.app_role === "owner");

  const onCreate = async () => {
    setLoading(true);
    try {
      const orgId = me?.organization_id || "eramet";
      const token = randomToken(32);
      const expires = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();

      const targetRole = canChooseRole ? role : "employee";
      const deptForInvite = targetRole === "employee" || targetRole === "manager" ? (departmentId || me?.department_id || "") : "";

      await base44.entities.Invitation.create({
        organization_id: orgId,
        email: String(email).trim().toLowerCase(),
        role: targetRole,
        department_id: deptForInvite || undefined,
        token,
        expires_at: expires,
        status: "pending",
        invited_by_user_id: me?.id,
      });

      const link = window.location.origin + createPageUrl("AcceptInvite") + `?token=${token}`;
      setInviteUrl(link);
    } finally {
      setLoading(false);
    }
  };

  const canSubmit = email && (!me || me.app_role !== "manager" || departmentId);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="gap-2"><UserPlus className="h-4 w-4" /> Inviter bruker</Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Inviter bruker</DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          <div className="space-y-1">
            <Label>E-post</Label>
            <Input value={email} onChange={(e) => setEmail(e.target.value)} placeholder="navn@firma.no" />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label>Rolle</Label>
              <Select value={canChooseRole ? role : "employee"} onValueChange={setRole} disabled={!canChooseRole}>
                <SelectTrigger><SelectValue placeholder="Velg rolle" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="employee">Employee</SelectItem>
                  <SelectItem value="manager">Manager</SelectItem>
                  <SelectItem value="hr">HR</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label>Avdeling (for manager/employee)</Label>
              <Select value={departmentId} onValueChange={setDepartmentId} disabled={(role === "hr") && canChooseRole}>
                <SelectTrigger><SelectValue placeholder="Velg avdeling" /></SelectTrigger>
                <SelectContent>
                  {departments.map((d) => (
                    <SelectItem key={d.id} value={d.id}>{d.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="flex justify-end">
            <Button onClick={onCreate} disabled={!canSubmit || loading} className="bg-emerald-600 hover:bg-emerald-700">
              {loading ? (<><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Oppretter…</>) : "Opprett invitasjon"}
            </Button>
          </div>

          {inviteUrl && (
            <div className="mt-2 p-3 rounded-xl border bg-slate-50 text-sm flex items-center gap-2">
              <Input readOnly value={inviteUrl} className="text-xs" />
              <Button type="button" variant="outline" onClick={() => navigator.clipboard.writeText(inviteUrl)} className="gap-2">
                <Copy className="h-4 w-4" /> Kopier
              </Button>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}