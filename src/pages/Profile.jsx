import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { User, Mail, Briefcase, Building2, Upload, Loader2, Check } from 'lucide-react';
import { toast } from 'sonner';

export default function Profile() {
  const queryClient = useQueryClient();
  const [isEditing, setIsEditing] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [formData, setFormData] = useState({
    full_name: '',
    phone: '',
    position: '',
    profile_image: ''
  });

  const { data: currentUser, isLoading } = useQuery({
    queryKey: ['current-user'],
    queryFn: () => base44.auth.me()
  });

  React.useEffect(() => {
    if (currentUser) {
      setFormData({
        full_name: currentUser.full_name || '',
        phone: currentUser.phone || '',
        position: currentUser.position || '',
        profile_image: currentUser.profile_image || ''
      });
    }
  }, [currentUser]);

  const updateProfile = useMutation({
    mutationFn: (data) => base44.auth.updateMe(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['current-user'] });
      setIsEditing(false);
      toast.success('Profil oppdatert');
    },
    onError: (error) => {
      toast.error('Kunne ikke oppdatere profil');
      console.error(error);
    }
  });

  const handleImageUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    try {
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      setFormData({ ...formData, profile_image: file_url });
      toast.success('Bilde lastet opp');
    } catch (error) {
      toast.error('Kunne ikke laste opp bilde');
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
    setFormData({
      full_name: currentUser.full_name || '',
      phone: currentUser.phone || '',
      position: currentUser.position || '',
      profile_image: currentUser.profile_image || ''
    });
    setIsEditing(false);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-emerald-600" />
      </div>
    );
  }

  const initials = currentUser?.full_name
    ?.split(' ')
    .map(n => n[0])
    .join('')
    .toUpperCase() || '?';

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold text-slate-900">Min profil</h1>
        <p className="text-slate-500 mt-1">Administrer din personlige informasjon</p>
      </div>

      {/* Profile Header Card */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col sm:flex-row items-center gap-6">
            <div className="relative">
              <Avatar className="h-24 w-24 border-4 border-white shadow-lg">
                <AvatarImage src={formData.profile_image} alt={currentUser?.full_name} />
                <AvatarFallback className="text-2xl bg-emerald-100 text-emerald-700">
                  {initials}
                </AvatarFallback>
              </Avatar>
              {isEditing && (
                <label className="absolute bottom-0 right-0 h-8 w-8 rounded-full bg-emerald-600 hover:bg-emerald-700 flex items-center justify-center cursor-pointer shadow-lg">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleImageUpload}
                    className="hidden"
                    disabled={uploading}
                  />
                  {uploading ? (
                    <Loader2 className="h-4 w-4 text-white animate-spin" />
                  ) : (
                    <Upload className="h-4 w-4 text-white" />
                  )}
                </label>
              )}
            </div>
            <div className="flex-1 text-center sm:text-left">
              <h2 className="text-2xl font-bold text-slate-900">{currentUser?.full_name}</h2>
              <p className="text-slate-500">{currentUser?.position || 'Ingen stilling oppgitt'}</p>
              <div className="flex items-center justify-center sm:justify-start gap-2 mt-2">
                <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                  currentUser?.role === 'admin' 
                    ? 'bg-purple-100 text-purple-700' 
                    : 'bg-blue-100 text-blue-700'
                }`}>
                  {currentUser?.role === 'admin' ? 'Admin' : 'Ansatt'}
                </span>
                {currentUser?.department && (
                  <span className="px-3 py-1 rounded-full text-xs font-medium bg-slate-100 text-slate-700">
                    {currentUser.department}
                  </span>
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Profile Information */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Profilinformasjon</CardTitle>
            {!isEditing ? (
              <Button onClick={() => setIsEditing(true)} variant="outline">
                Rediger profil
              </Button>
            ) : null}
          </div>
          <CardDescription>
            Oppdater din personlige informasjon
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="full_name" className="flex items-center gap-2">
                  <User className="h-4 w-4 text-slate-400" />
                  Fullt navn
                </Label>
                <Input
                  id="full_name"
                  value={formData.full_name}
                  onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                  disabled={!isEditing}
                  className={!isEditing ? 'bg-slate-50' : ''}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="email" className="flex items-center gap-2">
                  <Mail className="h-4 w-4 text-slate-400" />
                  E-post
                </Label>
                <Input
                  id="email"
                  value={currentUser?.email}
                  disabled
                  className="bg-slate-50"
                />
                <p className="text-xs text-slate-500">E-post kan ikke endres</p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="phone" className="flex items-center gap-2">
                  <User className="h-4 w-4 text-slate-400" />
                  Telefon
                </Label>
                <Input
                  id="phone"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  disabled={!isEditing}
                  placeholder="Telefonnummer"
                  className={!isEditing ? 'bg-slate-50' : ''}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="position" className="flex items-center gap-2">
                  <Briefcase className="h-4 w-4 text-slate-400" />
                  Stilling
                </Label>
                <Input
                  id="position"
                  value={formData.position}
                  onChange={(e) => setFormData({ ...formData, position: e.target.value })}
                  disabled={!isEditing}
                  placeholder="Din stilling"
                  className={!isEditing ? 'bg-slate-50' : ''}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="department" className="flex items-center gap-2">
                  <Building2 className="h-4 w-4 text-slate-400" />
                  Avdeling
                </Label>
                <Input
                  id="department"
                  value={currentUser?.department || 'Ikke tilordnet'}
                  disabled
                  className="bg-slate-50"
                />
                <p className="text-xs text-slate-500">Avdeling administreres av HR</p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="role" className="flex items-center gap-2">
                  <User className="h-4 w-4 text-slate-400" />
                  Rolle
                </Label>
                <Input
                  id="role"
                  value={currentUser?.role === 'admin' ? 'Administrator' : 'Ansatt'}
                  disabled
                  className="bg-slate-50"
                />
                <p className="text-xs text-slate-500">Rolle administreres av HR</p>
              </div>
            </div>

            {isEditing && (
              <div className="flex gap-3 pt-4 border-t">
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleCancel}
                  className="flex-1"
                >
                  Avbryt
                </Button>
                <Button
                  type="submit"
                  disabled={updateProfile.isPending}
                  className="flex-1 bg-emerald-600 hover:bg-emerald-700"
                >
                  {updateProfile.isPending ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Lagrer...
                    </>
                  ) : (
                    <>
                      <Check className="h-4 w-4 mr-2" />
                      Lagre endringer
                    </>
                  )}
                </Button>
              </div>
            )}
          </form>
        </CardContent>
      </Card>

      {/* Password Info Card */}
      <Card>
        <CardHeader>
          <CardTitle>Passord og sikkerhet</CardTitle>
          <CardDescription>
            Administrer din kontos sikkerhet
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <p className="text-sm text-blue-900">
                <strong>Bytte passord:</strong> For å endre passord, vennligst logg ut og bruk "Glemt passord"-funksjonen på innloggingssiden.
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