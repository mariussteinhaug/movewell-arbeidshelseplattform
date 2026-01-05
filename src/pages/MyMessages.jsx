import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { MessageSquare, Heart, Info, Settings as SettingsIcon, Send, Mail, Inbox, CheckCircle2, Loader2 } from 'lucide-react';
import { format } from 'date-fns';
import { nb } from 'date-fns/locale';
import { motion, AnimatePresence } from 'framer-motion';

export default function MyMessages() {
  const queryClient = useQueryClient();
  const [selectedMessage, setSelectedMessage] = useState(null);
  const [replyText, setReplyText] = useState('');

  const { data: currentUser } = useQuery({
    queryKey: ['current-user'],
    queryFn: () => base44.auth.me()
  });

  const { data: myMessages = [], isLoading } = useQuery({
    queryKey: ['my-messages'],
    queryFn: async () => {
      const user = await base44.auth.me();
      const messages = await base44.entities.Message.list('-created_date', 100);
      return messages.filter(m => m.recipient_user_id === user.id);
    }
  });

  // Hent avdelingsvarsler slik at broadcasts vises i "Mine meldinger"
  const { data: deptMessages = [] } = useQuery({
    queryKey: ['department-messages'],
    queryFn: () => base44.entities.Message.list('-sent_at', 200)
  });

  const departmentAlerts = React.useMemo(() => {
    const deptId = currentUser?.department_id;
    const isMgrHr = ['manager', 'hr', 'admin'].includes(String(currentUser?.role || '').toLowerCase());
    return (deptMessages || []).filter((m) =>
      m.type === 'broadcast' &&
      (!!deptId && m.recipient_department_id === deptId) &&
      (isMgrHr || m.visibility !== 'hr_only')
    );
  }, [deptMessages, currentUser?.department_id, currentUser?.role]);

  const markAsRead = useMutation({
    mutationFn: (messageId) => 
      base44.entities.Message.update(messageId, { status: 'lest' }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['my-messages'] });
    }
  });

  const sendReply = useMutation({
    mutationFn: async ({ messageId, message }) => {
      const newReply = {
        sender_email: currentUser.email,
        sender_name: currentUser.full_name,
        content: replyText,
        timestamp: new Date().toISOString()
      };

      const updatedReplies = [...(message.replies || []), newReply];

      return base44.entities.Message.update(messageId, {
        replies: updatedReplies,
        status: 'besvart'
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['my-messages'] });
      setReplyText('');
      setSelectedMessage(null);
    }
  });

  const forwardToAccommodation = useMutation({
    mutationFn: async (message) => {
      const orgId = currentUser?.organization_id || 'default';
      const now = new Date().toISOString();

      let session = null;
      if (message?.related_assessment_session_id) {
        const sessions = await base44.entities.AssessmentSession.filter({ id: message.related_assessment_session_id });
        session = Array.isArray(sessions) ? sessions[0] : sessions;
      }

      const deptId = message?.recipient_department_id || session?.department_id || currentUser?.department_id || 'unknown';
      const employeeId = session?.respondent_user_id || currentUser?.id;
      const risk = session?.risk_level === 'high' ? 'high' : session?.risk_level === 'moderate' ? 'moderate' : 'low';

      return base44.entities.Accommodation.create({
        organization_id: orgId,
        employee_user_id: employeeId,
        department_id: deptId,
        accommodation_type: 'Oppfølging fra kartlegging',
        description: message?.content || 'Oppfølging basert på melding',
        status: 'planlagt',
        priority: 'normal',
        responsible_user_id: currentUser.id,
        visibility: 'manager_and_hr',
        risk_level: risk,
        related_assessment_session_id: message?.related_assessment_session_id,
        created_at: now,
        updated_at: now,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['accommodations'] });
    }
  });

  const handleOpenMessage = (message) => {
    setSelectedMessage(message);
    if (message.status === 'ulest') {
      markAsRead.mutate(message.id);
    }
  };

  const handleSendReply = () => {
    if (!replyText.trim() || !selectedMessage) return;
    sendReply.mutate({ messageId: selectedMessage.id, message: selectedMessage });
  };

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

  const canForward = ['manager', 'hr', 'admin'].includes(String(currentUser?.role || '').toLowerCase());

  const unreadCount = myMessages.filter(m => m.status === 'ulest').length;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-emerald-600" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold text-slate-900">Mine meldinger</h1>
        <p className="text-slate-500 mt-1">Meldinger fra HR og ledelse</p>
      </div>

      {unreadCount > 0 && (
        <Card className="border-emerald-200 bg-emerald-50/50">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <Inbox className="h-5 w-5 text-emerald-600" />
              <p className="text-sm font-medium text-emerald-800">
                Du har {unreadCount} uleste melding{unreadCount !== 1 ? 'er' : ''}
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {departmentAlerts.length > 0 && (
        <Card className="border-slate-200 bg-slate-50/60">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Info className="h-5 w-5 text-slate-400" />
              Varsler til din avdeling
            </CardTitle>
            <CardDescription>System- og AI-meldinger som gjelder din avdeling</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {departmentAlerts.map((msg) => (
              <div key={msg.id} className="p-4 rounded-lg border border-slate-200 bg-white">
                <p className="font-medium text-slate-900">{msg.subject || 'Varsel'}</p>
                <p className="text-xs text-slate-500 mb-2">
                  {format(new Date(msg.sent_at), 'dd. MMM yyyy, HH:mm', { locale: nb })}
                </p>
                <p className="text-sm text-slate-700 whitespace-pre-wrap">{msg.content}</p>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Message List */}
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle className="text-lg">Innboks</CardTitle>
            <CardDescription>{myMessages.length} meldinger</CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="alle">
              <TabsList className="w-full">
                <TabsTrigger value="alle" className="flex-1">
                  Alle
                </TabsTrigger>
                <TabsTrigger value="ulest" className="flex-1">
                  Uleste ({unreadCount})
                </TabsTrigger>
              </TabsList>

              <TabsContent value="alle" className="space-y-2 mt-4">
                {myMessages.length === 0 ? (
                  <div className="text-center py-8">
                    <Mail className="h-10 w-10 text-slate-300 mx-auto mb-3" />
                    <p className="text-sm text-slate-500">Ingen meldinger ennå</p>
                  </div>
                ) : (
                  myMessages.map((msg) => {
                    const Icon = categoryIcons[msg.category] || MessageSquare;
                    return (
                      <button
                        key={msg.id}
                        onClick={() => handleOpenMessage(msg)}
                        className={`w-full text-left p-3 rounded-lg border transition-all ${
                          selectedMessage?.id === msg.id
                            ? 'border-emerald-500 bg-emerald-50'
                            : msg.status === 'ulest'
                            ? 'border-slate-300 bg-white hover:bg-slate-50'
                            : 'border-slate-200 bg-slate-50/50 hover:bg-slate-50'
                        }`}
                      >
                        <div className="flex items-center gap-2 mb-1">
                          <Icon className="h-4 w-4 text-slate-400" />
                          {msg.status === 'ulest' && (
                            <div className="h-2 w-2 rounded-full bg-emerald-500" />
                          )}
                          <p className={`font-medium text-sm flex-1 truncate ${
                            msg.status === 'ulest' ? 'text-slate-900' : 'text-slate-600'
                          }`}>
                            {msg.subject}
                          </p>
                        </div>
                        <p className="text-xs text-slate-500">
                          Fra: {msg.sender_name}
                        </p>
                        <p className="text-xs text-slate-400 mt-1">
                          {format(new Date(msg.sent_at), 'dd. MMM yyyy', { locale: nb })}
                        </p>
                      </button>
                    );
                  })
                )}
              </TabsContent>

              <TabsContent value="ulest" className="space-y-2 mt-4">
                {myMessages.filter(m => m.status === 'ulest').map((msg) => {
                  const Icon = categoryIcons[msg.category] || MessageSquare;
                  return (
                    <button
                      key={msg.id}
                      onClick={() => handleOpenMessage(msg)}
                      className={`w-full text-left p-3 rounded-lg border transition-all ${
                        selectedMessage?.id === msg.id
                          ? 'border-emerald-500 bg-emerald-50'
                          : 'border-slate-300 bg-white hover:bg-slate-50'
                      }`}
                    >
                      <div className="flex items-center gap-2 mb-1">
                        <Icon className="h-4 w-4 text-slate-400" />
                        <div className="h-2 w-2 rounded-full bg-emerald-500" />
                        <p className="font-medium text-sm flex-1 truncate">
                          {msg.subject}
                        </p>
                      </div>
                      <p className="text-xs text-slate-500">Fra: {msg.sender_name}</p>
                    </button>
                  );
                })}
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>

        {/* Message Detail */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-lg">
              {selectedMessage ? selectedMessage.subject : 'Velg en melding'}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {!selectedMessage ? (
              <div className="text-center py-16">
                <MessageSquare className="h-12 w-12 text-slate-300 mx-auto mb-4" />
                <p className="text-slate-600 font-medium">Ingen melding valgt</p>
                <p className="text-sm text-slate-500 mt-1">
                  Velg en melding fra listen for å lese den
                </p>
              </div>
            ) : (
              <div className="space-y-6">
                {/* Message Header */}
                <div className="pb-4 border-b border-slate-200">
                  <div className="flex items-center gap-2 mb-3">
                    <Badge className={priorityColors[selectedMessage.priority]}>
                      {selectedMessage.priority} prioritet
                    </Badge>
                    <Badge variant="outline">
                      {selectedMessage.category}
                    </Badge>
                    {selectedMessage.status === 'besvart' && (
                      <Badge className="bg-emerald-100 text-emerald-700">
                        <CheckCircle2 className="h-3 w-3 mr-1" />
                        Besvart
                      </Badge>
                    )}
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm text-slate-600">
                      <span className="font-medium">Fra:</span> {selectedMessage.sender_name} ({selectedMessage.sender_email})
                    </p>
                    {selectedMessage.related_department && (
                      <p className="text-sm text-slate-600">
                        <span className="font-medium">Avdeling:</span> {selectedMessage.related_department}
                      </p>
                    )}
                    <p className="text-xs text-slate-400">
                      {format(new Date(selectedMessage.sent_at), 'dd. MMMM yyyy, HH:mm', { locale: nb })}
                    </p>
                  </div>
                </div>

                {/* Message Content */}
                 <div className="prose prose-sm max-w-none">
                   <p className="text-slate-700 leading-relaxed whitespace-pre-wrap">
                     {selectedMessage.content}
                   </p>
                 </div>

                 {canForward && (
                   <div>
                     <Button
                       variant="outline"
                       className="gap-2"
                       onClick={() => forwardToAccommodation.mutate(selectedMessage)}
                       disabled={forwardToAccommodation?.isPending}
                     >
                       <SettingsIcon className="h-4 w-4" />
                       Send til tilrettelegging
                     </Button>
                   </div>
                 )}

                 {/* Replies */}
                {selectedMessage.replies?.length > 0 && (
                  <div className="space-y-3 pt-4 border-t border-slate-200">
                    <p className="text-sm font-medium text-slate-900">Tidligere svar:</p>
                    {selectedMessage.replies.map((reply, idx) => (
                      <motion.div
                        key={idx}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="bg-slate-50 rounded-lg p-4 border border-slate-200"
                      >
                        <div className="flex items-center justify-between mb-2">
                          <p className="text-sm font-medium text-slate-900">
                            {reply.sender_name}
                          </p>
                          <p className="text-xs text-slate-500">
                            {format(new Date(reply.timestamp), 'dd. MMM yyyy, HH:mm', { locale: nb })}
                          </p>
                        </div>
                        <p className="text-sm text-slate-700 whitespace-pre-wrap">
                          {reply.content}
                        </p>
                      </motion.div>
                    ))}
                  </div>
                )}

                {/* Reply Form */}
                <div className="space-y-3 pt-4 border-t border-slate-200">
                  <p className="text-sm font-medium text-slate-900">Send svar:</p>
                  <Textarea
                    value={replyText}
                    onChange={(e) => setReplyText(e.target.value)}
                    placeholder="Skriv ditt svar her..."
                    rows={4}
                    className="resize-none"
                  />
                  <Button
                    onClick={handleSendReply}
                    disabled={!replyText.trim() || sendReply.isPending}
                    className="bg-emerald-600 hover:bg-emerald-700"
                  >
                    {sendReply.isPending ? (
                      <>
                        <Send className="h-4 w-4 mr-2 animate-pulse" />
                        Sender...
                      </>
                    ) : (
                      <>
                        <Send className="h-4 w-4 mr-2" />
                        Send svar
                      </>
                    )}
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}