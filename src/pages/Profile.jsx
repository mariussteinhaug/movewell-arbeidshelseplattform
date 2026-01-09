import React, { useEffect, useMemo, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

import {
  User,
  Mail,
  Briefcase,
  Building2,
  Upload,
  Loader2,
  Check,
  Phone,
  Shield,
  Pencil,
  X,
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { useAuth, normalizeRole } from "@/components/access/guard";

/* ---------------------------
   Role mapping (MoveWell)
--------------------------- */
const ROLE_LABELS = {
  employee: { label: "Ansatt", chip: "bg-slate-100 text-slate-700" },
  manager: { label: "Leder", chip: "bg-blue-100 text-blue-700" },
  hr: { label: "HR", chip: "bg-purple-100 text-purple-700" },
};

function initialsFromName(name) {
  if (!name) return "?";
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((n) => n[0])
    .join("")
    .toUpperCase();
}

export default function Profile() {
  const { user: currentUser, role, isLoading } = useAuth();
  const queryClient = useQueryClient();

  const [isEditing, setIsEditing] = useState(false);
  const [uploading, setUploading] = useState(false);

  const [formData, setFormData] = useState({
    full_name: "",
    phone: "",
    position: "",
    profile_image: "",
  });
  const roleMeta = ROLE_LABELS[role] || ROLE_LABELS.employee;
  
  // Re-fetch currentUser for mutations
  const { data: userForMutation } = useQuery({
    queryKey: ["current-user"],
    queryFn: () => base44.auth.me(),
    enabled: !!currentUser,
  });

  useEffect(() => {
    if (!currentUser) return;
    setFormData({
      full_name: currentUser.full_name || "",
      phone: currentUser.phone || "",
      position: currentUser.position || "",
      profile_image: currentUser.profile_image || "",
    });
  }, [currentUser]);

  const updateProfile = useMutation({
    mutationFn: (data) => base44.auth.updateMe(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["current-user"] });
      setIsEditing(false);
      toast.success("Profil oppdatert");
    },
    onError: (error) => {
      toast.error("Kunne ikke oppdatere profil");
      console.error(error);
    },
  });

  const handleImageUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    try {
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      setFormData((p) => ({ ...p, profile_image: file_url }));
      toast.success("Bilde lastet opp");
    } catch (error) {
      toast.error("Kunne ikke laste opp bilde");
      console.error(error);
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    updateProfile.mutate(formData);
  };

  const handleCancel = () => {
    if (!currentUser) return;
    setFormData({
      full_name: currentUser.full_name || "",
      phone: currentUser.phone || "",
      position: currentUser.position || "",
      profile_image: currentUser.profile_image || "",
    });
    setIsEditing(false);
  };

  const hasChanges = useMemo(() => {
    if (!currentUser) return false;
    return (
      (formData.full_name || "") !== (currentUser.full_name || "") ||
      (formData.phone || "") !== (currentUser.phone || "") ||
      (formData.position || "") !== (currentUser.position || "") ||
      (formData.profile_image || "") !== (currentUser.profile_image || "")
    );
  }, [currentUser, formData]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-emerald-600" />
      </div>
    );
  }

  const initials = initialsFromName(currentUser?.full_name);

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-900">Min profil</h1>
          <p className="text-slate-500 mt-1">Administrer din personlige informasjon</p>
        </div>

        {!isEditing ? (
          <Button variant="outline" onClick={() => setIsEditing(true)} className="rounded-xl">
            <Pencil className="h-4 w-4 mr-2" />
            Rediger
          </Button>
        ) : (
          <Button variant="outline" onClick={handleCancel} className="rounded-xl">
            <X className="h-4 w-4 mr-2" />
            Avbryt
          </Button>
        )}
      </div>

      {/* Profile hero */}
      <Card className="rounded-3xl border-slate-200">
        <CardContent className="pt-6">
          <div className="flex flex-col sm:flex-row items-center gap-6">
            <div className="relative">
              <Avatar className="h-24 w-24 border-4 border-white shadow-sm">
                <AvatarImage src={formData.profile_image} alt={currentUser?.full_name} />
                <AvatarFallback className="text-2xl bg-emerald-100 text-emerald-700">
                  {initials}
                </AvatarFallback>
              </Avatar>

              {/* Upload chip */}
              {isEditing && (
                <label
                  className={cn(
                    "absolute -bottom-2 -right-2 rounded-full border border-slate-200 bg-white shadow-sm",
                    "px-3 py-2 flex items-center gap-2 cursor-pointer hover:bg-slate-50 transition"
                  )}
                  title="Last opp profilbilde"
                >
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleImageUpload}
                    className="hidden"
                    disabled={uploading}
                  />
                  {uploading ? (
                    <Loader2 className="h-4 w-4 text-slate-600 animate-spin" />
                  ) : (
                    <Upload className="h-4 w-4 text-slate-600" />
                  )}
                  <span className="text-xs font-medium text-slate-700">
                    {uploading ? "Laster..." : "Bilde"}
                  </span>
                </label>
              )}
            </div>

            <div className="flex-1 text-center sm:text-left">
              <h2 className="text-2xl font-bold text-slate-900">
                {currentUser?.full_name || "Ukjent bruker"}
              </h2>
              <p className="text-slate-500">{currentUser?.position || "Ingen stilling oppgitt"}</p>

              <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 mt-3">
                <span className={cn("px-3 py-1 rounded-full text-xs font-semibold", roleMeta.chip)}>
                  {roleMeta.label}
                </span>

                {currentUser?.department && (
                  <span className="px-3 py-1 rounded-full text-xs font-medium bg-slate-100 text-slate-700">
                    {currentUser.department}
                  </span>
                )}

                <span className="px-3 py-1 rounded-full text-xs font-medium bg-slate-100 text-slate-700">
                  {currentUser?.email}
                </span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Profile information */}
      <Card className="rounded-3xl border-slate-200">
        <CardHeader>
          <CardTitle>Profilinformasjon</CardTitle>
          <CardDescription>Oppdater din personlige informasjon</CardDescription>
        </CardHeader>

        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Full name */}
              <div className="space-y-2">
                <Label htmlFor="full_name" className="flex items-center gap-2">
                  <User className="h-4 w-4 text-slate-400" />
                  Fullt navn
                </Label>
                <Input
                  id="full_name"
                  value={formData.full_name}
                  onChange={(e) => setFormData((p) => ({ ...p, full_name: e.target.value }))}
                  disabled={!isEditing}
                  className={cn("rounded-xl", !isEditing && "bg-slate-50")}
                />
              </div>

              {/* Email locked */}
              <div className="space-y-2">
                <Label htmlFor="email" className="flex items-center gap-2">
                  <Mail className="h-4 w-4 text-slate-400" />
                  E-post
                </Label>
                <Input id="email" value={currentUser?.email || ""} disabled className="bg-slate-50 rounded-xl" />
                <p className="text-xs text-slate-500">E-post kan ikke endres</p>
              </div>

              {/* Phone */}
              <div className="space-y-2">
                <Label htmlFor="phone" className="flex items-center gap-2">
                  <Phone className="h-4 w-4 text-slate-400" />
                  Telefon
                </Label>
                <Input
                  id="phone"
                  value={formData.phone}
                  onChange={(e) => setFormData((p) => ({ ...p, phone: e.target.value }))}
                  disabled={!isEditing}
                  placeholder="Telefonnummer"
                  className={cn("rounded-xl", !isEditing && "bg-slate-50")}
                />
              </div>

              {/* Position */}
              <div className="space-y-2">
                <Label htmlFor="position" className="flex items-center gap-2">
                  <Briefcase className="h-4 w-4 text-slate-400" />
                  Stilling
                </Label>
                <Input
                  id="position"
                  value={formData.position}
                  onChange={(e) => setFormData((p) => ({ ...p, position: e.target.value }))}
                  disabled={!isEditing}
                  placeholder="Din stilling"
                  className={cn("rounded-xl", !isEditing && "bg-slate-50")}
                />
              </div>

              {/* Department locked */}
              <div className="space-y-2">
                <Label htmlFor="department" className="flex items-center gap-2">
                  <Building2 className="h-4 w-4 text-slate-400" />
                  Avdeling
                </Label>
                <Input
                  id="department"
                  value={currentUser?.department || "Ikke tilordnet"}
                  disabled
                  className="bg-slate-50 rounded-xl"
                />
                <p className="text-xs text-slate-500">Avdeling administreres av HR</p>
              </div>

              {/* Role locked */}
              <div className="space-y-2">
                <Label htmlFor="role" className="flex items-center gap-2">
                  <Shield className="h-4 w-4 text-slate-400" />
                  Rolle
                </Label>
                <Input id="role" value={roleMeta.label} disabled className="bg-slate-50 rounded-xl" />
                <p className="text-xs text-slate-500">Rolle administreres av HR</p>
              </div>
            </div>

            {/* Actions (Apple-ish) */}
            {isEditing && (
              <div className="sticky bottom-0 bg-white/80 backdrop-blur-md pt-4 border-t border-slate-200 rounded-b-3xl">
                <div className="flex gap-3">
                  <Button type="button" variant="outline" onClick={handleCancel} className="flex-1 rounded-xl">
                    Avbryt
                  </Button>

                  <Button
                    type="submit"
                    disabled={updateProfile.isPending || !hasChanges}
                    className="flex-1 rounded-xl bg-emerald-600 hover:bg-emerald-700"
                  >
                    {updateProfile.isPending ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Lagrer...
                      </>
                    ) : (
                      <>
                        <Check className="h-4 w-4 mr-2" />
                        Lagre
                      </>
                    )}
                  </Button>
                </div>

                {!hasChanges && (
                  <p className="text-xs text-slate-500 mt-2 text-center">
                    Ingen endringer å lagre
                  </p>
                )}
              </div>
            )}
          </form>
        </CardContent>
      </Card>

      {/* Security */}
      <Card className="rounded-3xl border-slate-200">
        <CardHeader>
          <CardTitle>Passord og sikkerhet</CardTitle>
          <CardDescription>Administrer din kontos sikkerhet</CardDescription>
        </CardHeader>

        <CardContent>
          <div className="space-y-4">
            <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl">
              <p className="text-sm text-slate-700">
                <strong>Bytte passord:</strong> Logg ut og bruk <em>"Glemt passord"</em> på innloggingssiden.
              </p>
            </div>

            <div className="flex items-center justify-between py-2">
              <div>
                <p className="font-medium text-slate-900">E-postadresse</p>
                <p className="text-sm text-slate-500">{currentUser?.email}</p>
              </div>
              <Check className="h-5 w-5 text-emerald-600" />
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}