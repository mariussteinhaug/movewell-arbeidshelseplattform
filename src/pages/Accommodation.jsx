import React from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { createPageUrl } from "../utils";
import { ROLE, normalizeRole, hasRole, accessScopeFromUser } from "../components/access/role";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Loader2, Search, ChevronLeft, ChevronRight, Calendar as CalendarIcon, User as UserIcon, Building2, AlertTriangle } from 'lucide-react';
import { format } from 'date-fns';
import { nb } from 'date-fns/locale';
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import CaseListItem from "../components/accommodation/CaseListItem";
import CaseDetail from "../components/accommodation/CaseDetail";

export default function Accommodation() {
  const { data: currentUser } = useQuery({
    queryKey: ['current-user'],
    queryFn: () => base44.auth.me()
  });
  const { data: accommodations = [], isLoading } = useQuery({
    queryKey: ['accommodations'],
    queryFn: () => base44.entities.Accommodation.list('-created_date', 500),
  });

  const [search, setSearch] = React.useState("");
  const [statusFilter, setStatusFilter] = React.useState("alle");
  const [includeArchived, setIncludeArchived] = React.useState(false);
  const [page, setPage] = React.useState(1);
  const pageSize = 20;

  const queryClient = useQueryClient();
  const updateCase = useMutation({
    mutationFn: ({ id, data }) => base44.entities.Accommodation.update(id, data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['accommodations'] }),
  });

  const filtered = React.useMemo(() => {
    const q = search.trim().toLowerCase();
    const role = normalizeRole(currentUser);
    const scope = accessScopeFromUser(currentUser);
    return (accommodations || []).filter((it) => {
      if (!includeArchived && it.archived) return false;
      if (it.organization_id !== scope.organization_id) return false;
      if (role === ROLE.MANAGER && scope.department_id && it.department_id !== scope.department_id) return false;
      const matchesStatus = statusFilter === "alle" || it.status === statusFilter;
      if (!q) return matchesStatus;
      const hay = [
        it.accommodation_type,
        it.employee_display_name,
        it.department_name,
        it.description,
        it.notes,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();
      return matchesStatus && hay.includes(q);
    });
  }, [accommodations, search, statusFilter, includeArchived, currentUser]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  React.useEffect(() => {
    if (page > totalPages) setPage(1);
  }, [filtered.length, page, totalPages]);

  const start = (page - 1) * pageSize;
  const paged = filtered.slice(start, start + pageSize);

  const [selectedCase, setSelectedCase] = React.useState(null);
  React.useEffect(() => {
    setSelectedCase(filtered[0] || null);
  }, [search, statusFilter, accommodations]);

  React.useEffect(() => {
    const role = normalizeRole(currentUser);
    if (currentUser && !hasRole(role, [ROLE.MANAGER, ROLE.HR])) {
      window.location.href = createPageUrl('Assessment');
    }
  }, [currentUser]);

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

      <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
        <div className="relative sm:w-80">
          <Search className="h-4 w-4 text-slate-400 absolute left-3 top-3" />
          <Input
            placeholder="Søk i saker..."
            className="pl-9"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
          />
        </div>
        <div className="flex items-center gap-2">
          <label className="text-sm text-slate-600">Status</label>
          <select
            className="h-9 rounded-md border border-slate-200 bg-white px-3 text-sm text-slate-700"
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value);
              setPage(1);
            }}
          >
            <option value="alle">Alle</option>
            <option value="planlagt">Planlagt</option>
            <option value="pagaende">Pågående</option>
            <option value="fullfort">Fullført</option>
          </select>
        </div>
        <div className="flex items-center gap-2">
          <label className="text-sm text-slate-600">Inkluder arkiv</label>
          <Switch checked={includeArchived} onCheckedChange={(v) => setIncludeArchived(!!v)} />
        </div>
      </div>

      {accommodations.length === 0 ? (
        <Card>
          <CardContent className="py-10">
            <p className="text-slate-600">Ingen saker ennå.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Liste */}
          <Card className="lg:col-span-1">
            <CardHeader>
              <CardTitle>Alle saker</CardTitle>
              <CardDescription>
                {filtered.length} treff • side {page} av {totalPages}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {paged.map((item) => (
                  <CaseListItem
                    key={item.id}
                    item={item}
                    selected={selectedCase?.id === item.id}
                    onClick={() => setSelectedCase(item)}
                  />
                ))}
              </div>

              {/* Paginering */}
              {totalPages > 1 && (
                <div className="flex items-center justify-between gap-2 mt-4">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    disabled={page === 1}
                  >
                    <ChevronLeft className="h-4 w-4 mr-1" /> Forrige
                  </Button>
                  <span className="text-xs text-slate-500">
                    Viser {(start + 1)}–{Math.min(start + pageSize, filtered.length)} av {filtered.length}
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                    disabled={page === totalPages}
                  >
                    Neste <ChevronRight className="h-4 w-4 ml-1" />
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Detalj */}
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle>{selectedCase ? (selectedCase.accommodation_type || 'Tilrettelegging') : 'Ingen sak valgt'}</CardTitle>
              <CardDescription>
                {selectedCase ? 'Detaljer' : 'Velg en sak fra listen for å se details'}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {selectedCase ? (
                <CaseDetail
                  item={selectedCase}
                  saving={updateCase.isPending}
                  onStatusChange={(newStatus) => {
                    if (!selectedCase) return;
                    updateCase.mutate({ id: selectedCase.id, data: { status: newStatus, updated_at: new Date().toISOString() } });
                    setSelectedCase({ ...selectedCase, status: newStatus });
                  }}
                  onArchiveToggle={(arch) => {
                    if (!selectedCase) return;
                    const data = { archived: arch, updated_at: new Date().toISOString() };
                    // If archiving, also mark as fullført automatically (optional UX)
                    if (arch && selectedCase.status !== 'fullfort') data.status = 'fullfort';
                    updateCase.mutate({ id: selectedCase.id, data });
                    setSelectedCase({ ...selectedCase, ...data });
                  }}
                />
              ) : (
                <div className="text-center py-16 text-slate-500">Velg en sak i listen</div>
              )}
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}