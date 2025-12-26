import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { CheckCircle2, Shield, Activity, Brain, Briefcase, Moon, Zap, AlertCircle, Loader2 } from 'lucide-react';
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

  const [adaptiveQuestions, setAdaptiveQuestions] = useState([]);
  const [currentAdaptiveQ, setCurrentAdaptiveQ] = useState(null);
  const [isGeneratingQuestion, setIsGeneratingQuestion] = useState(false);
  const [adaptiveResponses, setAdaptiveResponses] = useState([]);

  const handleScoreChange = async (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    
    // AI-drevet adaptiv oppfølging hvis score <= 3
    if (value <= 3 && !currentAdaptiveQ) {
      await generateAdaptiveQuestion(field, value);
    }
  };

  const generateAdaptiveQuestion = async (field, score) => {
    setIsGeneratingQuestion(true);
    
    const categoryMap = {
      physical_load: 'fysisk belastning',
      mental_wellbeing: 'mental helse',
      work_environment: 'arbeidsmiljø',
      recovery: 'restitusjon og søvn',
      stress_level: 'stress'
    };

    const category = categoryMap[field];
    const dept = departments.find(d => d.name === formData.department);
    
    const prompt = `Du er en arbeidshelse-ekspert som gjennomfører en adaptiv helseundersøkelse for en industriarbeider.

Kontekst:
- Arbeidsområde: ${dept?.sector ? dept.sector.replace('_', ' ') : 'ikke spesifisert'}
- Skiftordning: ${dept?.shift_type ? dept.shift_type.replace('_', ' ') : 'ikke spesifisert'}
- Ansatt har vurdert "${category}" til ${score}/5 (lavt nivå)

Tidligere oppfølgingsspørsmål: ${adaptiveResponses.map(r => r.question).join(', ') || 'Ingen'}

Generer ETT spesifikt oppfølgingsspørsmål som:
1. Går dypere inn i problemet
2. Er konkret og relevant for industriarbeid
3. Hjelper med å identifisere underliggende årsaker
4. Er annerledes enn tidligere spørsmål

Returner kun spørsmålet, intet annet.`;

    try {
      const result = await base44.integrations.Core.InvokeLLM({
        prompt: prompt
      });

      setCurrentAdaptiveQ({
        question: result,
        category: field,
        score: score
      });
    } catch (error) {
      console.error('Feil ved generering av spørsmål:', error);
    } finally {
      setIsGeneratingQuestion(false);
    }
  };

  const handleAdaptiveAnswer = async (answer) => {
    if (!answer.trim()) return;

    const newResponse = {
      question: currentAdaptiveQ.question,
      answer: answer,
      category: currentAdaptiveQ.category
    };

    const updatedResponses = [...adaptiveResponses, newResponse];
    setAdaptiveResponses(updatedResponses);
    
    // Sjekk om vi trenger å stille flere spørsmål
    if (updatedResponses.length < 3) {
      const shouldContinue = await checkIfMoreQuestionsNeeded(updatedResponses, currentAdaptiveQ.score);
      
      if (shouldContinue) {
        await generateFollowUpQuestion(updatedResponses, currentAdaptiveQ.category);
      } else {
        setCurrentAdaptiveQ(null);
      }
    } else {
      setCurrentAdaptiveQ(null);
    }
  };

  const checkIfMoreQuestionsNeeded = async (responses, score) => {
    if (score >= 4) return false; // God score trenger ikke mer oppfølging
    if (responses.length >= 3) return false; // Maks 3 oppfølginger
    
    const prompt = `Basert på disse svarene fra en industriarbeider:

${responses.map((r, i) => `Q${i+1}: ${r.question}\nA${i+1}: ${r.answer}`).join('\n\n')}

Har vi identifisert et tydelig mønster eller konkret problemområde? Svar kun JA eller NEI.`;

    try {
      const result = await base44.integrations.Core.InvokeLLM({ prompt });
      return !result.toLowerCase().includes('ja');
    } catch {
      return false;
    }
  };

  const generateFollowUpQuestion = async (responses, category) => {
    setIsGeneratingQuestion(true);
    
    const prompt = `Basert på disse svarene fra en industriarbeider:

${responses.map((r, i) => `Q${i+1}: ${r.question}\nA${i+1}: ${r.answer}`).join('\n\n')}

Generer ett dypere oppfølgingsspørsmål som:
- Utforsker underliggende årsaker
- Er spesifikt og konkret
- Hjelper med å identifisere tydelige tiltak

Returner kun spørsmålet.`;

    try {
      const result = await base44.integrations.Core.InvokeLLM({ prompt });
      setCurrentAdaptiveQ({
        question: result,
        category: category,
        score: null
      });
    } catch (error) {
      console.error('Feil:', error);
      setCurrentAdaptiveQ(null);
    } finally {
      setIsGeneratingQuestion(false);
    }
  };

  const { data: departments = [] } = useQuery({
    queryKey: ['departments'],
    queryFn: () => base44.entities.Department.list()
  });

  const createAssessment = useMutation({
    mutationFn: async (data) => {
      const now = new Date();
      const week = `${now.getFullYear()}-${String(Math.ceil((now - new Date(now.getFullYear(), 0, 1)) / (7 * 24 * 60 * 60 * 1000))).padStart(2, '0')}`;
      
      // AI-analyse av risikoindikatorer
      let riskIndicators = [];
      if (adaptiveResponses.length > 0) {
        try {
          const analysisPrompt = `Analyser disse kartleggingssvarene:

Scores:
- Fysisk: ${data.physical_load}/5
- Mental: ${data.mental_wellbeing}/5  
- Arbeidsmiljø: ${data.work_environment}/5

Oppfølgingssvar:
${adaptiveResponses.map((r, i) => `Q: ${r.question}\nA: ${r.answer}`).join('\n\n')}

Identifiser 3-5 konkrete risikofaktorer eller problemområder. 
Returner som JSON array av strings.`;

          const analysis = await base44.integrations.Core.InvokeLLM({
            prompt: analysisPrompt,
            response_json_schema: {
              type: "object",
              properties: {
                risk_indicators: {
                  type: "array",
                  items: { type: "string" }
                }
              }
            }
          });
          
          riskIndicators = analysis.risk_indicators || [];
        } catch (error) {
          console.error('Feil ved risikoanalyse:', error);
        }
      }
      
      return base44.entities.HealthAssessment.create({
        ...data,
        assessment_week: week,
        adaptive_responses: adaptiveResponses,
        risk_indicators: riskIndicators
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['assessments'] });
      setSubmitted(true);
      setAdaptiveResponses([]);
      setCurrentAdaptiveQ(null);
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
                  
                  <ScoreSelector
                    value={formData.mental_wellbeing}
                    onChange={(v) => handleScoreChange('mental_wellbeing', v)}
                    icon={Brain}
                    label="Mental helse"
                    description="Hvordan har du det mentalt og følelsesmessig?"
                  />
                  
                  <ScoreSelector
                    value={formData.work_environment}
                    onChange={(v) => handleScoreChange('work_environment', v)}
                    icon={Briefcase}
                    label="Arbeidsforhold"
                    description="Hvordan opplever du arbeidsmiljøet og forholdene?"
                  />

                  {/* AI-generert adaptivt oppfølgingsspørsmål */}
                  <AnimatePresence>
                    {isGeneratingQuestion && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className="bg-blue-50 border border-blue-200 rounded-lg p-4"
                      >
                        <div className="flex items-center gap-3">
                          <Loader2 className="h-5 w-5 text-blue-600 animate-spin" />
                          <p className="text-sm text-blue-800">AI genererer oppfølgingsspørsmål...</p>
                        </div>
                      </motion.div>
                    )}

                    {currentAdaptiveQ && !isGeneratingQuestion && (
                      <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        className="bg-emerald-50 border border-emerald-200 rounded-lg p-4 space-y-3"
                      >
                        <div className="flex items-start gap-3">
                          <Brain className="h-5 w-5 text-emerald-600 mt-0.5 flex-shrink-0" />
                          <div className="flex-1">
                            <p className="font-medium text-slate-900 mb-1">AI Oppfølging</p>
                            <p className="text-sm text-slate-700 mb-3">{currentAdaptiveQ.question}</p>
                            <Textarea
                              placeholder="Skriv ditt svar her..."
                              rows="3"
                              className="bg-white mb-2"
                              id="adaptive-answer"
                            />
                            <div className="flex gap-2">
                              <Button
                                type="button"
                                size="sm"
                                onClick={() => {
                                  const answer = document.getElementById('adaptive-answer').value;
                                  handleAdaptiveAnswer(answer);
                                  document.getElementById('adaptive-answer').value = '';
                                }}
                                className="bg-emerald-600 hover:bg-emerald-700"
                              >
                                Send svar
                              </Button>
                              <Button
                                type="button"
                                size="sm"
                                variant="ghost"
                                onClick={() => setCurrentAdaptiveQ(null)}
                              >
                                Hopp over
                              </Button>
                            </div>
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  {/* Vis tidligere adaptive svar */}
                  {adaptiveResponses.length > 0 && (
                    <div className="space-y-2">
                      <p className="text-sm font-medium text-slate-600">Dine oppfølgingssvar:</p>
                      {adaptiveResponses.map((resp, idx) => (
                        <div key={idx} className="bg-slate-50 rounded-lg p-3 text-sm">
                          <p className="font-medium text-slate-700 mb-1">Q: {resp.question}</p>
                          <p className="text-slate-600">A: {resp.answer}</p>
                        </div>
                      ))}
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