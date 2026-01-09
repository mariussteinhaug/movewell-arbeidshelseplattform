import React, { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { User, Mail, ClipboardList, Wrench, FileText, Plus, Loader2, AlertCircle, Calendar, CheckCircle2, Clock, PlayCircle, Eye, EyeOff } from 'lucide-react';
import { format } from 'date-fns';
import { nb } from 'date-fns/locale';
import { useRequireRoles, ROLE } from '@/components/access/guard';

export default function EmployeeProfile() {
  const { user: currentAuthUser, role, isLoading: authLoading, scope } = useRequireRoles([ROLE.HR], "Dashboard");
  
  const queryClient = useQueryClient();
  const [selectedEmployeeEmail, setSelectedEmployeeEmail] = useState(null);
  const [isNoteDialogOpen, setIsNoteDialogOpen] = useState(false);
  const [noteFormData, setNoteFormData] = useState({
    note_type: 'oppfølging',
    content: '',
    visibility: 'private'
  });

  const urlParams = new URLSearchParams(window.location.search);
  const emailFromUrl = urlParams.get('email');

  React.useEffect(() => {
    if (emailFromUrl) {
      setSelectedEmployeeEmail(emailFromUrl);
    }
  }, [emailFromUrl]);

  const { data: currentUser } = useQuery({
    queryKey: ['current-user'],
    queryFn: () => base44.auth.me()
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
    queryFn: () => base44.entities.AssessmentSession.list('-created_date', 500),
    enabled: !!selectedEmployeeEmail
  });

  const { data: accommodations = [] } = useQuery({
    queryKey: ['accommodations'],
    queryFn: () => base44.entities.Accommodation.list('-last_updated', 100),
    enabled: !!selectedEmployeeEmail
  });

  const { data: messages = [] } = useQuery({
    queryKey: ['messages'],
    queryFn: () => base44.entities.Message.list('-created_date', 200),
    enabled: !!selectedEmployeeEmail
  });

  const { data: notes = [] } = useQuery({
    queryKey: ['employee-notes'],
    queryFn: () => base44.entities.EmployeeNote.list('-created_date', 100),
    enabled: !!selectedEmployeeEmail
  });

  const createNote = useMutation({
    mutationFn: (data) => base44.entities.EmployeeNote.create({
      ...data,
      employee_email: selectedEmployee.email,
      employee_name: selectedEmployee.full_name,
      author_email: currentUser.email,
      author_name: currentUser.full_name
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['employee-notes'] });
      setIsNoteDialogOpen(false);
      resetNoteForm();
    }
  });

  const resetNoteForm = () => {
    setNoteFormData({
      note_type: 'oppfølging',
      content: '',
      visibility: 'private'
    });
  };

  const handleNoteSubmit = (e) => {
    e.preventDefault();
    createNote.mutate(noteFormData);
  };

  const selectedEmployee = useMemo(() => {
    return users.find(u => u.email === selectedEmployeeEmail);
  }, [users, selectedEmployeeEmail]);

  const employeeAssessments = useMemo(() => {
    return assessments
      .filter(a => a.created_by === selectedEmployeeEmail)
      .sort((a, b) => new Date(b.created_date) - new Date(a.created_date));
  }, [assessments, selectedEmployeeEmail]);

  const employeeAccommodations = useMemo(() => {
    return accommodations.filter(a => a.employee_email === selectedEmployeeEmail);
  }, [accommodations, selectedEmployeeEmail]);

  const employeeMessages = useMemo(() => {
    return messages.filter(m => 
      m.recipient_email === selectedEmployeeEmail || m.sender_email === selectedEmployeeEmail
    );
  }, [messages, selectedEmployeeEmail]);

  const employeeNotes = useMemo(() => {
    if (!currentUser) return [];
    return notes.filter(n => 
      n.employee_email === selectedEmployeeEmail &&
      (n.visibility === 'shared' || n.author_email === currentUser.email)
    );
  }, [notes, selectedEmployeeEmail, currentUser]);

  const latestAssessment = employeeAssessments[0];

  const getRiskColor = (level) => {
    if (level === 'low') return 'bg-emerald-50 border-emerald-200 text-emerald-700';
    if (level === 'moderate') return 'bg-amber-50 border-amber-200 text-amber-700';
    if (level === 'high') return 'bg-red-50 border-red-200 text-red-700';
    return 'bg-slate-50 border-slate-200 text-slate-700';
  };

  const statusConfig = {
    planlagt: { icon: Clock, color: 'bg-slate-100 text-slate-700', label: 'Planlagt' },
    pågår: { icon: PlayCircle, color: 'bg-blue-100 text-blue-700', label: 'Pågår' },
    fullført: { icon: CheckCircle2, color: 'bg-emerald-100 text-emerald-700', label: 'Fullført' }
  };

  const noteTypeColors = {
    oppfølging: 'bg-blue-100 text-blue-700',
    observasjon: 'bg-purple-100 text-purple-700',
    tiltak: 'bg-emerald-100 text-emerald-700',
    annet: 'bg-slate-100 text-slate-700'
  };

  if (authLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-emerald-600" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold text-slate-900">Ansattprofil</h1>
        <p className="text-slate-500 mt-1">Fullstendig oversikt over ansattes helsedata og oppfølging</p>
      </div>

      {/* Employee Selector */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Velg ansatt</CardTitle>
        </CardHeader>
        <CardContent>
          <Select value={selectedEmployeeEmail} onValueChange={setSelectedEmployeeEmail}>
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Velg en ansatt for å se profil" />
            </SelectTrigger>
            <SelectContent>
              {users.filter(u => u.role !== 'admin' || u.email !== currentUser?.email).map((user) => (
                <SelectItem key={user.id} value={user.email}>
                  {user.full_name} ({user.email})
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      {selectedEmployee && (
        <>
          {/* Employee Header */}
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-4">
                  <div className="h-16 w-16 rounded-full bg-gradient-to-br from-emerald-400 to-teal-500 flex items-center justify-center">
                    <User className="h-8 w-8 text-white" />
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold text-slate-900">{selectedEmployee.full_name}</h2>
                    <p className="text-slate-500">{selectedEmployee.email}</p>
                    <Badge variant="outline" className="mt-2">
                      {selectedEmployee.role === 'admin' ? 'Administrator' : 'Ansatt'}
                    </Badge>
                  </div>
                </div>

                {latestAssessment && (
                  <div className={`px-4 py-2 rounded-lg border-2 ${getRiskColor(latestAssessment.risk_level)}`}>
                    <p className="text-xs font-medium">Siste risikovurdering</p>
                    <p className="text-lg font-bold capitalize">{latestAssessment.risk_level || 'Ukjent'}</p>
                    <p className="text-xs opacity-75">
                      {format(new Date(latestAssessment.created_date), 'dd. MMM yyyy', { locale: nb })}
                    </p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Quick Stats */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card>
              <CardHeader className="pb-3">
                <CardDescription className="flex items-center gap-2">
                  <ClipboardList className="h-4 w-4" />
                  Kartlegginger
                </CardDescription>
                <CardTitle className="text-3xl">{employeeAssessments.length}</CardTitle>
              </CardHeader>
            </Card>
            <Card>
              <CardHeader className="pb-3">
                <CardDescription className="flex items-center gap-2">
                  <Wrench className="h-4 w-4" />
                  Tiltak
                </CardDescription>
                <CardTitle className="text-3xl">{employeeAccommodations.length}</CardTitle>
              </CardHeader>
            </Card>
            <Card>
              <CardHeader className="pb-3">
                <CardDescription className="flex items-center gap-2">
                  <Mail className="h-4 w-4" />
                  Meldinger
                </CardDescription>
                <CardTitle className="text-3xl">{employeeMessages.length}</CardTitle>
              </CardHeader>
            </Card>
            <Card>
              <CardHeader className="pb-3">
                <CardDescription className="flex items-center gap-2">
                  <FileText className="h-4 w-4" />
                  Notater
                </CardDescription>
                <CardTitle className="text-3xl">{employeeNotes.length}</CardTitle>
              </CardHeader>
            </Card>
          </div>

          {/* Main Content Tabs */}
          <Tabs defaultValue="oversikt" className="space-y-6">
            <TabsList className="grid w-full grid-cols-5">
              <TabsTrigger value="oversikt">Oversikt</TabsTrigger>
              <TabsTrigger value="kartlegginger">Kartlegginger</TabsTrigger>
              <TabsTrigger value="tiltak">Tiltak</TabsTrigger>
              <TabsTrigger value="meldinger">Meldinger</TabsTrigger>
              <TabsTrigger value="notater">Notater</TabsTrigger>
            </TabsList>

            {/* Oversikt Tab */}
            <TabsContent value="oversikt" className="space-y-6">
              {/* Latest Assessment Summary */}
              {latestAssessment && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <ClipboardList className="h-5 w-5 text-emerald-600" />
                      Siste kartlegging
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <p className="text-sm text-slate-600">Avdeling</p>
                          <p className="font-medium">{latestAssessment.department}</p>
                        </div>
                        <div>
                          <p className="text-sm text-slate-600">Dato</p>
                          <p className="font-medium">
                            {format(new Date(latestAssessment.created_date), 'dd. MMMM yyyy', { locale: nb })}
                          </p>
                        </div>
                        <div>
                          <p className="text-sm text-slate-600">Risikonivå</p>
                          <Badge className={getRiskColor(latestAssessment.risk_level)}>
                            {latestAssessment.risk_level || 'Ukjent'}
                          </Badge>
                        </div>
                        <div>
                          <p className="text-sm text-slate-600">Status</p>
                          <p className="font-medium">{latestAssessment.completed ? 'Fullført' : 'Pågående'}</p>
                        </div>
                      </div>
                      {latestAssessment.risk_signals?.length > 0 && (
                        <div>
                          <p className="text-sm text-slate-600 mb-2">Risikosignaler</p>
                          <div className="flex flex-wrap gap-2">
                            {latestAssessment.risk_signals.map((signal, idx) => (
                              <Badge key={idx} variant="outline" className="text-xs">
                                {signal}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Active Accommodations */}
              {employeeAccommodations.filter(a => a.status !== 'fullført').length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Wrench className="h-5 w-5 text-blue-600" />
                      Aktive tilretteleggingstiltak
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {employeeAccommodations
                        .filter(a => a.status !== 'fullført')
                        .map((acc) => {
                          const StatusIcon = statusConfig[acc.status].icon;
                          return (
                            <div key={acc.id} className="p-3 rounded-lg border border-slate-200">
                              <div className="flex items-center justify-between mb-2">
                                <p className="font-medium text-slate-900">{acc.accommodation_type}</p>
                                <Badge className={statusConfig[acc.status].color}>
                                  <StatusIcon className="h-3 w-3 mr-1" />
                                  {statusConfig[acc.status].label}
                                </Badge>
                              </div>
                              <p className="text-sm text-slate-600">{acc.description}</p>
                              <div className="mt-2 flex items-center gap-4 text-xs text-slate-500">
                                <span>Ansvarlig: {acc.responsible_person || 'Ikke tildelt'}</span>
                                <span>
                                  Sist oppdatert: {acc.last_updated ? format(new Date(acc.last_updated), 'dd. MMM', { locale: nb }) : 'Aldri'}
                                </span>
                              </div>
                            </div>
                          );
                        })}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Recent Notes */}
              {employeeNotes.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <FileText className="h-5 w-5 text-purple-600" />
                      Siste notater
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {employeeNotes.slice(0, 3).map((note) => (
                        <div key={note.id} className="p-3 rounded-lg bg-slate-50 border border-slate-200">
                          <div className="flex items-center justify-between mb-2">
                            <Badge className={noteTypeColors[note.note_type]}>
                              {note.note_type}
                            </Badge>
                            <div className="flex items-center gap-2">
                              {note.visibility === 'private' ? (
                                <EyeOff className="h-3 w-3 text-slate-400" />
                              ) : (
                                <Eye className="h-3 w-3 text-slate-400" />
                              )}
                              <span className="text-xs text-slate-500">
                                {format(new Date(note.created_date), 'dd. MMM', { locale: nb })}
                              </span>
                            </div>
                          </div>
                          <p className="text-sm text-slate-700">{note.content}</p>
                          <p className="text-xs text-slate-500 mt-2">Av: {note.author_name}</p>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}
            </TabsContent>

            {/* Kartlegginger Tab */}
            <TabsContent value="kartlegginger">
              <Card>
                <CardHeader>
                  <CardTitle>Alle kartlegginger</CardTitle>
                  <CardDescription>{employeeAssessments.length} registrerte kartlegginger</CardDescription>
                </CardHeader>
                <CardContent>
                  {employeeAssessments.length === 0 ? (
                    <div className="text-center py-8">
                      <ClipboardList className="h-10 w-10 text-slate-300 mx-auto mb-3" />
                      <p className="text-slate-600">Ingen kartlegginger ennå</p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {employeeAssessments.map((assessment) => (
                        <div 
                          key={assessment.id}
                          className={`p-4 rounded-lg border-2 ${getRiskColor(assessment.risk_level)}`}
                        >
                          <div className="flex items-start justify-between mb-3">
                            <div>
                              <div className="flex items-center gap-2 mb-2">
                                <Calendar className="h-4 w-4" />
                                <p className="font-medium">
                                  {format(new Date(assessment.created_date), 'dd. MMMM yyyy', { locale: nb })}
                                </p>
                                <Badge className={getRiskColor(assessment.risk_level)}>
                                  {assessment.risk_level || 'Ukjent'}
                                </Badge>
                              </div>
                              <p className="text-sm text-slate-600 mb-2">
                                Avdeling: {assessment.department} • Path: {assessment.path}
                              </p>
                            </div>
                            <Badge variant={assessment.completed ? 'default' : 'secondary'}>
                              {assessment.completed ? 'Fullført' : 'Pågående'}
                            </Badge>
                          </div>

                          {assessment.risk_signals?.length > 0 && (
                            <div className="mb-3">
                              <p className="text-sm font-medium text-slate-700 mb-2">Risikosignaler:</p>
                              <div className="flex flex-wrap gap-2">
                                {assessment.risk_signals.map((signal, idx) => (
                                  <Badge key={idx} variant="outline" className="text-xs">
                                    {signal}
                                  </Badge>
                                ))}
                              </div>
                            </div>
                          )}

                          {assessment.answered_questions?.length > 0 && (
                            <details className="mt-3">
                              <summary className="text-sm font-medium text-slate-700 cursor-pointer hover:text-slate-900">
                                Se besvarte spørsmål ({assessment.answered_questions.length})
                              </summary>
                              <div className="mt-3 space-y-2 pl-4 border-l-2 border-slate-200">
                                {assessment.answered_questions.slice(0, 5).map((qa, idx) => (
                                  <div key={idx} className="text-sm">
                                    <p className="text-slate-600">{qa.question_id}</p>
                                    <p className="text-slate-900">{String(qa.answer)}</p>
                                  </div>
                                ))}
                                {assessment.answered_questions.length > 5 && (
                                  <p className="text-xs text-slate-500">
                                    ... og {assessment.answered_questions.length - 5} flere svar
                                  </p>
                                )}
                              </div>
                            </details>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* Tiltak Tab */}
            <TabsContent value="tiltak">
              <Card>
                <CardHeader>
                  <CardTitle>Tilretteleggingstiltak</CardTitle>
                  <CardDescription>{employeeAccommodations.length} registrerte tiltak</CardDescription>
                </CardHeader>
                <CardContent>
                  {employeeAccommodations.length === 0 ? (
                    <div className="text-center py-8">
                      <Wrench className="h-10 w-10 text-slate-300 mx-auto mb-3" />
                      <p className="text-slate-600">Ingen tiltak registrert</p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {employeeAccommodations.map((acc) => {
                        const StatusIcon = statusConfig[acc.status].icon;
                        return (
                          <div key={acc.id} className="p-4 rounded-lg border-2 border-slate-200">
                            <div className="flex items-center justify-between mb-3">
                              <h3 className="font-semibold text-slate-900">{acc.accommodation_type}</h3>
                              <Badge className={statusConfig[acc.status].color}>
                                <StatusIcon className="h-3 w-3 mr-1" />
                                {statusConfig[acc.status].label}
                              </Badge>
                            </div>
                            <p className="text-sm text-slate-700 mb-3">{acc.description}</p>
                            <div className="grid grid-cols-2 gap-2 text-sm">
                              <p className="text-slate-600">
                                <span className="font-medium">Avdeling:</span> {acc.department}
                              </p>
                              <p className="text-slate-600">
                                <span className="font-medium">Ansvarlig:</span> {acc.responsible_person || 'Ikke tildelt'}
                              </p>
                              <p className="text-slate-600">
                                <span className="font-medium">Risikonivå:</span> {acc.risk_level}
                              </p>
                              <p className="text-slate-600">
                                <span className="font-medium">Sist oppdatert:</span>{' '}
                                {acc.last_updated ? format(new Date(acc.last_updated), 'dd. MMM yyyy', { locale: nb }) : 'Aldri'}
                              </p>
                            </div>
                            {acc.notes && (
                              <p className="text-xs text-slate-500 mt-3 italic">Notater: {acc.notes}</p>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* Meldinger Tab */}
            <TabsContent value="meldinger">
              <Card>
                <CardHeader>
                  <CardTitle>Meldingshistorikk</CardTitle>
                  <CardDescription>{employeeMessages.length} meldinger</CardDescription>
                </CardHeader>
                <CardContent>
                  {employeeMessages.length === 0 ? (
                    <div className="text-center py-8">
                      <Mail className="h-10 w-10 text-slate-300 mx-auto mb-3" />
                      <p className="text-slate-600">Ingen meldinger ennå</p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {employeeMessages.map((msg) => (
                        <div key={msg.id} className="p-4 rounded-lg border border-slate-200">
                          <div className="flex items-start justify-between mb-2">
                            <div className="flex-1">
                              <p className="font-medium text-slate-900 mb-1">{msg.subject}</p>
                              <div className="flex items-center gap-2 mb-2">
                                <Badge variant="outline">{msg.category}</Badge>
                                <Badge variant={msg.status === 'besvart' ? 'default' : 'secondary'}>
                                  {msg.status}
                                </Badge>
                              </div>
                              <p className="text-sm text-slate-600 mb-2">
                                {msg.sender_email === selectedEmployeeEmail
                                  ? `Til: ${msg.recipient_name}`
                                  : `Fra: ${msg.sender_name}`}
                              </p>
                              <p className="text-sm text-slate-700">{msg.content}</p>
                              {msg.replies?.length > 0 && (
                                <div className="mt-3 pl-4 border-l-2 border-emerald-200 bg-emerald-50/50 p-3 rounded">
                                  <p className="text-xs text-emerald-700 font-medium mb-2">
                                    {msg.replies.length} svar
                                  </p>
                                  {msg.replies.map((reply, idx) => (
                                    <div key={idx} className="text-sm text-slate-700 mb-2">
                                      <p className="text-xs text-slate-500 mb-1">
                                        {reply.sender_name} - {format(new Date(reply.timestamp), 'dd. MMM HH:mm', { locale: nb })}
                                      </p>
                                      <p>{reply.content}</p>
                                    </div>
                                  ))}
                                </div>
                              )}
                            </div>
                            <span className="text-xs text-slate-400 whitespace-nowrap ml-4">
                              {format(new Date(msg.sent_at), 'dd. MMM', { locale: nb })}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* Notater Tab */}
            <TabsContent value="notater">
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle>Notater fra HR/Ledelse</CardTitle>
                      <CardDescription>{employeeNotes.length} notater</CardDescription>
                    </div>
                    <Dialog open={isNoteDialogOpen} onOpenChange={setIsNoteDialogOpen}>
                      <DialogTrigger asChild>
                        <Button className="bg-emerald-600 hover:bg-emerald-700">
                          <Plus className="h-4 w-4 mr-2" />
                          Legg til notat
                        </Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>Nytt notat for {selectedEmployee.full_name}</DialogTitle>
                        </DialogHeader>
                        <form onSubmit={handleNoteSubmit} className="space-y-4">
                          <div className="space-y-2">
                            <Label>Type notat</Label>
                            <Select
                              value={noteFormData.note_type}
                              onValueChange={(v) => setNoteFormData({ ...noteFormData, note_type: v })}
                            >
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="oppfølging">Oppfølging</SelectItem>
                                <SelectItem value="observasjon">Observasjon</SelectItem>
                                <SelectItem value="tiltak">Tiltak</SelectItem>
                                <SelectItem value="annet">Annet</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>

                          <div className="space-y-2">
                            <Label>Synlighet</Label>
                            <Select
                              value={noteFormData.visibility}
                              onValueChange={(v) => setNoteFormData({ ...noteFormData, visibility: v })}
                            >
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="private">Privat (kun deg)</SelectItem>
                                <SelectItem value="shared">Delt (alle admins)</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>

                          <div className="space-y-2">
                            <Label>Innhold</Label>
                            <Textarea
                              value={noteFormData.content}
                              onChange={(e) => setNoteFormData({ ...noteFormData, content: e.target.value })}
                              placeholder="Skriv ditt notat her..."
                              rows={6}
                              required
                            />
                          </div>

                          <div className="flex gap-3 pt-4">
                            <Button
                              type="button"
                              variant="outline"
                              onClick={() => setIsNoteDialogOpen(false)}
                              className="flex-1"
                            >
                              Avbryt
                            </Button>
                            <Button
                              type="submit"
                              className="flex-1 bg-emerald-600 hover:bg-emerald-700"
                              disabled={createNote.isPending}
                            >
                              {createNote.isPending ? (
                                <>
                                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                  Lagrer...
                                </>
                              ) : (
                                'Lagre notat'
                              )}
                            </Button>
                          </div>
                        </form>
                      </DialogContent>
                    </Dialog>
                  </div>
                </CardHeader>
                <CardContent>
                  {employeeNotes.length === 0 ? (
                    <div className="text-center py-8">
                      <FileText className="h-10 w-10 text-slate-300 mx-auto mb-3" />
                      <p className="text-slate-600">Ingen notater ennå</p>
                      <p className="text-sm text-slate-500 mt-1">Legg til det første notatet om denne ansatte</p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {employeeNotes.map((note) => (
                        <div key={note.id} className="p-4 rounded-lg bg-slate-50 border border-slate-200">
                          <div className="flex items-start justify-between mb-3">
                            <div className="flex items-center gap-2">
                              <Badge className={noteTypeColors[note.note_type]}>
                                {note.note_type}
                              </Badge>
                              <Badge variant="outline" className="text-xs">
                                {note.visibility === 'private' ? (
                                  <>
                                    <EyeOff className="h-3 w-3 mr-1" />
                                    Privat
                                  </>
                                ) : (
                                  <>
                                    <Eye className="h-3 w-3 mr-1" />
                                    Delt
                                  </>
                                )}
                              </Badge>
                            </div>
                            <span className="text-xs text-slate-500">
                              {format(new Date(note.created_date), 'dd. MMMM yyyy, HH:mm', { locale: nb })}
                            </span>
                          </div>
                          <p className="text-sm text-slate-700 mb-3 whitespace-pre-wrap">{note.content}</p>
                          <p className="text-xs text-slate-500">
                            Forfatter: {note.author_name}
                            {note.author_email === currentUser?.email && ' (deg)'}
                          </p>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </>
      )}

      {!selectedEmployee && (
        <Card>
          <CardContent className="py-16 text-center">
            <User className="h-12 w-12 text-slate-300 mx-auto mb-4" />
            <p className="text-slate-600 font-medium">Ingen ansatt valgt</p>
            <p className="text-sm text-slate-500 mt-1">Velg en ansatt fra listen ovenfor for å se profilen</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}