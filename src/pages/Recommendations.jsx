import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  Lightbulb, 
  Plus, 
  CheckCircle2, 
  Clock, 
  PlayCircle,
  Activity,
  Brain,
  Briefcase,
  Sparkles
} from 'lucide-react';
import { cn } from "@/lib/utils";

export default function Recommendations() {
  const queryClient = useQueryClient();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [newRec, setNewRec] = useState({
    department: '',
    category: '',
    title: '',
    description: '',
    priority: 'middels'
  });

  const { data: recommendations = [] } = useQuery({
    queryKey: ['recommendations'],
    queryFn: () => base44.entities.ActionRecommendation.list('-created_date', 100)
  });

  const { data: departments = [] } = useQuery({
    queryKey: ['departments'],
    queryFn: () => base44.entities.Department.list()
  });

  const createRec = useMutation({
    mutationFn: (data) => base44.entities.ActionRecommendation.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['recommendations'] });
      setIsDialogOpen(false);
      setNewRec({ department: '', category: '', title: '', description: '', priority: 'middels' });
    }
  });

  const updateStatus = useMutation({
    mutationFn: ({ id, status }) => base44.entities.ActionRecommendation.update(id, { status }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['recommendations'] })
  });

  const statusGroups = {
    ny: recommendations.filter(r => r.status === 'ny'),
    pågår: recommendations.filter(r => r.status === 'pågår'),
    fullført: recommendations.filter(r => r.status === 'fullført')
  };

  const priorityColors = {
    høy: 'bg-red-100 text-red-700 border-red-200',
    middels: 'bg-amber-100 text-amber-700 border-amber-200',
    lav: 'bg-blue-100 text-blue-700 border-blue-200'
  };

  const categoryIcons = {
    fysisk: Activity,
    mental: Brain,
    arbeidsforhold: Briefcase,
    generell: Sparkles
  };

  const RecommendationCard = ({ rec }) => {
    const Icon = categoryIcons[rec.category] || Lightbulb;
    
    return (
      <Card className="group hover:shadow-lg transition-all duration-200">
        <CardContent className="pt-5">
          <div className="flex items-start gap-4">
            <div className={cn(
              "h-10 w-10 rounded-xl flex items-center justify-center flex-shrink-0",
              rec.category === 'fysisk' ? 'bg-blue-100' :
              rec.category === 'mental' ? 'bg-purple-100' :
              rec.category === 'arbeidsforhold' ? 'bg-emerald-100' : 'bg-slate-100'
            )}>
              <Icon className={cn(
                "h-5 w-5",
                rec.category === 'fysisk' ? 'text-blue-600' :
                rec.category === 'mental' ? 'text-purple-600' :
                rec.category === 'arbeidsforhold' ? 'text-emerald-600' : 'text-slate-600'
              )} />
            </div>
            
            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between gap-2 mb-2">
                <h3 className="font-semibold text-slate-900">{rec.title}</h3>
                <Badge className={cn("flex-shrink-0", priorityColors[rec.priority])}>
                  {rec.priority}
                </Badge>
              </div>
              <p className="text-sm text-slate-500 mb-3">{rec.department}</p>
              <p className="text-sm text-slate-600 line-clamp-2">{rec.description}</p>
              
              {rec.status !== 'fullført' && (
                <div className="flex gap-2 mt-4 pt-4 border-t border-slate-100">
                  {rec.status === 'ny' && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => updateStatus.mutate({ id: rec.id, status: 'pågår' })}
                      className="flex-1"
                    >
                      <PlayCircle className="h-4 w-4 mr-1" />
                      Start
                    </Button>
                  )}
                  {rec.status === 'pågår' && (
                    <Button
                      size="sm"
                      onClick={() => updateStatus.mutate({ id: rec.id, status: 'fullført' })}
                      className="flex-1 bg-emerald-600 hover:bg-emerald-700"
                    >
                      <CheckCircle2 className="h-4 w-4 mr-1" />
                      Fullfør
                    </Button>
                  )}
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    );
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-900">Anbefalinger</h1>
          <p className="text-slate-500 mt-1">Handlingsrettede tiltak basert på kartleggingsdata</p>
        </div>
        
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button className="bg-emerald-600 hover:bg-emerald-700">
              <Plus className="h-4 w-4 mr-2" />
              Ny anbefaling
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Opprett ny anbefaling</DialogTitle>
            </DialogHeader>
            <form 
              onSubmit={(e) => {
                e.preventDefault();
                createRec.mutate(newRec);
              }} 
              className="space-y-4"
            >
              <div className="space-y-2">
                <Label>Avdeling</Label>
                <Select value={newRec.department} onValueChange={(v) => setNewRec({...newRec, department: v})}>
                  <SelectTrigger>
                    <SelectValue placeholder="Velg avdeling" />
                  </SelectTrigger>
                  <SelectContent>
                    {departments.map((d) => (
                      <SelectItem key={d.id} value={d.name}>{d.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Kategori</Label>
                <Select value={newRec.category} onValueChange={(v) => setNewRec({...newRec, category: v})}>
                  <SelectTrigger>
                    <SelectValue placeholder="Velg kategori" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="fysisk">Fysisk</SelectItem>
                    <SelectItem value="mental">Mental</SelectItem>
                    <SelectItem value="arbeidsforhold">Arbeidsforhold</SelectItem>
                    <SelectItem value="generell">Generell</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Tittel</Label>
                <Input 
                  value={newRec.title}
                  onChange={(e) => setNewRec({...newRec, title: e.target.value})}
                  placeholder="Kort tittel for tiltaket"
                />
              </div>

              <div className="space-y-2">
                <Label>Beskrivelse</Label>
                <Textarea 
                  value={newRec.description}
                  onChange={(e) => setNewRec({...newRec, description: e.target.value})}
                  placeholder="Beskriv tiltaket i detalj..."
                />
              </div>

              <div className="space-y-2">
                <Label>Prioritet</Label>
                <Select value={newRec.priority} onValueChange={(v) => setNewRec({...newRec, priority: v})}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="høy">Høy</SelectItem>
                    <SelectItem value="middels">Middels</SelectItem>
                    <SelectItem value="lav">Lav</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <Button 
                type="submit" 
                className="w-full bg-emerald-600 hover:bg-emerald-700"
                disabled={createRec.isPending}
              >
                {createRec.isPending ? 'Oppretter...' : 'Opprett anbefaling'}
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="ny" className="space-y-6">
        <TabsList className="bg-slate-100 p-1">
          <TabsTrigger value="ny" className="data-[state=active]:bg-white">
            <Clock className="h-4 w-4 mr-2" />
            Nye ({statusGroups.ny.length})
          </TabsTrigger>
          <TabsTrigger value="pågår" className="data-[state=active]:bg-white">
            <PlayCircle className="h-4 w-4 mr-2" />
            Pågår ({statusGroups.pågår.length})
          </TabsTrigger>
          <TabsTrigger value="fullført" className="data-[state=active]:bg-white">
            <CheckCircle2 className="h-4 w-4 mr-2" />
            Fullført ({statusGroups.fullført.length})
          </TabsTrigger>
        </TabsList>

        {['ny', 'pågår', 'fullført'].map((status) => (
          <TabsContent key={status} value={status} className="space-y-4">
            {statusGroups[status].length === 0 ? (
              <Card>
                <CardContent className="py-12 text-center">
                  <Lightbulb className="h-10 w-10 text-slate-300 mx-auto mb-3" />
                  <p className="text-slate-600 font-medium">Ingen anbefalinger her</p>
                  <p className="text-sm text-slate-500 mt-1">
                    {status === 'ny' ? 'Opprett en ny anbefaling for å komme i gang' : 
                     status === 'pågår' ? 'Marker en anbefaling som "pågår" for å se den her' :
                     'Fullførte anbefalinger vises her'}
                  </p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {statusGroups[status].map((rec) => (
                  <RecommendationCard key={rec.id} rec={rec} />
                ))}
              </div>
            )}
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
}