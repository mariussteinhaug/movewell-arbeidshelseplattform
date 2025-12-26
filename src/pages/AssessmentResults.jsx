import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Search, FileText, AlertCircle, Calendar, User, Building2, ChevronDown, ChevronUp } from 'lucide-react';
import { format } from 'date-fns';
import { nb } from 'date-fns/locale';

export default function AssessmentResults() {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedDepartment, setSelectedDepartment] = useState('all');
  const [selectedRiskLevel, setSelectedRiskLevel] = useState('all');
  const [selectedSession, setSelectedSession] = useState(null);
  const [expandedSessions, setExpandedSessions] = useState(new Set());

  const { data: sessions = [] } = useQuery({
    queryKey: ['assessment-sessions'],
    queryFn: () => base44.entities.AssessmentSession.list('-created_date', 500)
  });

  const { data: departments = [] } = useQuery({
    queryKey: ['departments'],
    queryFn: () => base44.entities.Department.list()
  });

  const { data: questions = [] } = useQuery({
    queryKey: ['questions'],
    queryFn: () => base44.entities.QuestionBank.list('order')
  });

  const filteredSessions = sessions.filter(session => {
    const matchesDept = selectedDepartment === 'all' || session.department === selectedDepartment;
    const matchesRisk = selectedRiskLevel === 'all' || session.risk_level === selectedRiskLevel;
    const matchesSearch = !searchTerm || 
      session.department?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      session.anonymous_id?.toLowerCase().includes(searchTerm.toLowerCase());
    
    return matchesDept && matchesRisk && matchesSearch && session.completed;
  });

  const toggleExpanded = (sessionId) => {
    const newExpanded = new Set(expandedSessions);
    if (newExpanded.has(sessionId)) {
      newExpanded.delete(sessionId);
    } else {
      newExpanded.add(sessionId);
    }
    setExpandedSessions(newExpanded);
  };

  const riskLevelColors = {
    low: 'bg-emerald-100 text-emerald-700',
    moderate: 'bg-amber-100 text-amber-700',
    high: 'bg-red-100 text-red-700',
    unknown: 'bg-slate-100 text-slate-700'
  };

  const riskLevelLabels = {
    low: 'Lav',
    moderate: 'Moderat',
    high: 'Høy',
    unknown: 'Ukjent'
  };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold text-slate-900">Kartleggingsresultater</h1>
        <p className="text-slate-500 mt-1">Se detaljerte svar fra alle helsekartlegginger</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardDescription>Totalt fullførte</CardDescription>
            <CardTitle className="text-3xl">{sessions.filter(s => s.completed).length}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardDescription>Høy risiko</CardDescription>
            <CardTitle className="text-3xl text-red-600">
              {sessions.filter(s => s.risk_level === 'high').length}
            </CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardDescription>Moderat risiko</CardDescription>
            <CardTitle className="text-3xl text-amber-600">
              {sessions.filter(s => s.risk_level === 'moderate').length}
            </CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardDescription>Lav risiko</CardDescription>
            <CardTitle className="text-3xl text-emerald-600">
              {sessions.filter(s => s.risk_level === 'low').length}
            </CardTitle>
          </CardHeader>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
              <Input
                placeholder="Søk etter avdeling eller ID..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9"
              />
            </div>
            
            <Select value={selectedDepartment} onValueChange={setSelectedDepartment}>
              <SelectTrigger>
                <SelectValue placeholder="Alle avdelinger" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Alle avdelinger</SelectItem>
                {departments.map(dept => (
                  <SelectItem key={dept.id} value={dept.name}>{dept.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={selectedRiskLevel} onValueChange={setSelectedRiskLevel}>
              <SelectTrigger>
                <SelectValue placeholder="Alle risikonivåer" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Alle risikonivåer</SelectItem>
                <SelectItem value="high">Høy risiko</SelectItem>
                <SelectItem value="moderate">Moderat risiko</SelectItem>
                <SelectItem value="low">Lav risiko</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Results */}
      <Card>
        <CardHeader>
          <CardTitle>Kartlegginger ({filteredSessions.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {filteredSessions.length === 0 ? (
            <div className="text-center py-8">
              <FileText className="h-10 w-10 text-slate-300 mx-auto mb-3" />
              <p className="text-slate-600 font-medium">Ingen kartlegginger funnet</p>
              <p className="text-sm text-slate-500 mt-1">Prøv å justere filtrene</p>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredSessions.map((session) => {
                const isExpanded = expandedSessions.has(session.id);
                return (
                  <div 
                    key={session.id}
                    className="border border-slate-200 rounded-lg overflow-hidden"
                  >
                    <div className="p-4 bg-white hover:bg-slate-50 transition-colors">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <Badge className={riskLevelColors[session.risk_level]}>
                              {riskLevelLabels[session.risk_level]} risiko
                            </Badge>
                            <Badge variant="outline" className="text-xs">
                              {session.path}
                            </Badge>
                          </div>
                          
                          <div className="grid grid-cols-2 md:grid-cols-3 gap-3 text-sm">
                            <div className="flex items-center gap-2 text-slate-600">
                              <Building2 className="h-4 w-4 text-slate-400" />
                              {session.department}
                            </div>
                            <div className="flex items-center gap-2 text-slate-600">
                              <Calendar className="h-4 w-4 text-slate-400" />
                              {format(new Date(session.created_date), 'dd. MMM yyyy', { locale: nb })}
                            </div>
                            <div className="flex items-center gap-2 text-slate-600">
                              <User className="h-4 w-4 text-slate-400" />
                              {session.answered_questions?.length || 0} svar
                            </div>
                          </div>

                          {session.risk_signals?.length > 0 && (
                            <div className="mt-3 flex items-start gap-2">
                              <AlertCircle className="h-4 w-4 text-amber-600 mt-0.5 flex-shrink-0" />
                              <div className="flex flex-wrap gap-1">
                                {session.risk_signals.slice(0, 3).map((signal, idx) => (
                                  <Badge key={idx} variant="secondary" className="text-xs">
                                    {signal}
                                  </Badge>
                                ))}
                                {session.risk_signals.length > 3 && (
                                  <Badge variant="secondary" className="text-xs">
                                    +{session.risk_signals.length - 3} flere
                                  </Badge>
                                )}
                              </div>
                            </div>
                          )}
                        </div>

                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => toggleExpanded(session.id)}
                        >
                          {isExpanded ? (
                            <ChevronUp className="h-4 w-4" />
                          ) : (
                            <ChevronDown className="h-4 w-4" />
                          )}
                        </Button>
                      </div>
                    </div>

                    {isExpanded && (
                      <div className="border-t border-slate-200 bg-slate-50 p-4">
                        <h4 className="font-medium text-slate-900 mb-3">Detaljerte svar:</h4>
                        <div className="space-y-4">
                          {session.answered_questions?.map((qa, idx) => {
                            const question = questions.find(q => q.question_id === qa.question_id);
                            return (
                              <div key={idx} className="bg-white rounded-lg p-4 border border-slate-200">
                                <div className="flex items-start justify-between mb-2">
                                  <p className="font-medium text-slate-900 text-sm">
                                    {question?.text || qa.question_id}
                                  </p>
                                  {question?.category && (
                                    <Badge variant="outline" className="text-xs ml-2">
                                      {question.category}
                                    </Badge>
                                  )}
                                </div>
                                <p className="text-sm text-slate-700 bg-emerald-50 px-3 py-2 rounded">
                                  <span className="font-medium">Svar:</span>{' '}
                                  {Array.isArray(qa.answer) ? qa.answer.join(', ') : qa.answer}
                                </p>
                                {qa.timestamp && (
                                  <p className="text-xs text-slate-400 mt-1">
                                    {format(new Date(qa.timestamp), 'dd. MMM yyyy HH:mm', { locale: nb })}
                                  </p>
                                )}
                              </div>
                            );
                          })}
                        </div>

                        {session.uploaded_documents?.length > 0 && (
                          <div className="mt-4 pt-4 border-t border-slate-200">
                            <p className="text-sm font-medium text-slate-900 mb-2">
                              Opplastede dokumenter:
                            </p>
                            <div className="space-y-2">
                              {session.uploaded_documents.map((url, idx) => (
                                <a
                                  key={idx}
                                  href={url}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="flex items-center gap-2 text-sm text-emerald-600 hover:text-emerald-700"
                                >
                                  <FileText className="h-4 w-4" />
                                  Dokument {idx + 1}
                                </a>
                              ))}
                            </div>
                          </div>
                        )}

                        <div className="mt-4 pt-4 border-t border-slate-200">
                          <p className="text-xs text-slate-500">
                            <span className="font-medium">Anonymous ID:</span> {session.anonymous_id}
                          </p>
                          {session.confidence && (
                            <p className="text-xs text-slate-500 mt-1">
                              <span className="font-medium">AI Konfidensgrad:</span>{' '}
                              {Math.round(session.confidence * 100)}%
                            </p>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}