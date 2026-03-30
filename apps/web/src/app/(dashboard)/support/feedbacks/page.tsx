'use client';

import { useEffect, useMemo, useState } from 'react';
import type { ReactNode } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { api } from '@/lib/api-client';

interface SupportFeedbackRow {
  id: string;
  subject: string;
  category: string;
  priority: string;
  message: string;
  contactEmail?: string | null;
  status: string;
  createdAt: string;
  user?: {
    id: string;
    fullName: string;
    email: string;
    role: string;
  };
}

export default function SupportFeedbacksPage() {
  const [rows, setRows] = useState<SupportFeedbackRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('all');
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  const loadRows = async () => {
    setLoading(true);
    try {
      const query = statusFilter === 'all' ? '' : `?status=${encodeURIComponent(statusFilter)}`;
      const res = await api.get<SupportFeedbackRow[]>(`/support-feedback${query}`);
      setRows(Array.isArray(res) ? res : []);
    } catch {
      setRows([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadRows();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [statusFilter]);

  const counters = useMemo(() => {
    const result = { total: rows.length, new: 0, in_progress: 0, resolved: 0 };
    for (const row of rows) {
      if (row.status === 'new') result.new += 1;
      else if (row.status === 'in_progress') result.in_progress += 1;
      else if (row.status === 'resolved') result.resolved += 1;
    }
    return result;
  }, [rows]);

  const updateStatus = async (id: string, status: string) => {
    setUpdatingId(id);
    try {
      await api.patch<{ id: string; status: string }>(`/support-feedback/${id}/status`, { status });
      setRows((prev) => prev.map((r) => (r.id === id ? { ...r, status } : r)));
    } finally {
      setUpdatingId(null);
    }
  };

  let content: ReactNode;
  if (loading) {
    content = <p className="text-slate-500">Chargement des commentaires...</p>;
  } else if (rows.length === 0) {
    content = <p className="text-slate-500">Aucun commentaire pour le filtre selectionne.</p>;
  } else {
    content = rows.map((row) => (
      <div key={row.id} className="rounded-lg border border-slate-200 p-4">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="font-semibold text-slate-900">{row.subject}</p>
            <p className="text-xs text-slate-500">
              {new Date(row.createdAt).toLocaleString()} • {row.user?.fullName ?? 'Utilisateur'} (
              {row.user?.role ?? 'n/a'})
            </p>
          </div>
          <div className="flex items-center gap-2">
            <span className="rounded bg-slate-100 px-2 py-1 text-xs font-medium text-slate-700">
              {row.category}
            </span>
            <span className="rounded bg-amber-100 px-2 py-1 text-xs font-medium text-amber-800">
              {row.priority}
            </span>
            <select
              value={row.status}
              onChange={(e) => void updateStatus(row.id, e.target.value)}
              disabled={updatingId === row.id}
              className="rounded border border-slate-300 px-2 py-1 text-xs"
            >
              <option value="new">new</option>
              <option value="in_progress">in_progress</option>
              <option value="resolved">resolved</option>
            </select>
          </div>
        </div>
        <p className="mt-3 whitespace-pre-line text-sm text-slate-700">{row.message}</p>
        <p className="mt-2 text-xs text-slate-500">
          Contact: {row.contactEmail || row.user?.email || 'non fourni'}
        </p>
      </div>
    ));
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Feedback etudiant</h1>
        <p className="text-slate-600">
          Liste des commentaires envoyes via la page Aide pour ameliorer la plateforme.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-slate-500">Total</CardTitle>
          </CardHeader>
          <CardContent className="text-2xl font-bold">{counters.total}</CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-slate-500">Nouveaux</CardTitle>
          </CardHeader>
          <CardContent className="text-2xl font-bold text-blue-700">{counters.new}</CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-slate-500">En cours</CardTitle>
          </CardHeader>
          <CardContent className="text-2xl font-bold text-amber-700">
            {counters.in_progress}
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-slate-500">Resolus</CardTitle>
          </CardHeader>
          <CardContent className="text-2xl font-bold text-emerald-700">
            {counters.resolved}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between gap-4">
          <CardTitle>Commentaires support</CardTitle>
          <div className="flex items-center gap-2">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="rounded-md border border-slate-300 px-3 py-2 text-sm"
            >
              <option value="all">Tous</option>
              <option value="new">Nouveaux</option>
              <option value="in_progress">En cours</option>
              <option value="resolved">Resolus</option>
            </select>
            <Button variant="outline" onClick={() => void loadRows()}>
              Actualiser
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">{content}</CardContent>
      </Card>
    </div>
  );
}
