import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Loader2 } from 'lucide-react';
import { format } from 'date-fns';
import { nb } from 'date-fns/locale';

export default function Accommodation() {
  const { data: accommodations = [], isLoading } = useQuery({
    queryKey: ['accommodations'],
    queryFn: () => base44.entities.Accommodation.list('-created_date', 200),
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-emerald-600" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold text-slate-900">Tilrettelegging</h1>
        <p className="text-slate-500 mt-1">Saker opprettes fra Mine meldinger og vises her.</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Alle saker</CardTitle>
          <CardDescription>{accommodations.length} registrert{accommodations.length === 1 ? '' : 'e'}</CardDescription>
        </CardHeader>
        <CardContent>
          {accommodations.length === 0 ? (
            <p className="text-slate-600">Ingen saker ennå.</p>
          ) : (
            <div className="space-y-3">
              {accommodations.map((item) => (
                <div key={item.id} className="p-4 rounded-lg border border-slate-200 bg-white">
                  <div className="flex items-center justify-between">
                    <p className="font-medium text-slate-900">{item.accommodation_type || 'Tilrettelegging'}</p>
                    <span className="text-xs text-slate-500">
                      {item.created_at ? format(new Date(item.created_at), 'dd. MMM yyyy', { locale: nb }) : ''}
                    </span>
                  </div>
                  {item.employee_display_name && (
                    <p className="text-xs text-slate-600 mt-1">Ansatt: {item.employee_display_name}</p>
                  )}
                  {item.department_name && (
                    <p className="text-xs text-slate-600">Avdeling: {item.department_name}</p>
                  )}
                  <p className="text-sm text-slate-700 mt-2 whitespace-pre-wrap">{item.description}</p>
                  {item.notes && (
                    <p className="text-xs text-slate-500 mt-2 italic">Notat: {item.notes}</p>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}