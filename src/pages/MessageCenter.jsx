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
import { Send, MessageSquare, Users, AlertCircle, Info, Heart, Settings as SettingsIcon, Loader2, Mail } from 'lucide-react';
import { format } from 'date-fns';
import { nb } from 'date-fns/locale';

export default function MessageCenter() {
  const queryClient = useQueryClient();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedRecipient, setSelectedRecipient] = useState(null);
  const [formData, setFormData] = useState({
    subject: '',
    content: '',
    category: 'generelt',
    priority: 'normal',
    related_department: ''
  });

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
    queryFn: () => base44.entities.AssessmentSession.list('-created_date', 100)
  });

  const { data: allMessages = [] } = useQuery({
    queryKey: ['messages'],
    queryFn: () => base44.entities.Message.list('-created_date', 200)
  });

  const sendMessage = useMutation({
    mutationFn: async (data) => {
      const recipient = users.find(u => u.email === selectedRecipient);
      return base44.entities.Message.create({
        ...data,
        recipient_email: selectedRecipient,
        recipient_name: recipient?.full_name || 'Ukjent',
        sender_email: currentUser.email,
        sender_name: currentUser.full_name,
        sent_at: new Date().toISOString(),
        status: 'ulest',
        replies: []
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['messages'] });
      setIsDialogOpen(false);
      resetForm();
    }
  });

  const resetForm = () => {
    setSelectedRecipient(null);
    setFormData({
      subject: '',
      content: '',
      category: 'generelt',
      priority: 'normal',
      related_department: ''
    });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!selectedRecipient) {
      alert('Vennligst velg en mottaker');
      return;
    }
    sendMessage.mutate(formData);
  };

  // Ansatte med høy risiko
  const highRiskEmployees = assessments
    .filter(a => a.risk_level === 'high' && a.completed)
    .reduce((acc, a) => {
      const user = users.find(u => u.email === a.created_by);
      if (user && !acc.find(e => e.email === user.email)) {
        acc.push({ ...user, assessment: a });
      }
      return acc;
    }, []);

  const categoryIcons = {
    oppfølging: Heart,
    informasjon: Info,
    tilrettelegging: SettingsIcon,
    bedriftshelsetjeneste: Heart,
    generelt: MessageSquare
  };

  const priorityColors = {
    lav: 'bg-slate-100 text-slate-700',
    normal: 'bg-blue-100 text-blue-700',
    høy: 'bg-red-100 text-red-700'
  };

  const sentMessages = allMessages.filter(m => m.sender_email === currentUser?.email);
  const unansweredMessages = sentMessages.filter(m => m.status !== 'besvart');

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-900">Meldingssenter</h1>
          <p className="text-slate-500 mt-1">Send målrettede meldinger til ansatte</p>
        </div>

        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button className="bg-emerald-600 hover:bg-emerald-700">
              <Send className="h-4 w-4 mr-2" />
              Ny melding
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Send melding til ansatt</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label>Mottaker</Label>
                <Select value={selectedRecipient} onValueChange={setSelectedRecipient}>
                  <SelectTrigger>
                    <SelectValue placeholder="Velg ansatt" />
                  </SelectTrigger>
                  <SelectContent>
                    {users.filter(u => u.email !== currentUser?.email).map((user) => (
                      <SelectItem key={user.id} value={user.email}>
                        {user.full_name} ({user.email})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Kategori</Label>
                  <Select 
                    value={formData.category} 
                    onValueChange={(v) => setFormData({...formData, category: v})}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="oppfølging">Oppfølging</SelectItem>
                      <SelectItem value="informasjon">Informasjon</SelectItem>
                      <SelectItem value="tilrettelegging">Tilrettelegging</SelectItem>
                      <SelectItem value="bedriftshelsetjeneste">Bedriftshelsetjeneste</SelectItem>
                      <SelectItem value="generelt">Generelt</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Prioritet</Label>
                  <Select 
                    value={formData.priority} 
                    onValueChange={(v) => setFormData({...formData, priority: v})}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="lav">Lav</SelectItem>
                      <SelectItem value="normal">Normal</SelectItem>
                      <SelectItem value="høy">Høy</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label>Avdeling (valgfritt)</Label>
                <Select 
                  value={formData.related_department} 
                  onValueChange={(v) => setFormData({...formData, related_department: v})}
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

              <div className="space-y-2">
                <Label>Emne</Label>
                <Input
                  value={formData.subject}
                  onChange={(e) => setFormData({...formData, subject: e.target.value})}
                  placeholder="F.eks. Oppfølgingsmøte vedrørende helsekartlegging"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label>Melding</Label>
                <Textarea
                  value={formData.content}
                  onChange={(e) => setFormData({...formData, content: e.target.value})}
                  placeholder="Skriv meldingen din her..."
                  rows={6}
                  required
                />
              </div>

              <div className="flex gap-3 pt-4">
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => setIsDialogOpen(false)}
                  className="flex-1"
                >
                  Avbryt
                </Button>
                <Button 
                  type="submit"
                  className="flex-1 bg-emerald-600 hover:bg-emerald-700"
                  disabled={sendMessage.isPending}
                >
                  {sendMessage.isPending ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Sender...
                    </>
                  ) : (
                    <>
                      <Send className="h-4 w-4 mr-2" />
                      Send melding
                    </>
                  )}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardDescription>Totalt sendt</CardDescription>
            <CardTitle className="text-3xl">{sentMessages.length}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardDescription>Venter på svar</CardDescription>
            <CardTitle className="text-3xl text-amber-600">{unansweredMessages.length}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardDescription>Høy risiko ansatte</CardDescription>
            <CardTitle className="text-3xl text-red-600">{highRiskEmployees.length}</CardTitle>
          </CardHeader>
        </Card>
      </div>

      {/* High Risk Employees */}
      {highRiskEmployees.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-red-600" />
              Ansatte med høy risiko
            </CardTitle>
            <CardDescription>
              Disse ansatte bør følges opp snarest
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {highRiskEmployees.slice(0, 5).map((employee) => (
                <div 
                  key={employee.id}
                  className="flex items-center justify-between p-4 rounded-lg border border-slate-200 hover:bg-slate-50"
                >
                  <div>
                    <p className="font-medium text-slate-900">{employee.full_name}</p>
                    <p className="text-sm text-slate-500">{employee.email}</p>
                    {employee.assessment?.department && (
                      <p className="text-xs text-slate-400 mt-1">
                        Avdeling: {employee.assessment.department}
                      </p>
                    )}
                  </div>
                  <Button
                    size="sm"
                    onClick={() => {
                      setSelectedRecipient(employee.email);
                      setFormData({
                        ...formData,
                        subject: 'Oppfølging av helsekartlegging',
                        category: 'oppfølging',
                        priority: 'høy',
                        related_department: employee.assessment?.department || ''
                      });
                      setIsDialogOpen(true);
                    }}
                    className="bg-emerald-600 hover:bg-emerald-700"
                  >
                    <Send className="h-4 w-4 mr-2" />
                    Send melding
                  </Button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Sent Messages */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Mail className="h-5 w-5 text-slate-400" />
            Sendte meldinger
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="alle">
            <TabsList>
              <TabsTrigger value="alle">Alle ({sentMessages.length})</TabsTrigger>
              <TabsTrigger value="ulest">Uleste ({sentMessages.filter(m => m.status === 'ulest').length})</TabsTrigger>
              <TabsTrigger value="besvart">Besvarte ({sentMessages.filter(m => m.status === 'besvart').length})</TabsTrigger>
            </TabsList>

            <TabsContent value="alle" className="space-y-3 mt-4">
              {sentMessages.length === 0 ? (
                <div className="text-center py-8">
                  <MessageSquare className="h-10 w-10 text-slate-300 mx-auto mb-3" />
                  <p className="text-slate-600 font-medium">Ingen meldinger sendt ennå</p>
                  <p className="text-sm text-slate-500 mt-1">Start med å sende en melding til en ansatt</p>
                </div>
              ) : (
                sentMessages.map((msg) => {
                  const Icon = categoryIcons[msg.category] || MessageSquare;
                  return (
                    <div 
                      key={msg.id}
                      className="p-4 rounded-lg border border-slate-200 hover:bg-slate-50"
                    >
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex items-start gap-3 flex-1">
                          <Icon className="h-5 w-5 text-slate-400 mt-0.5" />
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <p className="font-medium text-slate-900">{msg.subject}</p>
                              <Badge className={priorityColors[msg.priority]}>
                                {msg.priority}
                              </Badge>
                              <Badge variant={msg.status === 'besvart' ? 'default' : 'secondary'}>
                                {msg.status}
                              </Badge>
                            </div>
                            <p className="text-sm text-slate-600 mb-2">
                              Til: {msg.recipient_name} ({msg.recipient_email})
                            </p>
                            <p className="text-sm text-slate-700">{msg.content}</p>
                            {msg.replies?.length > 0 && (
                              <div className="mt-3 pl-4 border-l-2 border-emerald-200 bg-emerald-50/50 p-3 rounded">
                                <p className="text-xs text-emerald-700 font-medium mb-1">Svar:</p>
                                {msg.replies.map((reply, idx) => (
                                  <div key={idx} className="text-sm text-slate-700 mb-2">
                                    <p className="text-xs text-slate-500 mb-1">
                                      {reply.sender_name} - {format(new Date(reply.timestamp), 'dd. MMM yyyy HH:mm', { locale: nb })}
                                    </p>
                                    <p>{reply.content}</p>
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        </div>
                        <span className="text-xs text-slate-400 whitespace-nowrap ml-4">
                          {format(new Date(msg.sent_at), 'dd. MMM yyyy', { locale: nb })}
                        </span>
                      </div>
                    </div>
                  );
                })
              )}
            </TabsContent>

            <TabsContent value="ulest" className="space-y-3 mt-4">
              {sentMessages.filter(m => m.status === 'ulest').map((msg) => {
                const Icon = categoryIcons[msg.category] || MessageSquare;
                return (
                  <div key={msg.id} className="p-4 rounded-lg border border-slate-200">
                    <div className="flex items-center gap-2 mb-1">
                      <Icon className="h-4 w-4 text-slate-400" />
                      <p className="font-medium text-slate-900">{msg.subject}</p>
                      <Badge className={priorityColors[msg.priority]}>{msg.priority}</Badge>
                    </div>
                    <p className="text-sm text-slate-600">Til: {msg.recipient_name}</p>
                  </div>
                );
              })}
            </TabsContent>

            <TabsContent value="besvart" className="space-y-3 mt-4">
              {sentMessages.filter(m => m.status === 'besvart').map((msg) => {
                const Icon = categoryIcons[msg.category] || MessageSquare;
                return (
                  <div key={msg.id} className="p-4 rounded-lg border border-slate-200">
                    <div className="flex items-center gap-2 mb-1">
                      <Icon className="h-4 w-4 text-slate-400" />
                      <p className="font-medium text-slate-900">{msg.subject}</p>
                    </div>
                    <p className="text-sm text-slate-600 mb-2">Til: {msg.recipient_name}</p>
                    {msg.replies?.length > 0 && (
                      <p className="text-xs text-emerald-600 font-medium">
                        {msg.replies.length} svar mottatt
                      </p>
                    )}
                  </div>
                );
              })}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}