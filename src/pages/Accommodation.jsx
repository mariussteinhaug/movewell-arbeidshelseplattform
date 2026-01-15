import React from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { ROLE } from "../components/access/role";
import { useRequireRoles } from "../components/access/guard";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Loader2, Search, ChevronLeft, ChevronRight } from 'lucide-react';
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import CaseListItem from "../components/accommodation/CaseListItem";
import CaseDetail from "../components/accommodation/CaseDetail";

// Define constants to avoid magic strings
const STATUS = {
  ALL: "alle",
  PLANNED: "planlagt",
  ONGOING: "pagaende",
  COMPLETED: "fullfort",
};

export default function Accommodation() {
  const { user: currentUser, role, isLoading: authLoading, scope } = useRequireRoles([ROLE.MANAGER, ROLE.HR], 'Assessment');
  
  const { data: accommodations = [], isLoading } = useQuery({
    queryKey: ['accommodations'],
    queryFn: () => base44.entities.Accommodation.list('-created_date', 500),
    enabled: !authLoading,
  });

  const [search, setSearch] = React.useState("");
  const [statusFilter, setStatusFilter] = React.useState(STATUS.ALL);
  const [includeArchived, setIncludeArchived] = React.useState(false);
  const [page, setPage] = React.useState(1);
  const [selectedCase, setSelectedCase] = React.useState(null);
  
  const pageSize = 20;
  const queryClient = useQueryClient();

  // Optimistic update with error rollback
  const updateCase = useMutation({
    mutationFn: ({ id, data }) => base44.entities.Accommodation.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['accommodations'] });
    },
    onError: (error, variables, context) => {
      console.error("Update failed:", error);
      // Optional: Add toast notification here
      // Rollback selection if it's the same case
      if (selectedCase?.id === variables.id && context?.previousCase) {
        setSelectedCase(context.previousCase);
      }
    },
    onMutate: async (variables) => {
      // Capture current state for rollback
      return { previousCase: selectedCase };
    }
  });

  // Filter Logic
  const filtered = React.useMemo(() => {
    const q = search.trim().toLowerCase();
    
    return (accommodations || []).filter((it) => {
      if (!includeArchived && it.archived) return false;
      if (it.organization_id !== scope?.organization_id) return false;

      // Manager sees only their departments
      if (role === ROLE.MANAGER) {
        const deptIds = scope?.department_ids || [];
        // Strict null check safety
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
  }, [accommodations, search, statusFilter, includeArchived, role, scope]);

  // Stable Selection Effect
  React.useEffect(() => {
    // 1. If we have no items, clear selection
    if (filtered.length === 0) {
      setSelectedCase(null);
      return;
    }

    // 2. If no selection is made yet, or the current selection is no longer visible in the filtered list
    // (e.g. user searched for something else), select the first item.
    const isSelectedVisible = selectedCase && filtered.some((f) => f.id === selectedCase.id);
    
    if (!selectedCase || !isSelectedVisible) {
      setSelectedCase(filtered[0]);
    }
    // Note: We intentionally DO NOT update if the selected case IS still visible.
    // This allows background data refreshes without resetting the user's view.
  }, [filtered, selectedCase]);

  // Pagination bounds check
  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  
  React.useEffect(() => {
    if (page > totalPages) setPage(1);
  }, [totalPages, page]);

  const start = (page - 1) * pageSize;
  const paged = filtered.slice(start, start + pageSize);

  if (authLoading || isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-emerald-600" />
      </div>
    );
  }

  // Handlers
  const handleStatusChange = (newStatus) => {
    if (!selectedCase) return;
    const previousCase = { ...selectedCase };
    
    // Optimistic Update
    setSelectedCase({ ...selectedCase, status: newStatus });
    
    updateCase.mutate(
      { id: selectedCase.id, data: { status: newStatus, updated_at: new Date().toISOString() } },
      {
        onError: () => setSelectedCase(previousCase) // Rollback
      }
    );
  };

  const handleArchiveToggle = (arch) => {
    if (!selectedCase) return;
    const previousCase = { ...selectedCase };

    const data = { 
        archived: arch, 
        updated_at: new Date().toISOString() 
    };
    
    // Auto-complete logic when archiving
    if (arch && selectedCase.status !== STATUS.COMPLETED) {
        data.status = STATUS.COMPLETED;
    }

    // Optimistic Update
    setSelectedCase({ ...selectedCase, ...data });

    updateCase.mutate(
      { id: selectedCase.id, data },
      {
        onError: () => setSelectedCase(previousCase) // Rollback
      }
    );
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold text-slate-900">Tilrettelegging</h1>
        <p className="text-slate-500 mt-1">Saker opprettes fra Mine meldinger og vises her.</p>
      </div>

      <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
        <div className="relative sm:w-80">
          <Search className="h-4 w-4 text-slate-400 absolute left-3 top-3" />
          <label htmlFor="search-cases" className="sr-only">Søk i saker</label>
          <Input
            id="search-cases"
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
          <label htmlFor="status-filter" className="text-sm text-slate-600">Status</label>
          <select
            id="status-filter"
            className="h-9 rounded-md border border-slate-200 bg-white px-3 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-500"
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value);
              setPage(1);
            }}
          >
            <option value={STATUS.ALL}>Alle</option>
            <option value={STATUS.PLANNED}>Planlagt</option>
            <option value={STATUS.ONGOING}>Pågående</option>
            <option value={STATUS.COMPLETED}>Fullført</option>
          </select>
        </div>

        <div className="flex items-center gap-2">
          <label htmlFor="archive-switch" className="text-sm text-slate-600 cursor-pointer">Inkluder arkiv</label>
          <Switch 
            id="archive-switch"
            checked={includeArchived} 
            onCheckedChange={(v) => setIncludeArchived(!!v)} 
          />
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
          {/* List View */}
          <Card className="lg:col-span-1 flex flex-col h-[calc(100vh-200px)] lg:h-[800px]">
            <CardHeader className="flex-none">
              <CardTitle>Alle saker</CardTitle>
              <CardDescription>
                {filtered.length} treff • side {page} av {totalPages}
              </CardDescription>
            </CardHeader>
            <CardContent className="flex-1 overflow-hidden flex flex-col">
              <div className="flex-1 overflow-y-auto space-y-2 pr-2">
                {paged.map((item) => (
                  <CaseListItem
                    key={item.id}
                    item={item}
                    selected={selectedCase?.id === item.id}
                    onClick={() => setSelectedCase(item)}
                  />
                ))}
                {paged.length === 0 && (
                    <div className="text-sm text-slate-500 text-center py-4">Ingen treff på dette søket.</div>
                )}
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex items-center justify-between gap-2 mt-4 pt-2 border-t border-slate-100 flex-none">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    disabled={page === 1}
                  >
                    <ChevronLeft className="h-4 w-4 mr-1" /> Forrige
                  </Button>
                  <span className="text-xs text-slate-500">
                    {start + 1}–{Math.min(start + pageSize, filtered.length)} av {filtered.length}
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

          {/* Detail View */}
          <Card className="lg:col-span-2 h-[calc(100vh-200px)] lg:h-[800px] overflow-hidden flex flex-col">
            <CardHeader className="flex-none border-b border-slate-100 bg-slate-50/50">
              <CardTitle>{selectedCase ? (selectedCase.accommodation_type || 'Tilrettelegging') : 'Ingen sak valgt'}</CardTitle>
              <CardDescription>
                {selectedCase ? (
                    <span className="flex items-center gap-2">
                         Detaljer for sak #{selectedCase.id.slice(0,8)}
                    </span>
                ) : 'Velg en sak fra listen for å se detaljer'}
              </CardDescription>
            </CardHeader>
            <CardContent className="flex-1 overflow-y-auto p-0">
              {selectedCase ? (
                <CaseDetail
                  item={selectedCase}
                  saving={updateCase.isPending}
                  onStatusChange={handleStatusChange}
                  onArchiveToggle={handleArchiveToggle}
                />
              ) : (
                <div className="h-full flex flex-col items-center justify-center text-slate-400">
                    <Search className="h-12 w-12 mb-4 opacity-20" />
                    <p>Velg en sak i listen til venstre</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}