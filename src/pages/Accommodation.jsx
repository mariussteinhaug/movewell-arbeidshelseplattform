import React from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { ROLE } from "../components/access/role";
import { useRequireRoles } from "../components/access/guard";
import { Card, CardContent } from '@/components/ui/card';
import { Loader2, Search, ChevronLeft, ChevronRight, Filter } from 'lucide-react';
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import CaseListItem from "../components/accommodation/CaseListItem";
import CaseDetail from "../components/accommodation/CaseDetail";

const STATUS = {
  ALL: "alle",
  PLANNED: "planlagt",
  ONGOING: "pagaende",
  COMPLETED: "fullfort",
};

export default function Accommodation() {
  const { role, isLoading: authLoading, scope } = useRequireRoles([ROLE.MANAGER, ROLE.HR], 'Assessment');

  const { data: accommodations = [], isLoading } = useQuery({
    queryKey: ['accommodations'],
    queryFn: () => base44.entities.Accommodation.list('-created_date', 500),
    enabled: !authLoading,
  });

  const [search, setSearch] = React.useState("");
  const [statusFilter, setStatusFilter] = React.useState(STATUS.ALL);
  const [includeArchived, setIncludeArchived] = React.useState(false);
  const [page, setPage] = React.useState(1);
  const pageSize = 20;

  const queryClient = useQueryClient();
  const [selectedCase, setSelectedCase] = React.useState(null);

  const updateCase = useMutation({
    mutationFn: ({ id, data }) => base44.entities.Accommodation.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['accommodations'] });
    },
    onError: (error, variables, context) => {
      console.error("Update failed", error);
      // Rollback if needed
      if (selectedCase?.id === variables.id && context?.previousCase) {
        setSelectedCase(context.previousCase);
      }
    },
    onMutate: async (variables) => {
      return { previousCase: selectedCase };
    }
  });

  const filtered = React.useMemo(() => {
    if (authLoading || isLoading) return [];
    const q = search.trim().toLowerCase();

    return (accommodations || []).filter((it) => {
      if (!includeArchived && it.archived) return false;
      if (it.organization_id !== scope?.organization_id) return false;

      // Manager sees only their departments
      if (role === ROLE.MANAGER) {
        const deptIds = scope?.department_ids || [];
        if (!deptIds.includes(it.department_id) && scope?.department_id !== it.department_id) return false;
      }

      const matchesStatus = statusFilter === STATUS.ALL || it.status === statusFilter;
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
  }, [accommodations, search, statusFilter, includeArchived, role, scope, authLoading, isLoading]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));

  // Stable Selection Logic
  React.useEffect(() => {
    if (authLoading || isLoading) return;
    // If empty list, clear selection
    if (filtered.length === 0) {
      setSelectedCase(null);
      return;
    }
    // If no selection or selection is gone from list (e.g. filtered out), select first
    const isSelectedVisible = selectedCase && filtered.some(f => f.id === selectedCase.id);
    if (!selectedCase || !isSelectedVisible) {
      setSelectedCase(filtered[0]);
    }
  }, [filtered, selectedCase, authLoading, isLoading]);

  React.useEffect(() => {
    if (page > totalPages) setPage(1);
  }, [filtered.length, page, totalPages]);

  const start = (page - 1) * pageSize;
  const paged = filtered.slice(start, start + pageSize);

  const handleStatusChange = (newStatus) => {
    if (!selectedCase) return;
    const previous = { ...selectedCase };
    setSelectedCase({ ...selectedCase, status: newStatus }); // Optimistic
    updateCase.mutate({ id: selectedCase.id, data: { status: newStatus, updated_at: new Date().toISOString() } }, {
      onError: () => setSelectedCase(previous)
    });
  };

  const handleArchiveToggle = (arch) => {
    if (!selectedCase) return;
    const previous = { ...selectedCase };
    const data = { archived: arch, updated_at: new Date().toISOString() };
    if (arch && selectedCase.status !== STATUS.COMPLETED) {
      data.status = STATUS.COMPLETED;
    }
    setSelectedCase({ ...selectedCase, ...data }); // Optimistic
    updateCase.mutate({ id: selectedCase.id, data }, {
      onError: () => setSelectedCase(previous)
    });
  };

  if (authLoading || isLoading) {
    return (
      <div className="flex h-[80vh] w-full items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-10 w-10 animate-spin text-emerald-600" />
          <p className="text-slate-500 text-sm animate-pulse">Laster saker...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      {/* Header & Filter Bar */}
      <div className="flex flex-col gap-4 flex-none">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Tilrettelegging</h1>
            <p className="text-slate-500 text-sm mt-1">Administrer og følg opp tilretteleggingssaker.</p>
          </div>
          {/* Stats or Actions could go here */}
        </div>

        <div className="flex flex-col sm:flex-row gap-3 p-1 bg-white rounded-xl border border-slate-200 shadow-sm sm:items-center">
          <div className="relative flex-1">
            <Search className="h-4 w-4 text-slate-400 absolute left-3 top-3" />
            <Input
              placeholder="Søk etter ansatt, avdeling eller type..."
              className="pl-9 border-0 bg-transparent focus-visible:ring-0 focus-visible:ring-offset-0 placeholder:text-slate-400"
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
            />
          </div>

          <div className="h-6 w-px bg-slate-200 hidden sm:block" />

          <div className="flex items-center gap-3 px-2 flex-none overflow-x-auto pb-2 sm:pb-0">
            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4 text-slate-400" />
              <Select value={statusFilter} onValueChange={(v) => { setStatusFilter(v); setPage(1); }}>
                <SelectTrigger className="w-[140px] border-0 bg-transparent focus:ring-0 h-9 text-slate-600 font-medium">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={STATUS.ALL}>Alle statuser</SelectItem>
                  <SelectItem value={STATUS.PLANNED}>Planlagt</SelectItem>
                  <SelectItem value={STATUS.ONGOING}>Pågående</SelectItem>
                  <SelectItem value={STATUS.COMPLETED}>Fullført</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center gap-2 border-l border-slate-200 pl-3">
              <Label htmlFor="archive" className="text-sm text-slate-600 cursor-pointer whitespace-nowrap">Arkiv</Label>
              <Switch
                id="archive"
                checked={includeArchived}
                onCheckedChange={(v) => setIncludeArchived(!!v)}
                className="data-[state=checked]:bg-emerald-600"
              />
            </div>
          </div>
        </div>
      </div>

      {accommodations.length === 0 ? (
        <Card className="flex-1 flex items-center justify-center bg-slate-50/50 border-dashed">
          <CardContent className="flex flex-col items-center text-center py-12">
            <div className="h-12 w-12 bg-white rounded-full shadow-sm flex items-center justify-center mb-4">
              <Search className="h-6 w-6 text-slate-300" />
            </div>
            <h3 className="text-lg font-medium text-slate-900">Ingen saker funnet</h3>
            <p className="text-slate-500 mt-1 max-w-sm">Det er ingen tilretteleggingssaker registrert i systemet ennå.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 flex-1 min-h-0">
          {/* List Panel */}
          <Card className="lg:col-span-4 flex flex-col h-[600px] lg:h-[800px] border-slate-200 shadow-sm overflow-hidden bg-white sticky top-6">
            <div className="p-4 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between flex-none">
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                Saker ({filtered.length})
              </p>
              {totalPages > 1 && <span className="text-xs text-slate-400">Side {page} av {totalPages}</span>}
            </div>

            <div className="flex-1 overflow-y-auto p-2 space-y-2">
              {paged.length > 0 ? (
                paged.map((item) => (
                  <CaseListItem
                    key={item.id}
                    item={item}
                    selected={selectedCase?.id === item.id}
                    onClick={() => setSelectedCase(item)}
                  />
                ))
              ) : (
                <div className="text-center py-12 px-4">
                  <p className="text-sm text-slate-500">Ingen saker matcher søket ditt.</p>
                  <Button variant="link" onClick={() => { setSearch(""); setStatusFilter(STATUS.ALL); }} className="text-emerald-600 h-auto p-0 mt-2">
                    Nullstill filter
                  </Button>
                </div>
              )}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="p-3 border-t border-slate-100 flex items-center justify-between bg-slate-50/30 flex-none">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="h-8 w-8 p-0"
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <span className="text-xs font-medium text-slate-600">
                  {start + 1} - {Math.min(start + pageSize, filtered.length)}
                </span>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
                  className="h-8 w-8 p-0"
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            )}
          </Card>

          {/* Detail Panel */}
          <Card className="lg:col-span-8 border-slate-200 shadow-xl shadow-slate-200/40 bg-white">
            {selectedCase ? (
              <>
                <div className="border-b border-slate-100 p-6 pb-4 bg-slate-50/30">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <h2 className="text-xl font-semibold text-slate-900 leading-tight">
                        {selectedCase.accommodation_type || 'Uten tittel'}
                      </h2>
                      <p className="text-sm text-slate-500 mt-1 flex items-center gap-2">
                        ID: <span className="font-mono text-xs bg-slate-100 px-1.5 py-0.5 rounded text-slate-600">{selectedCase.id.slice(0, 8)}</span>
                      </p>
                    </div>
                  </div>
                </div>
                <div className="p-6">
                  <CaseDetail
                    item={selectedCase}
                    saving={updateCase.isPending}
                    onStatusChange={handleStatusChange}
                    onArchiveToggle={handleArchiveToggle}
                  />
                </div>
              </>
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-slate-400 bg-slate-50/50">
                <div className="h-16 w-16 bg-slate-100 rounded-full flex items-center justify-center mb-4">
                  <Search className="h-8 w-8 text-slate-300" />
                </div>
                <p className="text-lg font-medium text-slate-600">Ingen sak valgt</p>
                <p className="text-sm">Velg en sak fra listen for å se detaljer</p>
              </div>
            )}
          </Card>
        </div>
      )}
    </div>
  );
}