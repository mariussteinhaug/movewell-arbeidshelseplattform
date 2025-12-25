import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Building2, Plus, Trash2, Users, Edit2 } from 'lucide-react';
import { cn } from "@/lib/utils";

export default function Settings() {
  const queryClient = useQueryClient();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingDept, setEditingDept] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    employee_count: '',
    sector: '',
    manager_name: ''
  });

  const { data: departments = [] } = useQuery({
    queryKey: ['departments'],
    queryFn: () => base44.entities.Department.list()
  });

  const createDept = useMutation({
    mutationFn: (data) => base44.entities.Department.create({
      ...data,
      employee_count: parseInt(data.employee_count)
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['departments'] });
      resetForm();
    }
  });

  const updateDept = useMutation({
    mutationFn: ({ id, data }) => base44.entities.Department.update(id, {
      ...data,
      employee_count: parseInt(data.employee_count)
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['departments'] });
      resetForm();
    }
  });

  const deleteDept = useMutation({
    mutationFn: (id) => base44.entities.Department.delete(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['departments'] })
  });

  const resetForm = () => {
    setIsDialogOpen(false);
    setEditingDept(null);
    setFormData({ name: '', employee_count: '', sector: '', manager_name: '' });
  };

  const handleEdit = (dept) => {
    setEditingDept(dept);
    setFormData({
      name: dept.name,
      employee_count: dept.employee_count?.toString() || '',
      sector: dept.sector || '',
      manager_name: dept.manager_name || ''
    });
    setIsDialogOpen(true);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (editingDept) {
      updateDept.mutate({ id: editingDept.id, data: formData });
    } else {
      createDept.mutate(formData);
    }
  };

  const sectorLabels = {
    industri: 'Industri',
    bygg: 'Bygg',
    helse: 'Helse',
    kontor: 'Kontor',
    lager: 'Lager',
    annet: 'Annet'
  };

  const sectorColors = {
    industri: 'bg-orange-100 text-orange-700',
    bygg: 'bg-amber-100 text-amber-700',
    helse: 'bg-rose-100 text-rose-700',
    kontor: 'bg-blue-100 text-blue-700',
    lager: 'bg-slate-100 text-slate-700',
    annet: 'bg-gray-100 text-gray-700'
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold text-slate-900">Innstillinger</h1>
        <p className="text-slate-500 mt-1">Administrer avdelinger og konfigurasjon</p>
      </div>

      {/* Departments */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="text-lg flex items-center gap-2">
              <Building2 className="h-5 w-5 text-slate-400" />
              Avdelinger
            </CardTitle>
            <CardDescription>Administrer avdelingene i organisasjonen</CardDescription>
          </div>
          
          <Dialog open={isDialogOpen} onOpenChange={(open) => {
            setIsDialogOpen(open);
            if (!open) resetForm();
          }}>
            <DialogTrigger asChild>
              <Button className="bg-emerald-600 hover:bg-emerald-700">
                <Plus className="h-4 w-4 mr-2" />
                Legg til
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>
                  {editingDept ? 'Rediger avdeling' : 'Legg til avdeling'}
                </DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label>Avdelingsnavn</Label>
                  <Input
                    value={formData.name}
                    onChange={(e) => setFormData({...formData, name: e.target.value})}
                    placeholder="F.eks. Produksjon"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label>Antall ansatte</Label>
                  <Input
                    type="number"
                    value={formData.employee_count}
                    onChange={(e) => setFormData({...formData, employee_count: e.target.value})}
                    placeholder="0"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label>Sektor</Label>
                  <Select 
                    value={formData.sector} 
                    onValueChange={(v) => setFormData({...formData, sector: v})}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Velg sektor" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="industri">Industri</SelectItem>
                      <SelectItem value="bygg">Bygg</SelectItem>
                      <SelectItem value="helse">Helse</SelectItem>
                      <SelectItem value="kontor">Kontor</SelectItem>
                      <SelectItem value="lager">Lager</SelectItem>
                      <SelectItem value="annet">Annet</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Avdelingsleder (valgfritt)</Label>
                  <Input
                    value={formData.manager_name}
                    onChange={(e) => setFormData({...formData, manager_name: e.target.value})}
                    placeholder="Navn på leder"
                  />
                </div>

                <div className="flex gap-3 pt-4">
                  <Button 
                    type="button" 
                    variant="outline" 
                    onClick={resetForm}
                    className="flex-1"
                  >
                    Avbryt
                  </Button>
                  <Button 
                    type="submit"
                    className="flex-1 bg-emerald-600 hover:bg-emerald-700"
                    disabled={createDept.isPending || updateDept.isPending}
                  >
                    {createDept.isPending || updateDept.isPending ? 'Lagrer...' : 'Lagre'}
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </CardHeader>
        
        <CardContent>
          {departments.length === 0 ? (
            <div className="text-center py-8">
              <Building2 className="h-10 w-10 text-slate-300 mx-auto mb-3" />
              <p className="text-slate-600 font-medium">Ingen avdelinger ennå</p>
              <p className="text-sm text-slate-500 mt-1">Legg til avdelinger for å starte kartlegging</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Avdeling</TableHead>
                    <TableHead>Ansatte</TableHead>
                    <TableHead>Sektor</TableHead>
                    <TableHead>Leder</TableHead>
                    <TableHead className="text-right">Handlinger</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {departments.map((dept) => (
                    <TableRow key={dept.id}>
                      <TableCell className="font-medium">{dept.name}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1 text-slate-600">
                          <Users className="h-4 w-4" />
                          {dept.employee_count}
                        </div>
                      </TableCell>
                      <TableCell>
                        {dept.sector && (
                          <Badge className={sectorColors[dept.sector]}>
                            {sectorLabels[dept.sector]}
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-slate-600">{dept.manager_name || '-'}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button
                            size="icon"
                            variant="ghost"
                            onClick={() => handleEdit(dept)}
                            className="h-8 w-8"
                          >
                            <Edit2 className="h-4 w-4 text-slate-500" />
                          </Button>
                          <Button
                            size="icon"
                            variant="ghost"
                            onClick={() => deleteDept.mutate(dept.id)}
                            className="h-8 w-8 hover:bg-red-50 hover:text-red-600"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}