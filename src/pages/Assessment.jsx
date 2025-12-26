import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { CheckCircle2, Shield, Activity, Brain, Briefcase, Moon, Zap, AlertCircle } from 'lucide-react';
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from 'framer-motion';

const ScoreSelector = ({ value, onChange, icon: Icon, label, description }) => {
  const scores = [1, 2, 3, 4, 5];
  const labels = ['Svært dårlig', 'Dårlig', 'Middels', 'Bra', 'Svært bra'];

  return (
    <div className="space-y-4">
      <div className="flex items-start gap-3">
        <div className="h-10 w-10 rounded-xl bg-slate-100 flex items-center justify-center flex-shrink-0">
          <Icon className="h-5 w-5 text-slate-600" />
        </div>
        <div>
          <Label className="text-base font-semibold text-slate-900">{label}</Label>
          <p className="text-sm text-slate-500 mt-0.5">{description}</p>
        </div>
      </div>
      
      <div className="flex gap-2">
        {scores.map((score) => (
          <button
            key={score}
            type="button"
            onClick={() => onChange(score)}
            className={cn(
              "flex-1 py-3 rounded-xl text-sm font-medium transition-all duration-200",
              value === score
                ? score <= 2 ? "bg-red-500 text-white shadow-lg shadow-red-500/30"
                : score === 3 ? "bg-amber-500 text-white shadow-lg shadow-amber-500/30"
                : "bg-emerald-500 text-white shadow-lg shadow-emerald-500/30"
                : "bg-slate-100 text-slate-600 hover:bg-slate-200"
            )}
          >
            {score}
          </button>
        ))}
      </div>
      <div className="flex justify-between text-xs text-slate-400 px-1">
        <span>{labels[0]}</span>
        <span>{labels[4]}</span>
      </div>
    </div>
  );
};

