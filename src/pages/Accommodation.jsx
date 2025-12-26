import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ClipboardList, Plus, Edit, CheckCircle2, Clock, PlayCircle, AlertCircle, Loader2 } from 'lucide-react';
import { format } from 'date-fns';
import { nb } from 'date-fns/locale';

export default function Accommodation() {
  const queryClient = useQueryClient();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [formData, setFormData] = useState({
    employee_email: '',
    employee_name: '',
    department: '',
    accommodation_type: '',
    description: '',
    status: 'planlagt',
    responsible_person: '',
    responsible_email: '',
    risk_level: 'moderate',
    notes: ''
  });

  const { data: currentUser } = useQuery({
    queryKey: ['current-user'],
    queryFn: () => base44.auth.me()
  });

  const { data: accommodations = [], isLoading } = useQuery({
    queryKey: ['accommodations'],
    queryFn: () => base44.entities.Accommodation.list('-last_updated', 100)
  });

  const { data: users = [] } = useQuery({
    queryKey: ['users'],
    queryFn: () => base44.entities.User.list()
  });

  const { data: departments = [] } = useQuery({
    queryKey: ['departments'],
    queryFn: () => base44.entities.Department.list()
  });

  const { data: assessments = [] } = useQuery({
    queryKey: ['assessment-sessions'],
    queryFn: () => base44.entities.AssessmentSession.list('-created_date', 100)
  });

  const createAccommodation = useMutation({
    mutationFn: (data) => base44.entities.Accommodation.create({
      ...data,
      last_updated: new Date().toISOString()
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['accommodations'] });
      setIsDialogOpen(false);
      resetForm();
    }
  });

  const updateAccommodation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.Accommodation.update(id, {
      ...data,
      last_updated: new Date().toISOString()
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['accommodations'] });
      setIsDialogOpen(false);
      resetForm();
    }
  });

  const resetForm = () => {
    setEditingItem(null);
    setFormData({
      employee_email: '',
      employee_name: '',
      department: '',
      accommodation_type: '',
      description: '',
      status: 'planlagt',
      responsible_person: '',
      responsible_email: '',
      risk_level: 'moderate',
      notes: ''
    });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (editingItem) {
      updateAccommodation.mutate({ id: editingItem.id, data: formData });
    } else {
      createAccommodation.mutate(formData);
    }
  };

  const handleEdit = (item) => {
    setEditingItem(item);
    setFormData({
      employee_email: item.employee_email,
      employee_name: item.employee_name,
      department: item.department,
      accommodation_type: item.accommodation_type,
      description: item.description || '',
      status: item.status,
      responsible_person: item.responsible_person || '',
      responsible_email: item.responsible_email || '',
      risk_level: item.risk_level || 'moderate',
      notes: item.notes || ''
    });
    setIsDialogOpen(true);
  };

  const handleQuickStatusUpdate = (item, newStatus) => {
    updateAccommodation.mutate({
      id: item.id,
      data: { ...item, status: newStatus }
    });
  };

  const statusConfig = {
    planlagt: { icon: Clock, color: 'bg-slate-100 text-slate-700', label: 'Planlagt' },
    pågår: { icon: PlayCircle, color: 'bg-blue-100 text-blue-700', label: 'Pågår' },
    fullført: { icon: CheckCircle2, color: 'bg-emerald-100 text-emerald-700', label: 'Fullført' }
  };

  const riskColors = {
    low: 'bg-emerald-50 border-emerald-200',
    moderate: 'bg-amber-50 border-amber-200',
    high: 'bg-red-50 border-red-200'
  };

  const filteredByStatus = (status) => accommodations.filter(a => a.status === status);

  // Ansatte som trenger tilrettelegging (fra kartlegginger med høy/moderat risiko)
  const employeesNeedingAccommodation = assessments
    .filter(a => a.completed && (a.risk_level === 'high' || a.risk_level === 'moderate'))
    .filter(a => !accommodations.find(acc => acc.employee_email === a.created_by))
    .map(a => {
      const user = users.find(u => u.email === a.created_by);
      return { assessment: a, user };
    })
    .filter(item => item.user);

  const handleCreateFromAssessment = (assessment, user) => {
    setFormData({
      employee_email: user.email,
      employee_name: user.full_name,
      department: assessment.department,
      accommodation_type: '',
      description: `Basert på kartlegging med risikonivå: ${assessment.risk_level}. Risikosignaler: ${assessment.risk_signals?.join(', ') || 'Ingen spesifikke'}`,
      status: 'planlagt',
      responsible_person: '',
      responsible_email: '',
      risk_level: assessment.risk_level,
      notes: ''
    });
    setIsDialogOpen(true);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-emerald-600" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-900">Tilrettelegging</h1>
          <p className="text-slate-500 mt-1">Oversikt over tilretteleggingsbehov og oppfølging</p>
        </div>

        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button className="bg-emerald-600 hover:bg-emerald-700" onClick={resetForm}>
              <Plus className="h-4 w-4 mr-2" />
              Nytt tiltak
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{editingItem ? 'Rediger tiltak' : 'Opprett nytt tiltak'}</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Ansatt</Label>
                  <Select 
                    value={formData.employee_email} 
                    onValueChange={(v) => {
                      const user = users.find(u => u.email === v);
                      setFormData({
                        ...formData, 
                        employee_email: v,
                        employee_name: user?.full_name || ''
                      });
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Velg ansatt" />
                    </SelectTrigger>
                    <SelectContent>
                      {users.map((user) => (
                        <SelectItem key={user.id} value={user.email}>
                          {user.full_name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Avdeling</Label>
                  <Select 
                    value={formData.department} 
                    onValueChange={(v) => setFormData({...formData, department: v})}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Velg avdeling" />
                    </SelectTrigger>
                    <SelectContent>
                      {departments.map((dept) => (
                        <SelectItem key={dept.id} value={dept.name}>
                          {dept.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label>Type tilrettelegging</Label>
                <Input
                  value={formData.accommodation_type}
                  onChange={(e) => setFormData({...formData, accommodation_type: e.target.value})}
                  placeholder="F.eks. Ergonomisk tilpasning, redusert arbeidstid, etc."
                  required
                />
              </div>

              <div className="space-y-2">
                <Label>Beskrivelse</Label>
                <Textarea
                  value={formData.description}
                  onChange={(e) => setFormData({...formData, description: e.target.value})}
                  placeholder="Detaljert beskrivelse av tiltaket..."
                  rows={3}
                />
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label>Status</Label>
                  <Select 
                    value={formData.status} 
                    onValueChange={(v) => setFormData({...formData, status: v})}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="planlagt">Planlagt</SelectItem>
                      <SelectItem value="pågår">Pågår</SelectItem>
                      <SelectItem value="fullført">Fullført</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Risikonivå</Label>
                  <Select 
                    value={formData.risk_level} 
                    onValueChange={(v) => setFormData({...formData, risk_level: v})}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="low">Lav</SelectItem>
                      <SelectItem value="moderate">Moderat</SelectItem>
                      <SelectItem value="high">Høy</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Ansvarlig</Label>
                  <Input
                    value={formData.responsible_person}
                    onChange={(e) => setFormData({...formData, responsible_person: e.target.value})}
                    placeholder="Navn"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Notater</Label>
                <Textarea
                  value={formData.notes}
                  onChange={(e) => setFormData({...formData, notes: e.target.value})}
                  placeholder="Interne notater og kommentarer..."
                  rows={2}
                />
              </div>

              <div className="flex gap-3 pt-4">
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => {
                    setIsDialogOpen(false);
                    resetForm();
                  }}
                  className="flex-1"
                >
                  Avbryt
                </Button>
                <Button 
                  type="submit"
                  className="flex-1 bg-emerald-600 hover:bg-emerald-700"
                  disabled={createAccommodation.isPending || updateAccommodation.isPending}
                >
                  {createAccommodation.isPending || updateAccommodation.isPending ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Lagrer...
                    </>
                  ) : (
                    editingItem ? 'Oppdater' : 'Opprett'
                  )}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardDescription>Totalt antall tiltak</CardDescription>
            <CardTitle className="text-3xl">{accommodations.length}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardDescription>Planlagt</CardDescription>
            <CardTitle className="text-3xl text-slate-600">{filteredByStatus('planlagt').length}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardDescription>Pågår</CardDescription>
            <CardTitle className="text-3xl text-blue-600">{filteredByStatus('pågår').length}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardDescription>Fullført</CardDescription>
            <CardTitle className="text-3xl text-emerald-600">{filteredByStatus('fullført').length}</CardTitle>
          </CardHeader>
        </Card>
      </div>

      {/* Employees needing accommodation */}
      {employeesNeedingAccommodation.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-amber-600" />
              Ansatte som trenger tilrettelegging
            </CardTitle>
            <CardDescription>
              Basert på nylige kartlegginger med moderat/høy risiko
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {employeesNeedingAccommodation.slice(0, 5).map(({ assessment, user }) => (
                <div 
                  key={assessment.id}
                  className={`p-4 rounded-lg border-2 ${riskColors[assessment.risk_level]}`}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium text-slate-900">{user.full_name}</p>
                      <p className="text-sm text-slate-600">{assessment.department}</p>
                      <p className="text-xs text-slate-500 mt-1">
                        Risikonivå: <span className="font-medium">{assessment.risk_level}</span>
                        {assessment.risk_signals?.length > 0 && ` • ${assessment.risk_signals.join(', ')}`}
                      </p>
                    </div>
                    <Button
                      size="sm"
                      onClick={() => handleCreateFromAssessment(assessment, user)}
                      className="bg-emerald-600 hover:bg-emerald-700"
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Opprett tiltak
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Accommodations list */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ClipboardList className="h-5 w-5 text-slate-400" />
            Alle tilretteleggingstiltak
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="alle">
            <TabsList>
              <TabsTrigger value="alle">Alle ({accommodations.length})</TabsTrigger>
              <TabsTrigger value="planlagt">Planlagt ({filteredByStatus('planlagt').length})</TabsTrigger>
              <TabsTrigger value="pågår">Pågår ({filteredByStatus('pågår').length})</TabsTrigger>
              <TabsTrigger value="fullført">Fullført ({filteredByStatus('fullført').length})</TabsTrigger>
            </TabsList>

            {['alle', 'planlagt', 'pågår', 'fullført'].map((tab) => (
              <TabsContent key={tab} value={tab} className="space-y-3 mt-4">
                {(tab === 'alle' ? accommodations : filteredByStatus(tab)).length === 0 ? (
                  <div className="text-center py-8">
                    <ClipboardList className="h-10 w-10 text-slate-300 mx-auto mb-3" />
                    <p className="text-slate-600 font-medium">Ingen tiltak funnet</p>
                  </div>
                ) : (
                  (tab === 'alle' ? accommodations : filteredByStatus(tab)).map((item) => {
                    const StatusIcon = statusConfig[item.status].icon;
                    return (
                      <div 
                        key={item.id}
                        className={`p-4 rounded-lg border-2 ${riskColors[item.risk_level || 'moderate']}`}
                      >
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              <h3 className="font-semibold text-slate-900">{item.accommodation_type}</h3>
                              <Badge className={statusConfig[item.status].color}>
                                <StatusIcon className="h-3 w-3 mr-1" />
                                {statusConfig[item.status].label}
                              </Badge>
                            </div>
                            <div className="grid grid-cols-2 gap-x-6 gap-y-1 text-sm">
                              <p className="text-slate-600">
                                <span className="font-medium">Ansatt:</span> {item.employee_name}
                              </p>
                              <p className="text-slate-600">
                                <span className="font-medium">Avdeling:</span> {item.department}
                              </p>
                              <p className="text-slate-600">
                                <span className="font-medium">Ansvarlig:</span> {item.responsible_person || 'Ikke tildelt'}
                              </p>
                              <p className="text-slate-600">
                                <span className="font-medium">Sist oppdatert:</span> {item.last_updated ? format(new Date(item.last_updated), 'dd. MMM yyyy', { locale: nb }) : 'Aldri'}
                              </p>
                            </div>
                            {item.description && (
                              <p className="text-sm text-slate-700 mt-2">{item.description}</p>
                            )}
                            {item.notes && (
                              <p className="text-xs text-slate-500 mt-2 italic">Notater: {item.notes}</p>
                            )}
                          </div>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleEdit(item)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                        </div>

                        {/* Quick status update */}
                        <div className="flex gap-2 pt-3 border-t border-slate-200">
                          <p className="text-xs text-slate-500 mr-2">Oppdater status:</p>
                          {['planlagt', 'pågår', 'fullført'].map((status) => (
                            <Button
                              key={status}
                              size="sm"
                              variant={item.status === status ? 'default' : 'outline'}
                              onClick={() => handleQuickStatusUpdate(item, status)}
                              disabled={item.status === status}
                              className="h-7 text-xs"
                            >
                              {statusConfig[status].label}
                            </Button>
                          ))}
                        </div>
                      </div>
                    );
                  })
                )}
              </TabsContent>
            ))}
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}