export default function Assessment() {
  const queryClient = useQueryClient();
  const [submitted, setSubmitted] = useState(false);
  const [formData, setFormData] = useState({
      department: '',
      physical_load: null,
      mental_wellbeing: null,
      work_environment: null,
      recovery: null,
      stress_level: null,
      comments: ''
  });

  const [showAdaptiveQuestions, setShowAdaptiveQuestions] = useState({
      physical: false,
      mental: false,
      work: false
  });

  const handleScoreChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    
    // Adaptive branching: show follow-up if score <= 3
    if (field === 'physical_load' && value <= 3) {
      setShowAdaptiveQuestions(prev => ({ ...prev, physical: true }));
    }
    if (field === 'mental_wellbeing' && value <= 3) {
      setShowAdaptiveQuestions(prev => ({ ...prev, mental: true }));
    }
    if (field === 'work_environment' && value <= 3) {
      setShowAdaptiveQuestions(prev => ({ ...prev, work: true }));
    }
  };

  const { data: departments = [] } = useQuery({
    queryKey: ['departments'],
    queryFn: () => base44.entities.Department.list()
  });

  const createAssessment = useMutation({
    mutationFn: (data) => {
      const now = new Date();
      const week = `${now.getFullYear()}-${String(Math.ceil((now - new Date(now.getFullYear(), 0, 1)) / (7 * 24 * 60 * 60 * 1000))).padStart(2, '0')}`;
      return base44.entities.HealthAssessment.create({
        ...data,
        assessment_week: week
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['assessments'] });
      setSubmitted(true);
    }
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    createAssessment.mutate(formData);
  };

  const isValid = formData.department && formData.physical_load && formData.mental_wellbeing && formData.work_environment;

  return (
    <div className="max-w-2xl mx-auto">
      <AnimatePresence mode="wait">
        {submitted ? (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="text-center py-16"
          >
            <div className="h-20 w-20 rounded-full bg-emerald-100 flex items-center justify-center mx-auto mb-6">
              <CheckCircle2 className="h-10 w-10 text-emerald-600" />
            </div>
            <h2 className="text-2xl font-bold text-slate-900 mb-2">Takk for din tilbakemelding!</h2>
            <p className="text-slate-500 mb-8">Kartleggingen din er registrert anonymt.</p>
            <Button 
              onClick={() => {
                setSubmitted(false);
                setFormData({
                  department: '',
                  physical_load: null,
                  mental_wellbeing: null,
                  work_environment: null,
                  recovery: null,
                  stress_level: null,
                  comments: ''
                });
              }}
              variant="outline"
            >
              Send ny kartlegging
            </Button>
          </motion.div>
        ) : (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
          >
            {/* Header */}
            <div className="mb-8">
              <h1 className="text-2xl sm:text-3xl font-bold text-slate-900">Ukentlig kartlegging</h1>
              <p className="text-slate-500 mt-2">Hvordan har du det denne uken? Din tilbakemelding er anonym.</p>
            </div>

            {/* Privacy notice */}
            <div className="flex items-start gap-3 p-4 rounded-xl bg-emerald-50 border border-emerald-100 mb-8">
              <Shield className="h-5 w-5 text-emerald-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-emerald-800">Personvern</p>
                <p className="text-sm text-emerald-700 mt-0.5">
                  Dine svar aggregeres med andres og kan ikke spores tilbake til deg. Kun gruppedata vises til ledere.
                </p>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-8">
              {/* Department */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Avdeling</CardTitle>
                  <CardDescription>Velg avdelingen du jobber i</CardDescription>
                </CardHeader>
                <CardContent>
                  <Select 
                    value={formData.department} 
                    onValueChange={(value) => setFormData({...formData, department: value})}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Velg avdeling..." />
                    </SelectTrigger>
                    <SelectContent>
                      {departments.map((dept) => (
                        <SelectItem key={dept.id} value={dept.name}>
                          {dept.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </CardContent>
              </Card>

              {/* Health scores */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Helse og velvære</CardTitle>
                  <CardDescription>Vurder hvordan du har hatt det denne uken (1-5)</CardDescription>
                </CardHeader>
                <CardContent className="space-y-8">
                  <ScoreSelector
                    value={formData.physical_load}
                    onChange={(v) => handleScoreChange('physical_load', v)}
                    icon={Activity}
                    label="Fysisk belastning"
                    description="Hvordan opplever du den fysiske arbeidsbelastningen?"
                  />
                  
                  {showAdaptiveQuestions.physical && (
                    <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                      <div className="flex items-start gap-3 mb-3">
                        <AlertCircle className="h-5 w-5 text-amber-600 mt-0.5" />
                        <p className="font-medium text-slate-900">Hva opplever du som mest utfordrende fysisk?</p>
                      </div>
                      <Textarea
                        placeholder="F.eks: Tunge løft, repetitive bevegelser, stående/sittende arbeid..."
                        rows="2"
                        className="bg-white"
                        onChange={(e) => setFormData(prev => ({
                          ...prev,
                          comments: (prev.comments || '') + '\n[Fysisk]: ' + e.target.value
                        }))}
                      />
                    </div>
                  )}
                  
                  <ScoreSelector
                    value={formData.mental_wellbeing}
                    onChange={(v) => handleScoreChange('mental_wellbeing', v)}
                    icon={Brain}
                    label="Mental helse"
                    description="Hvordan har du det mentalt og følelsesmessig?"
                  />
                  
                  {showAdaptiveQuestions.mental && (
                    <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                      <div className="flex items-start gap-3 mb-3">
                        <AlertCircle className="h-5 w-5 text-amber-600 mt-0.5" />
                        <p className="font-medium text-slate-900">Hva påvirker din mentale helse mest?</p>
                      </div>
                      <Textarea
                        placeholder="F.eks: Arbeidsmengde, stress, bekymringer, søvnproblemer..."
                        rows="2"
                        className="bg-white"
                        onChange={(e) => setFormData(prev => ({
                          ...prev,
                          comments: (prev.comments || '') + '\n[Mental]: ' + e.target.value
                        }))}
                      />
                    </div>
                  )}
                  
                  <ScoreSelector
                    value={formData.work_environment}
                    onChange={(v) => handleScoreChange('work_environment', v)}
                    icon={Briefcase}
                    label="Arbeidsforhold"
                    description="Hvordan opplever du arbeidsmiljøet og forholdene?"
                  />
                  
                  {showAdaptiveQuestions.work && (
                    <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                      <div className="flex items-start gap-3 mb-3">
                        <AlertCircle className="h-5 w-5 text-amber-600 mt-0.5" />
                        <p className="font-medium text-slate-900">Hva er hovedutfordringen i arbeidsmiljøet?</p>
                      </div>
                      <Textarea
                        placeholder="F.eks: Støy, dårlig ergonomi, manglende utstyr, samarbeid..."
                        rows="2"
                        className="bg-white"
                        onChange={(e) => setFormData(prev => ({
                          ...prev,
                          comments: (prev.comments || '') + '\n[Arbeidsmiljø]: ' + e.target.value
                        }))}
                      />
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Optional scores */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Tilleggsinformasjon (valgfritt)</CardTitle>
                  <CardDescription>Ytterligere faktorer som påvirker arbeidshelsen</CardDescription>
                </CardHeader>
                <CardContent className="space-y-8">
                  <ScoreSelector
                    value={formData.recovery}
                    onChange={(v) => setFormData({...formData, recovery: v})}
                    icon={Moon}
                    label="Restitusjon og søvn"
                    description="Får du nok hvile og søvn?"
                  />
                  
                  <ScoreSelector
                    value={formData.stress_level}
                    onChange={(v) => setFormData({...formData, stress_level: v})}
                    icon={Zap}
                    label="Stressnivå"
                    description="Hvor håndterbart er stressnivået ditt?"
                  />

                  <div className="space-y-3">
                    <Label className="text-base font-semibold text-slate-900">Anonym kommentar</Label>
                    <Textarea
                      placeholder="Del gjerne eventuelle bekymringer eller forslag (valgfritt)..."
                      value={formData.comments}
                      onChange={(e) => setFormData({...formData, comments: e.target.value})}
                      className="min-h-[100px]"
                    />
                  </div>
                </CardContent>
              </Card>

              <Button 
                type="submit" 
                disabled={!isValid || createAssessment.isPending}
                className="w-full h-12 text-base bg-emerald-600 hover:bg-emerald-700"
              >
                {createAssessment.isPending ? 'Sender...' : 'Send kartlegging'}
              </Button>
            </form>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}